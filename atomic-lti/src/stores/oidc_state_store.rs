use crate::errors::OIDCError;
use async_trait::async_trait;
use chrono::NaiveDateTime;

#[async_trait]
pub trait OIDCStateStore: Send + Sync {
  async fn get_state(&self) -> String;
  async fn get_nonce(&self) -> String;
  async fn get_created_at(&self) -> NaiveDateTime;
  async fn destroy(&self) -> Result<usize, OIDCError>;
}

