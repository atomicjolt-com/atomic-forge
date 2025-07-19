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
      Bytes::from(file.contents().to_vec())
    ).into_response()
  } else {
    (
      StatusCode::NOT_FOUND,
      "File not found"
    ).into_response()
  }
}

#[cfg(test)]
mod tests {
  // TODO: Migrate tests to Axum
  // use super::*;
  // use crate::tests::helpers::tests::get_app_state;
  // use axum::http::StatusCode;
}
