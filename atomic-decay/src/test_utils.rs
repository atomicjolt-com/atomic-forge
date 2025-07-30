// This module provides test utilities for both unit and integration tests
#[cfg(test)]
pub use crate::tests::helpers::test_helpers::*;

// For integration tests, we need to implement the utilities directly
#[cfg(not(test))]
pub mod test_helpers {
  use crate::handlers::assets::get_assets;
  use crate::AppState;
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

  // Mock key store implementation for tests
  use async_trait::async_trait;
  use atomic_lti::errors::SecureError;
  use atomic_lti::stores::key_store::KeyStore;
  use openssl::rsa::Rsa;
  use std::collections::HashMap;
  use uuid::Uuid;

  pub struct MockKeyStore {
    pub keys: HashMap<String, Rsa<openssl::pkey::Private>>,
  }

  impl Default for MockKeyStore {
    fn default() -> Self {
      let mut keys = HashMap::new();
      let kid = Uuid::new_v4().to_string();
      keys.insert(kid, Rsa::generate(2048).unwrap());
      Self { keys }
    }
  }

  #[async_trait]
  impl KeyStore for MockKeyStore {
    async fn get_current_keys(
      &self,
      _limit: i64,
    ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
      Ok(self.keys.clone())
    }

    async fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
      let keys = self.get_current_keys(1).await?;
      keys.into_iter().next().ok_or(SecureError::EmptyKeys)
    }

