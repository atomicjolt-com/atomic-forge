use crate::errors::JwtError;
use crate::names_and_roles::{NamesAndRolesClaim, NAMES_AND_ROLES_SERVICE_VERSIONS};
use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use strum_macros::EnumString;

pub const LTI_VERSION: &str = "https://purl.imsglobal.org/spec/lti/claim/version";
pub const LAUNCH_PRESENTATION: &str =
  "https://purl.imsglobal.org/spec/lti/claim/launch_presentation";
pub const DEPLOYMENT_ID: &str = "https://purl.imsglobal.org/spec/lti/claim/deployment_id";
pub const MESSAGE_TYPE: &str = "https://purl.imsglobal.org/spec/lti/claim/message_type";

// Valid values for message_type
pub const LTI_RESOURCE_LINK_REQUEST: &str = "LtiResourceLinkRequest";
pub const LTI_DEEP_LINKING_REQUEST: &str = "LtiDeepLinkingRequest";

// Claims
pub const CONTEXT_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/context";
pub const RESOURCE_LINK_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/resource_link";
pub const TOOL_PLATFORM_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/tool_platform";
pub const AGS_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint";
pub const BASIC_OUTCOME_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-bo/claim/basicoutcome";

pub const MENTOR_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/role_scope_mentor";
pub const ROLES_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/roles";

pub const CUSTOM_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/custom";
pub const EXTENSION_CLAIM: &str = "http://www.ExamplePlatformVendor.com/session";

pub const LIS_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/lis";
pub const TARGET_LINK_URI_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/target_link_uri";
pub const LTI11_LEGACY_USER_ID_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti/claim/lti11_legacy_user_id";
pub const DEEP_LINKING_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings";
pub const DEEP_LINKING_DATA_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/data";
pub const DEEP_LINKING_TOOL_MSG_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/msg";
pub const DEEP_LINKING_TOOL_LOG_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/log";
pub const CONTENT_ITEM_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/content_items";

pub const CALIPER_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti-ces/claim/caliper-endpoint-service";

pub const TOOL_LAUNCH_CALIPER_CONTEXT: &str =
  "http://purl.imsglobal.org/ctx/caliper/v1p1/ToolLaunchProfile-extension";
pub const TOOL_USE_CALIPER_CONTEXT: &str = "http://purl.imsglobal.org/ctx/caliper/v1p1";

// Scopes
pub const AGS_SCOPE_LINE_ITEM: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem";
pub const AGS_SCOPE_LINE_ITEM_READONLY: &str =
  "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly";
pub const AGS_SCOPE_RESULT: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly";
pub const AGS_SCOPE_SCORE: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/score";
pub const NAMES_AND_ROLES_SCOPE: &str =
  "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";
pub const CALIPER_SCOPE: &str = "https://purl.imsglobal.org/spec/lti-ces/v1p0/scope/send";

pub const STUDENT_SCOPE: &str = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student";
pub const INSTRUCTOR_SCOPE: &str =
  "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor";
pub const LEARNER_SCOPE: &str = "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner";
pub const MENTOR_SCOPE: &str = "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor";
pub const MENTOR_ROLE_SCOPE: &str = "a62c52c02ba262003f5e";

// Launch contexts
pub const COURSE_CONTEXT: &str = "http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering";
pub const ACCOUNT_CONTEXT: &str = "Account";

// Configuration
pub const TOOL_CONFIGURATION: &str = "https://purl.imsglobal.org/spec/lti-tool-configuration";

