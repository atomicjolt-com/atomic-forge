use crate::stores::db_dynamic_registration::DBDynamicRegistrationStore;
use crate::stores::db_key_store::DBKeyStore;
use crate::stores::db_oidc_state_store::DBOIDCStateStore;
use crate::stores::db_platform_store::DBPlatformStore;
use crate::stores::tool_jwt_store::ToolJwtStore;
use crate::AppState;

use atomic_lti::dynamic_registration::{
  register_tool, request_platform_config, validate_platform_config,
};
use atomic_lti::dynamic_registration::{
  DynamicRegistrationFinishParams, DynamicRegistrationParams,
};
use atomic_lti::jwks::get_current_jwks;
use atomic_lti::stores::dynamic_registration_store::DynamicRegistrationStore;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::stores::platform_store::PlatformStore;
use atomic_lti_tool::handlers::init::InitParams;
use atomic_lti_tool::handlers::launch::{LaunchParams, LaunchSettings};
use atomic_lti_tool::handlers::redirect::RedirectParams;
use atomic_lti_tool::html::build_html;
use atomic_lti_tool_axum::errors::ToolError;
use axum::{
  extract::{Form, Query, State},
  http::HeaderMap,
  response::{Html, IntoResponse, Json, Redirect},
};
use axum_extra::extract::CookieJar;
use cookie::time::Duration;
use std::sync::Arc;

// Handler implementations
pub async fn init_get(
  State(state): State<Arc<AppState>>,
  Query(params): Query<InitParams>,
  jar: CookieJar,
  headers: HeaderMap,
) -> Result<impl IntoResponse, ToolError> {
  init_handler(state, params, jar, headers).await
}

#[axum::debug_handler]
pub async fn init_post(
  State(state): State<Arc<AppState>>,
  jar: CookieJar,
  headers: HeaderMap,
  Form(params): Form<InitParams>,
) -> Result<impl IntoResponse, ToolError> {
  init_handler(state, params, jar, headers).await
}