    async fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
      let keys = self.get_current_keys(1).await?;
      keys.get(kid).cloned().ok_or(SecureError::InvalidKeyId)
    }
  }

  // Returns app state
  pub async fn get_app_state() -> AppState {
    let assets = get_assets();
    let key_store = MockKeyStore::default();
    let arc_key_store = Arc::new(key_store);
    let pool = setup_test_db().await;

    AppState {
      pool: pool.clone(),
      jwk_passphrase: "1235asdffj#4$##!~*&)".to_string(),
      assets: assets.clone(),
      key_store: arc_key_store,
    }
  }

  pub mod test_data {
    // Test RSA keys in PEM format - these are for testing only, never use in production
    pub const TEST_KEY_PEM: &str = r#"-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF/TIB7/MCNl3BPjLDq68yhw9Wta8
P+6l1TQ0Mj5l7Hf5xvAhqnrKj1qfW6TGrZpIGxz5muoQI5Z2g/T3wvQVhC0wOvF3
NlLlfN9dHMSKaHevHqlqKHDq0eOPVjE57O8Ex1JqOJhYvd9cTmhs2LHYdJIWsObU
tDCKPvNWEbp9dLPHaydXCYa3LO9lOmGqDfvALH9M2Jnm5UQY8JrU/jbCXCJCfXIW
wWlhVYiP1qYdHwB8BQMhSPJHjdJO0W7awum6F5n8E0KiX4shWCtb3bXEg0bALvGC
AW5x4vwnBq9pQ5BHbfNxCGWaWajkdnfIh5cSzwIDAQABAoIBAH7a9i14ZFLKWNBu
WQ3PbLLrLJGP3F+vE7K4nQMvw4S5Oh7eNGHdIEzxDe5xgeVms2K2YGjLvYJnRVoQ
Uf5W4UWM0DJLZgT3OhiH0oSSJnfofmPPaBIHh6GdUaQgvJ3FV7CgPxHRLPPXoGdR
DyIarZ7dtBFiJC1bHMYcNKDvIQZaLb0YN9sDFl22p6Lv0EqLfGlHwMYQB0LOXBPH
b6XmHHPO7dKUuPCqxnRFvIJ/VLlYMQtFYF0Kx0ZIHR/N6hfGaT0fe3vBcI8g/vZe
Jlh6TtUKGoL5MFnOhVGqfqwx+kEabVt7AQp7f9LRJPmKLBUuvb0zhfB1fAaVGPwC
V1KgLBECgYEA+nLu0t9BOlZH72qzNjPhyMmPTJt5vT7DwUqEG3YGT3vT1HMOs7qZ
gxRrFFfYoLFayRtLiXcAw7u7wHvCh7y0T4qxDJA0oD5m+ZDN9YCb2keRRc2atzGC
+aBFMcFiiMKlEr+YPdVG7PmYoZ5FiFp1PvHLfFnUkJNYvdnEb3mZjLcCgYEA1kHT
92e29UC1DjJY2pfT5VH6aprH8/MUtb/BLJJg6S2rDQJztdGDVVao7VboN2aFFCZk
TjA5kPOaLUz6i3CjJqTqdzI8Xey1S7L4l9pSQCH0iz5HMHpVvKJALGzpjHLijm/B
OhPa4CKxOjSPREjTHHLpWLJudS7TjlJhKmfVeskCgYEAiXzgAePwT2dHuo6NbNjh
Dy3fmm7lzJYHVDg5zLEGBQkIdh/OPBYvmLEOS1x9p29nwpk0gm0JKxJQ2YHhxgEH
iFh5LlVHyJ7dZtyMKZGcn9HOGqUkJLlG6vPFVq4A5TeuOdjICVs4aWDGEqN6HtQo
nAKMExxkwfD8dIML0gvQascCgYBx3VQQ2cR1SgB3ZGPr8BWeqecqYG9gxSZ/T+8C
vQddTF6SQ6CpMKkDw/iHBs1tz5t7aTJkwUBe0CQjZj1PDMpPnfFoOhhC7YbUrm6B
DffNSPWumsGIGHdLvXupM3cSQbv0W7rM5lUHbmEeVbr3aTmxNnDYh6njCRCWuqG6
A1LsqQKBgCiQ9pCyqpC6Q1hNUvGgKfgNuLbVRNyCrmFiLjWyBZACdt7WH3wCjGHH
8o1DE5HjJNHby1brEzIYMnDzQp3xnU8H2d8mL7oAMdgrBHZTOvY7Kzten8FDl4TG
49S3qdXPG49r+lss6HKRmVOdJNcukzyNU4JtNpQmkWzOcbS2gqPF
-----END RSA PRIVATE KEY-----"#;

    pub const TEST_KEY_PEM_2: &str = r#"-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAwf9n3F3+dggz3MZ6EmoGGK+bKwIt8xlSiNk0QW8OHJZ0nELj
LiGnSHsNeQAbOllWYzXENHLCmeBqGhPeHF+mHvksN7r2RgRraNmV1yJLXRSf4LD9
DSLIDci7+G/FWF9SLY9PJcE6mKPT9D9ThQs8QSJHwcJtCgFOjNS7cg7hzQa3Z1yT
ZTzHB9afroh7b6FLnpH9iVKO3R5ZO6aBPBRnLpCnKrXvVhtcfpCPW6nRzN3vFcNH
azOz9aMsx6Z9JJY7kDM5OJ8pDvvQZvGpJf2w3NP4EwSkGkITXKCGzEgYVHQCaFDb
FvpNBBqo3S7meVD5NjQGPXmNh1mpiHCdumLgPQIDAQABAoIBAH7Ky6INyqvEJ/Hm
bOat9Ntrq1NJ+YfWx3k2j7sRR/NqCmqiGUkV6xO8KBXgxnhM1z6V4fRLy2Lgp6jW
4c9OoGKRRN0bGtLbOFdXBe1BTp8cITqXXYhGpq9zQ0mLJ0X7Zt8SsqQJK6/VgVaZ
Z5D7a5Vz5R1J5d7vTxbr2LnKDT/m7yyHHrQTx5JEjTlkNIKWfKvo4Y9Ysw5X/YT7
nJx0Dl3V3yv7DKjLm9GRJunrPuLlOVacVCJEQdZN9fPFqoJLQRJrNDLKdgJtdsKh
1CEjMeGCQqBi3wvQQfnnqcNuUkbSUJgQZJKPPIazNaOV+C6V3XLSjdvpIdNMfsvT
nwTq3AECgYEA8rP1ScHmeBiX5yDEPKWrF7z72iCLbKNa8CFBbL2Gqu+SCoQhCH5n
kx0yxBYVhJGjshCHGJ7hoXlM/pYNph+fdegmoBNJP2vSaNGlWYsE8R2YaKr6wUzA
IKF1HwccbfzJOyQp8TDyLcrJ5YXJnPSM+1f8s7LL3TQWBJXor3vLID0CgYEAzJ/y
WjnSqK8RTGRd5Ah6qpXJvxrDNBynPu4rKtCoHqMAPyXh4XhHYzNlXArXW5AbtLV/
S2F9M3rF3//wQpoV1ZLghtBqVEj6iMZXp5gKxqHULh05uxB4Zxdv+Q1RezNE4YSq
9gAuUc9uDp5x1Ea9qIvU4oUeVFx1pvJrXBKNuQECgYEA5sYiJxZ3voYCvrMnCjRc
bbZtPWKUGGzzKSdYJ0fGU8Om6yKa1WFishNlQiVvZM9WZtPf4w4zbeAHxKP6vsh9
J5WosQdRZiVDYTQCZG9G0uPl0YvgH2sPNNGMHMEL7ghzVJ+bP8h9hv+R7ItXvG8B
E8b20Fx8RBLh7SnppYILYlkCgYB1qNrfurf8Dpu0KB4MlWKU6C3fLKMx0Y8SmuUL
kKMxKoJPLCzNAhttv0KqnqQJCNAh3csPtCrA+cDbwGkMYuWTqOct8cFXLqj7abGa
yCR6gSap8EaIu1rH5VdVDdMGNZ9RIqKr3rnINoYEuTLKfPdkJZCWnSxfZJQzUDUc
4JuAAQKBgQCGBf4zt+LiNxG2KJyKnBXExdYfF/uH8dv+mqWoK0reGXwDPPgw2xCT
qJPKGj+e2GdGtaP5xfxDFE1ytOAJ6xMPV4embK4SrQVIGEpCsjKPqmJQKIQqfPpB
6NGPvz7pJevQSLCYdevNCEBUhm3k1F9X8ajJXMvE5mM2fLKGmtzCZQ==
-----END RSA PRIVATE KEY-----"#;
  }
}
