use crate::errors::PlatformError;
use async_trait::async_trait;

#[async_trait]
pub trait PlatformStore: Send + Sync {
  async fn get_oidc_url(&self) -> Result<String, PlatformError>;
  async fn get_jwk_server_url(&self) -> Result<String, PlatformError>;
  async fn get_token_url(&self) -> Result<String, PlatformError>;
}
