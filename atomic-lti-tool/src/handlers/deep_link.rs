use crate::errors::AtomicToolError;
use actix_web::HttpResponse;
use atomic_lti::{
  deep_linking::{ContentItem, DeepLinking},
  stores::key_store::KeyStore,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DeepLinkJwtResponse {
  jwt: String,
}

pub async fn sign_deep_link(
  client_id: &str,
  platform_iss: &str,
  deployment_id: &str,
  deep_link_claim_data: Option<String>,
  content_items: &[ContentItem],
  key_store: &dyn KeyStore,
) -> Result<HttpResponse, AtomicToolError> {
  let (kid, rsa_key_pair) = key_store.get_current_key()?;
  let deep_jwt = DeepLinking::create_deep_link_jwt(
    client_id,
    platform_iss,
    deployment_id,
    content_items,
    deep_link_claim_data,
    &kid,
    rsa_key_pair.clone(),
  )?;

  let response = DeepLinkJwtResponse { jwt: deep_jwt };
  let json =
    serde_json::to_string(&response).map_err(|e| AtomicToolError::Internal(e.to_string()))?;

  Ok(
    HttpResponse::Ok()
      .content_type("application/json")
      .body(json),
  )
}
