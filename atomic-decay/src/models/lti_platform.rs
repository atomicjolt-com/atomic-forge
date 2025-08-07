use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LtiPlatform {
  pub id: i32,
  pub uuid: Uuid,
  pub issuer: String,
  pub name: Option<String>,
  pub jwks_url: String,
  pub token_url: String,
  pub oidc_url: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl LtiPlatform {
  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn find_by_issuer(
    pool: &sqlx::PgPool,
    issuer: &str,
  ) -> Result<Option<Self>, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
            SELECT id, uuid, issuer, name, jwks_url, token_url, oidc_url, created_at, updated_at
            FROM lti_platforms
            WHERE issuer = $1
            "#,
      issuer
    )
    .fetch_optional(pool)
    .await
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn create(
    pool: &sqlx::PgPool,
    issuer: &str,
    name: Option<&str>,
    jwks_url: &str,
    token_url: &str,
    oidc_url: &str,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
            INSERT INTO lti_platforms (issuer, name, jwks_url, token_url, oidc_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, uuid, issuer, name, jwks_url, token_url, oidc_url, created_at, updated_at
            "#,
      issuer,
      name,
      jwks_url,
      token_url,
      oidc_url
    )
    .fetch_one(pool)
    .await
  }

  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn update(
    &self,
    pool: &sqlx::PgPool,
    name: Option<&str>,
    jwks_url: &str,
    token_url: &str,
    oidc_url: &str,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
            UPDATE lti_platforms
            SET name = $2, jwks_url = $3, token_url = $4, oidc_url = $5, updated_at = NOW()
            WHERE id = $1
            RETURNING id, uuid, issuer, name, jwks_url, token_url, oidc_url, created_at, updated_at
            "#,
      self.id,
      name,
      jwks_url,
      token_url,
      oidc_url
    )
    .fetch_one(pool)
    .await
  }
}
