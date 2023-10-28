use actix_web::HttpRequest;

/// Returns the full URL of the request
pub fn full_url(req: &HttpRequest) -> String {
  let connection_info = req.connection_info();
  let scheme = connection_info.scheme();
  let host = connection_info.host();
  let path_and_query = req.uri().path_and_query().map_or("", |pq| pq.as_str());
  format!("{}://{}{}", scheme, host, path_and_query)
}
