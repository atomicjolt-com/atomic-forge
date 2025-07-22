use atomic_decay::test_helpers::*;
use axum::http::StatusCode;

#[tokio::test]
async fn test_health_endpoint() {
    // Create test app state and router
    let state = create_test_app_state().await;
    let app = create_test_app(state);

    // Make a GET request to the health endpoint
    let response = test_get(app, "/up").await;

    // Assert the response is successful
    assert_status(&response, StatusCode::OK);
    
    // Get the response body
    let body = body_string(response).await;
    assert_eq!(body, "OK");
}

// Example using the test_with_app macro
test_with_app!(test_health_with_macro, |app, _state| {
    let response = test_get(app, "/up").await;
    assert_status(&response, StatusCode::OK);
});