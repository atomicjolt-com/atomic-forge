use sqlx::postgres::PgPool;

pub struct TestDb {
  pool: PgPool,
}

impl TestDb {
  pub async fn new() -> Self {
    let database_url = std::env::var("TEST_DATABASE_URL")
      .unwrap_or_else(|_| "postgres://postgres:password@localhost:5433/atomic_decay_test".to_string());
    
    let pool = PgPool::connect(&database_url)
      .await
      .expect("Failed to connect to test database");
    
    sqlx::migrate!("./migrations")
      .run(&pool)
      .await
      .expect("Failed to run migrations");
    
    Self { pool }
  }
  
  pub fn pool(&self) -> &PgPool {
    &self.pool
  }
  
  pub async fn cleanup(&self) {
    let tables = vec!["keys", "applications", "platform_registrations", "user_auth_attempts"];
    
    for table in tables {
      sqlx::query(&format!("DELETE FROM {table}"))
        .execute(&self.pool)
        .await
        .ok();
    }
  }
}

pub async fn setup_test_db() -> PgPool {
  let db = TestDb::new().await;
  db.cleanup().await;
  db.pool().clone()
}

#[cfg(test)]
pub mod test_data {
  pub const TEST_KEY_PEM: &str = "-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF5M0HH2M0HdNPq/qA3vLBiDzIdEW
xa8TKY3UStpvJPKR1/5YQRl5FH2q6TxCN3JNMZpQ6fPQPj5f9dwJqrxBgXLR3FWF
tV5sohRjDA60xO3CqBr9k0pdAApiXD5gfPOeiCJKaLyX4h8Y7desX2j3ponAe7G5
xVUW3lTnqu6Cp5z0hfbL4q+n9KkxR0zzRLfvG4k8HbsVQ9DNoKNBSvchVKI6pI8C
yqMSvKuXNYOPI3kLaQoJHWL0RY7yKhCGPmv8WEDL9xFaLa+vJK2gu5bJNxARL+JL
zt9AFMvLvBGGPa4RdBa2LNXpVjgqk1TdP7pJ4QIDAQABAoIBAG7B1IKqXLW5fdeL
rLKkF7YcQFcP1y7HMcxZGKlPmL1SLqBkjZkKPL5MWt5C9FKvj8sCF4BI6pFKHK+m
LNtZ0LOcjDJJQBCJW5vPU7dIU4LSr3mfIFvFaHWNMYLQq7U2ydlC4WJBqpDr8kyA
-----END RSA PRIVATE KEY-----";
  
  pub const TEST_KEY_PEM_2: &str = "-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAyJwqVLjKZQc1f2xfn/ygWyF5M0HH2M0HdNPq/qA3vLBiDzId
BWxa8TKY3UStpvJPKR1/5YQRl5FH2q6TxCN3JNMZpQ6fPQPj5f9dwJqrxBgXLR3F
WFtV5sohRjDA60xO3CqBr9k0pdAApiXD5gfPOeiCJKaLyX4h8Y7desX2j3ponAe7
-----END RSA PRIVATE KEY-----";
}