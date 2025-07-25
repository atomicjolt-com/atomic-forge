use actix_web::{HttpResponse, ResponseError};
use atomic_lti::errors::{
  AtomicError, DynamicRegistrationError, OIDCError, PlatformError, SecureError,
};
use serde::{Deserialize, Serialize};
use serde_json::Error as JSONError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum AtomicToolError {
  #[error("{0}")]
  Internal(String),

  #[error("Unauthorized request. {0}")]
  Unauthorized(String),

  #[error("Invalid request. {0}")]
  InvalidRequest(String),

  #[error("Missing permissions. {0}")]
  InsufficientPermissions(String),
}

impl From<SecureError> for AtomicToolError {
  fn from(err: SecureError) -> AtomicToolError {
    AtomicToolError::Internal(err.to_string())
  }
}

impl From<PlatformError> for AtomicToolError {
  fn from(err: PlatformError) -> AtomicToolError {
    AtomicToolError::Internal(err.to_string())
  }
}

impl From<OIDCError> for AtomicToolError {
  fn from(err: OIDCError) -> AtomicToolError {
    AtomicToolError::Internal(err.to_string())
  }
}

impl From<JSONError> for AtomicToolError {
  fn from(err: JSONError) -> AtomicToolError {
    AtomicToolError::Internal(err.to_string())
  }
}

impl From<AtomicError> for AtomicToolError {
  fn from(err: AtomicError) -> AtomicToolError {
    AtomicToolError::Internal(err.to_string())
  }
}

impl From<DynamicRegistrationError> for AtomicToolError {
  fn from(err: DynamicRegistrationError) -> AtomicToolError {
    AtomicToolError::InvalidRequest(err.to_string())
  }
}

impl ResponseError for AtomicToolError {
  fn error_response(&self) -> HttpResponse {
    match self {
      AtomicToolError::Internal(msg) => HttpResponse::InternalServerError().body(msg.to_owned()),
      AtomicToolError::Unauthorized(msg) => HttpResponse::Unauthorized().body(msg.to_owned()),
      AtomicToolError::InsufficientPermissions(msg) => {
        HttpResponse::Unauthorized().body(msg.to_owned())
      }
      AtomicToolError::InvalidRequest(msg) => HttpResponse::BadRequest().body(msg.to_owned()),
    }
  }

  fn status_code(&self) -> actix_web::http::StatusCode {
    match self {
      AtomicToolError::Internal(_) => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
      AtomicToolError::Unauthorized(_) => actix_web::http::StatusCode::UNAUTHORIZED,
      AtomicToolError::InsufficientPermissions(_) => actix_web::http::StatusCode::UNAUTHORIZED,
      AtomicToolError::InvalidRequest(_) => actix_web::http::StatusCode::BAD_REQUEST,
    }
  }
}
