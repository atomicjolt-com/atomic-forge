use crate::{
  dynamic_registration::{
    platform_configuration::PlatformConfiguration, tool_configuration::ToolConfiguration,
  },
  errors::DynamicRegistrationError,
};
use async_trait::async_trait;

#[async_trait]
pub trait DynamicRegistrationStore: Send + Sync {
  // Must return a ToolConfiguration that contains the tool's configuration
  fn get_client_registration_request(
    &self,
    current_url: &str,
    product_family_code: &str,
  ) -> Result<ToolConfiguration, DynamicRegistrationError>;

  // Called once dynamic registration completes. Implementations must persist
  // the platform (from `platform_config`, so that later LTI launches can
  // resolve the platform by its issuer) and the registration (from
  // `platform_response`, which carries the client_id and deployment_id
  // minted by the platform).
  async fn handle_platform_response(
    &self,
    platform_config: &PlatformConfiguration,
    platform_response: ToolConfiguration,
  ) -> Result<(), DynamicRegistrationError>;

  // Must return HTML for a registration UI. `openid_configuration_url` is
  // the well-known URL the platform invoked the registration flow with;
  // implementations should preserve it so the finish handler can re-fetch
  // the PlatformConfiguration when persisting registration results.
  fn registration_html(
    &self,
    platform_config: &PlatformConfiguration,
    registration_finish_path: &str,
    registration_token: &str,
    openid_configuration_url: &str,
  ) -> String;

  // Must return HTML that completes the registration process
  // For a default implementation just call dynamic_registration_complete_html
  // from html/dynamic_registration.rs
  fn complete_html(&self) -> String;
}
