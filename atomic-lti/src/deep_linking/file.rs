use super::shared::{Icon, Thumbnail};
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct File {
  #[serde(rename = "type")]
  #[serde(default = "default_type")]
  pub type_: String,
  pub url: String,
  pub title: Option<String>,
  pub text: Option<String>,
  pub icon: Option<Icon>,
  pub thumbnail: Option<Thumbnail>,
  pub expires_at: Option<String>,
}

impl Default for File {
  fn default() -> Self {
    Self {
      type_: "file".to_string(),
      url: "".to_string(),
      title: None,
      text: None,
      icon: None,
      thumbnail: None,
      expires_at: None,
    }
  }
}

fn default_type() -> String {
  "file".to_string()
}
