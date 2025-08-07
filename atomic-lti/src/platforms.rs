use crate::{
  errors::PlatformError,
  stores::platform_store::{PlatformData, PlatformStore},
};
use async_trait::async_trait;
use cached::proc_macro::cached;
use jsonwebtoken::jwk::JwkSet;
use phf::phf_map;
use reqwest::{header, Client};
use serde::{Deserialize, Serialize};
use tokio::time::Duration;

pub const USER_AGENT: &str =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible;) LTI JWK Requester";

pub const CANVAS_PUBLIC_JWKS_URL: &str = "https://sso.canvaslms.com/api/lti/security/jwks";
pub const CANVAS_OIDC_URL: &str = "https://sso.canvaslms.com/api/lti/authorize_redirect";
pub const CANVAS_AUTH_TOKEN_URL: &str = "https://sso.canvaslms.com/login/oauth2/token";

pub const CANVAS_BETA_PUBLIC_JWKS_URL: &str =
  "https://sso.beta.canvaslms.com/api/lti/security/jwks";
pub const CANVAS_BETA_AUTH_TOKEN_URL: &str = "https://sso.beta.canvaslms.com/login/oauth2/token";
pub const CANVAS_BETA_OIDC_URL: &str = "https://sso.beta.canvaslms.com/api/lti/authorize_redirect";

pub const CANVAS_SUBMISSION_TYPE: &str = "https://canvas.instructure.com/lti/submission_type";

#[derive(Debug, Deserialize, Serialize)]
pub struct Platform<'a> {
  pub iss: &'a str,
  pub jwks_url: &'a str,
  pub token_url: &'a str,
  pub oidc_url: &'a str,
}

static PLATFORMS: phf::Map<&'static str, Platform> = phf_map! {
  "https://canvas.instructure.com" =>
  Platform {
    iss: "https://canvas.instructure.com",
    jwks_url: CANVAS_PUBLIC_JWKS_URL,
    token_url: CANVAS_AUTH_TOKEN_URL,
    oidc_url: CANVAS_OIDC_URL,
  },
  "https://canvas.beta.instructure.com" =>
  Platform {
    iss: "https://canvas.beta.instructure.com",
    jwks_url: CANVAS_BETA_PUBLIC_JWKS_URL,
    token_url: CANVAS_BETA_AUTH_TOKEN_URL,
    oidc_url: CANVAS_BETA_OIDC_URL,
  },
  "https://schoology.schoology.com" =>
  Platform {
    iss: "https://schoology.schoology.com",
    jwks_url: "https://lti-service.svc.schoology.com/lti-service/.well-known/jwks",
    token_url: "https://lti-service.svc.schoology.com/lti-service/access-token",
    oidc_url: "https://lti-service.svc.schoology.com/lti-service/authorize-redirect",
  },
  "https://ltiadvantagevalidator.imsglobal.org" =>
  Platform {
    iss: "https://ltiadvantagevalidator.imsglobal.org",
    jwks_url: "https://oauth2server.imsglobal.org/jwks",
    token_url: "https://ltiadvantagevalidator.imsglobal.org/ltitool/authcodejwt.html",
    oidc_url: "https://ltiadvantagevalidator.imsglobal.org/ltitool/oidcauthurl.html",
  },
  "https://build.1edtech.org" =>
  Platform {
    iss: "https://build.1edtech.org",
    jwks_url: "https://build.1edtech.org/jwks",
    token_url: "https://build.1edtech.org/auth",
    oidc_url: "https://build.1edtech.org/oidc",
  },
  "https://lms.example.com" =>
  Platform {
    iss: "https://lms.example.com",
    jwks_url: "https://lms.example.com/jwks",
    token_url: "https://lms.example.com/auth",
    oidc_url: "https://lms.example.com/oidc",
  },
};

pub struct StaticPlatformStore<'a> {
  pub iss: &'a str,
}

