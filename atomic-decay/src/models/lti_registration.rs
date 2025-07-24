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
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl LtiRegistration {
    pub async fn find_by_client_id(
        pool: &sqlx::PgPool,
        client_id: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            Self,
            r#"
            SELECT id, uuid, platform_id, client_id, deployment_id, registration_config, 
                   registration_token, status, created_at, updated_at
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
                   registration_token, status, created_at, updated_at
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
                      registration_token, status, created_at, updated_at
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
                      registration_token, status, created_at, updated_at
            "#,
            self.id,
            status
        )
        .fetch_one(pool)
        .await
    }
}