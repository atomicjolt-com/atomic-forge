pub use self::test_helpers::*;

pub mod test_helpers {
  
  use crate::models::lti_platform::LtiPlatform;
  use crate::models::lti_registration::LtiRegistration;
  use crate::models::tenant::Tenant;
  use crate::models::course::Course;
  use crate::models::user::User;
  
  use atomic_lti::id_token::{IdToken, ContextClaim, ResourceLinkClaim};
  use atomic_lti_tool::tool_jwt::{ToolJwt, LtiContextClaim, LtiResourceLinkClaim};
  use serde_json::{json, Value as JsonValue};
  use sqlx::postgres::PgPool;
  

  pub struct TestDb {
    pool: PgPool,
  }

  impl TestDb {
    pub async fn new() -> Self {
      let database_url = std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:password@localhost:5433/atomic_decay_test".to_string()
      });

      let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to test database");

      sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

      Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
      &self.pool
    }

    pub async fn cleanup(&self) {
      // Use TRUNCATE CASCADE for more reliable cleanup
      // This will automatically handle foreign key constraints
      let tables = vec![
        "users",
        "courses",
        "tenants",
        "lti_registrations",
        "lti_platforms",
        "keys",
        "oidc_states",
      ];

      for table in tables {
        // TRUNCATE is more reliable than DELETE for test cleanup
        let result = sqlx::query(&format!("TRUNCATE TABLE {} CASCADE", table))
          .execute(&self.pool)
          .await;

        if let Err(e) = result {
          eprintln!("Warning: Failed to truncate table {}: {}", table, e);
          // Fallback to DELETE if TRUNCATE fails
          sqlx::query(&format!("DELETE FROM {}", table))
            .execute(&self.pool)
            .await
            .ok();
        }
      }

      // Ensure cleanup is committed
      sqlx::query("SELECT 1").execute(&self.pool).await.ok();
    }
  }

  pub async fn setup_test_db() -> PgPool {
    let db = TestDb::new().await;
    // Don't do a full cleanup here - let each test manage its own data
    // This prevents tests from deleting each other's data when running in parallel
    db.pool().clone()
  }

  // Note: get_app_state() removed - tests should use setup_test_db() directly
  // and construct AppState manually if needed with real key store

  // ============================================================================
  // LTI Test Helpers
  // ============================================================================

  /// Create a test LTI platform with default values
  pub async fn create_test_platform(pool: &PgPool, issuer: &str) -> LtiPlatform {
    LtiPlatform::create(
      pool,
      issuer,
      Some(&format!("Test Platform {}", issuer)),
      &format!("{}/api/lti/security/jwks", issuer),
      &format!("{}/login/oauth2/token", issuer),
      &format!("{}/api/lti/authorize_redirect", issuer),
    )
    .await
    .expect("Failed to create test platform")
  }

  /// Create a test LTI platform with custom data
  pub async fn create_test_platform_with_data(
    pool: &PgPool,
    issuer: &str,
    name: Option<&str>,
    jwks_url: &str,
    token_url: &str,
    oidc_url: &str,
  ) -> LtiPlatform {
    LtiPlatform::create(pool, issuer, name, jwks_url, token_url, oidc_url)
      .await
      .expect("Failed to create test platform with custom data")
  }

  /// Create a test LTI registration with minimal data
  pub async fn create_test_registration(
    pool: &PgPool,
    platform_id: i32,
    client_id: &str,
  ) -> LtiRegistration {
    let registration_config = json!({
      "client_name": "Test Tool",
      "redirect_uris": ["https://tool.example.com/lti/launch"],
      "initiate_login_uri": "https://tool.example.com/lti/init"
    });

    LtiRegistration::create(
      pool,
      platform_id,
      client_id,
      Some("default"),
      &registration_config,
      None,
      "active",
    )
    .await
    .expect("Failed to create test registration")
  }

  /// Create a test LTI registration with full capabilities
  pub async fn create_test_registration_full(
    pool: &PgPool,
    platform_id: i32,
    client_id: &str,
    deployment_id: Option<&str>,
    registration_config: &JsonValue,
    supported_placements: Option<&JsonValue>,
    supported_message_types: Option<&JsonValue>,
    capabilities: Option<&JsonValue>,
  ) -> LtiRegistration {
    LtiRegistration::create_with_capabilities(
      pool,
      platform_id,
      client_id,
      deployment_id,
      registration_config,
      None,
      "active",
      supported_placements,
      supported_message_types,
      capabilities,
    )
    .await
    .expect("Failed to create test registration with capabilities")
  }

  /// Create a test tenant
  pub async fn create_test_tenant(
    pool: &PgPool,
    slug: &str,
    name: &str,
    platform_iss: &str,
    client_id: &str,
  ) -> Tenant {
    Tenant::create(pool, slug, name, platform_iss, client_id)
      .await
      .expect("Failed to create test tenant")
  }

  /// Create a test course
  pub async fn create_test_course(
    pool: &PgPool,
    tenant_id: i32,
    lti_context_id: &str,
    title: Option<&str>,
  ) -> Course {
    Course::create(pool, tenant_id, lti_context_id, title)
      .await
      .expect("Failed to create test course")
  }

  /// Create a test user
  pub async fn create_test_user(
    pool: &PgPool,
    tenant_id: i32,
    lti_user_id: &str,
    email: Option<&str>,
    name: Option<&str>,
    roles: Option<&JsonValue>,
  ) -> User {
    User::create(pool, tenant_id, lti_user_id, email, name, roles)
      .await
      .expect("Failed to create test user")
  }

  /// Create a test ID token with common LTI claims
  pub fn create_test_id_token(issuer: &str, client_id: &str, user_id: &str) -> IdToken {
    IdToken {
      iss: issuer.to_string(),
      aud: client_id.to_string(),
      sub: user_id.to_string(),
      exp: (chrono::Utc::now() + chrono::Duration::hours(1)).timestamp(),
      iat: chrono::Utc::now().timestamp(),
      nonce: "test_nonce".to_string(),
      deployment_id: "test_deployment".to_string(),
      target_link_uri: "https://tool.example.com/launch".to_string(),
      message_type: "LtiResourceLinkRequest".to_string(),
      lti_version: "1.3.0".to_string(),
      roles: vec!["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string()],
      context: Some(ContextClaim {
        id: "test_context".to_string(),
        label: Some("Test Course".to_string()),
        title: Some("Test Course Title".to_string()),
        r#type: Some(vec!["CourseOffering".to_string()]),
        validation_context: None,
        errors: None,
      }),
      resource_link: Some(ResourceLinkClaim {
        id: "test_resource_link".to_string(),
        title: Some("Test Activity".to_string()),
        description: None,
        validation_context: None,
        errors: None,
      }),
      email: Some("test@example.com".to_string()),
      name: Some("Test User".to_string()),
      given_name: Some("Test".to_string()),
      family_name: Some("User".to_string()),
      ..Default::default()
    }
  }

  /// Create a test ID token with custom claims
  pub fn create_test_id_token_with_claims(
    issuer: &str,
    client_id: &str,
    user_id: &str,
    context_id: Option<&str>,
    context_title: Option<&str>,
    roles: Vec<String>,
  ) -> IdToken {
    let mut id_token = create_test_id_token(issuer, client_id, user_id);

    id_token.roles = roles;

    if let (Some(ctx_id), title) = (context_id, context_title) {
      id_token.context = Some(ContextClaim {
        id: ctx_id.to_string(),
        label: title.map(|t| t.to_string()),
        title: title.map(|t| t.to_string()),
        r#type: Some(vec!["CourseOffering".to_string()]),
        validation_context: None,
        errors: None,
      });
    }

    id_token
  }

  /// Create a ToolJwt from claims for testing
  /// Note: ToolJwt has a different structure than IdToken, so we create it directly
  pub fn create_test_tool_jwt(
    issuer: &str,
    platform_iss: &str,
    client_id: &str,
    user_id: &str,
    deployment_id: &str,
    context_id: Option<&str>,
  ) -> ToolJwt {
    ToolJwt {
      iss: issuer.to_string(),
      platform_iss: platform_iss.to_string(),
      client_id: client_id.to_string(),
      sub: user_id.to_string(),
      exp: (chrono::Utc::now() + chrono::Duration::hours(1)).timestamp(),
      iat: chrono::Utc::now().timestamp(),
      deployment_id: deployment_id.to_string(),
      message_type: "LtiResourceLinkRequest".to_string(),
      roles: vec!["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string()],
      email: Some("test@example.com".to_string()),
      name: Some("Test User".to_string()),
      names_and_roles_endpoint_url: None,
      deep_link_claim_data: None,
      context: context_id.map(|id| LtiContextClaim {
        id: id.to_string(),
      }),
      resource_link: Some(LtiResourceLinkClaim {
        id: "test_resource_link".to_string(),
      }),
    }
  }

  pub mod test_data {
    // Test RSA keys in PEM format - these are for testing only, never use in production
    #[allow(dead_code)] // Test constant
    pub const TEST_KEY_PEM: &str = r#"-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF/TIB7/MCNl3BPjLDq68yhw9Wta8
P+6l1TQ0Mj5l7Hf5xvAhqnrKj1qfW6TGrZpIGxz5muoQI5Z2g/T3wvQVhC0wOvF3
NlLlfN9dHMSKaHevHqlqKHDq0eOPVjE57O8Ex1JqOJhYvd9cTmhs2LHYdJIWsObU
tDCKPvNWEbp9dLPHaydXCYa3LO9lOmGqDfvALH9M2Jnm5UQY8JrU/jbCXCJCfXIW
wWlhVYiP1qYdHwB8BQMhSPJHjdJO0W7awum6F5n8E0KiX4shWCtb3bXEg0bALvGC
AW5x4vwnBq9pQ5BHbfNxCGWaWajkdnfIh5cSzwIDAQABAoIBAH7a9i14ZFLKWNBu
WQ3PbLLrLJGP3F+vE7K4nQMvw4S5Oh7eNGHdIEzxDe5xgeVms2K2YGjLvYJnRVoQ
Uf5W4UWM0DJLZgT3OhiH0oSSJnfofmPPaBIHh6GdUaQgvJ3FV7CgPxHRLPPXoGdR
DyIarZ7dtBFiJC1bHMYcNKDvIQZaLb0YN9sDFl22p6Lv0EqLfGlHwMYQB0LOXBPH
b6XmHHPO7dKUuPCqxnRFvIJ/VLlYMQtFYF0Kx0ZIHR/N6hfGaT0fe3vBcI8g/vZe
Jlh6TtUKGoL5MFnOhVGqfqwx+kEabVt7AQp7f9LRJPmKLBUuvb0zhfB1fAaVGPwC
V1KgLBECgYEA+nLu0t9BOlZH72qzNjPhyMmPTJt5vT7DwUqEG3YGT3vT1HMOs7qZ
gxRrFFfYoLFayRtLiXcAw7u7wHvCh7y0T4qxDJA0oD5m+ZDN9YCb2keRRc2atzGC
+aBFMcFiiMKlEr+YPdVG7PmYoZ5FiFp1PvHLfFnUkJNYvdnEb3mZjLcCgYEA1kHT
92e29UC1DjJY2pfT5VH6aprH8/MUtb/BLJJg6S2rDQJztdGDVVao7VboN2aFFCZk
TjA5kPOaLUz6i3CjJqTqdzI8Xey1S7L4l9pSQCH0iz5HMHpVvKJALGzpjHLijm/B
OhPa4CKxOjSPREjTHHLpWLJudS7TjlJhKmfVeskCgYEAiXzgAePwT2dHuo6NbNjh
Dy3fmm7lzJYHVDg5zLEGBQkIdh/OPBYvmLEOS1x9p29nwpk0gm0JKxJQ2YHhxgEH
iFh5LlVHyJ7dZtyMKZGcn9HOGqUkJLlG6vPFVq4A5TeuOdjICVs4aWDGEqN6HtQo
nAKMExxkwfD8dIML0gvQascCgYBx3VQQ2cR1SgB3ZGPr8BWeqecqYG9gxSZ/T+8C
vQddTF6SQ6CpMKkDw/iHBs1tz5t7aTJkwUBe0CQjZj1PDMpPnfFoOhhC7YbUrm6B
DffNSPWumsGIGHdLvXupM3cSQbv0W7rM5lUHbmEeVbr3aTmxNnDYh6njCRCWuqG6
A1LsqQKBgCiQ9pCyqpC6Q1hNUvGgKfgNuLbVRNyCrmFiLjWyBZACdt7WH3wCjGHH
8o1DE5HjJNHby1brEzIYMnDzQp3xnU8H2d8mL7oAMdgrBHZTOvY7Kzten8FDl4TG
49S3qdXPG49r+lss6HKRmVOdJNcukzyNU4JtNpQmkWzOcbS2gqPF
-----END RSA PRIVATE KEY-----"#;

    #[allow(dead_code)] // Test constant
    pub const TEST_KEY_PEM_2: &str = r#"-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAwf9n3F3+dggz3MZ6EmoGGK+bKwIt8xlSiNk0QW8OHJZ0nELj
LiGnSHsNeQAbOllWYzXENHLCmeBqGhPeHF+mHvksN7r2RgRraNmV1yJLXRSf4LD9
DSLIDci7+G/FWF9SLY9PJcE6mKPT9D9ThQs8QSJHwcJtCgFOjNS7cg7hzQa3Z1yT
ZTzHB9afroh7b6FLnpH9iVKO3R5ZO6aBPBRnLpCnKrXvVhtcfpCPW6nRzN3vFcNH
azOz9aMsx6Z9JJY7kDM5OJ8pDvvQZvGpJf2w3NP4EwSkGkITXKCGzEgYVHQCaFDb
FvpNBBqo3S7meVD5NjQGPXmNh1mpiHCdumLgPQIDAQABAoIBAH7Ky6INyqvEJ/Hm
bOat9Ntrq1NJ+YfWx3k2j7sRR/NqCmqiGUkV6xO8KBXgxnhM1z6V4fRLy2Lgp6jW
4c9OoGKRRN0bGtLbOFdXBe1BTp8cITqXXYhGpq9zQ0mLJ0X7Zt8SsqQJK6/VgVaZ
Z5D7a5Vz5R1J5d7vTxbr2LnKDT/m7yyHHrQTx5JEjTlkNIKWfKvo4Y9Ysw5X/YT7
nJx0Dl3V3yv7DKjLm9GRJunrPuLlOVacVCJEQdZN9fPFqoJLQRJrNDLKdgJtdsKh
1CEjMeGCQqBi3wvQQfnnqcNuUkbSUJgQZJKPPIazNaOV+C6V3XLSjdvpIdNMfsvT
nwTq3AECgYEA8rP1ScHmeBiX5yDEPKWrF7z72iCLbKNa8CFBbL2Gqu+SCoQhCH5n
kx0yxBYVhJGjshCHGJ7hoXlM/pYNph+fdegmoBNJP2vSaNGlWYsE8R2YaKr6wUzA
IKF1HwccbfzJOyQp8TDyLcrJ5YXJnPSM+1f8s7LL3TQWBJXor3vLID0CgYEAzJ/y
WjnSqK8RTGRd5Ah6qpXJvxrDNBynPu4rKtCoHqMAPyXh4XhHYzNlXArXW5AbtLV/
S2F9M3rF3//wQpoV1ZLghtBqVEj6iMZXp5gKxqHULh05uxB4Zxdv+Q1RezNE4YSq
9gAuUc9uDp5x1Ea9qIvU4oUeVFx1pvJrXBKNuQECgYEA5sYiJxZ3voYCvrMnCjRc
bbZtPWKUGGzzKSdYJ0fGU8Om6yKa1WFishNlQiVvZM9WZtPf4w4zbeAHxKP6vsh9
J5WosQdRZiVDYTQCZG9G0uPl0YvgH2sPNNGMHMEL7ghzVJ+bP8h9hv+R7ItXvG8B
E8b20Fx8RBLh7SnppYILYlkCgYB1qNrfurf8Dpu0KB4MlWKU6C3fLKMx0Y8SmuUL
kKMxKoJPLCzNAhttv0KqnqQJCNAh3csPtCrA+cDbwGkMYuWTqOct8cFXLqj7abGa
yCR6gSap8EaIu1rH5VdVDdMGNZ9RIqKr3rnINoYEuTLKfPdkJZCWnSxfZJQzUDUc
4JuAAQKBgQCGBf4zt+LiNxG2KJyKnBXExdYfF/uH8dv+mqWoK0reGXwDPPgw2xCT
qJPKGj+e2GdGtaP5xfxDFE1ytOAJ6xMPV4embK4SrQVIGEpCsjKPqmJQKIQqfPpB
6NGPvz7pJevQSLCYdevNCEBUhm3k1F9X8ajJXMvE5mM2fLKGmtzCZQ==
-----END RSA PRIVATE KEY-----"#;
  }
}
