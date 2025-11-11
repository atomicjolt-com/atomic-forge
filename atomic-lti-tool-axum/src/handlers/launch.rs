use crate::{handlers::LtiDependencies, html::build_html, url::full_url, ToolError};
use atomic_lti::constants::OPEN_ID_COOKIE_PREFIX;
use atomic_lti::id_token::DeepLinkingClaim;
use atomic_lti::jwks;
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::platforms::get_jwk_set;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::stores::platform_store::PlatformStore;
use atomic_lti::validate::validate_launch;
use axum::{
  extract::{Request, State},
  response::Html,
  Form,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use url::Url;

#[derive(Debug, Deserialize, Serialize)]
pub struct LaunchParams {
  pub state: String,
  pub id_token: String,
  pub lti_storage_target: String,
}

// LaunchSettings are sent to the client which expects camel case
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchSettings {
  pub state_verified: bool,
  pub state: String,
  pub lti_storage_params: Option<LTIStorageParams>,
  pub jwt: String,
  pub deep_linking: Option<DeepLinkingClaim>,
}

fn launch_html(
  settings: &LaunchSettings,
  hashed_script_name: &str,
) -> Result<String, serde_json::Error> {
  let settings_json = serde_json::to_string(&settings)?;
  let head =
    format!(r#"<script type="text/javascript">window.LAUNCH_SETTINGS = {settings_json};</script>"#);
  let body =
    format!(r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#);
  Ok(build_html(&head, &body))
}

/// LTI launch handler
/// Validates the launch request and returns HTML with launch settings
pub async fn launch<T>(
  State(deps): State<Arc<T>>,
  req: Request,
  Form(params): Form<LaunchParams>,
) -> Result<Html<String>, ToolError>
where
  T: LtiDependencies + Send + Sync + 'static,
{
  let (id_token, state_verified, lti_storage_params) = setup_launch(&deps, &params, &req).await?;

  // Build JWT for the application
  let jwt_store = deps.create_jwt_store().await?;
  let encoded_jwt = jwt_store.build_jwt(&id_token).await?;

  let settings = LaunchSettings {
    state_verified,
    state: params.state.clone(),
    lti_storage_params: Some(lti_storage_params),
    jwt: encoded_jwt,
    deep_linking: id_token.deep_linking,
  };

  // Get assets
  let assets = deps.get_assets();
  let hashed_script_name = assets
    .get("app.js")
    .ok_or_else(|| ToolError::Configuration("Missing app.js asset".to_string()))?;

  let html = launch_html(&settings, hashed_script_name)?;
  Ok(Html(html))
}

async fn setup_launch<T>(
  deps: &Arc<T>,
  params: &LaunchParams,
  req: &Request,
) -> Result<(atomic_lti::id_token::IdToken, bool, LTIStorageParams), ToolError>
where
  T: LtiDependencies + Send + Sync + 'static,
{
  // First decode to get the issuer
  let id_token_decoded =
    atomic_lti::jwt::insecure_decode::<atomic_lti::id_token::IdToken>(&params.id_token)
      .map_err(|e| ToolError::Unauthorized(format!("Failed to decode ID token: {}", e)))?;

  // Get platform store and OIDC state store
  let platform_store = deps
    .create_platform_store(&id_token_decoded.claims.iss)
    .await?;
  let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;

  // Get JWK set and validate the ID token
  let jwk_server_url = platform_store.get_jwk_server_url().await?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;
  let id_token = jwks::decode(&params.id_token, &jwk_set)?;

  // Get the requested target link URI from the request
  let requested_target_link_uri = full_url(req);

  // Validate the launch
  validate_launch(&params.state, &oidc_state_store, &id_token).await?;

  // Destroy the OIDC state store after successful validation
  oidc_state_store.destroy().await?;

  // Validate target link URI
  let parsed_target_link_uri = Url::parse(&id_token.target_link_uri).map_err(|e| {
    ToolError::Unauthorized(format!(
      "Invalid target link URI specified in ID Token: {}. {}",
      &id_token.target_link_uri, e
    ))
  })?;

  if parsed_target_link_uri.to_string() != requested_target_link_uri {
    return Err(ToolError::Unauthorized(format!(
      "Invalid target link uri: {requested_target_link_uri}"
    )));
  }

  // Check if state is verified via cookie
  let state_verified = req
    .headers()
    .get("cookie")
    .and_then(|c| c.to_str().ok())
    .map(|cookies| cookies.contains(&format!("{}{}=1", OPEN_ID_COOKIE_PREFIX, &params.state)))
    .unwrap_or(false);

  // If no storage target and state not verified, fail
  if params.lti_storage_target.is_empty() && !state_verified {
    return Err(ToolError::Unauthorized(
      "Unable to securely launch tool. Please ensure cookies are enabled".to_string(),
    ));
  }

  // Get platform OIDC URL for storage params
  let platform_oidc_url = platform_store.get_oidc_url().await?;
  let lti_storage_params: LTIStorageParams = LTIStorageParams {
    target: params.lti_storage_target.clone(),
    platform_oidc_url,
  };

  Ok((id_token, state_verified, lti_storage_params))
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti::constants::OPEN_ID_STORAGE_COOKIE;
  use atomic_lti_test::helpers::{
    generate_launch, MockJwtStore, MockKeyStore, MockOIDCStateStore, FAKE_STATE,
  };
  use axum::body::Body;
  use std::collections::HashMap;

  #[derive(Clone)]
  struct TestDeps {
    platform_url: String,
  }

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
      Ok(atomic_lti_test::helpers::create_mock_platform_store(
        &self.platform_url,
      ))
    }

    async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
      let key_store = Box::leak(Box::new(MockKeyStore::default()));
      Ok(MockJwtStore { key_store })
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
        map.insert("app.js".to_string(), "app-test.js".to_string());
        map
      });
      &ASSETS
    }

    fn get_host(&self, _req: &Request) -> String {
      "example.com".to_string()
    }
  }

  #[tokio::test]
  async fn test_launch_success() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, _platform_store, jwks_json) = generate_launch(target_link_uri, &url);
    let _mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let launch_params = LaunchParams {
      id_token: id_token_encoded,
      state: FAKE_STATE.to_string(),
      lti_storage_target: "parent".to_string(),
    };

    let req = Request::builder()
      .uri(target_link_uri)
      .header("host", "example.com")
      .header("cookie", format!("{}=1", OPEN_ID_STORAGE_COOKIE))
      .header(
        "cookie",
        format!("{}{}", OPEN_ID_COOKIE_PREFIX, launch_params.state),
      )
      .body(Body::empty())
      .unwrap();

    let deps = Arc::new(TestDeps {
      platform_url: url.clone(),
    });

    let result = launch(State(deps), req, Form(launch_params)).await;

    assert!(result.is_ok());
    let html = result.unwrap().0;
    assert!(html.contains("LAUNCH_SETTINGS"));
  }

  #[tokio::test]
  async fn test_launch_invalid_id_token() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (_id_token_encoded, _platform_store, jwks_json) = generate_launch(target_link_uri, &url);
    let _mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let launch_params = LaunchParams {
      id_token: "invalid.token.here".to_string(),
      state: FAKE_STATE.to_string(),
      lti_storage_target: "parent".to_string(),
    };

    let req = Request::builder()
      .uri(target_link_uri)
      .header("host", "example.com")
      .header("cookie", format!("{}=1", OPEN_ID_STORAGE_COOKIE))
      .header(
        "cookie",
        format!("{}{}", OPEN_ID_COOKIE_PREFIX, launch_params.state),
      )
      .body(Body::empty())
      .unwrap();

    let deps = Arc::new(TestDeps {
      platform_url: url.clone(),
    });

    let result = launch(State(deps), req, Form(launch_params)).await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_launch_invalid_target_link_uri() {
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, _platform_store, jwks_json) =
      generate_launch("https://example.com/lti/bad", &url);
    let _mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let launch_params = LaunchParams {
      id_token: id_token_encoded,
      state: FAKE_STATE.to_string(),
      lti_storage_target: "parent".to_string(),
    };

    let req = Request::builder()
      .uri("https://example.com/lti/launch")
      .header("host", "example.com")
      .header("cookie", format!("{}=1", OPEN_ID_STORAGE_COOKIE))
      .header(
        "cookie",
        format!("{}{}", OPEN_ID_COOKIE_PREFIX, launch_params.state),
      )
      .body(Body::empty())
      .unwrap();

    let deps = Arc::new(TestDeps {
      platform_url: url.clone(),
    });

    let result = launch(State(deps), req, Form(launch_params)).await;

    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("Invalid target link"));
  }

  #[tokio::test]
  async fn test_launch_state_not_verified() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, _platform_store, jwks_json) = generate_launch(target_link_uri, &url);
    let _mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let launch_params = LaunchParams {
      id_token: id_token_encoded,
      state: "badstate".to_string(),
      lti_storage_target: "parent".to_string(),
    };

    let req = Request::builder()
      .uri(target_link_uri)
      .header("host", "example.com")
      .header("cookie", format!("{}=1", OPEN_ID_STORAGE_COOKIE))
      .body(Body::empty())
      .unwrap();

    let deps = Arc::new(TestDeps {
      platform_url: url.clone(),
    });

    let result = launch(State(deps), req, Form(launch_params)).await;

    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("Invalid state"));
  }
}
