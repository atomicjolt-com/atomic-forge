use crate::errors::OIDCError;
use async_trait::async_trait;
use chrono::NaiveDateTime;

/// OIDC state data
///
/// Contains state, nonce, and optionally the issuer that initiated the OIDC flow.
/// This is particularly useful during dynamic registration flows where tracking
/// the initiating platform is important.
///
/// # Fields
///
/// * `state` - The OIDC state parameter (random string for CSRF protection)
/// * `nonce` - The nonce parameter (random string to prevent replay attacks)
/// * `issuer` - Optional platform issuer URL that initiated the flow
///
/// # Examples
///
/// ```
/// use atomic_lti::stores::oidc_state_store::OIDCStateData;
///
/// let state_data = OIDCStateData {
///     state: "random-state-123".to_string(),
///     nonce: "random-nonce-456".to_string(),
///     issuer: Some("https://canvas.instructure.com".to_string()),
/// };
/// ```
#[derive(Debug, Clone)]
pub struct OIDCStateData {
  /// OIDC state parameter
  pub state: String,

  /// OIDC nonce parameter
  pub nonce: String,

  /// Optional platform issuer URL
  pub issuer: Option<String>,
}

/// Store trait for managing OIDC state and nonce values
///
/// This trait provides methods for storing and retrieving OIDC state/nonce pairs,
/// with optional issuer tracking for dynamic registration flows.
///
/// # Backward Compatibility
///
/// The trait maintains backward compatibility with existing methods while adding
/// new capabilities for issuer tracking.
///
/// # Examples
///
/// ```no_run
/// use atomic_lti::stores::oidc_state_store::{OIDCStateStore, OIDCStateData};
/// use atomic_lti::errors::OIDCError;
/// use async_trait::async_trait;
///
/// # struct MyOIDCStateStore;
/// # #[async_trait]
/// # impl OIDCStateStore for MyOIDCStateStore {
/// #     async fn get_state(&self) -> String { todo!() }
/// #     async fn get_nonce(&self) -> String { todo!() }
/// #     async fn get_created_at(&self) -> chrono::NaiveDateTime { todo!() }
/// #     async fn destroy(&self) -> Result<usize, OIDCError> { todo!() }
/// #     async fn create_with_issuer(&self, state: &str, nonce: &str, issuer: &str) -> Result<(), OIDCError> { todo!() }
/// #     async fn find_by_state(&self, state: &str) -> Result<OIDCStateData, OIDCError> { todo!() }
/// # }
/// #
/// async fn example(store: &dyn OIDCStateStore) -> Result<(), OIDCError> {
///     // Create state with issuer for registration tracking
///     store.create_with_issuer(
///         "state-123",
///         "nonce-456",
///         "https://canvas.instructure.com"
///     ).await?;
///
///     // Later, retrieve the state data
///     let state_data = store.find_by_state("state-123").await?;
///     if let Some(issuer) = state_data.issuer {
///         println!("Registration initiated by: {}", issuer);
///     }
///
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait OIDCStateStore: Send + Sync {
  // ========== Backward Compatible Methods ==========

  /// Get the OIDC state value
  ///
  /// This method is maintained for backward compatibility. For new implementations,
  /// consider using `find_by_state` which provides more complete information.
  ///
  /// # Returns
  ///
  /// The OIDC state string
  async fn get_state(&self) -> String;

  /// Get the OIDC nonce value
  ///
  /// This method is maintained for backward compatibility. For new implementations,
  /// consider using `find_by_state` which provides more complete information.
  ///
  /// # Returns
  ///
  /// The OIDC nonce string
  async fn get_nonce(&self) -> String;

  /// Get the timestamp when the state was created
  ///
  /// # Returns
  ///
  /// The creation timestamp
  async fn get_created_at(&self) -> NaiveDateTime;

  /// Destroy the OIDC state
  ///
  /// This should be called after the OIDC flow is complete to clean up the state.
  ///
  /// # Returns
  ///
  /// The number of state records destroyed
  ///
  /// # Errors
  ///
  /// Returns `OIDCError` if the underlying storage operation fails
  async fn destroy(&self) -> Result<usize, OIDCError>;

  // ========== Enhanced Methods with Issuer Tracking ==========

  /// Create OIDC state with issuer for registration tracking
  ///
  /// Use this during dynamic registration to track which platform
  /// initiated the registration flow. This allows you to properly
  /// associate the registration with the platform after the flow completes.
  ///
  /// # Arguments
  ///
  /// * `state` - The OIDC state parameter
  /// * `nonce` - The OIDC nonce parameter
  /// * `issuer` - The platform issuer URL that initiated the flow
  ///
  /// # Errors
  ///
  /// Returns `OIDCError` if the underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::oidc_state_store::OIDCStateStore;
  /// # use atomic_lti::errors::OIDCError;
  /// # async fn example(store: &dyn OIDCStateStore) -> Result<(), OIDCError> {
  /// store.create_with_issuer(
  ///     "state-123",
  ///     "nonce-456",
  ///     "https://canvas.instructure.com"
  /// ).await?;
  /// # Ok(())
  /// # }
  /// ```
  async fn create_with_issuer(
    &self,
    state: &str,
    nonce: &str,
    issuer: &str,
  ) -> Result<(), OIDCError>;

  /// Find OIDC state by state string
  ///
  /// Retrieves the complete state data including state, nonce, and issuer.
  ///
  /// # Arguments
  ///
  /// * `state` - The OIDC state parameter to search for
  ///
  /// # Returns
  ///
  /// The complete OIDC state data
  ///
  /// # Errors
  ///
  /// Returns `OIDCError` if:
  /// * The state is not found
  /// * The underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::oidc_state_store::OIDCStateStore;
  /// # use atomic_lti::errors::OIDCError;
  /// # async fn example(store: &dyn OIDCStateStore) -> Result<(), OIDCError> {
  /// let state_data = store.find_by_state("state-123").await?;
  /// println!("Nonce: {}", state_data.nonce);
  /// if let Some(issuer) = state_data.issuer {
  ///     println!("Issuer: {}", issuer);
  /// }
  /// # Ok(())
  /// # }
  /// ```
  async fn find_by_state(&self, state: &str) -> Result<OIDCStateData, OIDCError>;
}

