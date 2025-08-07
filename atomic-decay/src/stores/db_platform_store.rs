use crate::models::lti_platform::LtiPlatform;
use async_trait::async_trait;
use atomic_lti::errors::PlatformError;
use atomic_lti::stores::platform_store::{PlatformData, PlatformStore};
use sqlx::PgPool;

pub struct DBPlatformStore {
  pool: PgPool,
  issuer: Option<String>, // For compatibility with existing methods
}

impl DBPlatformStore {
  pub fn new(pool: PgPool) -> Self {
    Self { pool, issuer: None }
  }

  pub fn with_issuer(pool: PgPool, issuer: String) -> Self {
    Self {
      pool,
      issuer: Some(issuer),
    }
  }
}

#[async_trait]
impl PlatformStore for DBPlatformStore {
  // Original methods for backward compatibility
  async fn get_oidc_url(&self) -> Result<String, PlatformError> {
    let issuer = self
      .issuer
      .as_ref()
      .ok_or_else(|| PlatformError::InvalidIss("No issuer specified".to_string()))?;

    let platform = LtiPlatform::find_by_issuer(&self.pool, issuer)
      .await
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    Ok(platform.oidc_url)
  }

  async fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
    let issuer = self
      .issuer
      .as_ref()
      .ok_or_else(|| PlatformError::InvalidIss("No issuer specified".to_string()))?;

