use serde::{Deserialize, Serialize};
use thiserror::Error;

//
// JWT errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum JwtError {
  #[error("Unable to decode JWT Token: {0}")]
  CannotDecodeJwtToken(String),

  #[error("Unable to encode JWT Token: {0}")]
  CannotEncodeJwtToken(String),

  #[error("Only RSA keys are supported for LTI Id Tokens")]
  InvalidEncoding,

  #[error("There was a problem with the private key: {0}")]
  PrivateKeyError(String),
}

//
// JWK errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum JwkError {
  #[error("Unable to generate a new JWK: {0}")]
  JWKGenerateFailed(String),

  #[error("Unable to parse JWK json: {0}")]
  JWKSetParseFailed(String),
}

impl From<SecureError> for JwkError {
  fn from(err: SecureError) -> JwkError {
    JwkError::JWKGenerateFailed(err.to_string())
  }
}

//
// Platform errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum PlatformError {
  #[error("Unable to resolve platform information for iss: {0}")]
  InvalidIss(String),
  #[error("Unable to retrieve JWKs from remote JWK server: {0}")]
  JWKSRequestFailed(String),
}

impl From<JwtError> for PlatformError {
  fn from(err: JwtError) -> PlatformError {
    PlatformError::InvalidIss(err.to_string())
  }
}

//
// OIDC errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum OIDCError {
  #[error("Allowed time has expired. Please launch the application again")]
  NonceExpired,

  #[error("Duplicate request. Please launch the application again")]
  NonceDuplicate,

  #[error("Invalid nonce")]
  NonceInvalid,

  #[error("Invalid state: {0}")]
  StateInvalid(String),

  #[error("OIDC store error: {0}")]
  StoreError(String),
}

//
// Secure errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum SecureError {
  #[error("There was a problem with the private key: {0}")]
  PrivateKeyError(String),

  #[error("Unable to generate a new private key: {0}")]
  PrivateKeyGenerateFailed(String),

  #[error("There are currently no keys available")]
  EmptyKeys,
}
