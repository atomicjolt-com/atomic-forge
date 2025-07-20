use crate::db::Pool;
use crate::errors::DBError;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OIDCState {
  pub id: i64,
  pub state: String,
  pub nonce: String,
  pub created_at: chrono::NaiveDateTime,
}

impl OIDCState {
  pub async fn create(pool: &Pool, state: &str, nonce: &str) -> Result<OIDCState, DBError> {
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

    let result = sqlx::query_as!(
      OIDCState,
      r#"
      INSERT INTO oidc_states (state, nonce, created_at)
      VALUES ($1, $2, $3)
      RETURNING id, state, nonce, created_at
      "#,
      state,
      nonce,
      now
    )
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result)
  }

  pub async fn list(pool: &Pool, limit: i64) -> Result<Vec<OIDCState>, DBError> {
    let oidc_states_list = sqlx::query_as!(
      OIDCState,
      r#"
      SELECT id, state, nonce, created_at
      FROM oidc_states
      ORDER BY created_at DESC
      LIMIT $1
      "#,
      limit
    )
    .fetch_all(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(oidc_states_list)
  }

  pub async fn get(pool: &Pool, id: i64) -> Result<OIDCState, DBError> {
    let found = sqlx::query_as!(
      OIDCState,
      r#"
      SELECT id, state, nonce, created_at
      FROM oidc_states
      WHERE id = $1
      "#,
      id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  pub async fn find_by_state(pool: &Pool, state: &str) -> Result<OIDCState, DBError> {
    let found = sqlx::query_as!(
      OIDCState,
      r#"
      SELECT id, state, nonce, created_at
      FROM oidc_states
      WHERE state = $1
      "#,
      state
    )
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  pub async fn destroy(pool: &Pool, id: i64) -> Result<u64, DBError> {
    let result = sqlx::query!(
      r#"
      DELETE FROM oidc_states
      WHERE id = $1
      "#,
      id
    )
    .execute(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result.rows_affected())
  }

  pub async fn destroy_by_state(pool: &Pool, state: &str) -> Result<u64, DBError> {
    let result = sqlx::query!(
      r#"
      DELETE FROM oidc_states
      WHERE state = $1
      "#,
      state
    )
    .execute(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result.rows_affected())
  }
}

// TODO: Migrate tests to Axum
/*
#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::tests::get_pool;

  #[tokio::test]
  async fn test_create() {
    let pool = get_pool().await;
    let state: String = "state".to_string();
    let nonce: String = "nonce".to_string();

    let num_deleted = OIDCState::destroy_by_state(&pool, &state).await;
    log::info!(
      "Deleted {:?} total OIDC States during cleanup.",
      num_deleted
    );

    let result = OIDCState::create(&pool, &state, &nonce).await;
    assert!(result.is_ok());

    let created_oidc_state = result.unwrap();

    assert_eq!(created_oidc_state.state, state);
  }

  #[tokio::test]
  async fn test_find_by_id() {
    let pool = get_pool().await;
    let state: String = "state_for_by_id".to_string();
    let nonce: String = "nonce_for_by_id".to_string();
    let created_oidc_state = OIDCState::create(&pool, &state, &nonce).await.unwrap();
    let found_oidc_state = OIDCState::get(&pool, created_oidc_state.id).await.unwrap();

    OIDCState::destroy_by_state(&pool, &state).await
      .expect("Failed to clean up OIDCState in test_find_by_id");
    assert_eq!(found_oidc_state.state, state);
    assert_eq!(found_oidc_state.nonce, nonce);
  }

  #[tokio::test]
  async fn test_find_by_state() {
    let pool = get_pool().await;
    let state: String = "state_for_by_state".to_string();
    let nonce: String = "nonce_for_by_state".to_string();
    let created_oidc_state = OIDCState::create(&pool, &state, &nonce).await.unwrap();
    let found_oidc_state = OIDCState::find_by_state(&pool, &state).await.unwrap();

    OIDCState::destroy_by_state(&pool, &state).await
      .expect("Failed to clean up OIDCState in test_find_by_state");
    assert_eq!(found_oidc_state.id, created_oidc_state.id);
    assert_eq!(found_oidc_state.nonce, nonce);
  }

  #[tokio::test]
  async fn test_destroy() {
    let pool = get_pool().await;
    let state: String = "state_to_destroy".to_string();
    let nonce: String = "nonce".to_string();

    let created_oidc_state = OIDCState::create(&pool, &state, &nonce).await.unwrap();

    let num_deleted = OIDCState::destroy(&pool, created_oidc_state.id).await.unwrap();

    assert_eq!(num_deleted, 1);

    let found_oidc_state = OIDCState::get(&pool, created_oidc_state.id).await;
    assert!(found_oidc_state.is_err());
  }
}
*/