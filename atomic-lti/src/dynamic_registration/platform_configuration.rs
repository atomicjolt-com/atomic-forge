use serde::{Deserialize, Serialize};

// https://www.imsglobal.org/spec/lti-dr/v1p0#platform-configuration
#[derive(Serialize, Deserialize, Debug)]
pub struct PlatformConfiguration {
  pub issuer: String,
  pub authorization_endpoint: String,
  pub token_endpoint: String,
  pub token_endpoint_auth_methods_supported: Vec<String>,
  pub token_endpoint_auth_signing_alg_values_supported: Vec<String>,
  pub jwks_uri: String,
  pub registration_endpoint: String,
  pub scopes_supported: Vec<String>,
  pub response_types_supported: Vec<String>,
  pub subject_types_supported: Vec<String>,
  pub id_token_signing_alg_values_supported: Vec<String>,
  pub claims_supported: Vec<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub authorization_server: Option<String>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-platform-configuration")]
  pub lti_platform_configuration: LtiPlatformConfiguration,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LtiPlatformConfiguration {
  pub product_family_code: String,
  pub version: String,
  pub messages_supported: Vec<MessageSupported>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub variables: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MessageSupported {
  #[serde(rename = "type")]
  pub message_type: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub placements: Option<Vec<String>>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn test_platform_configuration_deserialization() {
    let data = json!({
        "issuer": "https://server.example.com",
        "authorization_endpoint":  "https://server.example.com/connect/authorize",
        "token_endpoint": "https://server.example.com/connect/token",
        "token_endpoint_auth_methods_supported": ["private_key_jwt"],
        "token_endpoint_auth_signing_alg_values_supported": ["RS256"],
        "jwks_uri": "https://server.example.com/jwks.json",
        "registration_endpoint": "https://server.example.com/connect/register",
        "scopes_supported": ["openid", "https://purl.imsglobal.org/spec/lti-gs/scope/contextgroup.readonly",
           "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
           "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
           "https://purl.imsglobal.org/spec/lti-ags/scope/score",
           "https://purl.imsglobal.org/spec/lti-reg/scope/registration"],
        "response_types_supported": ["id_token"],
        "subject_types_supported": ["public", "pairwise"],
        "id_token_signing_alg_values_supported":
          ["RS256", "ES256"],
        "claims_supported":
          ["sub", "iss", "name", "given_name", "family_name", "nickname", "picture", "email", "locale"],
         "https://purl.imsglobal.org/spec/lti-platform-configuration": {
            "product_family_code": "ExampleLMS",
            "version": "1.0.0",
            "messages_supported": [
                {"type": "LtiResourceLinkRequest"},
                {"type": "LtiDeepLinkingRequest"}],
            "variables": ["CourseSection.timeFrame.end", "CourseSection.timeFrame.begin", "Context.id.history", "ResourceLink.id.history"]
        }
    });

    let config: PlatformConfiguration = serde_json::from_value(data).unwrap();

    assert_eq!(config.issuer, "https://server.example.com");
    assert_eq!(
      config.authorization_endpoint,
      "https://server.example.com/connect/authorize"
    );
    // Add more assertions for the rest of the fields...
  }
}
