use atomic_lti::errors::SecureError;
use atomic_lti::id_token::IdToken;
use atomic_lti::jwt::encode_using_store;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::key_store::KeyStore;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ToolJwt {
  pub client_id: String,
  pub iss: String,
  pub sub: String,
  pub exp: i64,
  pub iat: i64,
}

pub struct ToolJwtStore<'a> {
  pub key_store: &'a dyn KeyStore,
}

impl<'a> JwtStore for ToolJwtStore<'a> {
  fn build_jwt(&self, id_token: &IdToken) -> Result<String, SecureError> {
    let jwt = ToolJwt {
      client_id: id_token.client_id(),
      // TODO: these values need to be reworked. iss should be this app not the iss from the id token
      iss: id_token.iss.clone(),
      sub: id_token.sub.clone(),
      // aud: vec![aud.to_string()],
      iat: Utc::now().timestamp(),
      exp: (Utc::now() + Duration::minutes(300)).timestamp(),
    };

    encode_using_store(&jwt, self.key_store)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti::jwt::decode_using_store;
  use atomic_lti_test::helpers::MockKeyStore;

  fn test_decode_tool_jwt(
    tool_jwt: &str,
    key_store: &dyn KeyStore,
  ) -> Result<ToolJwt, SecureError> {
    let data = decode_using_store::<ToolJwt>(tool_jwt, key_store)?;
    Ok(data.claims)
  }

  #[test]
  fn test_encode_decode() {
    let tool_jwt = ToolJwt {
      client_id: "test_client_id".to_string(),
      iss: "test_iss".to_string(),
      sub: "bob".to_string(),
      iat: Utc::now().timestamp(),
      exp: (Utc::now() + Duration::minutes(300)).timestamp(),
    };

    let key_store = MockKeyStore::default();

    // Test encoding
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store).expect("Failed to encode JWT");
    assert!(!encoded_jwt.is_empty());

    // Test decoding
    let decoded_jwt = test_decode_tool_jwt(&encoded_jwt, &key_store).unwrap();
    assert_eq!(decoded_jwt.iss, tool_jwt.iss);
  }

  #[test]
  fn test_decode_with_wrong_kid() {
    let tool_jwt = ToolJwt {
      client_id: "test_client_id".to_string(),
      sub: "bob".to_string(),
      iss: "test_iss".to_string(),
      iat: Utc::now().timestamp(),
      exp: (Utc::now() + Duration::minutes(300)).timestamp(),
    };
    let key_store = MockKeyStore::default();

    // Encode
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store).expect("Failed to encode JWT");

    // Decode with a different key store
    let key_store_too = MockKeyStore::default();
    let result = test_decode_tool_jwt(&encoded_jwt, &key_store_too);

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), SecureError::InvalidKeyId);
  }
}
