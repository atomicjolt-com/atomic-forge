use crate::errors::AtomicError;

// Sends a given request and implements error handling
pub async fn send_request(request: reqwest::RequestBuilder) -> Result<String, AtomicError> {
  let response = request
    .send()
    .await
    .map_err(|e| AtomicError::Internal(e.to_string()))?;

  let status = response.status();
  let body = response
    .text()
    .await
    .map_err(|e| AtomicError::Internal(e.to_string()))?;

  if !status.is_success() {
    return Err(AtomicError::Internal(body));
  }

  Ok(body)
}
