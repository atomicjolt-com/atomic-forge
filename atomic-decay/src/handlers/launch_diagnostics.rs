use std::time::Instant;

use axum::http::HeaderMap;
use std::collections::BTreeMap;

/// Build the `httpContext` block for `LAUNCH_SETTINGS`. Produces a JSON
/// object with host, scheme, method, path, user agent, client IP, the
/// full header map (lowercased keys), and parsed cookies.
///
/// This is intentionally un-redacted — the page it feeds is served only
/// to the user who just authenticated, viewing their own session.
pub fn build_http_context(
  headers: &HeaderMap,
  method: &str,
  path: &str,
) -> serde_json::Value {
  let header_str = |name: &str| -> Option<String> {
    headers
      .get(name)
      .and_then(|v| v.to_str().ok())
      .map(str::to_string)
  };

  let host = header_str("host").unwrap_or_default();
  let scheme = header_str("x-forwarded-proto").unwrap_or_else(|| "https".to_string());
  let user_agent = header_str("user-agent");

  // X-Forwarded-For is a comma-separated list; the original client is the
  // first entry. Everything after is intermediate proxies (e.g. cloudflared).
  let client_ip = header_str("x-forwarded-for").map(|v| {
    v.split(',')
      .next()
      .map(|s| s.trim().to_string())
      .unwrap_or(v)
  });

  // Headers: lowercased names -> string values. BTreeMap for stable
  // ordering in the rendered diagnostic table.
  let mut header_map: BTreeMap<String, String> = BTreeMap::new();
  for (name, value) in headers.iter() {
    if let Ok(v) = value.to_str() {
      header_map.insert(name.as_str().to_lowercase(), v.to_string());
    }
  }

  // Cookies: parsed from the Cookie header.
  let mut cookie_map: BTreeMap<String, String> = BTreeMap::new();
  if let Some(cookie_header) = header_str("cookie") {
    for pair in cookie_header.split(';') {
      let trimmed = pair.trim();
      if trimmed.is_empty() {
        continue;
      }
      match trimmed.split_once('=') {
        Some((k, v)) => {
          cookie_map.insert(k.trim().to_string(), v.trim().to_string());
        }
        None => {
          cookie_map.insert(trimmed.to_string(), String::new());
        }
      }
    }
  }

  serde_json::json!({
    "host": host,
    "scheme": scheme,
    "method": method,
    "path": path,
    "userAgent": user_agent,
    "clientIp": client_ip,
    "headers": header_map,
    "cookies": cookie_map,
  })
}

/// Records wall-clock checkpoints across the LTI launch pipeline so the
/// diagnostic page can show where time was spent.
pub struct LaunchTimings {
  start: Instant,
  last: Instant,
  spans: Vec<(&'static str, u128)>,
}

impl LaunchTimings {
  pub fn start() -> Self {
    let now = Instant::now();
    Self {
      start: now,
      last: now,
      spans: Vec::with_capacity(5),
    }
  }

  /// Record the milliseconds elapsed since the previous checkpoint (or
  /// since `start()` for the first checkpoint).
  pub fn checkpoint(&mut self, label: &'static str) {
    let now = Instant::now();
    let ms = now.duration_since(self.last).as_millis();
    self.spans.push((label, ms));
    self.last = now;
  }

  /// Serialize checkpoints into a `{label: ms, ..., "total": ms}` JSON map.
  pub fn to_json(&self) -> serde_json::Value {
    let mut map = serde_json::Map::new();
    for (label, ms) in &self.spans {
      map.insert((*label).to_string(), serde_json::json!(ms));
    }
    let total = self.start.elapsed().as_millis();
    map.insert("total".to_string(), serde_json::json!(total));
    serde_json::Value::Object(map)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn timings_record_checkpoints_in_order_and_total_is_nonzero() {
    let mut t = LaunchTimings::start();
    std::thread::sleep(std::time::Duration::from_millis(2));
    t.checkpoint("phase_a");
    std::thread::sleep(std::time::Duration::from_millis(2));
    t.checkpoint("phase_b");

    let json = t.to_json();
    let obj = json.as_object().expect("timings json is an object");

    assert!(obj.contains_key("phase_a"), "phase_a missing: {json}");
    assert!(obj.contains_key("phase_b"), "phase_b missing: {json}");
    assert!(obj.contains_key("total"), "total missing: {json}");

    let total = obj.get("total").and_then(|v| v.as_u64()).unwrap();
    let a = obj.get("phase_a").and_then(|v| v.as_u64()).unwrap();
    let b = obj.get("phase_b").and_then(|v| v.as_u64()).unwrap();

    assert!(a >= 1, "phase_a should be >=1ms, got {a}");
    assert!(b >= 1, "phase_b should be >=1ms, got {b}");
    assert!(total >= a + b, "total ({total}) should be >= a+b ({})", a + b);
  }

  #[test]
  fn http_context_extracts_headers_cookies_host_and_ua() {
    use axum::http::HeaderMap;
    use axum::http::HeaderValue;

    let mut headers = HeaderMap::new();
    headers.insert("host", HeaderValue::from_static("decay.example.com"));
    headers.insert("user-agent", HeaderValue::from_static("UA/1.0"));
    headers.insert("x-forwarded-proto", HeaderValue::from_static("https"));
    headers.insert("x-forwarded-for", HeaderValue::from_static("203.0.113.7, 10.0.0.1"));
    headers.insert("cookie", HeaderValue::from_static("a=1; b=two; c=three"));

    let ctx = build_http_context(&headers, "POST", "/lti/launch");
    let obj = ctx.as_object().unwrap();

    assert_eq!(obj["host"].as_str().unwrap(), "decay.example.com");
    assert_eq!(obj["scheme"].as_str().unwrap(), "https");
    assert_eq!(obj["method"].as_str().unwrap(), "POST");
    assert_eq!(obj["path"].as_str().unwrap(), "/lti/launch");
    assert_eq!(obj["userAgent"].as_str().unwrap(), "UA/1.0");
    assert_eq!(obj["clientIp"].as_str().unwrap(), "203.0.113.7");

    let headers_map = obj["headers"].as_object().unwrap();
    assert!(headers_map.contains_key("host"));
    assert!(headers_map.contains_key("cookie"));

    let cookies = obj["cookies"].as_object().unwrap();
    assert_eq!(cookies["a"].as_str().unwrap(), "1");
    assert_eq!(cookies["b"].as_str().unwrap(), "two");
    assert_eq!(cookies["c"].as_str().unwrap(), "three");
  }

  #[test]
  fn http_context_handles_missing_optional_headers() {
    use axum::http::HeaderMap;

    let headers = HeaderMap::new();
    let ctx = build_http_context(&headers, "POST", "/lti/launch");
    let obj = ctx.as_object().unwrap();

    assert_eq!(obj["host"].as_str().unwrap(), "");
    assert_eq!(obj["scheme"].as_str().unwrap(), "https");
    assert!(obj["userAgent"].is_null());
    assert!(obj["clientIp"].is_null());
    assert!(obj["cookies"].as_object().unwrap().is_empty());
  }
}
