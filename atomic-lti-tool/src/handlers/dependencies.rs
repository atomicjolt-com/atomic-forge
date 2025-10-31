use crate::errors::AtomicToolError;
use actix_web::HttpRequest;
use atomic_lti::stores::{
  jwt_store::JwtStore, key_store::KeyStore, oidc_state_store::OIDCStateStore,
  platform_store::PlatformStore,
};
use std::collections::HashMap;

/// Trait for providing dependencies to LTI handlers
///
/// Implement this trait to provide your application's specific store
/// implementations to the generic LTI handlers. This pattern enables:
/// - Dependency injection
/// - Easy testing with mock implementations
/// - Flexibility to use different storage backends
///
/// # Type Parameters
///
/// The trait defines four associated types, each corresponding to a different
/// store that the LTI handlers need:
///
/// - `OidcStateStore`: Manages OIDC authentication state
/// - `PlatformStore`: Manages LMS platform configurations
/// - `JwtStore`: Handles JWT creation and validation
/// - `KeyStore`: Manages RSA keys for JWT signing
///
/// # Example
///
/// ```ignore
/// use atomic_lti_tool::handlers::dependencies::LtiDependencies;
/// use atomic_lti::stores::{
///     jwt_store::JwtStore,
///     key_store::KeyStore,
///     oidc_state_store::OIDCStateStore,
///     platform_store::PlatformStore,
/// };
/// use std::collections::HashMap;
///
/// struct MyAppDeps {
///     // Your application state, e.g., database pool
///     // pool: PgPool,
///     jwk_passphrase: String,
///     assets: HashMap<String, String>,
/// }
///
/// impl LtiDependencies for MyAppDeps {
///     type OidcStateStore = MyOidcStateStore;
///     type PlatformStore = MyPlatformStore;
///     type JwtStore = MyJwtStore;
///     type KeyStore = MyKeyStore;
///
///     async fn create_oidc_state_store(
///         &self,
///     ) -> Result<Self::OidcStateStore, atomic_lti_tool::errors::AtomicToolError> {
///         // Create and return your OIDC state store
///         todo!()
///     }
///
///     // ... implement other methods
/// }
/// ```
///
/// # Method Overview
///
/// - `create_oidc_state_store`: Create a new OIDC state store for authentication flow
/// - `init_oidc_state_store`: Initialize OIDC state store from existing state string
/// - `create_platform_store`: Create platform store for specific issuer
/// - `create_jwt_store`: Create JWT store for token operations
/// - `key_store`: Get reference to key store
/// - `get_assets`: Get compiled frontend assets mapping
/// - `get_host`: Extract host from HTTP request
pub trait LtiDependencies: Send + Sync {
  /// Associated type for OIDC state storage
  type OidcStateStore: OIDCStateStore;

  /// Associated type for platform storage
  type PlatformStore: PlatformStore;

  /// Associated type for JWT operations
  type JwtStore: JwtStore;

  /// Associated type for key management
  type KeyStore: KeyStore;

  /// Create a new OIDC state store for a new authentication flow
  ///
  /// This method is called at the beginning of an LTI launch to create
  /// a new state value for the OIDC authentication flow.
  ///
  /// # Returns
  ///
  /// A new instance of the OIDC state store with a fresh state value.
  ///
  /// # Errors
  ///
  /// Returns an error if the state store cannot be created (e.g., database error).
  fn create_oidc_state_store(
    &self,
  ) -> impl std::future::Future<Output = Result<Self::OidcStateStore, AtomicToolError>> + Send;

  /// Initialize OIDC state store from existing state string
  ///
  /// This method is called when processing an OIDC callback to load
  /// the previously created state.
  ///
  /// # Arguments
  ///
  /// * `state` - The state string from the OIDC callback
  ///
  /// # Returns
  ///
  /// An instance of the OIDC state store loaded with the specified state.
  ///
  /// # Errors
  ///
  /// Returns an error if the state cannot be found or loaded.
  fn init_oidc_state_store(
    &self,
    state: &str,
  ) -> impl std::future::Future<Output = Result<Self::OidcStateStore, AtomicToolError>> + Send;

  /// Create platform store for specific issuer
  ///
  /// This method creates a store for accessing platform (LMS) configuration
  /// for a specific issuer.
  ///
  /// # Arguments
  ///
  /// * `iss` - The issuer URL of the LMS platform
  ///
  /// # Returns
  ///
  /// A platform store instance for the specified issuer.
  ///
  /// # Errors
  ///
  /// Returns an error if the platform store cannot be created.
  fn create_platform_store(
    &self,
    iss: &str,
  ) -> impl std::future::Future<Output = Result<Self::PlatformStore, AtomicToolError>> + Send;

