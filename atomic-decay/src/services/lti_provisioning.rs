use crate::errors::AppError;
use crate::models::course::Course;
use crate::models::tenant::Tenant;
use crate::models::user::User;
use crate::stores::tool_jwt_store::ToolJwt;
use sqlx::PgPool;

/// Service for Just-In-Time provisioning of resources from LTI launches
///
/// Key principle: Tenant = platform_iss + client_id (NOT just platform_iss)
/// - platform_iss: LMS vendor (e.g., https://canvas.instructure.com)
/// - client_id: Unique per tool registration per institution
///
/// This pattern ensures that each tool registration gets its own isolated tenant,
/// even if multiple institutions use the same LMS platform.
pub struct LtiProvisioningService {
  pool: PgPool,
}

impl LtiProvisioningService {
  pub fn new(pool: PgPool) -> Self {
    Self { pool }
  }

  /// Provision (or get existing) tenant from LTI claims
  ///
  /// Tenant is uniquely identified by platform_iss + client_id combination
  pub async fn provision_tenant(&self, claims: &ToolJwt) -> Result<Tenant, AppError> {
    let slug = self.create_tenant_slug(&claims.platform_iss, &claims.client_id);

    // Try to find existing tenant by slug
    if let Some(tenant) = Tenant::find_by_slug(&self.pool, &slug).await? {
      return Ok(tenant);
    }

    // Try to find by platform_iss + client_id (in case slug changed)
    if let Some(tenant) =
      Tenant::find_by_platform_and_client(&self.pool, &claims.platform_iss, &claims.client_id)
        .await?
    {
      return Ok(tenant);
    }

    // Create new tenant
    let domain = self.extract_domain(&claims.platform_iss);
    let client_short = &claims.client_id[..8.min(claims.client_id.len())];
    let name = format!("{} - {}", domain, client_short);

    let tenant = Tenant::create(&self.pool, &slug, &name, &claims.platform_iss, &claims.client_id)
      .await?;

    Ok(tenant)
  }

  /// Provision (or get existing) course from LTI context
  ///
  /// Returns None if context_id is not available in the claims
  pub async fn provision_course(
    &self,
    tenant_id: i32,
    context_id: Option<&str>,
    context_title: Option<&str>,
  ) -> Result<Option<Course>, AppError> {
    let context_id = match context_id {
      Some(id) => id,
      None => return Ok(None),
    };

    // Try to find existing course
    if let Some(course) =
      Course::find_by_tenant_and_context(&self.pool, tenant_id, context_id).await?
    {
      // Update title if it's different
      if context_title.is_some() && context_title != course.title.as_deref() {
        let updated = course.update_title(&self.pool, context_title).await?;
        return Ok(Some(updated));
      }
      return Ok(Some(course));
    }

    // Create new course
    let course = Course::create(&self.pool, tenant_id, context_id, context_title).await?;

    Ok(Some(course))
  }

  /// Provision (or get existing) user from LTI claims
  ///
  /// Uses sub (lti_user_id) as the unique identifier within a tenant
  pub async fn provision_user(&self, tenant_id: i32, claims: &ToolJwt) -> Result<User, AppError> {
    let lti_user_id = &claims.sub;

    // Try to find existing user
    if let Some(user) =
      User::find_by_tenant_and_lti_user(&self.pool, tenant_id, lti_user_id).await?
    {
      // For now, we don't update user info on every launch
      // In the future, you might want to update email/name if they've changed
      return Ok(user);
    }

    // Create new user
    // Extract roles from claims (not yet in ToolJwt, so we'll leave as None for now)
    let user = User::create(
      &self.pool,
      tenant_id,
      lti_user_id,
      None, // email - TODO: add to ToolJwt
      None, // name - TODO: add to ToolJwt
      None, // roles - TODO: add to ToolJwt
    )
    .await?;

    Ok(user)
  }

