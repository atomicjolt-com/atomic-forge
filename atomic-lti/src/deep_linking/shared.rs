use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

// These structures are used by other deep linking structures
// and reside here because they are shared

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Icon {
  pub url: String,
  pub width: Option<i32>,
  pub height: Option<i32>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Thumbnail {
  pub url: String,
  pub width: Option<i32>,
  pub height: Option<i32>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Embed {
  pub html: String,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Window {
  pub target_name: Option<String>,
  pub width: Option<i32>,
  pub height: Option<i32>,
  pub window_features: Option<String>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Iframe {
  pub src: String,
  pub width: Option<i32>,
  pub height: Option<i32>,
}
