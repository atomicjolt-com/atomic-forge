use serde::{Deserialize, Serialize};

// These structures are used by other deep linking structures
// and reside here because they are shared

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Icon {
  pub url: String,
  pub width: Option<i32>,
  pub height: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Thumbnail {
  pub url: String,
  pub width: Option<i32>,
  pub height: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Embed {
  pub html: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Window {
  pub target_name: Option<String>,
  pub width: Option<i32>,
  pub height: Option<i32>,
  pub window_features: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Iframe {
  pub src: String,
  pub width: Option<i32>,
  pub height: Option<i32>,
}