#[cfg(test)]
mod tests {
  use super::*;
  use chrono::Utc;
  use std::collections::HashMap;
  use std::sync::{Arc, Mutex};

  #[derive(Clone)]
  struct StateRecord {
    state: String,
    nonce: String,
    issuer: Option<String>,
    created_at: NaiveDateTime,
  }

  /// In-memory test implementation of OIDCStateStore
  #[derive(Clone)]
  struct InMemoryOIDCStateStore {
    states: Arc<Mutex<HashMap<String, StateRecord>>>,
  }

  impl InMemoryOIDCStateStore {
    fn new() -> Self {
      Self {
        states: Arc::new(Mutex::new(HashMap::new())),
      }
    }

    fn insert_state(&self, state: &str, nonce: &str, issuer: Option<String>) {
      let mut states = self.states.lock().unwrap();
      states.insert(
        state.to_string(),
        StateRecord {
          state: state.to_string(),
          nonce: nonce.to_string(),
          issuer,
          created_at: Utc::now().naive_utc(),
        },
      );
    }
  }

  #[async_trait]
  impl OIDCStateStore for InMemoryOIDCStateStore {
    async fn get_state(&self) -> String {
      let states = self.states.lock().unwrap();
      states
        .values()
        .next()
        .map(|r| r.state.clone())
        .unwrap_or_default()
    }

    async fn get_nonce(&self) -> String {
      let states = self.states.lock().unwrap();
      states
        .values()
        .next()
        .map(|r| r.nonce.clone())
        .unwrap_or_default()
    }

    async fn get_created_at(&self) -> NaiveDateTime {
      let states = self.states.lock().unwrap();
      states
        .values()
        .next()
        .map(|r| r.created_at)
        .unwrap_or_else(|| Utc::now().naive_utc())
    }

    async fn destroy(&self) -> Result<usize, OIDCError> {
      let mut states = self.states.lock().unwrap();
      let count = states.len();
      states.clear();
      Ok(count)
    }

    async fn create_with_issuer(
      &self,
      state: &str,
      nonce: &str,
      issuer: &str,
    ) -> Result<(), OIDCError> {
      self.insert_state(state, nonce, Some(issuer.to_string()));
      Ok(())
    }

