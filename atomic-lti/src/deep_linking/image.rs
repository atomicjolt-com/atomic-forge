use super::shared::{Icon, Thumbnail};
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Image {
  #[serde(rename = "type")]
  #[serde(default = "default_type")]
  pub type_: String,
  pub url: String,
  pub title: Option<String>,
  pub text: Option<String>,
  pub icon: Option<Icon>,
  pub thumbnail: Option<Thumbnail>,
  pub width: Option<i32>,
  pub height: Option<i32>,
}

impl Default for Image {
  fn default() -> Self {
    Self {
      type_: "image".to_string(),
      url: "".to_string(),
      title: None,
      text: None,
      icon: None,
      thumbnail: None,
      width: None,
      height: None,
    }
  }
}

fn default_type() -> String {
  "image".to_string()
}
