use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HtmlFragment {
  #[serde(rename = "type")]
  #[serde(default = "default_type")]
  pub type_: String,
  pub html: String,
  pub title: Option<String>,
  pub text: Option<String>,
}

impl Default for HtmlFragment {
  fn default() -> Self {
    Self {
      type_: "html".to_string(),
      html: "".to_string(),
      title: None,
      text: None,
    }
  }
}

fn default_type() -> String {
  "html".to_string()
}
