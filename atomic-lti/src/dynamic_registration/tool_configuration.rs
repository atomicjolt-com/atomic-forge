use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use std::collections::HashMap;

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

#[derive(Serialize, Deserialize, Debug, Clone)]
#[skip_serializing_none]
pub struct LtiMessage {
  #[serde(rename = "type")]
  pub message_type: String,
  pub target_link_uri: Option<String>,
  pub label: Option<String>,
  pub icon_uri: Option<String>,
  pub custom_parameters: Option<HashMap<String, String>>,
  pub placements: Option<Vec<String>>,
  pub roles: Option<Vec<String>>,
}

impl ToolConfiguration {
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
    ToolConfiguration {
      application_type: "web".to_string(),
      response_types: vec!["id_token".to_string()],
      grant_types: vec!["implicit".to_string(), "client_credentials".to_string()],
      initiate_login_uri: format!("{}/{}", base_url, init_path),
      redirect_uris: vec![format!("{}/{}", base_url, redirect_path)],
      client_name: client_name.to_string(),
      jwks_uri: format!("{}/{}", base_url, jwks_path),
      logo_uri: Some(format!("{}/{}", base_url, logo_path)),
      client_uri: Some(format!("https://{}", base_url)),
      policy_uri: Some(policy_uri.to_string()),
      tos_uri: Some(tos_uri.to_string()),
      token_endpoint_auth_method: "private_key_jwt".to_string(),
      contacts: Some(vec![email.to_string()]),
      scope: [
        "line_item",
        "line_item_readonly",
        "result",
        "score",
        "names_and_roles",
      ]
      .join(" "),
      lti_tool_configuration: LtiToolConfiguration {
        deployment_id: None,
        domain: base_url.to_string(),
        secondary_domains: None,
        description: Some(client_name.to_string()),
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
        messages: vec![LtiMessage {
          message_type: "LtiDeepLinkingRequest".to_string(),
          target_link_uri: Some(launch_uri.to_string()),
          label: Some(client_name.to_string()),
          icon_uri: None,
          custom_parameters: None,
          placements: Some(vec!["ContentItemSelection".to_string()]),
          roles: None,
        }],
      },
      client_id: None,
      registration_client_uri: None,
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
