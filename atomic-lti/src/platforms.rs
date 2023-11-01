use crate::errors::PlatformError;
use cached::proc_macro::cached;
use jsonwebtoken::jwk::JwkSet;
use phf::phf_map;
use reqwest::{header, Client};
use serde::{Deserialize, Serialize};

pub trait PlatformStore {
  fn get_oidc_url(&self) -> Result<String, PlatformError>;
  fn get_jwk_server_url(&self) -> Result<String, PlatformError>;
  fn get_token_url(&self) -> Result<String, PlatformError>;
}

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

impl PlatformStore for StaticPlatformStore<'_> {
  fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
    let platform = self.get_platform()?;
    Ok(platform.jwks_url.to_string())
  }

  fn get_oidc_url(&self) -> Result<String, PlatformError> {
    let platform = self.get_platform()?;
    Ok(platform.oidc_url.to_string())
  }

  fn get_token_url(&self) -> Result<String, PlatformError> {
    let platform = self.get_platform()?;
    Ok(platform.token_url.to_string())
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
  sync_writes = true, // When called concurrently, duplicate argument-calls will be synchronized so as to only run once
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

  #[test]
  fn test_get_jwk_server_url() {
    let result = TEST_STORE.get_jwk_server_url();
    assert!(result.is_ok());

    let jwk_server_url = result.unwrap();
    assert_eq!(jwk_server_url, "https://lms.example.com/jwks");
  }

  #[test]
  fn test_get_oidc_url() {
    let result = TEST_STORE.get_oidc_url();
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

  #[test]
  fn test_get_jwk_server_url_invalid_iss() {
    let result = INVALID_TEST_STORE.get_jwk_server_url();
    assert!(result.is_err());

    let error = result.unwrap_err();
    assert_eq!(
      error,
      PlatformError::InvalidIss("https://invalid.com".to_string())
    );
  }

  #[test]
  fn test_get_oidc_url_invalid_iss() {
    let result = INVALID_TEST_STORE.get_oidc_url();
    assert!(result.is_err());

    let error = result.unwrap_err();
    assert_eq!(
      error,
      PlatformError::InvalidIss("https://invalid.com".to_string())
    );
  }
}
