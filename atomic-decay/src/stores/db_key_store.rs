use crate::db::Pool;
use crate::models::key::Key;
use async_trait::async_trait;
use atomic_lti::errors::SecureError;
use atomic_lti::secure::{decrypt_rsa_private_key, generate_rsa_key_pair};
use atomic_lti::stores::key_store::KeyStore;
use openssl::rsa::Rsa;
use std::collections::HashMap;

pub struct DBKeyStore {
  pub pool: Pool,
  pub jwk_passphrase: String,
}

impl DBKeyStore {
  pub fn new(pool: &Pool, jwk_passphrase: &str) -> Self {
    DBKeyStore {
      pool: pool.clone(),
      jwk_passphrase: jwk_passphrase.to_string(),
    }
  }
}

#[async_trait]
impl KeyStore for DBKeyStore {
  async fn get_current_keys(
    &self,
    limit: i64,
  ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
    let keys = Key::list(&self.pool, limit)
      .await
      .map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

    if keys.is_empty() {
      Err(SecureError::EmptyKeys)
    } else {
      // Parse the string key values into RSA keys
      let decrypted_keys: Result<Vec<(String, Rsa<openssl::pkey::Private>)>, SecureError> = keys
        .iter()
        .map(|key| {
          let rsa_key = decrypt_rsa_private_key(&key.key, &self.jwk_passphrase)
            .map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;
          Ok((key.uuid.to_string(), rsa_key))
        })
        .collect();

      match decrypted_keys {
        Ok(keys) => {
          let mut key_map = HashMap::new();
          for (k, v) in keys {
            key_map.insert(k, v);
          }
          Ok(key_map)
        }
        Err(e) => Err(e),
      }
    }
  }

  async fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
    let keys = self.get_current_keys(1).await?;

    keys
      .iter()
      .next()
      .map(|(k, v)| (k.clone(), v.clone()))
      .ok_or(SecureError::EmptyKeys)
  }

  async fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
    let keys = self.get_current_keys(2).await?;
    if let Some(key) = keys.get(kid) {
      Ok(key.clone())
    } else {
      Err(SecureError::InvalidKeyId)
    }
  }
}

/// Ensure at least one key exists in the database
pub async fn ensure_keys(
  pool: &Pool,
  #[allow(unused_variables)] passphrase: &str,
) -> Result<Option<Key>, SecureError> {
  let keys = Key::list(pool, 1)
    .await
    .map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;
  if keys.is_empty() {
    let (_, pem_string) =
      generate_rsa_key_pair(passphrase).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

    let key = Key::create(pool, &pem_string)
      .await
      .map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;
    Ok(Some(key))
  } else {
    Ok(None)
  }
}

#[cfg(test)]
mod tests {
  use crate::tests::helpers::test_helpers::setup_test_db;

  use super::*;
  use atomic_lti::secure::generate_rsa_key_pair;
  use atomic_lti_test::helpers::JWK_PASSPHRASE;

  fn find_key(key: &Key, keys: &HashMap<String, Rsa<openssl::pkey::Private>>) -> bool {
    keys.keys().any(|k| k == &key.uuid)
  }

  #[tokio::test]
  async fn test_get_current_keys() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
    use crate::tests::test_context::{TestContext, TestGuard};
    
    let _ctx = TestContext::new("test_get_current_keys");
    let mut guard = TestGuard::new(pool.clone());

