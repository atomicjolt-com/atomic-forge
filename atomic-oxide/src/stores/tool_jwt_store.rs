use atomic_lti::errors::SecureError;
use atomic_lti::id_token::IdToken;
use atomic_lti::jwt::encode_using_store;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::key_store::KeyStore;
use async_trait::async_trait;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ToolJwt {
  pub client_id: String,
  pub deployment_id: String,
  pub iss: String,
  pub sub: String,
  pub exp: i64,
  pub iat: i64,
  pub names_and_roles_endpoint_url: Option<String>,
  pub platform_iss: String,
  pub deep_link_claim_data: Option<String>,
}

pub struct ToolJwtStore {
  pub key_store: Arc<dyn KeyStore + Send + Sync>,
  pub host: String,
}

#[async_trait]
impl JwtStore for ToolJwtStore {
  async fn build_jwt(&self, id_token: &IdToken) -> Result<String, SecureError> {
    let names_and_roles_endpoint_url = id_token
      .names_and_roles
      .as_ref()
      .map(|names_and_roles| names_and_roles.context_memberships_url.clone());

    let jwt = ToolJwt {
      client_id: id_token.client_id(),
      deployment_id: id_token.deployment_id.clone(),
      iss: self.host.clone(),
      platform_iss: id_token.iss.clone(),
      sub: id_token.sub.clone(), // sub provides the LMS user id
      iat: Utc::now().timestamp(),
      exp: (Utc::now() + Duration::minutes(300)).timestamp(),
      names_and_roles_endpoint_url,
      deep_link_claim_data: id_token.data.clone(),
    };

    encode_using_store(&jwt, self.key_store.as_ref()).await
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti::jwt::decode_using_store;
  use atomic_lti_test::helpers::MockKeyStore;

  async fn test_decode_tool_jwt(
    tool_jwt: &str,
    key_store: &dyn KeyStore,
  ) -> Result<ToolJwt, SecureError> {
    let data = decode_using_store::<ToolJwt>(tool_jwt, key_store).await?;
    Ok(data.claims)
  }

  #[tokio::test]
  async fn test_encode_decode() {
    let tool_jwt = ToolJwt {
      client_id: "test_client_id".to_string(),
      iss: "test_iss".to_string(),
      deployment_id: "test_deployment_id".to_string(),
      platform_iss: "test_platform_iss".to_string(),
      sub: "bob".to_string(),
      iat: Utc::now().timestamp(),
      exp: (Utc::now() + Duration::minutes(300)).timestamp(),
      names_and_roles_endpoint_url: None,
      deep_link_claim_data: None,
    };

    let key_store = MockKeyStore::default();

    // Test encoding
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store).await.expect("Failed to encode JWT");
    assert!(!encoded_jwt.is_empty());

    // Test decoding
    let decoded_jwt = test_decode_tool_jwt(&encoded_jwt, &key_store).await.unwrap();
    assert_eq!(decoded_jwt.iss, tool_jwt.iss);
  }

  #[tokio::test]
  async fn test_decode_with_wrong_kid() {
    let tool_jwt = ToolJwt {
      client_id: "test_client_id".to_string(),
      sub: "bob".to_string(),
      iss: "test_iss".to_string(),
      deployment_id: "test_deployment_id".to_string(),
      platform_iss: "test_platform_iss".to_string(),
      iat: Utc::now().timestamp(),
      exp: (Utc::now() + Duration::minutes(300)).timestamp(),
      names_and_roles_endpoint_url: None,
      deep_link_claim_data: None,
    };
    let key_store = MockKeyStore::default();

    // Encode
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store).await.expect("Failed to encode JWT");

    // Decode with a different key store
    let key_store_too = MockKeyStore::default();
    let result = test_decode_tool_jwt(&encoded_jwt, &key_store_too).await;

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), SecureError::InvalidKeyId);
  }
}
