use std::time::Instant;

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
}
