use crate::extractors::jwt_claims::JwtClaims;
use crate::stores::db_key_store::DBKeyStore;
use crate::AppState;
use actix_web::{get, post, web, Responder};
use atomic_lti::deep_linking::ContentItem;
use crate::stores::db_platform_store::DBPlatformStore;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti_tool::errors::AtomicToolError;
use atomic_lti_tool::handlers::deep_link::sign_deep_link as lti_sign_deep_link;
use atomic_lti_tool::handlers::names_and_roles::names_and_roles as lti_names_and_roles;
use std::sync::Arc;

pub fn lti_service_routes(app: &mut web::ServiceConfig, _arc_key_store: Arc<dyn KeyStore>) {
  app.service(
    web::scope("/lti_services")
      .service(names_and_roles)
      .service(sign_deep_link),
  );
}

#[get("/names_and_roles")]
pub async fn names_and_roles(jwt_claims: JwtClaims, state: web::Data<AppState>) -> impl Responder {
  let jwt = &jwt_claims.claims;
  let static_platform_store = DBPlatformStore::with_issuer(state.pool.clone(), jwt.platform_iss.clone());
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

// This is a helper API that handles signing a deep link request.
// It returns a JWT to the client that can be sent to the platform.
#[post("/sign_deep_link")]
pub async fn sign_deep_link(
  jwt_claims: JwtClaims,
  state: web::Data<AppState>,
  params: web::Json<Vec<ContentItem>>,
) -> impl Responder {
  let jwt = &jwt_claims.claims;

  let key_store = DBKeyStore::new(&state.pool, &state.jwk_passphrase);
  lti_sign_deep_link(
    &jwt.client_id,
    &jwt.platform_iss,
    &jwt.deployment_id,
    jwt.deep_link_claim_data.clone(),
    &params,
    &key_store,
  )
  .await
}
