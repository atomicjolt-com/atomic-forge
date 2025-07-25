// Re-export modules for testing
pub mod config;
pub mod db;
pub mod defines;
pub mod errors;
pub mod extractors;
pub mod handlers;
pub mod models;
pub mod routes;
pub mod stores;
pub mod tests;
pub mod types;

// Make test_helpers available for integration tests
pub mod test_helpers;

// Re-export the AppState
use atomic_lti::stores::key_store::KeyStore;
use std::{collections::HashMap, sync::Arc};

pub struct AppState {
  pub pool: db::Pool,
  pub jwk_passphrase: String,
  pub assets: HashMap<String, String>,
  pub key_store: Arc<dyn KeyStore + Send + Sync>,
}
