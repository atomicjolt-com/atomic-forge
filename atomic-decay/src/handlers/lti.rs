use crate::stores::db_dynamic_registration::DBDynamicRegistrationStore;
use crate::stores::db_key_store::DBKeyStore;
use crate::stores::db_oidc_state_store::DBOIDCStateStore;
use crate::stores::tool_jwt_store::ToolJwtStore;
use crate::AppState;
use atomic_lti::dynamic_registration::{
  DynamicRegistrationFinishParams, DynamicRegistrationParams,
};
use atomic_lti::platforms::StaticPlatformStore;
use atomic_lti::stores::dynamic_registration_store::DynamicRegistrationStore;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::stores::platform_store::PlatformStore;
use atomic_lti::dynamic_registration::{
  request_platform_config, validate_platform_config, register_tool,
};
use atomic_lti::jwks::get_current_jwks;
use atomic_lti_tool::html::build_html;
use atomic_lti_tool_axum::errors::ToolError;
use atomic_lti_tool_axum::{InitParams, LaunchParams, RedirectParams};
use axum::{
  extract::{Form, Query, State},
  http::HeaderMap,
  response::{Html, Json},
};
use axum_extra::extract::CookieJar;
use std::sync::Arc;

// Handler implementations
pub async fn init_get(
  State(state): State<Arc<AppState>>,
  Query(params): Query<InitParams>,
  jar: CookieJar,
  headers: HeaderMap,
) -> Result<(CookieJar, Html<String>), ToolError> {
  init_handler(state, params, jar, headers).await
}

#[axum::debug_handler]
pub async fn init_post(
  State(state): State<Arc<AppState>>,
  jar: CookieJar,
  headers: HeaderMap,
  Form(params): Form<InitParams>,
) -> Result<(CookieJar, Html<String>), ToolError> {
  init_handler(state, params, jar, headers).await
}

// Common init handler logic
async fn init_handler(
  state: Arc<AppState>,
  params: InitParams,
  jar: CookieJar,
  headers: HeaderMap,
) -> Result<(CookieJar, Html<String>), ToolError> {
  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost");

  let hashed_script_name = state
    .assets
    .get("app-init.ts")
    .ok_or_else(|| ToolError::NotFound("app-init.ts not found in assets".to_string()))?;

  let oidc_state_store = DBOIDCStateStore::create(&state.pool)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;
  let platform_store = StaticPlatformStore { iss: &params.iss };

  // Get OIDC URL from platform
  let platform_oidc_url = platform_store
    .get_oidc_url()
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  let redirect_url = format!("https://{}/lti/redirect", host);

  // Get nonce and state
  let nonce = oidc_state_store.get_nonce().await;
  let state = oidc_state_store.get_state().await;

  // Build authorization URL
  let response_url = atomic_lti::oidc::build_response_url(
    &platform_oidc_url,
    &redirect_url,
    &params.login_hint,
    &params.lti_message_hint,
    &params.client_id,
    &nonce,
    &state,
  )
  .map_err(|e| ToolError::Internal(e.to_string()))?;

  // Build LTI storage params
  let lti_storage_params = atomic_lti::platform_storage::LTIStorageParams {
    target: params.lti_storage_target.clone().unwrap_or_default(),
    platform_oidc_url: platform_oidc_url.clone(),
  };

  // Create settings for the client
  let _settings = serde_json::json!({
    "state": state,
    "responseUrl": response_url.to_string(),
    "ltiStorageParams": lti_storage_params,
  });

  // Build HTML response
  let html = build_html("LTI Init", hashed_script_name);

  // Set OIDC state in cookie
  let state_cookie = cookie::Cookie::build(("lti_state", state.clone()))
    .path("/")
    .secure(true)
    .http_only(true)
    .same_site(cookie::SameSite::None)
    .build();

  let jar = jar.add(state_cookie);

  Ok((jar, Html(html)))
}

pub async fn redirect(
  State(state): State<Arc<AppState>>,
  _jar: CookieJar,
  Form(params): Form<RedirectParams>,
) -> Result<Html<String>, ToolError> {
  let oidc_state_store = DBOIDCStateStore::init(&state.pool, &params.state)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;
  let iss = atomic_lti::id_token::IdToken::extract_iss(&params.id_token)
    .map_err(|_| ToolError::BadRequest("Invalid ID token".to_string()))?;
  let _platform_store = StaticPlatformStore { iss: &iss };

  // Verify state matches
  if oidc_state_store.get_state().await != params.state {
    return Err(ToolError::BadRequest("Invalid state".to_string()));
  }

  // Build launch URL with parameters
  let lti_storage_target = params.lti_storage_target.clone().unwrap_or_else(|| "".to_string());
  
  let launch_url = format!(
    "/lti/launch?state={}&id_token={}&lti_storage_target={}",
    urlencoding::encode(&params.state),
    urlencoding::encode(&params.id_token),
    urlencoding::encode(&lti_storage_target)
  );

  // Create settings for redirect
  let _settings = serde_json::json!({
    "launchUrl": launch_url,
    "ltiStorageTarget": lti_storage_target,
  });

  // Build HTML that will redirect to launch
  let html = build_html(
    "LTI Redirect",
    "", // No script needed for redirect
  );

  Ok(Html(html))
}

