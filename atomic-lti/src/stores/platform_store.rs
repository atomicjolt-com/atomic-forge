use crate::errors::PlatformError;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// Platform configuration data
///
/// Contains all necessary configuration for an LMS platform (e.g., Canvas, Moodle, Blackboard).
/// This data is typically obtained during dynamic registration or manual platform configuration.
///
/// # Fields
///
/// * `issuer` - The platform's issuer URL (e.g., "https://canvas.instructure.com")
/// * `name` - Optional human-readable name for the platform
/// * `jwks_url` - JWKS endpoint URL for validating the platform's JWT signatures
/// * `token_url` - OAuth2 token endpoint URL for obtaining access tokens
/// * `oidc_url` - OIDC authentication endpoint URL for initiating LTI launches
///
/// # Examples
///
/// ```
/// use atomic_lti::stores::platform_store::PlatformData;
///
/// let platform = PlatformData {
///     issuer: "https://canvas.instructure.com".to_string(),
///     name: Some("Canvas LMS".to_string()),
///     jwks_url: "https://canvas.instructure.com/api/lti/security/jwks".to_string(),
///     token_url: "https://canvas.instructure.com/login/oauth2/token".to_string(),
///     oidc_url: "https://canvas.instructure.com/api/lti/authorize_redirect".to_string(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformData {
  /// LMS platform issuer URL (e.g., "https://canvas.instructure.com")
  pub issuer: String,

  /// Human-readable platform name
  pub name: Option<String>,

  /// JWKS endpoint URL for validating platform's signatures
  pub jwks_url: String,

  /// OAuth2 token endpoint URL
  pub token_url: String,

  /// OIDC authentication endpoint URL
  pub oidc_url: String,
}

