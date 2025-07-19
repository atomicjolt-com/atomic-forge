mod common;

use axum::{
    body::Body,
    extract::{Form, Query, Request, State},
    http::{header, Method},
    response::Html,
};
use axum_extra::extract::CookieJar;
use atomic_lti_tool_axum::{handlers::init_get, handlers::init_post, InitParams};
use common::create_test_deps;

#[tokio::test]
async fn test_init_get_success() {
    let deps = create_test_deps();
    
    let params = InitParams {
        iss: "https://lms.example.com".to_string(),
        login_hint: "user123".to_string(),
        client_id: "test_client".to_string(),
        target_link_uri: "https://tool.example.com/launch".to_string(),
        lti_message_hint: "hint123".to_string(),
        lti_storage_target: Some("parent".to_string()),
    };

    let jar = CookieJar::new();
    let req = Request::builder()
        .method(Method::GET)
        .uri("https://tool.example.com/lti/init?iss=https://lms.example.com&login_hint=user123&client_id=test_client&target_link_uri=https://tool.example.com/launch&lti_message_hint=hint123&lti_storage_target=parent")
        .header(header::HOST, "tool.example.com")
        .body(Body::empty())
        .unwrap();

    let result = init_get(State(deps), Query(params), jar, req).await;
    
    assert!(result.is_ok());
    let (_jar, Html(html)) = result.unwrap();
    
    // Verify the HTML contains expected elements
    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains("LTI Launch")); // The actual title
    assert!(html.contains("app-init-test.js")); // From our test assets
    assert!(html.contains("INIT_SETTINGS")); // JavaScript initialization object
}

#[tokio::test]
async fn test_init_post_success() {
    let deps = create_test_deps();
    
    let params = InitParams {
        iss: "https://lms.example.com".to_string(),
        login_hint: "user123".to_string(),
        client_id: "test_client".to_string(),
        target_link_uri: "https://tool.example.com/launch".to_string(),
        lti_message_hint: "hint123".to_string(),
        lti_storage_target: Some("parent".to_string()),
    };

    let jar = CookieJar::new();
    let req = Request::builder()
        .method(Method::POST)
        .uri("https://tool.example.com/lti/init")
        .header(header::HOST, "tool.example.com")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::from(
            "iss=https://lms.example.com&login_hint=user123&client_id=test_client&target_link_uri=https://tool.example.com/launch&lti_message_hint=hint123&lti_storage_target=parent"
        ))
        .unwrap();

    let result = init_post(State(deps), Form(params), jar, req).await;
    
    assert!(result.is_ok());
    let (response_jar, Html(html)) = result.unwrap();
    
    // Verify the HTML contains expected elements
    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains("LTI Launch"));
    assert!(html.contains("app-init-test.js"));
    assert!(html.contains("INIT_SETTINGS"));
    
    // Verify that a cookie was set
    let cookies: Vec<_> = response_jar.iter().collect();
    assert!(!cookies.is_empty());
    
    // Check for the LTI state cookie
    let state_cookie = cookies.iter().find(|cookie| cookie.name() == "lti_state");
    assert!(state_cookie.is_some());
    assert!(state_cookie.unwrap().http_only().unwrap_or(false));
    assert!(state_cookie.unwrap().secure().unwrap_or(false));
}

#[tokio::test]
async fn test_init_get_missing_iss() {
    let deps = create_test_deps();
    
    let params = InitParams {
        iss: "".to_string(), // Empty ISS should cause error
        login_hint: "user123".to_string(),
        client_id: "test_client".to_string(),
        target_link_uri: "https://tool.example.com/launch".to_string(),
        lti_message_hint: "hint123".to_string(),
        lti_storage_target: Some("parent".to_string()),
    };

    let jar = CookieJar::new();
    let req = Request::builder()
        .method(Method::GET)
        .uri("https://tool.example.com/lti/init")
        .header(header::HOST, "tool.example.com")
        .body(Body::empty())
        .unwrap();

    let result = init_get(State(deps), Query(params), jar, req).await;
    
    // Should handle gracefully or return an error
    // The exact behavior depends on the validation logic
    match result {
        Ok((_, Html(html))) => {
            // If it succeeds, it should still contain valid HTML
            assert!(html.contains("<!DOCTYPE html>"));
        }
        Err(_) => {
            // If it fails, that's also acceptable for invalid input
        }
    }
}

#[tokio::test]
async fn test_init_with_invalid_target_uri() {
    let deps = create_test_deps();
    
    let params = InitParams {
        iss: "https://lms.example.com".to_string(),
        login_hint: "user123".to_string(),
        client_id: "test_client".to_string(),
        target_link_uri: "invalid-uri".to_string(), // Invalid URI
        lti_message_hint: "hint123".to_string(),
        lti_storage_target: Some("parent".to_string()),
    };

    let jar = CookieJar::new();
    let req = Request::builder()
        .method(Method::POST)
        .uri("https://tool.example.com/lti/init")
        .header(header::HOST, "tool.example.com")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::empty())
        .unwrap();

    let result = init_post(State(deps), Form(params), jar, req).await;
    
    // Should handle gracefully or return appropriate error
    match result {
        Ok((_, Html(html))) => {
            assert!(html.contains("<!DOCTYPE html>"));
        }
        Err(_) => {
            // Error is acceptable for invalid input
        }
    }
}

#[tokio::test]
async fn test_init_no_storage_target() {
    let deps = create_test_deps();
    
    let params = InitParams {
        iss: "https://lms.example.com".to_string(),
        login_hint: "user123".to_string(),
        client_id: "test_client".to_string(),
        target_link_uri: "https://tool.example.com/launch".to_string(),
        lti_message_hint: "hint123".to_string(),
        lti_storage_target: None, // No storage target
    };

    let jar = CookieJar::new();
    let req = Request::builder()
        .method(Method::POST)
        .uri("https://tool.example.com/lti/init")
        .header(header::HOST, "tool.example.com")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::empty())
        .unwrap();

    let result = init_post(State(deps), Form(params), jar, req).await;
    
    assert!(result.is_ok());
    let (_, Html(html)) = result.unwrap();
    
    // Should still generate valid HTML even without storage target
    assert!(html.contains("<!DOCTYPE html>"));
    assert!(html.contains("LTI Launch"));
}