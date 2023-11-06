use crate::{errors::SecureError, id_token::IdToken};

pub trait JwtStore {
  // Given an id_token build a JWT to be sent to the client
  fn build_jwt(&self, id_token: &IdToken) -> Result<String, SecureError>;
}
