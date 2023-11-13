use crate::errors::AtomicToolError;
use actix_web::HttpResponse;
use atomic_lti::client_credentials::request_service_token_cached;
use atomic_lti::lti_definitions::NAMES_AND_ROLES_SCOPE;
use atomic_lti::names_and_roles;
use atomic_lti::names_and_roles::MembershipContainer;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti::stores::platform_store::PlatformStore;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Deserialize, Serialize, Clone)]
struct NamesAndRolesResponse {
  membership: MembershipContainer,
  next_url: String,
  differences_url: String,
}

pub async fn names_and_roles(
  client_id: &str,
  names_and_roles_endpoint_url: &str,
  platform_store: &dyn PlatformStore,
  key_store: &dyn KeyStore,
) -> Result<HttpResponse, AtomicToolError> {
  let (kid, key) = key_store
    .get_current_key()
    .map_err(|e| AtomicToolError::Internal(e.to_string()))?;
  let platform_token_url = platform_store.get_token_url()?;

  // Example code. This shows how to get a token from the platform.
  let client_authorization_response = request_service_token_cached(
    client_id,
    &platform_token_url,
    NAMES_AND_ROLES_SCOPE,
    &kid,
    key.clone(),
  )
  .await
  .map_err(|e| {
    AtomicToolError::InsufficientPermissions(
      format!("Failed to get token from platform: {}", e).to_string(),
    )
  })?;

  let (membership, rel_next, rel_differences) = names_and_roles::list(
    &client_authorization_response.access_token,
    names_and_roles_endpoint_url,
    None,
    None,
    None,
  )
  .await
  .map_err(|e| AtomicToolError::Internal(format!("{}", e).to_string()))?;

  let names_and_roles_response = NamesAndRolesResponse {
    membership,
    next_url: rel_next.unwrap_or(("").to_string()),
    differences_url: rel_differences.unwrap_or(("").to_string()),
  };

  let names_and_roles_json = serde_json::to_string(&names_and_roles_response)
    .map_err(|e| AtomicToolError::Internal(e.to_string()))?;

  Ok(
    HttpResponse::Ok()
      .content_type("application/json")
      .body(names_and_roles_json),
  )
}

#[cfg(test)]
mod tests {
  use super::*;
  use actix_web::{http, test};
  use atomic_lti::{
    client_credentials::ClientAuthorizationResponse,
    names_and_roles::{Context, Member, MemberStatus},
  };
  use atomic_lti_test::helpers::{create_mock_platform_store, MockKeyStore};

  fn mock_membership_container() -> MembershipContainer {
    let context = Context {
      id: "a_test_context_id".to_string(),
      label: "Test Context".to_string(),
      title: "Test Context".to_string(),
    };
    let member1 = Member {
      email: Some("test1@example.com".to_string()),
      family_name: Some("Doe".to_string()),
      given_name: Some("John".to_string()),
      message: None,
      name: Some("John Doe".to_string()),
      picture: Some("https://example.com/picture1.jpg".to_string()),
      roles: None,
      lis_person_sourcedid: Some("123".to_string()),
      status: MemberStatus::Active,
      user_id: Some("user1".to_string()),
      lti11_legacy_user_id: Some("legacy1".to_string()),
    };

    let member2 = Member {
      email: Some("test2@example.com".to_string()),
      family_name: Some("Smith".to_string()),
      given_name: Some("Jane".to_string()),
      message: None,
      name: Some("Jane Smith".to_string()),
      picture: Some("https://example.com/picture2.jpg".to_string()),
      roles: None,
      lis_person_sourcedid: Some("456".to_string()),
      status: MemberStatus::Inactive,
      user_id: Some("user2".to_string()),
      lti11_legacy_user_id: Some("legacy2".to_string()),
    };
    let members = vec![member1, member2];
    MembershipContainer {
      context,
      id: "123".to_string(),
      members,
    }
  }

  #[test]
  async fn test_names_and_roles_success() {
    let mut server = mockito::Server::new();
    let url = server.url();

    // Mock the request for the token
    let client_authorization_response = ClientAuthorizationResponse {
      access_token: "fake-token".to_string(),
      token_type: "Bearer".to_string(),
      expires_in: 3600,
      scope: "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly"
        .to_string(),
    };
    let client_authorization_response_json =
      serde_json::to_string(&client_authorization_response).expect("failed to serialize response");
    let client_authorization_response_mock = server
      .mock("POST", "/token")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(client_authorization_response_json)
      .create();

    // Mock the request for the names and roles service
    let membership_container = mock_membership_container();
    let membership_container_json = serde_json::to_string(&membership_container)
      .expect("Failed to serialize membership container");
    let names_and_roles_mock = server
      .mock("GET", "/names_and_roles")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(membership_container_json)
      .create();

    let key_store = MockKeyStore::default();
    let platform_store = create_mock_platform_store(&url);
    let names_and_roles_endpoint_url = format!("{}/names_and_roles", url);
    let client_id = "test_client_id".to_string();

    let resp = names_and_roles(
      &client_id,
      &names_and_roles_endpoint_url,
      &platform_store,
      &key_store,
    )
    .await
    .unwrap();

    client_authorization_response_mock.assert();
    names_and_roles_mock.assert();
    assert_eq!(resp.status(), http::StatusCode::OK);
  }
}
