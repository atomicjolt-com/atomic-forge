/// Integration tests for LTI OIDC authentication flow
/// Tests the complete OIDC init -> redirect -> launch flow
use atomic_decay::stores::db_oidc_state_store::DbOIDCStateStore;
use atomic_decay::tests::{setup_test_db, create_test_platform, create_test_registration, TestContext, TestGuard};
use atomic_lti::stores::oidc_state_store::OIDCStateStore;

#[tokio::test]
async fn test_oidc_state_create_and_find() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("oidc_create");

  let state = ctx.unique_state();
  let nonce = ctx.unique_nonce();
  let issuer = ctx.unique_key("issuer");

  let store = DbOIDCStateStore::new(&pool);

  // Create OIDC state
  store
    .create_with_issuer(&state, &nonce, &issuer)
    .await
    .expect("Failed to create OIDC state");

  guard.track_oidc_state(0); // We'll need to track by state string, not ID

  // Find by state
  let found = store
    .find_by_state(&state)
    .await
    .expect("Failed to find OIDC state");

  assert_eq!(found.state, state);
  assert_eq!(found.nonce, nonce);
  assert_eq!(found.issuer, Some(issuer));

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_oidc_state_not_found() {
  let pool = setup_test_db().await;
  let ctx = TestContext::new("oidc_not_found");

  let store = DbOIDCStateStore::new(&pool);

  let result = store
    .find_by_state(&ctx.unique_state())
    .await;

  assert!(result.is_err(), "Should return error for non-existent state");
}

#[tokio::test]
async fn test_oidc_state_with_issuer_tracking() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("oidc_issuer_tracking");

  // Create multiple states with different issuers
  let state1 = ctx.unique_key("state1");
  let nonce1 = ctx.unique_nonce();
  let issuer1 = format!("https://{}.example.com", ctx.unique_key("issuer1"));

  let state2 = ctx.unique_key("state2");
  let nonce2 = ctx.unique_nonce();
  let issuer2 = format!("https://{}.example.com", ctx.unique_key("issuer2"));

  let store = DbOIDCStateStore::new(&pool);

  store
    .create_with_issuer(&state1, &nonce1, &issuer1)
    .await
    .expect("Failed to create state1");

  store
    .create_with_issuer(&state2, &nonce2, &issuer2)
    .await
    .expect("Failed to create state2");

  guard.track_oidc_state(0);
  guard.track_oidc_state(0);

  // Verify each state has correct issuer
  let found1 = store
    .find_by_state(&state1)
    .await
    .expect("Failed to find state1");

  assert_eq!(found1.issuer, Some(issuer1));

  let found2 = store
    .find_by_state(&state2)
    .await
    .expect("Failed to find state2");

  assert_eq!(found2.issuer, Some(issuer2));

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_oidc_state_destroy() {
  let pool = setup_test_db().await;
  let ctx = TestContext::new("oidc_destroy");

  let state = ctx.unique_state();
  let nonce = ctx.unique_nonce();
  let issuer = ctx.unique_key("issuer");

  let mut store = DbOIDCStateStore::new(&pool);
  store.state = Some(state.clone());

  // Create state
  store
    .create_with_issuer(&state, &nonce, &issuer)
    .await
    .expect("Failed to create OIDC state");

  // Verify it exists
  let found = store
    .find_by_state(&state)
    .await
    .expect("Failed to find OIDC state");

  assert_eq!(found.state, state);

  // Destroy state
  let destroyed_count = store
    .destroy()
    .await
    .expect("Failed to destroy OIDC state");

  assert_eq!(destroyed_count, 1, "Should destroy exactly one state");

  // Verify it's gone
  let result = store.find_by_state(&state).await;

  assert!(result.is_err(), "State should be destroyed");
}

