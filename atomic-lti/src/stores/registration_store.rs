use crate::errors::RegistrationError;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

/// LTI registration data
///
/// Contains all information about an LTI tool registration, including platform association,
/// OAuth2 credentials, deployment information, and tool capabilities.
///
/// # Fields
///
/// * `platform_id` - Foreign key reference to the platform this registration belongs to
/// * `client_id` - OAuth2 client ID assigned by the platform
/// * `deployment_id` - LTI deployment ID (optional, may be null for some platforms)
/// * `registration_config` - Complete registration configuration from dynamic registration (stored as JSON)
/// * `registration_token` - Registration token if applicable (for some registration flows)
/// * `status` - Current status of the registration (e.g., "active", "pending", "revoked")
/// * `supported_placements` - Array of supported placement types (JSON array)
/// * `supported_message_types` - Array of supported LTI message types (JSON array)
/// * `capabilities` - Object containing capability flags and settings (JSON object)
///
/// # Examples
///
/// ```
/// use atomic_lti::stores::registration_store::RegistrationData;
/// use serde_json::json;
///
/// let registration = RegistrationData {
///     platform_id: 1,
///     client_id: "abc123".to_string(),
///     deployment_id: Some("deployment-1".to_string()),
///     registration_config: json!({
///         "client_name": "My LTI Tool",
///         "redirect_uris": ["https://example.com/lti/launch"]
///     }),
///     registration_token: None,
///     status: "active".to_string(),
///     supported_placements: Some(json!(["course_navigation", "assignment_selection"])),
///     supported_message_types: Some(json!(["LtiResourceLinkRequest", "LtiDeepLinkingRequest"])),
///     capabilities: Some(json!({
///         "can_create_line_items": true,
///         "can_update_grades": true
///     })),
/// };
///
/// // Check if registration supports a placement
/// assert!(registration.supports_placement("course_navigation"));
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistrationData {
  /// Foreign key to platform
  pub platform_id: i32,

  /// OAuth2 client ID
  pub client_id: String,

  /// LTI deployment ID
  pub deployment_id: Option<String>,

  /// Full registration configuration from dynamic registration
  pub registration_config: JsonValue,

  /// Registration token (if applicable)
  pub registration_token: Option<String>,

  /// Registration status (e.g., "active", "pending", "revoked")
  pub status: String,

  /// Array of supported placement types
  pub supported_placements: Option<JsonValue>,

  /// Array of supported LTI message types
  pub supported_message_types: Option<JsonValue>,

  /// Object containing capability flags and settings
  pub capabilities: Option<JsonValue>,
}

impl RegistrationData {
  /// Check if this registration supports a specific placement
  ///
  /// # Arguments
  ///
  /// * `placement` - The placement type to check (e.g., "course_navigation", "assignment_selection")
  ///
  /// # Returns
  ///
  /// `true` if the placement is supported, `false` otherwise
  ///
  /// # Examples
  ///
  /// ```
  /// use atomic_lti::stores::registration_store::RegistrationData;
  /// use serde_json::json;
  ///
  /// let registration = RegistrationData {
  ///     platform_id: 1,
  ///     client_id: "abc123".to_string(),
  ///     deployment_id: None,
  ///     registration_config: json!({}),
  ///     registration_token: None,
  ///     status: "active".to_string(),
  ///     supported_placements: Some(json!(["course_navigation", "assignment_selection"])),
  ///     supported_message_types: None,
  ///     capabilities: None,
  /// };
  ///
  /// assert!(registration.supports_placement("course_navigation"));
  /// assert!(!registration.supports_placement("resource_selection"));
  /// ```
  pub fn supports_placement(&self, placement: &str) -> bool {
    if let Some(ref placements) = self.supported_placements {
      if let Some(array) = placements.as_array() {
        return array.iter().any(|p| p.as_str() == Some(placement));
      }
    }
    false
  }