/// Store trait for managing LTI platform configurations
///
/// This trait provides both legacy single-platform methods and modern CRUD operations
/// for managing multiple platform configurations. Implementations can store platform
/// data in various backends (database, in-memory, file system, etc.).
///
/// # Backward Compatibility
///
/// The trait maintains backward compatibility with existing single-platform methods
/// (`get_oidc_url`, `get_jwk_server_url`, `get_token_url`) while adding full CRUD
/// support for multi-platform scenarios.
///
/// # Examples
///
/// ```no_run
/// use atomic_lti::stores::platform_store::{PlatformStore, PlatformData};
/// use atomic_lti::errors::PlatformError;
/// use async_trait::async_trait;
///
/// # struct MyPlatformStore;
/// # #[async_trait]
/// # impl PlatformStore for MyPlatformStore {
/// #     async fn get_oidc_url(&self) -> Result<String, PlatformError> { todo!() }
/// #     async fn get_jwk_server_url(&self) -> Result<String, PlatformError> { todo!() }
/// #     async fn get_token_url(&self) -> Result<String, PlatformError> { todo!() }
/// #     async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError> { todo!() }
/// #     async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError> { todo!() }
/// #     async fn update(&self, issuer: &str, platform: PlatformData) -> Result<PlatformData, PlatformError> { todo!() }
/// #     async fn delete(&self, issuer: &str) -> Result<(), PlatformError> { todo!() }
/// #     async fn list(&self) -> Result<Vec<PlatformData>, PlatformError> { todo!() }
/// # }
/// #
/// async fn example(store: &dyn PlatformStore) -> Result<(), PlatformError> {
///     // Create a new platform
///     let platform = PlatformData {
///         issuer: "https://canvas.instructure.com".to_string(),
///         name: Some("Canvas LMS".to_string()),
///         jwks_url: "https://canvas.instructure.com/api/lti/security/jwks".to_string(),
///         token_url: "https://canvas.instructure.com/login/oauth2/token".to_string(),
///         oidc_url: "https://canvas.instructure.com/api/lti/authorize_redirect".to_string(),
///     };
///
///     let created = store.create(platform).await?;
///
///     // Find by issuer
///     let found = store.find_by_iss("https://canvas.instructure.com").await?;
///
///     // List all platforms
///     let all_platforms = store.list().await?;
///
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait PlatformStore: Send + Sync {
  // ========== Backward Compatible Methods ==========

  /// Get OIDC URL for the configured platform
  ///
  /// This method is maintained for backward compatibility with single-platform
  /// implementations. For multi-platform scenarios, use `find_by_iss` instead.
  ///
  /// # Returns
  ///
  /// The OIDC authentication endpoint URL
  ///
  /// # Errors
  ///
  /// Returns `PlatformError::InvalidIss` if platform configuration is not found
  async fn get_oidc_url(&self) -> Result<String, PlatformError>;

  /// Get JWKS URL for the configured platform
  ///
  /// This method is maintained for backward compatibility with single-platform
  /// implementations. For multi-platform scenarios, use `find_by_iss` instead.
  ///
  /// # Returns
  ///
  /// The JWKS endpoint URL for validating platform signatures
  ///
  /// # Errors
  ///
  /// Returns `PlatformError::InvalidIss` if platform configuration is not found
  async fn get_jwk_server_url(&self) -> Result<String, PlatformError>;

  /// Get token URL for the configured platform
  ///
  /// This method is maintained for backward compatibility with single-platform
  /// implementations. For multi-platform scenarios, use `find_by_iss` instead.
  ///
  /// # Returns
  ///
  /// The OAuth2 token endpoint URL
  ///
  /// # Errors
  ///
  /// Returns `PlatformError::InvalidIss` if platform configuration is not found
  async fn get_token_url(&self) -> Result<String, PlatformError>;

  // ========== CRUD Operations ==========

  /// Create a new platform configuration
  ///
  /// # Arguments
  ///
  /// * `platform` - The platform configuration data to create
  ///
  /// # Returns
  ///
  /// The created platform data, potentially with additional fields populated by the store
  ///
  /// # Errors
  ///
  /// Returns `PlatformError` if:
  /// * A platform with the same issuer already exists
  /// * The platform data is invalid
  /// * The underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::platform_store::{PlatformStore, PlatformData};
  /// # use atomic_lti::errors::PlatformError;
  /// # async fn example(store: &dyn PlatformStore) -> Result<(), PlatformError> {
  /// let platform = PlatformData {
  ///     issuer: "https://canvas.instructure.com".to_string(),
  ///     name: Some("Canvas LMS".to_string()),
  ///     jwks_url: "https://canvas.instructure.com/api/lti/security/jwks".to_string(),
  ///     token_url: "https://canvas.instructure.com/login/oauth2/token".to_string(),
  ///     oidc_url: "https://canvas.instructure.com/api/lti/authorize_redirect".to_string(),
  /// };
  /// let created = store.create(platform).await?;
  /// # Ok(())
  /// # }
  /// ```
  async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError>;

  /// Find platform configuration by issuer
  ///
  /// # Arguments
  ///
  /// * `issuer` - The platform issuer URL to search for
  ///
  /// # Returns
  ///
  /// * `Some(PlatformData)` if a platform with the given issuer exists
  /// * `None` if no platform is found
  ///
  /// # Errors
  ///
  /// Returns `PlatformError` if the underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::platform_store::PlatformStore;
  /// # use atomic_lti::errors::PlatformError;
  /// # async fn example(store: &dyn PlatformStore) -> Result<(), PlatformError> {
  /// if let Some(platform) = store.find_by_iss("https://canvas.instructure.com").await? {
  ///     println!("Found platform: {:?}", platform.name);
  /// }
  /// # Ok(())
  /// # }
  /// ```
  async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError>;

  /// Update platform configuration
  ///
  /// # Arguments
  ///
  /// * `issuer` - The issuer of the platform to update
  /// * `platform` - The updated platform configuration data
  ///
  /// # Returns
  ///
  /// The updated platform data
  ///
  /// # Errors
  ///
  /// Returns `PlatformError` if:
  /// * The platform does not exist
  /// * The platform data is invalid
  /// * The underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::platform_store::{PlatformStore, PlatformData};
  /// # use atomic_lti::errors::PlatformError;
  /// # async fn example(store: &dyn PlatformStore) -> Result<(), PlatformError> {
  /// let mut platform = store.find_by_iss("https://canvas.instructure.com").await?
  ///     .expect("Platform not found");
  /// platform.name = Some("Updated Canvas LMS".to_string());
  /// let issuer = platform.issuer.clone();
  /// let updated = store.update(&issuer, platform).await?;
  /// # Ok(())
  /// # }
  /// ```
  async fn update(
    &self,
    issuer: &str,
    platform: PlatformData,
  ) -> Result<PlatformData, PlatformError>;

  /// Delete platform configuration
  ///
  /// # Arguments
  ///
  /// * `issuer` - The issuer of the platform to delete
  ///
  /// # Errors
  ///
  /// Returns `PlatformError` if:
  /// * The platform does not exist
  /// * The underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::platform_store::PlatformStore;
  /// # use atomic_lti::errors::PlatformError;
  /// # async fn example(store: &dyn PlatformStore) -> Result<(), PlatformError> {
  /// store.delete("https://canvas.instructure.com").await?;
  /// # Ok(())
  /// # }
  /// ```
  async fn delete(&self, issuer: &str) -> Result<(), PlatformError>;

  /// List all platform configurations
  ///
  /// # Returns
  ///
  /// A vector of all platform configurations in the store
  ///
  /// # Errors
  ///
  /// Returns `PlatformError` if the underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::platform_store::PlatformStore;
  /// # use atomic_lti::errors::PlatformError;
  /// # async fn example(store: &dyn PlatformStore) -> Result<(), PlatformError> {
  /// let platforms = store.list().await?;
  /// for platform in platforms {
  ///     println!("Platform: {} ({})", platform.name.unwrap_or_default(), platform.issuer);
  /// }
  /// # Ok(())
  /// # }
  /// ```
  async fn list(&self) -> Result<Vec<PlatformData>, PlatformError>;
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::collections::HashMap;
  use std::sync::{Arc, Mutex};

  /// In-memory test implementation of PlatformStore
  #[derive(Clone)]
  struct InMemoryPlatformStore {
    platforms: Arc<Mutex<HashMap<String, PlatformData>>>,
  }

  impl InMemoryPlatformStore {
    fn new() -> Self {
      Self {
        platforms: Arc::new(Mutex::new(HashMap::new())),
      }
    }
  }

  #[async_trait]
  impl PlatformStore for InMemoryPlatformStore {
    async fn get_oidc_url(&self) -> Result<String, PlatformError> {
      // For backward compatibility, return the first platform's OIDC URL
      let platforms = self.platforms.lock().unwrap();
      platforms
        .values()
        .next()
        .map(|p| p.oidc_url.clone())
        .ok_or_else(|| PlatformError::InvalidIss("No platform configured".to_string()))
    }

    async fn get_jwk_server_url(&self) -> Result<String, PlatformError> {
      let platforms = self.platforms.lock().unwrap();
      platforms
        .values()
        .next()
        .map(|p| p.jwks_url.clone())
        .ok_or_else(|| PlatformError::InvalidIss("No platform configured".to_string()))
    }

    async fn get_token_url(&self) -> Result<String, PlatformError> {
      let platforms = self.platforms.lock().unwrap();
      platforms
        .values()
        .next()
        .map(|p| p.token_url.clone())
        .ok_or_else(|| PlatformError::InvalidIss("No platform configured".to_string()))
    }

    async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError> {
      let mut platforms = self.platforms.lock().unwrap();
      if platforms.contains_key(&platform.issuer) {
        return Err(PlatformError::InvalidIss(format!(
          "Platform with issuer {} already exists",
          platform.issuer
        )));
      }
      platforms.insert(platform.issuer.clone(), platform.clone());
      Ok(platform)
    }

    async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError> {
      let platforms = self.platforms.lock().unwrap();
      Ok(platforms.get(issuer).cloned())
    }

    async fn update(
      &self,
      issuer: &str,
      platform: PlatformData,
    ) -> Result<PlatformData, PlatformError> {
      let mut platforms = self.platforms.lock().unwrap();
      if !platforms.contains_key(issuer) {
        return Err(PlatformError::InvalidIss(format!(
          "Platform with issuer {} not found",
          issuer
        )));
      }
      platforms.insert(issuer.to_string(), platform.clone());
      Ok(platform)
    }

    async fn delete(&self, issuer: &str) -> Result<(), PlatformError> {
      let mut platforms = self.platforms.lock().unwrap();
      platforms
        .remove(issuer)
        .ok_or_else(|| PlatformError::InvalidIss(format!("Platform with issuer {} not found", issuer)))?;
      Ok(())
    }

    async fn list(&self) -> Result<Vec<PlatformData>, PlatformError> {
      let platforms = self.platforms.lock().unwrap();
      Ok(platforms.values().cloned().collect())
    }
  }

  fn create_test_platform(issuer: &str) -> PlatformData {
    PlatformData {
      issuer: issuer.to_string(),
      name: Some(format!("Test Platform {}", issuer)),
      jwks_url: format!("{}/jwks", issuer),
      token_url: format!("{}/token", issuer),
      oidc_url: format!("{}/oidc", issuer),
    }
  }

  #[tokio::test]
  async fn test_create_platform() {
    let store = InMemoryPlatformStore::new();
    let platform = create_test_platform("https://canvas.instructure.com");

    let created = store.create(platform.clone()).await.unwrap();
    assert_eq!(created.issuer, platform.issuer);
    assert_eq!(created.name, platform.name);
  }

  #[tokio::test]
  async fn test_create_duplicate_platform_fails() {
    let store = InMemoryPlatformStore::new();
    let platform = create_test_platform("https://canvas.instructure.com");

    store.create(platform.clone()).await.unwrap();
    let result = store.create(platform).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_find_by_iss() {
    let store = InMemoryPlatformStore::new();
    let platform = create_test_platform("https://canvas.instructure.com");

    store.create(platform.clone()).await.unwrap();

    let found = store
      .find_by_iss("https://canvas.instructure.com")
      .await
      .unwrap();
    assert!(found.is_some());
    assert_eq!(found.unwrap().issuer, platform.issuer);
  }

  #[tokio::test]
  async fn test_find_by_iss_not_found() {
    let store = InMemoryPlatformStore::new();

    let found = store
      .find_by_iss("https://nonexistent.com")
      .await
      .unwrap();
    assert!(found.is_none());
  }

  #[tokio::test]
  async fn test_update_platform() {
    let store = InMemoryPlatformStore::new();
    let mut platform = create_test_platform("https://canvas.instructure.com");

    store.create(platform.clone()).await.unwrap();

    platform.name = Some("Updated Platform".to_string());
    let updated = store.update(&platform.issuer, platform.clone()).await.unwrap();
    assert_eq!(updated.name, Some("Updated Platform".to_string()));

    let found = store
      .find_by_iss("https://canvas.instructure.com")
      .await
      .unwrap()
      .unwrap();
    assert_eq!(found.name, Some("Updated Platform".to_string()));
  }

  #[tokio::test]
  async fn test_update_nonexistent_platform_fails() {
    let store = InMemoryPlatformStore::new();
    let platform = create_test_platform("https://canvas.instructure.com");

    let issuer = platform.issuer.clone();
    let result = store.update(&issuer, platform).await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_delete_platform() {
    let store = InMemoryPlatformStore::new();
    let platform = create_test_platform("https://canvas.instructure.com");

    store.create(platform.clone()).await.unwrap();
    store.delete(&platform.issuer).await.unwrap();

    let found = store.find_by_iss(&platform.issuer).await.unwrap();
    assert!(found.is_none());
  }

  #[tokio::test]
  async fn test_delete_nonexistent_platform_fails() {
    let store = InMemoryPlatformStore::new();
    let result = store.delete("https://nonexistent.com").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_list_platforms() {
    let store = InMemoryPlatformStore::new();

    let platform1 = create_test_platform("https://canvas.instructure.com");
    let platform2 = create_test_platform("https://moodle.org");

    store.create(platform1).await.unwrap();
    store.create(platform2).await.unwrap();

    let platforms = store.list().await.unwrap();
    assert_eq!(platforms.len(), 2);
  }

  #[tokio::test]
  async fn test_list_empty() {
    let store = InMemoryPlatformStore::new();
    let platforms = store.list().await.unwrap();
    assert_eq!(platforms.len(), 0);
  }

  #[tokio::test]
  async fn test_backward_compatible_methods() {
    let store = InMemoryPlatformStore::new();
    let platform = create_test_platform("https://canvas.instructure.com");

    store.create(platform.clone()).await.unwrap();

    let oidc_url = store.get_oidc_url().await.unwrap();
    assert_eq!(oidc_url, platform.oidc_url);

    let jwks_url = store.get_jwk_server_url().await.unwrap();
    assert_eq!(jwks_url, platform.jwks_url);

    let token_url = store.get_token_url().await.unwrap();
    assert_eq!(token_url, platform.token_url);
  }

  #[tokio::test]
  async fn test_backward_compatible_methods_no_platform() {
    let store = InMemoryPlatformStore::new();

    let result = store.get_oidc_url().await;
    assert!(result.is_err());

    let result = store.get_jwk_server_url().await;
    assert!(result.is_err());

    let result = store.get_token_url().await;
    assert!(result.is_err());
  }
}
