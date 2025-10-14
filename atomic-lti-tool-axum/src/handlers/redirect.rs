use crate::{handlers::LtiDependencies, html::build_html, ToolError};
use atomic_lti::platforms::get_jwk_set;
use atomic_lti::stores::platform_store::PlatformStore;
use atomic_lti::validate::validate_launch;
use atomic_lti::jwks::decode;
use axum::{extract::State, response::Html, Form};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize, Serialize)]
pub struct RedirectParams {
  pub lti_storage_target: Option<String>,
  pub id_token: String,
  pub state: String,
}

fn redirect_html(
  id_token: &str,
  oidc_state: &str,
  lti_storage_target: &Option<String>,
  target_link_uri: &str,
) -> String {
  let head = "";
  let lti_storage_target_input = match lti_storage_target {
    Some(target) => format!(
      r#"<input type="hidden" name="lti_storage_target" value="{}" />"#,
      target
    ),
    None => "".to_string(),
  };

  let body = format!(
    r#"
    <form action="{target_link_uri}" method="POST">
      <input type="hidden" name="id_token" value="{id_token}" />
      <input type="hidden" name="state" value="{oidc_state}" />
      {lti_storage_target_input}
    </form>
    <script>
      window.addEventListener("load", () => {{
        document.forms[0].submit();
      }});
    </script>
  "#,
    target_link_uri = target_link_uri,
    id_token = id_token,
    oidc_state = oidc_state,
    lti_storage_target_input = lti_storage_target_input
  );

  build_html(head, &body)
}

/// OIDC redirect handler
/// Receives the authorization response from the platform and validates the ID token
pub async fn redirect<T>(
  State(deps): State<Arc<T>>,
  Form(params): Form<RedirectParams>,
) -> Result<Html<String>, ToolError>
where
  T: LtiDependencies + Send + Sync + 'static,
{
  // Get platform store
  let id_token_decoded = atomic_lti::jwt::insecure_decode::<atomic_lti::id_token::IdToken>(&params.id_token)
    .map_err(|e| ToolError::Unauthorized(format!("Failed to decode ID token: {}", e)))?;

  let platform_store = deps.create_platform_store(&id_token_decoded.claims.iss).await?;
  let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;

  // Get JWK set from platform
  let jwk_server_url = platform_store.get_jwk_server_url().await?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;

  // Decode and validate the ID token
  let id_token = decode(&params.id_token, &jwk_set)?;
  validate_launch(&params.state, &oidc_state_store, &id_token).await?;

  // Build HTML response that will auto-submit to the launch URL
  let html = redirect_html(
    &params.id_token,
    &params.state,
    &params.lti_storage_target,
    &id_token.target_link_uri,
  );

  Ok(Html(html))
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti::jwks::{encode, generate_jwk, Jwks};
  use atomic_lti_test::helpers::{
    create_mock_platform_store, generate_id_token, MockJwtStore, MockKeyStore, MockOIDCStateStore,
    MockPlatformStore, FAKE_STATE,
  };
  use axum::extract::Request;
  use openssl::rsa::Rsa;
  use std::collections::HashMap;

  struct TestDeps {
    platform_url: String,
  }

  impl LtiDependencies for TestDeps {
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
      Ok(create_mock_platform_store(&self.platform_url))
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

    fn get_host(&self, _req: &Request) -> String {
      "example.com".to_string()
    }
  }

  pub fn generate_redirect(url: &str) -> (String, MockPlatformStore, String) {
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let kid = "test_kid";
    let jwk = generate_jwk(kid, &rsa_key_pair).expect("Failed to generate JWK from RSA Key");
    let jwks = Jwks { keys: vec![jwk] };

    let platform_store = create_mock_platform_store(url);
    let jwks_json = serde_json::to_string(&jwks).expect("Serialization failed");

    let id_token = generate_id_token("https://example.com/lti/launch");

    // Encode the ID Token using the private key
    let id_token_encoded = encode(&id_token, kid, rsa_key_pair).expect("Failed to encode token");

    (id_token_encoded, platform_store, jwks_json)
  }

  #[tokio::test]
  async fn test_redirect_success() {
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, _platform_store, jwks_json) = generate_redirect(&url);
    let _mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let params = RedirectParams {
      id_token: id_token_encoded,
      state: FAKE_STATE.to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let deps = Arc::new(TestDeps { platform_url: url });
    let result = redirect(State(deps), Form(params)).await;

    assert!(result.is_ok());
    let html = result.unwrap().0;
    assert!(html.contains("https://example.com/lti/launch"));
  }

  #[tokio::test]
  async fn test_redirect_invalid_id_token() {
    let params = RedirectParams {
      id_token: "invalid.token.here".to_string(),
      state: FAKE_STATE.to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let deps = Arc::new(TestDeps { platform_url: "https://lms.example.com".to_string() });
    let result = redirect(State(deps), Form(params)).await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_redirect_invalid_oidc_state() {
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, _platform_store, jwks_json) = generate_redirect(&url);
    let _mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let params = RedirectParams {
      id_token: id_token_encoded,
      state: "bad_state".to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let deps = Arc::new(TestDeps { platform_url: url });
    let result = redirect(State(deps), Form(params)).await;

    assert!(result.is_err());
  }
}