  /// Create JWT store for token operations
  ///
  /// This method creates a store for creating and validating JWTs.
  ///
  /// # Returns
  ///
  /// A JWT store instance.
  ///
  /// # Errors
  ///
  /// Returns an error if the JWT store cannot be created.
  fn create_jwt_store(
    &self,
  ) -> impl std::future::Future<Output = Result<Self::JwtStore, AtomicToolError>> + Send;

  /// Get reference to key store
  ///
  /// This method returns a reference to the key store, which manages
  /// RSA keys for JWT signing and verification.
  ///
  /// # Returns
  ///
  /// A reference to the key store.
  fn key_store(&self) -> &Self::KeyStore;

  /// Get compiled frontend assets mapping
  ///
  /// This method returns a mapping of asset names to their hashed filenames,
  /// typically used for cache busting in frontend assets.
  ///
  /// # Returns
  ///
  /// A reference to the assets mapping.
  fn get_assets(&self) -> &HashMap<String, String>;

  /// Extract host from request
  ///
  /// This method extracts the host (domain name) from an HTTP request,
  /// typically used to construct callback URLs.
  ///
  /// # Arguments
  ///
  /// * `req` - The HTTP request
  ///
  /// # Returns
  ///
  /// The host string extracted from the request.
  fn get_host(&self, req: &HttpRequest) -> String;
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti::errors::{OIDCError, PlatformError, SecureError};
  use atomic_lti::id_token::IdToken;
  use atomic_lti::stores::oidc_state_store::OIDCStateData;
  use atomic_lti::stores::platform_store::PlatformData;
  use async_trait::async_trait;
  use chrono::NaiveDateTime;
  use openssl::rsa::Rsa;
  use std::sync::Arc;

  // Mock implementations for testing

  struct MockOidcStateStore {
    state: String,
    nonce: String,
  }

  #[async_trait]
  impl OIDCStateStore for MockOidcStateStore {
    async fn get_state(&self) -> String {
      self.state.clone()
    }

    async fn get_nonce(&self) -> String {
      self.nonce.clone()
    }

    async fn get_created_at(&self) -> NaiveDateTime {
      use chrono::DateTime;
      DateTime::from_timestamp(0, 0).unwrap().naive_utc()
    }

    async fn destroy(&self) -> Result<usize, OIDCError> {
      Ok(1)
    }

    async fn create_with_issuer(
      &self,
      _state: &str,
      _nonce: &str,
      _issuer: &str,
    ) -> Result<(), OIDCError> {
      Ok(())
    }

    async fn find_by_state(&self, state: &str) -> Result<OIDCStateData, OIDCError> {
      Ok(OIDCStateData {
        state: state.to_string(),
        nonce: self.nonce.clone(),
        issuer: None,
      })
    }
  }

  struct MockPlatformStore {
    issuer: String,
  }

  #[async_trait]
  impl PlatformStore for MockPlatformStore {
    async fn get_oidc_url(&self) -> Result<String, PlatformError> {
      Ok(format!("https://{}/oidc", self.issuer))
    }

    async fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
      Ok(format!("https://{}/jwks", self.issuer))
    }

    async fn get_token_url(&self) -> Result<String, PlatformError> {
      Ok(format!("https://{}/token", self.issuer))
    }

    async fn create(&self, _platform: PlatformData) -> Result<PlatformData, PlatformError> {
      Ok(PlatformData {
        issuer: self.issuer.clone(),
        name: Some("Mock Platform".to_string()),
        jwks_url: format!("https://{}/jwks", self.issuer),
        token_url: format!("https://{}/token", self.issuer),
        oidc_url: format!("https://{}/oidc", self.issuer),
      })
    }

    async fn find_by_iss(&self, _issuer: &str) -> Result<Option<PlatformData>, PlatformError> {
      Ok(None)
    }

    async fn update(
      &self,
      _issuer: &str,
      platform: PlatformData,
    ) -> Result<PlatformData, PlatformError> {
      Ok(platform)
    }

    async fn delete(&self, _issuer: &str) -> Result<(), PlatformError> {
      Ok(())
    }

