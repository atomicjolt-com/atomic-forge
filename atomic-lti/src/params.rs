use crate::platform_storage::LTIStorageParams;
use crate::{constants::OPEN_ID_COOKIE_PREFIX, id_token::IdToken};
use serde::{Deserialize, Serialize};

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
  pub id_token: IdToken,
  pub state: String,
  pub lti_storage_params: Option<LTIStorageParams>,
}

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

#[derive(Debug, Deserialize, Serialize)]
pub struct RedirectParams {
  pub lti_storage_target: String,
  pub id_token: String,
  pub state: String,
}
