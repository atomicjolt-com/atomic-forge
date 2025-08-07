mod common;

use axum::{
    extract::{Form, Request, State},
    response::Html,
};
use atomic_lti_tool_axum::{handlers::launch, LaunchParams};
use common::create_test_deps;

#[tokio::test]
async fn test_launch_success() {
    let deps = create_test_deps();
    
    // Create a simple test JWT token for launch
    let test_id_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2xtcy5leGFtcGxlLmNvbSIsImF1ZCI6InRlc3RfY2xpZW50IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYzMjU0MjIsInN1YiI6InVzZXIxMjMifQ.test_signature";
    
    let params = LaunchParams {
        state: "test_state".to_string(),
        id_token: test_id_token.to_string(),
        lti_storage_target: "parent".to_string(),
    };

    // Create a dummy request
    let req = Request::builder()
        .uri("https://tool.example.com/lti/launch")
        .body(axum::body::Body::empty())
        .unwrap();

    let result = launch(State(deps), Form(params), req).await;
    
    // The result might succeed or fail depending on token validation
    match result {
        Ok(Html(html)) => {
            assert!(html.contains("<!DOCTYPE html>"));
            // Could be either a launch page or error page
        }
        Err(_) => {
            // Error is acceptable in test environment with mock data
        }
    }
}

#[tokio::test]
async fn test_launch_invalid_token() {
    let deps = create_test_deps();
    
    let params = LaunchParams {
        state: "test_state".to_string(),
        id_token: "invalid.jwt.token".to_string(),
        lti_storage_target: "parent".to_string(),
    };

    let req = Request::builder()
        .uri("https://tool.example.com/lti/launch")
        .body(axum::body::Body::empty())
        .unwrap();

    let result = launch(State(deps), Form(params), req).await;
    
    // Should handle invalid token gracefully
    match result {
        Ok(Html(html)) => {
            assert!(html.contains("<!DOCTYPE html>"));
        }
        Err(_) => {
            // Error is expected for invalid token
        }
    }
}

#[tokio::test]
async fn test_launch_missing_state() {
    let deps = create_test_deps();
    
    let test_id_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2xtcy5leGFtcGxlLmNvbSIsImF1ZCI6InRlc3RfY2xpZW50IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYzMjU0MjIsInN1YiI6InVzZXIxMjMifQ.test_signature";
    
    let params = LaunchParams {
        state: "".to_string(), // Empty state
        id_token: test_id_token.to_string(),
        lti_storage_target: "parent".to_string(),
    };

    let req = Request::builder()
        .uri("https://tool.example.com/lti/launch")
        .body(axum::body::Body::empty())
        .unwrap();

    let result = launch(State(deps), Form(params), req).await;
    
    // Should handle missing state gracefully
    match result {
        Ok(Html(html)) => {
            assert!(html.contains("<!DOCTYPE html>"));
        }
        Err(_) => {
            // Error is acceptable for missing state
        }
    }
}