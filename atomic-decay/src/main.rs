mod config;
mod db;
mod defines;
mod errors;
mod extractors;
mod handlers;
mod models;
mod routes;
mod stores;
mod tests;

use crate::{
  handlers::assets::get_assets,
  stores::db_key_store::{ensure_keys, DBKeyStore},
};
use atomic_lti::stores::key_store::KeyStore;
use axum::Router;
use dotenv::dotenv;
use log::info;
use std::{collections::HashMap, sync::Arc, time::Duration};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
  cors::{Any, CorsLayer},
  normalize_path::NormalizePathLayer,
  trace::TraceLayer,
};

pub struct AppState {
  pub pool: db::Pool,
  pub jwk_passphrase: String,
  pub assets: HashMap<String, String>,
  pub key_store: Arc<dyn KeyStore + Send + Sync>,
}

#[tokio::main]
async fn main() {
  dotenv().ok();
  env_logger::init();

  let config = crate::config::Config::from_env().expect("Invalid environment configuration");

  // create db connection pool
  let database_url = config.database_url.clone();
  let pool = db::init_pool(&database_url).await.expect("Failed to create database pool.");
  info!("Connected to {}", database_url);

  // Ensure required keys are setup
  if config.jwk_passphrase.is_empty() {
    panic!(
      "There is a problem with the jwk_passphrase. Please ensure it is set config/secrets.json"
    );
  }

  // Ensure there is a key in the database for jwks
  ensure_keys(&pool, &config.jwk_passphrase).await.expect("There is a problem with the JWKs. No entry was found in the database a new key could not be generated.");

  let assets = get_assets();
  let key_store = Arc::new(DBKeyStore::new(&pool, &config.jwk_passphrase)) as Arc<dyn KeyStore + Send + Sync>;

  let state = Arc::new(AppState {
    pool: pool.clone(),
    jwk_passphrase: config.jwk_passphrase.clone(),
    assets,
    key_store: key_store.clone(),
  });

  let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods([axum::http::Method::GET, axum::http::Method::POST])
    .allow_headers([
      axum::http::header::AUTHORIZATION,
      axum::http::header::ACCEPT,
      axum::http::header::CONTENT_TYPE,
    ])
    .allow_credentials(true)
    .max_age(Duration::from_secs(3600));

  let app = Router::new()
    .merge(routes::routes(key_store))
    .with_state(state)
    .layer(
      ServiceBuilder::new()
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .layer(NormalizePathLayer::trim_trailing_slash()),
    );

  let addr = format!("{}:{}", config.host, config.port);
  let listener = TcpListener::bind(&addr).await.unwrap();

  info!("Starting server at http://{}", addr);
  axum::serve(listener, app).await.unwrap();
}
