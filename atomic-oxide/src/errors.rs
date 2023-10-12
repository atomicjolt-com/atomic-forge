use serde::{Deserialize, Serialize};
use thiserror::Error;

//
// DB errors
//
#[derive(Error, Debug, PartialEq, Clone, Deserialize, Serialize)]
pub enum DBError {
  #[error("Unable to connect to database. {0}")]
  DBConnectFailed(String),

  #[error("Unable to get a database connection from the pool. {0}")]
  DBFailedToGetConnection(String),

  #[error("Database request failed. {0}")]
  DBRequestFailed(String),

  #[error("Error creating record. Invalid input. {0}")]
  InvalidInput(String),
}
