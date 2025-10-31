use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Course {
  pub id: i32,
  pub uuid: Uuid,
  pub tenant_id: i32,
  pub lti_context_id: String,
  pub title: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl Course {
  pub async fn find_by_tenant_and_context(
    pool: &sqlx::PgPool,
    tenant_id: i32,
    lti_context_id: &str,
  ) -> Result<Option<Self>, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      SELECT id, uuid, tenant_id, lti_context_id, title, created_at, updated_at
      FROM courses
      WHERE tenant_id = $1 AND lti_context_id = $2
      "#,
      tenant_id,
      lti_context_id
    )
    .fetch_optional(pool)
    .await
  }

  pub async fn create(
    pool: &sqlx::PgPool,
    tenant_id: i32,
    lti_context_id: &str,
    title: Option<&str>,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      INSERT INTO courses (tenant_id, lti_context_id, title)
      VALUES ($1, $2, $3)
      RETURNING id, uuid, tenant_id, lti_context_id, title, created_at, updated_at
      "#,
      tenant_id,
      lti_context_id,
      title
    )
    .fetch_one(pool)
    .await
  }

  pub async fn update_title(
    &self,
    pool: &sqlx::PgPool,
    title: Option<&str>,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      UPDATE courses
      SET title = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, uuid, tenant_id, lti_context_id, title, created_at, updated_at
      "#,
      self.id,
      title
    )
    .fetch_one(pool)
    .await
  }
}
