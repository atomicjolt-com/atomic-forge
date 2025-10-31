use crate::ToolError;
use atomic_lti_tool::tool_jwt::ToolJwt;
use atomic_lti::jwt::decode_using_store;
use atomic_lti::stores::key_store::KeyStore;
use axum::{
  extract::{FromRef, FromRequestParts},
  http::request::Parts,
};
use std::sync::Arc;

/// JWT claims extractor for authenticated routes
///
/// Validates JWT token from Authorization header and extracts claims.
/// This extractor automatically validates the JWT using the key store
/// from your application state and provides convenient access to LTI claims.
///
/// # Example
///
/// ```rust,no_run
/// use atomic_lti_tool_axum::extractors::JwtClaims;
/// use axum::{Json, response::IntoResponse};
/// use serde_json::json;
///
/// async fn protected_route(
///   jwt_claims: JwtClaims,
/// ) -> impl IntoResponse {
///   let user_id = jwt_claims.user_id();
///   Json(json!({ "user_id": user_id }))
/// }
/// ```
///
/// # Authentication
///
/// The extractor expects a Bearer token in the Authorization header:
/// ```text
/// Authorization: Bearer <jwt_token>
/// ```
///
/// If the token is missing, invalid, or expired, the extractor will
/// return a 401 Unauthorized error.
#[derive(Clone, Debug)]
pub struct JwtClaims {
  pub claims: ToolJwt,
}

impl JwtClaims {
  /// Get the client ID from the JWT claims
  ///
  /// The client ID identifies the tool registration with the LMS platform.
  pub fn client_id(&self) -> &str {
    &self.claims.client_id
  }

  /// Get the platform issuer URL from the JWT claims
  ///
  /// This is the URL of the LMS platform that issued the original LTI launch.
  pub fn platform_iss(&self) -> &str {
    &self.claims.platform_iss
  }

  /// Get the deployment ID from the JWT claims
  ///
  /// The deployment ID identifies a specific deployment of the tool
  /// within the LMS platform.
  pub fn deployment_id(&self) -> &str {
    &self.claims.deployment_id
  }

  /// Get the user ID (subject) from the JWT claims
  ///
  /// This is the unique identifier for the user in the LMS platform.
  pub fn user_id(&self) -> &str {
    &self.claims.sub
  }

  /// Get the user's email address from the JWT claims, if available
  ///
  /// Note: The email may not always be present, depending on the
  /// platform's privacy settings and the user's profile.
  pub fn user_email(&self) -> Option<&str> {
    self.claims.email.as_deref()
  }

  /// Get the user's full name from the JWT claims, if available
  ///
  /// Note: The name may not always be present, depending on the
  /// platform's privacy settings and the user's profile.
  pub fn user_name(&self) -> Option<&str> {
    self.claims.name.as_deref()
  }

  /// Get the user's roles from the JWT claims
  ///
  /// Returns a slice of role URIs (e.g., "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor").
  pub fn roles(&self) -> &[String] {
    &self.claims.roles
  }

  /// Get the LTI message type from the JWT claims
  ///
  /// Common values include "LtiResourceLinkRequest" and "LtiDeepLinkingRequest".
  pub fn message_type(&self) -> &str {
    &self.claims.message_type
  }

  /// Get the context ID from the JWT claims, if available
  ///
  /// The context typically represents a course or other organizational unit.
  pub fn context_id(&self) -> Option<&str> {
    self.claims.context.as_ref().map(|c| c.id.as_str())
  }

  /// Get the resource link ID from the JWT claims, if available
  ///
  /// The resource link identifies a specific placement of the tool.
  pub fn resource_link_id(&self) -> Option<&str> {
    self.claims.resource_link.as_ref().map(|rl| rl.id.as_str())
  }

  /// Get the Names and Roles Provisioning Service endpoint URL, if available
  ///
  /// This URL can be used to retrieve course membership information.
  pub fn names_and_roles_endpoint_url(&self) -> Option<&str> {
    self.claims.names_and_roles_endpoint_url.as_deref()
  }

  /// Get the deep linking claim data, if available
  ///
  /// This is present when the launch is a deep linking request.
  pub fn deep_link_claim_data(&self) -> Option<&str> {
    self.claims.deep_link_claim_data.as_deref()
  }

  /// Check if the user has a specific role
  ///
  /// # Example
  ///
  /// ```rust,no_run
  /// # use atomic_lti_tool_axum::extractors::JwtClaims;
  /// # async fn example(claims: JwtClaims) {
  /// if claims.has_role("http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor") {
  ///     println!("User is an instructor");
  /// }
  /// # }
  /// ```
  pub fn has_role(&self, role: &str) -> bool {
    self.claims.roles.iter().any(|r| r == role)
  }

  /// Check if the user is an instructor
  ///
  /// This is a convenience method that checks for common instructor role URIs.
  pub fn is_instructor(&self) -> bool {
    self.has_role("http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor")
      || self.has_role("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor")
  }

