use super::shared::{Icon, Iframe, Thumbnail, Window};
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CustomParameter {
  pub key: String,
  pub value: String,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LineItem {
  pub label: Option<String>,
  pub score_maximum: f32,
  pub resource_id: Option<String>,
  pub tag: Option<String>,
  pub grades_released: Option<bool>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DateTimeRange {
  pub start_date_time: Option<String>,
  pub end_date_time: Option<String>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LTIResourceLink {
  #[serde(rename = "type")]
  #[serde(default = "default_type")]
  pub type_: String,
  pub url: Option<String>,
  pub title: Option<String>,
  pub text: Option<String>,
  pub icon: Option<Icon>,
  pub thumbnail: Option<Thumbnail>,
  pub window: Option<Window>,
  pub iframe: Option<Iframe>,
  pub custom: Option<Vec<CustomParameter>>,
  pub line_item: Option<LineItem>,
  pub available: Option<DateTimeRange>,
  pub submission: Option<DateTimeRange>,
}

impl Default for LTIResourceLink {
  fn default() -> Self {
    Self {
      type_: "ltiResourceLink".to_string(),
      url: None,
      title: None,
      text: None,
      icon: None,
      thumbnail: None,
      window: None,
      iframe: None,
      custom: None,
      line_item: None,
      available: None,
      submission: None,
    }
  }
}

fn default_type() -> String {
  "ltiResourceLink".to_string()
}