// Specifies all available scopes.
pub const ALL_SCOPES: [&str; 5] = [
  AGS_SCOPE_LINE_ITEM,
  AGS_SCOPE_LINE_ITEM_READONLY,
  AGS_SCOPE_RESULT,
  AGS_SCOPE_SCORE,
  NAMES_AND_ROLES_SCOPE,
];

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
  pub fn extract_iss(token: &str) -> Result<String, JwtError> {
    let decoding_key = DecodingKey::from_secret(&[]);
    let mut validation = Validation::new(Algorithm::RS256);
    validation.insecure_disable_signature_validation();
    dbg!(&token);
    let id_token = jsonwebtoken::decode::<IdToken>(token, &decoding_key, &validation)
      .map(|data| data.claims)
      .map_err(|e| JwtError::CannotDecodeJwtToken(e.to_string()))?;

    Ok(id_token.iss)
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
    let jwk = generate_jwk(&rsa_key_pair).expect("Failed to generate JWK");

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
    let token = encode(&id_token, jwk.kid.clone(), rsa_key_pair).expect("Failed to encode token");

    // Test the extract_iss function
    let extracted_iss = IdToken::extract_iss(&token).unwrap();
    assert_eq!(extracted_iss, iss);
  }

  #[test]
  fn test_extract_iss_canvas() {
    let id_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjIwMjMtMDktMDFUMDA6MDA6MDRaXzMyYTZkNTM2LTdlMTUtNDZlNC1hM2IyLTE0ZTAxMzUyMTgxYSJ9.eyJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9tZXNzYWdlX3R5cGUiOiJMdGlSZXNvdXJjZUxpbmtSZXF1ZXN0IiwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vdmVyc2lvbiI6IjEuMy4wIiwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vcmVzb3VyY2VfbGluayI6eyJpZCI6ImE4YTc2ZmI4ZmJjYzJkMDk3ODdkYWZkMjg1NjRlMmVjZGFiNTFmMTEiLCJkZXNjcmlwdGlvbiI6bnVsbCwidGl0bGUiOiI4dGggR3JhZGUgTWF0aCAtIEJhbGwiLCJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImF1ZCI6IjQzNDYwMDAwMDAwMDAwNzU5IiwiYXpwIjoiNDM0NjAwMDAwMDAwMDA3NTkiLCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9kZXBsb3ltZW50X2lkIjoiMjMzMTA6YThhNzZmYjhmYmNjMmQwOTc4N2RhZmQyODU2NGUyZWNkYWI1MWYxMSIsImV4cCI6MTY5NzU5MzkyOSwiaWF0IjoxNjk3NTkwMzI5LCJpc3MiOiJodHRwczovL2NhbnZhcy5pbnN0cnVjdHVyZS5jb20iLCJub25jZSI6ImFBNm5pSnR5aVBkMEY3QWZHZ09EeVlmNUw0RlNiSGd2Iiwic3ViIjoiY2ZjYTE1ZDgtMjk1OC00NjQ3LWEzM2UtYTdjNGIyZGRhYjJjIiwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vdGFyZ2V0X2xpbmtfdXJpIjoiaHR0cHM6Ly9hdG9taWMtb3hpZGUuYXRvbWljam9sdC53aW4vbHRpL2xhdW5jaCIsInBpY3R1cmUiOiJodHRwczovL2NhbnZhcy5pbnN0cnVjdHVyZS5jb20vaW1hZ2VzL21lc3NhZ2VzL2F2YXRhci01MC5wbmciLCJlbWFpbCI6Imp1c3RpbmJhbGxAZ21haWwuY29tIiwibmFtZSI6Imp1c3RpbmJhbGxAZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6Imp1c3RpbmJhbGxAZ21haWwuY29tIiwiZmFtaWx5X25hbWUiOiIiLCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9saXMiOnsicGVyc29uX3NvdXJjZWRpZCI6IjEyMzQiLCJjb3Vyc2Vfb2ZmZXJpbmdfc291cmNlZGlkIjoiTUFUSDEwMTAwMzIwMTZTIiwidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX19LCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9jb250ZXh0Ijp7ImlkIjoiYThhNzZmYjhmYmNjMmQwOTc4N2RhZmQyODU2NGUyZWNkYWI1MWYxMSIsInRpdGxlIjoiOHRoIEdyYWRlIE1hdGggLSBCYWxsIiwidHlwZSI6WyJodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9jb3Vyc2UjQ291cnNlT2ZmZXJpbmciXSwidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX0sImxhYmVsIjoiR3JhZGUgOCBNYXRoIn0sImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL2NsYWltL3Rvb2xfcGxhdGZvcm0iOnsiZ3VpZCI6IjRNUmN4bng2dlFiRlh4aExiODAwNW01V1hGTTJaMmk4bFF3aEoxUVQ6Y2FudmFzLWxtcyIsIm5hbWUiOiJBdG9taWMgSm9sdCIsInZlcnNpb24iOiJjbG91ZCIsInByb2R1Y3RfZmFtaWx5X2NvZGUiOiJjYW52YXMiLCJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL2NsYWltL2xhdW5jaF9wcmVzZW50YXRpb24iOnsiZG9jdW1lbnRfdGFyZ2V0IjoiaWZyYW1lIiwicmV0dXJuX3VybCI6Imh0dHBzOi8vYXRvbWljam9sdC5pbnN0cnVjdHVyZS5jb20vY291cnNlcy8yNTMvZXh0ZXJuYWxfY29udGVudC9zdWNjZXNzL2V4dGVybmFsX3Rvb2xfcmVkaXJlY3QiLCJsb2NhbGUiOiJlbiIsImhlaWdodCI6NDAwLCJ3aWR0aCI6ODAwLCJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImxvY2FsZSI6ImVuIiwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vcm9sZXMiOlsiaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvaW5zdGl0dXRpb24vcGVyc29uI0FkbWluaXN0cmF0b3IiLCJodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9pbnN0aXR1dGlvbi9wZXJzb24jSW5zdHJ1Y3RvciIsImh0dHA6Ly9wdXJsLmltc2dsb2JhbC5vcmcvdm9jYWIvbGlzL3YyL2luc3RpdHV0aW9uL3BlcnNvbiNTdHVkZW50IiwiaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvbWVtYmVyc2hpcCNJbnN0cnVjdG9yIiwiaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvbWVtYmVyc2hpcCNMZWFybmVyIiwiaHR0cDovL3B1cmwuaW1zZ2xvYmFsLm9yZy92b2NhYi9saXMvdjIvc3lzdGVtL3BlcnNvbiNVc2VyIl0sImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL2NsYWltL2N1c3RvbSI6eyJjYW52YXNfc2lzX2lkIjoiJENhbnZhcy51c2VyLnNpc2lkIiwiY2FudmFzX3VzZXJfaWQiOiIxIiwiY2FudmFzX2NvdXJzZV9pZCI6IjI1MyIsImNhbnZhc190ZXJtX25hbWUiOiJGYWxsIDIwMjIiLCJjYW52YXNfYWNjb3VudF9pZCI6IjY2IiwiY2FudmFzX2FwaV9kb21haW4iOiJhdG9taWNqb2x0Lmluc3RydWN0dXJlLmNvbSIsImNhbnZhc19zZWN0aW9uX2lkcyI6IjI0NyIsImNvbnRleHRfaWRfaGlzdG9yeSI6IiIsImNhbnZhc19hY2NvdW50X25hbWUiOiJqdXN0aW4iLCJjYW52YXNfYXNzaWdubWVudF9pZCI6IiRDYW52YXMuYXNzaWdubWVudC5pZCIsImNhbnZhc191c2VyX3RpbWV6b25lIjoiQW1lcmljYS9EZW52ZXIiLCJjYW52YXNfcm9vdF9hY2NvdW50X2lkIjoiMSJ9LCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9sdGkxMV9sZWdhY3lfdXNlcl9pZCI6IjAzNDBjZGUzNzYyNGMwNDk3OWE2YzNmZGQwYWZjMjQ3OWY4NDA1YWQiLCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9sdGkxcDEiOnsidXNlcl9pZCI6IjAzNDBjZGUzNzYyNGMwNDk3OWE2YzNmZGQwYWZjMjQ3OWY4NDA1YWQiLCJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImVycm9ycyI6eyJlcnJvcnMiOnt9fSwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGktYWdzL2NsYWltL2VuZHBvaW50Ijp7InNjb3BlIjpbImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpLWFncy9zY29wZS9saW5laXRlbSIsImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpLWFncy9zY29wZS9yZXN1bHQucmVhZG9ubHkiLCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1hZ3Mvc2NvcGUvc2NvcmUiLCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS1hZ3Mvc2NvcGUvbGluZWl0ZW0ucmVhZG9ubHkiXSwibGluZWl0ZW1zIjoiaHR0cHM6Ly9hdG9taWNqb2x0Lmluc3RydWN0dXJlLmNvbS9hcGkvbHRpL2NvdXJzZXMvMjUzL2xpbmVfaXRlbXMiLCJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpLW5ycHMvY2xhaW0vbmFtZXNyb2xlc2VydmljZSI6eyJjb250ZXh0X21lbWJlcnNoaXBzX3VybCI6Imh0dHBzOi8vYXRvbWljam9sdC5pbnN0cnVjdHVyZS5jb20vYXBpL2x0aS9jb3Vyc2VzLzI1My9uYW1lc19hbmRfcm9sZXMiLCJzZXJ2aWNlX3ZlcnNpb25zIjpbIjIuMCJdLCJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImh0dHBzOi8vd3d3Lmluc3RydWN0dXJlLmNvbS9wbGFjZW1lbnQiOiJjb3Vyc2VfbmF2aWdhdGlvbiJ9.vFK1vuSgSla4xu8aJKiTs1wPXBof5XC1imkpQAp859CF-zXYFkW3ox5ynEwCmurwMUUzRwvVO3jGx-cWNC-T7_fhF_n3t12yULqclYeET4IJ9C8GvQBD1yjpE1STrWtKnM8fO17JeWbu-_6V_wkTwmJb2-6X-zIrD-wPm-YTX897eBi9cuTFWbc5YcjqHKvCI0vWShEHi3yqbgGcIOP1tmChFI7LuATKRENG9fiRIgj5lDUlYYEUwvLLGvYSM_IJh2LYAGv0-s89Lk_e1qTU4u1G9bBKFa0NnW1JKU6Gb-R-uQzP4S-oZgtA6B_izEK3wHsHyjHngEyZM0OLYuSzdA";
    let extracted_iss = IdToken::extract_iss(id_token).unwrap();
    assert_eq!(extracted_iss, "https://lms.example.com");
  }
}