  /// Check if the user is a learner/student
  ///
  /// This is a convenience method that checks for common learner role URIs.
  pub fn is_learner(&self) -> bool {
    self.has_role("http://purl.imsglobal.org/vocab/lis/v2/membership#Learner")
      || self.has_role("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner")
  }
}

/// Trait to extract the key store from application state
///
/// Implement this trait for your application state type to enable
/// the JwtClaims extractor.
pub trait HasKeyStore {
  type KeyStore: KeyStore;
  fn key_store(&self) -> &Self::KeyStore;
}

impl<S> FromRequestParts<S> for JwtClaims
where
  S: Send + Sync,
  Arc<S>: FromRef<S>,
  S: HasKeyStore,
{
  type Rejection = ToolError;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    // Extract JWT token from Authorization header
    let token = parts
      .headers
      .get("authorization")
      .and_then(|h| h.to_str().ok())
      .and_then(|s| s.strip_prefix("Bearer "))
      .ok_or_else(|| {
        ToolError::Unauthorized("Missing or invalid Authorization header".to_string())
      })?;

    // Validate JWT using the key store
    let key_store = state.key_store();
    let token_data = decode_using_store::<ToolJwt>(token, key_store)
      .await
      .map_err(|e| ToolError::Unauthorized(format!("JWT validation failed: {}", e)))?;

    Ok(Self {
      claims: token_data.claims,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti::jwt::encode_using_store;
  use atomic_lti_test::helpers::MockKeyStore;
  use atomic_lti_tool::tool_jwt::{LtiContextClaim, LtiResourceLinkClaim};
  use axum::http::{Request, StatusCode};
  use chrono::{Duration, Utc};

  // Test state implementation
  struct TestState {
    key_store: MockKeyStore,
  }

  impl HasKeyStore for TestState {
    type KeyStore = MockKeyStore;
    fn key_store(&self) -> &Self::KeyStore {
      &self.key_store
    }
  }

  impl FromRef<TestState> for Arc<TestState> {
    fn from_ref(state: &TestState) -> Arc<TestState> {
      // For testing, we create a new Arc - in production this would be reused
      Arc::new(TestState {
        key_store: MockKeyStore::default(),
      })
    }
  }

  fn create_test_jwt() -> ToolJwt {
    ToolJwt {
      client_id: "test-client".to_string(),
      iss: "https://tool.example.com".to_string(),
      sub: "user123".to_string(),
      exp: (Utc::now() + Duration::minutes(60)).timestamp(),
      iat: Utc::now().timestamp(),
      names_and_roles_endpoint_url: Some("https://lms.example.com/nrps".to_string()),
      platform_iss: "https://lms.example.com".to_string(),
      deep_link_claim_data: None,
      email: Some("user@example.com".to_string()),
      name: Some("Test User".to_string()),
      deployment_id: "deployment-123".to_string(),
      message_type: "LtiResourceLinkRequest".to_string(),
      roles: vec![
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor".to_string(),
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string(),
      ],
      context: Some(LtiContextClaim {
        id: "course-456".to_string(),
      }),
      resource_link: Some(LtiResourceLinkClaim {
        id: "link-789".to_string(),
      }),
    }
  }

  #[tokio::test]
  async fn test_jwt_claims_extraction_success() {
    let key_store = MockKeyStore::default();
    let tool_jwt = create_test_jwt();

    // Encode the JWT
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode JWT");

    // Create request with Authorization header
    let req = Request::builder()
      .header("Authorization", format!("Bearer {}", encoded_jwt))
      .body(())
      .unwrap();

    let state = TestState { key_store };

    // Extract claims
    let (mut parts, _body) = req.into_parts();
    let claims = JwtClaims::from_request_parts(&mut parts, &state).await;

    assert!(claims.is_ok());
    let claims = claims.unwrap();

    // Verify helper methods
    assert_eq!(claims.client_id(), "test-client");
    assert_eq!(claims.platform_iss(), "https://lms.example.com");
    assert_eq!(claims.deployment_id(), "deployment-123");
    assert_eq!(claims.user_id(), "user123");
    assert_eq!(claims.user_email(), Some("user@example.com"));
    assert_eq!(claims.user_name(), Some("Test User"));
    assert_eq!(claims.roles().len(), 2);
    assert_eq!(claims.message_type(), "LtiResourceLinkRequest");
    assert_eq!(claims.context_id(), Some("course-456"));
    assert_eq!(claims.resource_link_id(), Some("link-789"));
    assert_eq!(
      claims.names_and_roles_endpoint_url(),
      Some("https://lms.example.com/nrps")
    );
  }

  #[tokio::test]
  async fn test_jwt_claims_missing_authorization_header() {
    let req = Request::builder().body(()).unwrap();

    let state = TestState {
      key_store: MockKeyStore::default(),
    };

    let (mut parts, _body) = req.into_parts();
    let result = JwtClaims::from_request_parts(&mut parts, &state).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.status_code(), StatusCode::UNAUTHORIZED);
    assert!(err.to_string().contains("Missing or invalid Authorization header"));
  }

  #[tokio::test]
  async fn test_jwt_claims_invalid_authorization_format() {
    let req = Request::builder()
      .header("Authorization", "InvalidFormat token")
      .body(())
      .unwrap();

    let state = TestState {
      key_store: MockKeyStore::default(),
    };

    let (mut parts, _body) = req.into_parts();
    let result = JwtClaims::from_request_parts(&mut parts, &state).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.status_code(), StatusCode::UNAUTHORIZED);
  }

  #[tokio::test]
  async fn test_jwt_claims_invalid_token() {
    let req = Request::builder()
      .header("Authorization", "Bearer invalid.token.here")
      .body(())
      .unwrap();

    let state = TestState {
      key_store: MockKeyStore::default(),
    };

    let (mut parts, _body) = req.into_parts();
    let result = JwtClaims::from_request_parts(&mut parts, &state).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.status_code(), StatusCode::UNAUTHORIZED);
    assert!(err.to_string().contains("JWT validation failed"));
  }

  #[tokio::test]
  async fn test_jwt_claims_expired_token() {
    let key_store = MockKeyStore::default();
    let mut tool_jwt = create_test_jwt();
    // Set expiration to the past
    tool_jwt.exp = (Utc::now() - Duration::hours(1)).timestamp();

    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode JWT");

    let req = Request::builder()
      .header("Authorization", format!("Bearer {}", encoded_jwt))
      .body(())
      .unwrap();

    let state = TestState { key_store };

    let (mut parts, _body) = req.into_parts();
    let result = JwtClaims::from_request_parts(&mut parts, &state).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert_eq!(err.status_code(), StatusCode::UNAUTHORIZED);
  }

  #[tokio::test]
  async fn test_has_role() {
    let key_store = MockKeyStore::default();
    let tool_jwt = create_test_jwt();
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode JWT");

    let req = Request::builder()
      .header("Authorization", format!("Bearer {}", encoded_jwt))
      .body(())
      .unwrap();

    let state = TestState { key_store };
    let (mut parts, _body) = req.into_parts();
    let claims = JwtClaims::from_request_parts(&mut parts, &state)
      .await
      .unwrap();

    assert!(claims.has_role("http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"));
    assert!(claims.has_role("http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"));
    assert!(!claims.has_role("http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator"));
  }

  #[tokio::test]
  async fn test_is_instructor() {
    let key_store = MockKeyStore::default();
    let tool_jwt = create_test_jwt();
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode JWT");

    let req = Request::builder()
      .header("Authorization", format!("Bearer {}", encoded_jwt))
      .body(())
      .unwrap();

    let state = TestState { key_store };
    let (mut parts, _body) = req.into_parts();
    let claims = JwtClaims::from_request_parts(&mut parts, &state)
      .await
      .unwrap();

    assert!(claims.is_instructor());
    assert!(claims.is_learner());
  }

  #[tokio::test]
  async fn test_is_learner_only() {
    let key_store = MockKeyStore::default();
    let mut tool_jwt = create_test_jwt();
    tool_jwt.roles = vec![
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string(),
    ];

    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode JWT");

    let req = Request::builder()
      .header("Authorization", format!("Bearer {}", encoded_jwt))
      .body(())
      .unwrap();

    let state = TestState { key_store };
    let (mut parts, _body) = req.into_parts();
    let claims = JwtClaims::from_request_parts(&mut parts, &state)
      .await
      .unwrap();

    assert!(!claims.is_instructor());
    assert!(claims.is_learner());
  }

  #[tokio::test]
  async fn test_optional_fields_none() {
    let key_store = MockKeyStore::default();
    let mut tool_jwt = create_test_jwt();
    tool_jwt.email = None;
    tool_jwt.name = None;
    tool_jwt.context = None;
    tool_jwt.resource_link = None;
    tool_jwt.names_and_roles_endpoint_url = None;
    tool_jwt.deep_link_claim_data = None;

    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode JWT");

    let req = Request::builder()
      .header("Authorization", format!("Bearer {}", encoded_jwt))
      .body(())
      .unwrap();

    let state = TestState { key_store };
    let (mut parts, _body) = req.into_parts();
    let claims = JwtClaims::from_request_parts(&mut parts, &state)
      .await
      .unwrap();

    assert_eq!(claims.user_email(), None);
    assert_eq!(claims.user_name(), None);
    assert_eq!(claims.context_id(), None);
    assert_eq!(claims.resource_link_id(), None);
    assert_eq!(claims.names_and_roles_endpoint_url(), None);
    assert_eq!(claims.deep_link_claim_data(), None);
  }
}
