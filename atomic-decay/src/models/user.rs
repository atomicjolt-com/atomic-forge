use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
  pub id: i32,
  pub uuid: Uuid,
  pub tenant_id: i32,
  pub lti_user_id: String,
  pub email: Option<String>,
  pub name: Option<String>,
  pub roles: Option<JsonValue>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl User {
  pub async fn find_by_tenant_and_lti_user(
    pool: &sqlx::PgPool,
    tenant_id: i32,
    lti_user_id: &str,
  ) -> Result<Option<Self>, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      SELECT id, uuid, tenant_id, lti_user_id, email, name, roles, created_at, updated_at
      FROM users
      WHERE tenant_id = $1 AND lti_user_id = $2
      "#,
      tenant_id,
      lti_user_id
    )
    .fetch_optional(pool)
    .await
  }

  pub async fn create(
    pool: &sqlx::PgPool,
    tenant_id: i32,
    lti_user_id: &str,
    email: Option<&str>,
    name: Option<&str>,
    roles: Option<&JsonValue>,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      INSERT INTO users (tenant_id, lti_user_id, email, name, roles)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, uuid, tenant_id, lti_user_id, email, name, roles, created_at, updated_at
      "#,
      tenant_id,
      lti_user_id,
      email,
      name,
      roles
    )
    .fetch_one(pool)
    .await
  }

  pub async fn update(
    &self,
    pool: &sqlx::PgPool,
    email: Option<&str>,
    name: Option<&str>,
    roles: Option<&JsonValue>,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      UPDATE users
      SET email = $2, name = $3, roles = $4, updated_at = NOW()
      WHERE id = $1
      RETURNING id, uuid, tenant_id, lti_user_id, email, name, roles, created_at, updated_at
      "#,
      self.id,
      email,
      name,
      roles
    )
    .fetch_one(pool)
    .await
  }
}
