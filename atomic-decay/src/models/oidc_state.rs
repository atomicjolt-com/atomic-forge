use crate::errors::DBError;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OIDCState {
  pub id: i64,
  pub state: String,
  pub nonce: String,
  pub created_at: chrono::NaiveDateTime,
}

impl OIDCState {
  pub async fn create(pool: &PgPool, state: &str, nonce: &str) -> Result<OIDCState, DBError> {
    if state.is_empty() {
      return Err(DBError::InvalidInput(
        "OIDCState state cannot be empty".to_string(),
      ));
    }

    if nonce.is_empty() {
      return Err(DBError::InvalidInput(
        "OIDCState nonce cannot be empty".to_string(),
      ));
    }

    let now = Utc::now().naive_utc();

    let result = sqlx::query_as::<_, OIDCState>(
      "INSERT INTO oidc_states (state, nonce, created_at)
        VALUES ($1, $2, $3)
        RETURNING id, state, nonce, created_at",
    )
    .bind(state)
    .bind(nonce)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result)
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn list(pool: &PgPool, limit: i64) -> Result<Vec<OIDCState>, DBError> {
    let oidc_states_list = sqlx::query_as::<_, OIDCState>(
      "SELECT id, state, nonce, created_at
        FROM oidc_states
        ORDER BY created_at DESC
        LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(oidc_states_list)
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn get(pool: &PgPool, id: i64) -> Result<OIDCState, DBError> {
    let found = sqlx::query_as::<_, OIDCState>(
      "SELECT id, state, nonce, created_at
        FROM oidc_states
        WHERE id = $1",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  pub async fn find_by_state(pool: &PgPool, state: &str) -> Result<OIDCState, DBError> {
    let found = sqlx::query_as::<_, OIDCState>(
      "SELECT id, state, nonce, created_at
        FROM oidc_states
        WHERE state = $1",
    )
    .bind(state)
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn find_by_id(pool: &PgPool, id: i64) -> Result<Option<OIDCState>, DBError> {
    let oidc_state = sqlx::query_as::<_, OIDCState>(
      "SELECT id, state, nonce, created_at
        FROM oidc_states
        WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(oidc_state)
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn find_by_state_optional(
    pool: &PgPool,
    state: &str,
  ) -> Result<Option<OIDCState>, DBError> {
    let oidc_state = sqlx::query_as::<_, OIDCState>(
      "SELECT id, state, nonce, created_at
        FROM oidc_states
        WHERE state = $1",
    )
    .bind(state)
    .fetch_optional(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(oidc_state)
  }

  pub async fn destroy(pool: &PgPool, id: i64) -> Result<u64, DBError> {
    let result = sqlx::query("DELETE FROM oidc_states WHERE id = $1")
      .bind(id)
      .execute(pool)
      .await
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result.rows_affected())
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn destroy_by_state(pool: &PgPool, state: &str) -> Result<u64, DBError> {
    let result = sqlx::query("DELETE FROM oidc_states WHERE state = $1")
      .bind(state)
      .execute(pool)
      .await
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result.rows_affected())
  }
}
