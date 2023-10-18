use crate::errors::AtomicToolError;
use crate::html::build_html;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::{HttpRequest, HttpResponse};
use atomic_lti::constants::{OPEN_ID_COOKIE_PREFIX, OPEN_ID_STORAGE_COOKIE};
use atomic_lti::oidc::{build_relaunch_init_url, build_response_url};
use atomic_lti::params::{InitParams, InitSettings};
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::platforms::PlatformStore;
use atomic_lti::validate::OIDCStateStore;
use cookie::time::{Duration, OffsetDateTime};
use serde_json::Error;

fn build_cookie<'a>(name: &'a str, value: &'a str, domain: &'a str, expires: i64) -> Cookie<'a> {
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

fn html(settings: InitSettings, hashed_script_name: &str) -> Result<String, Error> {
  let settings_json = serde_json::to_string(&settings)?;
  let head = format!(
    r#"<script type="text/javascript">window.INIT_SETTINGS = {0};</script>"#,
    settings_json
  );
  let body = format!(
    r#"<div id="main-content"></div><script src="{hashed_script_name}"></script>"#,
    hashed_script_name = hashed_script_name
  );
  Ok(build_html(&head, &body))
}

pub async fn init(
  req: HttpRequest,
  params: &InitParams,
  platform_store: &dyn PlatformStore,
  oidc_state_store: &dyn OIDCStateStore,
  hashed_script_name: &str,
) -> Result<HttpResponse, AtomicToolError> {
  let platform_oidc_url = platform_store.get_platform_oidc_url()?;
  let host = req.connection_info().host().to_string();
  let redirect_url = format!("https://{0}/lti/redirect", host);
  dbg!(&redirect_url);
  let url = build_response_url(
    &platform_oidc_url,
    &oidc_state_store.get_state(),
    &params.client_id,
    &params.login_hint,
    &params.lti_message_hint,
    &oidc_state_store.get_nonce(),
    &redirect_url,
  );

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
    state: oidc_state_store.get_state(),
    response_url: url.to_string(),
    lti_storage_params,
    relaunch_init_url,
    open_id_cookie_prefix: OPEN_ID_COOKIE_PREFIX.to_string(),
    privacy_policy_url: None,
    privacy_policy_message: None,
  };

  let cookie_marker = build_cookie(OPEN_ID_STORAGE_COOKIE, "1", &host, 356 * 24 * 60 * 60);
  let cookie_state_name = format!("{}{}", OPEN_ID_COOKIE_PREFIX, oidc_state_store.get_state());
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
      .insert_header((http::header::COOKIE, "OPEN_ID_STORAGE_COOKIE=1"))
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
  async fn test_oidc_init_invalid_request_url() {
    let params = InitParams {
      iss: "https://canvas.instructure.com".to_string(),
      login_hint: "hint".to_string(),
      client_id: "1234".to_string(),
      target_link_uri: "https://example.com/launch".to_string(),
      lti_message_hint: "hint".to_string(),
      lti_storage_target: Some("parent".to_string()),
    };

    let req = test::TestRequest::post()
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
    .await;

    assert!(resp.is_err());
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
