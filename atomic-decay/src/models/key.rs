use crate::errors::DBError;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
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
  pub async fn create(pool: &PgPool, key: &str) -> Result<Key, DBError> {
    if key.is_empty() {
      return Err(DBError::InvalidInput("Key cannot be empty".to_owned()));
    }

    let uuid = Uuid::new_v4().to_string();
    let now = Utc::now().naive_utc();

    let result = sqlx::query_as::<_, Key>(
      "INSERT INTO keys (uuid, key, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, uuid, key, created_at, updated_at",
    )
    .bind(uuid)
    .bind(key)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result)
  }

  pub async fn list(pool: &PgPool, limit: i64) -> Result<Vec<Key>, DBError> {
    let keys_list = sqlx::query_as::<_, Key>(
      "SELECT id, uuid, key, created_at, updated_at
       FROM keys
       ORDER BY created_at DESC
       LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(keys_list)
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn get(pool: &PgPool, key_id: i64) -> Result<Key, DBError> {
    let found = sqlx::query_as::<_, Key>(
      "SELECT id, uuid, key, created_at, updated_at
       FROM keys
       WHERE id = $1",
    )
    .bind(key_id)
    .fetch_one(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn find_by_id(pool: &PgPool, key_id: i64) -> Result<Option<Key>, DBError> {
    let key = sqlx::query_as::<_, Key>(
      "SELECT id, uuid, key, created_at, updated_at
       FROM keys
       WHERE id = $1",
    )
    .bind(key_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(key)
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn destroy(pool: &PgPool, key_id: i64) -> Result<u64, DBError> {
    let result = sqlx::query("DELETE FROM keys WHERE id = $1")
      .bind(key_id)
      .execute(pool)
      .await
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result.rows_affected())
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn destroy_all(pool: &PgPool) -> Result<u64, DBError> {
    let result = sqlx::query("DELETE FROM keys")
      .execute(pool)
      .await
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(result.rows_affected())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::test_helpers::setup_test_db;
  use atomic_lti::secure::generate_rsa_key_pair;
  use atomic_lti_test::helpers::JWK_PASSPHRASE;

  #[tokio::test]
  async fn test_create_key_success() {
    let pool = setup_test_db().await;
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();

    assert_eq!(key.key, pem_string);
    assert!(!key.uuid.is_empty());
    assert!(key.id > 0);
  }

  #[tokio::test]
  async fn test_create_key_empty_input() {
    let pool = setup_test_db().await;
    let result = Key::create(&pool, "").await;

    assert!(matches!(result, Err(DBError::InvalidInput(_))));
    if let Err(DBError::InvalidInput(msg)) = result {
      assert_eq!(msg, "Key cannot be empty");
    }
  }

  #[tokio::test]
  async fn test_get_key() {
    let pool = setup_test_db().await;
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let created_key = Key::create(&pool, &pem_string).await.unwrap();
    let found_key = Key::get(&pool, created_key.id).await.unwrap();

    assert_eq!(found_key.id, created_key.id);
    assert_eq!(found_key.uuid, created_key.uuid);
    assert_eq!(found_key.key, created_key.key);

    // Clean up
    Key::destroy(&pool, created_key.id).await.ok();
  }

  #[tokio::test]
  async fn test_get_key_not_found() {
    let pool = setup_test_db().await;

    let result = Key::get(&pool, 999999).await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_find_by_id_exists() {
    let pool = setup_test_db().await;
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let created_key = Key::create(&pool, &pem_string).await.unwrap();
    let found_key = Key::find_by_id(&pool, created_key.id).await.unwrap();

    assert!(found_key.is_some());
    let key = found_key.unwrap();
    assert_eq!(key.id, created_key.id);
    assert_eq!(key.key, created_key.key);

    // Clean up
    Key::destroy(&pool, created_key.id).await.ok();
  }

  #[tokio::test]
  async fn test_find_by_id_not_exists() {
    let pool = setup_test_db().await;

    let found_key = Key::find_by_id(&pool, 999999).await.unwrap();

    assert!(found_key.is_none());
  }

  #[tokio::test]
  async fn test_list_keys() {
    let pool = setup_test_db().await;

    // Clean up any existing keys first to ensure consistent state
    Key::destroy_all(&pool).await.ok();

    // Create multiple keys with a small delay to ensure different timestamps
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string).await.unwrap();
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();

    // Test listing with limit
    let keys = Key::list(&pool, 100).await.unwrap();

    assert_eq!(keys.len(), 2, "Should have exactly 2 keys");

    // Find our keys in the list
    let our_key1 = keys
      .iter()
      .find(|k| k.id == key1.id)
      .expect("key1 not found");
    let our_key2 = keys
      .iter()
      .find(|k| k.id == key2.id)
      .expect("key2 not found");

    // Since key2 was created after key1, it should have a higher ID
    assert!(
      our_key2.id > our_key1.id,
      "key2 should have higher id than key1"
    );

    // Clean up
    Key::destroy(&pool, key1.id).await.ok();
    Key::destroy(&pool, key2.id).await.ok();
  }

  #[tokio::test]
  async fn test_list_keys_with_limit() {
    let pool = setup_test_db().await;

    // Clean up any existing keys first to ensure consistent state
    Key::destroy_all(&pool).await.ok();

    // Create 3 keys
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string).await.unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();

    let (_, pem_string3) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key3 = Key::create(&pool, &pem_string3).await.unwrap();

    // Test with limit of 2
    let keys = Key::list(&pool, 2).await.unwrap();

    // The limit should be respected
    assert_eq!(keys.len(), 2);

    // Clean up
    Key::destroy(&pool, key1.id).await.ok();
    Key::destroy(&pool, key2.id).await.ok();
    Key::destroy(&pool, key3.id).await.ok();
  }

  #[tokio::test]
  async fn test_destroy_key() {
    let pool = setup_test_db().await;
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();
    let key_id = key.id;

    let rows_affected = Key::destroy(&pool, key_id).await.unwrap();
    assert_eq!(rows_affected, 1);

    // Verify the key is gone
    let result = Key::get(&pool, key_id).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_destroy_nonexistent_key() {
    let pool = setup_test_db().await;

    let rows_affected = Key::destroy(&pool, 999999).await.unwrap();

    assert_eq!(rows_affected, 0);
  }

  #[tokio::test]
  async fn test_destroy_all_keys() {
    let pool = setup_test_db().await;

    // Clean up any existing keys first to ensure consistent state
    Key::destroy_all(&pool).await.ok();

    // Create multiple keys
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let _key1 = Key::create(&pool, &pem_string).await.unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let _key2 = Key::create(&pool, &pem_string2).await.unwrap();

    let (_, pem_string3) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let _key3 = Key::create(&pool, &pem_string3).await.unwrap();

    // Verify we have 3 keys
    let keys_before = Key::list(&pool, 100).await.unwrap();
    assert_eq!(keys_before.len(), 3);

    // Destroy all keys
    let deleted_count = Key::destroy_all(&pool).await.unwrap();
    assert_eq!(deleted_count, 3);

    // Verify all keys are deleted
    let keys_after = Key::list(&pool, 100).await.unwrap();
    assert_eq!(keys_after.len(), 0);
  }

  #[tokio::test]
  async fn test_key_timestamps() {
    let pool = setup_test_db().await;

    let before_create = chrono::Utc::now().naive_utc();
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).await.unwrap();
    let after_create = chrono::Utc::now().naive_utc();

    // Verify timestamps are set correctly
    assert!(key.created_at >= before_create);
    assert!(key.created_at <= after_create);
    assert_eq!(key.created_at, key.updated_at);

    // Clean up
    Key::destroy(&pool, key.id).await.ok();
  }

  #[tokio::test]
  async fn test_uuid_uniqueness() {
    let pool = setup_test_db().await;

    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string).await.unwrap();

    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key2 = Key::create(&pool, &pem_string2).await.unwrap();

    assert_ne!(key1.uuid, key2.uuid);

    // Clean up
    Key::destroy(&pool, key1.id).await.ok();
    Key::destroy(&pool, key2.id).await.ok();
  }
}
