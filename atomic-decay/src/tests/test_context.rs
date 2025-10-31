use std::sync::atomic::{AtomicU32, Ordering};
use uuid::Uuid;

// Global counter for unique test IDs
static TEST_COUNTER: AtomicU32 = AtomicU32::new(0);

/// Represents a unique test context that ensures test isolation
pub struct TestContext {
  pub test_id: String,
  pub test_prefix: String,
}

impl TestContext {
  /// Create a new test context with a unique identifier
  pub fn new(test_name: &str) -> Self {
    let counter = TEST_COUNTER.fetch_add(1, Ordering::SeqCst);
    let uuid_part = Uuid::new_v4()
      .to_string()
      .split('-')
      .next()
      .unwrap()
      .to_string();
    let test_id = format!(
      "{}_{}_{}_{}",
      test_name,
      std::process::id(),
      counter,
      uuid_part
    );
    let test_prefix = format!("test_{}_{}", counter, uuid_part);

    Self {
      test_id,
      test_prefix,
    }
  }

  /// Generate a unique key identifier for this test
  pub fn unique_key(&self, suffix: &str) -> String {
    format!("{}_{}", self.test_prefix, suffix)
  }

  /// Generate a unique state identifier for this test
  pub fn unique_state(&self) -> String {
    format!("state_{}", self.test_id)
  }

  /// Generate a unique nonce for this test
  pub fn unique_nonce(&self) -> String {
    format!("nonce_{}", self.test_id)
  }
}

/// Cleanup helper that tracks created resources for targeted cleanup
pub struct TestCleanup {
  pub key_ids: Vec<i64>,
  pub oidc_state_ids: Vec<i64>,
  pub platform_ids: Vec<i64>,
  pub registration_ids: Vec<i64>,
  pub user_ids: Vec<i64>,
  pub course_ids: Vec<i64>,
  pub tenant_ids: Vec<i64>,
}

impl TestCleanup {
  pub fn new() -> Self {
    Self {
      key_ids: Vec::new(),
      oidc_state_ids: Vec::new(),
      platform_ids: Vec::new(),
      registration_ids: Vec::new(),
      user_ids: Vec::new(),
      course_ids: Vec::new(),
      tenant_ids: Vec::new(),
    }
  }

  pub fn track_key(&mut self, id: i64) {
    self.key_ids.push(id);
  }

  pub fn track_oidc_state(&mut self, id: i64) {
    self.oidc_state_ids.push(id);
  }

  pub fn track_platform(&mut self, id: i64) {
    self.platform_ids.push(id);
  }

  pub fn track_registration(&mut self, id: i64) {
    self.registration_ids.push(id);
  }

  pub fn track_user(&mut self, id: i64) {
    self.user_ids.push(id);
  }

  pub fn track_course(&mut self, id: i64) {
    self.course_ids.push(id);
  }

  pub fn track_tenant(&mut self, id: i64) {
    self.tenant_ids.push(id);
  }

  /// Perform targeted cleanup of tracked resources
  /// Cleans in correct order respecting foreign keys
  pub async fn cleanup(&self, pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    // Clean up in reverse dependency order

    // Users first (they reference tenants)
    if !self.user_ids.is_empty() {
      let ids: Vec<String> = self.user_ids.iter().map(|id| id.to_string()).collect();
      let query = format!("DELETE FROM users WHERE id IN ({})", ids.join(","));
      sqlx::query(&query).execute(pool).await?;
    }

    // Courses (they reference tenants)
    if !self.course_ids.is_empty() {
      let ids: Vec<String> = self.course_ids.iter().map(|id| id.to_string()).collect();
      let query = format!("DELETE FROM courses WHERE id IN ({})", ids.join(","));
      sqlx::query(&query).execute(pool).await?;
    }

    // Tenants
    if !self.tenant_ids.is_empty() {
      let ids: Vec<String> = self.tenant_ids.iter().map(|id| id.to_string()).collect();
      let query = format!("DELETE FROM tenants WHERE id IN ({})", ids.join(","));
      sqlx::query(&query).execute(pool).await?;
    }

    // Registrations (they have FK to platforms)
    if !self.registration_ids.is_empty() {
      let ids: Vec<String> = self
        .registration_ids
        .iter()
        .map(|id| id.to_string())
        .collect();
      let query = format!(
        "DELETE FROM lti_registrations WHERE id IN ({})",
        ids.join(",")
      );
      sqlx::query(&query).execute(pool).await?;
    }

    // Platforms
    if !self.platform_ids.is_empty() {
      let ids: Vec<String> = self.platform_ids.iter().map(|id| id.to_string()).collect();
      let query = format!("DELETE FROM lti_platforms WHERE id IN ({})", ids.join(","));
      sqlx::query(&query).execute(pool).await?;
    }

    // Keys
    if !self.key_ids.is_empty() {
      let ids: Vec<String> = self.key_ids.iter().map(|id| id.to_string()).collect();
      let query = format!("DELETE FROM keys WHERE id IN ({})", ids.join(","));
      sqlx::query(&query).execute(pool).await?;
    }

    // OIDC states
    if !self.oidc_state_ids.is_empty() {
      let ids: Vec<String> = self
        .oidc_state_ids
        .iter()
        .map(|id| id.to_string())
        .collect();
      let query = format!("DELETE FROM oidc_states WHERE id IN ({})", ids.join(","));
      sqlx::query(&query).execute(pool).await?;
    }

    Ok(())
  }
}

