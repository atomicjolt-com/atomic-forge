use axum::extract::Request;
use std::collections::HashMap;

pub fn get_host_from_request(req: &Request) -> String {
  // Try to get host from headers in order of preference
  let headers = req.headers();

  // First try X-Forwarded-Host (for reverse proxies)
  if let Some(host) = headers.get("x-forwarded-host") {
    if let Ok(host_str) = host.to_str() {
      return host_str.to_string();
    }
  }

  // Then try Host header
  if let Some(host) = headers.get("host") {
    if let Ok(host_str) = host.to_str() {
      return host_str.to_string();
    }
  }

  // Fallback to localhost
  "localhost".to_string()
}

pub fn get_scheme_from_request(req: &Request) -> String {
  let headers = req.headers();

  // Check X-Forwarded-Proto first (for reverse proxies)
  if let Some(proto) = headers.get("x-forwarded-proto") {
    if let Ok(proto_str) = proto.to_str() {
      return proto_str.to_string();
    }
  }

  // Check X-Forwarded-Ssl
  if let Some(ssl) = headers.get("x-forwarded-ssl") {
    if let Ok(ssl_str) = ssl.to_str() {
      if ssl_str.to_lowercase() == "on" {
        return "https".to_string();
      }
    }
  }

  // Check if request came over TLS
  if req.uri().scheme_str() == Some("https") {
    return "https".to_string();
  }

  // Default to HTTP
  "http".to_string()
}

pub fn build_absolute_url(req: &Request, path: &str) -> String {
  let scheme = get_scheme_from_request(req);
  let host = get_host_from_request(req);
  let clean_path = if path.starts_with('/') {
    path.to_string()
  } else {
    format!("/{}", path)
  };

  format!("{}://{}{}", scheme, host, clean_path)
}

pub fn build_base_url(req: &Request) -> String {
  let scheme = get_scheme_from_request(req);
  let host = get_host_from_request(req);

  format!("{}://{}", scheme, host)
}

pub fn parse_query_string(query: &str) -> HashMap<String, String> {
  let mut params = HashMap::new();

  for pair in query.split('&') {
    if let Some((key, value)) = pair.split_once('=') {
      let decoded_key = urlencoding::decode(key).unwrap_or_default();
      let decoded_value = urlencoding::decode(value).unwrap_or_default();
      params.insert(decoded_key.to_string(), decoded_value.to_string());
    } else if !pair.is_empty() {
      let decoded_key = urlencoding::decode(pair).unwrap_or_default();
      params.insert(decoded_key.to_string(), String::new());
    }
  }

  params
}

pub fn build_query_string(params: &HashMap<String, String>) -> String {
  if params.is_empty() {
    return String::new();
  }

  let mut query_parts = Vec::new();
  for (key, value) in params {
    if value.is_empty() {
      query_parts.push(urlencoding::encode(key).to_string());
    } else {
      query_parts.push(format!(
        "{}={}",
        urlencoding::encode(key),
        urlencoding::encode(value)
      ));
    }
  }

  format!("?{}", query_parts.join("&"))
}

pub fn append_query_params(url: &str, params: &HashMap<String, String>) -> String {
  if params.is_empty() {
    return url.to_string();
  }

  let query_string = build_query_string(params);

  if url.contains('?') {
    format!("{}&{}", url, &query_string[1..]) // Remove the '?' from query_string
  } else {
    format!("{}{}", url, query_string)
  }
}

pub fn extract_domain(url: &str) -> Option<String> {
  if let Ok(parsed) = url::Url::parse(url) {
    parsed.host_str().map(|h| h.to_string())
  } else {
    None
  }
}

pub fn is_secure_url(url: &str) -> bool {
  url.starts_with("https://")
}

pub fn validate_redirect_url(url: &str, allowed_domains: &[String]) -> bool {
  // Check if URL is HTTPS
  if !is_secure_url(url) {
    return false;
  }

  // Extract domain and check against allowed list
  if let Some(domain) = extract_domain(url) {
    allowed_domains
      .iter()
      .any(|allowed| domain == *allowed || domain.ends_with(&format!(".{}", allowed)))
  } else {
    false
  }
}

pub fn sanitize_redirect_url(url: &str) -> String {
  // Remove any potential XSS attempts
  url
    .chars()
    .filter(|c| c.is_ascii_alphanumeric() || "-._~:/?#[]@!$&'()*+,;=".contains(*c))
    .collect()
}

/// Returns the full URL of the request (Axum version)
/// Equivalent to atomic-lti-tool's full_url function for Actix
pub fn full_url(req: &Request) -> String {
  let scheme = get_scheme_from_request(req);
  let host = get_host_from_request(req);
  let path_and_query = req.uri().path_and_query().map_or("", |pq| pq.as_str());
  format!("{}://{}{}", scheme, host, path_and_query)
}

