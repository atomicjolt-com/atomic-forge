/// Integration tests for LTI platform and registration stores
/// Tests CRUD operations for platforms and registrations
use atomic_decay::models::{LtiPlatform, LtiRegistration};
use atomic_decay::tests::{setup_test_db, TestContext, TestGuard, create_test_platform, create_test_registration};
use serde_json::json;

// ============================================================================
// Platform CRUD Tests
// ============================================================================

#[tokio::test]
async fn test_platform_create() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("platform_create");

  let issuer = ctx.unique_key("issuer");

  let platform = create_test_platform(&pool, &format!("https://{}.example.com", issuer)).await;
  guard.track_platform(platform.id.into());

  assert!(platform.id > 0);
  assert!(platform.issuer.contains(&issuer));
  assert!(platform.name.is_some());

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_platform_find_by_issuer() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("platform_find");

  let issuer = ctx.unique_key("issuer");
  let issuer_url = format!("https://{}.example.com", issuer);

  let created = create_test_platform(&pool, &issuer_url).await;
  guard.track_platform(created.id.into());

  // Find by issuer
  let found = LtiPlatform::find_by_issuer(&pool, &issuer_url)
    .await
    .expect("Failed to find platform")
    .expect("Platform should exist");

  assert_eq!(found.id, created.id);
  assert_eq!(found.issuer, created.issuer);

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_platform_find_by_issuer_not_found() {
  let pool = setup_test_db().await;
  let ctx = TestContext::new("platform_not_found");

  let result = LtiPlatform::find_by_issuer(&pool, &ctx.unique_key("nonexistent"))
    .await
    .expect("Query should succeed");

  assert!(result.is_none(), "Should return None for non-existent issuer");
}

#[tokio::test]
async fn test_platform_update() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("platform_update");

  let issuer = ctx.unique_key("issuer");
  let issuer_url = format!("https://{}.example.com", issuer);

  let platform = create_test_platform(&pool, &issuer_url).await;
  guard.track_platform(platform.id.into());

  // Update platform
  let updated = LtiPlatform::update(
    &pool,
    &issuer_url,
    Some("Updated Platform Name"),
    &format!("{}/updated/jwks", issuer_url),
    &format!("{}/updated/token", issuer_url),
    &format!("{}/updated/oidc", issuer_url),
  )
  .await
  .expect("Failed to update platform");

  assert_eq!(updated.name, Some("Updated Platform Name".to_string()));
  assert!(updated.jwks_url.contains("/updated/jwks"));

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_platform_delete() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("platform_delete");

  let issuer = ctx.unique_key("issuer");
  let issuer_url = format!("https://{}.example.com", issuer);

  let platform = create_test_platform(&pool, &issuer_url).await;
  let platform_id = platform.id;

  // Delete platform
  LtiPlatform::delete(&pool, &issuer_url)
    .await
    .expect("Failed to delete platform");

  // Verify deletion
  let found = LtiPlatform::find_by_issuer(&pool, &issuer_url)
    .await
    .expect("Query should succeed");

  assert!(found.is_none(), "Platform should be deleted");

  // Mark as done since we already deleted
  guard.mark_cleanup_done();
}

#[tokio::test]
async fn test_platform_list() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("platform_list");

  // Create multiple platforms
  let platform1 = create_test_platform(&pool, &ctx.unique_key("issuer1")).await;
  let platform2 = create_test_platform(&pool, &ctx.unique_key("issuer2")).await;
  let platform3 = create_test_platform(&pool, &ctx.unique_key("issuer3")).await;

  guard.track_platform(platform1.id.into());
  guard.track_platform(platform2.id.into());
  guard.track_platform(platform3.id.into());

  // List all platforms
  let platforms = LtiPlatform::list(&pool)
    .await
    .expect("Failed to list platforms");

  // Should have at least our 3 platforms
  assert!(platforms.len() >= 3);

  // Verify our platforms are in the list
  let our_ids: Vec<i32> = vec![platform1.id, platform2.id, platform3.id];
  let found_ids: Vec<i32> = platforms.iter().map(|p| p.id).collect();

  for id in our_ids {
    assert!(found_ids.contains(&id), "Platform {} should be in list", id);
  }

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_platform_unique_issuer_constraint() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("platform_unique");

  let issuer = ctx.unique_key("issuer");
  let issuer_url = format!("https://{}.example.com", issuer);

  let platform = create_test_platform(&pool, &issuer_url).await;
  guard.track_platform(platform.id.into());

  // Try to create another platform with same issuer
  let result = LtiPlatform::create(
    &pool,
    &issuer_url,
    Some("Duplicate Platform"),
    &format!("{}/jwks", issuer_url),
    &format!("{}/token", issuer_url),
    &format!("{}/oidc", issuer_url),
  )
  .await;

  assert!(result.is_err(), "Should fail to create duplicate issuer");

  guard.cleanup().await.expect("Cleanup failed");
}

// ============================================================================
// Registration CRUD Tests
// ============================================================================

