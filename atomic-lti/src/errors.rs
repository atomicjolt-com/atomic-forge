use serde::{Deserialize, Serialize};
use thiserror::Error;

//
// General error
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum AtomicError {
  #[error("{0}")]
  Internal(String),
}

//
// Secure errors this includes JWK and JWT errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum SecureError {
  #[error("Unable to decode JWT Token: {0}")]
  CannotDecodeJwtToken(String),

  #[error("Unable to encode JWT Token: {0}")]
  CannotEncodeJwtToken(String),

  #[error("Only RSA keys are supported for LTI Id Tokens")]
  InvalidEncoding,

  #[error("There was a problem with the key: {0}")]
  KeyError(String),

  #[error("Key Id error: {0}")]
  InvalidKeyIdError(String),

  #[error("Unable to generate a new JWK: {0}")]
  JWKGenerateFailed(String),

  #[error("Unable to parse JWK json: {0}")]
  JWKSetParseFailed(String),

  #[error("There was a problem with the private key: {0}")]
  PrivateKeyError(String),

  #[error("Unable to generate a new private key: {0}")]
  PrivateKeyGenerateFailed(String),

  #[error("There are currently no keys available")]
  EmptyKeys,

  #[error("The requested key does not exist")]
  InvalidKeyId,
}

impl From<openssl::error::ErrorStack> for SecureError {
  fn from(error: openssl::error::ErrorStack) -> Self {
    SecureError::KeyError(error.to_string())
  }
}

impl From<jsonwebtoken::errors::Error> for SecureError {
  fn from(err: jsonwebtoken::errors::Error) -> Self {
    SecureError::KeyError(err.to_string())
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
  #[error("Operation not supported: {0}")]
  UnsupportedOperation(String),
}

impl From<SecureError> for PlatformError {
  fn from(err: SecureError) -> PlatformError {
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
// Client credentials errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum ClientCredentialsError {
  #[error("There was a problem requesting client credentials: {0}")]
  RequestFailed(String),

  #[error("Client credential requests have been rate limited: {0}")]
  RateLimited(String),

  #[error("Multiple attempts to request an access token failed: {0}")]
  RequestLimitReached(String),
}

//
// Names and roles errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum NamesAndRolesError {
  #[error("There was a problem requesting names and roles. {0}")]
  RequestFailed(String),
}

//
// Dynamic registration errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum DynamicRegistrationError {
  #[error("There was a problem with the registration configuration. {0}")]
  InvalidConfig(String),

  #[error("There was a problem with the registration request. {0}")]
  RequestFailed(String),
}

impl From<AtomicError> for DynamicRegistrationError {
  fn from(error: AtomicError) -> Self {
    DynamicRegistrationError::RequestFailed(error.to_string())
  }
}

//
// Dynamic registration errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum AssignmentGradeServicesError {
  #[error("There was a problem with the assignment grade services request. {0}")]
  RequestFailed(String),
}

impl From<AtomicError> for AssignmentGradeServicesError {
  fn from(error: AtomicError) -> Self {
    AssignmentGradeServicesError::RequestFailed(error.to_string())
  }
}

//
// Registration errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum RegistrationError {
  #[error("Registration not found: {0}")]
  NotFound(String),

  #[error("Registration already exists: {0}")]
  AlreadyExists(String),

  #[error("Invalid registration data: {0}")]
  InvalidData(String),

  #[error("Database error: {0}")]
  DatabaseError(String),

  #[error("Registration store error: {0}")]
  StoreError(String),
}
