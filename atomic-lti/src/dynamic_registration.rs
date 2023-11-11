use crate::{errors::DynamicRegistrationError, request::send_request, url::parse_host};
use reqwest::header;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Define the structure for the platform configuration
// This is provided by the platform in the openid-configuration response
#[derive(Deserialize)]
pub struct PlatformConfig {
  pub issuer: String,
  pub registration_endpoint: String,
  pub registration_token: Option<String>,
}

// Define the structure for the platform response
#[derive(Deserialize)]
pub struct PlatformResponse {
  pub client_id: String,
  pub registration_client_uri: String,
}

// Define a structure for the dynamic registration request
#[derive(Deserialize)]
pub struct DyanimcRegistrationParams {
  pub openid_configuration: String,
}

// Define a structure for the dynamic registration request
#[derive(Deserialize)]
pub struct DyanimcRegistrationFinishParams {
  pub registration_endpoint: String,
  pub registration_token: Option<String>,
}

// This structure defines the configuration for the client.
#[derive(Serialize, Deserialize)]
pub struct ClientRegistrationRequest {
  pub application_type: String,
  pub response_types: Vec<String>,
  pub grant_types: Vec<String>,
  pub initiate_login_uri: String,
  pub redirect_uris: Vec<String>,
  pub client_name: String,
  pub jwks_uri: String,
  pub logo_uri: String,
  pub client_uri: String,
  pub policy_uri: String,
  pub tos_uri: String,
  pub token_endpoint_auth_method: String,
  pub contacts: Vec<String>,
  pub scope: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-tool-configuration")]
  pub lti_tool_configuration: LtiToolConfiguration,
}

#[derive(Serialize, Deserialize)]
pub struct LtiToolConfiguration {
  pub domain: String,
  pub description: String,
  pub target_link_uri: String,
  pub custom_parameters: HashMap<String, String>,
  pub claims: Vec<String>,
  pub messages: Vec<LtiMessage>,
}

#[derive(Serialize, Deserialize)]
pub struct LtiMessage {
  #[serde(rename = "type")]
  pub type_: String,
  pub target_link_uri: String,
  pub label: String,
}

impl ClientRegistrationRequest {
  // Create a new ClientRegistrationRequest
  // For example:
  // let client_registration_request = ClientRegistrationRequest::new(
  //   "https://app.atomicjoltapps.com/",
  //   "lti/init",
  //   "lti/redirect",
  //   "jwks",
  //   "lti/launch",
  //   "Atomic LTI Tool",
  //   "assets/logo.png",
  //   "https://www.atomicjolt.com/privacy",
  //   "https://www.atomicjolt.com/tos",
  //   "support@atomicjolt.com",
  // );
  pub fn new(
    base_url: &str,
    init_path: &str,
    redirect_path: &str,
    jwks_path: &str,
    launch_path: &str,
    client_name: &str,
    logo_path: &str,
    policy_uri: &str,
    tos_uri: &str,
    email: &str,
  ) -> Self {
    let launch_uri = format!("{}/{}", base_url, launch_path);
    ClientRegistrationRequest {
      application_type: "web".to_string(),
      response_types: vec!["id_token".to_string()],
      grant_types: vec!["implicit".to_string(), "client_credentials".to_string()],
      initiate_login_uri: format!("{}/{}", base_url, init_path),
      redirect_uris: vec![format!("{}/{}", base_url, redirect_path)],
      client_name: client_name.to_string(),
      jwks_uri: format!("{}/{}", base_url, jwks_path),
      logo_uri: format!("{}/{}", base_url, logo_path),
      client_uri: format!("https://{}", base_url),
      policy_uri: policy_uri.to_string(),
      tos_uri: tos_uri.to_string(),
      token_endpoint_auth_method: "private_key_jwt".to_string(),
      contacts: vec![email.to_string()],
      scope: [
        "line_item",
        "line_item_readonly",
        "result",
        "score",
        "names_and_roles",
      ]
      .join(" "),
      lti_tool_configuration: LtiToolConfiguration {
        domain: base_url.to_string(),
        description: client_name.to_string(),
        target_link_uri: launch_uri.to_string(),
        custom_parameters: {
          let mut map = HashMap::new();
          map.insert(
            "context_id_history".to_string(),
            "$Context.id.history".to_string(),
          );
          map.insert(
            "resource_link_id_history".to_string(),
            "$ResourceLink.id.history".to_string(),
          );
          map
        },
        claims: vec![
          "iss".to_string(),
          "sub".to_string(),
          "name".to_string(),
          "given_name".to_string(),
          "family_name".to_string(),
          "https://purl.imsglobal.org/spec/lti/claim/context".to_string(),
          "https://purl.imsglobal.org/spec/lti/claim/tool_platform".to_string(),
        ],
        messages: vec![LtiMessage {
          type_: "LtiDeepLinkingRequest".to_string(),
          target_link_uri: launch_uri.to_string(),
          label: client_name.to_string(),
        }],
      },
    }
  }
}

pub fn validate_platform_config(
  platform_config: &PlatformConfig,
  openid_configuration_url: &str,
) -> Result<bool, DynamicRegistrationError> {
  // The issuer domain must match the openid-configuration URL domain
  let original_host = parse_host(openid_configuration_url)?;
  let provided_host = parse_host(&platform_config.issuer)?;

  if original_host != provided_host {
    return Err(DynamicRegistrationError::InvalidConfig(
      "The issuer domain must match the openid-configuration URL domain".to_string(),
    ));
  }

  if !platform_config
    .registration_endpoint
    .starts_with(&platform_config.issuer)
  {
    return Err(DynamicRegistrationError::InvalidConfig(
      "Registration endpoint must match the issuer endpoint".to_string(),
    ));
  }

  Ok(true)
}

pub async fn request_platform_config(
  openid_configuration_url: &str,
) -> Result<PlatformConfig, DynamicRegistrationError> {
  let client = reqwest::Client::new();
  let request = client
    .get(openid_configuration_url)
    .header(header::ACCEPT, "application/json");
  let body = send_request(request).await?;
  let platform_config: PlatformConfig = serde_json::from_str(&body)
    .map_err(|e| DynamicRegistrationError::RequestFailed(e.to_string()))?;

  Ok(platform_config)
}

// Send a request to the platform to register the tool
pub async fn register_tool(
  registration_endpoint: &str,
  registration_token: &str,
  client_registration_request: &ClientRegistrationRequest,
) -> Result<PlatformResponse, DynamicRegistrationError> {
  let json = serde_json::to_string(&client_registration_request)
    .map_err(|e| DynamicRegistrationError::RequestFailed(e.to_string()))?;
  let client: reqwest::Client = reqwest::Client::new();
  let mut request = client
    .post(registration_endpoint)
    .header(header::CONTENT_TYPE, "application/json")
    .header(header::ACCEPT, "application/json")
    .body(json);

  if !registration_token.is_empty() {
    request = request.header(
      header::AUTHORIZATION,
      format!("Bearer {}", registration_token),
    );
  }

  let body = send_request(request).await?;
  let platform_response: PlatformResponse = serde_json::from_str(&body)
    .map_err(|e| DynamicRegistrationError::RequestFailed(e.to_string()))?;

  Ok(platform_response)
}
