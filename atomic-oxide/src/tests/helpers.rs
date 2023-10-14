#[cfg(test)]
pub mod tests {
  use crate::db;
  use crate::db::Pool;
  use crate::handlers::assets::get_assets;
  use crate::routes::routes;
  use crate::AppState;
  use actix_web::dev::ServiceResponse;
  use actix_web::{test, web::Data, App};
  use lazy_static::lazy_static;

  lazy_static! {
    static ref POOL: Pool = init_pool();
  }

  pub const JWK_PASSPHRASE: &str = "1235asdffj#4$##!~*&)";

  // Initializes a r2d2 Pool to be used in tests
  fn init_pool() -> Pool {
    let database_url = std::env::var("TEST_DATABASE_URL").expect("TEST_DATABASE_URL must be set");
    db::init_pool(&database_url).expect("Failed to create database pool.")
  }

  // Returns a r2d2 Pooled Connection to be used in tests
  pub fn get_pool() -> Pool {
    POOL.clone()
  }

  // Helper for HTTP GET integration tests
  pub async fn test_get(route: &str) -> ServiceResponse {
    let state = get_app_state();
    let app = test::init_service(App::new().app_data(Data::new(state)).configure(routes)).await;

    test::call_service(&app, test::TestRequest::get().uri(route).to_request()).await
  }

  // Assert that a route is successful for HTTP GET requests
  pub async fn assert_get(route: &str) -> ServiceResponse {
    let response = test_get(route).await;
    assert!(response.status().is_success());
    response
  }

  // Returns app state
  pub fn get_app_state() -> AppState {
    let assets = get_assets();
    AppState {
      pool: get_pool().clone(),
      jwk_passphrase: JWK_PASSPHRASE.to_string(),
      assets: assets.clone(),
    }
  }

  // /// Returns app state wrapped in data
  // pub fn get_app_data() -> Data<AppState> {
  //   Data::new(get_app_state())
  // }
}
