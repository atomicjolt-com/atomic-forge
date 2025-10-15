use crate::stores::db_dynamic_registration::DBDynamicRegistrationStore;
use crate::stores::db_key_store::DBKeyStore;
use crate::stores::db_oidc_state_store::DBOIDCStateStore;
use crate::stores::db_platform_store::DBPlatformStore;
use crate::stores::tool_jwt_store::ToolJwtStore;
use crate::AppState;

use atomic_lti::constants::{OPEN_ID_COOKIE_PREFIX, OPEN_ID_STORAGE_COOKIE};
use atomic_lti::dynamic_registration::{
  register_tool, request_platform_config, validate_platform_config,
};
use atomic_lti::dynamic_registration::{
  DynamicRegistrationFinishParams, DynamicRegistrationParams,
};
use atomic_lti::id_token::IdToken;
use atomic_lti::jwks::get_current_jwks;
use atomic_lti::oidc::{build_relaunch_init_url, build_response_url};
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::platforms::get_jwk_set;
use atomic_lti::stores::dynamic_registration_store::DynamicRegistrationStore;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::stores::platform_store::PlatformStore;
use atomic_lti_tool_axum::errors::ToolError;
use atomic_lti_tool_axum::handlers::LtiDependencies;
use atomic_lti_tool_axum::html::build_html;
use axum::{
  extract::{Form, FromRequest, Query, Request, State},
  response::{Html, IntoResponse, Json, Redirect, Response},
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

// LtiDeps wraps AppState and implements LtiDependencies trait
pub struct LtiDeps {
  pub app_state: Arc<AppState>,
  // We need a static assets map with .js keys for atomic-lti-tool-axum handlers
  pub assets_with_js_keys: HashMap<String, String>,
  // Store DBKeyStore for the key_store() method
  pub db_key_store: DBKeyStore,
}

impl LtiDeps {
  pub fn new(app_state: Arc<AppState>) -> Self {
    // Create a new assets map that includes both .ts and .js keys
    let mut assets_with_js_keys = app_state.assets.clone();

    // Add .js versions of .ts keys for compatibility with atomic-lti-tool-axum
    if let Some(value) = app_state.assets.get("app-init.ts") {
      assets_with_js_keys.insert("app-init.js".to_string(), value.clone());
    }
    if let Some(value) = app_state.assets.get("app.ts") {
      assets_with_js_keys.insert("app.js".to_string(), value.clone());
    }

    // Create DBKeyStore for the key_store() method
    let db_key_store = DBKeyStore::new(&app_state.pool, &app_state.jwk_passphrase);

    Self {
      app_state,
      assets_with_js_keys,
      db_key_store,
    }
  }
}

impl LtiDependencies for LtiDeps {
  type OidcStateStore = DBOIDCStateStore;
  type PlatformStore = DBPlatformStore;
  type JwtStore = ToolJwtStore;
  type KeyStore = DBKeyStore;

  async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
    DBOIDCStateStore::create(&self.app_state.pool)
      .await
      .map_err(|e| ToolError::Internal(e.to_string()))
  }

  async fn init_oidc_state_store(&self, state: &str) -> Result<Self::OidcStateStore, ToolError> {
    DBOIDCStateStore::init(&self.app_state.pool, state)
      .await
      .map_err(|e| ToolError::Internal(e.to_string()))
  }

  async fn create_platform_store(&self, iss: &str) -> Result<Self::PlatformStore, ToolError> {
    Ok(DBPlatformStore::with_issuer(
      self.app_state.pool.clone(),
      iss.to_string(),
    ))
  }

  async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
    let key_store = Arc::new(DBKeyStore::new(
      &self.app_state.pool,
      &self.app_state.jwk_passphrase,
    ));

    Ok(ToolJwtStore {
      key_store,
      host: "localhost".to_string(), // This will be overridden by get_host
    })
  }

  fn key_store(&self) -> &Self::KeyStore {
    &self.db_key_store
  }

  fn get_assets(&self) -> &HashMap<String, String> {
    &self.assets_with_js_keys
  }

  fn get_host(&self, req: &Request) -> String {
    req
      .headers()
      .get("host")
      .and_then(|h| h.to_str().ok())
      .unwrap_or("localhost")
      .to_string()
  }
}