#[async_trait]
impl PlatformStore for StaticPlatformStore<'_> {
  async fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
    let platform = self.get_platform()?;
    Ok(platform.jwks_url.to_string())
  }

  async fn get_oidc_url(&self) -> Result<String, PlatformError> {
    let platform = self.get_platform()?;
    Ok(platform.oidc_url.to_string())
  }

  async fn get_token_url(&self) -> Result<String, PlatformError> {
    let platform = self.get_platform()?;
    Ok(platform.token_url.to_string())
  }

  async fn create(&self, _platform: PlatformData) -> Result<PlatformData, PlatformError> {
    Err(PlatformError::UnsupportedOperation(
      "StaticPlatformStore does not support create operations".to_string(),
    ))
  }

  async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError> {
    match PLATFORMS.get(issuer) {
      Some(platform) => Ok(Some(PlatformData {
        issuer: platform.iss.to_string(),
        name: None,
        jwks_url: platform.jwks_url.to_string(),
        token_url: platform.token_url.to_string(),
        oidc_url: platform.oidc_url.to_string(),
      })),
      None => Ok(None),
    }
  }

  async fn update(
    &self,
    _issuer: &str,
    _platform: PlatformData,
  ) -> Result<PlatformData, PlatformError> {
    Err(PlatformError::UnsupportedOperation(
      "StaticPlatformStore does not support update operations".to_string(),
    ))
  }

  async fn delete(&self, _issuer: &str) -> Result<(), PlatformError> {
    Err(PlatformError::UnsupportedOperation(
      "StaticPlatformStore does not support delete operations".to_string(),
    ))
  }

  async fn list(&self) -> Result<Vec<PlatformData>, PlatformError> {
    let platforms: Vec<PlatformData> = PLATFORMS
      .values()
      .map(|p| PlatformData {
        issuer: p.iss.to_string(),
        name: None,
        jwks_url: p.jwks_url.to_string(),
        token_url: p.token_url.to_string(),
        oidc_url: p.oidc_url.to_string(),
      })
      .collect();
    Ok(platforms)
  }
}

impl StaticPlatformStore<'_> {
  fn get_platform(&self) -> Result<&Platform, PlatformError> {
    let platform = PLATFORMS
      .get(self.iss)
      .ok_or(PlatformError::InvalidIss(self.iss.to_string()))?;
    Ok(platform)
  }
}

#[cached(
  time = 3600, // 1 hour
  result = true, // Only "Ok" results are cached
  sync_writes = "default", // When called concurrently, duplicate argument-calls will be synchronized so as to only run once
)]
pub async fn get_jwk_set(jwk_server_url: String) -> Result<JwkSet, PlatformError> {
  let client = Client::new();
  let resp = client
    .get(jwk_server_url)
    .header(header::USER_AGENT, USER_AGENT)
    .send()
    .await
    .map_err(|e| PlatformError::JWKSRequestFailed(e.to_string()))?;

  let jwks_resp = resp
    .text()
    .await
    .map_err(|e| PlatformError::JWKSRequestFailed(e.to_string()))?;

  let jwks: JwkSet = serde_json::from_str(&jwks_resp)
    .map_err(|e| PlatformError::JWKSRequestFailed(e.to_string()))?;

  Ok(jwks)
}

#[cfg(test)]
mod tests {
  use super::*;

  const TEST_STORE: StaticPlatformStore = StaticPlatformStore {
    iss: "https://lms.example.com",
  };

  const INVALID_TEST_STORE: StaticPlatformStore = StaticPlatformStore {
    iss: "https://invalid.com",
  };

  #[test]
  fn test_get_platform() {
    let result = TEST_STORE.get_platform();
    assert!(result.is_ok());

    let platform = result.unwrap();
    assert_eq!(platform.iss, "https://lms.example.com");
    assert_eq!(platform.jwks_url, "https://lms.example.com/jwks");
    assert_eq!(platform.oidc_url, "https://lms.example.com/oidc");
  }

  #[tokio::test]
  async fn test_get_jwk_server_url() {
    let result = TEST_STORE.get_jwk_server_url().await;
    assert!(result.is_ok());

    let jwk_server_url = result.unwrap();
    assert_eq!(jwk_server_url, "https://lms.example.com/jwks");
  }

  #[tokio::test]
  async fn test_get_oidc_url() {
    let result = TEST_STORE.get_oidc_url().await;
    assert!(result.is_ok());

    let platform_oidc_url = result.unwrap();
    assert_eq!(platform_oidc_url, "https://lms.example.com/oidc");
  }

  #[test]
  fn test_get_platform_invalid_iss() {
    let result = INVALID_TEST_STORE.get_platform();
    assert!(result.is_err());

    let error = result.unwrap_err();
    assert_eq!(
      error,
      PlatformError::InvalidIss("https://invalid.com".to_string())
    );
  }

  #[tokio::test]
  async fn test_get_jwk_server_url_invalid_iss() {
    let result = INVALID_TEST_STORE.get_jwk_server_url().await;
    assert!(result.is_err());

    let error = result.unwrap_err();
    assert_eq!(
      error,
      PlatformError::InvalidIss("https://invalid.com".to_string())
    );
  }

  #[tokio::test]
  async fn test_get_oidc_url_invalid_iss() {
    let result = INVALID_TEST_STORE.get_oidc_url().await;
    assert!(result.is_err());

    let error = result.unwrap_err();
    assert_eq!(
      error,
      PlatformError::InvalidIss("https://invalid.com".to_string())
    );
  }
}
