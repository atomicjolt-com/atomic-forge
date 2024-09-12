use crate::db::Pool;
use crate::defines;
use atomic_lti::{
  dynamic_registration::{
    lti_message::LtiMessage,
    platform_configuration::PlatformConfiguration,
    tool_configuration::{ToolConfiguration, NAMES_AND_ROLES_SCOPE},
  },
  errors::DynamicRegistrationError,
  stores::dynamic_registration_store::DynamicRegistrationStore,
};
use atomic_lti_tool::html::{dynamic_registration_complete_html, dynamic_registration_init_html};

pub struct DBDynamicRegistrationStore {
  pub pool: Pool,
}

impl DBDynamicRegistrationStore {
  pub fn new(pool: &Pool) -> Self {
    DBDynamicRegistrationStore { pool: pool.clone() }
  }
}

impl DynamicRegistrationStore for DBDynamicRegistrationStore {
  fn get_client_registration_request(
    &self,
    current_url: &str,
    product_family_code: &str,
  ) -> Result<ToolConfiguration, DynamicRegistrationError> {
    let deep_link_message = LtiMessage::builder()
      .base_url(current_url)
      .launch_path("lti/launch")
      .label(defines::TOOL_NAME)
      .icon_path("assets/images/icon.png")
      .add_deep_link_placements(product_family_code)
      .build()?;

    ToolConfiguration::builder()
      .product_family_code(product_family_code)
      .base_url(current_url)
      .init_path("lti/init")
      .redirect_path("lti/redirect")
      .jwks_path("jwks")
      .launch_path("lti/launch")
      .client_name(defines::TOOL_NAME)
      .logo_path("assets/images/logo.png")
      .policy_uri("https://www.atomicjolt.com/privacy")
      .tos_uri("https://www.atomicjolt.com/tos")
      .email("support@atomicjolt.com")
      .icon_path("assets/images/icon.png")
      .add_message(deep_link_message)
      .add_scope(NAMES_AND_ROLES_SCOPE)
      .build()
  }

  fn handle_platform_response(
    &self,
    platform_response: ToolConfiguration,
  ) -> Result<(), DynamicRegistrationError> {
    // TODO: Save the platform_response to the database
    dbg!("****************************************");
    dbg!(platform_response.client_id);
    dbg!(platform_response.lti_tool_configuration.deployment_id);
    Ok(())
  }

  fn registration_html(
    &self,
    platform_config: &PlatformConfiguration,
    registration_finish_path: &str,
    registration_token: &str,
  ) -> String {
    dynamic_registration_init_html(
      platform_config,
      registration_finish_path,
      registration_token,
    )
  }

  fn complete_html(&self) -> String {
    dynamic_registration_complete_html()
  }
}
