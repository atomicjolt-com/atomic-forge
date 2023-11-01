use std::collections::HashMap;

use atomic_lti::errors::{OIDCError, PlatformError, SecureError};
use atomic_lti::id_token::{IdToken, ResourceLinkClaim};
use atomic_lti::jwks::{Jwks, KeyStore};
use atomic_lti::platforms::PlatformStore;
use atomic_lti::validate::OIDCStateStore;
use chrono::{Duration, Utc};
use openssl::rsa::Rsa;

pub const ISS: &str = "https://lms.example.com";
pub const FAKE_STATE: &str = "state";
pub const FAKE_NONCE: &str = "nonce";
pub const JWK_PASSPHRASE: &str = "1235asdffj#4$##!~*&)";

pub struct MockPlatformStore {
  pub jwks_url: String,
  pub oidc_url: String,
  pub token_url: String,
}

pub struct MockKeyStore {}

impl KeyStore for MockKeyStore {
  fn get_current_keys(
    &self,
    _limit: i64,
  ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
    let mut key_map = HashMap::new();
    key_map.insert("test_kid".to_string(), Rsa::generate(2048).unwrap());
    Ok(key_map)
  }

  fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
    let keys = self.get_current_keys(1)?;
    keys.into_iter().next().ok_or(SecureError::EmptyKeys)
  }
}

impl PlatformStore for MockPlatformStore {
  fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
    Ok(self.jwks_url.to_string())
  }

  fn get_oidc_url(&self) -> Result<String, PlatformError> {
    Ok(self.oidc_url.to_string())
  }

  fn get_token_url(&self) -> Result<String, PlatformError> {
    Ok(self.token_url.to_string())
  }
}

pub struct MockOIDCStateStore {}
impl OIDCStateStore for MockOIDCStateStore {
  fn get_state(&self) -> String {
    FAKE_STATE.to_string()
  }

  fn get_nonce(&self) -> String {
    FAKE_NONCE.to_string()
  }

  fn get_created_at(&self) -> chrono::NaiveDateTime {
    (Utc::now() + Duration::minutes(15)).naive_utc()
  }

  fn destroy(&self) -> Result<usize, OIDCError> {
    Ok(1)
  }
}

pub fn create_mock_platform_store(jwks: &Jwks, url: &str) -> (MockPlatformStore, String) {
  let jwks_json = serde_json::to_string(&jwks).expect("Serialization failed");

  let store: MockPlatformStore = MockPlatformStore {
    jwks_url: format!("{}{}", url, "/jwks"),
    token_url: format!("{}{}", url, "/token"),
    oidc_url: format!("{}{}", url, "/oidc"),
  };

  (store, jwks_json)
}

pub fn generate_id_token(target_link_uri: &str) -> IdToken {
  IdToken {
    target_link_uri: target_link_uri.to_string(),
    resource_link: ResourceLinkClaim {
      id: "123".to_string(),
      description: None,
      title: None,
      validation_context: None,
      errors: None,
    },
    auds: Some(vec!["example.com".to_string()]),
    azp: "".to_string(),
    aud: "example.com".to_string(),
    lti_version: "1.3".to_string(),
    nonce: FAKE_NONCE.to_string(),
    ..Default::default()
  }
}
