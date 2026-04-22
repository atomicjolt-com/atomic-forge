/// Integration tests for dynamic-registration persistence.
///
/// These tests exercise DBDynamicRegistrationStore::handle_platform_response
/// end-to-end: given the PlatformConfiguration fetched from the LMS's
/// `.well-known/openid-configuration` endpoint plus the ToolConfiguration
/// returned by the LMS after the tool POSTs its client registration request,
/// the store must persist both an lti_platforms row (so future LTI launches
/// can resolve the platform by issuer) and an lti_registrations row (linking
/// the client_id to that platform).
use atomic_decay::models::lti_platform::LtiPlatform;
use atomic_decay::models::lti_registration::LtiRegistration;
use atomic_decay::stores::db_dynamic_registration::DBDynamicRegistrationStore;
use atomic_decay::tests::{setup_test_db, TestContext, TestGuard};
use atomic_lti::dynamic_registration::platform_configuration::{
  LtiPlatformConfiguration, MessageSupported, PlatformConfiguration,
};
use atomic_lti::dynamic_registration::tool_configuration::{
  LtiToolConfiguration, ToolConfiguration,
};
use atomic_lti::stores::dynamic_registration_store::DynamicRegistrationStore;

fn build_platform_configuration(issuer: &str) -> PlatformConfiguration {
  PlatformConfiguration {
    issuer: issuer.to_string(),
    authorization_endpoint: format!("{issuer}/api/lti/authorize_redirect"),
    token_endpoint: format!("{issuer}/login/oauth2/token"),
    token_endpoint_auth_methods_supported: vec!["private_key_jwt".to_string()],
    token_endpoint_auth_signing_alg_values_supported: vec!["RS256".to_string()],
    jwks_uri: format!("{issuer}/api/lti/security/jwks"),
    registration_endpoint: format!("{issuer}/api/lti/registrations"),
    scopes_supported: vec!["openid".to_string()],
    response_types_supported: vec!["id_token".to_string()],
    subject_types_supported: vec!["public".to_string()],
    id_token_signing_alg_values_supported: vec!["RS256".to_string()],
    claims_supported: vec!["sub".to_string(), "iss".to_string()],
    authorization_server: None,
    lti_platform_configuration: LtiPlatformConfiguration {
      product_family_code: "atomic-reactor".to_string(),
      version: "1.3.0".to_string(),
      messages_supported: vec![MessageSupported {
        message_type: "LtiResourceLinkRequest".to_string(),
        placements: None,
      }],
      variables: None,
    },
  }
}

fn build_tool_configuration(client_id: &str, deployment_id: &str) -> ToolConfiguration {
  ToolConfiguration {
    application_type: "web".to_string(),
    grant_types: vec!["implicit".to_string(), "client_credentials".to_string()],
    response_types: vec!["id_token".to_string()],
    redirect_uris: vec!["https://tool.example.com/lti/redirect".to_string()],
    initiate_login_uri: "https://tool.example.com/lti/init".to_string(),
    client_name: "Test Tool".to_string(),
    jwks_uri: "https://tool.example.com/jwks".to_string(),
    logo_uri: None,
    token_endpoint_auth_method: "private_key_jwt".to_string(),
    contacts: None,
    scope: "openid".to_string(),
    lti_tool_configuration: LtiToolConfiguration {
      domain: "tool.example.com".to_string(),
      secondary_domains: Some(vec![]),
      deployment_id: Some(deployment_id.to_string()),
      target_link_uri: "https://tool.example.com/lti/launch".to_string(),
      custom_parameters: None,
      description: None,
      messages: vec![],
      claims: vec![],
    },
    client_uri: Some("https://tool.example.com".to_string()),
    tos_uri: None,
    policy_uri: None,
    placements: None,
    client_id: Some(client_id.to_string()),
    registration_client_uri: None,
  }
}

#[tokio::test]
async fn test_handle_platform_response_persists_platform_and_registration() {
  let pool = setup_test_db().await;
  let mut guard = TestGuard::new(pool.clone());
  let ctx = TestContext::new("handle_platform_response_persists");

  let issuer = format!("https://{}.example.com", ctx.unique_key("reactor"));
  let client_id = ctx.unique_key("client");
  let deployment_id = ctx.unique_key("deployment");

  let platform_config = build_platform_configuration(&issuer);
  let tool_config = build_tool_configuration(&client_id, &deployment_id);

  let store = DBDynamicRegistrationStore::new(&pool);

  store
    .handle_platform_response(&platform_config, tool_config)
    .await
    .expect("handle_platform_response should succeed");

  let platform = LtiPlatform::find_by_issuer(&pool, &issuer)
    .await
    .expect("find_by_issuer should succeed")
    .expect("platform row should exist after registration so LTI launches can resolve it");

  assert_eq!(platform.issuer, issuer);
  assert_eq!(platform.jwks_url, format!("{issuer}/api/lti/security/jwks"));
  assert_eq!(platform.token_url, format!("{issuer}/login/oauth2/token"));
  assert_eq!(
    platform.oidc_url,
    format!("{issuer}/api/lti/authorize_redirect")
  );

  let registration = LtiRegistration::find_by_client_id(&pool, &client_id)
    .await
    .expect("find_by_client_id should succeed")
    .expect("registration row should exist after registration");

  assert_eq!(registration.platform_id, platform.id);
  assert_eq!(registration.client_id, client_id);
  assert_eq!(registration.deployment_id, Some(deployment_id));
  assert_eq!(registration.status, "active");

  guard.track_registration(registration.id.into());
  guard.track_platform(platform.id.into());
  guard.cleanup().await.expect("Cleanup failed");
}
