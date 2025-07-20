use crate::db::Pool;
use crate::models::key::Key;
use atomic_lti::errors::SecureError;
use atomic_lti::secure::{decrypt_rsa_private_key, generate_rsa_key_pair};
use atomic_lti::stores::key_store::KeyStore;
use openssl::rsa::Rsa;
use std::collections::HashMap;
use tokio::runtime::Handle;

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

impl KeyStore for DBKeyStore {
  fn get_current_keys(
    &self,
    limit: i64,
  ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
    let handle = Handle::current();
    let pool = self.pool.clone();
    
    let keys = handle
      .block_on(async move { Key::list(&pool, limit).await })
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

  fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
    let keys = self.get_current_keys(1)?;

    keys
      .iter()
      .next()
      .map(|(k, v)| (k.clone(), v.clone()))
      .ok_or(SecureError::EmptyKeys)
  }

  fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
    let keys = self.get_current_keys(2)?;
    if let Some(key) = keys.get(kid) {
      Ok(key.clone())
    } else {
      Err(SecureError::InvalidKeyId)
    }
  }
}

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

// TODO: Migrate tests to Axum
/*
#[cfg(test)]
mod tests {
  use super::*;
  use crate::models::key::Key;
  use crate::tests::helpers::tests::get_pool;
  use atomic_lti_test::helpers::JWK_PASSPHRASE;

  fn find_key(key: &Key, keys: &HashMap<String, Rsa<openssl::pkey::Private>>) -> bool {
    keys.keys().any(|k| k == &key.uuid.to_string())
  }

  #[tokio::test]
  async fn test_get_current_keys() {
    let pool = get_pool().await;
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string1).await.unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();

    let keys = key_store
      .get_current_keys(2)
      .expect("Failed to get current keys");

    assert!(keys.len() >= 2);

    assert!(find_key(&key1, &keys), "Key1 not found in keys");
    assert!(find_key(&key2, &keys), "Key2 not found in keys");

    Key::destroy(&pool, key1.id).await.expect("Failed to destroy key");
    Key::destroy(&pool, key2.id).await.expect("Failed to destroy key");
  }

  #[tokio::test]
  async fn test_ensure_keys() {
    let pool = get_pool().await;
    if let Some(key) = ensure_keys(&pool, JWK_PASSPHRASE).await.expect("ensure_keys failed") {
      Key::destroy(&pool, key.id).await.expect("Failed to destroy key");
    }
  }
}
*/