#[tokio::test]
async fn test_complete_oidc_flow_simulation() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("oidc_flow");

  // Step 1: Setup platform and registration
  let issuer = format!("https://{}.example.com", ctx.unique_key("issuer"));
  let client_id = ctx.unique_key("client");

  let platform = create_test_platform(&pool, &issuer).await;
  guard.track_platform(platform.id.into());

  let registration = create_test_registration(&pool, platform.id, &client_id).await;
  guard.track_registration(registration.id.into());

  // Step 2: OIDC Init - Create state and nonce
  let state = ctx.unique_state();
  let nonce = ctx.unique_nonce();

  let mut oidc_store = DbOIDCStateStore::new(&pool);
  oidc_store.state = Some(state.clone());

  oidc_store
    .create_with_issuer(&state, &nonce, &issuer)
    .await
    .expect("Failed to create OIDC state");

  guard.track_oidc_state(0);

  // Step 3: OIDC Redirect - Validate state
  let found_state = oidc_store
    .find_by_state(&state)
    .await
    .expect("Failed to find state during redirect");

  assert_eq!(found_state.state, state);
  assert_eq!(found_state.nonce, nonce);
  assert_eq!(found_state.issuer, Some(issuer.clone()));

  // Step 4: Launch - Validate nonce and destroy state
  assert_eq!(found_state.nonce, nonce, "Nonce should match");

  let destroyed = oidc_store
    .destroy()
    .await
    .expect("Failed to destroy state after launch");

  assert_eq!(destroyed, 1, "State should be destroyed after successful launch");

  // Verify state is cleaned up
  let result = oidc_store.find_by_state(&state).await;
  assert!(result.is_err(), "State should be destroyed after launch");

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_oidc_state_expiration() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("oidc_expiration");

  let state = ctx.unique_state();
  let nonce = ctx.unique_nonce();
  let issuer = ctx.unique_key("issuer");

  let store = DbOIDCStateStore::new(&pool);

  // Create state
  store
    .create_with_issuer(&state, &nonce, &issuer)
    .await
    .expect("Failed to create OIDC state");

  guard.track_oidc_state(0);

  // Get created_at timestamp
  let found = store
    .find_by_state(&state)
    .await
    .expect("Failed to find state");

  // Verify created_at is recent (within last minute)
  let now = chrono::Utc::now().naive_utc();
  let age = now.signed_duration_since(found.created_at.unwrap());

  assert!(age.num_seconds() < 60, "State should be created within last minute");

  guard.cleanup().await.expect("Cleanup failed");
}

#[tokio::test]
async fn test_oidc_multiple_platforms_isolation() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("oidc_isolation");

  // Create two different platforms
  let issuer1 = format!("https://{}.example.com", ctx.unique_key("canvas"));
  let issuer2 = format!("https://{}.example.com", ctx.unique_key("moodle"));

  let platform1 = create_test_platform(&pool, &issuer1).await;
  let platform2 = create_test_platform(&pool, &issuer2).await;

  guard.track_platform(platform1.id.into());
  guard.track_platform(platform2.id.into());

  // Create OIDC states for each platform
  let state1 = ctx.unique_key("state1");
  let nonce1 = ctx.unique_nonce();

  let state2 = ctx.unique_key("state2");
  let nonce2 = ctx.unique_nonce();

  let store = DbOIDCStateStore::new(&pool);

  store
    .create_with_issuer(&state1, &nonce1, &issuer1)
    .await
    .expect("Failed to create state for platform1");

  store
    .create_with_issuer(&state2, &nonce2, &issuer2)
    .await
    .expect("Failed to create state for platform2");

  guard.track_oidc_state(0);
  guard.track_oidc_state(0);

  // Verify states are isolated by issuer
  let found1 = store
    .find_by_state(&state1)
    .await
    .expect("Failed to find state1");

  assert_eq!(found1.issuer, Some(issuer1));
  assert_eq!(found1.nonce, nonce1);

  let found2 = store
    .find_by_state(&state2)
    .await
    .expect("Failed to find state2");

  assert_eq!(found2.issuer, Some(issuer2));
  assert_eq!(found2.nonce, nonce2);

  // States should be completely independent
  assert_ne!(found1.state, found2.state);
  assert_ne!(found1.issuer, found2.issuer);

  guard.cleanup().await.expect("Cleanup failed");
}
