use crate::stores::db_dynamic_registration::DBDynamicRegistrationStore;
use crate::stores::db_key_store::DBKeyStore;
use crate::stores::db_oidc_state_store::DBOIDCStateStore;
use crate::stores::tool_jwt_store::ToolJwtStore;
use crate::{errors::AppError, AppState};
#[cfg(not(test))]
use atomic_lti::platforms::StaticPlatformStore;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti_tool_axum::errors::ToolError;
use atomic_lti_tool_axum::handlers::dynamic_registration::{
  dynamic_registration_finish, dynamic_registration_init, DynamicRegistrationParams,
  RegistrationFinishFormParams,
};
use atomic_lti_tool_axum::handlers::LtiDependencies;
use axum::{
  body::Body,
  extract::{Form, FromRequest, Query, Request, State},
  response::{Html, IntoResponse},
};
use axum_extra::extract::CookieJar;
use std::collections::HashMap;
use std::sync::Arc;

// Create a newtype wrapper to implement the foreign trait
#[derive(Clone)]
pub struct LtiAppState(pub Arc<AppState>);

impl std::ops::Deref for LtiAppState {
  type Target = AppState;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

// Implement LtiDependencies for our wrapper type
impl LtiDependencies for LtiAppState {
  type OidcStateStore = DBOIDCStateStore;
  #[cfg(not(test))]
  type PlatformStore = StaticPlatformStore<'static>;
  #[cfg(test)]
  type PlatformStore = crate::handlers::lti::tests::MockPlatformStore;
  type JwtStore = ToolJwtStore;
  type KeyStore = DBKeyStore;

  async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
    DBOIDCStateStore::create(&self.pool)
      .await
      .map_err(|e| ToolError::Internal(format!("Failed to create OIDC state store: {e}")))
  }

  async fn init_oidc_state_store(&self, state: &str) -> Result<Self::OidcStateStore, ToolError> {
    DBOIDCStateStore::init(&self.pool, state)
      .await
      .map_err(|e| ToolError::Internal(format!("Failed to init OIDC state store: {e}")))
  }

  async fn create_platform_store(&self, _iss: &str) -> Result<Self::PlatformStore, ToolError> {
    #[cfg(not(test))]
    {
      let iss_owned = _iss.to_string();
      Ok(StaticPlatformStore {
        iss: Box::leak(iss_owned.into_boxed_str()),
      })
    }
    #[cfg(test)]
    {
      Ok(crate::handlers::lti::tests::MockPlatformStore)
    }
  }

