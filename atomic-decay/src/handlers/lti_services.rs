use crate::{errors::AppError, AppState};
use axum::{extract::State, http::{HeaderMap, StatusCode}, response::{IntoResponse, Response}, routing::{get, post}, Router};
use std::sync::Arc;
use atomic_lti::deep_linking::ContentItem;
use atomic_lti::stores::key_store::KeyStore;

pub fn lti_service_routes(_arc_key_store: Arc<dyn KeyStore>) -> Router<Arc<AppState>> {
  // TODO: Implement JWT authentication middleware for Axum
  Router::new()
    .route("/lti_services/names_and_roles", get(names_and_roles))
    .route("/lti_services/sign_deep_link", post(sign_deep_link))
}

pub async fn names_and_roles(State(_state): State<Arc<AppState>>, _headers: HeaderMap) -> Result<Response, AppError> {
  // TODO: Implement JWT extraction from headers for Axum
  // let jwt = get_tool_jwt(&headers)?;
  // let static_platform_store = StaticPlatformStore {
  //   iss: &jwt.platform_iss,
  // };
  // let key_store = DBKeyStore::new(&state.pool, &state.jwk_passphrase);
  
  // if let Some(names_and_roles_endpoint_url) = &jwt.names_and_roles_endpoint_url {
  //   let result = lti_names_and_roles(
  //     &jwt.client_id,
  //     names_and_roles_endpoint_url,
  //     &static_platform_store,
  //     &key_store,
  //   )
  //   .await?;
  //   Ok(result)
  // } else {
  //   Err(AtomicToolError::InvalidRequest(
  
  // Temporary placeholder until JWT middleware is implemented
  Ok((StatusCode::NOT_IMPLEMENTED, "JWT middleware not yet implemented for Axum").into_response())
}

// This is a helper API that handles signing a deep link request.
// It returns a JWT to the client that can be sent to the platform.
pub async fn sign_deep_link(
  State(_state): State<Arc<AppState>>,
  _headers: HeaderMap,
  axum::Json(_params): axum::Json<Vec<ContentItem>>,
) -> Result<Response, AppError> {
  // TODO: Implement JWT extraction from headers for Axum
  // let jwt = get_tool_jwt(&headers)?;
  // let key_store = DBKeyStore::new(&state.pool, &state.jwk_passphrase);
  // let result = lti_sign_deep_link(
  //   &jwt.client_id,
  //   &jwt.platform_iss,
  //   &jwt.deployment_id,
  //   jwt.deep_link_claim_data,
  //   &params,
  //   &key_store,
  // )
  // .await?;
  // Ok(result)
  
  // Temporary placeholder until JWT middleware is implemented
  Ok((StatusCode::NOT_IMPLEMENTED, "JWT middleware not yet implemented for Axum").into_response())
}

// This is a helper function to get the JWT from the request
// TODO: Implement for Axum HeaderMap
// fn get_tool_jwt(headers: &HeaderMap) -> Result<ToolJwt, AtomicToolError> {
//   // Extract JWT from headers or request extensions
//   todo!("Implement JWT extraction for Axum")
// }
