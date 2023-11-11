use crate::errors::NamesAndRolesError;
use crate::id_token::{IdToken, IdTokenErrors};
use crate::roles::LtiRoles;
use reqwest::header;
use serde::{Deserialize, Serialize};
use strum_macros::EnumString;
use url::Url;

pub const NAMES_AND_ROLES_SERVICE_VERSIONS: [&str; 1] = ["2.0"];
pub const NAMES_AND_ROLES_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice";
pub const NAMES_AND_ROLES_SCOPE: &str =
  "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Context {
  pub id: String,
  pub label: String,
  pub title: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Member {
  // Email. Not specified if not included in a basic launch from same context.
  pub email: Option<String>,

  // Family name. Not specified if not included in a basic launch from same context.
  pub family_name: Option<String>,

  // First name. Not specified if not included in a basic launch from same context.
  pub given_name: Option<String>,

  // Contains context and resource link specific message parameters.
  pub message: Option<Vec<IdToken>>,

  // Typically first name followed by family name separated with a space.
  // Not specified if not included in a basic launch from same context.
  pub name: Option<String>,

  // A URL to an image for the person.
  // Not specified if not included in a basic launch from same context.
  pub picture: Option<String>,

  // The roles this member has in the context. Does not include non-context roles.
  pub roles: Option<Vec<LtiRoles>>,

  // A unique identifier for the person as provisioned by an external system such as an SIS.
  pub lis_person_sourcedid: Option<String>,

  // Membership status is either Active or Inactive. Defaults to Active if not specified.
  // #[serde(default = MemberStatus::Active)]
  pub status: MemberStatus,

  // A unique identifier for the person. Corresponds to the "sub" claim.
  pub user_id: Option<String>,

  // If the user id is changing with the migration to LTI 1.3, a platform should include the lti11_legacy_user_id
  // as an additional member attribute. It should contain the userId value from LTI 1.1 Names and Roles Provisioning
  // Service 1.0 for that same user.
  pub lti11_legacy_user_id: Option<String>,
}

#[derive(Debug, PartialEq, EnumString, Serialize, Deserialize, Clone)]
pub enum MemberStatus {
  Active,
  Inactive,
  Deleted,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MembershipContainer {
  pub id: String, // The ID of these results. Typically the request URL to Membership service.
  pub context: Context, // Context information for the list of members.
  pub members: Vec<Member>, // The list of members in the specified context.
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct NamesAndRolesClaim {
  pub context_memberships_url: String,
  // #[serde(default = NAMES_AND_ROLES_SERVICE_VERSIONS)]
  pub service_versions: Vec<String>,
  pub validation_context: Option<String>,
  pub errors: Option<IdTokenErrors>,
}

impl NamesAndRolesClaim {
  pub fn new(context_memberships_url: &str) -> Self {
    Self {
      context_memberships_url: context_memberships_url.to_string(),
      service_versions: NAMES_AND_ROLES_SERVICE_VERSIONS
        .iter()
        .map(|&s| s.to_string())
        .collect(),
      validation_context: None,
      errors: None,
    }
  }
}

// List the members of a context
//
// Arguments:
// api_token - The access token provided by the platform. See client_credientials.rs 'request_service_token_cached'
//   to learn how to obtain a token
// context_memberships_url - The URL of the context memberships endpoint provided by the platform in the ID Token.
//   See 'names_and_roles_endpoint' in id_token.rs to obtain this value
//   For example: id_token.names_and_roles_endpoint
// role - If provided will filter to those memberships which have the specified role.
// limit - see 'Limit query parameter' section of NRPS spec
// resource_link_id - If provided this will filter the membership to those which have access to the specified resource link
//
//
pub async fn list(
  api_token: &str,
  context_memberships_url: &str,
  role: Option<&str>,
  limit: Option<usize>,
  resource_link_id: Option<&str>,
) -> Result<(MembershipContainer, Option<String>, Option<String>), NamesAndRolesError> {
  let mut url = Url::parse(context_memberships_url)
    .map_err(|e| NamesAndRolesError::RequestFailed(e.to_string()))?;

  if let Some(role) = role {
    url.query_pairs_mut().append_pair("role", role);
  }

  if let Some(limit) = limit {
    url
      .query_pairs_mut()
      .append_pair("limit", format!("{}", &limit).as_str());
  }

  if let Some(resource_link_id) = resource_link_id {
    url.query_pairs_mut().append_pair("rlid", resource_link_id);
  }

  let client = reqwest::Client::new();
  let response = client
    .get(url.as_str())
    .header(
      header::ACCEPT,
      "application/vnd.ims.lti-nrps.v2.membershipcontainer+json",
    )
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .send()
    .await
    .map_err(|e| NamesAndRolesError::RequestFailed(e.to_string()))?;

  let rel_next = match response.headers().get("rel=\"next\"") {
    Some(v) => {
      let n = v
        .to_str()
        .map_err(|e| NamesAndRolesError::RequestFailed(e.to_string()))?;
      Some(n.to_string())
    }
    None => None,
  };

  let rel_differences = match response.headers().get("rel=\"differences\"") {
    Some(v) => {
      let n = v
        .to_str()
        .map_err(|e| NamesAndRolesError::RequestFailed(e.to_string()))?;
      Some(n.to_string())
    }
    None => None,
  };

  let status = response.status();
  let body = response
    .text()
    .await
    .map_err(|e| NamesAndRolesError::RequestFailed(e.to_string()))?;

  if !status.is_success() {
    return Err(NamesAndRolesError::RequestFailed(body));
  }

  let result: MembershipContainer =
    serde_json::from_str(&body).map_err(|e| NamesAndRolesError::RequestFailed(e.to_string()))?;

  Ok((result, rel_next, rel_differences))
}
