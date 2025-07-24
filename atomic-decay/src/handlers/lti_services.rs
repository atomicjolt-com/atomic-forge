use crate::{errors::AppError, extractors::jwt_claims::JwtClaims, AppState};
use atomic_lti::client_credentials::request_service_token_cached;
use atomic_lti::deep_linking::{ContentItem, DeepLinking};
use atomic_lti::names_and_roles::{self, ListParams};
use atomic_lti::platforms::StaticPlatformStore;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti::stores::platform_store::PlatformStore;
use axum::{
  extract::State,
  response::{IntoResponse, Response},
  routing::{get, post},
  Json, Router,
};
use serde_json;
use std::sync::Arc;

pub fn lti_service_routes(
  _arc_key_store: Arc<dyn KeyStore + Send + Sync>,
) -> Router<Arc<AppState>> {
  Router::new()
    .route("/lti_services/names_and_roles", get(names_and_roles))
    .route("/lti_services/sign_deep_link", post(sign_deep_link))
}

pub async fn names_and_roles(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
) -> Result<Response, AppError> {
  // Check if names_and_roles_endpoint_url is available
  if let Some(names_and_roles_endpoint_url) = &jwt_claims.claims.names_and_roles_endpoint_url {
    // Get the current key for signing
    let (kid, rsa_key) = state
      .key_store
      .get_current_key()
      .map_err(|e| AppError::Custom(format!("Failed to get signing key: {e}")))?;

    // Create platform store to get token URL
    let iss_owned = jwt_claims.claims.platform_iss.clone();
    let platform_store = StaticPlatformStore {
      iss: Box::leak(iss_owned.into_boxed_str()),
    };

    let platform_token_url = platform_store
      .get_token_url()
      .map_err(|e| AppError::Custom(format!("Failed to get platform token URL: {e}")))?;

    // Request access token with names and roles scope
    let scope = "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";

    let auth_response = request_service_token_cached(
      &jwt_claims.claims.client_id,
      &platform_token_url,
      scope,
      &kid,
      rsa_key,
    )
    .await
    .map_err(|e| AppError::Custom(format!("Failed to get access token: {e}")))?;

    // Make the names and roles request
    let params = ListParams {
      role: None,
      limit: None,
      resource_link_id: None,
    };

    let (membership_container, _rel_next, _rel_differences) = names_and_roles::list(
      &auth_response.access_token,
      names_and_roles_endpoint_url,
      &params,
    )
    .await
    .map_err(|e| AppError::Custom(format!("Failed to fetch names and roles: {e}")))?;

    Ok(Json(membership_container).into_response())
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
  let (kid, rsa_key) = state
    .key_store
    .get_current_key()
    .map_err(|e| AppError::Custom(format!("Failed to get signing key: {e}")))?;

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
  .map_err(|e| AppError::Custom(format!("Failed to create deep link JWT: {e}")))?;

  Ok(
    Json(serde_json::json!({
      "jwt": deep_link_jwt
    }))
    .into_response(),
  )
}