  /// Check if this registration supports a specific message type
  ///
  /// # Arguments
  ///
  /// * `msg_type` - The LTI message type to check (e.g., "LtiResourceLinkRequest", "LtiDeepLinkingRequest")
  ///
  /// # Returns
  ///
  /// `true` if the message type is supported, `false` otherwise
  ///
  /// # Examples
  ///
  /// ```
  /// use atomic_lti::stores::registration_store::RegistrationData;
  /// use serde_json::json;
  ///
  /// let registration = RegistrationData {
  ///     platform_id: 1,
  ///     client_id: "abc123".to_string(),
  ///     deployment_id: None,
  ///     registration_config: json!({}),
  ///     registration_token: None,
  ///     status: "active".to_string(),
  ///     supported_placements: None,
  ///     supported_message_types: Some(json!(["LtiResourceLinkRequest", "LtiDeepLinkingRequest"])),
  ///     capabilities: None,
  /// };
  ///
  /// assert!(registration.supports_message_type("LtiResourceLinkRequest"));
  /// assert!(!registration.supports_message_type("LtiSubmissionReviewRequest"));
  /// ```
  pub fn supports_message_type(&self, msg_type: &str) -> bool {
    if let Some(ref message_types) = self.supported_message_types {
      if let Some(array) = message_types.as_array() {
        return array.iter().any(|m| m.as_str() == Some(msg_type));
      }
    }
    false
  }

  /// Get a specific capability value
  ///
  /// # Arguments
  ///
  /// * `key` - The capability key to retrieve
  ///
  /// # Returns
  ///
  /// The capability value if it exists, `None` otherwise
  ///
  /// # Examples
  ///
  /// ```
  /// use atomic_lti::stores::registration_store::RegistrationData;
  /// use serde_json::json;
  ///
  /// let registration = RegistrationData {
  ///     platform_id: 1,
  ///     client_id: "abc123".to_string(),
  ///     deployment_id: None,
  ///     registration_config: json!({}),
  ///     registration_token: None,
  ///     status: "active".to_string(),
  ///     supported_placements: None,
  ///     supported_message_types: None,
  ///     capabilities: Some(json!({
  ///         "can_create_line_items": true,
  ///         "max_score": 100
  ///     })),
  /// };
  ///
  /// assert_eq!(registration.get_capability("can_create_line_items"), Some(json!(true)));
  /// assert_eq!(registration.get_capability("nonexistent"), None);
  /// ```
  pub fn get_capability(&self, key: &str) -> Option<JsonValue> {
    self.capabilities.as_ref()?.get(key).cloned()
  }
}