    async fn find_by_state(&self, state: &str) -> Result<OIDCStateData, OIDCError> {
      let states = self.states.lock().unwrap();
      let record = states
        .get(state)
        .ok_or_else(|| OIDCError::StateInvalid(format!("State {} not found", state)))?;

      Ok(OIDCStateData {
        state: record.state.clone(),
        nonce: record.nonce.clone(),
        issuer: record.issuer.clone(),
      })
    }
  }

  #[tokio::test]
  async fn test_create_with_issuer() {
    let store = InMemoryOIDCStateStore::new();

    let result = store
      .create_with_issuer("state-123", "nonce-456", "https://canvas.instructure.com")
      .await;

    assert!(result.is_ok());

    let state_data = store.find_by_state("state-123").await.unwrap();
    assert_eq!(state_data.state, "state-123");
    assert_eq!(state_data.nonce, "nonce-456");
    assert_eq!(
      state_data.issuer,
      Some("https://canvas.instructure.com".to_string())
    );
  }

  #[tokio::test]
  async fn test_find_by_state() {
    let store = InMemoryOIDCStateStore::new();
    store.insert_state(
      "state-123",
      "nonce-456",
      Some("https://canvas.instructure.com".to_string()),
    );

    let state_data = store.find_by_state("state-123").await.unwrap();
    assert_eq!(state_data.state, "state-123");
    assert_eq!(state_data.nonce, "nonce-456");
    assert_eq!(
      state_data.issuer,
      Some("https://canvas.instructure.com".to_string())
    );
  }

  #[tokio::test]
  async fn test_find_by_state_not_found() {
    let store = InMemoryOIDCStateStore::new();

    let result = store.find_by_state("nonexistent").await;
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), OIDCError::StateInvalid(_)));
  }

  #[tokio::test]
  async fn test_find_by_state_without_issuer() {
    let store = InMemoryOIDCStateStore::new();
    store.insert_state("state-123", "nonce-456", None);

    let state_data = store.find_by_state("state-123").await.unwrap();
    assert_eq!(state_data.state, "state-123");
    assert_eq!(state_data.nonce, "nonce-456");
    assert_eq!(state_data.issuer, None);
  }

  #[tokio::test]
  async fn test_backward_compatible_get_state() {
    let store = InMemoryOIDCStateStore::new();
    store.insert_state(
      "state-123",
      "nonce-456",
      Some("https://canvas.instructure.com".to_string()),
    );

    let state = store.get_state().await;
    assert_eq!(state, "state-123");
  }

  #[tokio::test]
  async fn test_backward_compatible_get_nonce() {
    let store = InMemoryOIDCStateStore::new();
    store.insert_state(
      "state-123",
      "nonce-456",
      Some("https://canvas.instructure.com".to_string()),
    );

    let nonce = store.get_nonce().await;
    assert_eq!(nonce, "nonce-456");
  }

  #[tokio::test]
  async fn test_backward_compatible_get_created_at() {
    let store = InMemoryOIDCStateStore::new();
    store.insert_state("state-123", "nonce-456", None);

    let created_at = store.get_created_at().await;
    // Just verify it's a valid timestamp (not testing exact value due to timing)
    assert!(created_at <= Utc::now().naive_utc());
  }

  #[tokio::test]
  async fn test_destroy() {
    let store = InMemoryOIDCStateStore::new();
    store.insert_state("state-1", "nonce-1", None);
    store.insert_state(
      "state-2",
      "nonce-2",
      Some("https://canvas.instructure.com".to_string()),
    );

    let count = store.destroy().await.unwrap();
    assert_eq!(count, 2);

    let result = store.find_by_state("state-1").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_multiple_states_with_different_issuers() {
    let store = InMemoryOIDCStateStore::new();

    store
      .create_with_issuer("state-1", "nonce-1", "https://canvas.instructure.com")
      .await
      .unwrap();

    store.insert_state("state-2", "nonce-2", Some("https://moodle.org".to_string()));

    let data1 = store.find_by_state("state-1").await.unwrap();
    assert_eq!(
      data1.issuer,
      Some("https://canvas.instructure.com".to_string())
    );

    let data2 = store.find_by_state("state-2").await.unwrap();
    assert_eq!(data2.issuer, Some("https://moodle.org".to_string()));
  }

  #[tokio::test]
  async fn test_empty_store_backward_compatible_methods() {
    let store = InMemoryOIDCStateStore::new();

    let state = store.get_state().await;
    assert_eq!(state, "");

    let nonce = store.get_nonce().await;
    assert_eq!(nonce, "");
  }
}
