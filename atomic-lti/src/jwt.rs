use crate::{constants::ALGORITHM, errors::SecureError, stores::key_store::KeyStore};
use jsonwebtoken::{decode_header, DecodingKey, EncodingKey, Header, Validation};
use openssl::rsa::Rsa;

// encode a json web token (JWT)
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

pub fn encode_using_store<T: serde::Serialize>(
  claims: &T,
  key_store: &dyn KeyStore,
) -> Result<String, SecureError> {
  let (kid, rsa_key_pair) = key_store.get_current_key()?;
  encode(claims, &kid, rsa_key_pair)
}

// Decode a json web token (JWT)
pub fn decode<T: serde::de::DeserializeOwned>(
  encoded_jwt: &str,
  rsa_key_pair: Rsa<openssl::pkey::Private>,
) -> Result<jsonwebtoken::TokenData<T>, SecureError> {
  let public_key = rsa_key_pair.public_key_to_pem()?;
  let decoding_key = DecodingKey::from_rsa_pem(public_key.as_ref())?;
  let validation = Validation::new(ALGORITHM);

  jsonwebtoken::decode(encoded_jwt, &decoding_key, &validation)
    .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))
}

// Decode a json web token (JWT) without validation
pub fn insecure_decode<T: serde::de::DeserializeOwned>(
  encoded_jwt: &str,
) -> Result<jsonwebtoken::TokenData<T>, SecureError> {
  let decoding_key = DecodingKey::from_secret(&[]);
  let mut validation = Validation::new(ALGORITHM);
  validation.insecure_disable_signature_validation();
  jsonwebtoken::decode(encoded_jwt, &decoding_key, &validation)
    .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))
}

pub fn decode_using_store<T: serde::de::DeserializeOwned>(
  encoded_jwt: &str,
  key_store: &dyn KeyStore,
) -> Result<jsonwebtoken::TokenData<T>, SecureError> {
  let header =
    decode_header(encoded_jwt).map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))?;

  if let Some(kid) = header.kid {
    // Find the key that matches the kid in the JWT header
    let key = key_store.get_key(&kid)?;
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
  use chrono::{Duration, Utc};
  use openssl::rsa::Rsa;
  use serde::{Deserialize, Serialize};

  #[derive(Debug, Serialize, Deserialize)]
  struct TestClaims {
    sub: String,
    test: String,
    exp: i64,
    iat: i64,
  }

  #[test]
  fn test_encode_decode() {
    let rsa = Rsa::generate(2048).expect("Failed to generate RSA key");
    let kid = "test_kid";

    let claims = TestClaims {
      sub: "1234567890".to_string(),
      test: "test".to_string(),
      exp: (Utc::now() + Duration::minutes(15)).timestamp(),
      iat: Utc::now().timestamp(),
    };

    // Test encoding
    let encoded_jwt = encode(&claims, kid, rsa.clone()).expect("Failed to encode JWT");
    assert!(!encoded_jwt.is_empty());

    // Test decoding
    let decoded_jwt: jsonwebtoken::TokenData<TestClaims> =
      decode(&encoded_jwt, rsa).expect("Failed to decode JWT");
    assert_eq!(decoded_jwt.claims.sub, claims.sub);
  }

  #[test]
  fn test_decode_with_wrong_kid() {
    let rsa = Rsa::generate(2048).expect("Failed to generate RSA key");
    let kid = "test_kid";

    let claims = TestClaims {
      sub: "1234567890".to_string(),
      test: "test".to_string(),
      exp: (Utc::now() + Duration::minutes(15)).timestamp(),
      iat: Utc::now().timestamp(),
    };

    let encoded_jwt = encode(&claims, kid, rsa.clone()).unwrap();

    let wrong_rsa = Rsa::generate(2048).unwrap();

    let result = decode::<TestClaims>(&encoded_jwt, wrong_rsa);
    assert!(result.is_err());
    assert_eq!(
      result.unwrap_err(),
      SecureError::CannotDecodeJwtToken("InvalidSignature".to_string())
    );
  }
}
