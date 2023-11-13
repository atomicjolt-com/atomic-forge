use crate::jwt::insecure_decode;
use crate::lti_definitions::{LTI_DEEP_LINKING_REQUEST, RESOURCE_LINK_CLAIM};
use crate::names_and_roles::NamesAndRolesClaim;
use crate::{errors::SecureError, lti_definitions::NAMES_AND_ROLES_SERVICE_VERSIONS};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use strum_macros::EnumString;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IdTokenErrors {
  errors: Option<Errors>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Errors {
  errors: Option<()>,
}

#[derive(Debug, PartialEq, EnumString, Deserialize, Serialize, Clone)]
#[strum(ascii_case_insensitive)]
pub enum DocumentTargets {
  #[serde(rename = "iframe")]
  Iframe,
  #[serde(rename = "window")]
  Window,
  #[serde(rename = "embed")]
  Embed,
}

#[derive(Debug, PartialEq, EnumString, Deserialize, Serialize, Clone)]
#[strum(ascii_case_insensitive)]
pub enum AcceptTypes {
  #[serde(rename = "link")]
  Link,
  #[serde(rename = "file")]
  File,
  #[serde(rename = "html")]
  Html,
  #[serde(rename = "ltiresourcelink")]
  LtiResourceLink,
  #[serde(rename = "image")]
  Image,
}

// https://www.imsglobal.org/spec/lti/v1p3#resource-link-claim
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ResourceLinkClaim {
  // Opaque identifier for a placement of an LTI resource link within a context that MUST
  // be a stable and locally unique to the deployment_id. This value MUST change if the link
  // is copied or exported from one system or context and imported into another system or context.
  // The value of id MUST NOT exceed 255 ASCII characters in length and is case-sensitive
  pub id: String,
  // Descriptive phrase for an LTI resource link placement.
  pub description: Option<String>,
  // Descriptive title for an LTI resource link placement.
  pub title: Option<String>,
  pub validation_context: Option<String>,
  pub errors: Option<IdTokenErrors>,
}

// https://www.imsglobal.org/spec/lti/v1p3#launch-presentation-claim
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LaunchPresentationClaim {
  // The kind of browser window or frame from which the user launched inside the message
  // sender's system. The value for this property MUST be one of: frame, iframe, or window.
  pub document_target: Option<DocumentTargets>,
  // Fully-qualified HTTPS URL within the message sender's user experience to where the message
  // receiver can redirect the user back. The message receiver can redirect to this URL after
  // the user has finished activity, or if the receiver cannot start because of some technical difficulty.
  pub return_url: Option<String>,
  // Language, country, and variant as represented using the IETF Best Practices for Tags for Identifying Languages
  pub locale: String,
  // Height of the window or frame where the content from the message receiver will be displayed to the user.
  pub height: Option<i32>,
  // Width of the window or frame where the content from the message receiver will be displayed to the user.
  pub width: Option<i32>,
  pub validation_context: Option<String>,
  pub errors: Option<IdTokenErrors>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DeepLinkingClaim {
  pub deep_link_return_url: String,
  pub accept_types: Vec<AcceptTypes>,
  pub accept_presentation_document_targets: Vec<DocumentTargets>,
  pub accept_media_types: Option<String>,
  pub accept_multiple: Option<bool>,
  pub accept_lineitem: Option<bool>,
  pub auto_create: Option<bool>,
  pub title: Option<String>,
  pub text: Option<String>,
  pub data: Option<String>,
}

#[derive(Debug, PartialEq, EnumString, Deserialize, Serialize, Clone)]
pub enum AGSScopes {
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem")]
  LineItem,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly")]
  ResultReadOnly,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-ags/scope/score")]
  Score,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly")]
  LineItemReadOnly,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AGSClaim {
  pub scope: Vec<AGSScopes>,
  pub lineitems: String,
  pub lineitem: Option<String>,
  pub validation_context: Option<String>,
  pub errors: Option<IdTokenErrors>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LISClaim {
  pub person_sourcedid: String,
  pub course_offering_sourcedid: String,
  pub course_section_sourcedid: Option<String>,
  pub validation_context: Option<String>,
  pub errors: Option<IdTokenErrors>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ContextClaim {
  pub id: String,
  pub label: Option<String>,
  pub title: Option<String>,
  pub r#type: Option<Vec<String>>,
  pub validation_context: Option<String>,
  pub errors: Option<IdTokenErrors>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ToolPlatformClaim {
  pub guid: String,
  pub contact_email: Option<String>,
  pub description: Option<String>,
  pub name: Option<String>,
  pub url: Option<String>,
  pub product_family_code: Option<String>,
  pub version: Option<String>,
  pub validation_context: Option<String>,
  pub errors: Option<IdTokenErrors>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IdToken {
  pub aud: String,
  pub auds: Option<Vec<String>>,
  pub azp: String,
  pub exp: i64,
  pub iat: i64,
  pub iss: String,
  pub nonce: String,
  pub sub: String,

  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/message_type")]
  pub message_type: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/version")]
  pub lti_version: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/resource_link")]
  pub resource_link: ResourceLinkClaim,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/deployment_id")]
  pub deployment_id: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/target_link_uri")]
  pub target_link_uri: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/roles")]
  pub roles: Vec<String>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/role_scope_mentor")]
  pub role_scope_mentor: Option<Vec<String>>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/context")]
  pub context: Option<ContextClaim>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/tool_platform")]
  pub tool_platform: Option<ToolPlatformClaim>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/launch_presentation")]
  pub launch_presentation: Option<LaunchPresentationClaim>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/lis")]
  pub lis: Option<LISClaim>,
  // TODO need to figure out how to handle this
  // #[serde(rename = "http://www.ExamplePlatformVendor.com/session")]
  // pub session: Option<HashMap<String, String>>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/custom")]
  pub custom: Option<HashMap<String, String>>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings")]
  pub deep_linking: Option<DeepLinkingClaim>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-dl/claim/data ")]
  pub data: Option<String>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice")]
  pub names_and_roles: Option<NamesAndRolesClaim>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint")]
  pub ags: Option<AGSClaim>,

  pub lti11_legacy_user_id: Option<String>,
  pub picture: Option<String>,
  pub email: Option<String>,
  pub name: Option<String>,
  pub given_name: Option<String>,
  pub family_name: Option<String>,
  pub middle_name: Option<String>,
  pub locale: Option<String>,

  pub errors: Option<IdTokenErrors>,
}

impl IdToken {
  // Extract the iss claim from an ID Token without validating the signature
  pub fn extract_iss(token: &str) -> Result<String, SecureError> {
    let id_token = insecure_decode::<IdToken>(token)?.claims;
    Ok(id_token.iss)
  }

  // Get the client_id from the IdToken
  pub fn client_id(&self) -> String {
    match &self.auds {
      Some(auds) => {
        if auds.len() > 1 {
          // azp will contain the client_id if there are multiple auds
          self.azp.clone()
        } else {
          auds[0].clone()
        }
      }
      _ => self.aud.clone(),
    }
  }

  // Returns the LMS host URL from the IdToken, based on whether it's a deep link launch or not
  pub fn lms_host(&self) -> Option<String> {
    if self.is_deep_link_launch() {
      self
        .deep_linking
        .as_ref()
        .map(|dl| dl.deep_link_return_url.clone())
    } else {
      self
        .launch_presentation
        .as_ref()
        .and_then(|lp| lp.return_url.clone())
    }
  }

  // Returns the LMS URL from the IdToken, based on the LMS host URL
  pub fn lms_url(&self) -> Option<String> {
    self.lms_host().map(|host| format!("https://{}", host))
  }

  // Returns true if the IdToken is a deep link launch
  pub fn is_deep_link_launch(&self) -> bool {
    self.message_type == LTI_DEEP_LINKING_REQUEST
  }

  // Returns true if the IdToken is a names and roles launch
  pub fn is_names_and_roles_launch(&self) -> bool {
    match &self.names_and_roles {
      None => false,
      Some(nar) => {
        if !nar
          .service_versions
          .iter()
          .any(|v| v == NAMES_AND_ROLES_SERVICE_VERSIONS[0])
        {
          return false;
        }
        true
      }
    }
  }

  // Returns the names and roles endpoint URL from the IdToken
  pub fn names_and_roles_endpoint(&self) -> Option<String> {
    self
      .names_and_roles
      .as_ref()
      .map(|nar| nar.context_memberships_url.clone())
  }

  // Returns true if the IdToken is an assignment and grades launch
  pub fn is_assignment_and_grades_launch(&self) -> bool {
    self.ags.is_some()
  }

  // Validates the contents of the IdToken and returns a vector of errors
  pub fn validate(&self, requested_target_link_uri: &str) -> Vec<String> {
    let mut errors = Vec::new();

    if self.target_link_uri != requested_target_link_uri {
      errors.push(format!(
        "LTI token target link uri '{}' doesn't match url '{}'",
        self.target_link_uri, requested_target_link_uri
      ));
    }

    if self.resource_link.id.is_empty() {
      errors.push(format!(
        "LTI token is missing required field id from the claim {}",
        RESOURCE_LINK_CLAIM
      ));
    }

    if let Some(auds) = &self.auds {
      if auds.len() > 1 {
        if self.azp.is_empty() {
          errors.push("LTI token is missing required field azp".to_string());
        } else if self.aud.contains(&self.azp.to_string()) {
          errors.push("azp is not one of the aud's".to_owned());
        }
      }
    }

    if !self.lti_version.starts_with("1.3") {
      errors.push("Invalid LTI version".to_owned());
    }

    errors
  }

  // Create a new id token that can be embedded in a JWT that will be sent to the client
  // The entire JWT needs to fit in a HTTP header field so we strip out
  // known large values that won't be needed by the API endpoints
  pub fn to_client_id_token(&self) -> IdToken {
    let mut id_token = self.clone();
    id_token.launch_presentation = None;

    // token.delete(AtomicLti::Definitions::CUSTOM_CLAIM)
    // token.delete(AtomicLti::Definitions::LAUNCH_PRESENTATION)
    // token.delete(AtomicLti::Definitions::BASIC_OUTCOME_CLAIM)
    // token.delete(AtomicLti::Definitions::ROLES_CLAIM)
    // token[AtomicLti::Definitions::RESOURCE_LINK_CLAIM]&.delete("description")

    id_token
  }
}

impl Default for IdToken {
  fn default() -> Self {
    Self {
      aud: "".to_string(),
      auds: Some(vec![]),
      azp: "".to_string(),
      exp: (Utc::now() + Duration::minutes(15)).timestamp(),
      iat: Utc::now().timestamp(),
      iss: "".to_string(),
      nonce: "".to_string(),
      sub: "".to_string(),
      message_type: "".to_string(),
      lti_version: "".to_string(),
      resource_link: ResourceLinkClaim {
        id: "".to_string(),
        description: None,
        title: None,
        validation_context: None,
        errors: None,
      },
      deployment_id: "".to_string(),
      target_link_uri: "".to_string(),
      roles: vec![],
      role_scope_mentor: Some(vec![]),
      context: None,
      tool_platform: None,
      launch_presentation: None,
      lis: None,
      //session: HashMap::new(),
      custom: None,
      deep_linking: None,
      data: None,
      names_and_roles: None,
      ags: None,
      lti11_legacy_user_id: None,
      picture: None,
      email: None,
      name: None,
      given_name: None,
      family_name: None,
      middle_name: None,
      locale: None,
      errors: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::jwks::{encode, generate_jwk};
  use openssl::rsa::Rsa;

  #[test]
  fn test_id_token_incorrect_target_link_uri() {
    let id_token = IdToken {
      target_link_uri: "notexample.com".to_string(),
      resource_link: ResourceLinkClaim {
        id: "123".to_string(),
        description: None,
        title: None,
        validation_context: None,
        errors: None,
      },
      auds: Some(vec!["example.com".to_string()]),
      azp: "".to_string(),
      aud: "example.com".to_string(),
      lti_version: "1.3".to_string(),
      ..Default::default()
    };
    let errors = id_token.validate("example.com");
    assert_eq!(errors.len(), 1);
  }

  #[test]
  fn test_lms_host() {
    let id_token = IdToken {
      message_type: "LtiDeepLinkingRequest".to_string(),
      deep_linking: Some(DeepLinkingClaim {
        deep_link_return_url: "example.com".to_string(),
        accept_types: vec![AcceptTypes::Link],
        accept_presentation_document_targets: vec![DocumentTargets::Iframe],
        accept_media_types: None,
        accept_multiple: None,
        accept_lineitem: None,
        auto_create: None,
        title: None,
        text: None,
        data: None,
      }),
      launch_presentation: None,
      ..Default::default()
    };
    assert_eq!(id_token.lms_host(), Some("example.com".to_string()));
  }

  #[test]
  fn test_lms_url() {
    let id_token = IdToken {
      message_type: "LtiDeepLinkingRequest".to_string(),
      deep_linking: Some(DeepLinkingClaim {
        deep_link_return_url: "example.com".to_string(),
        accept_types: vec![AcceptTypes::Link],
        accept_presentation_document_targets: vec![DocumentTargets::Iframe],
        accept_media_types: None,
        accept_multiple: None,
        accept_lineitem: None,
        auto_create: None,
        title: None,
        text: None,
        data: None,
      }),
      launch_presentation: None,
      ..Default::default()
    };
    assert_eq!(id_token.lms_url(), Some("https://example.com".to_string()));
  }

  #[test]
  fn test_is_deep_link_launch() {
    let id_token = IdToken {
      message_type: "LtiDeepLinkingRequest".to_string(),
      ..Default::default()
    };
    assert!(id_token.is_deep_link_launch());
  }

  #[test]
  fn test_is_names_and_roles_launch() {
    let id_token = IdToken {
      names_and_roles: Some(NamesAndRolesClaim {
        context_memberships_url: "example.com".to_string(),
        service_versions: vec![NAMES_AND_ROLES_SERVICE_VERSIONS[0].to_string()],
        validation_context: None,
        errors: None,
      }),
      ..Default::default()
    };
    assert!(id_token.is_names_and_roles_launch());
  }

  #[test]
  fn test_is_assignment_and_grades_launch() {
    let id_token = IdToken {
      ags: Some(AGSClaim {
        scope: vec![AGSScopes::LineItem],
        lineitems: "example.com".to_string(),
        lineitem: None,
        validation_context: None,
        errors: None,
      }),
      ..Default::default()
    };
    assert!(id_token.is_assignment_and_grades_launch());
  }

  #[test]
  fn test_validate() {
    let id_token = IdToken {
      target_link_uri: "example.com".to_string(),
      resource_link: ResourceLinkClaim {
        id: "123".to_string(),
        description: None,
        title: None,
        validation_context: None,
        errors: None,
      },
      auds: Some(vec!["example.com".to_string()]),
      azp: "".to_string(),
      aud: "example.com".to_string(),
      lti_version: "1.3".to_string(),
      ..Default::default()
    };
    let errors = id_token.validate("example.com");
    assert_eq!(errors.len(), 0);
  }

  #[test]
  fn test_extract_iss() {
    let iss = "https://lms.example.com";
    let aud = "https://www.example.com/lti/auth/token".to_string();
    let user_id = "12";
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let kid = "asdf_kid";
    let jwk = generate_jwk(kid, &rsa_key_pair).expect("Failed to generate JWK");

    // Set the expiration time to 15 minutes from now
    let expiration = Utc::now() + Duration::minutes(15);

    // Create a sample ID Token with an iss claim
    let id_token = IdToken {
      iss: iss.to_string(),
      sub: user_id.to_string(),
      aud: aud.clone(),
      exp: expiration.timestamp(),
      message_type: LTI_DEEP_LINKING_REQUEST.to_string(),
      deep_linking: Some(DeepLinkingClaim {
        deep_link_return_url: "example.com".to_string(),
        accept_types: vec![AcceptTypes::Link],
        accept_presentation_document_targets: vec![DocumentTargets::Iframe],
        accept_media_types: None,
        accept_multiple: None,
        accept_lineitem: None,
        auto_create: None,
        title: None,
        text: None,
        data: None,
      }),
      launch_presentation: None,
      ..Default::default()
    };

    // Encode the ID Token using the private key
    let token = encode(&id_token, &jwk.kid, rsa_key_pair).expect("Failed to encode token");

    // Test the extract_iss function
    let extracted_iss = IdToken::extract_iss(&token).unwrap();
    assert_eq!(extracted_iss, iss);
  }
}
