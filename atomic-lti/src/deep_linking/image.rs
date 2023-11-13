use super::shared::{Icon, Thumbnail};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Image {
  #[serde(rename = "type")]
  pub type_: String,
  pub url: String,
  pub title: Option<String>,
  pub text: Option<String>,
  pub icon: Option<Icon>,
  pub thumbnail: Option<Thumbnail>,
  pub width: Option<i32>,
  pub height: Option<i32>,
}