/// Test guard that automatically cleans up on drop
pub struct TestGuard {
  pool: sqlx::PgPool,
  cleanup: TestCleanup,
  manual_cleanup_done: bool,
}

impl TestGuard {
  pub fn new(pool: sqlx::PgPool) -> Self {
    Self {
      pool,
      cleanup: TestCleanup::new(),
      manual_cleanup_done: false,
    }
  }

  pub fn track_key(&mut self, id: i64) {
    self.cleanup.track_key(id);
  }

  pub fn track_oidc_state(&mut self, id: i64) {
    self.cleanup.track_oidc_state(id);
  }

  pub fn track_platform(&mut self, id: i64) {
    self.cleanup.track_platform(id);
  }

  pub fn track_registration(&mut self, id: i64) {
    self.cleanup.track_registration(id);
  }

  pub fn track_user(&mut self, id: i64) {
    self.cleanup.track_user(id);
  }

  pub fn track_course(&mut self, id: i64) {
    self.cleanup.track_course(id);
  }

  pub fn track_tenant(&mut self, id: i64) {
    self.cleanup.track_tenant(id);
  }

  /// Manually trigger cleanup and wait for it to complete
  /// This ensures cleanup happens before the test ends
  pub async fn cleanup(mut self) -> Result<(), sqlx::Error> {
    self.manual_cleanup_done = true;
    self.cleanup.cleanup(&self.pool).await
  }

  /// Mark cleanup as done without actually performing it
  /// Useful when test already cleaned up all data (e.g., destroy_all)
  pub fn mark_cleanup_done(&mut self) {
    self.manual_cleanup_done = true;
  }
}

impl Drop for TestGuard {
  fn drop(&mut self) {
    // Only spawn async cleanup if manual cleanup wasn't done
    if !self.manual_cleanup_done {
      // Don't attempt cleanup if we're already panicking
      // This prevents "panic in destructor" errors
      if std::thread::panicking() {
        eprintln!("TestGuard: Skipping cleanup due to panic");
        return;
      }

      let pool = self.pool.clone();
      let cleanup = TestCleanup {
        key_ids: self.cleanup.key_ids.clone(),
        oidc_state_ids: self.cleanup.oidc_state_ids.clone(),
        platform_ids: self.cleanup.platform_ids.clone(),
        registration_ids: self.cleanup.registration_ids.clone(),
        user_ids: self.cleanup.user_ids.clone(),
        course_ids: self.cleanup.course_ids.clone(),
        tenant_ids: self.cleanup.tenant_ids.clone(),
      };

      // Try to get the current runtime handle
      if let Ok(handle) = tokio::runtime::Handle::try_current() {
        // Spawn the cleanup task instead of blocking
        // This avoids the "can't block_in_place on single-threaded runtime" error
        handle.spawn(async move {
          if let Err(e) = cleanup.cleanup(&pool).await {
            eprintln!("Failed to cleanup test data: {}", e);
          }
        });
      } else {
        // If no runtime is available, log a warning
        eprintln!("TestGuard: No runtime available for cleanup");
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_unique_context_generation() {
    let ctx1 = TestContext::new("test1");
    let ctx2 = TestContext::new("test1");

    // Even with same test name, contexts should be unique
    assert_ne!(ctx1.test_id, ctx2.test_id);
    assert_ne!(ctx1.test_prefix, ctx2.test_prefix);
  }

  #[test]
  fn test_unique_key_generation() {
    let ctx = TestContext::new("mytest");
    let key1 = ctx.unique_key("key1");
    let key2 = ctx.unique_key("key2");

    assert_ne!(key1, key2);
    assert!(key1.contains("key1"));
    assert!(key2.contains("key2"));
  }
}
