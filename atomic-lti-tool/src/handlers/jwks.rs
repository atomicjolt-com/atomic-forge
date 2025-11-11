use crate::errors::AtomicToolError;
use actix_web::HttpResponse;
use atomic_lti::{jwks::get_current_jwks, stores::key_store::KeyStore};

pub async fn jwks(key_store: &dyn KeyStore) -> Result<HttpResponse, AtomicToolError> {
  let jwks = get_current_jwks(key_store).await?;
  let jwks_json = serde_json::to_string(&jwks)?;
  // Return a JSON response with the JWK
  Ok(
    HttpResponse::Ok()
      .content_type("application/json")
      .body(jwks_json.to_string()),
  )
}

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use super::*;
  use actix_web::http;
  use async_trait::async_trait;
  use atomic_lti::{errors::SecureError, jwks::Jwks, stores::key_store::KeyStore};
  use atomic_lti_test::helpers::MockKeyStore;
  use openssl::rsa::Rsa;

  #[actix_web::test]
  async fn returns_jwks_with_valid_key_store() {
    let key_store = MockKeyStore::default();
    let resp = jwks(&key_store)
      .await
      .expect("Request to jwks handler failed");

    assert_eq!(resp.status(), http::StatusCode::OK);
    assert_eq!(
      resp.headers().get("content-type").unwrap(),
      "application/json"
    );

    let body = actix_web::body::to_bytes(resp.into_body()).await.unwrap();
    let jwks: Jwks = serde_json::from_slice(&body).unwrap();

    assert_eq!(jwks.keys[0].kty, "RSA");
    assert!(!jwks.keys[0].n.is_empty());
    assert_eq!(jwks.keys[0].e, "AQAB");
  }

  #[actix_web::test]
  async fn returns_internal_server_error_with_invalid_key_store() {
    struct InvalidKeyStore {}

    #[async_trait]
    impl KeyStore for InvalidKeyStore {
      async fn get_current_keys(
        &self,
        _limit: i64,
      ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
        Err(SecureError::EmptyKeys)
      }
      async fn get_current_key(
        &self,
      ) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
        Err(SecureError::EmptyKeys)
      }
      async fn get_key(&self, _kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
        Err(SecureError::InvalidKeyId)
      }
    }

    let key_store = InvalidKeyStore {};
    let result = jwks(&key_store).await;

    assert!(result.is_err());
    assert_eq!(
      result.unwrap_err().to_string(),
      "There are currently no keys available"
    );
  }
}
