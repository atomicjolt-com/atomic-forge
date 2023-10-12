use crate::errors::AtomicToolError;
use actix_web::HttpResponse;
use atomic_lti::jwks::decode;
use atomic_lti::params::RedirectParams;
use atomic_lti::platforms::{get_jwk_set, PlatformStore};
use atomic_lti::validate::validate_launch;
use atomic_lti::validate::OIDCStateStore;

fn redirect_html(
  id_token: &str,
  oidc_state: &str,
  lti_storage_target: &str,
  target_link_uri: &str,
) -> String {
  let html = format!(
    r#"
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="/styles.css" />
      </head>
      <body>
        <noscript>
          <div class="u-flex aj-centered-message">
            <i class="material-icons-outlined aj-icon" aria-hidden="true">warning</i>
            <p class="aj-text">
              You must have javascript enabled to use this application.
            </p>
          </div>
        </noscript>
        <form action="${target_link_uri}" method="POST">
          <input type="hidden" name="id_token" value="${id_token}" />
          <input type="hidden" name="state" value="${oidc_state}" />
          <input type="hidden" name="lti_storage_target" value="${lti_storage_target}" />
        </form>
        <script>
          window.addEventListener("load", () => {{
            document.forms[0].submit();
          }});
        </script>
      </body>
    </html>
    "#,
    target_link_uri = target_link_uri,
    id_token = id_token,
    oidc_state = oidc_state,
    lti_storage_target = lti_storage_target
  );
  html
}

pub async fn redirect(
  params: &RedirectParams,
  platform_store: &dyn PlatformStore,
  oidc_state_store: &dyn OIDCStateStore,
) -> Result<HttpResponse, AtomicToolError> {
  let jwk_server_url = platform_store.get_jwk_server_url()?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;
  let id_token = decode(&params.id_token, &jwk_set)?;
  validate_launch(oidc_state_store, &id_token)?;

  // TODO there should be javascript in the redirect html
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
  use atomic_lti::errors::{OIDCError, PlatformError};
  use atomic_lti::id_token::{IdToken, ResourceLinkClaim};
  use atomic_lti::jwks::{encode, generate_jwk, Jwks};
  use atomic_lti::platforms::Platform;
  use atomic_lti::platforms::StaticPlatformStore;
  use atomic_lti::validate::OIDCStateStore;
  use chrono::{Duration, Utc};
  use mockito;
  use openssl::rsa::Rsa;

  const ISS: &str = "https://lms.example.com";
  const FAKE_STATE: &str = "state";
  const FAKE_NONCE: &str = "nonce";

  struct MockOIDCStateStore {}
  impl OIDCStateStore for MockOIDCStateStore {
    fn get_state(&self) -> String {
      FAKE_STATE.to_string()
    }

    fn get_nonce(&self) -> String {
      FAKE_NONCE.to_string()
    }

    fn get_created_at(&self) -> chrono::NaiveDateTime {
      (Utc::now() + Duration::minutes(15)).naive_utc()
    }

    fn destroy(&self) -> Result<usize, OIDCError> {
      Ok(1)
    }
  }

  pub struct MockPlatformStore<'a> {
    pub platform: Platform<'a>,
  }

  impl PlatformStore for MockPlatformStore<'_> {
    fn get_platform(&self) -> Result<&Platform, PlatformError> {
      Ok(&self.platform)
    }

    fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
      let platform = self.get_platform()?;
      Ok(platform.jwks_url.to_string())
    }

    fn get_platform_oidc_url(&self) -> Result<String, PlatformError> {
      let platform = self.get_platform()?;
      Ok(platform.oidc_url.to_string())
    }
  }

  #[test]
  async fn test_redirect_success() {
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let jwk = generate_jwk(&rsa_key_pair).expect("Failed to generate JWK from RSA Key");
    let jwks = Jwks { keys: vec![jwk] };
    let jwks_json = serde_json::to_string(&jwks).expect("Serialization failed");

    let mut server = mockito::Server::new();
    let url = server.url();
    let jwks_url = format!("{}{}", url, "/jwks");
    let token_url = format!("{}{}", url, "/token");
    let oidc_url = format!("{}{}", url, "/oidc");

    let platform: Platform = Platform {
      iss: ISS,
      jwks_url: &jwks_url,
      token_url: &token_url,
      oidc_url: &oidc_url,
    };
    let platform_store: MockPlatformStore = MockPlatformStore { platform };
    let oidc_state_store = MockOIDCStateStore {};

    let _m = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let id_token = IdToken {
      target_link_uri: "example.com".to_string(),
      resource_link: ResourceLinkClaim {
        id: "123".to_string(),
        description: None,
        title: None,
        validation_context: None,
        errors: None,
      },
      auds: vec!["example.com".to_string()],
      azp: "".to_string(),
      aud: vec!["example.com".to_string()],
      lti_version: "1.3".to_string(),
      nonce: FAKE_NONCE.to_string(),
      ..Default::default()
    };

    let jwk = generate_jwk(&rsa_key_pair).expect("Failed to generate JWK");

    // Encode the ID Token using the private key
    let id_token_encoded =
      encode(&id_token, jwk.kid.clone(), rsa_key_pair).expect("Failed to encode token");

    let params = RedirectParams {
      id_token: id_token_encoded,
      state: FAKE_STATE.to_string(),
      lti_storage_target: "parent".to_string(),
    };

    let resp = redirect(&params, &platform_store, &oidc_state_store)
      .await
      .unwrap();

    assert_eq!(resp.status(), http::StatusCode::OK);
  }

  #[test]
  async fn test_redirect_invalid_id_token() {
    let params = RedirectParams {
      id_token: "test".to_string(),
      state: "state".to_string(),
      lti_storage_target: "parent".to_string(),
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
    let params = RedirectParams {
      id_token: "test".to_string(),
      state: "state".to_string(),
      lti_storage_target: "parent".to_string(),
    };

    let platform_store: StaticPlatformStore = StaticPlatformStore {
      iss: "https://lms.example.com",
    };
    let oidc_state_store = MockOIDCStateStore {};

    let resp = redirect(&params, &platform_store, &oidc_state_store).await;

    assert!(resp.is_err());
  }
}