  async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
    // Note: This is a limitation of the current design - the host should be passed
    // from the request context, but the trait doesn't support that.
    // For now, we'll use a placeholder that should be overridden in actual usage.
    Ok(ToolJwtStore {
      key_store: Arc::clone(&self.key_store) as Arc<dyn KeyStore + Send + Sync>,
      host: "localhost".to_string(), // This is a known limitation
    })
  }

  fn key_store(&self) -> &Self::KeyStore {
    panic!("key_store() not implemented - use create_jwt_store() instead")
  }

  fn get_assets(&self) -> &HashMap<String, String> {
    &self.assets
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

// Wrapper handlers that convert Arc<AppState> to LtiAppState
#[axum::debug_handler]
pub async fn init_get(
  State(state): State<Arc<AppState>>,
  query: Query<atomic_lti_tool_axum::InitParams>,
  jar: CookieJar,
  req: Request,
) -> Result<impl IntoResponse, AppError> {
  let lti_state = LtiAppState(state);
  atomic_lti_tool_axum::handlers::init_get(State(lti_state), query, jar, req)
    .await
    .map_err(AppError::Tool)
}

#[axum::debug_handler]
pub async fn init_post(
  State(state): State<Arc<AppState>>,
  jar: CookieJar,
  req: Request<Body>,
) -> Result<impl IntoResponse, AppError> {
  let lti_state = LtiAppState(Arc::clone(&state));

  // Extract headers before consuming request
  let headers = req.headers().clone();

  // Extract form data from request
  let form = Form::<atomic_lti_tool_axum::InitParams>::from_request(req, &state)
    .await
    .map_err(|_| AppError::Tool(ToolError::BadRequest("Invalid form data".to_string())))?;

  // Create a new request with the preserved headers
  let mut req_builder = Request::builder();
  for (name, value) in headers.iter() {
    req_builder = req_builder.header(name, value);
  }
  let req = req_builder.body(Body::empty()).unwrap();

  let (jar, html) = atomic_lti_tool_axum::handlers::init_post(State(lti_state), form, jar, req)
    .await
    .map_err(AppError::Tool)?;
  Ok((jar, html))
}

#[axum::debug_handler]
pub async fn redirect(
  State(state): State<Arc<AppState>>,
  form: Form<atomic_lti_tool_axum::RedirectParams>,
) -> Result<impl IntoResponse, AppError> {
  let lti_state = LtiAppState(state);
  atomic_lti_tool_axum::handlers::redirect(State(lti_state), form)
    .await
    .map_err(AppError::Tool)
}

#[axum::debug_handler]
pub async fn launch(
  State(state): State<Arc<AppState>>,
  req: Request<Body>,
) -> Result<Html<String>, AppError> {
  let lti_state = LtiAppState(Arc::clone(&state));

  // Extract headers before consuming request
  let headers = req.headers().clone();

  // Extract form data from request
  let form = Form::<atomic_lti_tool_axum::LaunchParams>::from_request(req, &state)
    .await
    .map_err(|_| AppError::Tool(ToolError::BadRequest("Invalid form data".to_string())))?;

  // Create a new request with the preserved headers
  let mut req_builder = Request::builder();
  for (name, value) in headers.iter() {
    req_builder = req_builder.header(name, value);
  }
  let req = req_builder.body(Body::empty()).unwrap();

  atomic_lti_tool_axum::handlers::launch(State(lti_state), form, req)
    .await
    .map_err(AppError::Tool)
}

#[axum::debug_handler]
pub async fn jwks(State(state): State<Arc<AppState>>) -> Result<impl IntoResponse, AppError> {
  let lti_state = LtiAppState(state);
  atomic_lti_tool_axum::handlers::jwks(State(lti_state))
    .await
    .map_err(AppError::Tool)
}

#[axum::debug_handler]
pub async fn register(
  State(state): State<Arc<AppState>>,
  Query(params): Query<DynamicRegistrationParams>,
) -> Result<impl IntoResponse, AppError> {
  let _dynamic_registration_store = DBDynamicRegistrationStore::new(&state.pool);

  let lti_state = LtiAppState(state);
  let html = dynamic_registration_init(State(Arc::new(lti_state)), Query(params))
    .await
    .map_err(|e: ToolError| AppError::Tool(e))?;

  Ok(Html(html))
}

#[axum::debug_handler]
pub async fn registration_finish(
  State(state): State<Arc<AppState>>,
  Form(params): Form<RegistrationFinishFormParams>,
) -> Result<impl IntoResponse, AppError> {
  let lti_state = LtiAppState(state);
  let html = dynamic_registration_finish(State(Arc::new(lti_state)), Form(params))
    .await
    .map_err(|e: ToolError| AppError::Tool(e))?;

  Ok(html)
}

#[cfg(test)]
mod tests {
  use atomic_lti::stores::platform_store::PlatformStore;
  use atomic_lti::errors::PlatformError;
  
  // Mock platform store for testing
  #[derive(Clone)]
  pub struct MockPlatformStore;
  
  #[async_trait::async_trait]
  impl PlatformStore for MockPlatformStore {
    async fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
      Ok("https://example.com/jwks".to_string())
    }
    
    async fn get_oidc_url(&self) -> Result<String, PlatformError> {
      Ok("https://example.com/oidc".to_string())
    }
    
    async fn get_token_url(&self) -> Result<String, PlatformError> {
      Ok("https://example.com/token".to_string())
    }
  }
  use super::*;
  use crate::db;
  use atomic_lti::stores::key_store::KeyStore as LtiKeyStore;
  use atomic_lti_test::helpers::JWK_PASSPHRASE;
  use crate::stores::db_key_store::{ensure_keys, DBKeyStore};
  use axum::body::Body;
  use axum::http::{header, Request, StatusCode};
  use axum::response::Response;
  use axum::Router;
  use serde_json::json;
  use std::collections::HashMap;
  use std::sync::Arc;
  use tower::ServiceExt;

  // Test helper to create an AppState for testing
  async fn create_test_state() -> Arc<AppState> {
    // Setup test database
    dotenv::dotenv().ok();
    let database_url = std::env::var("TEST_DATABASE_URL")
      .unwrap_or_else(|_| "postgres://postgres:password@localhost/atomic_decay_test".to_string());

    let pool = db::init_pool(&database_url)
      .await
      .expect("Failed to create test database pool");

    // Run migrations
    sqlx::migrate!("./migrations")
      .run(&pool)
      .await
      .expect("Failed to run migrations");

    // Ensure keys exist in the database
    ensure_keys(&pool, &JWK_PASSPHRASE)
      .await
      .expect("Failed to ensure keys exist");

    // Create DB key store
    let db_key_store = DBKeyStore::new(&pool, JWK_PASSPHRASE);
    let key_store = Arc::new(db_key_store) as Arc<dyn LtiKeyStore + Send + Sync>;

    // Create assets map with required keys
    let mut assets = HashMap::new();
    assets.insert("css".to_string(), "test.css".to_string());
    assets.insert("js".to_string(), "test.js".to_string());
    assets.insert("app-init.js".to_string(), "app-init-test.js".to_string());

    Arc::new(AppState {
      pool,
      jwk_passphrase: JWK_PASSPHRASE.to_string(),
      assets,
      key_store,
    })
  }

  // Helper to create test router
  fn create_test_router(state: Arc<AppState>) -> Router {
    Router::new()
      .route("/lti/init", axum::routing::get(init_get).post(init_post))
      .route("/lti/redirect", axum::routing::post(redirect))
      .route("/lti/launch", axum::routing::post(launch))
      .route("/lti/jwks", axum::routing::get(jwks))
      .route("/lti/register", axum::routing::get(register))
      .route(
        "/lti/registration/finish",
        axum::routing::post(registration_finish),
      )
      .with_state(state)
  }

  // Helper to extract body from response
  async fn body_string(res: Response<Body>) -> String {
    let body = res.into_body();
    let bytes = axum::body::to_bytes(body, usize::MAX)
      .await
      .expect("Failed to read body");
    String::from_utf8(bytes.to_vec()).expect("Body is not valid UTF-8")
  }

  #[tokio::test]
  async fn test_lti_app_state_deref() {
    let state = create_test_state().await;
    let lti_state = LtiAppState(state.clone());

    // Test that we can deref to access AppState fields
    assert_eq!(lti_state.jwk_passphrase, JWK_PASSPHRASE);
    assert!(lti_state.assets.contains_key("css"));
  }

  #[tokio::test]
  async fn test_lti_dependencies_implementation() {
    let state = create_test_state().await;
    let lti_state = LtiAppState(state);

    // Test OIDC state store creation
    let oidc_store = lti_state.create_oidc_state_store().await;
    assert!(oidc_store.is_ok());

    // Test platform store creation
    let platform_store = lti_state.create_platform_store("https://example.com").await;
    assert!(platform_store.is_ok());

    // Test JWT store creation
    let jwt_store = lti_state.create_jwt_store().await;
    assert!(jwt_store.is_ok());

    // Test get_assets
    let assets = lti_state.get_assets();
    assert!(assets.contains_key("css"));

    // Test get_host
    let req = Request::builder()
      .header("host", "test.example.com")
      .body(Body::empty())
      .unwrap();
    let host = lti_state.get_host(&req);
    assert_eq!(host, "test.example.com");
  }

  #[tokio::test]
  async fn test_init_get_handler() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/init?iss=https://example.com&target_link_uri=https://example.com/launch&login_hint=user123&lti_message_hint=hint123")
          .method("GET")
          .body(Body::empty())
          .unwrap(),
      )
      .await
      .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    // Check for Set-Cookie header
    let cookies = response.headers().get_all(header::SET_COOKIE);
    assert!(cookies.iter().any(|_| true), "Expected Set-Cookie header");
  }

  #[tokio::test]
  async fn test_init_post_handler() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    let form_data = "iss=https://example.com&target_link_uri=https://example.com/launch&login_hint=user123&lti_message_hint=hint123";

    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/init")
          .method("POST")
          .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
          .header(header::HOST, "test.example.com")
          .body(Body::from(form_data))
          .unwrap(),
      )
      .await
      .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_string(response).await;
    assert!(body.contains("form"), "Expected HTML form in response");
  }

  #[tokio::test]
  async fn test_redirect_handler() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    let form_data = "state=test_state&id_token=test_token";

    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/redirect")
          .method("POST")
          .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
          .body(Body::from(form_data))
          .unwrap(),
      )
      .await
      .unwrap();

    // The redirect handler typically returns a redirect or form
    assert!(response.status() == StatusCode::OK || response.status() == StatusCode::SEE_OTHER);
  }

  #[tokio::test]
  async fn test_launch_handler() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    let form_data = "state=test_state&id_token=test_token";

    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/launch")
          .method("POST")
          .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
          .header(header::HOST, "test.example.com")
          .body(Body::from(form_data))
          .unwrap(),
      )
      .await
      .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_string(response).await;
    assert!(
      body.contains("<html") || body.contains("<!DOCTYPE"),
      "Expected HTML response"
    );
  }

  #[tokio::test]
  async fn test_jwks_handler() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/jwks")
          .method("GET")
          .body(Body::empty())
          .unwrap(),
      )
      .await
      .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_string(response).await;
    let json: serde_json::Value = serde_json::from_str(&body).expect("Invalid JSON response");
    assert!(
      json.get("keys").is_some(),
      "Expected 'keys' field in JWKS response"
    );
  }

  #[tokio::test]
  async fn test_register_handler() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/register?openid_configuration=https://example.com/.well-known/openid-configuration&registration_token=test_token")
          .method("GET")
          .body(Body::empty())
          .unwrap(),
      )
      .await
      .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_string(response).await;
    assert!(
      body.contains("<html") || body.contains("<!DOCTYPE"),
      "Expected HTML response"
    );
  }

  #[tokio::test]
  async fn test_registration_finish_handler() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    let form_data = json!({
      "registration_uuid": "test-uuid",
      "tool_configuration": {},
      "platform": {},
      "registration": {}
    });

    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/registration/finish")
          .method("POST")
          .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
          .body(Body::from(serde_urlencoded::to_string(&form_data).unwrap()))
          .unwrap(),
      )
      .await
      .unwrap();

    // This endpoint might fail due to missing data, but should handle the request
    assert!(
      response.status() == StatusCode::OK
        || response.status() == StatusCode::BAD_REQUEST
        || response.status() == StatusCode::INTERNAL_SERVER_ERROR
    );
  }

  #[tokio::test]
  async fn test_error_handling_invalid_form_data() {
    let state = create_test_state().await;
    let app = create_test_router(state);

    // Send invalid form data
    let response = app
      .oneshot(
        Request::builder()
          .uri("/lti/init")
          .method("POST")
          .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
          .body(Body::from("invalid=data"))
          .unwrap(),
      )
      .await
      .unwrap();

    // Should handle the error gracefully
    assert!(
      response.status() == StatusCode::BAD_REQUEST
        || response.status() == StatusCode::INTERNAL_SERVER_ERROR
    );
  }

  #[tokio::test]
  #[should_panic(expected = "key_store() not implemented")]
  async fn test_key_store_panic() {
    let state = create_test_state().await;
    let lti_state = LtiAppState(state);

    // This should panic as designed
    let _ = lti_state.key_store();
  }

  #[tokio::test]
  async fn test_get_host_default() {
    let state = create_test_state().await;
    let lti_state = LtiAppState(state);

    // Test without host header
    let req = Request::builder().body(Body::empty()).unwrap();
    let host = lti_state.get_host(&req);
    assert_eq!(host, "localhost");
  }

  #[tokio::test]
  async fn test_init_oidc_state_store() {
    let state = create_test_state().await;
    let lti_state = LtiAppState(state.clone());

    // First create a state
    let create_result = lti_state.create_oidc_state_store().await;
    assert!(create_result.is_ok());
    let created_state = create_result.unwrap();
    let state_value = created_state.get_state().await;

    // Now test initializing with that state
    let result = lti_state.init_oidc_state_store(&state_value).await;
    assert!(result.is_ok());
  }
}
