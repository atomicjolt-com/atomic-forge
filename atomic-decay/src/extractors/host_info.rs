use crate::errors::AppError;
use axum::{extract::FromRequestParts, http::request::Parts};

/// Host information extractor for cases where only host/scheme is needed
/// Lighter weight than AppContext
#[derive(Clone, Debug)]
#[allow(dead_code)] // Public API - fields may be used by consumers
pub struct HostInfo {
  pub host: String,
  pub scheme: String,
  pub port: Option<u16>,
}

impl HostInfo {
  #[allow(dead_code)] // Public API
  pub fn base_url(&self) -> String {
    match self.port {
      Some(port)
        if (self.scheme == "https" && port != 443) || (self.scheme == "http" && port != 80) =>
      {
        format!("{}://{}:{}", self.scheme, self.host, port)
      }
      _ => format!("{}://{}", self.scheme, self.host),
    }
  }
}

impl<S> FromRequestParts<S> for HostInfo
where
  S: Send + Sync,
{
  type Rejection = AppError;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    let host_header = parts
      .headers
      .get("host")
      .and_then(|h| h.to_str().ok())
      .unwrap_or("localhost");

    let (host, port) = if let Some(colon_pos) = host_header.rfind(':') {
      let host_part = &host_header[..colon_pos];
      let port_part = &host_header[colon_pos + 1..];

      let port = port_part.parse::<u16>().ok();
      (host_part.to_string(), port)
    } else {
      (host_header.to_string(), None)
    };

    let scheme = parts
      .headers
      .get("x-forwarded-proto")
      .and_then(|h| h.to_str().ok())
      .unwrap_or("https")
      .to_string();

    Ok(HostInfo { host, scheme, port })
  }
}
