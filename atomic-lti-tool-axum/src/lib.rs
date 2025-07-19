use atomic_lti::id_token::DeepLinkingClaim;
use atomic_lti::id_token::IdToken;
use atomic_lti::platform_storage::LTIStorageParams;
use atomic_lti::stores::{
  jwt_store::JwtStore, oidc_state_store::OIDCStateStore, platform_store::PlatformStore,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

pub mod errors;
pub mod handlers;
pub mod html;
pub mod middleware;
pub mod url;
pub mod validation;

pub use errors::*;

// Framework-agnostic parameter structs
#[derive(Debug, Deserialize, Serialize)]
pub struct InitParams {
  pub iss: String,
  pub login_hint: String,
  pub client_id: String,
  pub target_link_uri: String,
  pub lti_message_hint: String,
  pub lti_storage_target: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RedirectParams {
  pub state: String,
  pub id_token: String,
  pub lti_storage_target: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LaunchParams {
  pub state: String,
  pub id_token: String,
  pub lti_storage_target: String,
}

// Framework-agnostic settings structs
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchSettings {
  pub state_verified: bool,
  pub state: String,
  pub lti_storage_params: Option<LTIStorageParams>,
  pub jwt: String,
  pub deep_linking: Option<DeepLinkingClaim>,
}

// Framework-agnostic handler functions
pub async fn handle_init(
  params: InitParams,
  host: &str,
  platform_store: &dyn PlatformStore,
  oidc_state_store: &dyn OIDCStateStore,
  hashed_script_name: &str,
) -> Result<String, ToolError> {
  let redirect_url = format!("https://{}/lti/redirect", host);

  let platform_oidc_url = platform_store
    .get_oidc_url()
    .map_err(|_| ToolError::Internal("Failed to get OIDC URL".to_string()))?;

  let state_value = oidc_state_store.get_state();
  let nonce = oidc_state_store.get_nonce();

  // Build the authorization URL
  let auth_url = format!(
        "{}?client_id={}&login_hint={}&lti_message_hint={}&nonce={}&redirect_uri={}&response_mode=form_post&response_type=id_token&scope=openid&state={}",
        platform_oidc_url,
        urlencoding::encode(&params.client_id),
        urlencoding::encode(&params.login_hint),
        urlencoding::encode(&params.lti_message_hint),
        urlencoding::encode(&nonce),
        urlencoding::encode(&redirect_url),
        urlencoding::encode(&state_value)
    );

  // Build init settings for the frontend
  let init_settings = InitSettings {
    state: state_value,
    response_url: auth_url,
    lti_storage_params: LTIStorageParams {
      target: params.lti_storage_target.clone().unwrap_or_default(),
      platform_oidc_url,
    },
    relaunch_init_url: format!("https://{}/lti/init", host),
    open_id_cookie_prefix: "lti1p3_".to_string(),
    privacy_policy_url: None,
    privacy_policy_message: None,
  };

  // Build HTML response
  let html = format!(
    r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LTI Launch</title>
    <script type="text/javascript">window.INIT_SETTINGS = {};</script>
</head>
<body>
    <div id="main-content"></div>
    <script src="/assets/js/{}"></script>
</body>
</html>"#,
    serde_json::to_string(&init_settings).map_err(|e| ToolError::Internal(e.to_string()))?,
    hashed_script_name
  );

  Ok(html)
}

pub async fn handle_redirect(
  params: RedirectParams,
  _platform_store: &dyn PlatformStore,
  oidc_state_store: &dyn OIDCStateStore,
) -> Result<String, ToolError> {
  // Extract ISS from the ID token
  let _iss = IdToken::extract_iss(&params.id_token)
    .map_err(|_| ToolError::BadRequest("Invalid ID token".to_string()))?;

  // Verify state
  if oidc_state_store.get_state() != params.state {
    return Err(ToolError::BadRequest("Invalid state".to_string()));
  }

  // Build form for auto-submit to launch
  let html = format!(
    r#"<!DOCTYPE html>
<html>
<head>
    <title>Redirecting...</title>
</head>
<body onload="document.forms[0].submit()">
    <form action="/lti/launch" method="POST">
        <input type="hidden" name="state" value="{}">
        <input type="hidden" name="id_token" value="{}">
        <input type="hidden" name="lti_storage_target" value="{}">
    </form>
    <p>Redirecting...</p>
</body>
</html>"#,
    htmlescape::encode_minimal(&params.state),
    htmlescape::encode_minimal(&params.id_token),
    htmlescape::encode_minimal(&params.lti_storage_target.clone().unwrap_or_default())
  );

  Ok(html)
}

pub async fn handle_launch(
  params: LaunchParams,
  platform_store: &dyn PlatformStore,
  _oidc_state_store: &dyn OIDCStateStore,
  _jwt_store: &dyn JwtStore,
  hashed_script_name: &str,
) -> Result<String, ToolError> {
  // Extract ISS from ID token
  let _iss = IdToken::extract_iss(&params.id_token)
    .map_err(|_| ToolError::BadRequest("Invalid ID token".to_string()))?;

  // In a real implementation, we would:
  // 1. Validate the ID token signature
  // 2. Validate claims
  // 3. Create JWT for the frontend

  // For now, build launch settings
  let launch_settings = LaunchSettings {
    state_verified: true,
    state: params.state,
    lti_storage_params: Some(LTIStorageParams {
      target: params.lti_storage_target,
      platform_oidc_url: platform_store.get_oidc_url().unwrap_or_default(),
    }),
    jwt: "placeholder_jwt".to_string(), // This would be the actual JWT
    deep_linking: None,                 // Would be extracted from ID token if present
  };

  // Build HTML response
  let html = format!(
    r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LTI Tool</title>
    <script type="text/javascript">window.LAUNCH_SETTINGS = {};</script>
</head>
<body>
    <div id="main-content"></div>
    <script src="/assets/js/{}"></script>
</body>
</html>"#,
    serde_json::to_string(&launch_settings).map_err(|e| ToolError::Internal(e.to_string()))?,
    hashed_script_name
  );

  Ok(html)
}

pub async fn handle_jwks() -> Result<serde_json::Value, ToolError> {
  // In real implementation, this would:
  // 1. Get public keys from the key store
  // 2. Convert them to JWK format
  // 3. Return the JWKS

  Ok(json!({
      "keys": []
  }))
}