    async fn list(&self) -> Result<Vec<PlatformData>, PlatformError> {
      Ok(vec![])
    }
  }

  struct MockJwtStore;

  #[async_trait]
  impl JwtStore for MockJwtStore {
    async fn build_jwt(&self, _id_token: &IdToken) -> Result<String, SecureError> {
      Ok("mock.jwt.token".to_string())
    }
  }

  struct MockKeyStore {
    keys: HashMap<String, Rsa<openssl::pkey::Private>>,
  }

  #[async_trait]
  impl KeyStore for MockKeyStore {
    async fn get_current_keys(
      &self,
      _limit: i64,
    ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError> {
      Ok(self.keys.clone())
    }

    async fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError> {
      self
        .keys
        .iter()
        .next()
        .map(|(k, v)| (k.clone(), v.clone()))
        .ok_or(SecureError::EmptyKeys)
    }

    async fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError> {
      self.keys.get(kid).cloned().ok_or(SecureError::InvalidKeyId)
    }
  }

  // Mock implementation of LtiDependencies for testing

  struct MockLtiDeps {
    key_store: Arc<MockKeyStore>,
    assets: HashMap<String, String>,
  }

  impl MockLtiDeps {
    fn new() -> Self {
      let mut keys = HashMap::new();
      let rsa_key = Rsa::generate(2048).unwrap();
      keys.insert("test_key_1".to_string(), rsa_key);

      let key_store = Arc::new(MockKeyStore { keys });

      let mut assets = HashMap::new();
      assets.insert("app.js".to_string(), "app.abc123.js".to_string());
      assets.insert("styles.css".to_string(), "styles.def456.css".to_string());

      Self { key_store, assets }
    }
  }

  impl LtiDependencies for MockLtiDeps {
    type OidcStateStore = MockOidcStateStore;
    type PlatformStore = MockPlatformStore;
    type JwtStore = MockJwtStore;
    type KeyStore = MockKeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, AtomicToolError> {
      Ok(MockOidcStateStore {
        state: "new-state-123".to_string(),
        nonce: "new-nonce-456".to_string(),
      })
    }

    async fn init_oidc_state_store(
      &self,
      state: &str,
    ) -> Result<Self::OidcStateStore, AtomicToolError> {
      Ok(MockOidcStateStore {
        state: state.to_string(),
        nonce: "loaded-nonce".to_string(),
      })
    }

    async fn create_platform_store(
      &self,
      iss: &str,
    ) -> Result<Self::PlatformStore, AtomicToolError> {
      Ok(MockPlatformStore {
        issuer: iss.to_string(),
      })
    }

    async fn create_jwt_store(&self) -> Result<Self::JwtStore, AtomicToolError> {
      Ok(MockJwtStore)
    }

    fn key_store(&self) -> &Self::KeyStore {
      &self.key_store
    }

    fn get_assets(&self) -> &HashMap<String, String> {
      &self.assets
    }

    fn get_host(&self, _req: &HttpRequest) -> String {
      "tool.example.com".to_string()
    }
  }

  #[tokio::test]
  async fn test_create_oidc_state_store() {
    let deps = MockLtiDeps::new();
    let store = deps.create_oidc_state_store().await.unwrap();
    assert_eq!(store.get_state().await, "new-state-123");
    assert_eq!(store.get_nonce().await, "new-nonce-456");
  }

  #[tokio::test]
  async fn test_init_oidc_state_store() {
    let deps = MockLtiDeps::new();
    let store = deps
      .init_oidc_state_store("existing-state-789")
      .await
      .unwrap();
    assert_eq!(store.get_state().await, "existing-state-789");
    assert_eq!(store.get_nonce().await, "loaded-nonce");
  }

  #[tokio::test]
  async fn test_create_platform_store() {
    let deps = MockLtiDeps::new();
    let store = deps
      .create_platform_store("https://lms.example.com")
      .await
      .unwrap();
    assert_eq!(
      store.get_oidc_url().await.unwrap(),
      "https://https://lms.example.com/oidc"
    );
  }

  #[tokio::test]
  async fn test_create_jwt_store() {
    let deps = MockLtiDeps::new();
    let store = deps.create_jwt_store().await.unwrap();
    let id_token = IdToken::default();
    let jwt = store.build_jwt(&id_token).await.unwrap();
    assert_eq!(jwt, "mock.jwt.token");
  }

  #[tokio::test]
  async fn test_key_store() {
    let deps = MockLtiDeps::new();
    let key_store = deps.key_store();
    let (kid, _key) = key_store.get_current_key().await.unwrap();
    assert_eq!(kid, "test_key_1");
  }

  #[tokio::test]
  async fn test_get_assets() {
    let deps = MockLtiDeps::new();
    let assets = deps.get_assets();
    assert_eq!(assets.get("app.js"), Some(&"app.abc123.js".to_string()));
    assert_eq!(
      assets.get("styles.css"),
      Some(&"styles.def456.css".to_string())
    );
  }

  #[tokio::test]
  async fn test_get_host() {
    let deps = MockLtiDeps::new();
    // Create a mock HttpRequest (this is simplified - in real tests you'd use actix-web test utilities)
    let req = actix_web::test::TestRequest::default().to_http_request();
    let host = deps.get_host(&req);
    assert_eq!(host, "tool.example.com");
  }

  #[tokio::test]
  async fn test_trait_is_send_sync() {
    // This test verifies that the trait and its implementations are Send + Sync
    fn assert_send_sync<T: Send + Sync>() {}
    assert_send_sync::<MockLtiDeps>();
  }
}
