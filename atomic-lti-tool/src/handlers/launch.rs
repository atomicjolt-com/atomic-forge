use crate::errors::AtomicToolError;
use crate::html::build_html;
use crate::url::full_url;
use actix_web::{HttpRequest, HttpResponse};
use atomic_lti::client_credentials::request_service_token_cached;
use atomic_lti::constants::OPEN_ID_COOKIE_PREFIX;
use atomic_lti::jwks::decode;
use atomic_lti::jwks::KeyStore;
use atomic_lti::names_and_roles::{self, NAMES_AND_ROLES_SCOPE};
use atomic_lti::params::{LaunchParams, LaunchSettings};
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::platforms::{get_jwk_set, PlatformStore};
use atomic_lti::validate::{validate_launch, OIDCStateStore};
use serde_json::Error;
use url::Url;

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
  key_store: &dyn KeyStore,
  hashed_script_name: &str,
) -> Result<HttpResponse, AtomicToolError> {
  let jwk_server_url = platform_store.get_jwk_server_url()?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;
  let id_token = decode(&params.id_token, &jwk_set)?;
  let requested_target_link_uri = full_url(&req);

  validate_launch(&params.state, oidc_state_store, &id_token)?;

  // Remove the state
  oidc_state_store.destroy()?;

  // Validate the target link URI
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

  if let Some(names_and_roles_url) = &id_token.names_and_roles_endpoint() {
    let (kid, key) = key_store
      .get_current_key()
      .map_err(|e| AtomicToolError::Internal(e.to_string()))?;
    let platform_token_url = platform_store.get_token_url()?;

    let client_authorization_response = request_service_token_cached(
      &id_token.client_id(),
      &platform_token_url,
      NAMES_AND_ROLES_SCOPE,
      &kid,
      key.clone(),
    )
    .await
    .map_err(|e| {
      AtomicToolError::InsufficientPermissions(
        format!("Failed to get token from platform: {}", e).to_string(),
      )
    })?;

    let (membership, rel_next, rel_differences) = names_and_roles::list(
      &client_authorization_response.access_token,
      names_and_roles_url,
      None,
      None,
      None,
    )
    .await
    .map_err(|e| AtomicToolError::Internal(format!("{}", e).to_string()))?;

    dbg!("******************************************");
    dbg!(client_authorization_response);
    dbg!(membership);
    dbg!(rel_next);
    dbg!(rel_differences);
  }

  let settings = LaunchSettings {
    state_verified,
    id_token,
    state: params.state.clone(),
    lti_storage_params: Some(lti_storage_params),
  };

  let html = launch_html(&settings, hashed_script_name)?;
  Ok(HttpResponse::Ok().content_type("text/html").body(html))
}

#[cfg(test)]
mod tests {
  use super::*;
  use actix_web::{http, test};
  use atomic_lti::constants::OPEN_ID_STORAGE_COOKIE;
  use atomic_lti::jwks::{encode, generate_jwk, Jwks};
  use atomic_lti::params::LaunchParams;
  use atomic_lti_test::helpers::{
    create_mock_platform_store, generate_id_token, MockKeyStore, MockOIDCStateStore,
    MockPlatformStore, FAKE_STATE,
  };
  use openssl::rsa::Rsa;

  pub fn generate_launch(target_link_uri: &str, url: &str) -> (String, MockPlatformStore, String) {
    let id_token = generate_id_token(target_link_uri);

    // Encode the ID Token using the private key
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let kid = "test_kid";
    let jwk = generate_jwk(kid, &rsa_key_pair).expect("Failed to generate JWK");
    let kid = jwk.kid.clone();
    let jwks = Jwks { keys: vec![jwk] };
    let id_token_encoded = encode(&id_token, kid, rsa_key_pair).expect("Failed to encode token");
    let (platform_store, jwks_json) = create_mock_platform_store(&jwks, url);

    (id_token_encoded, platform_store, jwks_json)
  }

  #[test]
  async fn test_launch_success() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new();
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
    let key_store = MockKeyStore {};
    let hashed_script_name = "script.js";

    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      &key_store,
      hashed_script_name,
    )
    .await
    .unwrap();

    mock.assert();
    assert_eq!(resp.status(), http::StatusCode::OK);
  }

  #[test]
  async fn test_launch_invalid_id_token() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new();
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
    let key_store = MockKeyStore {};
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

    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      &key_store,
      hashed_script_name,
    )
    .await;

    mock.assert();
    assert!(resp.is_err());
  }

  #[test]
  async fn test_launch_invalid_target_link_uri() {
    let mut server = mockito::Server::new();
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
    let key_store = MockKeyStore {};
    let hashed_script_name = "script.js";

    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      &key_store,
      hashed_script_name,
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

  #[test]
  async fn test_launch_state_not_verified() {
    let target_link_uri = "https://example.com/lti/launch";
    let mut server = mockito::Server::new();
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
    let key_store = MockKeyStore {};
    let hashed_script_name = "script.js";

    let resp = launch(
      req,
      &launch_params,
      &platform_store,
      &oidc_state_store,
      &key_store,
      hashed_script_name,
    )
    .await
    .unwrap_err();

    mock.assert();
    assert_eq!(resp.to_string(), "Invalid state: Invalid state value");
  }
}
