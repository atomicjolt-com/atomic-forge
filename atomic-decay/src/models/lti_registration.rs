use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LtiRegistration {
  pub id: i32,
  pub uuid: Uuid,
  pub platform_id: i32,
  pub client_id: String,
  pub deployment_id: Option<String>,
  pub registration_config: JsonValue,
  pub registration_token: Option<String>,
  pub status: String,
  pub supported_placements: Option<JsonValue>,
  pub supported_message_types: Option<JsonValue>,
  pub capabilities: Option<JsonValue>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

impl LtiRegistration {
  #[allow(dead_code)] // Public API - may be used by external consumers
  pub async fn find_by_client_id(
    pool: &sqlx::PgPool,
    client_id: &str,
  ) -> Result<Option<Self>, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
            SELECT id, uuid, platform_id, client_id, deployment_id, registration_config,
                   registration_token, status, supported_placements, supported_message_types,
                   capabilities, created_at, updated_at
            FROM lti_registrations
            WHERE client_id = $1
            "#,
      client_id
    )
    .fetch_optional(pool)
    .await
  }

  pub async fn find_by_platform_and_client(
    pool: &sqlx::PgPool,
    platform_id: i32,
    client_id: &str,
  ) -> Result<Option<Self>, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
            SELECT id, uuid, platform_id, client_id, deployment_id, registration_config,
                   registration_token, status, supported_placements, supported_message_types,
                   capabilities, created_at, updated_at
            FROM lti_registrations
            WHERE platform_id = $1 AND client_id = $2
            "#,
      platform_id,
      client_id
    )
    .fetch_optional(pool)
    .await
  }

  pub async fn create(
    pool: &sqlx::PgPool,
    platform_id: i32,
    client_id: &str,
    deployment_id: Option<&str>,
    registration_config: &JsonValue,
    registration_token: Option<&str>,
    status: &str,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
            Self,
            r#"
            INSERT INTO lti_registrations
                (platform_id, client_id, deployment_id, registration_config, registration_token, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, uuid, platform_id, client_id, deployment_id, registration_config,
                      registration_token, status, supported_placements, supported_message_types,
                      capabilities, created_at, updated_at
            "#,
            platform_id,
            client_id,
            deployment_id,
            registration_config,
            registration_token,
            status
        )
        .fetch_one(pool)
        .await
  }

  pub async fn create_with_capabilities(
    pool: &sqlx::PgPool,
    platform_id: i32,
    client_id: &str,
    deployment_id: Option<&str>,
    registration_config: &JsonValue,
    registration_token: Option<&str>,
    status: &str,
    supported_placements: Option<&JsonValue>,
    supported_message_types: Option<&JsonValue>,
    capabilities: Option<&JsonValue>,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
            Self,
            r#"
            INSERT INTO lti_registrations
                (platform_id, client_id, deployment_id, registration_config, registration_token,
                 status, supported_placements, supported_message_types, capabilities)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, uuid, platform_id, client_id, deployment_id, registration_config,
                      registration_token, status, supported_placements, supported_message_types,
                      capabilities, created_at, updated_at
            "#,
            platform_id,
            client_id,
            deployment_id,
            registration_config,
            registration_token,
            status,
            supported_placements,
            supported_message_types,
            capabilities
        )
        .fetch_one(pool)
        .await
  }

  pub async fn update_status(
    &self,
    pool: &sqlx::PgPool,
    status: &str,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
            UPDATE lti_registrations
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING id, uuid, platform_id, client_id, deployment_id, registration_config,
                      registration_token, status, supported_placements, supported_message_types,
                      capabilities, created_at, updated_at
            "#,
      self.id,
      status
    )
    .fetch_one(pool)
    .await
  }

  pub async fn update_capabilities(
    &self,
    pool: &sqlx::PgPool,
    capabilities: &JsonValue,
  ) -> Result<Self, sqlx::Error> {
    sqlx::query_as!(
      Self,
      r#"
            UPDATE lti_registrations
            SET capabilities = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING id, uuid, platform_id, client_id, deployment_id, registration_config,
                      registration_token, status, supported_placements, supported_message_types,
                      capabilities, created_at, updated_at
            "#,
      self.id,
      capabilities
    )
    .fetch_one(pool)
    .await
  }

  /// Check if this registration supports a specific placement
  pub fn supports_placement(&self, placement: &str) -> bool {
    if let Some(ref placements) = self.supported_placements {
      if let Some(array) = placements.as_array() {
        return array.iter().any(|p| p.as_str() == Some(placement));
      }
    }
    false
  }

  /// Check if this registration supports a specific message type
  pub fn supports_message_type(&self, msg_type: &str) -> bool {
    if let Some(ref message_types) = self.supported_message_types {
      if let Some(array) = message_types.as_array() {
        return array.iter().any(|m| m.as_str() == Some(msg_type));
      }
    }
    false
  }

  /// Get a specific capability value
  pub fn get_capability(&self, key: &str) -> Option<JsonValue> {
    self.capabilities.as_ref()?.get(key).cloned()
  }
}
