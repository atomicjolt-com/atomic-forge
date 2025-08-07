use crate::db::Pool;
use crate::models::oidc_state::OIDCState;
use atomic_lti::errors::OIDCError;
use atomic_lti::secure::generate_secure_string;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use async_trait::async_trait;
use std::sync::Arc;

pub struct DBOIDCStateStore {
  pool: Arc<Pool>,
  oidc_state: OIDCState,
}

#[async_trait]
impl OIDCStateStore for DBOIDCStateStore {
  async fn get_state(&self) -> String {
    self.oidc_state.state.clone()
  }

  async fn get_nonce(&self) -> String {
    self.oidc_state.nonce.clone()
  }

  async fn get_created_at(&self) -> chrono::NaiveDateTime {
    self.oidc_state.created_at
  }

  async fn destroy(&self) -> Result<usize, OIDCError> {
    OIDCState::destroy(&self.pool, self.oidc_state.id)
      .map_err(|e| OIDCError::StoreError(e.to_string()))
  }
}

impl DBOIDCStateStore {
  pub fn create(pool: &Pool) -> Result<Self, OIDCError> {
    let state: String = generate_secure_string(32);
    let nonce: String = generate_secure_string(32);

    let oidc_state: OIDCState =
      OIDCState::create(pool, &state, &nonce).map_err(|e| OIDCError::StoreError(e.to_string()))?;

    Ok(Self { pool: Arc::new(pool.clone()), oidc_state })
  }

  pub fn init(pool: &Pool, state: &str) -> std::result::Result<Self, OIDCError> {
    let oidc_state: OIDCState =
      OIDCState::find_by_state(pool, state).map_err(|e| OIDCError::StateInvalid(e.to_string()))?;

    Ok(Self { pool: Arc::new(pool.clone()), oidc_state })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::tests::get_pool;

  #[tokio::test]
  async fn test_create_and_load() {
    let pool = get_pool();
    let oidc_state_store = DBOIDCStateStore::create(&pool).expect("Expected state to be created");

    let loaded_oidc_state_store = DBOIDCStateStore::init(&pool, &oidc_state_store.get_state().await)
      .expect("Failed to initialize state");

    assert_eq!(
      oidc_state_store.get_state().await,
      loaded_oidc_state_store.get_state().await
    );
    assert_eq!(
      oidc_state_store.get_nonce().await,
      loaded_oidc_state_store.get_nonce().await
    );
    assert_eq!(
      oidc_state_store.get_created_at().await,
      loaded_oidc_state_store.get_created_at().await
    );
  }

  #[tokio::test]
  async fn test_destroy() {
    let pool = get_pool();
    let oidc_state_store = DBOIDCStateStore::create(&pool).unwrap();
    let state = oidc_state_store.get_state().await;
    let num_deleted = oidc_state_store.destroy().await.unwrap();

    assert_eq!(num_deleted, 1);

    let result = OIDCState::find_by_state(&pool, &state);

    assert!(result.is_err());
  }
}
