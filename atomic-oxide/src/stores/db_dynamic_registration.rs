use crate::db::Pool;
use atomic_lti::{
  dynamic_registration::{ClientRegistrationRequest, PlatformConfig, PlatformResponse},
  errors::DynamicRegistrationError,
  stores::dynamic_registration_store::{
    dynamic_registration_complete_html, dynamic_registration_init_html, DynamicRegistrationStore,
  },
};

pub struct DBDynamicRegistrationStore {
  pub pool: Pool,
}

impl DBDynamicRegistrationStore {
  pub fn new(pool: &Pool) -> Self {
    DBDynamicRegistrationStore { pool: pool.clone() }
  }
}

impl DynamicRegistrationStore for DBDynamicRegistrationStore {
  fn get_client_registration_request(&self) -> ClientRegistrationRequest {
    ClientRegistrationRequest::new(
      "https://atomic-oxide.atomicjolt.win/",
      "lti/init",
      "lti/redirect",
      "jwks",
      "lti/launch",
      "Atomic LTI Tool",
      "assets/logo.png",
      "https://www.atomicjolt.com/privacy",
      "https://www.atomicjolt.com/tos",
      "support@atomicjolt.com",
    )
  }

  fn handle_platform_response(
    &self,
    platform_response: PlatformResponse,
  ) -> Result<(), DynamicRegistrationError> {
    // TODO: Save the platform_response to the database
    dbg!(platform_response.client_id);
    Ok(())
  }

  fn registration_html(
    &self,
    platform_config: &PlatformConfig,
    registration_finish_path: &str,
  ) -> String {
    dynamic_registration_init_html(platform_config, registration_finish_path)
  }

  fn complete_html(&self) -> String {
    dynamic_registration_complete_html()
  }
}
