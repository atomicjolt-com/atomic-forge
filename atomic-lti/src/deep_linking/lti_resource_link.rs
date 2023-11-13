use super::shared::{Icon, Iframe, Thumbnail, Window};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CustomParameter {
  pub key: String,
  pub value: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LineItem {
  pub label: Option<String>,
  pub score_maximum: f32,
  pub resource_id: Option<String>,
  pub tag: Option<String>,
  pub grades_released: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DateTimeRange {
  pub start_date_time: Option<String>,
  pub end_date_time: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LTIResourceLink {
  #[serde(rename = "type")]
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
