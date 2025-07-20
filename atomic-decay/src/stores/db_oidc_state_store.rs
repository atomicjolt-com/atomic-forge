use crate::db::Pool;
use crate::models::oidc_state::OIDCState;
use atomic_lti::errors::OIDCError;
use atomic_lti::secure::generate_secure_string;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use tokio::runtime::Handle;
pub struct DBOIDCStateStore {
  pool: Pool,
  oidc_state: OIDCState,
}

impl OIDCStateStore for DBOIDCStateStore {
  fn get_state(&self) -> String {
    self.oidc_state.state.clone()
  }

  fn get_nonce(&self) -> String {
    self.oidc_state.nonce.clone()
  }

  fn get_created_at(&self) -> chrono::NaiveDateTime {
    self.oidc_state.created_at
  }

  fn destroy(&self) -> Result<usize, OIDCError> {
    let handle = Handle::current();
    let pool = self.pool.clone();
    let id = self.oidc_state.id;
    
    handle
      .block_on(async move { OIDCState::destroy(&pool, id).await })
      .map(|count| count as usize)
      .map_err(|e| OIDCError::StoreError(e.to_string()))
  }
}

impl DBOIDCStateStore {
  pub fn create(pool: &Pool) -> Result<Self, OIDCError> {
    let state: String = generate_secure_string(32);
    let nonce: String = generate_secure_string(32);

    let handle = Handle::current();
    let pool_clone = pool.clone();
    
    let oidc_state: OIDCState = handle
      .block_on(async move { OIDCState::create(&pool_clone, &state, &nonce).await })
      .map_err(|e| OIDCError::StoreError(e.to_string()))?;

    Ok(Self { pool: pool.clone(), oidc_state })
  }

  pub fn init(pool: &Pool, state: &str) -> std::result::Result<Self, OIDCError> {
    let handle = Handle::current();
    let pool_clone = pool.clone();
    let state_string = state.to_string();
    
    let oidc_state: OIDCState = handle
      .block_on(async move { OIDCState::find_by_state(&pool_clone, &state_string).await })
      .map_err(|e| OIDCError::StateInvalid(e.to_string()))?;

    Ok(Self { pool: pool.clone(), oidc_state })
  }
}

// TODO: Migrate tests to Axum
/*
#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::tests::get_pool;

  #[test]
  fn test_create_and_load() {
    let pool = get_pool();
    let oidc_state_store = DBOIDCStateStore::create(&pool).expect("Expected state to be created");

    let loaded_oidc_state_store = DBOIDCStateStore::init(&pool, &oidc_state_store.get_state())
      .expect("Failed to initialize state");

    assert_eq!(
      oidc_state_store.get_state(),
      loaded_oidc_state_store.get_state()
    );
    assert_eq!(
      oidc_state_store.get_nonce(),
      loaded_oidc_state_store.get_nonce()
    );
    assert_eq!(
      oidc_state_store.get_created_at(),
      loaded_oidc_state_store.get_created_at()
    );
  }

  #[test]
  fn test_destroy() {
    let pool = get_pool();
    let oidc_state_store = DBOIDCStateStore::create(&pool).unwrap();
    let state = oidc_state_store.get_state();
    let num_deleted = oidc_state_store.destroy().unwrap();

    assert_eq!(num_deleted, 1);

    let result = OIDCState::find_by_state(&pool, &state);

    assert!(result.is_err());
  }
}
*/
