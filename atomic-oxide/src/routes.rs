use crate::handlers::{self, lti::lti_routes, lti_services::lti_service_routes};
use actix_web::web;
use atomic_lti::stores::key_store::KeyStore;
use std::sync::Arc;

pub fn routes(app: &mut web::ServiceConfig, arc_key_store: Arc<dyn KeyStore>) {
  app
    .service(handlers::index::index)
    .service(handlers::index::up)
    .service(handlers::assets::serve_file);

  lti_routes(app);
  lti_service_routes(app, arc_key_store);
}
