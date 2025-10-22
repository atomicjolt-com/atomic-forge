use crate::{constants::ALGORITHM, errors::SecureError, stores::key_store::KeyStore};
use jsonwebtoken::{decode_header, DecodingKey, EncodingKey, Header, Validation};
use openssl::rsa::Rsa;

/// Encode a JSON Web Token (JWT) asynchronously
pub fn encode<T: serde::Serialize>(
  claims: &T,
  kid: &str,
  rsa_key_pair: Rsa<openssl::pkey::Private>,
) -> Result<String, SecureError> {
  let der = rsa_key_pair.private_key_to_der()?;
  let encoding_key: EncodingKey = EncodingKey::from_rsa_der(der.as_ref());

  let mut header = Header::new(ALGORITHM);
  header.kid = Some(kid.to_string());

  let token = jsonwebtoken::encode(&header, &claims, &encoding_key)
    .map_err(|e| SecureError::CannotEncodeJwtToken(e.to_string()))?;

  Ok(token)
}

/// Encode a JWT using an async key store
pub async fn encode_using_store<T: serde::Serialize>(
  claims: &T,
  key_store: &dyn KeyStore,
) -> Result<String, SecureError> {
  let (kid, rsa_key_pair) = key_store.get_current_key().await?;
  encode(claims, &kid, rsa_key_pair)
}

/// Decode a JSON Web Token (JWT)
pub fn decode<T: serde::de::DeserializeOwned>(
  encoded_jwt: &str,
  rsa_key_pair: Rsa<openssl::pkey::Private>,
) -> Result<jsonwebtoken::TokenData<T>, SecureError> {
  let public_key = rsa_key_pair.public_key_to_pem()?;
  let decoding_key = DecodingKey::from_rsa_pem(public_key.as_ref())?;
  let mut validation = Validation::new(ALGORITHM);
  validation.validate_aud = false; // Don't validate audience since we don't know what to expect

  jsonwebtoken::decode(encoded_jwt, &decoding_key, &validation)
    .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))
}

/// Decode a JWT without validation
pub fn insecure_decode<T: serde::de::DeserializeOwned>(
  encoded_jwt: &str,
) -> Result<jsonwebtoken::TokenData<T>, SecureError> {
  let decoding_key = DecodingKey::from_secret(&[]);
  let mut validation = Validation::new(ALGORITHM);
  validation.insecure_disable_signature_validation();
  validation.validate_aud = false;
  jsonwebtoken::decode(encoded_jwt, &decoding_key, &validation)
    .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))
}

/// Decode a JWT using an async key store
pub async fn decode_using_store<T: serde::de::DeserializeOwned>(
  encoded_jwt: &str,
  key_store: &dyn KeyStore,
) -> Result<jsonwebtoken::TokenData<T>, SecureError> {
  let header =
    decode_header(encoded_jwt).map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))?;

  if let Some(kid) = header.kid {
    // Find the key that matches the kid in the JWT header
    let key = key_store.get_key(&kid).await?;
    decode(encoded_jwt, key)
  } else {
    Err(SecureError::InvalidKeyIdError(
      "No kid present in JWT header".to_string(),
    ))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::secure::generate_rsa_key_pair;
  use crate::stores::key_store::KeyStore;
  use async_trait::async_trait;
  use chrono::{Duration, Utc};
  use serde::{Deserialize, Serialize};
  use std::collections::HashMap;

  #[derive(Debug, Serialize, Deserialize)]
  struct TestClaims {
    sub: String,
    exp: i64,
    iat: i64,
  }

  struct MockKeyStore {
    keys: HashMap<String, Rsa<openssl::pkey::Private>>,
    current_kid: String,
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
      self
        .keys
        .get(&self.current_kid)
        .map(|key| (self.current_kid.clone(), key.clone()))
        .ok_or(SecureError::EmptyKeys)
    }

    async fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
      self.keys.get(kid).cloned().ok_or(SecureError::InvalidKeyId)
    }
  }

  #[tokio::test]
  async fn test_encode_decode_using_async_store() {
    let passphrase = "test_passphrase";
    let (_, pem_string) = generate_rsa_key_pair(passphrase).unwrap();
    let rsa_key = openssl::rsa::Rsa::private_key_from_pem_passphrase(
      pem_string.as_bytes(),
      passphrase.as_bytes(),
    )
    .unwrap();

    let mut keys = HashMap::new();
    let kid = "test_key_1";
    keys.insert(kid.to_string(), rsa_key);

    let key_store = MockKeyStore {
      keys,
      current_kid: kid.to_string(),
    };

    let now = Utc::now();
    let claims = TestClaims {
      sub: "test_user".to_string(),
      exp: (now + Duration::hours(1)).timestamp(),
      iat: now.timestamp(),
    };

    // Encode using async store
    let token = encode_using_store(&claims, &key_store)
      .await
      .expect("Failed to encode token");

    // Decode using async store
    let decoded = decode_using_store::<TestClaims>(&token, &key_store)
      .await
      .expect("Failed to decode token");

    assert_eq!(decoded.claims.sub, "test_user");
    assert_eq!(decoded.header.kid, Some(kid.to_string()));
  }

  #[tokio::test]
  async fn test_decode_missing_kid() {
    let passphrase = "test_passphrase";
    let (_, pem_string) = generate_rsa_key_pair(passphrase).unwrap();
    let rsa_key = openssl::rsa::Rsa::private_key_from_pem_passphrase(
      pem_string.as_bytes(),
      passphrase.as_bytes(),
    )
    .unwrap();

    let key_store = MockKeyStore {
      keys: HashMap::new(),
      current_kid: "test_key".to_string(),
    };

    let now = Utc::now();
    let claims = TestClaims {
      sub: "test_user".to_string(),
      exp: (now + Duration::hours(1)).timestamp(),
      iat: now.timestamp(),
    };

    // Encode without kid
    let der = rsa_key.private_key_to_der().unwrap();
    let encoding_key = EncodingKey::from_rsa_der(&der);
    let header = Header::new(ALGORITHM); // No kid
    let token = jsonwebtoken::encode(&header, &claims, &encoding_key).unwrap();

    // Try to decode - should fail due to missing kid
    let result = decode_using_store::<TestClaims>(&token, &key_store).await;

    assert!(matches!(result, Err(SecureError::InvalidKeyIdError(_))));
  }
}
