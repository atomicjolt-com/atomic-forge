use crate::errors::OIDCError;
use chrono::NaiveDateTime;

pub trait OIDCStateStore: Send + Sync {
  fn get_state(&self) -> String;
  fn get_nonce(&self) -> String;
  fn get_created_at(&self) -> NaiveDateTime;
  fn destroy(&self) -> Result<usize, OIDCError>;
}
