use atomic_decay::{
  handlers::assets::get_assets, routes, stores::db_key_store::DBKeyStore, test_utils::test_helpers, AppState,
};
use atomic_lti::stores::key_store::KeyStore;
use axum::{
  body::Body,
  http::{Request, StatusCode},
  Router,
};
use std::{collections::HashMap, sync::Arc};
use tower::ServiceExt;

async fn create_test_app_state() -> Arc<AppState> {
  // Set up test database
  let pool = test_helpers::setup_test_db().await;
  let jwk_passphrase = "test_passphrase".to_string();
  let assets = get_assets();
  let key_store =
    Arc::new(DBKeyStore::new(&pool, &jwk_passphrase)) as Arc<dyn KeyStore + Send + Sync>;

  Arc::new(AppState {
    pool,
    jwk_passphrase,
    assets,
    key_store: key_store.clone(),
  })
}

fn create_test_app(state: Arc<AppState>) -> Router {
  let key_store = state.key_store.clone();
  Router::new()
    .merge(routes::routes(key_store))
    .with_state(state)
}

#[tokio::test]
async fn test_health_endpoint() {
  // Skip test if TEST_DATABASE_URL is not set
  if std::env::var("TEST_DATABASE_URL").is_err() {
    eprintln!("Skipping test: TEST_DATABASE_URL not set");
    return;
  }

  // Create test app state and router
  let state = create_test_app_state().await;
  let app = create_test_app(state);

  // Make a GET request to the health endpoint
  let response = app
    .oneshot(Request::builder().uri("/up").body(Body::empty()).unwrap())
    .await
    .unwrap();

  // Assert the response is successful
  assert_eq!(response.status(), StatusCode::OK);

  // Get the response body
  let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
    .await
    .unwrap();
  let body: HashMap<String, bool> = serde_json::from_slice(&body_bytes).unwrap();

  // Check the JSON response
  assert_eq!(body.get("up"), Some(&true));
}
