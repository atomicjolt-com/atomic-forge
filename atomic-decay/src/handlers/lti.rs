use crate::stores::db_dynamic_registration::DBDynamicRegistrationStore;
use crate::stores::db_key_store::DBKeyStore;
use crate::stores::db_oidc_state_store::DBOIDCStateStore;
use crate::stores::tool_jwt_store::ToolJwtStore;
use crate::{errors::AppError, AppState};
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
  type PlatformStore = StaticPlatformStore<'static>;
  type JwtStore = ToolJwtStore;
  type KeyStore = DBKeyStore;

  async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
    DBOIDCStateStore::create(&self.pool)
      .map_err(|e| ToolError::Internal(format!("Failed to create OIDC state store: {}", e)))
  }

  async fn init_oidc_state_store(&self, state: &str) -> Result<Self::OidcStateStore, ToolError> {
    DBOIDCStateStore::init(&self.pool, state)
      .map_err(|e| ToolError::Internal(format!("Failed to init OIDC state store: {}", e)))
  }

  async fn create_platform_store(&self, iss: &str) -> Result<Self::PlatformStore, ToolError> {
    // Convert to owned string to satisfy 'static lifetime requirement
    let iss_owned = iss.to_string();
    Ok(StaticPlatformStore {
      iss: Box::leak(iss_owned.into_boxed_str()),
    })
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
    // This is a bit of a hack, but we need to return a reference
    // In a real implementation, you might want to store DBKeyStore directly in AppState
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
  // TODO: Update tests to work with Axum instead of Actix-web
}
