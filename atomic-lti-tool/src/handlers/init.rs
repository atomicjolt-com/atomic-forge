use crate::errors::AtomicToolError;
use crate::html::build_html;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::{HttpRequest, HttpResponse};
use atomic_lti::constants::{OPEN_ID_COOKIE_PREFIX, OPEN_ID_STORAGE_COOKIE};
use atomic_lti::oidc::{build_relaunch_init_url, build_response_url};
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;
use atomic_lti::stores::platform_store::PlatformStore;
use cookie::time::{Duration, OffsetDateTime};
use serde::{Deserialize, Serialize};
use serde_json::Error;

#[derive(Debug, Deserialize, Serialize)]
pub struct InitParams {
  pub iss: String,
  pub login_hint: String,
  pub client_id: String,
  pub target_link_uri: String,
  pub lti_message_hint: String,
  pub lti_storage_target: Option<String>,
}

// InitSettings are sent to the client which expects camel case
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitSettings {
  pub state: String,
  pub response_url: String,
  pub lti_storage_params: LTIStorageParams,
  pub relaunch_init_url: String,
  pub open_id_cookie_prefix: String,
  pub privacy_policy_url: Option<String>,
  pub privacy_policy_message: Option<String>,
}

impl Default for InitSettings {
  fn default() -> Self {
    Self {
      state: "".to_string(),
      response_url: "".to_string(),
      lti_storage_params: LTIStorageParams::default(),
      relaunch_init_url: "".to_string(),
      open_id_cookie_prefix: OPEN_ID_COOKIE_PREFIX.to_string(),
      privacy_policy_url: None,
      privacy_policy_message: None,
    }
  }
}

pub fn build_cookie<'a>(
  name: &'a str,
  value: &'a str,
  domain: &'a str,
  expires: i64,
) -> Cookie<'a> {
  let cookie: Cookie<'a> = Cookie::build(name, value)
    .domain(domain)
    .path("/")
    .secure(true)
    .http_only(false)
    .max_age(Duration::seconds(expires))
    .expires(OffsetDateTime::now_utc() + Duration::seconds(expires))
    .same_site(SameSite::None)
    .finish();

  cookie
}

