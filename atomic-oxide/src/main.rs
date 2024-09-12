#[macro_use]
extern crate lazy_static;

mod config;
mod db;
mod defines;
mod errors;
mod handlers;
mod models;
mod routes;
mod schema;
mod stores;
mod tests;

use crate::{
  handlers::assets::get_assets,
  stores::db_key_store::{ensure_keys, DBKeyStore},
};
use actix_cors::Cors;
use actix_web::{http, web, App, HttpServer};
use atomic_lti::stores::key_store::KeyStore;
use dotenv::dotenv;
use listenfd::ListenFd;
use log::info;
use std::{collections::HashMap, sync::Arc};

#[derive(Clone)]
pub struct AppState {
  pub pool: db::Pool,
  pub jwk_passphrase: String,
  pub assets: HashMap<String, String>,
  pub key_store: Arc<dyn KeyStore>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
  dotenv().ok();
  env_logger::init();

  let config = crate::config::Config::from_env().expect("Invalid environment configuration");

  // create db connection pool
  let database_url = config.database_url.clone();
  let pool = db::init_pool(&database_url).expect("Failed to create database pool.");
  info!("Connected to {}", database_url);

  // Ensure required keys are setup
  if config.jwk_passphrase.is_empty() {
    panic!(
      "There is a problem with the jwk_passphrase. Please ensure it is set config/secrets.json"
    );
  }

  // Ensure there is a key in the database for jwks
  ensure_keys(&pool, &config.jwk_passphrase).expect("There is a problem with the JWKs. No entry was found in the database a new key could not be generated.");

  let assets = get_assets();

  let mut listenfd = ListenFd::from_env();

  // Clone the config so that it can be used in the closure below
  let mut server = HttpServer::new(move || {
    let key_store = DBKeyStore::new(&pool, &config.jwk_passphrase);
    let state = AppState {
      pool: pool.clone(),
      jwk_passphrase: config.jwk_passphrase.clone(),
      assets: assets.clone(),
      key_store: Arc::new(key_store),
    };
    let arc_key_store = state.key_store.clone();

    let cors = Cors::default()
      .allow_any_origin()
      .allowed_methods(vec!["GET", "POST"])
      .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
      .allowed_header(http::header::CONTENT_TYPE)
      .supports_credentials()
      .max_age(3600);

    App::new()
      .app_data(web::Data::new(state))
      .wrap(cors)
      .wrap(actix_web::middleware::NormalizePath::trim())
      .wrap(actix_web::middleware::Logger::default())
      .configure(|cfg| routes::routes(cfg, arc_key_store))
  });

  server = if let Some(l) = listenfd.take_tcp_listener(0).unwrap() {
    server.listen(l)?
  } else {
    server.bind(format!("{}:{}", config.host, config.port))?
  };

  info!("Starting server at http://{}:{}", config.host, config.port);
  server.run().await
}
