use crate::{errors::AppError, stores::tool_jwt_store::ToolJwt, AppState};
use atomic_lti::jwt::decode_using_store;
use axum::{
  extract::{FromRef, FromRequestParts},
  http::request::Parts,
};
use std::sync::Arc;

/// JWT claims extractor for authenticated routes
/// Validates JWT token and extracts claims for use in handlers
#[derive(Clone)]
pub struct JwtClaims {
  pub claims: ToolJwt,
}

impl JwtClaims {
  #[allow(dead_code)] // Public API
  pub fn client_id(&self) -> &str {
    &self.claims.client_id
  }

  #[allow(dead_code)] // Public API
  pub fn platform_iss(&self) -> &str {
    &self.claims.platform_iss
  }

  #[allow(dead_code)] // Public API
  pub fn deployment_id(&self) -> &str {
    &self.claims.deployment_id
  }
}

impl<S> FromRequestParts<S> for JwtClaims
where
  S: Send + Sync,
  Arc<AppState>: FromRef<S>,
{
  type Rejection = AppError;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let app_state = Arc::<AppState>::from_ref(state);

    // Extract JWT token from Authorization header
    let token = parts
      .headers
      .get("authorization")
      .and_then(|h| h.to_str().ok())
      .and_then(|s| s.strip_prefix("Bearer "))
      .ok_or_else(|| AppError::Custom("Missing or invalid Authorization header".to_string()))?;

    // Validate JWT using the key store
    let token_data = decode_using_store::<ToolJwt>(token, &*app_state.key_store)
      .await
      .map_err(|e| AppError::Custom(format!("JWT validation failed: {e}")))?;

    Ok(Self {
      claims: token_data.claims,
    })
  }
}
