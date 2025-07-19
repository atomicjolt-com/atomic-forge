use crate::db::Pool;
use crate::errors::DBError;
use crate::schema::oidc_states;
use crate::schema::oidc_states::dsl::{
  created_at as created_at_col, id as id_col, oidc_states as OIDCStatesDB, state as state_col,
};
use chrono::Utc;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Insertable, Queryable, Selectable)]
#[diesel(table_name = crate::schema::oidc_states)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct OIDCState {
  pub id: i64,
  pub state: String,
  pub nonce: String,
  pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable, PartialEq)]
#[diesel(table_name = oidc_states)]
pub struct NewOidcState<'a> {
  pub state: &'a str,
  pub nonce: &'a str,
  pub created_at: chrono::NaiveDateTime,
}

impl OIDCState {
  pub fn create(pool: &Pool, state: &str, nonce: &str) -> Result<OIDCState, DBError> {
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

    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let new_oidc_state = NewOidcState {
      state,
      nonce,
      created_at: Utc::now().naive_utc(),
    };

    let oidc_state: OIDCState = diesel::insert_into(oidc_states::table)
      .values(&new_oidc_state)
      .returning(OIDCState::as_returning())
      .get_result::<OIDCState>(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(oidc_state)
  }

  pub fn list(pool: &Pool, limit: i64) -> Result<Vec<OIDCState>, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let oidc_states_list: Vec<OIDCState> = OIDCStatesDB
      .select(OIDCState::as_select())
      .limit(limit)
      .order_by(created_at_col.desc())
      .load(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(oidc_states_list)
  }

  pub fn get(pool: &Pool, id: i64) -> Result<OIDCState, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let found: OIDCState = OIDCStatesDB
      .find(id)
      .first::<OIDCState>(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  pub fn find_by_state(pool: &Pool, state: &str) -> Result<OIDCState, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let found: OIDCState = OIDCStatesDB
      .filter(state_col.eq(state))
      .first::<OIDCState>(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(found)
  }

  pub fn destroy(pool: &Pool, id: i64) -> Result<usize, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let num_deleted = diesel::delete(OIDCStatesDB.filter(id_col.eq(id)))
      .execute(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(num_deleted)
  }

  pub fn destroy_by_state(pool: &Pool, state: &str) -> Result<usize, DBError> {
    let mut conn = pool
      .get()
      .map_err(|e| DBError::DBFailedToGetConnection(e.to_string()))?;

    let num_deleted = diesel::delete(OIDCStatesDB.filter(state_col.eq(state)))
      .execute(&mut conn)
      .map_err(|e| DBError::DBRequestFailed(e.to_string()))?;

    Ok(num_deleted)
  }
}

// TODO: Migrate tests to Axum
/*
#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::tests::get_pool;

  #[test]
  fn test_create() {
    let pool = get_pool();
    let state: String = "state".to_string();
    let nonce: String = "nonce".to_string();

    let num_deleted = OIDCState::destroy_by_state(&pool, &state);
    log::info!(
      "Deleted {:?} total OIDC States during cleanup.",
      num_deleted
    );

    let result = OIDCState::create(&pool, &state, &nonce);
    assert!(result.is_ok());

    let created_oidc_state = result.unwrap();

    assert_eq!(created_oidc_state.state, state);
  }

  #[test]
  fn test_find_by_id() {
    let pool = get_pool();
    let state: String = "state_for_by_id".to_string();
    let nonce: String = "nonce_for_by_id".to_string();
    let created_oidc_state = OIDCState::create(&pool, &state, &nonce).unwrap();
    let found_oidc_state = OIDCState::get(&pool, created_oidc_state.id).unwrap();

    OIDCState::destroy_by_state(&pool, &state)
      .expect("Failed to clean up OIDCState in test_find_by_id");
    assert_eq!(found_oidc_state.state, state);
    assert_eq!(found_oidc_state.nonce, nonce);
  }

  #[test]
  fn test_find_by_state() {
    let pool = get_pool();
    let state: String = "state_for_by_state".to_string();
    let nonce: String = "nonce_for_by_state".to_string();
    let created_oidc_state = OIDCState::create(&pool, &state, &nonce).unwrap();
    let found_oidc_state = OIDCState::find_by_state(&pool, &state).unwrap();

    OIDCState::destroy_by_state(&pool, &state)
      .expect("Failed to clean up OIDCState in test_find_by_state");
    assert_eq!(found_oidc_state.id, created_oidc_state.id);
    assert_eq!(found_oidc_state.nonce, nonce);
  }

  #[test]
  fn test_destroy() {
    let pool = get_pool();
    let state: String = "state_to_destroy".to_string();
    let nonce: String = "nonce".to_string();

    let created_oidc_state = OIDCState::create(&pool, &state, &nonce).unwrap();

    let num_deleted = OIDCState::destroy(&pool, created_oidc_state.id).unwrap();

    assert_eq!(num_deleted, 1);

    let found_oidc_state = OIDCState::get(&pool, created_oidc_state.id);
    assert!(found_oidc_state.is_err());
  }
}
*/
