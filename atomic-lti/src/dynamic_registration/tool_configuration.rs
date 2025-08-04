use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use std::collections::HashMap;

use crate::errors::DynamicRegistrationError;

use super::lti_message::LtiMessage;

// Tool Scopes
pub const AGS_SCOPE_LINE_ITEM: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem";
pub const AGS_SCOPE_LINE_ITEM_READONLY: &str =
  "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly";
pub const AGS_SCOPE_RESULT: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly";
pub const AGS_SCOPE_SCORE: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/score";
pub const NAMES_AND_ROLES_SCOPE: &str =
  "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";
pub const CALIPER_SCOPE: &str = "https://purl.imsglobal.org/spec/lti-ces/v1p0/scope/send";

// This structure defines the configuration for the client.
// Taken from https://www.imsglobal.org/spec/lti-dr/v1p0#tool-configuration
#[skip_serializing_none]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ToolConfiguration {
  pub application_type: String,
  pub grant_types: Vec<String>,
  pub response_types: Vec<String>,
  pub redirect_uris: Vec<String>,
  pub initiate_login_uri: String,
  pub client_name: String,
  pub jwks_uri: String,
  pub logo_uri: Option<String>,
  pub token_endpoint_auth_method: String,
  pub contacts: Option<Vec<String>>,
  pub scope: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-tool-configuration")]
  pub lti_tool_configuration: LtiToolConfiguration,
  // As per OIDCReg specification. The platform should present this information to the platform's end users of that tool. Localized representations may be included as described in Section 2.1 of the OIDCReg specification
  pub client_uri: Option<String>,
  pub tos_uri: Option<String>,
  pub policy_uri: Option<String>,
  // The following fields are not included in the configuration sent to the platform
  // but instead are sent back from the platform as an acknowledgement of the registration
  // See https://www.imsglobal.org/spec/lti-dr/v1p0#tool-configuration-from-the-platform
  pub client_id: Option<String>,
  pub registration_client_uri: Option<String>,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
#[skip_serializing_none]
pub struct LtiToolConfiguration {
  pub domain: String,
  pub secondary_domains: Option<Vec<String>>,
  pub deployment_id: Option<String>,
  pub target_link_uri: String,
  pub custom_parameters: Option<HashMap<String, String>>,
  pub description: Option<String>,
  pub messages: Vec<LtiMessage>,
  pub claims: Vec<String>,
}

impl ToolConfiguration {
  pub fn builder() -> ToolConfigurationBuilder {
    ToolConfigurationBuilder::default()
  }
}

pub struct ToolConfigurationBuilder {
  product_family_code: String,
  base_url: String,
  init_path: String,
  redirect_path: String,
  jwks_path: String,
  launch_path: String,
  client_name: String,
  logo_path: String,
  policy_uri: String,
  tos_uri: String,
  email: String,
  icon_path: String,
  scopes: Option<Vec<String>>,
  messages: Vec<LtiMessage>,
}

impl ToolConfigurationBuilder {
  pub fn product_family_code(mut self, product_family_code: &str) -> Self {
    self.product_family_code = product_family_code.to_string();
    self
  }

  pub fn base_url(mut self, base_url: &str) -> Self {
    self.base_url = base_url.to_string();
    self
  }

  pub fn init_path(mut self, init_path: &str) -> Self {
    self.init_path = init_path.to_string();
    self
  }

  pub fn redirect_path(mut self, redirect_path: &str) -> Self {
    self.redirect_path = redirect_path.to_string();
    self
  }

  pub fn jwks_path(mut self, jwks_path: &str) -> Self {
    self.jwks_path = jwks_path.to_string();
    self
  }

  pub fn launch_path(mut self, launch_path: &str) -> Self {
    self.launch_path = launch_path.to_string();
    self
  }

  pub fn client_name(mut self, client_name: &str) -> Self {
    self.client_name = client_name.to_string();
    self
  }

  pub fn logo_path(mut self, logo_path: &str) -> Self {
    self.logo_path = logo_path.to_string();
    self
  }

  pub fn policy_uri(mut self, policy_uri: &str) -> Self {
    self.policy_uri = policy_uri.to_string();
    self
  }

  pub fn tos_uri(mut self, tos_uri: &str) -> Self {
    self.tos_uri = tos_uri.to_string();
    self
  }

  pub fn email(mut self, email: &str) -> Self {
    self.email = email.to_string();
    self
  }

  pub fn icon_path(mut self, icon_path: &str) -> Self {
    self.icon_path = icon_path.to_string();
    self
  }

  pub fn add_scope(mut self, scope: &str) -> Self {
    if let Some(scopes) = &mut self.scopes {
      if !scopes.contains(&scope.to_string()) {
        scopes.push(scope.to_string());
      }
    } else {
      self.scopes = Some(vec![scope.to_string()]);
    }
    self
  }

  pub fn add_message(mut self, message: LtiMessage) -> Self {
    self.messages.push(message);
    self
  }

  fn target_link_uri(&self) -> String {
    format!("{}/{}", self.base_url, self.launch_path)
  }

