use crate::db::Pool;
use crate::models::key::Key;
use atomic_lti::errors::SecureError;
use atomic_lti::jwks::KeyStore;
use atomic_lti::secure::{decrypt_rsa_private_key, generate_rsa_key_pair};
use openssl::rsa::Rsa;

pub struct DBKeyStore<'a> {
  pub pool: &'a Pool,
  pub jwk_passphrase: &'a str,
}

impl KeyStore for DBKeyStore<'_> {
  fn get_current_keys(&self) -> Result<Vec<Rsa<openssl::pkey::Private>>, SecureError> {
    let keys = Key::list(self.pool, 2).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

    if keys.is_empty() {
      Err(SecureError::EmptyKeys)
    } else {
      // Parse the string key values into RSA keys
      let keys: Vec<Rsa<openssl::pkey::Private>> = keys
        .iter()
        .map(|key| decrypt_rsa_private_key(&key.key, self.jwk_passphrase))
        .collect::<Result<Vec<Rsa<openssl::pkey::Private>>, SecureError>>()?;

      Ok(keys)
    }
  }
}

pub fn ensure_keys(pool: &Pool, passphrase: &str) -> Result<(), SecureError> {
  let keys = Key::list(pool, 1).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;
  if keys.is_empty() {
    let (_, pem_string) =
      generate_rsa_key_pair(passphrase).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;

    Key::create(pool, &pem_string).map_err(|e| SecureError::PrivateKeyError(e.to_string()))?;
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::models::key::Key;
  use crate::tests::helpers::tests::{get_pool, JWK_PASSPHRASE};

  fn find_key(key: &Key, keys: &[Rsa<openssl::pkey::Private>], passphrase: &str) -> bool {
    let decrypted = decrypt_rsa_private_key(&key.key, passphrase).expect("Failed to decrypt key");
    let search_for_bytes = decrypted.private_key_to_pem().unwrap();
    let search_for_string = String::from_utf8(search_for_bytes).unwrap();

    keys.iter().any(|k| {
      let current_bytes = k.private_key_to_pem().unwrap();
      let current_string = String::from_utf8(current_bytes).unwrap();
      current_string == search_for_string
    })
  }

  #[test]
  fn test_get_current_keys() {
    let pool = get_pool();
    let key_store = DBKeyStore {
      pool: &pool,
      jwk_passphrase: JWK_PASSPHRASE,
    };

    let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string1).unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).unwrap();

    let keys = key_store
      .get_current_keys()
      .expect("Failed to get current keys");

    assert!(keys.len() >= 2);

    assert!(
      find_key(&key1, &keys, JWK_PASSPHRASE),
      "Key1 not found in keys"
    );
    assert!(
      find_key(&key2, &keys, JWK_PASSPHRASE),
      "Key2 not found in keys"
    );

    Key::destroy(&pool, key1.id).expect("Failed to destroy key");
    Key::destroy(&pool, key2.id).expect("Failed to destroy key");
  }
}
