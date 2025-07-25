use crate::stores::db_dynamic_registration::DBDynamicRegistrationStore;
use crate::stores::db_key_store::DBKeyStore;
use crate::stores::db_oidc_state_store::DBOIDCStateStore;
use crate::stores::tool_jwt_store::ToolJwtStore;
use crate::AppState;
use std::sync::Arc;
use actix_web::{get, post, web, HttpRequest, Responder};
use atomic_lti::dynamic_registration::{
  DynamicRegistrationFinishParams, DynamicRegistrationParams,
};
use atomic_lti::id_token::IdToken;
use atomic_lti::platforms::StaticPlatformStore;
use atomic_lti_tool::errors::AtomicToolError;
use atomic_lti_tool::handlers::dynamic_registration::{
  dynamic_registration_finish, dynamic_registration_init,
};
use atomic_lti_tool::handlers::init::{init, InitParams};
use atomic_lti_tool::handlers::jwks::jwks as lti_jwks;
use atomic_lti_tool::handlers::launch::{launch as lti_launch, LaunchParams};
use atomic_lti_tool::handlers::redirect::{redirect as lti_redirect, RedirectParams};

pub fn lti_routes(app: &mut web::ServiceConfig) {
  app.service(
    web::scope("/lti")
      .service(init_get)
      .service(init_post)
      .service(redirect)
      .service(launch)
      .service(register)
      .service(registration_finish),
  );

  app.service(jwks);
}

#[post("/init")]
async fn init_post(
  req: HttpRequest,
  state: web::Data<AppState>,
  params: web::Form<InitParams>,
) -> impl Responder {
  init_handler(req, state, params.into_inner()).await
}

#[get("/init")]
async fn init_get(
  req: HttpRequest,
  state: web::Data<AppState>,
  params: web::Query<InitParams>,
) -> impl Responder {
  init_handler(req, state, params.into_inner()).await
}

// Common logic for both GET and POST init
async fn init_handler(
  req: HttpRequest,
  state: web::Data<AppState>,
  params: InitParams,
) -> impl Responder {
  let hashed_script_name = match state.assets.get("app-init.ts") {
    Some(s) => s,
    None => {
      return Err(AtomicToolError::Internal(
        "Mapping for app-init.ts not found in assets.json".to_string(),
      ))
    }
  };

  let oidc_state_store: DBOIDCStateStore = DBOIDCStateStore::create(&state.pool)?;
  let static_platform_store = StaticPlatformStore { iss: &params.iss };

  init(
    req,
    &params,
    &static_platform_store,
    &oidc_state_store,
    hashed_script_name,
  )
  .await
}

#[post("/redirect")]
pub async fn redirect(
  state: web::Data<AppState>,
  params: web::Form<RedirectParams>,
) -> impl Responder {
  let oidc_state_store: DBOIDCStateStore = DBOIDCStateStore::init(&state.pool, &params.state)?;
  let iss = IdToken::extract_iss(&params.id_token)?;
  let static_platform_store = StaticPlatformStore { iss: &iss };
  lti_redirect(&params, &static_platform_store, &oidc_state_store).await
}

#[post("/launch")]
pub async fn launch(
  req: HttpRequest,
  state: web::Data<AppState>,
  params: web::Form<LaunchParams>,
) -> impl Responder {
  let oidc_state_store: DBOIDCStateStore = DBOIDCStateStore::init(&state.pool, &params.state)?;
  let iss = IdToken::extract_iss(&params.id_token)?;
  let static_platform_store = StaticPlatformStore { iss: &iss };
  let hashed_script_name = match state.assets.get("app.ts") {
    Some(s) => s,
    None => {
      return Err(AtomicToolError::Internal(
        "Mapping for app-init.ts not found in assets.json".to_string(),
      ))
    }
  };
  let host = req.connection_info().host().to_string();
  let key_store = Arc::new(DBKeyStore::new(&state.pool, &state.jwk_passphrase));
  let jwt_store = ToolJwtStore {
    key_store: key_store.clone(),
    host,
  };
  lti_launch(
    req,
    &params,
    &static_platform_store,
    &oidc_state_store,
    hashed_script_name,
    &jwt_store,
  )
  .await
}

#[get("/jwks")]
async fn jwks(state: web::Data<AppState>) -> impl Responder {
  let key_store = DBKeyStore::new(&state.pool, &state.jwk_passphrase);
  lti_jwks(&key_store).await
}

#[get("/register")]
async fn register(
  state: web::Data<AppState>,
  params: web::Query<DynamicRegistrationParams>,
) -> impl Responder {
  let dynamic_registration_store = DBDynamicRegistrationStore::new(&state.pool);
  let registration_token = params.registration_token.clone().unwrap_or_default();
  let registration_finish_path = "/lti/registration_finish";
  dynamic_registration_init(
    &params.openid_configuration,
    &registration_token,
    registration_finish_path,
    &dynamic_registration_store,
  )
  .await
}

#[post("/registration_finish")]
async fn registration_finish(
  state: web::Data<AppState>,
  params: web::Form<DynamicRegistrationFinishParams>,
  request: HttpRequest,
) -> impl Responder {
  // Clone the necessary data before the await point
  let connection_info = request.connection_info().clone();
  let current_url = format!("{}://{}", connection_info.scheme(), connection_info.host(),);
  let dynamic_registration_store = DBDynamicRegistrationStore::new(&state.pool);
  let registration_token = params.registration_token.clone().unwrap_or_default();
  let product_family_code = params.product_family_code.clone().unwrap_or_default();
  dynamic_registration_finish(
    &params.registration_endpoint,
    &registration_token,
    &dynamic_registration_store,
    &current_url,
    &product_family_code,
  )
  .await
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::tests::get_app_state;
  use crate::{models::key::Key, tests::helpers::tests::get_pool};
  use actix_web::{http, test, App};
  use atomic_lti::secure::generate_rsa_key_pair;

  #[actix_web::test]
  async fn test_jwks() {
    let state = get_app_state();
    let (_, pem_string) = generate_rsa_key_pair(&state.jwk_passphrase).unwrap();
    let key = Key::create(&state.pool, &pem_string).unwrap();
    let app = test::init_service(App::new().app_data(web::Data::new(state)).service(jwks)).await;
    let req = test::TestRequest::get().uri("/jwks").to_request();
    let resp = test::call_service(&app, req).await;

    let pool = get_pool().clone();
    Key::destroy(&pool, key.id).expect("Failed to destroy key");
    assert_eq!(
      resp.status(),
      http::StatusCode::OK,
      "Response was: {:?}",
      resp.response().body()
    );
  }
}
