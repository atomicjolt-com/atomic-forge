use atomic_lti::errors::{OIDCError, PlatformError};
use atomic_lti::id_token::{IdToken, ResourceLinkClaim};
use atomic_lti::jwks::Jwks;
use atomic_lti::platforms::PlatformStore;
use atomic_lti::validate::OIDCStateStore;
use chrono::{Duration, Utc};

pub const ISS: &str = "https://lms.example.com";
pub const FAKE_STATE: &str = "state";
pub const FAKE_NONCE: &str = "nonce";
pub const JWK_PASSPHRASE: &str = "1235asdffj#4$##!~*&)";

pub struct MockPlatformStore {
  pub jwks_url: String,
  pub oidc_url: String,
  pub token_url: String,
}

impl PlatformStore for MockPlatformStore {
  fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
    Ok(self.jwks_url.to_string())
  }

  fn get_platform_oidc_url(&self) -> Result<String, PlatformError> {
    Ok(self.oidc_url.to_string())
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
  let id_token = IdToken {
    target_link_uri: target_link_uri.to_string(),
    resource_link: ResourceLinkClaim {
      id: "123".to_string(),
      description: None,
      title: None,
      validation_context: None,
      errors: None,
    },
    auds: vec!["example.com".to_string()],
    azp: "".to_string(),
    aud: vec!["example.com".to_string()],
    lti_version: "1.3".to_string(),
    nonce: FAKE_NONCE.to_string(),
    ..Default::default()
  };

  id_token
}
