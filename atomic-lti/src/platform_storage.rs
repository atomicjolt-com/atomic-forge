use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct LTIStorageParams {
  pub target: String,
  #[serde(rename = "platformOIDCUrl")]
  pub platform_oidc_url: String,
}

impl Default for LTIStorageParams {
  fn default() -> Self {
    Self {
      target: "".to_string(),
      platform_oidc_url: "".to_string(),
    }
  }
}
