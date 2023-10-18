use actix_web::{get, HttpRequest, HttpResponse, Responder};
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

#[get("/assets/{filename:.*}")]
pub async fn serve_file(req: HttpRequest) -> impl Responder {
  let path = req.match_info().query("filename");
  if let Some(file) = STATIC_FILES.get_file(path) {
    let content_type = mime_guess::from_path(path).first_or_octet_stream();
    HttpResponse::Ok()
      .content_type(content_type.to_string())
      .body(file.contents())
  } else {
    HttpResponse::NotFound().body("File not found")
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::tests::get_app_state;
  use actix_web::http::StatusCode;
  use actix_web::{test, web, App};

  #[actix_web::test]
  async fn test_serve_file_found() {
    let state = get_app_state();
    let app = test::init_service(
      App::new()
        .app_data(web::Data::new(state))
        .service(serve_file),
    )
    .await;
    let req = test::TestRequest::get()
      .uri("/assets/assets.json")
      .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
  }

  #[actix_web::test]
  async fn test_serve_file_not_found() {
    let state = get_app_state();
    let app = test::init_service(
      App::new()
        .app_data(web::Data::new(state))
        .service(serve_file),
    )
    .await;
    let req = test::TestRequest::get()
      .uri("/assets/not_there.json")
      .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
  }
}