#[axum::debug_handler]
pub async fn launch(
  State(state): State<Arc<AppState>>,
  headers: HeaderMap,
  Form(params): Form<LaunchParams>,
) -> Result<Html<String>, ToolError> {
  let oidc_state_store = DBOIDCStateStore::init(&state.pool, &params.state)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;
  let iss = atomic_lti::id_token::IdToken::extract_iss(&params.id_token)
    .map_err(|_| ToolError::BadRequest("Invalid ID token".to_string()))?;
  let platform_store = StaticPlatformStore { iss: &iss };

  let hashed_script_name = state
    .assets
    .get("app.ts")
    .ok_or_else(|| ToolError::NotFound("app.ts not found in assets".to_string()))?;

  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost")
    .to_string();

  let key_store = Arc::new(DBKeyStore::new(&state.pool, &state.jwk_passphrase));
  let jwt_store = ToolJwtStore {
    key_store: key_store.clone(),
    host: host.clone(),
  };

  // Get the JWK set from the platform and decode the ID token
  let jwk_server_url = platform_store
    .get_jwk_server_url()
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get JWK server URL: {}", e)))?;
  
  let jwk_set = atomic_lti::platforms::get_jwk_set(jwk_server_url)
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get JWK set: {}", e)))?;
  
  let decoded_id_token = atomic_lti::jwks::decode(&params.id_token, &jwk_set)
    .map_err(|e| ToolError::Unauthorized(format!("Invalid ID token: {}", e)))?;
  
  // Validate the launch
  atomic_lti::validate::validate_launch(&params.state, &oidc_state_store, &decoded_id_token)
    .await
    .map_err(|e| ToolError::Unauthorized(format!("Launch validation failed: {}", e)))?;

  // Create JWT for the tool
  let tool_jwt = jwt_store
    .build_jwt(&decoded_id_token)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  // Create settings for the launch
  let _settings = serde_json::json!({
    "jwt": tool_jwt,
    "ltiStorageTarget": params.lti_storage_target,
    "idToken": params.id_token,
  });

  // Build HTML for the launch
  let html = build_html("LTI Launch", hashed_script_name);

  // Clean up the OIDC state
  let _ = oidc_state_store.destroy().await;

  Ok(Html(html))
}

pub async fn jwks(
  State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ToolError> {
  let key_store = DBKeyStore::new(&state.pool, &state.jwk_passphrase);
  let jwks = get_current_jwks(&key_store)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;
  
  // Convert Jwks struct to serde_json::Value
  let jwks_value = serde_json::to_value(&jwks)
    .map_err(|e| ToolError::Internal(e.to_string()))?;
  
  Ok(Json(jwks_value))
}

pub async fn register(
  State(state): State<Arc<AppState>>,
  Query(params): Query<DynamicRegistrationParams>,
) -> Result<Html<String>, ToolError> {
  let dynamic_registration_store = DBDynamicRegistrationStore::new(&state.pool);
  let registration_token = params.registration_token.clone().unwrap_or_default();
  let registration_finish_path = "/lti/registration/finish";

  // Get the configuration from the Platform
  let platform_config = request_platform_config(&params.openid_configuration)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  // Validate issuer
  validate_platform_config(&platform_config, &params.openid_configuration)
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  let html = dynamic_registration_store.registration_html(
    &platform_config,
    registration_finish_path,
    &registration_token,
  );

  Ok(Html(html))
}

#[axum::debug_handler]
pub async fn registration_finish(
  State(state): State<Arc<AppState>>,
  headers: HeaderMap,
  Form(params): Form<DynamicRegistrationFinishParams>,
) -> Result<Html<String>, ToolError> {
  // Extract host and scheme from headers
  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost");

  // Try to determine scheme from headers
  let scheme = headers
    .get("x-forwarded-proto")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("https");

  let current_url = format!("{}://{}", scheme, host);
  let dynamic_registration_store = DBDynamicRegistrationStore::new(&state.pool);
  let registration_token = params.registration_token.clone().unwrap_or_default();
  let product_family_code = params.product_family_code.clone().unwrap_or_default();

  let client_registration_request = dynamic_registration_store
    .get_client_registration_request(&current_url, &product_family_code)
    .map_err(|e| ToolError::Internal(e.to_string()))?;
    
  // Send a request to the provider to register the tool
  let platform_response = register_tool(
    &params.registration_endpoint,
    &registration_token,
    &client_registration_request,
  )
  .await
  .map_err(|e| ToolError::Internal(e.to_string()))?;

  // Pass the response back to the store so that any required data can be saved
  dynamic_registration_store
    .handle_platform_response(platform_response)
    .map_err(|e| ToolError::Internal(e.to_string()))?;
    
  let html = dynamic_registration_store.complete_html();

  Ok(Html(html))
}
