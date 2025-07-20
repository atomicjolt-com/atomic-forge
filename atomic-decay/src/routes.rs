use crate::{handlers, AppState};
use atomic_lti::stores::key_store::KeyStore;
use axum::{
  routing::{get, post},
  Router,
};
use std::sync::Arc;

pub fn routes(arc_key_store: Arc<dyn KeyStore + Send + Sync>) -> Router<Arc<AppState>> {
  Router::new()
    .route("/", get(handlers::index::index))
    .route("/up", get(handlers::index::up))
    .route("/assets/{*filename}", get(handlers::assets::serve_file))
    .merge(lti_routes())
    .merge(lti_service_routes(arc_key_store))
}

pub fn lti_routes() -> Router<Arc<AppState>> {
  Router::new()
    .route(
      "/lti/init",
      get(handlers::lti::init_get).post(handlers::lti::init_post),
    )
    .route("/lti/redirect", post(handlers::lti::redirect))
    .route("/lti/launch", post(handlers::lti::launch))
    .route("/lti/register", get(handlers::lti::register))
    .route(
      "/lti/registration/finish",
      post(handlers::lti::registration_finish),
    )
    .route("/jwks", get(handlers::lti::jwks))
}

pub fn lti_service_routes(arc_key_store: Arc<dyn KeyStore + Send + Sync>) -> Router<Arc<AppState>> {
  handlers::lti_services::lti_service_routes(arc_key_store)
}
