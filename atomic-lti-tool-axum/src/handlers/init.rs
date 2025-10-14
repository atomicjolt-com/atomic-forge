use crate::{handlers::LtiDependencies, html::build_html, ToolError};
use atomic_lti::constants::{OPEN_ID_COOKIE_PREFIX, OPEN_ID_STORAGE_COOKIE};
use atomic_lti::oidc::{build_relaunch_init_url, build_response_url};
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::stores::platform_store::PlatformStore;
use axum::{
  extract::{Request, State},
  response::{IntoResponse, Redirect, Response},
  Form,
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize, Serialize)]
pub struct InitParams {
  pub iss: String,
  pub login_hint: String,
  pub client_id: String,
  pub target_link_uri: String,
  pub lti_message_hint: String,
  pub lti_storage_target: Option<String>,
}

// InitSettings are sent to the client which expects camel case
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitSettings {
  pub state: String,
  pub response_url: String,
  pub lti_storage_params: LTIStorageParams,
  pub relaunch_init_url: String,
  pub open_id_cookie_prefix: String,
  pub privacy_policy_url: Option<String>,
  pub privacy_policy_message: Option<String>,
}

impl Default for InitSettings {
  fn default() -> Self {
    Self {
      state: "".to_string(),
      response_url: "".to_string(),
      lti_storage_params: LTIStorageParams::default(),
      relaunch_init_url: "".to_string(),
      open_id_cookie_prefix: OPEN_ID_COOKIE_PREFIX.to_string(),
      privacy_policy_url: None,
      privacy_policy_message: None,
    }
  }
}

pub fn build_cookie<'a>(
  name: &'a str,
  value: &'a str,
  domain: &'a str,
  max_age_seconds: i64,
) -> Cookie<'a> {
  Cookie::build((name, value))
    .domain(domain.to_string())
    .path("/")
    .secure(true)
    .http_only(false)
    .max_age(cookie::time::Duration::seconds(max_age_seconds))
    .same_site(SameSite::None)
    .build()
}

