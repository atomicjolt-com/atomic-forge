use std::collections::HashMap;

use atomic_lti::errors::{OIDCError, PlatformError, SecureError};
use atomic_lti::id_token::{IdToken, ResourceLinkClaim};
use atomic_lti::jwt::encode_using_store;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::stores::platform_store::PlatformStore;
use chrono::{Duration, Utc};
use openssl::rsa::Rsa;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const ISS: &str = "https://lms.example.com";
pub const FAKE_STATE: &str = "state";
pub const FAKE_NONCE: &str = "nonce";
pub const JWK_PASSPHRASE: &str = "1235asdffj#4$##!~*&)";

pub struct MockPlatformStore {
  pub jwks_url: String,
  pub oidc_url: String,
  pub token_url: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MockJwt {
  pub iss: String,
  pub exp: i64,
  pub iat: i64,
}
pub struct MockJwtStore<'a> {
  pub key_store: &'a dyn KeyStore,
}

impl JwtStore for MockJwtStore<'_> {
  fn build_jwt(&self, _id_token: &IdToken) -> Result<String, SecureError> {
    let jwt = MockJwt {
      iss: "https://www.example.com".to_string(),
      iat: Utc::now().timestamp(),
      exp: (Utc::now() + Duration::minutes(300)).timestamp(),
    };
    let encoded = encode_using_store(&jwt, self.key_store)?;
    Ok(encoded)
  }
}

pub struct MockKeyStore {
  pub keys: HashMap<String, Rsa<openssl::pkey::Private>>,
}

impl KeyStore for MockKeyStore {
  fn get_current_keys(
    &self,
    _limit: i64,
  ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
    Ok(self.keys.clone())
  }

  fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
    let keys = self.get_current_keys(1)?;
    keys.into_iter().next().ok_or(SecureError::EmptyKeys)
  }

  fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
    let keys = self.get_current_keys(1)?;
    keys.get(kid).cloned().ok_or(SecureError::InvalidKeyId)
  }
}

impl Default for MockKeyStore {
  fn default() -> Self {
    let mut keys = HashMap::new();
    let kid = Uuid::new_v4().to_string();
    keys.insert(kid, Rsa::generate(2048).unwrap());
    Self { keys }
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

pub fn create_mock_platform_store(url: &str) -> MockPlatformStore {
  let store: MockPlatformStore = MockPlatformStore {
    jwks_url: format!("{}{}", url, "/jwks"),
    token_url: format!("{}{}", url, "/token"),
    oidc_url: format!("{}{}", url, "/oidc"),
  };

  store
}

pub fn generate_id_token(target_link_uri: &str) -> IdToken {
  let aud = "4312".to_string();
  IdToken {
    target_link_uri: target_link_uri.to_string(),
    resource_link: Some(ResourceLinkClaim {
      id: "123".to_string(),
      description: None,
      title: None,
      validation_context: None,
      errors: None,
    }),
    auds: None,
    azp: Some(aud.clone()),
    aud: aud.clone(),
    lti_version: "1.3".to_string(),
    nonce: FAKE_NONCE.to_string(),
    ..Default::default()
  }
}
