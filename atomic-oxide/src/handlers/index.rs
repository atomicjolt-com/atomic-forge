use actix_web::{get, HttpResponse, Responder};
use std::collections::HashMap;

#[get("/")]
pub async fn index() -> impl Responder {
  HttpResponse::Ok().body("This is Atomic Oxide")
}

#[get("/up")]
pub async fn up() -> impl Responder {
  let mut result = HashMap::new();
  result.insert(String::from("up"), true);
  HttpResponse::Ok().json(result)
}
