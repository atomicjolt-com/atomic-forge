/// Integration tests for LTI provisioning service
/// Tests the Just-In-Time (JIT) provisioning of tenants, courses, and users
use atomic_decay::services::lti_provisioning::LtiProvisioningService;
use atomic_decay::tests::{setup_test_db, create_test_id_token, create_tool_jwt_from_id_token, TestContext, TestGuard};
use serde_json::json;

#[tokio::test]
async fn test_provision_tenant_creates_new_tenant() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("provision_tenant");

  // Create test ID token
  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");
  let user_id = ctx.unique_key("user");

  let id_token = create_test_id_token(&issuer, &client_id, &user_id);
  let jwt_claims = create_tool_jwt_from_id_token(&id_token);

  // Create provisioning service
  let service = LtiProvisioningService::new(pool.clone());

  // Provision tenant
  let tenant = service
    .provision_tenant(&jwt_claims)
    .await
    .expect("Failed to provision tenant");

  guard.track_tenant(tenant.id);

  // Verify tenant was created with correct data
  assert!(tenant.slug.len() > 0);
  assert_eq!(tenant.platform_iss, issuer);
  assert_eq!(tenant.client_id, client_id);

  // Test idempotency - provisioning again should return same tenant
  let tenant2 = service
    .provision_tenant(&jwt_claims)
    .await
    .expect("Failed to provision tenant second time");

  assert_eq!(tenant.id, tenant2.id, "Should return existing tenant");

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_provision_course_creates_new_course() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("provision_course");

  // Setup test data
  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");
  let user_id = ctx.unique_key("user");
  let context_id = ctx.unique_key("context");

  let id_token = create_test_id_token(&issuer, &client_id, &user_id);
  let mut jwt_claims = create_tool_jwt_from_id_token(&id_token);

  // Add context to claims
  jwt_claims.context = Some(atomic_lti::id_token::ContextClaim {
    id: context_id.clone(),
    label: Some("Test Course".to_string()),
    title: Some("Test Course Title".to_string()),
    r#type: Some(vec!["CourseOffering".to_string()]),
    validation_context: None,
    errors: None,
  });

  let service = LtiProvisioningService::new(pool.clone());

  // Provision tenant first
  let tenant = service
    .provision_tenant(&jwt_claims)
    .await
    .expect("Failed to provision tenant");
  guard.track_tenant(tenant.id);

  // Provision course
  let course = service
    .provision_course(
      tenant.id,
      jwt_claims.context.as_ref().map(|c| c.id.as_str()),
      Some("Test Course Title"),
    )
    .await
    .expect("Failed to provision course")
    .expect("Course should be created");

  guard.track_course(course.id);

  // Verify course was created
  assert_eq!(course.tenant_id, tenant.id);
  assert_eq!(course.lti_context_id, Some(context_id.clone()));
  assert_eq!(course.title, Some("Test Course Title".to_string()));

  // Test idempotency - provisioning again should return same course
  let course2 = service
    .provision_course(
      tenant.id,
      jwt_claims.context.as_ref().map(|c| c.id.as_str()),
      Some("Updated Title"),
    )
    .await
    .expect("Failed to provision course second time")
    .expect("Course should exist");

  assert_eq!(course.id, course2.id, "Should return existing course");
  // Title should be updated
  assert_eq!(course2.title, Some("Updated Title".to_string()));

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_provision_course_returns_none_when_no_context() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("provision_no_context");

  // Setup test data without context
  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");
  let user_id = ctx.unique_key("user");

  let id_token = create_test_id_token(&issuer, &client_id, &user_id);
  let mut jwt_claims = create_tool_jwt_from_id_token(&id_token);
  jwt_claims.context = None;

  let service = LtiProvisioningService::new(pool.clone());

  // Provision tenant first
  let tenant = service
    .provision_tenant(&jwt_claims)
    .await
    .expect("Failed to provision tenant");
  guard.track_tenant(tenant.id);

  // Provision course should return None
  let course = service
    .provision_course(tenant.id, None, None)
    .await
    .expect("Failed to call provision_course");

  assert!(course.is_none(), "Should return None when no context");

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_provision_user_creates_new_user() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("provision_user");

  // Setup test data
  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");
  let user_id = ctx.unique_key("user");

  let id_token = create_test_id_token(&issuer, &client_id, &user_id);
  let mut jwt_claims = create_tool_jwt_from_id_token(&id_token);

  // Set user data
  jwt_claims.email = Some("test@example.com".to_string());
  jwt_claims.name = Some("Test User".to_string());
  jwt_claims.roles = Some(vec![
    "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string(),
  ]);

  let service = LtiProvisioningService::new(pool.clone());

  // Provision tenant first
  let tenant = service
    .provision_tenant(&jwt_claims)
    .await
    .expect("Failed to provision tenant");
  guard.track_tenant(tenant.id);

  // Provision user
  let user = service
    .provision_user(tenant.id, &jwt_claims)
    .await
    .expect("Failed to provision user");

  guard.track_user(user.id);

  // Verify user was created
  assert_eq!(user.tenant_id, tenant.id);
  assert_eq!(user.lti_user_id, Some(user_id.clone()));
  assert_eq!(user.email, Some("test@example.com".to_string()));
  assert_eq!(user.name, Some("Test User".to_string()));

  // Test idempotency - provisioning again should return same user
  let user2 = service
    .provision_user(tenant.id, &jwt_claims)
    .await
    .expect("Failed to provision user second time");

  assert_eq!(user.id, user2.id, "Should return existing user");

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_complete_provisioning_flow() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("complete_flow");

  // Setup complete LTI launch data
  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");
  let user_id = ctx.unique_key("user");
  let context_id = ctx.unique_key("context");

  let id_token = create_test_id_token(&issuer, &client_id, &user_id);
  let mut jwt_claims = create_tool_jwt_from_id_token(&id_token);

  jwt_claims.context = Some(atomic_lti::id_token::ContextClaim {
    id: context_id.clone(),
    label: Some("Complete Test Course".to_string()),
    title: Some("Complete Test Course".to_string()),
    r#type: Some(vec!["CourseOffering".to_string()]),
    validation_context: None,
    errors: None,
  });

  jwt_claims.email = Some("complete@example.com".to_string());
  jwt_claims.name = Some("Complete Test User".to_string());
  jwt_claims.roles = Some(vec![
    "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor".to_string(),
  ]);

  let service = LtiProvisioningService::new(pool.clone());

  // Provision in order: Tenant -> Course -> User
  let tenant = service
    .provision_tenant(&jwt_claims)
    .await
    .expect("Failed to provision tenant");
  guard.track_tenant(tenant.id);

  let course = service
    .provision_course(
      tenant.id,
      jwt_claims.context.as_ref().map(|c| c.id.as_str()),
      jwt_claims.context.as_ref().and_then(|c| c.title.as_deref()),
    )
    .await
    .expect("Failed to provision course")
    .expect("Course should be created");
  guard.track_course(course.id);

  let user = service
    .provision_user(tenant.id, &jwt_claims)
    .await
    .expect("Failed to provision user");
  guard.track_user(user.id);

  // Verify all resources are correctly linked
  assert_eq!(course.tenant_id, tenant.id);
  assert_eq!(user.tenant_id, tenant.id);

  // Verify tenant isolation - different client_id should create different tenant
  let client_id2 = ctx.unique_key("client2");
  let mut jwt_claims2 = jwt_claims.clone();
  jwt_claims2.aud = vec![client_id2.clone()];

  let tenant2 = service
    .provision_tenant(&jwt_claims2)
    .await
    .expect("Failed to provision tenant2");
  guard.track_tenant(tenant2.id);

  assert_ne!(tenant.id, tenant2.id, "Different clients should get different tenants");
  assert_eq!(tenant2.client_id, client_id2);

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_tenant_slug_generation() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("slug_gen");

  let issuer = "https://canvas.instructure.com".to_string();
  let client_id = ctx.unique_key("client");
  let user_id = ctx.unique_key("user");

  let id_token = create_test_id_token(&issuer, &client_id, &user_id);
  let jwt_claims = create_tool_jwt_from_id_token(&id_token);

  let service = LtiProvisioningService::new(pool.clone());

  let tenant = service
    .provision_tenant(&jwt_claims)
    .await
    .expect("Failed to provision tenant");
  guard.track_tenant(tenant.id);

  // Verify slug generation
  assert!(tenant.slug.contains("canvas-instructure-com"));
  assert!(tenant.slug.len() <= 50, "Slug should not exceed 50 chars");

  guard.cleanup().await.expect("Cleanup failed");
}
