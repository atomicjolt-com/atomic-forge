use std::{collections::HashMap, sync::Arc};

use atomic_lti_test::helpers::{
    create_mock_platform_store, MockJwtStore, MockKeyStore, MockOIDCStateStore, MockPlatformStore,
};
use atomic_lti_tool_axum::{
    handlers::LtiDependencies,
    ToolError,
};
use axum::{
    body::Body,
    extract::Request,
    http::Method,
};

// Simplified test implementation of LtiDependencies using Box<dyn KeyStore>
#[derive(Clone)]
pub struct TestLtiDeps {
    pub assets: HashMap<String, String>,
}

impl TestLtiDeps {
    pub fn new() -> Self {
        let mut assets = HashMap::new();
        assets.insert("app-init.js".to_string(), "app-init-test.js".to_string());
        assets.insert("app.js".to_string(), "app-test.js".to_string());

        Self { assets }
    }
}

impl LtiDependencies for TestLtiDeps {
    type OidcStateStore = MockOIDCStateStore;
    type PlatformStore = MockPlatformStore;
    type JwtStore = MockJwtStore<'static>;
    type KeyStore = MockKeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
        Ok(MockOIDCStateStore {})
    }

    async fn init_oidc_state_store(&self, _state: &str) -> Result<Self::OidcStateStore, ToolError> {
        Ok(MockOIDCStateStore {})
    }

    async fn create_platform_store(&self, _iss: &str) -> Result<Self::PlatformStore, ToolError> {
        let platform_store = create_mock_platform_store("https://lms.example.com");
        Ok(platform_store)
    }

    async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
        // Create a static reference for the jwt_store
        let key_store = Box::leak(Box::new(MockKeyStore::default()));
        Ok(MockJwtStore {
            key_store,
        })
    }

    fn key_store(&self) -> &Self::KeyStore {
        // This is a bit of a hack, but for testing we can just return a static reference
        use std::sync::LazyLock;
        static MOCK_KEY_STORE: LazyLock<MockKeyStore> = LazyLock::new(MockKeyStore::default);
        &MOCK_KEY_STORE
    }

    fn get_assets(&self) -> &HashMap<String, String> {
        &self.assets
    }

    fn get_host(&self, _req: &Request) -> String {
        "https://tool.example.com".to_string()
    }
}

// We'll create a wrapper for Arc<TestLtiDeps> to work around the orphan rule
pub struct ArcTestLtiDeps(pub Arc<TestLtiDeps>);

impl LtiDependencies for ArcTestLtiDeps {
    type OidcStateStore = MockOIDCStateStore;
    type PlatformStore = MockPlatformStore;
    type JwtStore = MockJwtStore<'static>;
    type KeyStore = MockKeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
        self.0.create_oidc_state_store().await
    }

    async fn init_oidc_state_store(&self, state: &str) -> Result<Self::OidcStateStore, ToolError> {
        self.0.init_oidc_state_store(state).await
    }

    async fn create_platform_store(&self, iss: &str) -> Result<Self::PlatformStore, ToolError> {
        self.0.create_platform_store(iss).await
    }

    async fn create_jwt_store(&self) -> Result<Self::JwtStore, ToolError> {
        self.0.create_jwt_store().await
    }

    fn key_store(&self) -> &Self::KeyStore {
        self.0.key_store()
    }

    fn get_assets(&self) -> &HashMap<String, String> {
        self.0.get_assets()
    }

    fn get_host(&self, req: &Request) -> String {
        self.0.get_host(req)
    }
}

// Test server setup helper  
pub fn create_test_deps() -> TestLtiDeps {
    TestLtiDeps::new()
}

// Helper for creating common test requests
pub fn create_init_request() -> Request<Body> {
    Request::builder()
        .method(Method::POST)
        .uri("/lti/init")
        .header("content-type", "application/x-www-form-urlencoded")
        .body(Body::from(
            "iss=https://lms.example.com&login_hint=user123&client_id=test_client&target_link_uri=https://tool.example.com/launch&lti_message_hint=hint123"
        ))
        .unwrap()
}

pub fn create_redirect_request() -> Request<Body> {
    Request::builder()
        .method(Method::GET)
        .uri("/lti/redirect?state=test_state&code=auth_code")
        .body(Body::empty())
        .unwrap()
}

pub fn create_launch_request() -> Request<Body> {
    Request::builder()
        .method(Method::POST)
        .uri("/lti/launch")
        .header("content-type", "application/x-www-form-urlencoded")
        .body(Body::from(
            "id_token=test.jwt.token&state=test_state"
        ))
        .unwrap()
}

pub fn create_jwks_request() -> Request<Body> {
    Request::builder()
        .method(Method::GET)
        .uri("/lti/jwks")
        .body(Body::empty())
        .unwrap()
}