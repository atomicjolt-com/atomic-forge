use axum::{response::IntoResponse, Json};
use std::collections::HashMap;

pub async fn index() -> impl IntoResponse {
  "This is Atomic Decay"
}

pub async fn up() -> impl IntoResponse {
  let mut result = HashMap::new();
  result.insert(String::from("up"), true);
  Json(result)
}
