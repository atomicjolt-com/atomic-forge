use crate::{handlers::LtiDependencies, ToolError};
use atomic_lti::jwks::get_current_jwks;
use axum::{extract::State, Json};
use std::sync::Arc;

/// JWKS endpoint handler
/// Returns the current JSON Web Key Set for JWT verification
pub async fn jwks<T>(State(deps): State<Arc<T>>) -> Result<Json<atomic_lti::jwks::Jwks>, ToolError>
where
  T: LtiDependencies + Send + Sync + 'static,
{
  let key_store = deps.key_store();
  let jwks = get_current_jwks(key_store).await?;
  Ok(Json(jwks))
}

#[cfg(test)]
mod tests {
  use super::*;
  use async_trait::async_trait;
  use atomic_lti::{errors::SecureError, stores::key_store::KeyStore};
  use atomic_lti_test::helpers::MockKeyStore;
  use openssl::rsa::Rsa;
  use std::collections::HashMap;

  struct TestDeps;

  impl LtiDependencies for TestDeps {
    type OidcStateStore = atomic_lti_test::helpers::MockOIDCStateStore;
    type PlatformStore = atomic_lti_test::helpers::MockPlatformStore;
    type JwtStore = atomic_lti_test::helpers::MockJwtStore<'static>;
    type KeyStore = MockKeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
      unimplemented!()
    }

    async fn init_oidc_state_store(&self, _state: &str) -> Result<Self::OidcStateStore, ToolError> {
      unimplemented!()
    }

    async fn create_platform_store(&self, _iss: &str) -> Result<Self::PlatformStore, ToolError> {
      unimplemented!()
    }

    async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
      unimplemented!()
    }

    fn key_store(&self) -> &Self::KeyStore {
      use std::sync::LazyLock;
      static MOCK_KEY_STORE: LazyLock<MockKeyStore> = LazyLock::new(MockKeyStore::default);
      &MOCK_KEY_STORE
    }

    fn get_assets(&self) -> &HashMap<String, String> {
      unimplemented!()
    }

    fn get_host(&self, _req: &axum::extract::Request) -> String {
      unimplemented!()
    }
  }

  #[tokio::test]
  async fn returns_jwks_with_valid_key_store() {
    let deps = TestDeps;
    let state = State(Arc::new(deps));

    let result = jwks(state).await;

    assert!(result.is_ok());
    let jwks = result.unwrap().0;
    assert_eq!(jwks.keys.len(), 1);
    assert_eq!(jwks.keys[0].kty, "RSA");
    assert!(!jwks.keys[0].n.is_empty());
    assert_eq!(jwks.keys[0].e, "AQAB");
  }

  #[tokio::test]
  async fn returns_error_with_invalid_key_store() {
    struct InvalidKeyStore;

    #[async_trait]
    impl KeyStore for InvalidKeyStore {
      async fn get_current_keys(
        &self,
        _limit: i64,
      ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
        Err(SecureError::EmptyKeys)
      }
      async fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
        Err(SecureError::EmptyKeys)
      }
      async fn get_key(&self, _kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
        Err(SecureError::InvalidKeyId)
      }
    }

    struct TestDepsInvalid;

    impl LtiDependencies for TestDepsInvalid {
      type OidcStateStore = atomic_lti_test::helpers::MockOIDCStateStore;
      type PlatformStore = atomic_lti_test::helpers::MockPlatformStore;
      type JwtStore = atomic_lti_test::helpers::MockJwtStore<'static>;
      type KeyStore = InvalidKeyStore;

      async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
        unimplemented!()
      }

      async fn init_oidc_state_store(&self, _state: &str) -> Result<Self::OidcStateStore, ToolError> {
        unimplemented!()
      }

      async fn create_platform_store(&self, _iss: &str) -> Result<Self::PlatformStore, ToolError> {
        unimplemented!()
      }

      async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
        unimplemented!()
      }

      fn key_store(&self) -> &Self::KeyStore {
        use std::sync::LazyLock;
        static INVALID_KEY_STORE: LazyLock<InvalidKeyStore> = LazyLock::new(|| InvalidKeyStore);
        &INVALID_KEY_STORE
      }

      fn get_assets(&self) -> &HashMap<String, String> {
        unimplemented!()
      }

      fn get_host(&self, _req: &axum::extract::Request) -> String {
        unimplemented!()
      }
    }

    let deps = TestDepsInvalid;
    let state = State(Arc::new(deps));

    let result = jwks(state).await;

    assert!(result.is_err());
    let error = result.unwrap_err();
    assert_eq!(error.to_string(), "Internal error: There are currently no keys available");
  }
}
