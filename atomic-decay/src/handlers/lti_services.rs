use crate::{errors::AppError, extractors::jwt_claims::JwtClaims, AppState};
use axum::{extract::State, response::{IntoResponse, Response}, routing::{get, post}, Json, Router};
use std::sync::Arc;
use atomic_lti::deep_linking::{ContentItem, DeepLinking};
use atomic_lti::stores::key_store::KeyStore;
use serde_json;

pub fn lti_service_routes(_arc_key_store: Arc<dyn KeyStore + Send + Sync>) -> Router<Arc<AppState>> {
  Router::new()
    .route("/lti_services/names_and_roles", get(names_and_roles))
    .route("/lti_services/sign_deep_link", post(sign_deep_link))
}

pub async fn names_and_roles(
  State(_state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
) -> Result<Response, AppError> {
  if let Some(_names_and_roles_endpoint_url) = &jwt_claims.claims.names_and_roles_endpoint_url {
    // TODO: Implement actual names and roles retrieval
    // The atomic_lti_tool_axum handler expects different parameters than what we have
    // This would need a custom implementation or wrapper
    Err(AppError::Custom(
      "Names and roles endpoint not yet implemented for this configuration".to_string(),
    ))
  } else {
    Err(AppError::Custom(
      "No names and roles endpoint URL found in JWT".to_string(),
    ))
  }
}

// This is a helper API that handles signing a deep link request.
// It returns a JWT to the client that can be sent to the platform.
pub async fn sign_deep_link(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Json(content_items): Json<Vec<ContentItem>>,
) -> Result<Response, AppError> {
  // Get the current key for signing
  let (kid, rsa_key) = state.key_store.get_current_key()
    .map_err(|e| AppError::Custom(format!("Failed to get signing key: {}", e)))?;
  
  // Create deep link JWT
  let deep_link_jwt = DeepLinking::create_deep_link_jwt(
    &jwt_claims.claims.client_id,
    &jwt_claims.claims.iss,
    &jwt_claims.claims.deployment_id,
    &content_items,
    jwt_claims.claims.deep_link_claim_data,
    &kid,
    rsa_key,
  )
  .map_err(|e| AppError::Custom(format!("Failed to create deep link JWT: {}", e)))?;
  
  Ok(Json(serde_json::json!({
    "jwt": deep_link_jwt
  })).into_response())
}

