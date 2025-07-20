use crate::db::Pool;
use crate::errors::DBError;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, PartialEq)]
pub struct Key {
  pub id: i64,
  pub uuid: String,
  pub key: String,
  pub updated_at: chrono::NaiveDateTime,
  pub created_at: chrono::NaiveDateTime,
}

impl Key {
  pub async fn create(pool: &Pool, key: &str) -> Result<Key, DBError> {
    if key.is_empty() {
      return Err(DBError::InvalidInput("Key cannot be empty".to_owned()));
    }

    let uuid = Uuid::new_v4().to_string();
    let now = Utc::now().naive_utc();

    let result = sqlx::query_as!(
      Key,
      r#"
      INSERT INTO keys (uuid, key, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, uuid, key, created_at, updated_at
      "#,
      uuid,
      key,
      now,
      now
    )
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result)
  }

  pub async fn list(pool: &Pool, limit: i64) -> Result<Vec<Key>, DBError> {
    let keys_list = sqlx::query_as!(
      Key,
      r#"
      SELECT id, uuid, key, created_at, updated_at
      FROM keys
      ORDER BY created_at DESC
      LIMIT $1
      "#,
      limit
    )
    .fetch_all(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(keys_list)
  }

  pub async fn get(pool: &Pool, key_id: i64) -> Result<Key, DBError> {
    let found = sqlx::query_as!(
      Key,
      r#"
      SELECT id, uuid, key, created_at, updated_at
      FROM keys
      WHERE id = $1
      "#,
      key_id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  pub async fn destroy(pool: &Pool, key_id: i64) -> Result<u64, DBError> {
    let result = sqlx::query!(
      r#"
      DELETE FROM keys
      WHERE id = $1
      "#,
      key_id
    )
    .execute(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result.rows_affected())
  }

  pub async fn destroy_all(pool: &Pool) -> Result<u64, DBError> {
    let result = sqlx::query!(
      r#"
      DELETE FROM keys
      "#
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
  use atomic_lti::secure::generate_rsa_key_pair;
  use atomic_lti_test::helpers::JWK_PASSPHRASE;

  #[tokio::test]
  async fn test_create_get_destroy() {
    let pool = get_pool().await;
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.expect("Failed to create key in create key test");

    let found_key = Key::get(&pool, key.id).await.expect("Failed to get key");
    assert_eq!(found_key.key, pem_string);

    Key::destroy(&pool, key.id).await.expect("Failed to destroy key");
    assert_eq!(key.key, pem_string);
  }

  #[tokio::test]
  async fn test_list() {
    let pool = get_pool().await;
    let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string1).await.expect("Failed to create key in create key test");
    let key2 = Key::create(&pool, &pem_string2).await.expect("Failed to create key in create key test");

    let keys_list = Key::list(&pool, 10).await.expect("Failed to list keys");

    assert!(keys_list.len() >= 2);

    let found_key1 = Key::get(&pool, key1.id).await.expect("Failed to get key1");
    assert_eq!(found_key1.key, pem_string1);

    let found_key2 = Key::get(&pool, key2.id).await.expect("Failed to get key2");
    assert_eq!(found_key2.key, pem_string2);

    Key::destroy(&pool, key1.id).await.expect("Failed to destroy key1");
    Key::destroy(&pool, key2.id).await.expect("Failed to destroy key2");
  }
}
*/