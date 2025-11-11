use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use std::collections::HashMap;

use crate::{
  errors::DynamicRegistrationError,
  lti_definitions::{LTI_DEEP_LINKING_REQUEST, LTI_RESOURCE_LINK_REQUEST},
};

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
  pub supported_types: Option<Vec<String>>,
  pub supported_media_types: Option<Vec<String>>,
}

impl LtiMessage {
  pub fn builder() -> LtiMessageBuilder {
    LtiMessageBuilder::default()
  }
}

pub struct LtiMessageBuilder {
  base_url: Option<String>,
  launch_path: Option<String>,
  message_type: String,
  label: Option<String>,
  icon_path: Option<String>,
  custom_parameters: Option<HashMap<String, String>>,
  placements: Option<Vec<String>>,
  roles: Option<Vec<String>>,
  supported_types: Option<Vec<String>>,
  supported_media_types: Option<Vec<String>>,
}

impl LtiMessageBuilder {
  pub fn base_url(mut self, base_url: &str) -> Self {
    self.base_url = Some(base_url.to_string());
    self
  }

  pub fn launch_path(mut self, launch_path: &str) -> Self {
    self.launch_path = Some(launch_path.to_string());
    self
  }

  pub fn message_type(mut self, message_type: &str) -> Self {
    self.message_type = message_type.to_string();
    self
  }

  pub fn label(mut self, label: &str) -> Self {
    self.label = Some(label.to_string());
    self
  }

  pub fn icon_path(mut self, icon_path: &str) -> Self {
    self.icon_path = Some(icon_path.to_string());
    self
  }

  pub fn custom_parameters(mut self, custom_parameters: HashMap<String, String>) -> Self {
    self.custom_parameters = Some(custom_parameters);
    self
  }

  pub fn add_placement(mut self, placement: &str) -> Self {
    if let Some(ref mut placements) = self.placements {
      placements.push(placement.to_string());
    } else {
      self.placements = Some(vec![placement.to_string()]);
    }
    self
  }

  pub fn roles(mut self, roles: Vec<String>) -> Self {
    if self.roles.is_some() {
      roles.iter().for_each(|role| {
        if !self.roles.as_ref().unwrap().contains(role) {
          self.roles.as_mut().unwrap().push(role.to_string());
        }
      });
    } else {
      self.roles = Some(roles);
    }
    self
  }

  pub fn supported_types(mut self, supported_types: Vec<String>) -> Self {
    self.supported_types = Some(supported_types);
    self
  }

  pub fn supported_media_types(mut self, supported_media_types: Vec<String>) -> Self {
    self.supported_media_types = Some(supported_media_types);
    self
  }

  pub fn set_deep_linking_message_type(mut self) -> Self {
    self.message_type = LTI_DEEP_LINKING_REQUEST.to_string();
    self
  }

  // This method adds the default placements for the deep link message based on the product family code.
  // For now it only supports canvas and Brightspace.
  pub fn add_deep_link_placements(mut self, product_family_code: &str) -> Self {
    let placements_to_add = if product_family_code == "canvas" {
      vec!["editor_button".to_string()]
    } else if product_family_code == "desire2learn" {
      vec!["RichTextEditor".to_string(), "ContentArea".to_string()]
    } else {
      // TODO add placements for other platforms. This is a total guess.
      vec!["ContentArea".to_string()]
    };

    if let Some(ref mut placements) = self.placements {
      placements.extend(placements_to_add);
    } else {
      self.placements = Some(placements_to_add);
    }

    self
  }

  pub fn add_course_navigation_placement(mut self, product_family_code: &str) -> Self {
    if product_family_code == "canvas" {
      if let Some(ref mut placements) = self.placements {
        placements.push("course_navigation".to_string());
      } else {
        self.placements = Some(vec!["course_navigation".to_string()]);
      }
    }
    self
  }

  fn target_link_uri(&self) -> Option<String> {
    if self.base_url.is_some() && self.launch_path.is_some() {
      return Some(format!(
        "{}/{}",
        self.base_url.as_ref().unwrap(),
        self.launch_path.as_ref().unwrap()
      ));
    }

    None
  }

  fn icon_url(&self) -> Option<String> {
    if self.base_url.is_some() && self.icon_path.is_some() {
      return Some(format!(
        "{}/{}",
        self.base_url.as_ref().unwrap(),
        self.icon_path.as_ref().unwrap()
      ));
    }

    None
  }

  pub fn build(self) -> Result<LtiMessage, DynamicRegistrationError> {
    if self.message_type.is_empty() {
      return Err(DynamicRegistrationError::InvalidConfig(
        "message_type must be set when building an LtiMessage".to_string(),
      ));
    }

    let icon_uri = self.icon_url();
    let target_link_uri = self.target_link_uri();

    Ok(LtiMessage {
      message_type: self.message_type,
      target_link_uri,
      label: self.label,
      icon_uri,
      custom_parameters: self.custom_parameters,
      placements: self.placements,
      roles: self.roles,
      supported_types: self.supported_types,
      supported_media_types: self.supported_media_types,
    })
  }
}

impl Default for LtiMessageBuilder {
  fn default() -> Self {
    LtiMessageBuilder {
      base_url: None,
      launch_path: None,
      message_type: LTI_RESOURCE_LINK_REQUEST.to_string(),
      label: None,
      icon_path: None,
      custom_parameters: None,
      placements: None,
      roles: None,
      supported_types: None,
      supported_media_types: None,
    }
  }
}
