use self::html_fragment::HtmlFragment;
use self::image::Image;
use self::link::Link;
use self::lti_resource_link::LTIResourceLink;
use crate::deep_linking::file::File;
use crate::errors::SecureError;
use crate::jwt;
use crate::{
  lti_definitions::{DEEP_LINKING_VERSION, LTI_DEEP_LINKING_RESPONSE},
  secure::generate_secure_string,
};
use chrono::{Duration, Utc};
use openssl::rsa::Rsa;
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

pub mod file;
pub mod html_fragment;
pub mod image;
pub mod link;
pub mod lti_resource_link;
pub mod shared;

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(tag = "type")]
pub enum ContentItem {
  #[serde(rename = "file")]
  #[serde(alias = "file", alias = "File", alias = "FILE")]
  File(File),
  #[serde(rename = "html")]
  #[serde(alias = "html", alias = "Html", alias = "HTML")]
  HtmlFragment(HtmlFragment),
  #[serde(rename = "image")]
  #[serde(alias = "image", alias = "Image")]
  Image(Image),
  #[serde(rename = "link")]
  #[serde(alias = "link", alias = "Link")]
  Link(Link),
  #[serde(rename = "ltiResourceLink")]
  #[serde(
    alias = "ltiResourceLink",
    alias = "ltiresourcelink",
    alias = "LtiResourceLink"
  )]
  LTIResourceLink(LTIResourceLink),
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DeepLinkPayload {
  pub iss: String, // client_id
  pub aud: String, // iss from id token
  pub azp: String, // client_id
  pub exp: i64,
  pub iat: i64,
  pub nonce: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/message_type")]
  pub message_type: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/version")]
  pub version: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/deployment_id")]
  pub deployment_id: String,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-dl/claim/content_items")]
  pub content_items: Vec<ContentItem>,
  #[serde(rename = "https://purl.imsglobal.org/spec/lti-dl/claim/data")]
  pub data: Option<String>,
}

impl DeepLinkPayload {
  // client_id -The LTI tool's client_id as provided by the platform
  // iss - iss from id token
  // deployment_id - The deployment_id from the id token
  // content_items - A list of ContentItem objects to be returned to the platform
  // deep_link_claim_data - The https://purl.imsglobal.org/spec/lti-dl/claim/data
  //                        value must match the value of the data property of the
  //                        https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings
  //                        claim from the LtiDeepLinkinkingRequest message.
  //                        This claim is required if present in LtiDeepLinkingRequest message.
  pub fn new(
    client_id: &str,
    iss: &str,
    deployment_id: &str,
    content_items: Vec<ContentItem>,
    deep_link_claim_data: Option<String>,
  ) -> Self {
    let now = Utc::now().timestamp();
    let nonce: String = generate_secure_string(32);

    DeepLinkPayload {
      iss: client_id.to_string(),
      aud: iss.to_string(),
      azp: client_id.to_string(),
      exp: (Utc::now() + Duration::minutes(5)).timestamp(),
      iat: now,
      nonce,
      message_type: LTI_DEEP_LINKING_RESPONSE.to_string(),
      version: DEEP_LINKING_VERSION.to_string(),
      deployment_id: deployment_id.to_string(),
      content_items,
      data: deep_link_claim_data,
    }
  }
}
pub struct DeepLinking;

impl DeepLinking {
  pub fn create_deep_link_jwt(
    client_id: &str,
    iss: &str,
    deployment_id: &str,
    content_items: &[ContentItem],
    deep_link_claim_data: Option<String>,
    kid: &str,
    rsa_key_pair: Rsa<openssl::pkey::Private>,
  ) -> Result<String, SecureError> {
    let payload = DeepLinkPayload::new(
      client_id,
      iss,
      deployment_id,
      content_items.to_owned(),
      deep_link_claim_data,
    );

    // Encode the ID Token using the private key
    jwt::encode(&payload, kid, rsa_key_pair)
  }
}
