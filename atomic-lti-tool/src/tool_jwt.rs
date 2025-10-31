use serde::{Deserialize, Serialize};

/// Nested struct for LTI context claim
///
/// This represents the context (e.g., course) in which the LTI launch is occurring.
/// See: https://www.imsglobal.org/spec/lti/v1p3#context-claim
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LtiContextClaim {
  /// Opaque identifier for the context (e.g., course ID)
  pub id: String,
}

/// Nested struct for LTI resource link claim
///
/// This represents a specific placement of a tool within a context.
/// See: https://www.imsglobal.org/spec/lti/v1p3#resource-link-claim
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LtiResourceLinkClaim {
  /// Opaque identifier for the resource link placement
  pub id: String,
}

/// JWT structure for Tool-issued tokens
///
/// This structure represents the JWT token that the LTI Tool issues to clients
/// after a successful LTI launch. It contains essential claims from the original
/// LTI ID Token plus metadata needed by the client application.
///
/// The structure uses full LTI claim URIs with serde rename attributes to ensure
/// proper serialization/deserialization while maintaining clean field names in code.
///
/// # Example
///
/// ```rust
/// use atomic_lti_tool::tool_jwt::{ToolJwt, LtiContextClaim, LtiResourceLinkClaim};
/// use chrono::{Duration, Utc};
///
/// let tool_jwt = ToolJwt {
///     client_id: "my-client-123".to_string(),
///     iss: "https://mytool.example.com".to_string(),
///     sub: "user-456".to_string(),
///     exp: (Utc::now() + Duration::minutes(60)).timestamp(),
///     iat: Utc::now().timestamp(),
///     names_and_roles_endpoint_url: Some("https://lms.example.com/nrps".to_string()),
///     platform_iss: "https://lms.example.com".to_string(),
///     deep_link_claim_data: None,
///     email: Some("user@example.com".to_string()),
///     name: Some("Test User".to_string()),
///     deployment_id: "deployment-789".to_string(),
///     message_type: "LtiResourceLinkRequest".to_string(),
///     roles: vec!["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string()],
///     context: Some(LtiContextClaim {
///         id: "course-123".to_string(),
///     }),
///     resource_link: Some(LtiResourceLinkClaim {
///         id: "link-456".to_string(),
///     }),
/// };
/// ```
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ToolJwt {
  /// Client ID from the LTI platform (identifies the tool registration)
  pub client_id: String,

  /// Issuer - the URL of this tool
  pub iss: String,

  /// Subject - the user ID from the LMS
  pub sub: String,

  /// Expiration time (Unix timestamp)
  pub exp: i64,

  /// Issued at time (Unix timestamp)
  pub iat: i64,

  /// Optional endpoint URL for Names and Roles Provisioning Service
  pub names_and_roles_endpoint_url: Option<String>,

  /// Issuer of the original platform (LMS URL)
  pub platform_iss: String,

  /// Optional data from deep linking claim
  pub deep_link_claim_data: Option<String>,

  /// User's email address from the LTI platform
  pub email: Option<String>,

  /// User's full name from the LTI platform
  pub name: Option<String>,

  // LTI claims with full claim URIs for client compatibility

  /// LTI Deployment ID - identifies a specific deployment of the tool
  ///
  /// See: https://www.imsglobal.org/spec/lti/v1p3#deployment-id-claim
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/deployment_id")]
  pub deployment_id: String,

  /// LTI Message Type (e.g., "LtiResourceLinkRequest", "LtiDeepLinkingRequest")
  ///
  /// See: https://www.imsglobal.org/spec/lti/v1p3#message-type-claim
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/message_type")]
  pub message_type: String,

  /// User's roles within the context (e.g., Learner, Instructor)
  ///
  /// See: https://www.imsglobal.org/spec/lti/v1p3#roles-claim
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/roles")]
  pub roles: Vec<String>,

  /// Context information (e.g., course) - optional as not all launches have context
  ///
  /// See: https://www.imsglobal.org/spec/lti/v1p3#context-claim
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/context")]
  pub context: Option<LtiContextClaim>,

  /// Resource link information - identifies the specific placement of the tool
  ///
  /// See: https://www.imsglobal.org/spec/lti/v1p3#resource-link-claim
  #[serde(rename = "https://purl.imsglobal.org/spec/lti/claim/resource_link")]
  pub resource_link: Option<LtiResourceLinkClaim>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use atomic_lti::jwt::{encode_using_store, decode_using_store};
  use atomic_lti_test::helpers::MockKeyStore;
  use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
  use chrono::{Duration, Utc};

  #[test]
  fn test_tool_jwt_serialization() {
    let tool_jwt = ToolJwt {
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
      roles: vec!["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string()],
      context: Some(LtiContextClaim {
        id: "course-456".to_string(),
      }),
      resource_link: Some(LtiResourceLinkClaim {
        id: "link-789".to_string(),
      }),
    };

    // Serialize to JSON
    let json = serde_json::to_string(&tool_jwt).expect("Failed to serialize ToolJwt");

    // Verify that full claim URIs are present in JSON
    assert!(json.contains("https://purl.imsglobal.org/spec/lti/claim/deployment_id"));
    assert!(json.contains("https://purl.imsglobal.org/spec/lti/claim/message_type"));
    assert!(json.contains("https://purl.imsglobal.org/spec/lti/claim/roles"));
    assert!(json.contains("https://purl.imsglobal.org/spec/lti/claim/context"));
    assert!(json.contains("https://purl.imsglobal.org/spec/lti/claim/resource_link"));
  }

  #[test]
  fn test_tool_jwt_deserialization() {
    let json = r#"{
      "client_id": "test-client",
      "iss": "https://tool.example.com",
      "sub": "user123",
      "exp": 1234567890,
      "iat": 1234567800,
      "names_and_roles_endpoint_url": "https://lms.example.com/nrps",
      "platform_iss": "https://lms.example.com",
      "deep_link_claim_data": null,
      "email": "user@example.com",
      "name": "Test User",
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "deployment-123",
      "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
      "https://purl.imsglobal.org/spec/lti/claim/roles": ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
      "https://purl.imsglobal.org/spec/lti/claim/context": {
        "id": "course-456"
      },
      "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
        "id": "link-789"
      }
    }"#;

    let tool_jwt: ToolJwt = serde_json::from_str(json).expect("Failed to deserialize ToolJwt");

    assert_eq!(tool_jwt.client_id, "test-client");
    assert_eq!(tool_jwt.deployment_id, "deployment-123");
    assert_eq!(tool_jwt.message_type, "LtiResourceLinkRequest");
    assert_eq!(tool_jwt.roles.len(), 1);
    assert!(tool_jwt.context.is_some());
    assert_eq!(tool_jwt.context.unwrap().id, "course-456");
    assert!(tool_jwt.resource_link.is_some());
    assert_eq!(tool_jwt.resource_link.unwrap().id, "link-789");
  }

  #[test]
  fn test_tool_jwt_optional_fields() {
    // Test with minimal fields (optional fields set to None)
    let json = r#"{
      "client_id": "test-client",
      "iss": "https://tool.example.com",
      "sub": "user123",
      "exp": 1234567890,
      "iat": 1234567800,
      "names_and_roles_endpoint_url": null,
      "platform_iss": "https://lms.example.com",
      "deep_link_claim_data": null,
      "email": null,
      "name": null,
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "deployment-123",
      "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
      "https://purl.imsglobal.org/spec/lti/claim/roles": [],
      "https://purl.imsglobal.org/spec/lti/claim/context": null,
      "https://purl.imsglobal.org/spec/lti/claim/resource_link": null
    }"#;

    let tool_jwt: ToolJwt = serde_json::from_str(json).expect("Failed to deserialize ToolJwt");

    assert!(tool_jwt.names_and_roles_endpoint_url.is_none());
    assert!(tool_jwt.deep_link_claim_data.is_none());
    assert!(tool_jwt.email.is_none());
    assert!(tool_jwt.name.is_none());
    assert!(tool_jwt.context.is_none());
    assert!(tool_jwt.resource_link.is_none());
  }

  #[test]
  fn test_nested_claim_structs() {
    let context = LtiContextClaim {
      id: "context-123".to_string(),
    };

    let resource_link = LtiResourceLinkClaim {
      id: "resource-456".to_string(),
    };

    // Verify they serialize/deserialize correctly
    let context_json = serde_json::to_string(&context).expect("Failed to serialize context");
    let deserialized_context: LtiContextClaim = serde_json::from_str(&context_json)
      .expect("Failed to deserialize context");
    assert_eq!(deserialized_context.id, "context-123");

    let resource_json = serde_json::to_string(&resource_link).expect("Failed to serialize resource_link");
    let deserialized_resource: LtiResourceLinkClaim = serde_json::from_str(&resource_json)
      .expect("Failed to deserialize resource_link");
    assert_eq!(deserialized_resource.id, "resource-456");
  }

  #[test]
  fn test_round_trip_serialization() {
    let original = ToolJwt {
      client_id: "round-trip-test".to_string(),
      iss: "https://tool.example.com".to_string(),
      sub: "user999".to_string(),
      exp: 9999999999,
      iat: 9999999000,
      names_and_roles_endpoint_url: Some("https://lms.example.com/nrps".to_string()),
      platform_iss: "https://lms.example.com".to_string(),
      deep_link_claim_data: Some("deep-link-data".to_string()),
      email: Some("roundtrip@example.com".to_string()),
      name: Some("Round Trip User".to_string()),
      deployment_id: "deployment-round".to_string(),
      message_type: "LtiDeepLinkingRequest".to_string(),
      roles: vec![
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor".to_string(),
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string(),
      ],
      context: Some(LtiContextClaim {
        id: "round-trip-context".to_string(),
      }),
      resource_link: Some(LtiResourceLinkClaim {
        id: "round-trip-link".to_string(),
      }),
    };

    // Serialize
    let json = serde_json::to_string(&original).expect("Failed to serialize");

    // Deserialize
    let deserialized: ToolJwt = serde_json::from_str(&json).expect("Failed to deserialize");

    // Verify all fields match
    assert_eq!(deserialized.client_id, original.client_id);
    assert_eq!(deserialized.iss, original.iss);
    assert_eq!(deserialized.sub, original.sub);
    assert_eq!(deserialized.exp, original.exp);
    assert_eq!(deserialized.iat, original.iat);
    assert_eq!(deserialized.names_and_roles_endpoint_url, original.names_and_roles_endpoint_url);
    assert_eq!(deserialized.platform_iss, original.platform_iss);
    assert_eq!(deserialized.deep_link_claim_data, original.deep_link_claim_data);
    assert_eq!(deserialized.email, original.email);
    assert_eq!(deserialized.name, original.name);
    assert_eq!(deserialized.deployment_id, original.deployment_id);
    assert_eq!(deserialized.message_type, original.message_type);
    assert_eq!(deserialized.roles, original.roles);
    assert_eq!(deserialized.context.as_ref().unwrap().id, original.context.as_ref().unwrap().id);
    assert_eq!(deserialized.resource_link.as_ref().unwrap().id, original.resource_link.as_ref().unwrap().id);
  }

  #[tokio::test]
  async fn test_jwt_encode_decode() {
    // Create a ToolJwt instance
    let tool_jwt = ToolJwt {
      client_id: "jwt-test-client".to_string(),
      iss: "https://tool.example.com".to_string(),
      sub: "user-encode-decode".to_string(),
      exp: (Utc::now() + Duration::minutes(60)).timestamp(),
      iat: Utc::now().timestamp(),
      names_and_roles_endpoint_url: Some("https://lms.example.com/nrps".to_string()),
      platform_iss: "https://lms.example.com".to_string(),
      deep_link_claim_data: Some("test-deep-link-data".to_string()),
      email: Some("jwttest@example.com".to_string()),
      name: Some("JWT Test User".to_string()),
      deployment_id: "deployment-jwt".to_string(),
      message_type: "LtiResourceLinkRequest".to_string(),
      roles: vec!["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor".to_string()],
      context: Some(LtiContextClaim {
        id: "context-jwt".to_string(),
      }),
      resource_link: Some(LtiResourceLinkClaim {
        id: "link-jwt".to_string(),
      }),
    };

    // Create a mock key store
    let key_store = MockKeyStore::default();

    // Encode the ToolJwt
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode ToolJwt");

    assert!(!encoded_jwt.is_empty());

    // Decode the JWT
    let decoded = decode_using_store::<ToolJwt>(&encoded_jwt, &key_store)
      .await
      .expect("Failed to decode ToolJwt");

    // Verify all fields match
    assert_eq!(decoded.claims.client_id, tool_jwt.client_id);
    assert_eq!(decoded.claims.iss, tool_jwt.iss);
    assert_eq!(decoded.claims.sub, tool_jwt.sub);
    assert_eq!(decoded.claims.platform_iss, tool_jwt.platform_iss);
    assert_eq!(decoded.claims.deployment_id, tool_jwt.deployment_id);
    assert_eq!(decoded.claims.message_type, tool_jwt.message_type);
    assert_eq!(decoded.claims.roles, tool_jwt.roles);
    assert_eq!(decoded.claims.email, tool_jwt.email);
    assert_eq!(decoded.claims.name, tool_jwt.name);

    // Verify nested claims
    assert!(decoded.claims.context.is_some());
    assert_eq!(decoded.claims.context.unwrap().id, "context-jwt");
    assert!(decoded.claims.resource_link.is_some());
    assert_eq!(decoded.claims.resource_link.unwrap().id, "link-jwt");
  }

  #[tokio::test]
  async fn test_jwt_with_minimal_fields() {
    // Test with only required fields (optional fields as None)
    let tool_jwt = ToolJwt {
      client_id: "minimal-client".to_string(),
      iss: "https://tool.example.com".to_string(),
      sub: "user-minimal".to_string(),
      exp: (Utc::now() + Duration::minutes(60)).timestamp(),
      iat: Utc::now().timestamp(),
      names_and_roles_endpoint_url: None,
      platform_iss: "https://lms.example.com".to_string(),
      deep_link_claim_data: None,
      email: None,
      name: None,
      deployment_id: "deployment-minimal".to_string(),
      message_type: "LtiResourceLinkRequest".to_string(),
      roles: vec![],
      context: None,
      resource_link: None,
    };

    let key_store = MockKeyStore::default();

    // Encode and decode
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode minimal ToolJwt");

    let decoded = decode_using_store::<ToolJwt>(&encoded_jwt, &key_store)
      .await
      .expect("Failed to decode minimal ToolJwt");

    // Verify required fields
    assert_eq!(decoded.claims.client_id, "minimal-client");
    assert_eq!(decoded.claims.deployment_id, "deployment-minimal");

    // Verify optional fields are None
    assert!(decoded.claims.email.is_none());
    assert!(decoded.claims.name.is_none());
    assert!(decoded.claims.context.is_none());
    assert!(decoded.claims.resource_link.is_none());
  }

  #[tokio::test]
  async fn test_jwt_with_different_key_store_fails() {
    let tool_jwt = ToolJwt {
      client_id: "key-test-client".to_string(),
      iss: "https://tool.example.com".to_string(),
      sub: "user-key-test".to_string(),
      exp: (Utc::now() + Duration::minutes(60)).timestamp(),
      iat: Utc::now().timestamp(),
      names_and_roles_endpoint_url: None,
      platform_iss: "https://lms.example.com".to_string(),
      deep_link_claim_data: None,
      email: None,
      name: None,
      deployment_id: "deployment-key".to_string(),
      message_type: "LtiResourceLinkRequest".to_string(),
      roles: vec![],
      context: None,
      resource_link: None,
    };

    // Encode with first key store
    let key_store_1 = MockKeyStore::default();
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store_1)
      .await
      .expect("Failed to encode ToolJwt");

    // Try to decode with different key store (should fail)
    let key_store_2 = MockKeyStore::default();
    let result = decode_using_store::<ToolJwt>(&encoded_jwt, &key_store_2).await;

    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_backward_compatibility_with_old_format() {
    // This test verifies that JWTs without the full claim URIs can still be decoded
    // This ensures backward compatibility with older implementations
    let old_format_json = r#"{
      "client_id": "old-format-client",
      "iss": "https://tool.example.com",
      "sub": "user-old",
      "exp": 9999999999,
      "iat": 9999999000,
      "names_and_roles_endpoint_url": null,
      "platform_iss": "https://lms.example.com",
      "deep_link_claim_data": null,
      "email": "oldformat@example.com",
      "name": "Old Format User",
      "deployment_id": "deployment-old",
      "message_type": "LtiResourceLinkRequest",
      "roles": ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
      "context": null,
      "resource_link": null
    }"#;

    // This should fail because the old format doesn't have the full claim URIs
    let result: Result<ToolJwt, _> = serde_json::from_str(old_format_json);
    assert!(result.is_err(), "Old format without claim URIs should fail to deserialize");
  }

  #[tokio::test]
  async fn test_new_format_with_full_claim_uris() {
    // This test verifies that the new format with full claim URIs works correctly
    let new_format_json = r#"{
      "client_id": "new-format-client",
      "iss": "https://tool.example.com",
      "sub": "user-new",
      "exp": 9999999999,
      "iat": 9999999000,
      "names_and_roles_endpoint_url": "https://lms.example.com/nrps",
      "platform_iss": "https://lms.example.com",
      "deep_link_claim_data": null,
      "email": "newformat@example.com",
      "name": "New Format User",
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "deployment-new",
      "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
      "https://purl.imsglobal.org/spec/lti/claim/roles": ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
      "https://purl.imsglobal.org/spec/lti/claim/context": {
        "id": "context-new"
      },
      "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
        "id": "link-new"
      }
    }"#;

    let tool_jwt: ToolJwt = serde_json::from_str(new_format_json)
      .expect("New format with full claim URIs should deserialize successfully");

    assert_eq!(tool_jwt.client_id, "new-format-client");
    assert_eq!(tool_jwt.deployment_id, "deployment-new");
    assert_eq!(tool_jwt.message_type, "LtiResourceLinkRequest");
    assert_eq!(tool_jwt.email, Some("newformat@example.com".to_string()));
    assert_eq!(tool_jwt.name, Some("New Format User".to_string()));
    assert!(tool_jwt.context.is_some());
    assert_eq!(tool_jwt.context.unwrap().id, "context-new");
    assert!(tool_jwt.resource_link.is_some());
    assert_eq!(tool_jwt.resource_link.unwrap().id, "link-new");
  }

  #[tokio::test]
  async fn test_encode_produces_full_claim_uris() {
    // This test verifies that encoding always produces the full claim URIs
    let tool_jwt = ToolJwt {
      client_id: "uri-test-client".to_string(),
      iss: "https://tool.example.com".to_string(),
      sub: "user-uri-test".to_string(),
      exp: (Utc::now() + Duration::minutes(60)).timestamp(),
      iat: Utc::now().timestamp(),
      names_and_roles_endpoint_url: None,
      platform_iss: "https://lms.example.com".to_string(),
      deep_link_claim_data: None,
      email: Some("uritest@example.com".to_string()),
      name: Some("URI Test User".to_string()),
      deployment_id: "deployment-uri".to_string(),
      message_type: "LtiResourceLinkRequest".to_string(),
      roles: vec!["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor".to_string()],
      context: Some(LtiContextClaim {
        id: "context-uri".to_string(),
      }),
      resource_link: Some(LtiResourceLinkClaim {
        id: "link-uri".to_string(),
      }),
    };

    let key_store = MockKeyStore::default();
    let encoded_jwt = encode_using_store(&tool_jwt, &key_store)
      .await
      .expect("Failed to encode ToolJwt");

    // Decode the JWT string to inspect the raw JSON
    let parts: Vec<&str> = encoded_jwt.split('.').collect();
    assert_eq!(parts.len(), 3, "JWT should have 3 parts");

    // Decode the payload (second part)
    let payload_bytes = URL_SAFE_NO_PAD.decode(parts[1])
      .expect("Failed to decode JWT payload");
    let payload_json = String::from_utf8(payload_bytes)
      .expect("Failed to convert payload to string");

    // Verify that the full claim URIs are present in the JSON
    assert!(payload_json.contains("https://purl.imsglobal.org/spec/lti/claim/deployment_id"));
    assert!(payload_json.contains("https://purl.imsglobal.org/spec/lti/claim/message_type"));
    assert!(payload_json.contains("https://purl.imsglobal.org/spec/lti/claim/roles"));
    assert!(payload_json.contains("https://purl.imsglobal.org/spec/lti/claim/context"));
    assert!(payload_json.contains("https://purl.imsglobal.org/spec/lti/claim/resource_link"));
  }
}
