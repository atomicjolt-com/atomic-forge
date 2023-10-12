use crate::id_token::{IdToken, IdTokenErrors};
use crate::roles::LtiRoles;
use serde::{Deserialize, Serialize};
use strum_macros::EnumString;

pub const NAMES_AND_ROLES_SERVICE_VERSIONS: [&str; 1] = ["2.0"];
pub const NAMES_AND_ROLES_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice";

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

// #[cfg(test)]
// mod tests {
//   use super::*;

//   #[test]
//   fn test_membership_container_deserialization() {
//     let json = r#"{
//       "id": "https://example.com/membership",
//       "context": {
//         "id": "https://example.com/context",
//         "label": "Example Course",
//         "title": "Example Course Title"
//       },
//       "members": [
//         {
//           "email": "jane.doe@example.com",
//           "family_name": "Doe",
//           "given_name": "Jane",
//           "message": null,
//           "name": "Jane Doe",
//           "picture": null,
//           "roles": [
//             "Learner"
//           ],
//           "lis_person_sourcedid": "123456",
//           "status": "Active",
//           "user_id": "jane.doe",
//           "lti11_legacy_user_id": null
//         },
//         {
//           "email": "john.doe@example.com",
//           "family_name": "Doe",
//           "given_name": "John",
//           "message": null,
//           "name": "John Doe",
//           "picture": null,
//           "roles": [
//             "Instructor"
//           ],
//           "lis_person_sourcedid": "789012",
//           "status": "Active",
//           "user_id": "john.doe",
//           "lti11_legacy_user_id": null
//         }
//       ]
//     }"#;

//     let container: MembershipContainer = serde_json::from_str(json).unwrap();

//     assert_eq!(container.id, "https://example.com/membership");
//     assert_eq!(container.context.id, "https://example.com/context");
//     assert_eq!(container.context.label, "Example Course");
//     assert_eq!(container.context.title, "Example Course Title");
//     assert_eq!(container.members.len(), 2);
//     assert_eq!(container.members[0].email, Some("jane.doe@example.com".to_string()));
//     assert_eq!(container.members[0].family_name, Some("Doe".to_string()));
//     assert_eq!(container.members[0].given_name, Some("Jane".to_string()));
//     assert_eq!(container.members[0].message, None);
//     assert_eq!(container.members[0].name, Some("Jane Doe".to_string()));
//     assert_eq!(container.members[0].picture, None);
//     assert_eq!(container.members[0].roles, Some(vec![LtiRoles::Learner]));
//     assert_eq!(container.members[0].lis_person_sourcedid, Some("123456".to_string()));
//     assert_eq!(container.members[0].status, MemberStatus::Active);
//     assert_eq!(container.members[0].user_id, Some("jane.doe".to_string()));
//     assert_eq!(container.members[0].lti11_legacy_user_id, None);
//     assert_eq!(container.members[1].email, Some("john.doe@example.com".to_string()));
//     assert_eq!(container.members[1].family_name, Some("Doe".to_string()));
//     assert_eq!(container.members[1].given_name, Some("John".to_string()));
//     assert_eq!(container.members[1].message, None);
//     assert_eq!(container.members[1].name, Some("John Doe".to_string()));
//     assert_eq!(container.members[1].picture, None);
//     assert_eq!(container.members[1].roles, Some(vec![LtiRoles::Instructor]));
//     assert_eq!(container.members[1].lis_person_sourcedid, Some("789012".to_string()));
//     assert_eq!(container.members[1].status, MemberStatus::Active);
//     assert_eq!(container.members[1].user_id, Some("john.doe".to_string()));
//     assert_eq!(container.members[1].lti11_legacy_user_id, None);
//   }

//   #[test]
//   fn test_names_and_roles_claim_serialization() {
//     let claim = NamesAndRolesClaim {
//       context_memberships_url: "https://example.com/membership".to_string(),
//       service_versions: vec!["2.0".to_string()],
//       validation_context: None,
//       errors: None,
//     };

//     let json = serde_json::to_string(&claim).unwrap();

//     assert_eq!(json, r#"{"context_memberships_url":"https://example.com/membership","service_versions":["2.0"]}"#);
//   }
// }
