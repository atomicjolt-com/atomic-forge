use super::shared::{Icon, Thumbnail};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct File {
  #[serde(rename = "type")]
  pub type_: String,
  pub url: String,
  pub title: Option<String>,
  pub text: Option<String>,
  pub icon: Option<Icon>,
  pub thumbnail: Option<Thumbnail>,
  pub expires_at: Option<String>,
}