    let platform = LtiPlatform::find_by_issuer(&self.pool, issuer)
      .await
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    Ok(platform.jwks_url)
  }

  async fn get_token_url(&self) -> Result<String, PlatformError> {
    let issuer = self
      .issuer
      .as_ref()
      .ok_or_else(|| PlatformError::InvalidIss("No issuer specified".to_string()))?;

    let platform = LtiPlatform::find_by_issuer(&self.pool, issuer)
      .await
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    Ok(platform.token_url)
  }

  // CRUD operations
  async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError> {
    let created = LtiPlatform::create(
      &self.pool,
      &platform.issuer,
      platform.name.as_deref(),
      &platform.jwks_url,
      &platform.token_url,
      &platform.oidc_url,
    )
    .await
    .map_err(|e| PlatformError::InvalidIss(e.to_string()))?;

    Ok(PlatformData {
      issuer: created.issuer,
      name: created.name,
      jwks_url: created.jwks_url,
      token_url: created.token_url,
      oidc_url: created.oidc_url,
    })
  }

  async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError> {
    let platform = LtiPlatform::find_by_issuer(&self.pool, issuer)
      .await
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?;

    Ok(platform.map(|p| PlatformData {
      issuer: p.issuer,
      name: p.name,
      jwks_url: p.jwks_url,
      token_url: p.token_url,
      oidc_url: p.oidc_url,
    }))
  }

  async fn update(
    &self,
    issuer: &str,
    platform: PlatformData,
  ) -> Result<PlatformData, PlatformError> {
    let existing = LtiPlatform::find_by_issuer(&self.pool, issuer)
      .await
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    let updated = existing
      .update(
        &self.pool,
        platform.name.as_deref(),
        &platform.jwks_url,
        &platform.token_url,
        &platform.oidc_url,
      )
      .await
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?;

    Ok(PlatformData {
      issuer: updated.issuer,
      name: updated.name,
      jwks_url: updated.jwks_url,
      token_url: updated.token_url,
      oidc_url: updated.oidc_url,
    })
  }

  async fn delete(&self, issuer: &str) -> Result<(), PlatformError> {
    sqlx::query!(
      r#"
      DELETE FROM lti_platforms
      WHERE issuer = $1
      "#,
      issuer
    )
    .execute(&self.pool)
    .await
    .map_err(|e| PlatformError::InvalidIss(e.to_string()))?;

    Ok(())
  }

  async fn list(&self) -> Result<Vec<PlatformData>, PlatformError> {
    let platforms = sqlx::query_as!(
      LtiPlatform,
      r#"
      SELECT id, uuid, issuer, name, jwks_url, token_url, oidc_url, created_at, updated_at
      FROM lti_platforms
      ORDER BY issuer
      "#
    )
    .fetch_all(&self.pool)
    .await
    .map_err(|e| PlatformError::InvalidIss(e.to_string()))?;

    Ok(
      platforms
        .into_iter()
        .map(|p| PlatformData {
          issuer: p.issuer,
          name: p.name,
          jwks_url: p.jwks_url,
          token_url: p.token_url,
          oidc_url: p.oidc_url,
        })
        .collect(),
    )
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::test_helpers::setup_test_db;

  #[tokio::test]
  async fn test_crud_operations() {
    let pool = setup_test_db().await;
    let store = DBPlatformStore::new(pool.clone());

    // Clean up any existing test data
    sqlx::query("DELETE FROM lti_platforms WHERE issuer LIKE 'https://test-crud%'")
      .execute(&pool)
      .await
      .ok();

    // Test create
    let platform_data = PlatformData {
      issuer: "https://test-crud.example.com".to_string(),
      name: Some("Test Platform".to_string()),
      jwks_url: "https://test-crud.example.com/jwks".to_string(),
      token_url: "https://test-crud.example.com/token".to_string(),
      oidc_url: "https://test-crud.example.com/oidc".to_string(),
    };

    let created = store.create(platform_data.clone()).await.unwrap();
    assert_eq!(created.issuer, platform_data.issuer);
    assert_eq!(created.name, platform_data.name);

    // Test find_by_iss
    let found = store.find_by_iss(&platform_data.issuer).await.unwrap();
    assert!(found.is_some());
    let found = found.unwrap();
    assert_eq!(found.issuer, platform_data.issuer);

    // Test update
    let updated_data = PlatformData {
      issuer: platform_data.issuer.clone(),
      name: Some("Updated Platform".to_string()),
      jwks_url: "https://test-crud.example.com/jwks2".to_string(),
      token_url: platform_data.token_url.clone(),
      oidc_url: platform_data.oidc_url.clone(),
    };

    let updated = store
      .update(&platform_data.issuer, updated_data.clone())
      .await
      .unwrap();
    assert_eq!(updated.name, Some("Updated Platform".to_string()));
    assert_eq!(updated.jwks_url, "https://test-crud.example.com/jwks2");

    // Test list
    let all_platforms = store.list().await.unwrap();
    assert!(!all_platforms.is_empty());
    assert!(all_platforms.iter().any(|p| p.issuer == platform_data.issuer));

    // Test delete
    store.delete(&platform_data.issuer).await.unwrap();
    let found_after_delete = store.find_by_iss(&platform_data.issuer).await.unwrap();
    assert!(found_after_delete.is_none());
  }

  #[tokio::test]
  async fn test_backward_compatibility_methods() {
    let pool = setup_test_db().await;

    // Clean up any existing test data
    sqlx::query("DELETE FROM lti_platforms WHERE issuer LIKE 'https://test-compat%'")
      .execute(&pool)
      .await
      .ok();

    // Create a platform first
    let platform_data = PlatformData {
      issuer: "https://test-compat.example.com".to_string(),
      name: Some("Test Platform".to_string()),
      jwks_url: "https://test-compat.example.com/jwks".to_string(),
      token_url: "https://test-compat.example.com/token".to_string(),
      oidc_url: "https://test-compat.example.com/oidc".to_string(),
    };

    let store = DBPlatformStore::new(pool.clone());
    store.create(platform_data.clone()).await.unwrap();

    // Test with issuer
    let store_with_issuer = DBPlatformStore::with_issuer(pool, platform_data.issuer.clone());

    let oidc_url = store_with_issuer.get_oidc_url().await.unwrap();
    assert_eq!(oidc_url, platform_data.oidc_url);

    let jwk_url = store_with_issuer.get_jwk_server_url().await.unwrap();
    assert_eq!(jwk_url, platform_data.jwks_url);

    let token_url = store_with_issuer.get_token_url().await.unwrap();
    assert_eq!(token_url, platform_data.token_url);
  }
}