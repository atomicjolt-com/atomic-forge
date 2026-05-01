use crate::db::Pool;
use crate::defines;
use async_trait::async_trait;
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
  openid_configuration_url: &str,
) -> String {
  format!(
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic Registration - Atomic Decay</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #000;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }}

        .container {{
            max-width: 600px;
            width: 100%;
            background: #1a1a1a;
            border-radius: 8px;
            padding: 3rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }}

        h1 {{
            color: rgb(255, 221, 0);
            font-size: 2rem;
            margin-bottom: 1.5rem;
            text-align: center;
        }}

        .info-section {{
            background: #000;
            padding: 1.5rem;
            border-radius: 5px;
            border: 2px solid rgb(255, 221, 0);
            margin-bottom: 2rem;
        }}

        .info-label {{
            color: #888;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
        }}

        .info-value {{
            color: rgb(255, 221, 0);
            font-family: monospace;
            font-size: 1rem;
            word-break: break-all;
        }}

        .info-row {{
            margin-bottom: 1.5rem;
        }}

        .info-row:last-child {{
            margin-bottom: 0;
        }}

        form {{
            text-align: center;
        }}

        .submit-button {{
            background: rgb(255, 221, 0);
            color: #000;
            border: none;
            padding: 1rem 2.5rem;
            border-radius: 5px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            width: 100%;
            max-width: 300px;
        }}

        .submit-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 221, 0, 0.4);
        }}

        .submit-button:active {{
            transform: translateY(0);
        }}

        .header {{
            color: #ccc;
            text-align: center;
            margin-bottom: 1rem;
            font-size: 0.95rem;
        }}

        @media (max-width: 768px) {{
            body {{
                padding: 1rem;
            }}

            .container {{
                padding: 2rem 1.5rem;
            }}

            h1 {{
                font-size: 1.5rem;
            }}

            .info-section {{
                padding: 1rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Dynamic Registration</h1>
        <p class="header">Complete the LTI tool registration with your platform</p>

        <div class="info-section">
            <div class="info-row">
                <div class="info-label">Platform</div>
                <div class="info-value">{}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Product Family</div>
                <div class="info-value">{}</div>
            </div>
        </div>

        <form action="{}" method="POST">
            <input type="hidden" name="registration_endpoint" value="{}">
            <input type="hidden" name="registration_token" value="{}">
            <input type="hidden" name="product_family_code" value="{}">
            <input type="hidden" name="openid_configuration" value="{}">
            <button type="submit" class="submit-button">Complete Registration</button>
        </form>
    </div>
</body>
</html>"#,
    platform_config.issuer,
    platform_config.lti_platform_configuration.product_family_code,
    registration_finish_path,
    platform_config.registration_endpoint,
    registration_token,
    platform_config.lti_platform_configuration.product_family_code,
    openid_configuration_url,
  )
}

fn dynamic_registration_complete_html() -> String {
  r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Complete - Atomic Decay</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            background: #000;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }

        .container {
            max-width: 500px;
            width: 100%;
            background: #1a1a1a;
            border-radius: 8px;
            padding: 3rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            text-align: center;
        }

        .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: rgb(255, 221, 0);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            animation: scaleIn 0.3s ease-out;
        }

        @keyframes scaleIn {
            from {
                transform: scale(0);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        h1 {
            color: rgb(255, 221, 0);
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        p {
            color: #ccc;
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
        }

        .closing-message {
            color: #888;
            font-size: 0.9rem;
            font-style: italic;
        }

        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .container {
                padding: 2rem 1.5rem;
            }

            h1 {
                font-size: 1.5rem;
            }

            .success-icon {
                width: 60px;
                height: 60px;
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>Registration Complete</h1>
        <p>The dynamic registration process has been completed successfully.</p>
        <p class="closing-message">This window will close automatically...</p>
    </div>
    <script type="text/javascript">
        // Notify the platform that registration is complete
        (window.opener || window.parent).postMessage({subject:"org.imsglobal.lti.close"}, "*");

        // Auto-close after 3 seconds as a fallback
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

#[async_trait]
impl DynamicRegistrationStore for DBDynamicRegistrationStore {
  fn get_client_registration_request(
    &self,
    current_url: &str,
    product_family_code: &str,
  ) -> Result<ToolConfiguration, DynamicRegistrationError> {
    // Parse the URL to extract just the domain without protocol
    let url = url::Url::parse(current_url)
      .map_err(|e| DynamicRegistrationError::InvalidConfig(format!("Invalid URL: {}", e)))?;

    let domain = match url.port() {
      Some(port) => format!("{}:{}", url.host_str().unwrap_or("localhost"), port),
      None => url.host_str().unwrap_or("localhost").to_string(),
    };

    let deep_link_message = LtiMessage::builder()
      .base_url(current_url)
      .launch_path("lti/launch")
      .label(defines::TOOL_NAME)
      .icon_path("assets/images/icon.png")
      .set_deep_linking_message_type()
      .add_deep_link_placements(product_family_code)
      .roles(vec![]) // Explicitly set empty roles array
      .custom_parameters(std::collections::HashMap::new()) // Explicitly set empty custom parameters
      .build()?;

    let lti_message = LtiMessage::builder()
      .base_url(current_url)
      .launch_path("lti/launch")
      .label(defines::TOOL_NAME)
      .icon_path("assets/images/icon.png")
      .add_course_navigation_placement(product_family_code)
      .roles(vec![]) // Explicitly set empty roles array
      .custom_parameters(std::collections::HashMap::new()) // Explicitly set empty custom parameters
      .build()?;

    // Custom Canvas placement: a "Course Materials" entry that platforms
    // expose alongside (not in place of) the standard course_navigation
    // link. Canvas honors arbitrary placement strings declared here when
    // the LMS admin enables them in the developer key.
    let course_materials_message = LtiMessage::builder()
      .base_url(current_url)
      .launch_path("lti/launch")
      .label("Course Materials")
      .icon_path("assets/images/icon.png")
      .add_placement("course_materials")
      .roles(vec![])
      .custom_parameters(std::collections::HashMap::new())
      .build()?;

    let mut tool_config = ToolConfiguration::builder()
      .product_family_code(product_family_code)
      .base_url(current_url) // Use full URL with protocol for proper URL construction
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
      .add_message(course_materials_message)
      .add_scope(NAMES_AND_ROLES_SCOPE)
      .build()?;

    // Fix the domain field to not include protocol
    tool_config.lti_tool_configuration.domain = domain.clone();

    // Fix client_uri to not have double protocol
    tool_config.client_uri = Some(current_url.to_string());

    // Ensure secondary_domains is set to empty array instead of None
    tool_config.lti_tool_configuration.secondary_domains = Some(vec![]);

    Ok(tool_config)
  }

  async fn handle_platform_response(
    &self,
    platform_config: &PlatformConfiguration,
    platform_response: ToolConfiguration,
  ) -> Result<(), DynamicRegistrationError> {
    let client_id = platform_response.client_id.as_deref().ok_or_else(|| {
      DynamicRegistrationError::InvalidConfig("Client ID missing from response".to_string())
    })?;
    let deployment_id = platform_response
      .lti_tool_configuration
      .deployment_id
      .as_deref();
    let registration_config = serde_json::to_value(&platform_response).map_err(|e| {
      DynamicRegistrationError::InvalidConfig(format!(
        "Failed to serialize tool configuration: {e}"
      ))
    })?;

    let mut tx = self.pool.begin().await.map_err(|e| {
      DynamicRegistrationError::RequestFailed(format!("Failed to begin transaction: {e}"))
    })?;

    // Upsert the platform keyed by issuer so re-registrations (e.g. after
    // key rotation) refresh the OIDC endpoints rather than colliding with
    // the UNIQUE(issuer) constraint.
    let platform = sqlx::query_as!(
      crate::models::lti_platform::LtiPlatform,
      r#"
      INSERT INTO lti_platforms (issuer, name, jwks_url, token_url, oidc_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (issuer) DO UPDATE
      SET jwks_url = EXCLUDED.jwks_url,
          token_url = EXCLUDED.token_url,
          oidc_url = EXCLUDED.oidc_url,
          updated_at = NOW()
      RETURNING id, uuid, issuer, name, jwks_url, token_url, oidc_url, created_at, updated_at
      "#,
      platform_config.issuer,
      Option::<String>::None,
      platform_config.jwks_uri,
      platform_config.token_endpoint,
      platform_config.authorization_endpoint,
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
      DynamicRegistrationError::RequestFailed(format!("Failed to upsert platform: {e}"))
    })?;

    // Upsert the registration keyed by (platform_id, client_id) — the
    // schema's UNIQUE constraint — so repeat registrations under the same
    // platform+client refresh the config in place.
    sqlx::query!(
      r#"
      INSERT INTO lti_registrations
        (platform_id, client_id, deployment_id, registration_config, registration_token, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (platform_id, client_id) DO UPDATE
      SET deployment_id = EXCLUDED.deployment_id,
          registration_config = EXCLUDED.registration_config,
          status = EXCLUDED.status,
          updated_at = NOW()
      "#,
      platform.id,
      client_id,
      deployment_id,
      registration_config,
      Option::<String>::None,
      "active",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| {
      DynamicRegistrationError::RequestFailed(format!("Failed to upsert registration: {e}"))
    })?;

    tx.commit().await.map_err(|e| {
      DynamicRegistrationError::RequestFailed(format!("Failed to commit transaction: {e}"))
    })?;

    Ok(())
  }

  fn registration_html(
    &self,
    platform_config: &PlatformConfiguration,
    registration_finish_path: &str,
    registration_token: &str,
    openid_configuration_url: &str,
  ) -> String {
    dynamic_registration_init_html(
      platform_config,
      registration_finish_path,
      registration_token,
      openid_configuration_url,
    )
  }

  fn complete_html(&self) -> String {
    dynamic_registration_complete_html()
  }
}
