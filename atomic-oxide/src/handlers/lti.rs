use crate::stores::db_key_store::DBKeyStore;
use crate::stores::db_oidc_state_store::DBOIDCStateStore;
use crate::AppState;
use actix_web::{get, post, web, HttpRequest, Responder};
use atomic_lti::id_token::IdToken;
use atomic_lti::params::{InitParams, RedirectParams};
use atomic_lti::platforms::StaticPlatformStore;
use atomic_lti_tool::errors::AtomicToolError;
use atomic_lti_tool::handlers::init::init as lti_init;
use atomic_lti_tool::handlers::jwks::jwks as lti_jwks;
use atomic_lti_tool::handlers::redirect::redirect as lti_redirect;

#[post("/lti/init")]
pub async fn init(
  state: web::Data<AppState>,
  req: HttpRequest,
  params: web::Form<InitParams>,
) -> impl Responder {
  let oidc_state_store: DBOIDCStateStore =
    DBOIDCStateStore::create(&state.pool).map_err(|e| AtomicToolError::Internal(e.to_string()))?;
  let static_platform_store = StaticPlatformStore { iss: &params.iss };
  lti_init(req, &params, &static_platform_store, &oidc_state_store).await
}

#[post("/lti/redirect")]
pub async fn redirect(
  state: web::Data<AppState>,
  params: web::Form<RedirectParams>,
) -> impl Responder {
  let oidc_state_store: DBOIDCStateStore = DBOIDCStateStore::load(&state.pool, &params.state)
    .map_err(|e| AtomicToolError::Internal(e.to_string()))?;
  let iss = IdToken::extract_iss(&params.id_token)?;
  let static_platform_store = StaticPlatformStore { iss: &iss };
  lti_redirect(&params, &static_platform_store, &oidc_state_store).await
}

#[get("/jwks")]
async fn jwks(state: web::Data<AppState>) -> impl Responder {
  let key_store = DBKeyStore {
    pool: &state.pool,
    jwk_passphrase: &state.jwk_passphrase,
  };
  lti_jwks(&key_store).await
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
