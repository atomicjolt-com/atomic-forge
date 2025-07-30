#[cfg(test)]
pub mod tests {
  use crate::handlers::assets::get_assets;
  use crate::AppState;
  use atomic_lti_test::helpers::{MockKeyStore, JWK_PASSPHRASE};
  use sqlx::postgres::PgPool;
  use std::sync::Arc;

  pub struct TestDb {
    pool: PgPool,
  }

  impl TestDb {
    pub async fn new() -> Self {
      let database_url = std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:password@localhost:5433/atomic_decay_test".to_string()
      });

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
      // Delete in order respecting foreign key constraints
      let tables = vec![
        "lti_registrations", // Has FK to lti_platforms
        "lti_platforms",
        "keys",
        "oidc_states",
      ];

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

  // Returns app state
  pub async fn get_app_state() -> AppState {
    let assets = get_assets();
    let key_store = MockKeyStore::default();
    let arc_key_store = Arc::new(key_store);
    let pool = setup_test_db().await;

    AppState {
      pool: pool.clone(),
      jwk_passphrase: JWK_PASSPHRASE.to_string(),
      assets: assets.clone(),
      key_store: arc_key_store,
    }
  }
}