async fn init_handler(
  state: Arc<AppState>,
  params: InitParams,
  jar: CookieJar,
  headers: HeaderMap,
) -> Result<impl IntoResponse, ToolError> {
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
  let platform_store = DBPlatformStore::with_issuer(state.pool.clone(), params.iss.clone());

  // Get OIDC URL from platform
  let platform_oidc_url = platform_store
    .get_oidc_url()
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  let redirect_url = format!("https://{host}/lti/redirect");

  // Get nonce and state
  let nonce = oidc_state_store.get_nonce().await;
  let state = oidc_state_store.get_state().await;

  // Build authorization URL
  let response_url = atomic_lti::oidc::build_response_url(
    &platform_oidc_url,
    &state,
    &params.client_id,
    &params.login_hint,
    &params.lti_message_hint,
    &nonce,
    &redirect_url,
  )
  .map_err(|e| ToolError::Internal(e.to_string()))?;

  // Build LTI storage params
  let target = params.lti_storage_target.as_deref().unwrap_or("iframe");
  let lti_storage_params = atomic_lti::platform_storage::LTIStorageParams {
    target: target.to_string(),
    platform_oidc_url: platform_oidc_url.clone(),
  };

  // Build relaunch URL
  let relaunch_init_url = atomic_lti::oidc::build_relaunch_init_url(&response_url);

  // Create settings for the client
  let settings = serde_json::json!({
    "state": state,
    "responseUrl": response_url.to_string(),
    "ltiStorageParams": lti_storage_params,
    "relaunchInitUrl": relaunch_init_url,
    "openIdCookiePrefix": atomic_lti::constants::OPEN_ID_COOKIE_PREFIX,
  });

  // Build cookies
  let cookie_marker = cookie::Cookie::build((atomic_lti::constants::OPEN_ID_STORAGE_COOKIE, "1"))
    .domain(host.to_string())
    .path("/")
    .secure(true)
    .http_only(false)
    .same_site(cookie::SameSite::None)
    .max_age(Duration::seconds(356 * 24 * 60 * 60))
    .build();

  let cookie_state_name = format!("{}{}", atomic_lti::constants::OPEN_ID_COOKIE_PREFIX, state);
  let cookie_state = cookie::Cookie::build((cookie_state_name, "1"))
    .domain(host.to_string())
    .path("/")
    .secure(true)
    .http_only(false)
    .same_site(cookie::SameSite::None)
    .max_age(Duration::seconds(60))
    .build();

  // Check if cookies can be used
  let can_use_cookies = jar
    .get(atomic_lti::constants::OPEN_ID_STORAGE_COOKIE)
    .map(|c| c.value() == "1")
    .unwrap_or(false);

  let jar = jar.add(cookie_marker).add(cookie_state);

  if can_use_cookies {
    // Redirect directly to the response URL if cookies are supported
    Ok((jar, Redirect::temporary(response_url.as_ref())).into_response())
  } else {
    // Send an HTML page that will attempt to write a cookie and then redirect
    let settings_json =
      serde_json::to_string(&settings).map_err(|e| ToolError::Internal(e.to_string()))?;
    let head =
      format!(r#"<script type="text/javascript">window.INIT_SETTINGS = {settings_json};</script>"#);
    let body =
      format!(r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#);
    let html = build_html(&head, &body);

    Ok((jar, Html(html)).into_response())
  }
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
  let platform_store = DBPlatformStore::with_issuer(state.pool.clone(), iss.clone());

  // Get JWK set and decode token
  let jwk_server_url = platform_store
    .get_jwk_server_url()
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get JWK server URL: {e}")))?;
  let jwk_set = atomic_lti::platforms::get_jwk_set(jwk_server_url)
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get JWK set: {e}")))?;
  let decoded_token = atomic_lti::jwks::decode(&params.id_token, &jwk_set)
    .map_err(|e| ToolError::Unauthorized(format!("Invalid ID token: {e}")))?;

  // Validate launch
  atomic_lti::validate::validate_launch(&params.state, &oidc_state_store, &decoded_token)
    .await
    .map_err(|e| ToolError::Unauthorized(format!("Launch validation failed: {e}")))?;

  // Build HTML form that auto-submits to the target_link_uri
  let head = "";
  let lti_storage_target_input = match &params.lti_storage_target {
    Some(target) => {
      format!(r#"<input type="hidden" name="lti_storage_target" value="{target}" />"#)
    }
    None => "".to_string(),
  };

  let body = format!(
    r#"
    <form action="{}" method="POST">
      <input type="hidden" name="id_token" value="{}" />
      <input type="hidden" name="state" value="{}" />
      {}
    </form>
    <script>
      window.addEventListener("load", () => {{
        document.forms[0].submit();
      }});
    </script>
  "#,
    decoded_token.target_link_uri, params.id_token, params.state, lti_storage_target_input
  );

  let html = build_html(head, &body);

  Ok(Html(html))
}

// Helper function to get the full URL from headers
fn get_full_url(headers: &HeaderMap, path: &str) -> String {
  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost");

  let scheme = headers
    .get("x-forwarded-proto")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("https");

  format!("{scheme}://{host}{path}")
}

// Setup launch validates and prepares launch data
async fn setup_launch(
  platform_store: &DBPlatformStore,
  params: &LaunchParams,
  headers: &HeaderMap,
  jar: &CookieJar,
  oidc_state_store: &DBOIDCStateStore,
) -> Result<
  (
    atomic_lti::id_token::IdToken,
    bool,
    atomic_lti::platform_storage::LTIStorageParams,
  ),
  ToolError,
> {
  // Get JWK set and decode token
  let jwk_server_url = platform_store
    .get_jwk_server_url()
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get JWK server URL: {e}")))?;

  let jwk_set = atomic_lti::platforms::get_jwk_set(jwk_server_url)
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get JWK set: {e}")))?;

  let id_token = atomic_lti::jwks::decode(&params.id_token, &jwk_set)
    .map_err(|e| ToolError::Unauthorized(format!("Invalid ID token: {e}")))?;

  // Validate the launch
  atomic_lti::validate::validate_launch(&params.state, oidc_state_store, &id_token)
    .await
    .map_err(|e| ToolError::Unauthorized(format!("Launch validation failed: {e}")))?;

  // Clean up OIDC state
  let _ = oidc_state_store.destroy().await;

  // Validate target link URI matches the requested URL
  let requested_url = get_full_url(headers, "/lti/launch");
  let parsed_target_link_uri = url::Url::parse(&id_token.target_link_uri)
    .map_err(|e| ToolError::Unauthorized(format!("Invalid target link URI in ID token: {e}")))?;

  if parsed_target_link_uri.to_string() != requested_url {
    return Err(ToolError::Unauthorized(format!(
      "Invalid target link URI. Expected: {requested_url}, Got: {parsed_target_link_uri}"
    )));
  }

  // Check if state is verified via cookie
  let state_cookie_name = format!(
    "{}{}",
    atomic_lti::constants::OPEN_ID_COOKIE_PREFIX,
    &params.state
  );
  let state_verified = jar
    .get(&state_cookie_name)
    .map(|c| c.value() == "1")
    .unwrap_or(false);

  // Verify we can launch securely
  if params.lti_storage_target.is_empty() && !state_verified {
    return Err(ToolError::Unauthorized(
      "Unable to securely launch tool. Please ensure cookies are enabled".to_string(),
    ));
  }

  // Build LTI storage params
  let platform_oidc_url = platform_store
    .get_oidc_url()
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  let lti_storage_params = atomic_lti::platform_storage::LTIStorageParams {
    target: params.lti_storage_target.clone(),
    platform_oidc_url,
  };

  Ok((id_token, state_verified, lti_storage_params))
}

#[axum::debug_handler]
pub async fn launch(
  State(state): State<Arc<AppState>>,
  headers: HeaderMap,
  jar: CookieJar,
  Form(params): Form<LaunchParams>,
) -> Result<Html<String>, ToolError> {
  // Initialize OIDC state store
  let oidc_state_store = DBOIDCStateStore::init(&state.pool, &params.state)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  // Extract issuer and create platform store
  let iss = atomic_lti::id_token::IdToken::extract_iss(&params.id_token)
    .map_err(|_| ToolError::BadRequest("Invalid ID token".to_string()))?;
  let platform_store = DBPlatformStore::with_issuer(state.pool.clone(), iss.clone());

  // Setup and validate launch
  let (id_token, state_verified, lti_storage_params) =
    setup_launch(&platform_store, &params, &headers, &jar, &oidc_state_store).await?;

  // Get hashed script name for the app
  let hashed_script_name = state
    .assets
    .get("app.ts")
    .ok_or_else(|| ToolError::NotFound("app.ts not found in assets".to_string()))?;

  // Setup JWT store
  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost")
    .to_string();

  let key_store = Arc::new(DBKeyStore::new(&state.pool, &state.jwk_passphrase));
  let jwt_store = ToolJwtStore {
    key_store: key_store.clone(),
    host,
  };

  // Create JWT for the tool
  let encoded_jwt = jwt_store
    .build_jwt(&id_token)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;
  let settings = LaunchSettings {
    state_verified,
    state: params.state.clone(),
    lti_storage_params: Some(lti_storage_params),
    jwt: encoded_jwt,
    deep_linking: id_token.deep_linking,
  };

  // Build HTML for the launch
  let settings_json =
    serde_json::to_string(&settings).map_err(|e| ToolError::Internal(e.to_string()))?;
  let head =
    format!(r#"<script type="text/javascript">window.LAUNCH_SETTINGS = {settings_json};</script>"#);
  let body =
    format!(r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#);

  let html = build_html(&head, &body);

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
  let jwks_value = serde_json::to_value(&jwks).map_err(|e| ToolError::Internal(e.to_string()))?;

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

  let current_url = format!("{scheme}://{host}");
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
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  let html = dynamic_registration_store.complete_html();

  Ok(Html(html))
}
