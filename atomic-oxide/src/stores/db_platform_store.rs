use crate::db::{get_connection, Pool};
use crate::models::lti_platform::{LtiPlatform, NewLtiPlatform, UpdateLtiPlatform};
use async_trait::async_trait;
use atomic_lti::errors::PlatformError;
use atomic_lti::stores::platform_store::{PlatformData, PlatformStore};

pub struct DBPlatformStore {
  pool: Pool,
  issuer: Option<String>, // For compatibility with existing methods
}

impl DBPlatformStore {
  pub fn new(pool: Pool) -> Self {
    Self { pool, issuer: None }
  }

  pub fn with_issuer(pool: Pool, issuer: String) -> Self {
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

    let mut conn = get_connection(&self.pool)?;
    let platform = LtiPlatform::find_by_issuer(&mut conn, issuer)
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    Ok(platform.oidc_url)
  }

  async fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
    let issuer = self
      .issuer
      .as_ref()
      .ok_or_else(|| PlatformError::InvalidIss("No issuer specified".to_string()))?;

    let mut conn = get_connection(&self.pool)?;
    let platform = LtiPlatform::find_by_issuer(&mut conn, issuer)
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    Ok(platform.jwks_url)
  }

  async fn get_token_url(&self) -> Result<String, PlatformError> {
    let issuer = self
      .issuer
      .as_ref()
      .ok_or_else(|| PlatformError::InvalidIss("No issuer specified".to_string()))?;

    let mut conn = get_connection(&self.pool)?;
    let platform = LtiPlatform::find_by_issuer(&mut conn, issuer)
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    Ok(platform.token_url)
  }

  // CRUD operations
  async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError> {
    let mut conn = get_connection(&self.pool)?;

    let new_platform = NewLtiPlatform {
      issuer: &platform.issuer,
      name: platform.name.as_deref(),
      jwks_url: &platform.jwks_url,
      token_url: &platform.token_url,
      oidc_url: &platform.oidc_url,
    };

    let created = LtiPlatform::create(&mut conn, new_platform)
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
    let mut conn = get_connection(&self.pool)?;

    let platform = LtiPlatform::find_by_issuer(&mut conn, issuer)
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
    let mut conn = get_connection(&self.pool)?;

    let existing = LtiPlatform::find_by_issuer(&mut conn, issuer)
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    let update_data = UpdateLtiPlatform {
      name: platform.name.as_deref(),
      jwks_url: &platform.jwks_url,
      token_url: &platform.token_url,
      oidc_url: &platform.oidc_url,
    };

    let updated = existing
      .update(&mut conn, update_data)
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
    let mut conn = get_connection(&self.pool)?;

    let platform = LtiPlatform::find_by_issuer(&mut conn, issuer)
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?
      .ok_or_else(|| PlatformError::InvalidIss(issuer.to_string()))?;

    platform
      .delete(&mut conn)
      .map_err(|e| PlatformError::InvalidIss(e.to_string()))?;

    Ok(())
  }

  async fn list(&self) -> Result<Vec<PlatformData>, PlatformError> {
    let mut conn = get_connection(&self.pool)?;

    let platforms = LtiPlatform::list(&mut conn)
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
  use crate::tests::db_test_helpers::setup_test_db;
  use uuid;

  #[tokio::test]
  async fn test_crud_operations() {
    let db_pool = setup_test_db();
    let store = DBPlatformStore::new(db_pool);

    // Use unique issuer to avoid conflicts
    let unique_suffix = uuid::Uuid::new_v4();
    
    // Test create
    let platform_data = PlatformData {
      issuer: format!("https://test-crud-{}.example.com", unique_suffix),
      name: Some("Test Platform".to_string()),
      jwks_url: "https://test.example.com/jwks".to_string(),
      token_url: "https://test.example.com/token".to_string(),
      oidc_url: "https://test.example.com/oidc".to_string(),
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
      jwks_url: "https://test.example.com/jwks2".to_string(),
      token_url: platform_data.token_url.clone(),
      oidc_url: platform_data.oidc_url.clone(),
    };

    let updated = store
      .update(&platform_data.issuer, updated_data.clone())
      .await
      .unwrap();
    assert_eq!(updated.name, Some("Updated Platform".to_string()));
    assert_eq!(updated.jwks_url, "https://test.example.com/jwks2");

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
    let db_pool = setup_test_db();

    // Use unique issuer to avoid conflicts
    let unique_suffix = uuid::Uuid::new_v4();
    
    // Create a platform first
    let platform_data = PlatformData {
      issuer: format!("https://test-compat-{}.example.com", unique_suffix),
      name: Some("Test Platform".to_string()),
      jwks_url: "https://test.example.com/jwks".to_string(),
      token_url: "https://test.example.com/token".to_string(),
      oidc_url: "https://test.example.com/oidc".to_string(),
    };

    let store = DBPlatformStore::new(db_pool.clone());
    store.create(platform_data.clone()).await.unwrap();

    // Test with issuer
    let store_with_issuer = DBPlatformStore::with_issuer(db_pool, platform_data.issuer.clone());

    let oidc_url = store_with_issuer.get_oidc_url().await.unwrap();
    assert_eq!(oidc_url, platform_data.oidc_url);

    let jwk_url = store_with_issuer.get_jwk_server_url().await.unwrap();
    assert_eq!(jwk_url, platform_data.jwks_url);

    let token_url = store_with_issuer.get_token_url().await.unwrap();
    assert_eq!(token_url, platform_data.token_url);
  }
}