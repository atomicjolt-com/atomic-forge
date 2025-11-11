use crate::{errors::SecureError, id_token::IdToken};
use async_trait::async_trait;

#[async_trait]
pub trait JwtStore: Send + Sync {
  /// Given an id_token build a JWT to be sent to the client
  async fn build_jwt(&self, id_token: &IdToken) -> Result<String, SecureError>;
}