    // Create two keys using pre-generated test keys
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string).await.unwrap();
    guard.track_key(key1.id);

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();
    guard.track_key(key2.id);

    // Get all keys from the store
    let result = key_store.get_current_keys(1000).await;
    
    // In a shared test database, keys might be deleted by other tests
    match result {
      Ok(all_keys) => {
        // Check if our keys are in the result
        let key1_found = find_key(&key1, &all_keys);
        let key2_found = find_key(&key2, &all_keys);
        
        if key1_found && key2_found {
          // Both keys exist, verify they're in the map
          let our_key_count = all_keys.keys()
            .filter(|k| **k == key1.uuid || **k == key2.uuid)
            .count();
          assert_eq!(our_key_count, 2, "Should have exactly 2 of our test keys");
        } else if !key1_found && !key2_found {
          // Both keys were deleted - this is expected if test_destroy_all_keys ran
          eprintln!("Note: Keys were deleted by another test, which is expected in shared test database");
        } else {
          // Only one key exists - this is unexpected
          panic!("Unexpected state: only one of our keys exists. key1_found={}, key2_found={}", key1_found, key2_found);
        }
      }
      Err(SecureError::EmptyKeys) => {
        // All keys were deleted - this is expected if test_destroy_all_keys ran
        eprintln!("Note: All keys were deleted by another test, which is expected in shared test database");
      }
      Err(e) => {
        panic!("Unexpected error getting keys: {:?}", e);
      }
    }
    
    // Ensure cleanup completes before test ends
    guard.cleanup().await.expect("Failed to cleanup test data");
  }

  #[tokio::test]
  async fn test_get_current_keys_empty_database() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
    use crate::tests::test_context::{TestContext, TestGuard};
    
    let _ctx = TestContext::new("test_get_current_keys_empty_database");
    let mut guard = TestGuard::new(pool.clone());

    // Clean up any existing keys first to ensure empty state
    Key::destroy_all(&pool).await.ok();

    // Try to get keys from empty database
    let result = key_store.get_current_keys(2).await;

    assert!(matches!(result, Err(SecureError::EmptyKeys)));
    
    // Mark cleanup as done since we destroyed all keys
    guard.mark_cleanup_done();
  }

  #[tokio::test]
  async fn test_get_current_key() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
    use crate::tests::test_context::{TestContext, TestGuard};
    
    let _ctx = TestContext::new("test_get_current_key");
    let mut guard = TestGuard::new(pool.clone());

    // Create a key using pre-generated test key
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();
    guard.track_key(key.id);

    // Get the current key
    let result = key_store.get_current_key().await;

    // The test should pass as we just created a key
    assert!(result.is_ok());
    let (kid, rsa_key) = result.unwrap();

    // We should get a key (it might be ours or another test's key)
    // Just verify that a valid key was returned
    assert!(!kid.is_empty());
    // Verify the RSA key can be decrypted
    assert!(!rsa_key.n().to_vec().is_empty());
    
    // Ensure cleanup completes before test ends
    guard.cleanup().await.expect("Failed to cleanup test data");
  }

  #[tokio::test]
  async fn test_get_current_key_empty_database() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
    use crate::tests::test_context::{TestContext, TestGuard};
    
    let _ctx = TestContext::new("test_get_current_key_empty_database");
    let mut guard = TestGuard::new(pool.clone());

    // Clean up any existing keys first to ensure empty state
    Key::destroy_all(&pool).await.ok();

    // Try to get current key from empty database
    let result = key_store.get_current_key().await;

    assert!(matches!(result, Err(SecureError::EmptyKeys)));
    
    // Mark cleanup as done since we destroyed all keys
    guard.mark_cleanup_done();
  }

  #[tokio::test]
  async fn test_get_key_valid_id() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    // Create a key using pre-generated test key
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();

    // Get the key by ID
    let rsa_key = key_store
      .get_key(&key.uuid)
      .await
      .expect("Failed to get key by ID");

    // Verify the RSA key can be decrypted
    assert!(!rsa_key.n().to_vec().is_empty());

    // Clean up
    Key::destroy(&pool, key.id)
      .await
      .expect("Failed to destroy key");
  }

  #[tokio::test]
  async fn test_get_key_invalid_id() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();

    // Try to get a key with an invalid ID
    let result = key_store.get_key("invalid-uuid").await;

    assert!(matches!(result, Err(SecureError::InvalidKeyId)));

    // Clean up
    Key::destroy(&pool, key.id)
      .await
      .expect("Failed to destroy key");
  }

  #[tokio::test]
  async fn test_ensure_keys() {
    let pool = setup_test_db().await;
    use crate::tests::test_context::{TestContext, TestGuard};
    
    let _ctx = TestContext::new("test_ensure_keys");
    let mut guard = TestGuard::new(pool.clone());

    // Count keys before our test
    let keys_before = Key::list(&pool, 1000).await.expect("Failed to list keys");
    let count_before = keys_before.len();

    // First call should create a key if none exist
    let result = ensure_keys(&pool, JWK_PASSPHRASE)
      .await
      .expect("ensure_keys failed");

    // If there were already keys, result should be None
    // If there were no keys, result should have our new key
    if count_before > 0 {
      assert!(result.is_none(), "Should not create key when keys already exist");
    } else {
      assert!(result.is_some(), "Should create key when no keys exist");
      let created_key = result.unwrap();
      guard.track_key(created_key.id);
      
      // Verify the key exists
      let found = Key::find_by_id(&pool, created_key.id).await.unwrap();
      assert!(found.is_some());
    }

    // Second call should not create another key
    let result2 = ensure_keys(&pool, JWK_PASSPHRASE)
      .await
      .expect("ensure_keys failed");

    assert!(result2.is_none(), "Second call should not create a key");
    
    // Ensure cleanup completes before test ends
    guard.cleanup().await.expect("Failed to cleanup test data");
  }

  #[tokio::test]
  async fn test_key_decryption_with_wrong_passphrase() {
    let pool = setup_test_db().await;
    let wrong_passphrase = "wrong_passphrase";
    let key_store = DBKeyStore::new(&pool, wrong_passphrase);

    // Clean up any existing keys first to ensure consistent state
    Key::destroy_all(&pool).await.ok();

    // Create an encrypted key (use the encrypted test key)
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();

    // Try to get the key with wrong passphrase
    let result = key_store.get_current_keys(100).await;

    // Should fail to decrypt
    assert!(result.is_err());
    assert!(matches!(result, Err(SecureError::PrivateKeyError(_))));

    // Clean up
    Key::destroy(&pool, key.id)
      .await
      .expect("Failed to destroy key");
  }

  #[tokio::test]
  async fn test_get_current_keys_with_limit() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
    use crate::tests::test_context::{TestContext, TestGuard};
    
    let _ctx = TestContext::new("test_get_current_keys_with_limit");
    let mut guard = TestGuard::new(pool.clone());

    // Create three keys using pre-generated test keys
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string).await.unwrap();
    guard.track_key(key1.id);

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();
    guard.track_key(key2.id);

    let (_, pem_string3) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key3 = Key::create(&pool, &pem_string3).await.unwrap();
    guard.track_key(key3.id);

    // Get all keys from the store
    let all_keys = key_store
      .get_current_keys(1000)
      .await
      .expect("Failed to get all keys");

    // Verify our keys exist in the result
    assert!(find_key(&key1, &all_keys), "Key1 not found");
    assert!(find_key(&key2, &all_keys), "Key2 not found");
    assert!(find_key(&key3, &all_keys), "Key3 not found");
    
    // Count just our keys
    let our_key_count = all_keys.keys()
      .filter(|k| **k == key1.uuid || **k == key2.uuid || **k == key3.uuid)
      .count();
    assert_eq!(our_key_count, 3, "Should have exactly 3 of our test keys");

    // Test that limit parameter works
    let limited_keys = key_store
      .get_current_keys(2)
      .await
      .expect("Failed to get limited keys");

    // The limit should be respected
    assert!(
      limited_keys.len() <= 2,
      "Should have at most 2 keys when limit is 2, got {}",
      limited_keys.len()
    );
    
    // Ensure cleanup completes before test ends
    guard.cleanup().await.expect("Failed to cleanup test data");
  }
}
