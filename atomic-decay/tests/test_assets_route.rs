#[cfg(test)]
mod tests {
  use atomic_decay::handlers::assets::serve_file;
  use axum::extract::Path;
  use axum::http::StatusCode;

  #[tokio::test]
  async fn test_serve_styles_css() {
    // Test that styles.css can be served
    let response = serve_file(Path("styles.css".to_string())).await;
    let (parts, _body) = response.into_parts();

    assert_eq!(parts.status, StatusCode::OK, "styles.css should be found");

    // Check content type
    let content_type = parts
      .headers
      .get("content-type")
      .expect("Should have content-type header")
      .to_str()
      .expect("Content-type should be valid string");

    assert!(
      content_type.contains("text/css"),
      "CSS files should have text/css content-type, got: {}",
      content_type
    );
  }

  #[tokio::test]
  async fn test_serve_nested_js_file() {
    // Test that nested files like js/app-*.js can be served
    let response = serve_file(Path("js/app-bGGBBC1E.js".to_string())).await;
    let (parts, _body) = response.into_parts();

    assert_eq!(
      parts.status,
      StatusCode::OK,
      "js/app-bGGBBC1E.js should be found"
    );
  }
}
