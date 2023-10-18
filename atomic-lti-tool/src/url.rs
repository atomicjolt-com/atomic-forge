use actix_web::HttpRequest;

/// Returns the full URL of the request
pub fn full_url(req: &HttpRequest) -> String {
  let connection_info = req.connection_info();
  let scheme = connection_info.scheme();
  let host = connection_info.host();
  let uri = req.uri().to_string();

  format!("{}://{}{}", scheme, host, uri)
}
