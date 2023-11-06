use crate::errors::SecureError;
use openssl::rsa::Rsa;
use std::collections::HashMap;

pub trait KeyStore {
  // Get the current keys from the KeyStore ordered by latest
  fn get_current_keys(
    &self,
    limit: i64,
  ) -> Result<HashMap<String, Rsa<openssl::pkey::Private>>, SecureError>;

  // Get the key that is currently in use
  fn get_current_key(&self) -> Result<(String, Rsa<openssl::pkey::Private>), SecureError>;

  // Get a key by the kid
  fn get_key(&self, kid: &str) -> Result<Rsa<openssl::pkey::Private>, SecureError>;
}