// LTI Handler Parameters
#[derive(Debug, Deserialize, Serialize)]
pub struct InitParams {
  pub iss: String,
  pub login_hint: String,
  pub client_id: String,
  pub target_link_uri: String,
  pub lti_message_hint: String,
  pub lti_storage_target: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RedirectParams {
  pub lti_storage_target: Option<String>,
  pub id_token: String,
  pub state: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LaunchParams {
  pub state: String,
  pub id_token: String,
  pub lti_storage_target: String,
}

// LTI Handlers using LtiDeps
#[axum::debug_handler]
pub async fn init(
  State(app_state): State<Arc<AppState>>,
  req: Request,
) -> Result<Response, ToolError> {
  // Clone parts we need before extracting form
  let headers = req.headers().clone();

  // Extract form data
  let Form(params) = Form::<InitParams>::from_request(req, &app_state)
    .await
    .map_err(|e| ToolError::BadRequest(format!("Failed to parse form data: {}", e)))?;

  // Create a minimal request-like object for get_host
  let deps = LtiDeps::new(app_state.clone());
  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost")
    .to_string();

  let platform_store = deps.create_platform_store(&params.iss).await?;
  let oidc_state_store = deps.create_oidc_state_store().await?;
  let assets = deps.get_assets();
  let hashed_script_name = assets
    .get("app-init.js")
    .ok_or_else(|| ToolError::Configuration("Missing app-init.js asset".to_string()))?;

  let platform_oidc_url = platform_store.get_oidc_url().await?;
  let host_only = host
    .strip_prefix("https://")
    .or_else(|| host.strip_prefix("http://"))
    .unwrap_or(&host);

  let redirect_url = format!("https://{}/lti/redirect", host_only);
  let state = oidc_state_store.get_state().await;
  let nonce = oidc_state_store.get_nonce().await;

  let url = build_response_url(
    &platform_oidc_url,
    &state,
    &params.client_id,
    &params.login_hint,
    &params.lti_message_hint,
    &nonce,
    &redirect_url,
  )
  .map_err(|e| ToolError::Internal(e.to_string()))?;

  let target = params.lti_storage_target.as_deref().unwrap_or("iframe");
  let lti_storage_params = LTIStorageParams {
    target: target.to_string(),
    platform_oidc_url,
  };

  let relaunch_init_url = build_relaunch_init_url(&url);
  let settings_json = serde_json::json!({
    "state": state,
    "responseUrl": url.to_string(),
    "ltiStorageParams": lti_storage_params,
    "relaunchInitUrl": relaunch_init_url,
    "openIdCookiePrefix": OPEN_ID_COOKIE_PREFIX,
  });

  let cookie_marker = Cookie::build((OPEN_ID_STORAGE_COOKIE, "1"))
    .domain(host_only.to_string())
    .path("/")
    .secure(true)
    .http_only(false)
    .max_age(cookie::time::Duration::seconds(356 * 24 * 60 * 60))
    .same_site(SameSite::None)
    .build();

  let cookie_state_name = format!("{}{}", OPEN_ID_COOKIE_PREFIX, state);
  let cookie_state = Cookie::build((&cookie_state_name, "1"))
    .domain(host_only.to_string())
    .path("/")
    .secure(true)
    .http_only(false)
    .max_age(cookie::time::Duration::seconds(60))
    .same_site(SameSite::None)
    .build();

  let can_use_cookies = headers
    .get("cookie")
    .and_then(|c| c.to_str().ok())
    .map(|cookies| cookies.contains(&format!("{}=1", OPEN_ID_STORAGE_COOKIE)))
    .unwrap_or(false);

  if can_use_cookies {
    let mut response = Redirect::temporary(&url.to_string()).into_response();
    let headers = response.headers_mut();
    headers.insert(
      "set-cookie",
      cookie_marker.to_string().parse().map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    headers.append(
      "set-cookie",
      cookie_state.to_string().parse().map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    Ok(response)
  } else {
    let settings_str = serde_json::to_string(&settings_json)?;
    let head = format!(r#"<script type="text/javascript">window.INIT_SETTINGS = {settings_str};</script>"#);
    let body = format!(r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#);
    let html = build_html(&head, &body);

    let mut response = Html(html).into_response();
    let headers = response.headers_mut();
    headers.insert(
      "set-cookie",
      cookie_marker.to_string().parse().map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    headers.append(
      "set-cookie",
      cookie_state.to_string().parse().map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    Ok(response)
  }
}

#[axum::debug_handler]
pub async fn redirect(
  State(app_state): State<Arc<AppState>>,
  Form(params): Form<RedirectParams>,
) -> Result<Html<String>, ToolError> {
  let deps = LtiDeps::new(app_state);

  let id_token_decoded = atomic_lti::jwt::insecure_decode::<IdToken>(&params.id_token)
    .map_err(|e| ToolError::Unauthorized(format!("Failed to decode ID token: {}", e)))?;

  let platform_store = deps.create_platform_store(&id_token_decoded.claims.iss).await?;
  let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;

  let jwk_server_url = platform_store.get_jwk_server_url().await?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;

  let id_token = atomic_lti::jwks::decode(&params.id_token, &jwk_set)?;
  atomic_lti::validate::validate_launch(&params.state, &oidc_state_store, &id_token).await?;

  let lti_storage_target_input = match &params.lti_storage_target {
    Some(target) => format!(r#"<input type="hidden" name="lti_storage_target" value="{target}" />"#),
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
    id_token.target_link_uri, params.id_token, params.state, lti_storage_target_input
  );

  Ok(Html(build_html("", &body)))
}

#[axum::debug_handler]
pub async fn launch(
  State(app_state): State<Arc<AppState>>,
  req: Request,
) -> Result<Html<String>, ToolError> {
  // Clone headers before extracting form
  let headers = req.headers().clone();

  // Extract form data
  let Form(params) = Form::<LaunchParams>::from_request(req, &app_state)
    .await
    .map_err(|e| ToolError::BadRequest(format!("Failed to parse form data: {}", e)))?;

  let deps = LtiDeps::new(app_state.clone());
  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost")
    .to_string();

  let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;
  let id_token_decoded = atomic_lti::jwt::insecure_decode::<IdToken>(&params.id_token)
    .map_err(|e| ToolError::Unauthorized(format!("Failed to decode ID token: {}", e)))?;

  let platform_store = deps.create_platform_store(&id_token_decoded.claims.iss).await?;

  let jwk_server_url = platform_store.get_jwk_server_url().await?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;
  let id_token = atomic_lti::jwks::decode(&params.id_token, &jwk_set)?;

  atomic_lti::validate::validate_launch(&params.state, &oidc_state_store, &id_token).await?;
  let _ = oidc_state_store.destroy().await;

  let requested_url = format!("https://{}/lti/launch", host);
  let parsed_target_link_uri = url::Url::parse(&id_token.target_link_uri)
    .map_err(|e| ToolError::Unauthorized(format!("Invalid target link URI in ID token: {e}")))?;

  if parsed_target_link_uri.to_string() != requested_url {
    return Err(ToolError::Unauthorized(format!(
      "Invalid target link URI. Expected: {requested_url}, Got: {parsed_target_link_uri}"
    )));
  }

  let state_cookie_name = format!("{}{}", OPEN_ID_COOKIE_PREFIX, &params.state);
  let state_verified = headers
    .get("cookie")
    .and_then(|c| c.to_str().ok())
    .and_then(|cookies| {
      cookies.split(';')
        .find(|c| c.trim().starts_with(&format!("{}=", state_cookie_name)))
        .map(|c| c.trim().ends_with("=1"))
    })
    .unwrap_or(false);

  if params.lti_storage_target.is_empty() && !state_verified {
    return Err(ToolError::Unauthorized(
      "Unable to securely launch tool. Please ensure cookies are enabled".to_string(),
    ));
  }

  let platform_oidc_url = platform_store.get_oidc_url().await?;
  let lti_storage_params = LTIStorageParams {
    target: params.lti_storage_target.clone(),
    platform_oidc_url,
  };

  let jwt_store = ToolJwtStore {
    key_store: Arc::new(DBKeyStore::new(&app_state.pool, &app_state.jwk_passphrase)),
    host: host.clone(),
  };

  let encoded_jwt = jwt_store.build_jwt(&id_token).await?;
  let hashed_script_name = deps.get_assets()
    .get("app.js")
    .ok_or_else(|| ToolError::Configuration("Missing app.js asset".to_string()))?;

  let settings = serde_json::json!({
    "stateVerified": state_verified,
    "state": params.state,
    "ltiStorageParams": lti_storage_params,
    "jwt": encoded_jwt,
    "deepLinking": id_token.deep_linking,
  });

  let settings_json = serde_json::to_string(&settings)?;
  let head = format!(r#"<script type="text/javascript">window.LAUNCH_SETTINGS = {settings_json};</script>"#);
  let body = format!(r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#);

  Ok(Html(build_html(&head, &body)))
}

#[axum::debug_handler]
pub async fn jwks(
  State(app_state): State<Arc<AppState>>,
) -> Result<Json<atomic_lti::jwks::Jwks>, ToolError> {
  let deps = LtiDeps::new(app_state);
  let key_store = deps.key_store();
  let jwks = get_current_jwks(key_store).await?;
  Ok(Json(jwks))
}

// Dynamic registration handlers
#[axum::debug_handler]
pub async fn register(
  State(state): State<Arc<AppState>>,
  Query(params): Query<DynamicRegistrationParams>,
) -> Result<Html<String>, ToolError> {
  let dynamic_registration_store = DBDynamicRegistrationStore::new(&state.pool);
  let registration_token = params.registration_token.clone().unwrap_or_default();
  let registration_finish_path = "/lti/registration/finish";

  let platform_config = request_platform_config(&params.openid_configuration)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

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
  headers: axum::http::HeaderMap,
  Form(params): Form<DynamicRegistrationFinishParams>,
) -> Result<Html<String>, ToolError> {
  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("localhost");

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

  let platform_response = register_tool(
    &params.registration_endpoint,
    &registration_token,
    &client_registration_request,
  )
  .await
  .map_err(|e| ToolError::Internal(e.to_string()))?;

  dynamic_registration_store
    .handle_platform_response(platform_response)
    .await
    .map_err(|e| ToolError::Internal(e.to_string()))?;

  let html = dynamic_registration_store.complete_html();

  Ok(Html(html))
}
