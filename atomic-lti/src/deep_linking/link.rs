use super::shared::{Embed, Icon, Iframe, Thumbnail, Window};
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Link {
  #[serde(rename = "type")]
  #[serde(default = "default_type")]
  pub type_: String,
  pub url: String,
  pub title: Option<String>,
  pub text: Option<String>,
  pub icon: Option<Icon>,
  pub thumbnail: Option<Thumbnail>,
  pub embed: Option<Embed>,
  pub window: Option<Window>,
  pub iframe: Option<Iframe>,
}

impl Default for Link {
  fn default() -> Self {
    Self {
      type_: "link".to_string(),
      url: "".to_string(),
      title: None,
      text: None,
      icon: None,
      thumbnail: None,
      embed: None,
      window: None,
      iframe: None,
    }
  }
}

fn default_type() -> String {
  "link".to_string()
}
