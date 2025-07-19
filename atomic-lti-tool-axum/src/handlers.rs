pub mod deep_link;
pub mod dynamic_registration;
pub mod names_and_roles;

use crate::ToolError;
use atomic_lti::stores::{
  jwt_store::JwtStore, key_store::KeyStore, oidc_state_store::OIDCStateStore,
  platform_store::PlatformStore,
};
use axum::{
  extract::{Form, Query, Request, State},
  response::{Html, IntoResponse, Response},
  Json,
};
use axum_extra::extract::CookieJar;
use cookie::{Cookie, SameSite};
use std::collections::HashMap;

pub use deep_link::*;
pub use dynamic_registration::*;
pub use names_and_roles::*;

use crate::{
  handle_init, handle_jwks, handle_launch, handle_redirect, InitParams, LaunchParams,
  RedirectParams,
};

// Trait for providing dependencies to handlers
pub trait LtiDependencies: Send + Sync {
  type OidcStateStore: OIDCStateStore;
  type PlatformStore: PlatformStore;
  type JwtStore: JwtStore;
  type KeyStore: KeyStore;

  fn create_oidc_state_store(
    &self,
  ) -> impl std::future::Future<Output = Result<Self::OidcStateStore, ToolError>> + Send;
  fn init_oidc_state_store(
    &self,
    state: &str,
  ) -> impl std::future::Future<Output = Result<Self::OidcStateStore, ToolError>> + Send;
  fn create_platform_store(
    &self,
    iss: &str,
  ) -> impl std::future::Future<Output = Result<Self::PlatformStore, ToolError>> + Send;
  fn create_jwt_store(
    &self,
  ) -> impl std::future::Future<Output = Result<Self::JwtStore, ToolError>> + Send;
  fn key_store(&self) -> &Self::KeyStore;
  fn get_assets(&self) -> &HashMap<String, String>;
  fn get_host(&self, req: &Request) -> String;
}

// Axum handlers that use the framework-agnostic functions
pub async fn init_get<T: LtiDependencies>(
  State(deps): State<T>,
  Query(params): Query<InitParams>,
  jar: CookieJar,
  req: Request,
) -> Result<(CookieJar, Html<String>), ToolError> {
  let host = deps.get_host(&req);
  let hashed_script_name = deps
    .get_assets()
    .get("app-init.js")
    .ok_or_else(|| ToolError::NotFound("app-init.js not found".to_string()))?;

  let oidc_state_store = deps.create_oidc_state_store().await?;
  let platform_store = deps.create_platform_store(&params.iss).await?;

  let html = handle_init(
    params,
    &host,
    &platform_store,
    &oidc_state_store,
    hashed_script_name,
  )
  .await?;

  // Set OIDC state in cookie
  let state_cookie = Cookie::build(("lti_state", oidc_state_store.get_state()))
    .path("/")
    .secure(true)
    .http_only(true)
    .same_site(SameSite::None)
    .build();

  let jar = jar.add(state_cookie);

  Ok((jar, Html(html)))
}

pub async fn init_post<T: LtiDependencies>(
  State(deps): State<T>,
  Form(params): Form<InitParams>,
  jar: CookieJar,
  req: Request,
) -> Result<(CookieJar, Html<String>), ToolError> {
  let host = deps.get_host(&req);
  let hashed_script_name = deps
    .get_assets()
    .get("app-init.js")
    .ok_or_else(|| ToolError::NotFound("app-init.js not found".to_string()))?;

  let oidc_state_store = deps.create_oidc_state_store().await?;
  let platform_store = deps.create_platform_store(&params.iss).await?;

  let html = handle_init(
    params,
    &host,
    &platform_store,
    &oidc_state_store,
    hashed_script_name,
  )
  .await?;

  // Set OIDC state in cookie
  let state_cookie = Cookie::build(("lti_state", oidc_state_store.get_state()))
    .path("/")
    .secure(true)
    .http_only(true)
    .same_site(SameSite::None)
    .build();

  let jar = jar.add(state_cookie);

  Ok((jar, Html(html)))
}

pub async fn redirect<T: LtiDependencies>(
  State(deps): State<T>,
  Form(params): Form<RedirectParams>,
) -> Result<Html<String>, ToolError> {
  let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;
  let iss = atomic_lti::id_token::IdToken::extract_iss(&params.id_token)
    .map_err(|_| ToolError::BadRequest("Invalid ID token".to_string()))?;
  let platform_store = deps.create_platform_store(&iss).await?;

  let html = handle_redirect(params, &platform_store, &oidc_state_store).await?;

  Ok(Html(html))
}

pub async fn launch<T: LtiDependencies>(
  State(deps): State<T>,
  Form(params): Form<LaunchParams>,
  _req: Request,
) -> Result<Html<String>, ToolError> {
  let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;
  let iss = atomic_lti::id_token::IdToken::extract_iss(&params.id_token)
    .map_err(|_| ToolError::BadRequest("Invalid ID token".to_string()))?;
  let platform_store = deps.create_platform_store(&iss).await?;
  let jwt_store = deps.create_jwt_store().await?;

  let hashed_script_name = deps
    .get_assets()
    .get("app.js")
    .ok_or_else(|| ToolError::NotFound("app.js not found".to_string()))?;

  let html = handle_launch(
    params,
    &platform_store,
    &oidc_state_store,
    &jwt_store,
    hashed_script_name,
  )
  .await?;

  Ok(Html(html))
}

pub async fn jwks<T: LtiDependencies>(
  State(_deps): State<T>,
) -> Result<Json<serde_json::Value>, ToolError> {
  let jwks = handle_jwks().await?;
  Ok(Json(jwks))
}

// Implement IntoResponse for ToolError
impl IntoResponse for ToolError {
  fn into_response(self) -> Response {
    let status = self.status_code();
    let error_code = self.error_code();
    let error_message = self.to_string();

    let body = Json(serde_json::json!({
        "error": {
            "code": error_code,
            "message": error_message,
            "type": if self.is_client_error() { "client_error" } else { "server_error" }
        }
    }));

    (status, body).into_response()
  }
}