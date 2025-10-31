use crate::db::{get_connection, Pool};
use crate::models::lti_registration::{LtiRegistration, NewLtiRegistration};
use async_trait::async_trait;
use atomic_lti::errors::RegistrationError;
use atomic_lti::stores::registration_store::{RegistrationData, RegistrationStore};

pub struct DBRegistrationStore {
  pool: Pool,
}

impl DBRegistrationStore {
  pub fn new(pool: Pool) -> Self {
    Self { pool }
  }

  /// Convert LtiRegistration model to RegistrationData trait type
  fn to_registration_data(reg: LtiRegistration) -> RegistrationData {
    RegistrationData {
      platform_id: reg.platform_id as i32, // Convert i64 to i32 for trait compatibility
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
    let mut conn = get_connection(&self.pool)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    let registration = LtiRegistration::find_by_client_id(&mut conn, client_id)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(registration.map(Self::to_registration_data))
  }

  async fn find_by_platform_and_client(
    &self,
    platform_id: i32,
    client_id: &str,
  ) -> Result<Option<RegistrationData>, RegistrationError> {
    let mut conn = get_connection(&self.pool)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    let registration =
      LtiRegistration::find_by_platform_and_client(&mut conn, platform_id as i64, client_id)
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

    let mut conn = get_connection(&self.pool)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    let new_registration = NewLtiRegistration {
      platform_id: registration.platform_id as i64,
      client_id: &registration.client_id,
      deployment_id: registration.deployment_id.as_deref(),
      registration_config: &registration.registration_config,
      registration_token: registration.registration_token.as_deref(),
      status: &registration.status,
      supported_placements: registration.supported_placements.as_ref(),
      supported_message_types: registration.supported_message_types.as_ref(),
      capabilities: registration.capabilities.as_ref(),
    };

    let created = LtiRegistration::create(&mut conn, new_registration)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(Self::to_registration_data(created))
  }

  async fn update_status(
    &self,
    client_id: &str,
    status: &str,
  ) -> Result<RegistrationData, RegistrationError> {
    let mut conn = get_connection(&self.pool)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    let registration = LtiRegistration::find_by_client_id(&mut conn, client_id)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?
      .ok_or_else(|| {
        RegistrationError::NotFound(format!("Registration with client_id {} not found", client_id))
      })?;

    let updated = registration
      .update_status(&mut conn, status)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(Self::to_registration_data(updated))
  }

  async fn update_capabilities(
    &self,
    client_id: &str,
    capabilities: serde_json::Value,
  ) -> Result<RegistrationData, RegistrationError> {
    let mut conn = get_connection(&self.pool)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    let registration = LtiRegistration::find_by_client_id(&mut conn, client_id)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?
      .ok_or_else(|| {
        RegistrationError::NotFound(format!("Registration with client_id {} not found", client_id))
      })?;

    let updated = registration
      .update_capabilities(&mut conn, &capabilities)
      .map_err(|e| RegistrationError::DatabaseError(e.to_string()))?;

    Ok(Self::to_registration_data(updated))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::models::lti_platform::{LtiPlatform, NewLtiPlatform};
  use crate::tests::db_test_helpers::setup_test_db;
  use serde_json::json;
  use uuid;

  fn setup_test_platform(pool: &Pool) -> i64 {
    let mut conn = get_connection(pool).unwrap();

    // Create a test platform
    let unique_suffix = uuid::Uuid::new_v4();
    let new_platform = NewLtiPlatform {
      issuer: &format!("https://test-registration-store-{}.example.com", unique_suffix),
      name: Some("Test Platform"),
      jwks_url: "https://test.example.com/jwks",
      token_url: "https://test.example.com/token",
      oidc_url: "https://test.example.com/oidc",
    };

    let platform = LtiPlatform::create(&mut conn, new_platform).unwrap();
    platform.id
  }

  #[tokio::test]
  async fn test_create_registration() {
    let pool = setup_test_db();
    let platform_id = setup_test_platform(&pool);
    let store = DBRegistrationStore::new(pool);

    let unique_suffix = uuid::Uuid::new_v4();
    let registration_data = RegistrationData {
      platform_id: platform_id as i32,
      client_id: format!("test-client-{}", unique_suffix),
      deployment_id: Some("deployment-1".to_string()),
      registration_config: json!({"client_name": "Test Tool"}),
      registration_token: None,
      status: "active".to_string(),
      supported_placements: Some(json!(["course_navigation", "assignment_selection"])),
      supported_message_types: Some(json!(["LtiResourceLinkRequest"])),
      capabilities: Some(json!({"can_create_line_items": true})),
    };

    let created = store.create(registration_data.clone()).await.unwrap();
    assert_eq!(created.client_id, registration_data.client_id);
    assert_eq!(created.platform_id, platform_id as i32);
    assert_eq!(created.status, "active");
  }

  #[tokio::test]
  async fn test_create_duplicate_registration_fails() {
    let pool = setup_test_db();
    let platform_id = setup_test_platform(&pool);
    let store = DBRegistrationStore::new(pool);

    let unique_suffix = uuid::Uuid::new_v4();
    let registration_data = RegistrationData {
      platform_id: platform_id as i32,
      client_id: format!("test-client-dup-{}", unique_suffix),
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
    let pool = setup_test_db();
    let platform_id = setup_test_platform(&pool);
    let store = DBRegistrationStore::new(pool);

    let unique_suffix = uuid::Uuid::new_v4();
    let client_id = format!("test-client-find-{}", unique_suffix);
    let registration_data = RegistrationData {
      platform_id: platform_id as i32,
      client_id: client_id.clone(),
      deployment_id: Some("deployment-find".to_string()),
      registration_config: json!({}),
      registration_token: None,
      status: "active".to_string(),
      supported_placements: None,
      supported_message_types: None,
      capabilities: None,
    };

    store.create(registration_data.clone()).await.unwrap();

    let found = store.find_by_client_id(&client_id).await.unwrap();
    assert!(found.is_some());
    let found = found.unwrap();
    assert_eq!(found.client_id, client_id);
    assert_eq!(found.deployment_id, Some("deployment-find".to_string()));
  }

  #[tokio::test]
  async fn test_find_by_platform_and_client() {
    let pool = setup_test_db();
    let platform_id = setup_test_platform(&pool);
    let store = DBRegistrationStore::new(pool);

    let unique_suffix = uuid::Uuid::new_v4();
    let client_id = format!("test-client-platform-{}", unique_suffix);
    let registration_data = RegistrationData {
      platform_id: platform_id as i32,
      client_id: client_id.clone(),
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
      .find_by_platform_and_client(platform_id as i32, &client_id)
      .await
      .unwrap();
    assert!(found.is_some());

    // Test with wrong platform
    let not_found = store
      .find_by_platform_and_client(999, &client_id)
      .await
      .unwrap();
    assert!(not_found.is_none());
  }

  #[tokio::test]
  async fn test_update_status() {
    let pool = setup_test_db();
    let platform_id = setup_test_platform(&pool);
    let store = DBRegistrationStore::new(pool);

    let unique_suffix = uuid::Uuid::new_v4();
    let client_id = format!("test-client-status-{}", unique_suffix);
    let registration_data = RegistrationData {
      platform_id: platform_id as i32,
      client_id: client_id.clone(),
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
      .update_status(&client_id, "active")
      .await
      .unwrap();
    assert_eq!(updated.status, "active");

    let found = store
      .find_by_client_id(&client_id)
      .await
      .unwrap()
      .unwrap();
    assert_eq!(found.status, "active");
  }

  #[tokio::test]
  async fn test_update_capabilities() {
    let pool = setup_test_db();
    let platform_id = setup_test_platform(&pool);
    let store = DBRegistrationStore::new(pool);

    let unique_suffix = uuid::Uuid::new_v4();
    let client_id = format!("test-client-caps-{}", unique_suffix);
    let registration_data = RegistrationData {
      platform_id: platform_id as i32,
      client_id: client_id.clone(),
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
      .update_capabilities(&client_id, new_capabilities.clone())
      .await
      .unwrap();
    assert_eq!(updated.capabilities, Some(new_capabilities.clone()));

    let found = store
      .find_by_client_id(&client_id)
      .await
      .unwrap()
      .unwrap();
    assert_eq!(found.capabilities, Some(new_capabilities));
  }

  #[test]
  fn test_jsonb_helper_methods() {
    let pool = setup_test_db();
    let platform_id = setup_test_platform(&pool);
    let mut conn = get_connection(&pool).unwrap();

    let unique_suffix = uuid::Uuid::new_v4();
    let new_registration = NewLtiRegistration {
      platform_id,
      client_id: &format!("test-client-helpers-{}", unique_suffix),
      deployment_id: None,
      registration_config: &json!({}),
      registration_token: None,
      status: "active",
      supported_placements: Some(&json!(["course_navigation", "assignment_selection"])),
      supported_message_types: Some(&json!(["LtiResourceLinkRequest", "LtiDeepLinkingRequest"])),
      capabilities: Some(&json!({"can_create_line_items": true, "max_score": 100})),
    };

    let registration = LtiRegistration::create(&mut conn, new_registration).unwrap();

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
