use crate::errors::PlatformError;

pub trait PlatformStore: Send + Sync {
  fn get_oidc_url(&self) -> Result<String, PlatformError>;
  fn get_jwk_server_url(&self) -> Result<String, PlatformError>;
  fn get_token_url(&self) -> Result<String, PlatformError>;
}
