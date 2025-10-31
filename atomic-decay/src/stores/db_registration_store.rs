use crate::models::lti_registration::LtiRegistration;
use async_trait::async_trait;
use atomic_lti::errors::RegistrationError;
use atomic_lti::stores::registration_store::{RegistrationData, RegistrationStore};
use sqlx::PgPool;

pub struct DBRegistrationStore {
  pool: PgPool,
}

impl DBRegistrationStore {
  pub fn new(pool: PgPool) -> Self {
    Self { pool }
  }

  /// Convert LtiRegistration model to RegistrationData trait type
  fn to_registration_data(reg: LtiRegistration) -> RegistrationData {
    RegistrationData {
      platform_id: reg.platform_id,
      client_id: reg.client_id,
      deployment_id: reg.deployment_id,
      registration_config: reg.registration_config,
      registration_token: reg.registration_token,
      status: reg.status,
      supported_placements: reg.supported_placements,
      supported_message_types: reg.supported_message_types,
      capabilities: reg.capabilities,
    }
  }
}

#[async_trait]
impl RegistrationStore for DBRegistrationStore {
  async fn find_by_client_id(
    &self,
    client_id: &str,
  ) -> Result<Option<RegistrationData>, RegistrationError> {
    let registration = LtiRegistration::find_by_client_id(&self.pool, client_id)
      .await
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(registration.map(Self::to_registration_data))
  }

  async fn find_by_platform_and_client(
    &self,
    platform_id: i32,
    client_id: &str,
  ) -> Result<Option<RegistrationData>, RegistrationError> {
    let registration =
      LtiRegistration::find_by_platform_and_client(&self.pool, platform_id, client_id)
        .await
        .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(registration.map(Self::to_registration_data))
  }

  async fn create(
    &self,
    registration: RegistrationData,
  ) -> Result<RegistrationData, RegistrationError> {
    // Check if registration already exists
    if let Some(_existing) = self.find_by_client_id(&registration.client_id).await? {
      return Err(RegistrationError::AlreadyExists(format!(
        "Registration with client_id {} already exists",
        registration.client_id
      )));
    }

    let created = LtiRegistration::create_with_capabilities(
      &self.pool,
      registration.platform_id,
      &registration.client_id,
      registration.deployment_id.as_deref(),
      &registration.registration_config,
      registration.registration_token.as_deref(),
      &registration.status,
      registration.supported_placements.as_ref(),
      registration.supported_message_types.as_ref(),
      registration.capabilities.as_ref(),
    )
    .await
    .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(Self::to_registration_data(created))
  }

  async fn update_status(
    &self,
    client_id: &str,
    status: &str,
  ) -> Result<RegistrationData, RegistrationError> {
    let registration = LtiRegistration::find_by_client_id(&self.pool, client_id)
      .await
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?
      .ok_or_else(|| {
        RegistrationError::NotFound(format!("Registration with client_id {} not found", client_id))
      })?;

    let updated = registration
      .update_status(&self.pool, status)
      .await
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(Self::to_registration_data(updated))
  }

