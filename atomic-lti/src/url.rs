use crate::errors::AtomicError;
use url::Url;

// Returns the host from a URL string
pub fn parse_host(url: &str) -> Result<String, AtomicError> {
  let config_url = Url::parse(url).map_err(|e| AtomicError::Internal(e.to_string()))?;
  let host = config_url
    .host_str()
    .ok_or(AtomicError::Internal("No host found in URL".to_string()))?;
  Ok(host.to_string())
}
