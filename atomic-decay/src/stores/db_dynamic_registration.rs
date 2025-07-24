use crate::db::Pool;
use crate::defines;
use crate::models::lti_platform::LtiPlatform;
use crate::models::lti_registration::LtiRegistration;
use atomic_lti::{
  dynamic_registration::{
    lti_message::LtiMessage,
    platform_configuration::PlatformConfiguration,
    tool_configuration::{ToolConfiguration, NAMES_AND_ROLES_SCOPE},
  },
  errors::DynamicRegistrationError,
  stores::dynamic_registration_store::DynamicRegistrationStore,
};
use serde_json;
// HTML functions implemented locally as they're not exposed in atomic_lti_tool_axum
fn dynamic_registration_init_html(
  platform_config: &PlatformConfiguration,
  registration_finish_path: &str,
  registration_token: &str,
) -> String {
  format!(
    r#"<!DOCTYPE html>
<html>
<head>
    <title>Dynamic Registration</title>
</head>
<body>
    <h1>Dynamic Registration</h1>
    <p>Platform Configuration URL: {}</p>
    <form action="{}" method="POST">
        <input type="hidden" name="platform_config" value='{}'>
        <input type="hidden" name="registration_token" value="{}">
        <button type="submit">Complete Registration</button>
    </form>
</body>
</html>"#,
    platform_config.issuer,
    registration_finish_path,
    serde_json::to_string(platform_config).unwrap_or_default(),
    registration_token
  )
}

fn dynamic_registration_complete_html() -> String {
  r#"<!DOCTYPE html>
<html>
<head>
    <title>Registration Complete</title>
</head>
<body>
    <h1>Registration Complete</h1>
    <p>The dynamic registration process has been completed successfully.</p>
    <script>
        // Close the window after 3 seconds
        setTimeout(function() {
            window.close();
        }, 3000);
    </script>
</body>
</html>"#
    .to_string()
}

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
      .set_deep_linking_message_type()
      .add_deep_link_placements(product_family_code)
      .build()?;

    let lti_message = LtiMessage::builder()
      .base_url(current_url)
      .launch_path("lti/launch")
      .label(defines::TOOL_NAME)
      .icon_path("assets/images/icon.png")
      .add_course_navigation_placement(product_family_code)
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
      .add_message(lti_message)
      .add_scope(NAMES_AND_ROLES_SCOPE)
      .build()
  }

  fn handle_platform_response(
    &self,
    platform_response: ToolConfiguration,
  ) -> Result<(), DynamicRegistrationError> {
    // Use tokio runtime to handle async database operations
    let pool = self.pool.clone();
    let rt = tokio::runtime::Runtime::new()
      .map_err(|e| DynamicRegistrationError::RequestFailed(e.to_string()))?;

    rt.block_on(async {
      // The platform_response contains the tool configuration returned by the platform
      // after successful registration. It includes the client_id and other registration details.

      // Extract client_id - this is required for a successful registration
      let client_id = platform_response.client_id.as_ref().ok_or_else(|| {
        DynamicRegistrationError::InvalidConfig("Client ID missing from response".to_string())
      })?;

      // Extract deployment_id if present
      let deployment_id = platform_response
        .lti_tool_configuration
        .deployment_id
        .as_deref();

      // Try to extract issuer from the redirect_uris or client_uri
      // In a proper implementation, the issuer should be passed separately or stored in context
      // For now, we'll require that a platform already exists in the database

      // Serialize the full tool configuration for storage
      let registration_config = serde_json::to_value(&platform_response).map_err(|e| {
        DynamicRegistrationError::InvalidConfig(format!(
          "Failed to serialize tool configuration: {e}"
        ))
      })?;

      // Look up the platform by checking existing platforms
      // This is a temporary solution - ideally the platform info should be passed in context
      let platforms = sqlx::query_as!(LtiPlatform, "SELECT * FROM lti_platforms")
        .fetch_all(&pool)
        .await
        .map_err(|e| {
          DynamicRegistrationError::RequestFailed(format!("Failed to query platforms: {e}"))
        })?;

      if platforms.is_empty() {
        return Err(DynamicRegistrationError::InvalidConfig(
          "No platforms found. Platform must be created before registration.".to_string(),
        ));
      }

      // For now, use the first platform found
      // In a real implementation, you'd match based on the registration context
      let platform = &platforms[0];

      // Create or update the registration
      match LtiRegistration::find_by_platform_and_client(&pool, platform.id, client_id).await {
        Ok(Some(existing_registration)) => {
          // Update existing registration status
          existing_registration
            .update_status(&pool, "active")
            .await
            .map_err(|e| {
              DynamicRegistrationError::RequestFailed(format!(
                "Failed to update registration: {e}"
              ))
            })?;
        }
        Ok(None) => {
          // Create new registration
          LtiRegistration::create(
            &pool,
            platform.id,
            client_id,
            deployment_id,
            &registration_config,
            None, // registration_token can be cleared after successful registration
            "active",
          )
          .await
          .map_err(|e| {
            DynamicRegistrationError::RequestFailed(format!("Failed to create registration: {e}"))
          })?;
        }
        Err(e) => {
          return Err(DynamicRegistrationError::RequestFailed(format!(
            "Failed to query registration: {e}"
          )));
        }
      }

      Ok(())
    })
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
