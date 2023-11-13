use super::shared::{Embed, Icon, Iframe, Thumbnail, Window};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Link {
  #[serde(rename = "type")]
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
