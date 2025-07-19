use atomic_lti_tool_axum::errors::ToolError;
use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
  Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use thiserror::Error;

//
// DB errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum DBError {
  #[error("Unable to connect to database. {0}")]
  DBConnectFailed(String),

  #[error("Unable to get a database connection from the pool. {0}")]
  DBFailedToGetConnection(String),

  #[error("Database request failed. {0}")]
  DBRequestFailed(String),

  #[error("Error creating record. Invalid input. {0}")]
  InvalidInput(String),
}

//
// Application errors for Axum
//
#[derive(Error, Debug)]
pub enum AppError {
  #[error("Database error: {0}")]
  Database(#[from] diesel::result::Error),

  #[error("JSON error: {0}")]
  Json(#[from] serde_json::Error),

  #[error("Tool error: {0}")]
  Tool(#[from] ToolError),

  #[error("Configuration error: {0}")]
  Config(#[from] config::ConfigError),

  #[error("Environment error: {0}")]
  Env(#[from] std::env::VarError),

  #[error("IO error: {0}")]
  Io(#[from] std::io::Error),

  #[error("Request error: {0}")]
  Reqwest(#[from] reqwest::Error),

  #[error("JWT error: {0}")]
  Jwt(#[from] jsonwebtoken::errors::Error),

  #[error("UUID error: {0}")]
  Uuid(#[from] uuid::Error),

  #[error("Custom error: {0}")]
  Custom(String),

  #[error("DB error: {0}")]
  DB(#[from] DBError),
}

impl From<String> for AppError {
  fn from(e: String) -> Self {
    AppError::Custom(e)
  }
}

impl IntoResponse for AppError {
  fn into_response(self) -> Response {
    let (status, error_message) = match self {
      AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
      AppError::Json(_) => (StatusCode::BAD_REQUEST, "JSON error"),
      AppError::Tool(e) => (e.status_code(), "Tool error"),
      AppError::Config(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error"),
      AppError::Env(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Environment error"),
      AppError::Io(_) => (StatusCode::INTERNAL_SERVER_ERROR, "IO error"),
      AppError::Reqwest(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Request error"),
      AppError::Jwt(_) => (StatusCode::UNAUTHORIZED, "JWT error"),
      AppError::Uuid(_) => (StatusCode::BAD_REQUEST, "UUID error"),
      AppError::Custom(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Custom error"),
      AppError::DB(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
    };

    let body = Json(json!({
      "error": error_message,
    }));

    (status, body).into_response()
  }
}
