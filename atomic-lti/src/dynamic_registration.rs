use self::{platform_configuration::PlatformConfiguration, tool_configuration::ToolConfiguration};
use crate::{errors::DynamicRegistrationError, request::send_request, url::parse_host};
use reqwest::header;
use serde::Deserialize;

pub mod platform_configuration;
pub mod tool_configuration;

// Define a structure for the dynamic registration request params
// sent by the platform to the tool to initialize the dynamic registration process
#[derive(Deserialize, Clone, Debug)]
pub struct DynamicRegistrationParams {
  pub openid_configuration: String,
  pub registration_token: Option<String>,
}

// Define a structure for the dynamic registration request
#[derive(Deserialize, Clone, Debug)]
pub struct DynamicRegistrationFinishParams {
  pub registration_endpoint: String,
  pub registration_token: Option<String>,
  pub product_family_code: Option<String>,
}

pub fn validate_platform_config(
  platform_config: &PlatformConfiguration,
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

  Ok(true)
}

pub async fn request_platform_config(
  openid_configuration_url: &str,
) -> Result<PlatformConfiguration, DynamicRegistrationError> {
  let client = reqwest::Client::new();
  let request = client
    .get(openid_configuration_url)
    .header(header::ACCEPT, "application/json");
  let body = send_request(request).await?;
  let platform_config: PlatformConfiguration = serde_json::from_str(&body)
    .map_err(|e| DynamicRegistrationError::RequestFailed(e.to_string()))?;

  Ok(platform_config)
}

// Send a request to the platform to register the tool
pub async fn register_tool(
  registration_endpoint: &str,
  registration_token: &str,
  client_registration_request: &ToolConfiguration,
) -> Result<ToolConfiguration, DynamicRegistrationError> {
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
  let platform_response: ToolConfiguration = serde_json::from_str(&body)
    .map_err(|e| DynamicRegistrationError::RequestFailed(e.to_string()))?;

  Ok(platform_response)
}
