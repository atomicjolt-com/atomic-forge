use crate::db::Pool;
use crate::errors::DBError;
use crate::schema::keys;
use crate::schema::keys::dsl::{created_at, id, keys as KeysDB};
use chrono::Utc;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Insertable, Queryable, Selectable, PartialEq)]
#[diesel(table_name = crate::schema::keys)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Key {
  pub id: i64,
  pub key: String,
  pub updated_at: chrono::NaiveDateTime,
  pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable, PartialEq)]
#[diesel(table_name = keys)]
pub struct NewKey<'a> {
  pub key: &'a str,
  pub updated_at: chrono::NaiveDateTime,
  pub created_at: chrono::NaiveDateTime,
}

impl Key {
  pub fn create(pool: &Pool, key: &str) -> Result<Key, DBError> {
    if key.is_empty() {
      return Err(DBError::InvalidInput("Key cannot be empty".to_owned()));
    }

    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let new_key = NewKey {
      key,
      created_at: Utc::now().naive_utc(),
      updated_at: Utc::now().naive_utc(),
    };

    let key: Key = diesel::insert_into(keys::table)
      .values(&new_key)
      .returning(Key::as_returning())
      .get_result::<Key>(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(key)
  }

  pub fn list(pool: &Pool, limit: i64) -> Result<Vec<Key>, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let keys_list: Vec<Key> = KeysDB
      .select(Key::as_select())
      .limit(limit)
      .order_by(created_at.desc())
      .load(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(keys_list)
  }

  pub fn get(pool: &Pool, key_id: i64) -> Result<Key, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let found: Key = KeysDB
      .find(key_id)
      .first::<Key>(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  pub fn destroy(pool: &Pool, key_id: i64) -> Result<usize, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let num_deleted = diesel::delete(KeysDB.filter(id.eq(key_id)))
      .execute(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(num_deleted)
  }

  pub fn destroy_all(pool: &Pool) -> Result<usize, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let num_deleted = diesel::delete(KeysDB)
      .execute(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(num_deleted)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::tests::{get_pool, JWK_PASSPHRASE};
  use atomic_lti::secure::generate_rsa_key_pair;

  #[test]
  fn test_create_get_destroy() {
    let pool = get_pool();
    let (_, pem_string) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key = Key::create(&pool, &pem_string).expect("Failed to create key in create key test");

    let found_key = Key::get(&pool, key.id).expect("Failed to get key");
    assert_eq!(found_key.key, pem_string);

    Key::destroy(&pool, key.id).expect("Failed to destroy key");
    assert_eq!(key.key, pem_string);
  }

  #[test]
  fn test_list() {
    let pool = get_pool();
    let (_, pem_string1) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let (_, pem_string2) = generate_rsa_key_pair(JWK_PASSPHRASE).unwrap();
    let key1 = Key::create(&pool, &pem_string1).expect("Failed to create key in create key test");
    let key2 = Key::create(&pool, &pem_string2).expect("Failed to create key in create key test");

    let keys_list = Key::list(&pool, 10).expect("Failed to list keys");

    assert!(keys_list.len() >= 2);

    let found_key1 = Key::get(&pool, key1.id).expect("Failed to get key1");
    assert_eq!(found_key1.key, pem_string1);

    let found_key2 = Key::get(&pool, key2.id).expect("Failed to get key2");
    assert_eq!(found_key2.key, pem_string2);

    Key::destroy(&pool, key1.id).expect("Failed to destroy key1");
    Key::destroy(&pool, key2.id).expect("Failed to destroy key2");
  }
}
