use crate::errors::AtomicToolError;
use crate::html::build_html;
use crate::url::full_url;
use actix_web::{HttpRequest, HttpResponse};
use atomic_lti::id_token::DeepLinkingClaim;
use atomic_lti::jwks;
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::platforms::get_jwk_set;
use atomic_lti::stores::jwt_store::JwtStore;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::validate::validate_launch;
use atomic_lti::{constants::OPEN_ID_COOKIE_PREFIX, stores::platform_store::PlatformStore};
use serde::{Deserialize, Serialize};
use serde_json::Error;
use url::Url;

#[derive(Debug, Deserialize, Serialize)]
pub struct LaunchParams {
  pub state: String,
  pub id_token: String,
  pub lti_storage_target: String,
}

// LaunchSettings are sent to the client which expects camel case
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchSettings {
  pub state_verified: bool,
  pub state: String,
  pub lti_storage_params: Option<LTIStorageParams>,
  pub jwt: String,
  pub deep_linking: Option<DeepLinkingClaim>,
}

fn launch_html(settings: &LaunchSettings, hashed_script_name: &str) -> Result<String, Error> {
  let settings_json = serde_json::to_string(&settings)?;
  let head = format!(
    r#"<script type="text/javascript">window.LAUNCH_SETTINGS = {0};</script>"#,
    settings_json
  );
  let body = format!(
    r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#,
    hashed_script_name = hashed_script_name
  );
  Ok(build_html(&head, &body))
}

pub async fn launch(
  req: HttpRequest,
  params: &LaunchParams,
  platform_store: &dyn PlatformStore,
  oidc_state_store: &dyn OIDCStateStore,
  hashed_script_name: &str,
  jwt_store: &dyn JwtStore,
) -> Result<HttpResponse, AtomicToolError> {
  let (id_token, state_verified, lti_storage_params) =
    setup_launch(platform_store, params, req, oidc_state_store).await?;

  let encoded_jwt = jwt_store.build_jwt(&id_token)?;
  let settings = LaunchSettings {
    state_verified,
    state: params.state.clone(),
    lti_storage_params: Some(lti_storage_params),
    jwt: encoded_jwt,
    deep_linking: id_token.deep_linking,
  };

  let html = launch_html(&settings, hashed_script_name)?;
  Ok(HttpResponse::Ok().content_type("text/html").body(html))
}

async fn setup_launch(
  platform_store: &dyn PlatformStore,
  params: &LaunchParams,
  req: HttpRequest,
  oidc_state_store: &dyn OIDCStateStore,
) -> Result<(atomic_lti::id_token::IdToken, bool, LTIStorageParams), AtomicToolError> {
  let jwk_server_url = platform_store.get_jwk_server_url()?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;
  let id_token = jwks::decode(&params.id_token, &jwk_set)?;
  let requested_target_link_uri = full_url(&req);
  validate_launch(&params.state, oidc_state_store, &id_token)?;
  oidc_state_store.destroy()?;
  let parsed_target_link_uri = Url::parse(&id_token.target_link_uri).map_err(|e| {
    AtomicToolError::Unauthorized(
      format!(
        "Invalid target link URI specified in ID Token: {}. {}",
        &id_token.target_link_uri, e
      )
      .to_string(),
    )
  })?;
  if parsed_target_link_uri.to_string() != requested_target_link_uri {
    return Err(AtomicToolError::Unauthorized(
      format!("Invalid target link uri: {}", requested_target_link_uri).to_string(),
    ));
  }
  let state_verified = match req.cookie(&format!("{}{}", OPEN_ID_COOKIE_PREFIX, &params.state)) {
    Some(value) => value.value() == "1",
    None => false,
  };
  if params.lti_storage_target.is_empty() && !state_verified {
    return Err(AtomicToolError::Unauthorized(
      "Unable to securely launch tool. Please ensure cookies are enabled".to_string(),
    ));
  }
  let platform_oidc_url = platform_store.get_oidc_url()?;
  let lti_storage_params: LTIStorageParams = LTIStorageParams {
    target: params.lti_storage_target.clone(),
    platform_oidc_url,
  };
  Ok((id_token, state_verified, lti_storage_params))
}

#[cfg(test)]
mod tests {
  use super::*;
  use actix_web::{http, test};
  use atomic_lti::constants::OPEN_ID_STORAGE_COOKIE;
  use atomic_lti::jwks::{encode, generate_jwk, Jwks};
  use atomic_lti_test::helpers::{
    create_mock_platform_store, generate_id_token, MockJwtStore, MockKeyStore, MockOIDCStateStore,
    MockPlatformStore, FAKE_STATE,
  };
  use openssl::rsa::Rsa;

  pub fn generate_launch(target_link_uri: &str, url: &str) -> (String, MockPlatformStore, String) {
    let id_token = generate_id_token(target_link_uri);

    // Encode the ID Token using the private key
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let kid = "test_kid";
    let jwk = generate_jwk(kid, &rsa_key_pair).expect("Failed to generate JWK");
    let jwks = Jwks { keys: vec![jwk] };
    let id_token_encoded = encode(&id_token, kid, rsa_key_pair).expect("Failed to encode token");
    let platform_store = create_mock_platform_store(url);
    let jwks_json = serde_json::to_string(&jwks).expect("Serialization failed");

    (id_token_encoded, platform_store, jwks_json)
  }

