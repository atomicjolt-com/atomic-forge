use crate::db::Pool;
use crate::models::key::Key;
use atomic_lti::errors::SecureError;
use atomic_lti::secure::{decrypt_rsa_private_key, generate_rsa_key_pair};
use atomic_lti::stores::key_store::KeyStore;
use async_trait::async_trait;
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
    let keys =
      Key::list(&self.pool, limit).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

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

pub fn ensure_keys(pool: &Pool, passphrase: &str) -> Result<Option<Key>, SecureError> {
  let keys = Key::list(pool, 1).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;
  if keys.is_empty() {
    let (_, pem_string) =
      generate_rsa_key_pair(passphrase).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

    let key =
      Key::create(pool, &pem_string).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;
    Ok(Some(key))
  } else {
    Ok(None)
  }
}

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
    let pool = get_pool();
    let key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);

    let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string1).unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).unwrap();

    let keys = key_store
      .get_current_keys(2)
      .await
      .expect("Failed to get current keys");

    assert!(keys.len() >= 2);

    assert!(find_key(&key1, &keys), "Key1 not found in keys");
    assert!(find_key(&key2, &keys), "Key2 not found in keys");

    Key::destroy(&pool, key1.id).expect("Failed to destroy key");
    Key::destroy(&pool, key2.id).expect("Failed to destroy key");
  }

  #[test]
  fn test_ensure_keys() {
    let pool = get_pool();
    if let Some(key) = ensure_keys(&pool, JWK_PASSPHRASE).expect("ensure_keys failed") {
      Key::destroy(&pool, key.id).expect("Failed to destroy key");
    }
  }
}