  async fn update_capabilities(
    &self,
    client_id: &str,
    capabilities: serde_json::Value,
  ) -> Result<RegistrationData, RegistrationError> {
    let registration = LtiRegistration::find_by_client_id(&self.pool, client_id)
      .await
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?
      .ok_or_else(|| {
        RegistrationError::NotFound(format!("Registration with client_id {} not found", client_id))
      })?;

    let updated = registration
      .update_capabilities(&self.pool, &capabilities)
      .await
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(Self::to_registration_data(updated))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::models::lti_platform::LtiPlatform;
  use crate::tests::helpers::test_helpers::setup_test_db;
  use serde_json::json;

  async fn setup_test_platform(pool: &PgPool) -> i32 {
    // Create a test platform
    let platform = LtiPlatform::create(
      pool,
      "https://test-registration-store.example.com",
      Some("Test Platform"),
      "https://test-registration-store.example.com/jwks",
      "https://test-registration-store.example.com/token",
      "https://test-registration-store.example.com/oidc",
    )
    .await
    .unwrap();
    platform.id
  }

  #[tokio::test]
  async fn test_create_registration() {
    let pool = setup_test_db().await;
    let platform_id = setup_test_platform(&pool).await;
    let store = DBRegistrationStore::new(pool.clone());

    let registration_data = RegistrationData {
      platform_id,
      client_id: "test-client-1".to_string(),
      deployment_id: Some("deployment-1".to_string()),
      registration_config: json!({"client_name": "Test Tool"}),
      registration_token: None,
      status: "active".to_string(),
      supported_placements: Some(json!(["course_navigation", "assignment_selection"])),
      supported_message_types: Some(json!(["LtiResourceLinkRequest"])),
      capabilities: Some(json!({"can_create_line_items": true})),
    };

    let created = store.create(registration_data.clone()).await.unwrap();
    assert_eq!(created.client_id, "test-client-1");
    assert_eq!(created.platform_id, platform_id);
    assert_eq!(created.status, "active");
  }

  #[tokio::test]
  async fn test_create_duplicate_registration_fails() {
    let pool = setup_test_db().await;
    let platform_id = setup_test_platform(&pool).await;
    let store = DBRegistrationStore::new(pool.clone());

    let registration_data = RegistrationData {
      platform_id,
      client_id: "test-client-dup".to_string(),
      deployment_id: None,
      registration_config: json!({}),
      registration_token: None,
      status: "pending".to_string(),
      supported_placements: None,
      supported_message_types: None,
      capabilities: None,
    };

    store.create(registration_data.clone()).await.unwrap();
    let result = store.create(registration_data).await;
    assert!(result.is_err());
    assert!(matches!(
      result.unwrap_err(),
      RegistrationError::AlreadyExists(_)
    ));
  }

  #[tokio::test]
  async fn test_find_by_client_id() {
    let pool = setup_test_db().await;
    let platform_id = setup_test_platform(&pool).await;
    let store = DBRegistrationStore::new(pool.clone());

    let registration_data = RegistrationData {
      platform_id,
      client_id: "test-client-find".to_string(),
      deployment_id: Some("deployment-find".to_string()),
      registration_config: json!({}),
      registration_token: None,
      status: "active".to_string(),
      supported_placements: None,
      supported_message_types: None,
      capabilities: None,
    };

    store.create(registration_data.clone()).await.unwrap();

    let found = store.find_by_client_id("test-client-find").await.unwrap();
    assert!(found.is_some());
    let found = found.unwrap();
    assert_eq!(found.client_id, "test-client-find");
    assert_eq!(found.deployment_id, Some("deployment-find".to_string()));
  }

  #[tokio::test]
  async fn test_find_by_platform_and_client() {
    let pool = setup_test_db().await;
    let platform_id = setup_test_platform(&pool).await;
    let store = DBRegistrationStore::new(pool.clone());

    let registration_data = RegistrationData {
      platform_id,
      client_id: "test-client-platform".to_string(),
      deployment_id: None,
      registration_config: json!({}),
      registration_token: None,
      status: "active".to_string(),
      supported_placements: None,
      supported_message_types: None,
      capabilities: None,
    };

    store.create(registration_data.clone()).await.unwrap();

    let found = store
      .find_by_platform_and_client(platform_id, "test-client-platform")
      .await
      .unwrap();
    assert!(found.is_some());

    // Test with wrong platform
    let not_found = store
      .find_by_platform_and_client(999, "test-client-platform")
      .await
      .unwrap();
    assert!(not_found.is_none());
  }

  #[tokio::test]
  async fn test_update_status() {
    let pool = setup_test_db().await;
    let platform_id = setup_test_platform(&pool).await;
    let store = DBRegistrationStore::new(pool.clone());

    let registration_data = RegistrationData {
      platform_id,
      client_id: "test-client-status".to_string(),
      deployment_id: None,
      registration_config: json!({}),
      registration_token: None,
      status: "pending".to_string(),
      supported_placements: None,
      supported_message_types: None,
      capabilities: None,
    };

    store.create(registration_data).await.unwrap();

    let updated = store
      .update_status("test-client-status", "active")
      .await
      .unwrap();
    assert_eq!(updated.status, "active");

    let found = store
      .find_by_client_id("test-client-status")
      .await
      .unwrap()
      .unwrap();
    assert_eq!(found.status, "active");
  }

  #[tokio::test]
  async fn test_update_capabilities() {
    let pool = setup_test_db().await;
    let platform_id = setup_test_platform(&pool).await;
    let store = DBRegistrationStore::new(pool.clone());

    let registration_data = RegistrationData {
      platform_id,
      client_id: "test-client-caps".to_string(),
      deployment_id: None,
      registration_config: json!({}),
      registration_token: None,
      status: "active".to_string(),
      supported_placements: None,
      supported_message_types: None,
      capabilities: Some(json!({"can_create_line_items": false})),
    };

    store.create(registration_data).await.unwrap();

    let new_capabilities = json!({
      "can_create_line_items": true,
      "can_update_grades": true,
      "max_score": 100
    });

    let updated = store
      .update_capabilities("test-client-caps", new_capabilities.clone())
      .await
      .unwrap();
    assert_eq!(updated.capabilities, Some(new_capabilities.clone()));

    let found = store
      .find_by_client_id("test-client-caps")
      .await
      .unwrap()
      .unwrap();
    assert_eq!(found.capabilities, Some(new_capabilities));
  }

  #[tokio::test]
  async fn test_jsonb_helper_methods() {
    let pool = setup_test_db().await;
    let platform_id = setup_test_platform(&pool).await;

    let registration = LtiRegistration::create_with_capabilities(
      &pool,
      platform_id,
      "test-client-helpers",
      None,
      &json!({}),
      None,
      "active",
      Some(&json!(["course_navigation", "assignment_selection"])),
      Some(&json!(["LtiResourceLinkRequest", "LtiDeepLinkingRequest"])),
      Some(&json!({"can_create_line_items": true, "max_score": 100})),
    )
    .await
    .unwrap();

    // Test supports_placement
    assert!(registration.supports_placement("course_navigation"));
    assert!(registration.supports_placement("assignment_selection"));
    assert!(!registration.supports_placement("resource_selection"));

    // Test supports_message_type
    assert!(registration.supports_message_type("LtiResourceLinkRequest"));
    assert!(registration.supports_message_type("LtiDeepLinkingRequest"));
    assert!(!registration.supports_message_type("LtiSubmissionReviewRequest"));

    // Test get_capability
    assert_eq!(
      registration.get_capability("can_create_line_items"),
      Some(json!(true))
    );
    assert_eq!(registration.get_capability("max_score"), Some(json!(100)));
    assert_eq!(registration.get_capability("nonexistent"), None);
  }
}