  /// Create tenant slug from platform_iss + client_id
  ///
  /// Format: {domain}-{client_id_prefix}
  /// Example: "canvas-instructure-com-abc123"
  fn create_tenant_slug(&self, platform_iss: &str, client_id: &str) -> String {
    let domain = self.extract_domain(platform_iss);
    let client_hash = &client_id[..8.min(client_id.len())];

    format!("{}-{}", domain, client_hash)
      .to_lowercase()
      .replace('.', "-")
      .chars()
      .take(50)
      .collect()
  }

  /// Extract domain from platform issuer URL
  ///
  /// Converts "https://canvas.instructure.com" to "canvas-instructure-com"
  fn extract_domain(&self, platform_iss: &str) -> String {
    platform_iss
      .replace("https://", "")
      .replace("http://", "")
      .split('/')
      .next()
      .unwrap_or(platform_iss)
      .replace('.', "-")
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::tests::helpers::test_helpers::setup_test_db;

  fn create_test_claims(platform_iss: &str, client_id: &str, sub: &str) -> ToolJwt {
    ToolJwt {
      client_id: client_id.to_string(),
      deployment_id: "deployment-1".to_string(),
      iss: "https://example.com".to_string(),
      sub: sub.to_string(),
      exp: 9999999999,
      iat: 1234567890,
      names_and_roles_endpoint_url: None,
      platform_iss: platform_iss.to_string(),
      deep_link_claim_data: None,
    }
  }

  #[tokio::test]
  async fn test_provision_tenant() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool.clone());

    let claims = create_test_claims(
      "https://canvas.instructure.com",
      "test-client-123",
      "user-1",
    );

    // First provision should create tenant
    let tenant1 = service.provision_tenant(&claims).await.unwrap();
    assert_eq!(tenant1.platform_iss, "https://canvas.instructure.com");
    assert_eq!(tenant1.client_id, "test-client-123");
    assert_eq!(tenant1.slug, "canvas-instructure-com-test-cli");