#[tokio::test]
async fn test_registration_create() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("registration_create");

  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");

  let platform = create_test_platform(&pool, &format!("https://{}.example.com", issuer)).await;
  guard.track_platform(platform.id.into());

  let registration = create_test_registration(&pool, platform.id, &client_id).await;
  guard.track_registration(registration.id.into());

  assert!(registration.id > 0);
  assert_eq!(registration.platform_id, platform.id);
  assert_eq!(registration.client_id, client_id);

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_registration_find_by_client_id() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("registration_find");

  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");

  let platform = create_test_platform(&pool, &format!("https://{}.example.com", issuer)).await;
  guard.track_platform(platform.id.into());

  let created = create_test_registration(&pool, platform.id, &client_id).await;
  guard.track_registration(created.id.into());

  // Find by client_id
  let found = LtiRegistration::find_by_client_id(&pool, &client_id)
    .await
    .expect("Failed to find registration")
    .expect("Registration should exist");

  assert_eq!(found.id, created.id);
  assert_eq!(found.client_id, created.client_id);

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_registration_with_capabilities() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("registration_capabilities");

  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");

  let platform = create_test_platform(&pool, &format!("https://{}.example.com", issuer)).await;
  guard.track_platform(platform.id.into());

  let registration_config = json!({
    "client_name": "Test Tool",
    "redirect_uris": ["https://tool.example.com/lti/launch"],
    "initiate_login_uri": "https://tool.example.com/lti/init"
  });

  let supported_placements = json!(["course_navigation", "assignment_selection"]);
  let supported_message_types = json!(["LtiResourceLinkRequest", "LtiDeepLinkingRequest"]);
  let capabilities = json!({
    "deep_linking": true,
    "names_and_roles": true,
    "assignments_and_grades": false
  });

  let registration = LtiRegistration::create_with_capabilities(
    &pool,
    platform.id,
    &client_id,
    Some("deployment_1"),
    &registration_config,
    None,
    "active",
    Some(&supported_placements),
    Some(&supported_message_types),
    Some(&capabilities),
  )
  .await
  .expect("Failed to create registration with capabilities");

  guard.track_registration(registration.id.into());

  // Verify JSONB fields
  assert_eq!(registration.supported_placements, Some(supported_placements.clone()));
  assert_eq!(registration.supported_message_types, Some(supported_message_types.clone()));
  assert_eq!(registration.capabilities, Some(capabilities.clone()));

  // Test capability helper methods (if implemented)
  assert_eq!(registration.supports_placement("course_navigation"), true);
  assert_eq!(registration.supports_placement("unknown_placement"), false);

  assert_eq!(registration.supports_message_type("LtiResourceLinkRequest"), true);
  assert_eq!(registration.supports_message_type("UnknownType"), false);

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_registration_update_capabilities() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("registration_update_capabilities");

  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");

  let platform = create_test_platform(&pool, &format!("https://{}.example.com", issuer)).await;
  guard.track_platform(platform.id.into());

  let registration = create_test_registration(&pool, platform.id, &client_id).await;
  guard.track_registration(registration.id.into());

  // Update capabilities
  let new_capabilities = json!({
    "deep_linking": true,
    "names_and_roles": true,
    "assignments_and_grades": true
  });

  let updated = LtiRegistration::update_capabilities(
    &pool,
    &client_id,
    Some(&new_capabilities),
  )
  .await
  .expect("Failed to update capabilities");

  assert_eq!(updated.capabilities, Some(new_capabilities));

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_registration_delete() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("registration_delete");

  let issuer = ctx.unique_key("issuer");
  let client_id = ctx.unique_key("client");

  let platform = create_test_platform(&pool, &format!("https://{}.example.com", issuer)).await;
  guard.track_platform(platform.id.into());

  let registration = create_test_registration(&pool, platform.id, &client_id).await;

  // Delete registration
  LtiRegistration::delete(&pool, &client_id)
    .await
    .expect("Failed to delete registration");

  // Verify deletion
  let found = LtiRegistration::find_by_client_id(&pool, &client_id)
    .await
    .expect("Query should succeed");

  assert!(found.is_none(), "Registration should be deleted");

  // Only track platform for cleanup since registration is deleted
  guard.track_platform(platform.id.into());
  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_registration_cascade_delete_on_platform_delete() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("registration_cascade");

  let issuer = ctx.unique_key("issuer");
  let issuer_url = format!("https://{}.example.com", issuer);
  let client_id = ctx.unique_key("client");

  let platform = create_test_platform(&pool, &issuer_url).await;
  let registration = create_test_registration(&pool, platform.id, &client_id).await;

  // Delete platform (should cascade to registrations)
  LtiPlatform::delete(&pool, &issuer_url)
    .await
    .expect("Failed to delete platform");

  // Verify registration was also deleted
  let found = LtiRegistration::find_by_client_id(&pool, &client_id)
    .await
    .expect("Query should succeed");

  assert!(found.is_none(), "Registration should be cascade deleted");

  // Mark as done since cascade delete handled cleanup
  guard.mark_cleanup_done();
}
