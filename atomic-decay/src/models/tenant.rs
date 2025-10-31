use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tenant {
  pub id: i32,
  pub uuid: Uuid,
  pub slug: String,
  pub name: String,
  pub platform_iss: String,
  pub client_id: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl Tenant {
  pub async fn find_by_slug(
    pool: &sqlx::PgPool,
    slug: &str,
  ) -> Result<Option<Self>, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      SELECT id, uuid, slug, name, platform_iss, client_id, created_at, updated_at
      FROM tenants
      WHERE slug = $1
      "#,
      slug
    )
    .fetch_optional(pool)
    .await
  }

  pub async fn find_by_platform_and_client(
    pool: &sqlx::PgPool,
    platform_iss: &str,
    client_id: &str,
  ) -> Result<Option<Self>, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      SELECT id, uuid, slug, name, platform_iss, client_id, created_at, updated_at
      FROM tenants
      WHERE platform_iss = $1 AND client_id = $2
      "#,
      platform_iss,
      client_id
    )
    .fetch_optional(pool)
    .await
  }

  pub async fn create(
    pool: &sqlx::PgPool,
    slug: &str,
    name: &str,
    platform_iss: &str,
    client_id: &str,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      INSERT INTO tenants (slug, name, platform_iss, client_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, uuid, slug, name, platform_iss, client_id, created_at, updated_at
      "#,
      slug,
      name,
      platform_iss,
      client_id
    )
    .fetch_one(pool)
    .await
  }

  pub async fn update_name(&self, pool: &sqlx::PgPool, name: &str) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
      UPDATE tenants
      SET name = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, uuid, slug, name, platform_iss, client_id, created_at, updated_at
      "#,
      self.id,
      name
    )
    .fetch_one(pool)
    .await
  }
}
