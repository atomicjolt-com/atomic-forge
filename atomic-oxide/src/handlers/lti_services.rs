use crate::stores::db_key_store::DBKeyStore;
use crate::stores::tool_jwt_store::ToolJwt;
use crate::AppState;
use actix_web::HttpMessage;
use actix_web::{get, web, HttpRequest, Responder};
use atomic_lti::platforms::StaticPlatformStore;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti_tool::errors::AtomicToolError;
use atomic_lti_tool::handlers::names_and_roles::names_and_roles as lti_names_and_roles;
use atomic_lti_tool::middleware::jwt_authentication_middleware::{
  JwtAuthentication, JwtAuthenticationConfig,
};
use std::sync::Arc;

pub fn lti_service_routes(app: &mut web::ServiceConfig, arc_key_store: Arc<dyn KeyStore>) {
  let config = JwtAuthenticationConfig::<ToolJwt> {
    key_store: arc_key_store,
    marker: std::marker::PhantomData,
  };

  let auth_middleware = JwtAuthentication::<ToolJwt>::new(config);
  let scope = web::scope("/lti_services")
    .wrap(auth_middleware)
    .service(names_and_roles);

  app.service(scope);
}

#[get("/names_and_roles")]
pub async fn names_and_roles(req: HttpRequest, state: web::Data<AppState>) -> impl Responder {
  // Retrieve the JWT from the request's extensions.
  let jwt = get_tool_jwt(&req)?;
  let static_platform_store = StaticPlatformStore { iss: &jwt.iss };
  let key_store = DBKeyStore::new(&state.pool, &state.jwk_passphrase);

  if let Some(names_and_roles_endpoint_url) = &jwt.names_and_roles_endpoint_url {
    lti_names_and_roles(
      &jwt.client_id,
      names_and_roles_endpoint_url,
      &static_platform_store,
      &key_store,
    )
    .await
  } else {
    Err(AtomicToolError::InvalidRequest(
      "No names and roles endpoint URL found in JWT".to_string(),
    ))
  }
}

// This is a helper function to get the JWT from the request
fn get_tool_jwt(req: &HttpRequest) -> Result<ToolJwt, AtomicToolError> {
  req
    .extensions()
    .get::<ToolJwt>()
    .cloned() // Assuming ToolJwt implements Clone
    .ok_or_else(|| AtomicToolError::Unauthorized("No JWT found in request".to_string()))
}
