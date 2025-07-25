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
pub async fn ensure_keys(pool: &Pool, passphrase: &str) -> Result<Option<Key>, SecureError> {
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
  use super::*;
  use crate::test_helpers::setup_test_db;
  use atomic_lti_test::helpers::JWK_PASSPHRASE;

  fn find_key(key: &Key, keys: &HashMap<String, Rsa<openssl::pkey::Private>>) -> bool {
    keys.keys().any(|k| k == &key.uuid.to_string())
  }

  #[tokio::test]
  async fn test_get_current_keys() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    // Create two keys
    let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string1).await.unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();

    // Get keys from the store - now this is async!
    let keys = key_store
      .get_current_keys(2)
      .await
      .expect("Failed to get current keys");

    assert_eq!(keys.len(), 2);
    assert!(find_key(&key1, &keys), "Key1 not found in keys");
    assert!(find_key(&key2, &keys), "Key2 not found in keys");

    // Clean up
    Key::destroy(&pool, key1.id)
      .await
      .expect("Failed to destroy key");
    Key::destroy(&pool, key2.id)
      .await
      .expect("Failed to destroy key");
  }

  #[tokio::test]
  async fn test_get_current_keys_empty_database() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    // Try to get keys from empty database
    let result = key_store.get_current_keys(2).await;

    assert!(matches!(result, Err(SecureError::EmptyKeys)));
  }

  #[tokio::test]
  async fn test_get_current_key() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    // Create a key
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();

    // Get the current key
    let (kid, rsa_key) = key_store
      .get_current_key()
      .await
      .expect("Failed to get current key");

    assert_eq!(kid, key.uuid);
    // Verify the RSA key can be decrypted
    assert!(!rsa_key.n().to_vec().is_empty());

    // Clean up
    Key::destroy(&pool, key.id)
      .await
      .expect("Failed to destroy key");
  }

  #[tokio::test]
  async fn test_get_current_key_empty_database() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    // Try to get current key from empty database
    let result = key_store.get_current_key().await;

    assert!(matches!(result, Err(SecureError::EmptyKeys)));
  }

  #[tokio::test]
  async fn test_get_key_valid_id() {
    let pool = setup_test_db().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    // Create a key
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

    // Create a key so the database isn't empty
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

    // First call should create a key
    let result = ensure_keys(&pool, JWK_PASSPHRASE)
      .await
      .expect("ensure_keys failed");

    assert!(result.is_some());
    let created_key = result.unwrap();

    // Verify the key was created
    let keys = Key::list(&pool, 1).await.expect("Failed to list keys");
    assert_eq!(keys.len(), 1);
    assert_eq!(keys[0].id, created_key.id);

    // Second call should not create another key
    let result2 = ensure_keys(&pool, JWK_PASSPHRASE)
      .await
      .expect("ensure_keys failed");

    assert!(result2.is_none());

    // Verify still only one key
    let keys = Key::list(&pool, 10).await.expect("Failed to list keys");
    assert_eq!(keys.len(), 1);

    // Clean up
    Key::destroy(&pool, created_key.id)
      .await
      .expect("Failed to destroy key");
  }

  #[tokio::test]
  async fn test_key_decryption_with_wrong_passphrase() {
    let pool = setup_test_db().await;
    let wrong_passphrase = "wrong_passphrase";
    let key_store = DBKeyStore::new(&pool, wrong_passphrase);

    // Create a key with the correct passphrase
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();

    // Try to get the key with wrong passphrase
    let result = key_store.get_current_keys(1).await;

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

    // Create three keys
    let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string1).await.unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();

    let (_, pem_string3) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key3 = Key::create(&pool, &pem_string3).await.unwrap();

    // Get only 2 keys
    let keys = key_store
      .get_current_keys(2)
      .await
      .expect("Failed to get current keys");

    assert_eq!(keys.len(), 2);

    // Clean up
    Key::destroy(&pool, key1.id)
      .await
      .expect("Failed to destroy key");
    Key::destroy(&pool, key2.id)
      .await
      .expect("Failed to destroy key");
    Key::destroy(&pool, key3.id)
      .await
      .expect("Failed to destroy key");
  }
}
