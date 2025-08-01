use crate::db::Pool;
use crate::models::oidc_state::OIDCState;
use async_trait::async_trait;
use atomic_lti::errors::OIDCError;
use atomic_lti::secure::generate_secure_string;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;

pub struct DBOIDCStateStore {
  pool: Pool,
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
    let id = self.oidc_state.id;

    OIDCState::destroy(&self.pool, id)
      .await
      .map(|count| count as usize)
      .map_err(|e| OIDCError::StoreError(e.to_string()))
  }
}

impl DBOIDCStateStore {
  pub async fn create(pool: &Pool) -> Result<Self, OIDCError> {
    let state: String = generate_secure_string(32);
    let nonce: String = generate_secure_string(32);

    let oidc_state: OIDCState = OIDCState::create(pool, &state, &nonce)
      .await
      .map_err(|e| OIDCError::StoreError(e.to_string()))?;

    Ok(Self {
      pool: pool.clone(),
      oidc_state,
    })
  }

  pub async fn init(pool: &Pool, state: &str) -> std::result::Result<Self, OIDCError> {
    let oidc_state: OIDCState = OIDCState::find_by_state(pool, state)
      .await
      .map_err(|e| OIDCError::StateInvalid(e.to_string()))?;

    Ok(Self {
      pool: pool.clone(),
      oidc_state,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::test_helpers::setup_test_db;
  use crate::tests::test_context::{TestContext, TestGuard};

  #[tokio::test]
  async fn test_create_oidc_state() {
    let pool = setup_test_db().await;

    // Create a new OIDC state store
    let store = DBOIDCStateStore::create(&pool)
      .await
      .expect("Failed to create OIDC state store");

    // Verify the state and nonce are generated with correct length (32 characters)
    let state = store.get_state().await;
    let nonce = store.get_nonce().await;

    assert_eq!(state.len(), 32);
    assert_eq!(nonce.len(), 32);
    assert_ne!(state, nonce); // State and nonce should be different

    // Verify created_at is set
    let created_at = store.get_created_at().await;
    assert!(created_at <= chrono::Utc::now().naive_utc());

    // Clean up
    store.destroy().await.expect("Failed to destroy OIDC state");
  }

  #[tokio::test]
  async fn test_init_with_existing_state() {
    let pool = setup_test_db().await;
    let _ctx = TestContext::new("test_init_with_existing_state");
    let mut guard = TestGuard::new(pool.clone());

    // First create an OIDC state
    let original_store = DBOIDCStateStore::create(&pool)
      .await
      .expect("Failed to create OIDC state store");
    
    // Track the created OIDC state for cleanup
    guard.track_oidc_state(original_store.oidc_state.id);

    let original_state = original_store.get_state().await;
    let original_nonce = original_store.get_nonce().await;
    let original_created_at = original_store.get_created_at().await;

    // Initialize a new store with the existing state
    let initialized_store = DBOIDCStateStore::init(&pool, &original_state)
      .await
      .expect("Failed to initialize OIDC state store");

    // Verify all values match
    assert_eq!(initialized_store.get_state().await, original_state);
    assert_eq!(initialized_store.get_nonce().await, original_nonce);
    assert_eq!(
      initialized_store.get_created_at().await,
      original_created_at
    );
    
    // Ensure cleanup completes before test ends
    guard.cleanup().await.expect("Failed to cleanup test data");
  }

  #[tokio::test]
  async fn test_init_with_non_existent_state() {
    let pool = setup_test_db().await;

    // Try to initialize with a non-existent state
    let result = DBOIDCStateStore::init(&pool, "non_existent_state").await;

    // Should return an error
    assert!(result.is_err());
    match result {
      Err(OIDCError::StateInvalid(_)) => {
        // Expected error type
      }
      _ => panic!("Expected StateInvalid error"),
    }
  }

  #[tokio::test]
  async fn test_destroy_oidc_state() {
    let pool = setup_test_db().await;

    // Create an OIDC state
    let store = DBOIDCStateStore::create(&pool)
      .await
      .expect("Failed to create OIDC state store");

    let state = store.get_state().await;

    // Destroy it
    let destroyed_count = store.destroy().await.expect("Failed to destroy OIDC state");
    assert_eq!(destroyed_count, 1);

    // Verify it's gone by trying to init with the same state
    let result = DBOIDCStateStore::init(&pool, &state).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_multiple_oidc_states() {
    let pool = setup_test_db().await;

    // Create multiple OIDC states
    let store1 = DBOIDCStateStore::create(&pool)
      .await
      .expect("Failed to create first OIDC state store");

    let store2 = DBOIDCStateStore::create(&pool)
      .await
      .expect("Failed to create second OIDC state store");

    let store3 = DBOIDCStateStore::create(&pool)
      .await
      .expect("Failed to create third OIDC state store");

    // Verify all states and nonces are unique
    let state1 = store1.get_state().await;
    let state2 = store2.get_state().await;
    let state3 = store3.get_state().await;

    assert_ne!(state1, state2);
    assert_ne!(state1, state3);
    assert_ne!(state2, state3);

    let nonce1 = store1.get_nonce().await;
    let nonce2 = store2.get_nonce().await;
    let nonce3 = store3.get_nonce().await;

    assert_ne!(nonce1, nonce2);
    assert_ne!(nonce1, nonce3);
    assert_ne!(nonce2, nonce3);

    // Clean up
    store1
      .destroy()
      .await
      .expect("Failed to destroy OIDC state 1");
    store2
      .destroy()
      .await
      .expect("Failed to destroy OIDC state 2");
    store3
      .destroy()
      .await
      .expect("Failed to destroy OIDC state 3");
  }

  #[tokio::test]
  async fn test_oidc_state_persistence() {
    let pool = setup_test_db().await;

    // Create an OIDC state
    let store = DBOIDCStateStore::create(&pool)
      .await
      .expect("Failed to create OIDC state store");

    let state = store.get_state().await;
    let nonce = store.get_nonce().await;
    let created_at = store.get_created_at().await;

    // Drop the store to ensure we're not relying on in-memory data
    drop(store);

    // Re-initialize from the database
    let reloaded_store = DBOIDCStateStore::init(&pool, &state)
      .await
      .expect("Failed to reload OIDC state store");

    // Verify all data was persisted correctly
    assert_eq!(reloaded_store.get_state().await, state);
    assert_eq!(reloaded_store.get_nonce().await, nonce);
    assert_eq!(reloaded_store.get_created_at().await, created_at);

    // Clean up
    reloaded_store
      .destroy()
      .await
      .expect("Failed to destroy OIDC state");
  }

  #[tokio::test]
  async fn test_concurrent_oidc_state_creation() {
    let pool = setup_test_db().await;

    // Create multiple OIDC states concurrently
    let futures = vec![
      DBOIDCStateStore::create(&pool),
      DBOIDCStateStore::create(&pool),
      DBOIDCStateStore::create(&pool),
      DBOIDCStateStore::create(&pool),
      DBOIDCStateStore::create(&pool),
    ];

    let stores = futures::future::join_all(futures).await;

    // All should succeed
    let mut successful_stores = Vec::new();
    for result in stores {
      successful_stores.push(result.expect("Failed to create OIDC state concurrently"));
    }

    // Verify all states are unique
    let mut states = Vec::new();
    for store in &successful_stores {
      states.push(store.get_state().await);
    }

    // Check for uniqueness
    for i in 0..states.len() {
      for j in (i + 1)..states.len() {
        assert_ne!(states[i], states[j], "Duplicate state found!");
      }
    }

    // Clean up
    for store in successful_stores {
      store.destroy().await.expect("Failed to destroy OIDC state");
    }
  }
}