pub fn build_oidc_auth_url(
  issuer: &str,
  client_id: &str,
  redirect_uri: &str,
  state: &str,
  nonce: &str,
  scope: &str,
  response_type: &str,
  response_mode: &str,
  login_hint: Option<&str>,
  lti_message_hint: Option<&str>,
) -> String {
  let mut params = HashMap::new();

  params.insert("client_id".to_string(), client_id.to_string());
  params.insert("redirect_uri".to_string(), redirect_uri.to_string());
  params.insert("state".to_string(), state.to_string());
  params.insert("nonce".to_string(), nonce.to_string());
  params.insert("scope".to_string(), scope.to_string());
  params.insert("response_type".to_string(), response_type.to_string());
  params.insert("response_mode".to_string(), response_mode.to_string());

  if let Some(hint) = login_hint {
    params.insert("login_hint".to_string(), hint.to_string());
  }

  if let Some(hint) = lti_message_hint {
    params.insert("lti_message_hint".to_string(), hint.to_string());
  }

  let auth_endpoint = format!("{}/auth", issuer.trim_end_matches('/'));
  append_query_params(&auth_endpoint, &params)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_query_string() {
    let query = "key1=value1&key2=value%20with%20spaces&key3=";
    let params = parse_query_string(query);

    assert_eq!(params.get("key1"), Some(&"value1".to_string()));
    assert_eq!(params.get("key2"), Some(&"value with spaces".to_string()));
    assert_eq!(params.get("key3"), Some(&"".to_string()));
  }

  #[test]
  fn test_build_query_string() {
    let mut params = HashMap::new();
    params.insert("key1".to_string(), "value1".to_string());
    params.insert("key2".to_string(), "value with spaces".to_string());
    params.insert("key3".to_string(), "".to_string());

    let query = build_query_string(&params);

    assert!(query.starts_with('?'));
    assert!(query.contains("key1=value1"));
    assert!(query.contains("key2=value%20with%20spaces"));
    assert!(query.contains("key3"));
  }

  #[test]
  fn test_append_query_params() {
    let mut params = HashMap::new();
    params.insert("new_param".to_string(), "new_value".to_string());

    let url_without_query = "https://example.com/path";
    let result = append_query_params(url_without_query, &params);
    assert_eq!(result, "https://example.com/path?new_param=new_value");

    let url_with_query = "https://example.com/path?existing=param";
    let result = append_query_params(url_with_query, &params);
    assert_eq!(
      result,
      "https://example.com/path?existing=param&new_param=new_value"
    );
  }

  #[test]
  fn test_extract_domain() {
    assert_eq!(
      extract_domain("https://example.com/path"),
      Some("example.com".to_string())
    );
    assert_eq!(
      extract_domain("https://sub.example.com/path"),
      Some("sub.example.com".to_string())
    );
    assert_eq!(extract_domain("invalid-url"), None);
  }

  #[test]
  fn test_is_secure_url() {
    assert!(is_secure_url("https://example.com"));
    assert!(!is_secure_url("http://example.com"));
    assert!(!is_secure_url("ftp://example.com"));
  }

  #[test]
  fn test_validate_redirect_url() {
    let allowed_domains = vec!["example.com".to_string(), "trusted.org".to_string()];

    assert!(validate_redirect_url(
      "https://example.com/path",
      &allowed_domains
    ));
    assert!(validate_redirect_url(
      "https://sub.example.com/path",
      &allowed_domains
    ));
    assert!(validate_redirect_url(
      "https://trusted.org/path",
      &allowed_domains
    ));
    assert!(!validate_redirect_url(
      "https://evil.com/path",
      &allowed_domains
    ));
    assert!(!validate_redirect_url(
      "http://example.com/path",
      &allowed_domains
    ));
  }

  #[test]
  fn test_build_oidc_auth_url() {
    let url = build_oidc_auth_url(
      "https://platform.example.com",
      "client123",
      "https://tool.example.com/redirect",
      "state123",
      "nonce123",
      "openid",
      "id_token",
      "form_post",
      Some("user@example.com"),
      Some("hint123"),
    );

    assert!(url.starts_with("https://platform.example.com/auth?"));
    assert!(url.contains("client_id=client123"));
    assert!(url.contains("redirect_uri=https%3A%2F%2Ftool.example.com%2Fredirect"));
    assert!(url.contains("state=state123"));
    assert!(url.contains("nonce=nonce123"));
    assert!(url.contains("login_hint=user%40example.com"));
    assert!(url.contains("lti_message_hint=hint123"));
  }
}