  pub fn build(self) -> Result<ToolConfiguration, DynamicRegistrationError> {
    if self.base_url.is_empty() {
      return Err(DynamicRegistrationError::InvalidConfig(
        "base_url type must be set when building an LtiMessage".to_string(),
      ));
    }

    if self.init_path.is_empty() {
      return Err(DynamicRegistrationError::InvalidConfig(
        "init_path must be set when building an LtiMessage".to_string(),
      ));
    }

    if self.redirect_path.is_empty() {
      return Err(DynamicRegistrationError::InvalidConfig(
        "redirect_path must be set when building an LtiMessage".to_string(),
      ));
    }

    if self.jwks_path.is_empty() {
      return Err(DynamicRegistrationError::InvalidConfig(
        "jwks_path must be set when building an LtiMessage".to_string(),
      ));
    }

    if self.client_name.is_empty() {
      return Err(DynamicRegistrationError::InvalidConfig(
        "client_name must be set when building an LtiMessage".to_string(),
      ));
    }

    let scopes = match &self.scopes {
      Some(scopes) => scopes.join(" "),
      None => "".to_string(),
    };

    let target_link_uri = self.target_link_uri();

    // Extract domain from base_url, removing protocol and path
    let domain = self.base_url
      .trim_start_matches("https://")
      .trim_start_matches("http://")
      .split('/')
      .next()
      .unwrap_or(&self.base_url)
      .to_string();

    Ok(ToolConfiguration {
      application_type: "web".to_string(),
      response_types: vec!["id_token".to_string()],
      grant_types: vec!["implicit".to_string(), "client_credentials".to_string()],
      initiate_login_uri: format!("{}/{}", self.base_url, self.init_path),
      redirect_uris: vec![format!("{}/{}", self.base_url, self.redirect_path)],
      client_name: self.client_name.to_string(),
      jwks_uri: format!("{}/{}", self.base_url, self.jwks_path),
      logo_uri: Some(format!("{}/{}", self.base_url, self.logo_path)),
      client_uri: Some(format!("https://{}", domain)),
      policy_uri: Some(self.policy_uri.to_string()),
      tos_uri: Some(self.tos_uri.to_string()),
      token_endpoint_auth_method: "private_key_jwt".to_string(),
      contacts: Some(vec![self.email.to_string()]),
      scope: scopes,
      lti_tool_configuration: LtiToolConfiguration {
        deployment_id: None,
        domain: domain.clone(),
        secondary_domains: Some(vec![]),
        description: Some(self.client_name.to_string()),
        target_link_uri,
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
          Some(map)
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
        messages: self.messages,
      },
      client_id: None,
      registration_client_uri: None,
    })
  }
}

impl Default for ToolConfigurationBuilder {
  fn default() -> Self {
    ToolConfigurationBuilder {
      product_family_code: "".to_string(),
      base_url: "".to_string(),
      init_path: "".to_string(),
      redirect_path: "".to_string(),
      jwks_path: "".to_string(),
      launch_path: "".to_string(),
      client_name: "".to_string(),
      logo_path: "".to_string(),
      policy_uri: "".to_string(),
      tos_uri: "".to_string(),
      email: "".to_string(),
      icon_path: "".to_string(),
      scopes: None,
      messages: vec![],
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn test_tool_configuration_deserialization() {
    let data = json!({
        "application_type": "web",
        "response_types": ["id_token"],
        "grant_types": ["implict", "client_credentials"],
        "initiate_login_uri": "https://client.example.org/lti",
        "redirect_uris": ["https://client.example.org/callback", "https://client.example.org/callback2"],
        "client_name": "Virtual Garden",
        "jwks_uri": "https://client.example.org/.well-known/jwks.json",
        "logo_uri": "https://client.example.org/logo.png",
        "client_uri": "https://client.example.org",
        "policy_uri": "https://client.example.org/privacy",
        "tos_uri": "https://client.example.org/tos",
        "token_endpoint_auth_method": "private_key_jwt",
        "contacts": ["ve7jtb@example.org", "mary@example.org"],
        "scope": "https://purl.imsglobal.org/spec/lti-ags/scope/score",
        "https://purl.imsglobal.org/spec/lti-tool-configuration": {
            "domain": "client.example.org",
            "description": "Learn Botany by tending to your little (virtual) garden.",
            "target_link_uri": "https://client.example.org/lti",
            "custom_parameters": {
                "context_history": "$Context.id.history"
            },
            "claims": ["iss", "sub", "name", "given_name", "family_name"],
            "messages": [
                {
                    "type": "LtiDeepLinkingRequest",
                    "target_link_uri": "https://client.example.org/lti/dl",
                    "label": "Add a virtual garden",
                    "custom_parameters": {
                        "botanical_set":"12943,49023,50013"
                    },
                    "placements": ["ContentArea"]
                },
                {
                    "type": "LtiDeepLinkingRequest",
                    "label": "Add your Garden image",
                    "placements": ["RichTextEditor"],
                    "roles": [
                        "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper",
                        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
                    ]
                }
            ]
        }
    });

    let config: ToolConfiguration = serde_json::from_value(data).unwrap();

    assert_eq!(config.application_type, "web");
    assert_eq!(config.initiate_login_uri, "https://client.example.org/lti");
    // Add more assertions for the rest of the fields...
  }
}