/// Store trait for managing LTI tool registrations
///
/// This trait provides methods for storing and querying LTI registration data,
/// including lookups by client ID, platform association, and capability management.
///
/// # Examples
///
/// ```no_run
/// use atomic_lti::stores::registration_store::{RegistrationStore, RegistrationData};
/// use atomic_lti::errors::RegistrationError;
/// use serde_json::json;
/// use async_trait::async_trait;
///
/// # struct MyRegistrationStore;
/// # #[async_trait]
/// # impl RegistrationStore for MyRegistrationStore {
/// #     async fn find_by_client_id(&self, client_id: &str) -> Result<Option<RegistrationData>, RegistrationError> { todo!() }
/// #     async fn find_by_platform_and_client(&self, platform_id: i32, client_id: &str) -> Result<Option<RegistrationData>, RegistrationError> { todo!() }
/// #     async fn create(&self, registration: RegistrationData) -> Result<RegistrationData, RegistrationError> { todo!() }
/// #     async fn update_status(&self, client_id: &str, status: &str) -> Result<RegistrationData, RegistrationError> { todo!() }
/// #     async fn update_capabilities(&self, client_id: &str, capabilities: serde_json::Value) -> Result<RegistrationData, RegistrationError> { todo!() }
/// # }
/// #
/// async fn example(store: &dyn RegistrationStore) -> Result<(), RegistrationError> {
///     // Create a new registration
///     let registration = RegistrationData {
///         platform_id: 1,
///         client_id: "abc123".to_string(),
///         deployment_id: Some("deployment-1".to_string()),
///         registration_config: json!({"client_name": "My Tool"}),
///         registration_token: None,
///         status: "active".to_string(),
///         supported_placements: Some(json!(["course_navigation"])),
///         supported_message_types: Some(json!(["LtiResourceLinkRequest"])),
///         capabilities: Some(json!({"can_create_line_items": true})),
///     };
///
///     let created = store.create(registration).await?;
///
///     // Find by client ID
///     let found = store.find_by_client_id("abc123").await?;
///
///     // Update status
///     let updated = store.update_status("abc123", "revoked").await?;
///
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait RegistrationStore: Send + Sync {
  /// Find registration by client ID
  ///
  /// # Arguments
  ///
  /// * `client_id` - The OAuth2 client ID to search for
  ///
  /// # Returns
  ///
  /// * `Some(RegistrationData)` if a registration with the given client ID exists
  /// * `None` if no registration is found
  ///
  /// # Errors
  ///
  /// Returns `RegistrationError` if the underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::registration_store::RegistrationStore;
  /// # use atomic_lti::errors::RegistrationError;
  /// # async fn example(store: &dyn RegistrationStore) -> Result<(), RegistrationError> {
  /// if let Some(registration) = store.find_by_client_id("abc123").await? {
  ///     println!("Found registration for platform {}", registration.platform_id);
  /// }
  /// # Ok(())
  /// # }
  /// ```
  async fn find_by_client_id(
    &self,
    client_id: &str,
  ) -> Result<Option<RegistrationData>, RegistrationError>;

  /// Find registration by platform and client ID
  ///
  /// This method is useful when you need to ensure the registration belongs to a specific platform,
  /// which can be important for multi-tenant scenarios.
  ///
  /// # Arguments
  ///
  /// * `platform_id` - The platform ID to search for
  /// * `client_id` - The OAuth2 client ID to search for
  ///
  /// # Returns
  ///
  /// * `Some(RegistrationData)` if a registration matching both criteria exists
  /// * `None` if no matching registration is found
  ///
  /// # Errors
  ///
  /// Returns `RegistrationError` if the underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::registration_store::RegistrationStore;
  /// # use atomic_lti::errors::RegistrationError;
  /// # async fn example(store: &dyn RegistrationStore) -> Result<(), RegistrationError> {
  /// if let Some(registration) = store.find_by_platform_and_client(1, "abc123").await? {
  ///     println!("Found registration: {}", registration.client_id);
  /// }
  /// # Ok(())
  /// # }
  /// ```
  async fn find_by_platform_and_client(
    &self,
    platform_id: i32,
    client_id: &str,
  ) -> Result<Option<RegistrationData>, RegistrationError>;

  /// Create a new registration
  ///
  /// # Arguments
  ///
  /// * `registration` - The registration data to create
  ///
  /// # Returns
  ///
  /// The created registration data, potentially with additional fields populated by the store
  ///
  /// # Errors
  ///
  /// Returns `RegistrationError` if:
  /// * A registration with the same client ID already exists
  /// * The registration data is invalid
  /// * The underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::registration_store::{RegistrationStore, RegistrationData};
  /// # use atomic_lti::errors::RegistrationError;
  /// # use serde_json::json;
  /// # async fn example(store: &dyn RegistrationStore) -> Result<(), RegistrationError> {
  /// let registration = RegistrationData {
  ///     platform_id: 1,
  ///     client_id: "abc123".to_string(),
  ///     deployment_id: Some("deployment-1".to_string()),
  ///     registration_config: json!({"client_name": "My Tool"}),
  ///     registration_token: None,
  ///     status: "active".to_string(),
  ///     supported_placements: None,
  ///     supported_message_types: None,
  ///     capabilities: None,
  /// };
  /// let created = store.create(registration).await?;
  /// # Ok(())
  /// # }
  /// ```
  async fn create(
    &self,
    registration: RegistrationData,
  ) -> Result<RegistrationData, RegistrationError>;

  /// Update registration status
  ///
  /// # Arguments
  ///
  /// * `client_id` - The client ID of the registration to update
  /// * `status` - The new status (e.g., "active", "pending", "revoked")
  ///
  /// # Returns
  ///
  /// The updated registration data
  ///
  /// # Errors
  ///
  /// Returns `RegistrationError` if:
  /// * The registration does not exist
  /// * The underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::registration_store::RegistrationStore;
  /// # use atomic_lti::errors::RegistrationError;
  /// # async fn example(store: &dyn RegistrationStore) -> Result<(), RegistrationError> {
  /// let updated = store.update_status("abc123", "revoked").await?;
  /// assert_eq!(updated.status, "revoked");
  /// # Ok(())
  /// # }
  /// ```
  async fn update_status(
    &self,
    client_id: &str,
    status: &str,
  ) -> Result<RegistrationData, RegistrationError>;

  /// Update registration capabilities
  ///
  /// # Arguments
  ///
  /// * `client_id` - The client ID of the registration to update
  /// * `capabilities` - The new capabilities object (as JSON)
  ///
  /// # Returns
  ///
  /// The updated registration data
  ///
  /// # Errors
  ///
  /// Returns `RegistrationError` if:
  /// * The registration does not exist
  /// * The underlying storage operation fails
  ///
  /// # Examples
  ///
  /// ```no_run
  /// # use atomic_lti::stores::registration_store::RegistrationStore;
  /// # use atomic_lti::errors::RegistrationError;
  /// # use serde_json::json;
  /// # async fn example(store: &dyn RegistrationStore) -> Result<(), RegistrationError> {
  /// let new_capabilities = json!({
  ///     "can_create_line_items": true,
  ///     "can_update_grades": true,
  ///     "max_score": 100
  /// });
  /// let updated = store.update_capabilities("abc123", new_capabilities).await?;
  /// # Ok(())
  /// # }
  /// ```
  async fn update_capabilities(
    &self,
    client_id: &str,
    capabilities: JsonValue,
  ) -> Result<RegistrationData, RegistrationError>;
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;
  use std::collections::HashMap;
  use std::sync::{Arc, Mutex};

  /// In-memory test implementation of RegistrationStore
  #[derive(Clone)]
  struct InMemoryRegistrationStore {
    registrations: Arc<Mutex<HashMap<String, RegistrationData>>>,
  }

  impl InMemoryRegistrationStore {
    fn new() -> Self {
      Self {
        registrations: Arc::new(Mutex::new(HashMap::new())),
      }
    }
  }

  #[async_trait]
  impl RegistrationStore for InMemoryRegistrationStore {
    async fn find_by_client_id(
      &self,
      client_id: &str,
    ) -> Result<Option<RegistrationData>, RegistrationError> {
      let registrations = self.registrations.lock().unwrap();
      Ok(registrations.get(client_id).cloned())
    }

    async fn find_by_platform_and_client(
      &self,
      platform_id: i32,
      client_id: &str,
    ) -> Result<Option<RegistrationData>, RegistrationError> {
      let registrations = self.registrations.lock().unwrap();
      Ok(
        registrations
          .get(client_id)
          .filter(|r| r.platform_id == platform_id)
          .cloned(),
      )
    }

    async fn create(
      &self,
      registration: RegistrationData,
    ) -> Result<RegistrationData, RegistrationError> {
      let mut registrations = self.registrations.lock().unwrap();
      if registrations.contains_key(&registration.client_id) {
        return Err(RegistrationError::AlreadyExists(format!(
          "Registration with client_id {} already exists",
          registration.client_id
        )));
      }
      registrations.insert(registration.client_id.clone(), registration.clone());
      Ok(registration)
    }

    async fn update_status(
      &self,
      client_id: &str,
      status: &str,
    ) -> Result<RegistrationData, RegistrationError> {
      let mut registrations = self.registrations.lock().unwrap();
      let registration = registrations
        .get_mut(client_id)
        .ok_or_else(|| RegistrationError::NotFound(format!("Registration with client_id {} not found", client_id)))?;

      registration.status = status.to_string();
      Ok(registration.clone())
    }

    async fn update_capabilities(
      &self,
      client_id: &str,
      capabilities: JsonValue,
    ) -> Result<RegistrationData, RegistrationError> {
      let mut registrations = self.registrations.lock().unwrap();
      let registration = registrations
        .get_mut(client_id)
        .ok_or_else(|| RegistrationError::NotFound(format!("Registration with client_id {} not found", client_id)))?;

      registration.capabilities = Some(capabilities);
      Ok(registration.clone())
    }
  }

  fn create_test_registration(client_id: &str, platform_id: i32) -> RegistrationData {
    RegistrationData {
      platform_id,
      client_id: client_id.to_string(),
      deployment_id: Some(format!("deployment-{}", client_id)),
      registration_config: json!({
        "client_name": format!("Test Tool {}", client_id),
        "redirect_uris": [format!("https://example.com/{}/launch", client_id)]
      }),
      registration_token: None,
      status: "active".to_string(),
      supported_placements: Some(json!(["course_navigation", "assignment_selection"])),
      supported_message_types: Some(json!(["LtiResourceLinkRequest", "LtiDeepLinkingRequest"])),
      capabilities: Some(json!({
        "can_create_line_items": true,
        "can_update_grades": false
      })),
    }
  }

  #[tokio::test]
  async fn test_create_registration() {
    let store = InMemoryRegistrationStore::new();
    let registration = create_test_registration("client-1", 1);

    let created = store.create(registration.clone()).await.unwrap();
    assert_eq!(created.client_id, registration.client_id);
    assert_eq!(created.platform_id, registration.platform_id);
  }

  #[tokio::test]
  async fn test_create_duplicate_registration_fails() {
    let store = InMemoryRegistrationStore::new();
    let registration = create_test_registration("client-1", 1);

    store.create(registration.clone()).await.unwrap();
    let result = store.create(registration).await;
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), RegistrationError::AlreadyExists(_)));
  }

  #[tokio::test]
  async fn test_find_by_client_id() {
    let store = InMemoryRegistrationStore::new();
    let registration = create_test_registration("client-1", 1);

    store.create(registration.clone()).await.unwrap();

    let found = store.find_by_client_id("client-1").await.unwrap();
    assert!(found.is_some());
    assert_eq!(found.unwrap().client_id, "client-1");
  }

  #[tokio::test]
  async fn test_find_by_client_id_not_found() {
    let store = InMemoryRegistrationStore::new();

    let found = store.find_by_client_id("nonexistent").await.unwrap();
    assert!(found.is_none());
  }

  #[tokio::test]
  async fn test_find_by_platform_and_client() {
    let store = InMemoryRegistrationStore::new();
    let registration = create_test_registration("client-1", 1);

    store.create(registration.clone()).await.unwrap();

    let found = store
      .find_by_platform_and_client(1, "client-1")
      .await
      .unwrap();
    assert!(found.is_some());
    assert_eq!(found.unwrap().platform_id, 1);
  }

  #[tokio::test]
  async fn test_find_by_platform_and_client_wrong_platform() {
    let store = InMemoryRegistrationStore::new();
    let registration = create_test_registration("client-1", 1);

    store.create(registration.clone()).await.unwrap();

    let found = store
      .find_by_platform_and_client(2, "client-1")
      .await
      .unwrap();
    assert!(found.is_none());
  }

  #[tokio::test]
  async fn test_update_status() {
    let store = InMemoryRegistrationStore::new();
    let registration = create_test_registration("client-1", 1);

    store.create(registration).await.unwrap();

    let updated = store.update_status("client-1", "revoked").await.unwrap();
    assert_eq!(updated.status, "revoked");

    let found = store.find_by_client_id("client-1").await.unwrap().unwrap();
    assert_eq!(found.status, "revoked");
  }

  #[tokio::test]
  async fn test_update_status_not_found() {
    let store = InMemoryRegistrationStore::new();
    let result = store.update_status("nonexistent", "revoked").await;
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), RegistrationError::NotFound(_)));
  }

  #[tokio::test]
  async fn test_update_capabilities() {
    let store = InMemoryRegistrationStore::new();
    let registration = create_test_registration("client-1", 1);

    store.create(registration).await.unwrap();

    let new_capabilities = json!({
      "can_create_line_items": false,
      "can_update_grades": true,
      "max_score": 100
    });

    let updated = store
      .update_capabilities("client-1", new_capabilities.clone())
      .await
      .unwrap();
    assert_eq!(updated.capabilities, Some(new_capabilities.clone()));

    let found = store.find_by_client_id("client-1").await.unwrap().unwrap();
    assert_eq!(found.capabilities, Some(new_capabilities));
  }

  #[tokio::test]
  async fn test_update_capabilities_not_found() {
    let store = InMemoryRegistrationStore::new();
    let result = store.update_capabilities("nonexistent", json!({})).await;
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), RegistrationError::NotFound(_)));
  }

  #[test]
  fn test_supports_placement() {
    let registration = create_test_registration("client-1", 1);

    assert!(registration.supports_placement("course_navigation"));
    assert!(registration.supports_placement("assignment_selection"));
    assert!(!registration.supports_placement("resource_selection"));
  }

  #[test]
  fn test_supports_placement_none() {
    let mut registration = create_test_registration("client-1", 1);
    registration.supported_placements = None;

    assert!(!registration.supports_placement("course_navigation"));
  }

  #[test]
  fn test_supports_message_type() {
    let registration = create_test_registration("client-1", 1);

    assert!(registration.supports_message_type("LtiResourceLinkRequest"));
    assert!(registration.supports_message_type("LtiDeepLinkingRequest"));
    assert!(!registration.supports_message_type("LtiSubmissionReviewRequest"));
  }

  #[test]
  fn test_supports_message_type_none() {
    let mut registration = create_test_registration("client-1", 1);
    registration.supported_message_types = None;

    assert!(!registration.supports_message_type("LtiResourceLinkRequest"));
  }

  #[test]
  fn test_get_capability() {
    let registration = create_test_registration("client-1", 1);

    assert_eq!(
      registration.get_capability("can_create_line_items"),
      Some(json!(true))
    );
    assert_eq!(
      registration.get_capability("can_update_grades"),
      Some(json!(false))
    );
    assert_eq!(registration.get_capability("nonexistent"), None);
  }

  #[test]
  fn test_get_capability_none() {
    let mut registration = create_test_registration("client-1", 1);
    registration.capabilities = None;

    assert_eq!(registration.get_capability("can_create_line_items"), None);
  }
}