    // Second provision should return same tenant
    let tenant2 = service.provision_tenant(&claims).await.unwrap();
    assert_eq!(tenant1.id, tenant2.id);
    assert_eq!(tenant1.slug, tenant2.slug);
  }

  #[tokio::test]
  async fn test_create_tenant_slug() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool);

    let slug = service.create_tenant_slug("https://canvas.instructure.com", "abc123xyz");
    assert_eq!(slug, "canvas-instructure-com-abc123xy");

    let slug2 = service.create_tenant_slug("https://blackboard.com", "short");
    assert_eq!(slug2, "blackboard-com-short");

    // Test slug truncation
    let long_domain = "https://very.long.subdomain.example.com";
    let long_client = "verylongclientid12345";
    let slug3 = service.create_tenant_slug(long_domain, long_client);
    assert!(slug3.len() <= 50);
  }

  #[tokio::test]
  async fn test_extract_domain() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool);

    assert_eq!(
      service.extract_domain("https://canvas.instructure.com"),
      "canvas-instructure-com"
    );
    assert_eq!(
      service.extract_domain("https://blackboard.com/path"),
      "blackboard-com"
    );
    assert_eq!(
      service.extract_domain("http://localhost:3000"),
      "localhost:3000"
    );
  }

  #[tokio::test]
  async fn test_provision_course_with_context() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool.clone());

    // First create a tenant
    let claims = create_test_claims("https://example.com", "client-course-1", "user-1");
    let tenant = service.provision_tenant(&claims).await.unwrap();

    // Provision course with context
    let course1 = service
      .provision_course(tenant.id, Some("course-123"), Some("Test Course"))
      .await
      .unwrap();

    assert!(course1.is_some());
    let course1 = course1.unwrap();
    assert_eq!(course1.lti_context_id, "course-123");
    assert_eq!(course1.title, Some("Test Course".to_string()));

    // Provision same course again should return existing
    let course2 = service
      .provision_course(tenant.id, Some("course-123"), Some("Test Course"))
      .await
      .unwrap()
      .unwrap();

    assert_eq!(course1.id, course2.id);

    // Update course title
    let course3 = service
      .provision_course(tenant.id, Some("course-123"), Some("Updated Course"))
      .await
      .unwrap()
      .unwrap();

    assert_eq!(course1.id, course3.id);
    assert_eq!(course3.title, Some("Updated Course".to_string()));
  }

  #[tokio::test]
  async fn test_provision_course_without_context() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool.clone());

    let claims = create_test_claims("https://example.com", "client-course-2", "user-1");
    let tenant = service.provision_tenant(&claims).await.unwrap();

    // Provision without context should return None
    let result = service.provision_course(tenant.id, None, None).await.unwrap();
    assert!(result.is_none());
  }

  #[tokio::test]
  async fn test_provision_user() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool.clone());

    // Create tenant
    let claims = create_test_claims("https://example.com", "client-user-1", "user-123");
    let tenant = service.provision_tenant(&claims).await.unwrap();

    // Provision user
    let user1 = service.provision_user(tenant.id, &claims).await.unwrap();
    assert_eq!(user1.lti_user_id, "user-123");
    assert_eq!(user1.tenant_id, tenant.id);

    // Provision same user again should return existing
    let user2 = service.provision_user(tenant.id, &claims).await.unwrap();
    assert_eq!(user1.id, user2.id);
  }

  #[tokio::test]
  async fn test_full_provisioning_flow() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool.clone());

    // Create claims
    let claims = create_test_claims("https://canvas.instructure.com", "full-flow-123", "user-456");

    // Provision tenant
    let tenant = service.provision_tenant(&claims).await.unwrap();
    assert!(tenant.id > 0);

    // Provision course
    let course = service
      .provision_course(tenant.id, Some("math-101"), Some("Math 101"))
      .await
      .unwrap()
      .unwrap();
    assert!(course.id > 0);
    assert_eq!(course.tenant_id, tenant.id);

    // Provision user
    let user = service.provision_user(tenant.id, &claims).await.unwrap();
    assert!(user.id > 0);
    assert_eq!(user.tenant_id, tenant.id);

    // Verify all resources are linked to the same tenant
    assert_eq!(tenant.id, course.tenant_id);
    assert_eq!(tenant.id, user.tenant_id);
  }

  #[tokio::test]
  async fn test_multiple_tenants_same_platform() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool.clone());

    // Same platform, different client IDs = different tenants
    let claims1 = create_test_claims(
      "https://canvas.instructure.com",
      "client-a",
      "user-1",
    );
    let claims2 = create_test_claims(
      "https://canvas.instructure.com",
      "client-b",
      "user-1",
    );

    let tenant1 = service.provision_tenant(&claims1).await.unwrap();
    let tenant2 = service.provision_tenant(&claims2).await.unwrap();

    // Should be different tenants
    assert_ne!(tenant1.id, tenant2.id);
    assert_ne!(tenant1.slug, tenant2.slug);
    assert_eq!(tenant1.platform_iss, tenant2.platform_iss);
  }

  #[tokio::test]
  async fn test_user_isolation_between_tenants() {
    let pool = setup_test_db().await;
    let service = LtiProvisioningService::new(pool.clone());

    // Create two different tenants
    let claims1 = create_test_claims("https://example.com", "tenant-1", "user-123");
    let claims2 = create_test_claims("https://example.com", "tenant-2", "user-123");

    let tenant1 = service.provision_tenant(&claims1).await.unwrap();
    let tenant2 = service.provision_tenant(&claims2).await.unwrap();

    // Same LTI user ID, different tenants = different users
    let user1 = service.provision_user(tenant1.id, &claims1).await.unwrap();
    let user2 = service.provision_user(tenant2.id, &claims2).await.unwrap();

    assert_ne!(user1.id, user2.id);
    assert_eq!(user1.lti_user_id, user2.lti_user_id); // Same LTI ID
    assert_ne!(user1.tenant_id, user2.tenant_id); // Different tenants
  }
}