pub fn init_html(settings: InitSettings, hashed_script_name: &str) -> Result<String, serde_json::Error> {
  let settings_json = serde_json::to_string(&settings)?;
  let head =
    format!(r#"<script type="text/javascript">window.INIT_SETTINGS = {settings_json};</script>"#);
  let body =
    format!(r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#);
  Ok(build_html(&head, &body))
}

/// OIDC initialization handler
/// Handles both GET and POST requests for LTI OIDC login initiation
pub async fn init<T>(
  State(deps): State<Arc<T>>,
  req: Request,
  Form(params): Form<InitParams>,
) -> Result<Response, ToolError>
where
  T: LtiDependencies + Send + Sync + 'static,
{
  // Get dependencies
  let platform_store = deps.create_platform_store(&params.iss).await?;
  let oidc_state_store = deps.create_oidc_state_store().await?;
  let assets = deps.get_assets();
  let hashed_script_name = assets
    .get("app-init.js")
    .ok_or_else(|| ToolError::Configuration("Missing app-init.js asset".to_string()))?;

  // Get platform OIDC URL
  let platform_oidc_url = platform_store.get_oidc_url().await?;

  // Get host from request
  let host = deps.get_host(&req);
  let host_only = host
    .strip_prefix("https://")
    .or_else(|| host.strip_prefix("http://"))
    .unwrap_or(&host);

  // Build redirect URL
  let redirect_url = format!("https://{}/lti/redirect", host_only);

  // Generate state and nonce
  let state = oidc_state_store.get_state().await;
  let nonce = oidc_state_store.get_nonce().await;

  // Build OIDC response URL
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

  // Determine storage target
  let target = match &params.lti_storage_target {
    Some(target) => target,
    None => "iframe",
  };

  let lti_storage_params: LTIStorageParams = LTIStorageParams {
    target: target.to_string(),
    platform_oidc_url,
  };

  let relaunch_init_url = build_relaunch_init_url(&url);

  let settings: InitSettings = InitSettings {
    state: state.clone(),
    response_url: url.to_string(),
    lti_storage_params,
    relaunch_init_url,
    open_id_cookie_prefix: OPEN_ID_COOKIE_PREFIX.to_string(),
    privacy_policy_url: None,
    privacy_policy_message: None,
  };

  // Build cookies
  let cookie_marker = build_cookie(OPEN_ID_STORAGE_COOKIE, "1", host_only, 356 * 24 * 60 * 60);
  let cookie_state_name = format!("{}{}", OPEN_ID_COOKIE_PREFIX, state);
  let cookie_state = build_cookie(&cookie_state_name, "1", host_only, 60);

  // Check if cookies are supported by looking for the storage cookie
  let can_use_cookies = req
    .headers()
    .get("cookie")
    .and_then(|c| c.to_str().ok())
    .map(|cookies| cookies.contains(&format!("{}=1", OPEN_ID_STORAGE_COOKIE)))
    .unwrap_or(false);

  if can_use_cookies {
    // Redirect with cookies
    let mut response = Redirect::temporary(&url.to_string()).into_response();
    let headers = response.headers_mut();
    headers.insert(
      "set-cookie",
      cookie_marker
        .to_string()
        .parse()
        .map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    headers.append(
      "set-cookie",
      cookie_state
        .to_string()
        .parse()
        .map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    Ok(response)
  } else {
    // Send HTML page to set cookies
    let html = init_html(settings, hashed_script_name)?;
    let mut response = axum::response::Html(html).into_response();
    let headers = response.headers_mut();
    headers.insert(
      "set-cookie",
      cookie_marker
        .to_string()
        .parse()
        .map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    headers.append(
      "set-cookie",
      cookie_state
        .to_string()
        .parse()
        .map_err(|e| ToolError::Internal(format!("Invalid cookie: {}", e)))?,
    );
    Ok(response)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti_test::helpers::{create_mock_platform_store, MockJwtStore, MockKeyStore, MockOIDCStateStore};
  use axum::body::Body;
  use axum::http::StatusCode;
  use std::collections::HashMap;

  #[derive(Clone)]
  struct TestDeps;

  impl LtiDependencies for TestDeps {
    type OidcStateStore = MockOIDCStateStore;
    type PlatformStore = atomic_lti_test::helpers::MockPlatformStore;
    type JwtStore = MockJwtStore<'static>;
    type KeyStore = MockKeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
      Ok(MockOIDCStateStore {})
    }

    async fn init_oidc_state_store(&self, _state: &str) -> Result<Self::OidcStateStore, ToolError> {
      Ok(MockOIDCStateStore {})
    }

    async fn create_platform_store(&self, _iss: &str) -> Result<Self::PlatformStore, ToolError> {
      Ok(create_mock_platform_store("https://lms.example.com"))
    }

    async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
      unimplemented!()
    }

    fn key_store(&self) -> &Self::KeyStore {
      use std::sync::LazyLock;
      static MOCK_KEY_STORE: LazyLock<MockKeyStore> = LazyLock::new(MockKeyStore::default);
      &MOCK_KEY_STORE
    }

    fn get_assets(&self) -> &HashMap<String, String> {
      use std::sync::LazyLock;
      static ASSETS: LazyLock<HashMap<String, String>> = LazyLock::new(|| {
        let mut map = HashMap::new();
        map.insert("app-init.js".to_string(), "fake.js".to_string());
        map
      });
      &ASSETS
    }

    fn get_host(&self, _req: &Request) -> String {
      "example.com".to_string()
    }
  }

  #[tokio::test]
  async fn test_oidc_init_with_cookie_success() {
    let deps = Arc::new(TestDeps);
    let params = InitParams {
      iss: "https://canvas.instructure.com".to_string(),
      login_hint: "hint".to_string(),
      client_id: "1234".to_string(),
      target_link_uri: "https://example.com/launch".to_string(),
      lti_message_hint: "hint".to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let req = Request::builder()
      .uri("https://example.com/lti/init")
      .header("host", "example.com")
      .header("cookie", format!("{}=1", OPEN_ID_STORAGE_COOKIE))
      .body(Body::empty())
      .unwrap();

    let result = init(State(deps), req, Form(params)).await;

    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.status(), StatusCode::TEMPORARY_REDIRECT);
  }

  #[tokio::test]
  async fn test_oidc_init_without_cookie_returns_html() {
    let deps = Arc::new(TestDeps);
    let params = InitParams {
      iss: "https://canvas.instructure.com".to_string(),
      login_hint: "hint".to_string(),
      client_id: "1234".to_string(),
      target_link_uri: "https://example.com/launch".to_string(),
      lti_message_hint: "hint".to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let req = Request::builder()
      .uri("https://example.com/lti/init")
      .header("host", "example.com")
      .body(Body::empty())
      .unwrap();

    let result = init(State(deps), req, Form(params)).await;

    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
  }
}
