use crate::errors::AtomicToolError;
use crate::html::build_html;
use actix_web::HttpResponse;
use atomic_lti::platforms::get_jwk_set;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::validate::validate_launch;
use atomic_lti::{jwks::decode, stores::platform_store::PlatformStore};
use serde::{Deserialize, Serialize};

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

pub async fn redirect(
  params: &RedirectParams,
  platform_store: &dyn PlatformStore,
  oidc_state_store: &dyn OIDCStateStore,
) -> Result<HttpResponse, AtomicToolError> {
  let jwk_server_url = platform_store.get_jwk_server_url()?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;
  let id_token = decode(&params.id_token, &jwk_set)?;
  validate_launch(&params.state, oidc_state_store, &id_token)?;

  let html = redirect_html(
    &params.id_token,
    &params.state,
    &params.lti_storage_target,
    &id_token.target_link_uri,
  );

  Ok(HttpResponse::Ok().content_type("text/html").body(html))
}

#[cfg(test)]
mod tests {
  use super::*;
  use actix_web::{http, test};
  use atomic_lti::jwks::{encode, generate_jwk, Jwks};
  use atomic_lti::platforms::StaticPlatformStore;
  use atomic_lti_test::helpers::{
    create_mock_platform_store, generate_id_token, MockOIDCStateStore, MockPlatformStore,
    FAKE_STATE,
  };
  use openssl::rsa::Rsa;

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
    let (id_token_encoded, platform_store, jwks_json) = generate_redirect(&url);
    let mock = server
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
    let oidc_state_store = MockOIDCStateStore {};
    let resp = redirect(&params, &platform_store, &oidc_state_store)
      .await
      .unwrap();

    mock.assert();
    assert_eq!(resp.status(), http::StatusCode::OK);
  }

  #[test]
  async fn test_redirect_invalid_id_token() {
    let params = RedirectParams {
      id_token: "test".to_string(),
      state: FAKE_STATE.to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let platform_store: StaticPlatformStore = StaticPlatformStore {
      iss: "https://lms.example.com",
    };
    let oidc_state_store = MockOIDCStateStore {};

    let resp = redirect(&params, &platform_store, &oidc_state_store).await;

    assert!(resp.is_err());
  }

  #[test]
  async fn test_redirect_invalid_oidc_state() {
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, platform_store, jwks_json) = generate_redirect(&url);
    let mock = server
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
    let oidc_state_store = MockOIDCStateStore {};
    let resp = redirect(&params, &platform_store, &oidc_state_store).await;

    mock.assert();
    assert!(resp.is_err());
  }
}
