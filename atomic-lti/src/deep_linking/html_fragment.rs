use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HTMLFragment {
  #[serde(rename = "type")]
  pub type_: String,
  pub html: String,
  pub title: Option<String>,
  pub text: Option<String>,
}