pub fn html(settings: InitSettings, hashed_script_name: &str) -> Result<String, Error> {
  let settings_json = serde_json::to_string(&settings)?;
  let head =
    format!(r#"<script type="text/javascript">window.INIT_SETTINGS = {settings_json};</script>"#);
  let body = format!(
    r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#,
    hashed_script_name = hashed_script_name
  );
  Ok(build_html(&head, &body))
}

#[cfg(test)]
mod tests {
  use super::*;
  use actix_web::{http, test};
  use atomic_lti::platforms::StaticPlatformStore;
  use atomic_lti_test::helpers::MockOIDCStateStore;

  #[test]
  async fn test_oidc_init_success() {
    let params = InitParams {
      iss: "https://canvas.instructure.com".to_string(),
      login_hint: "hint".to_string(),
      client_id: "1234".to_string(),
      target_link_uri: "https://example.com/launch".to_string(),
      lti_message_hint: "hint".to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let req = test::TestRequest::post()
      .uri("https://example.com/lti/init")
      .insert_header((http::header::HOST, "example.com"))
      .insert_header((http::header::COOKIE, format!("{OPEN_ID_STORAGE_COOKIE}=1")))
      .set_form(&params)
      .to_http_request();

    let platform_store: StaticPlatformStore = StaticPlatformStore {
      iss: "https://lms.example.com",
    };
    let oidc_state_store = MockOIDCStateStore {};
    let hashed_script_name = "fake.js";
    let resp = init(
      req,
      &params,
      &platform_store,
      &oidc_state_store,
      hashed_script_name,
    )
    .await
    .unwrap();

    assert_eq!(resp.status(), http::StatusCode::TEMPORARY_REDIRECT);
  }

  #[test]
  async fn test_oidc_init_no_cookie_success() {
    let params = InitParams {
      iss: "https://canvas.instructure.com".to_string(),
      login_hint: "hint".to_string(),
      client_id: "1234".to_string(),
      target_link_uri: "https://example.com/launch".to_string(),
      lti_message_hint: "hint".to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let req = test::TestRequest::post()
      .uri("https://example.com/lti/init")
      .insert_header((http::header::HOST, "example.com"))
      .set_form(&params)
      .to_http_request();

    let platform_store: StaticPlatformStore = StaticPlatformStore {
      iss: "https://lms.example.com",
    };
    let oidc_state_store = MockOIDCStateStore {};
    let hashed_script_name = "fake.js";
    let resp = init(
      req,
      &params,
      &platform_store,
      &oidc_state_store,
      hashed_script_name,
    )
    .await
    .unwrap();

    assert_eq!(resp.status(), http::StatusCode::OK);
  }

  #[test]
  async fn test_oidc_init_without_cookie_support() {
    let params = InitParams {
      iss: "https://canvas.instructure.com".to_string(),
      login_hint: "hint".to_string(),
      client_id: "1234".to_string(),
      target_link_uri: "https://example.com/launch".to_string(),
      lti_message_hint: "hint".to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let req = test::TestRequest::post()
      .uri("https://example.com/lti/init")
      .set_form(&params)
      .insert_header((http::header::HOST, "example.com"))
      .to_http_request();

    let platform_store: StaticPlatformStore = StaticPlatformStore {
      iss: "https://lms.example.com",
    };
    let oidc_state_store = MockOIDCStateStore {};
    let hashed_script_name = "fake.js";
    let resp = init(
      req,
      &params,
      &platform_store,
      &oidc_state_store,
      hashed_script_name,
    )
    .await
    .unwrap();

    assert_eq!(resp.status(), http::StatusCode::OK);
  }
}

pub async fn init(
  req: HttpRequest,
  params: &InitParams,
  platform_store: &dyn PlatformStore,
  oidc_state_store: &dyn OIDCStateStore,
  hashed_script_name: &str,
) -> Result<HttpResponse, AtomicToolError> {
  let platform_oidc_url = platform_store.get_oidc_url().await?;
  let host = req.connection_info().host().to_string();
  let redirect_url = format!("https://{0}/lti/redirect", host);

  let state = oidc_state_store.get_state().await;
  let nonce = oidc_state_store.get_nonce().await;

  let url = build_response_url(
    &platform_oidc_url,
    &state,
    &params.client_id,
    &params.login_hint,
    &params.lti_message_hint,
    &nonce,
    &redirect_url,
  )
  .map_err(|e| AtomicToolError::Internal(e.to_string()))?;

  let target = match &params.lti_storage_target {
    Some(target) => target,
    None => "iframe",
  };

  let lti_storage_params: LTIStorageParams = LTIStorageParams {
    target: target.to_string(),
    platform_oidc_url,
  };

  let relaunch_init_url = build_relaunch_init_url(&url);

  let settings: InitSettings = InitSettings {
    state: state.clone(),
    response_url: url.to_string(),
    lti_storage_params,
    relaunch_init_url,
    open_id_cookie_prefix: OPEN_ID_COOKIE_PREFIX.to_string(),
    privacy_policy_url: None,
    privacy_policy_message: None,
  };

  let cookie_marker = build_cookie(OPEN_ID_STORAGE_COOKIE, "1", &host, 356 * 24 * 60 * 60);
  let cookie_state_name = format!("{}{}", OPEN_ID_COOKIE_PREFIX, state);
  let cookie_state = build_cookie(&cookie_state_name, "1", &host, 60);

  let can_use_cookies = match req.cookie(OPEN_ID_STORAGE_COOKIE) {
    Some(value) => value.value() == "1",
    None => false,
  };

  if can_use_cookies {
    Ok(
      HttpResponse::TemporaryRedirect()
        .append_header(("Location", url.to_string()))
        .cookie(cookie_marker)
        .cookie(cookie_state)
        .finish(),
    )
  } else {
    // Send an HTML page that will attempt to write a cookie
    let html = html(settings, hashed_script_name)?;
    Ok(
      HttpResponse::Ok()
        .cookie(cookie_marker)
        .cookie(cookie_state)
        .content_type("text/html")
        .body(html),
    )
  }
}
