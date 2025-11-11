use crate::errors::SecureError;
use async_trait::async_trait;
use openssl::rsa::Rsa;
use std::collections::HashMap;

#[async_trait]
pub trait KeyStore: Send + Sync {
  /// Get the current keys from the KeyStore ordered by latest
  async fn get_current_keys(
    &self,
    limit: i64,
  ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError>;

  /// Get the key that is currently in use
  async fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError>;

  /// Get a key by the kid
  async fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError>;
}
