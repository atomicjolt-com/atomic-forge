use crate::errors::PlatformError;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformData {
  pub issuer: String,
  pub name: Option<String>,
  pub jwks_url: String,
  pub token_url: String,
  pub oidc_url: String,
}

#[async_trait]
pub trait PlatformStore: Send + Sync {
  async fn get_oidc_url(&self) -> Result<String, PlatformError>;
  async fn get_jwk_server_url(&self) -> Result<String, PlatformError>;
  async fn get_token_url(&self) -> Result<String, PlatformError>;

  async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError>;
  async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError>;
  async fn update(
    &self,
    issuer: &str,
    platform: PlatformData,
  ) -> Result<PlatformData, PlatformError>;
  async fn delete(&self, issuer: &str) -> Result<(), PlatformError>;
  async fn list(&self) -> Result<Vec<PlatformData>, PlatformError>;
}
