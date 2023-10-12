use actix_web::{HttpResponse, ResponseError};
use atomic_lti::errors::{JwkError, JwtError, OIDCError, PlatformError};
use serde::{Deserialize, Serialize};
use serde_json::Error as JSONError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum AtomicToolError {
  #[error("{0}")]
  Internal(String),
}

impl From<JwkError> for AtomicToolError {
  fn from(err: JwkError) -> AtomicToolError {
    AtomicToolError::Internal(err.to_string())
  }
}

impl From<JwtError> for AtomicToolError {
  fn from(err: JwtError) -> AtomicToolError {
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

impl ResponseError for AtomicToolError {
  fn error_response(&self) -> HttpResponse {
    match self {
      AtomicToolError::Internal(msg) => HttpResponse::InternalServerError().body(msg.to_owned()),
    }
  }

  fn status_code(&self) -> reqwest::StatusCode {
    reqwest::StatusCode::INTERNAL_SERVER_ERROR
  }
}
