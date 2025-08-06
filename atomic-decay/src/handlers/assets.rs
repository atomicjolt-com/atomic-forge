use axum::{
  body::Bytes,
  extract::Path,
  http::{header, StatusCode},
  response::{IntoResponse, Response},
};
use include_dir::{include_dir, Dir};
use std::collections::HashMap;

pub static STATIC_FILES: Dir = include_dir!("src/assets");

pub fn get_assets() -> HashMap<String, String> {
  let json = STATIC_FILES
    .get_file("js/assets.json")
    .expect("assets.json file not found")
    .contents_utf8()
    .expect("Unable to read assets.json file contents.");

  serde_json::from_str(json).expect("Unable to parse assets.json file contents.")
}

pub async fn serve_file(Path(filename): Path<String>) -> Response {
  if let Some(file) = STATIC_FILES.get_file(&filename) {
    let content_type = mime_guess::from_path(&filename).first_or_octet_stream();

    (
      StatusCode::OK,
      [(header::CONTENT_TYPE, content_type.to_string())],
      Bytes::from(file.contents().to_vec()),
    )
      .into_response()
  } else {
    (StatusCode::NOT_FOUND, "File not found").into_response()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use axum::http::StatusCode;

  #[test]
  fn test_get_assets() {
    let assets = get_assets();

    // Verify the assets map is not empty
    assert!(!assets.is_empty(), "Assets map should not be empty");

    // Check that expected keys exist
    assert!(
      assets.contains_key("app-init.ts"),
      "Should contain app-init.ts mapping"
    );
    assert!(
      assets.contains_key("app.ts"),
      "Should contain app.ts mapping"
    );

    // Verify the values are proper paths
    let app_init_path = assets.get("app-init.ts").unwrap();
    assert!(
      app_init_path.starts_with("/assets/js/"),
      "app-init.ts should map to /assets/js/ path"
    );
    assert!(
      app_init_path.ends_with(".js"),
      "app-init.ts should map to a .js file"
    );

    let app_path = assets.get("app.ts").unwrap();
    assert!(
      app_path.starts_with("/assets/js/"),
      "app.ts should map to /assets/js/ path"
    );
    assert!(app_path.ends_with(".js"), "app.ts should map to a .js file");
  }

  #[tokio::test]
  async fn test_serve_existing_file() {
    // Test serving a JavaScript file - directly call the handler
    let response = serve_file(Path("js/assets.json".to_string())).await;

    // Extract status and headers from response
    let (parts, body) = response.into_parts();
    assert_eq!(parts.status, StatusCode::OK);
    assert_eq!(
      parts.headers.get("content-type").unwrap(),
      "application/json"
    );

    let body_bytes = axum::body::to_bytes(body, usize::MAX).await.unwrap();
    assert!(!body_bytes.is_empty(), "Response body should not be empty");

    // Verify it's valid JSON
    let json: HashMap<String, String> = serde_json::from_slice(&body_bytes).unwrap();
    assert!(json.contains_key("app-init.ts"));
    assert!(json.contains_key("app.ts"));
  }

  #[tokio::test]
  async fn test_serve_css_file() {
    let response = serve_file(Path("styles.css".to_string())).await;

    let (parts, _body) = response.into_parts();
    assert_eq!(parts.status, StatusCode::OK);
    assert_eq!(parts.headers.get("content-type").unwrap(), "text/css");
  }

  #[tokio::test]
  async fn test_serve_image_file() {
    let response = serve_file(Path("images/icon.png".to_string())).await;

    let (parts, _body) = response.into_parts();
    assert_eq!(parts.status, StatusCode::OK);
    assert_eq!(parts.headers.get("content-type").unwrap(), "image/png");
  }

  #[tokio::test]
  async fn test_serve_non_existent_file() {
    let response = serve_file(Path("non-existent-file.txt".to_string())).await;

    let (parts, body) = response.into_parts();
    assert_eq!(parts.status, StatusCode::NOT_FOUND);

    let body_bytes = axum::body::to_bytes(body, usize::MAX).await.unwrap();
    assert_eq!(&body_bytes[..], b"File not found");
  }

  #[tokio::test]
  async fn test_serve_file_with_subdirectory() {
    // Test accessing a file in a subdirectory
    let response = serve_file(Path("images/logo.png".to_string())).await;

    let (parts, _body) = response.into_parts();
    assert_eq!(parts.status, StatusCode::OK);
    assert_eq!(parts.headers.get("content-type").unwrap(), "image/png");
  }

  #[tokio::test]
  async fn test_serve_file_directory_traversal_attempt() {
    // Attempt directory traversal (should fail)
    let response = serve_file(Path("../../../etc/passwd".to_string())).await;

    let (parts, _body) = response.into_parts();
    assert_eq!(parts.status, StatusCode::NOT_FOUND);
  }

  #[tokio::test]
  async fn test_serve_javascript_file_content_type() {
    let response = serve_file(Path("js/app-bGGBBC1E.js".to_string())).await;

    let (parts, _body) = response.into_parts();
    assert_eq!(parts.status, StatusCode::OK);
    let content_type = parts.headers.get("content-type").unwrap().to_str().unwrap();
    assert!(
      content_type.contains("javascript") || content_type == "application/x-javascript",
      "JavaScript files should have appropriate content-type, got: {content_type}"
    );
  }

  #[test]
  fn test_static_files_directory_exists() {
    // Verify the STATIC_FILES directory is properly loaded
    assert!(
      !STATIC_FILES.entries().is_empty(),
      "STATIC_FILES should contain entries"
    );

    // Check for expected directories
    assert!(
      STATIC_FILES.get_dir("js").is_some(),
      "Should have js directory"
    );
    assert!(
      STATIC_FILES.get_dir("images").is_some(),
      "Should have images directory"
    );

    // Check for expected files
    assert!(
      STATIC_FILES.get_file("styles.css").is_some(),
      "Should have styles.css"
    );
    assert!(
      STATIC_FILES.get_file("js/assets.json").is_some(),
      "Should have js/assets.json"
    );
  }
}