  #[tokio::test]
  async fn test_launch_success() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, platform_store, jwks_json) = generate_launch(target_link_uri, &url);
    let mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let launch_params = LaunchParams {
      id_token: id_token_encoded,
      state: FAKE_STATE.to_string(),
      lti_storage_target: "parent".to_string(),
    };
    let req = test::TestRequest::post()
      .uri(target_link_uri)
      .insert_header((http::header::HOST, "example.com"))
      .insert_header((
        http::header::COOKIE,
        format!("{}=1", OPEN_ID_STORAGE_COOKIE),
      ))
      .insert_header((
        http::header::COOKIE,
        format!("{}{}", OPEN_ID_COOKIE_PREFIX, launch_params.state),
      ))
      .set_form(&launch_params)
      .to_http_request();

    let oidc_state_store = MockOIDCStateStore {};
    let hashed_script_name = "script.js";
    let key_store = MockKeyStore::default();
    let jwt_store = MockJwtStore {
      key_store: &key_store,
    };
    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      hashed_script_name,
      &jwt_store,
    )
    .await
    .unwrap();

    mock.assert();
    assert_eq!(resp.status(), http::StatusCode::OK);
  }

  #[tokio::test]
  async fn test_launch_invalid_id_token() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (_, platform_store, jwks_json) = generate_launch(target_link_uri, &url);
    let mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let launch_params = LaunchParams {
      id_token: "invalid".to_string(),
      state: FAKE_STATE.to_string(),
      lti_storage_target: "parent".to_string(),
    };
    let oidc_state_store = MockOIDCStateStore {};
    let hashed_script_name = "script.js";

    let req = test::TestRequest::post()
      .uri(target_link_uri)
      .insert_header((http::header::HOST, "example.com"))
      .insert_header((
        http::header::COOKIE,
        format!("{}=1", OPEN_ID_STORAGE_COOKIE),
      ))
      .insert_header((
        http::header::COOKIE,
        format!("{}{}", OPEN_ID_COOKIE_PREFIX, launch_params.state),
      ))
      .set_form(&launch_params)
      .to_http_request();
    let key_store = MockKeyStore::default();
    let jwt_store = MockJwtStore {
      key_store: &key_store,
    };
    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      hashed_script_name,
      &jwt_store,
    )
    .await;

    mock.assert();
    assert!(resp.is_err());
  }

  #[tokio::test]
  async fn test_launch_invalid_target_link_uri() {
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, platform_store, jwks_json) =
      generate_launch("example.com/lti/bad", &url);
    let mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();
    let launch_params = LaunchParams {
      id_token: id_token_encoded.to_string(),
      state: FAKE_STATE.to_string(),
      lti_storage_target: "parent".to_string(),
    };
    let req = test::TestRequest::post()
      .uri("https://example.com/lti/launch")
      .insert_header((http::header::HOST, "example.com"))
      .insert_header((
        http::header::COOKIE,
        format!("{}=1", OPEN_ID_STORAGE_COOKIE),
      ))
      .insert_header((
        http::header::COOKIE,
        format!("{}{}", OPEN_ID_COOKIE_PREFIX, launch_params.state),
      ))
      .set_form(&launch_params)
      .to_http_request();

    let oidc_state_store = MockOIDCStateStore {};
    let hashed_script_name = "script.js";
    let key_store = MockKeyStore::default();
    let jwt_store = MockJwtStore {
      key_store: &key_store,
    };
    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      hashed_script_name,
      &jwt_store,
    )
    .await
    .unwrap_err();

    mock.assert();
    let resp_body = resp.to_string();
    assert!(
      resp_body.contains("Unauthorized request. Invalid target link URI"),
      "Expected 'Unauthorized request. Invalid target link uri', but got: {}",
      resp_body
    );
  }

  #[tokio::test]
  async fn test_launch_state_not_verified() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new_async().await;
    let url = server.url();
    let (id_token_encoded, platform_store, jwks_json) = generate_launch(target_link_uri, &url);
    let mock = server
      .mock("GET", "/jwks")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(jwks_json)
      .create();

    let launch_params = LaunchParams {
      id_token: id_token_encoded.to_string(),
      state: "badstate".to_string(),
      lti_storage_target: "parent".to_string(),
    };
    let req = test::TestRequest::post()
      .uri(target_link_uri)
      .insert_header((http::header::HOST, "example.com"))
      .insert_header((
        http::header::COOKIE,
        format!("{}=1", OPEN_ID_STORAGE_COOKIE),
      ))
      .set_form(&launch_params)
      .to_http_request();

    let oidc_state_store = MockOIDCStateStore {};
    let hashed_script_name = "script.js";
    let key_store = MockKeyStore::default();
    let jwt_store = MockJwtStore {
      key_store: &key_store,
    };
    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      hashed_script_name,
      &jwt_store,
    )
    .await
    .unwrap_err();

    mock.assert();
    assert_eq!(resp.to_string(), "Invalid state: Invalid state value");
  }
}
