use crate::handlers;
use actix_web::web;

pub fn routes(app: &mut web::ServiceConfig) {
  app
    .service(handlers::index::index)
    .service(handlers::index::up)
    .service(handlers::lti::jwks)
    .service(handlers::lti::init)
    .service(handlers::lti::redirect);
}
