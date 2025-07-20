use crate::{errors::AppError, AppState};
use axum::{
  extract::{FromRef, FromRequestParts},
  http::request::Parts,
};
use std::sync::Arc;

/// Application context extractor that provides common request data
/// This eliminates the need to extract State and headers in every handler
#[derive(Clone)]
pub struct AppContext {
  pub state: Arc<AppState>,
  pub host: String,
  pub scheme: String,
  pub user_agent: Option<String>,
}

impl AppContext {
  pub fn current_url(&self) -> String {
    format!("{}://{}", self.scheme, self.host)
  }
}

impl<S> FromRequestParts<S> for AppContext
where
  S: Send + Sync,
  Arc<AppState>: FromRef<S>,
{
  type Rejection = AppError;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let app_state = Arc::<AppState>::from_ref(state);

    let host = parts
      .headers
      .get("host")
      .and_then(|h| h.to_str().ok())
      .unwrap_or("localhost")
      .to_string();

    let scheme = parts
      .headers
      .get("x-forwarded-proto")
      .and_then(|h| h.to_str().ok())
      .unwrap_or("https")
      .to_string();

    let user_agent = parts
      .headers
      .get("user-agent")
      .and_then(|h| h.to_str().ok())
      .map(|s| s.to_string());

    Ok(AppContext {
      state: app_state,
      host,
      scheme,
      user_agent,
    })
  }
}
