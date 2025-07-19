use crate::{
  dynamic_registration::{
    platform_configuration::PlatformConfiguration, tool_configuration::ToolConfiguration,
  },
  errors::DynamicRegistrationError,
};

pub trait DynamicRegistrationStore: Send + Sync {
  // Must return a ToolConfiguration that contains the tool's configuration
  fn get_client_registration_request(
    &self,
    current_url: &str,
    product_family_code: &str,
  ) -> Result<ToolConfiguration, DynamicRegistrationError>;

  // The function will be called once the registration process is complete
  // The store should persist the information in the PlatformResponse
  fn handle_platform_response(
    &self,
    platform_response: ToolConfiguration,
  ) -> Result<(), DynamicRegistrationError>;

  // Must return HTML for a registration UI
  // For a default implementation just call dynamic_registration_init_html
  // from html/dynamic_registration.rs
  fn registration_html(
    &self,
    platform_config: &PlatformConfiguration,
    registration_finish_path: &str,
    registration_token: &str,
  ) -> String;

  // Must return HTML that completes the registration process
  // For a default implementation just call dynamic_registration_complete_html
  // from html/dynamic_registration.rs
  fn complete_html(&self) -> String;
}
