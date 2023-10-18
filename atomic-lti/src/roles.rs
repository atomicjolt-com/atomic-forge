use serde::{Deserialize, Serialize};

// Below are all the roles specified in the LTI 1.3 spec. (https://www.imsglobal.org/spec/lti/v1p3#role-vocabularies-0)
// https://www.imsglobal.org/spec/lti/v1p3#roles-claim
// Core system roles
#[derive(Debug, PartialEq, Deserialize, Serialize, Clone)]
pub enum LtiRoles {
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator")]
  AdministratorSystemRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/system/person#None")]
  NoneSystemRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/system/person#AccountAdmin")]
  AccountAdminSystemRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/system/person#Creator")]
  CreatorSystemRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysAdmin")]
  SysAdminSystemRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysSupport")]
  SysSupportSystemRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/system/person#User")]
  UserSystemRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator")]
  AdministratorInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty")]
  FacultyInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Guest")]
  GuestInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#None")]
  NoneInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Other")]
  OtherInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff")]
  StaffInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student")]
  StudentInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Alumni")]
  AlumniInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor")]
  InstructorInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner")]
  LearnerInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Member")]
  MemberInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Mentor")]
  MentorInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Observer")]
  ObserverInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#ProspectiveStudent")]
  ProspectiveStudentInstitutionRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator")]
  AdministratorContextRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper")]
  ContentDeveloperContextRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor")]
  InstructorContextRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner")]
  LearnerContextRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor")]
  MentorContextRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#Manager")]
  ManagerContextRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#Member")]
  MemberContextRole,
  #[serde(rename = "http://purl.imsglobal.org/vocab/lis/v2/membership#Officer")]
  OfficerContextRole,
}

impl LtiRoles {
  pub fn as_str(&self) -> &str {
    match self {
      LtiRoles::AdministratorSystemRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator"
      }
      LtiRoles::NoneSystemRole => "http://purl.imsglobal.org/vocab/lis/v2/system/person#None",
      LtiRoles::AccountAdminSystemRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/system/person#AccountAdmin"
      }
      LtiRoles::CreatorSystemRole => "http://purl.imsglobal.org/vocab/lis/v2/system/person#Creator",
      LtiRoles::SysAdminSystemRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysAdmin"
      }
      LtiRoles::SysSupportSystemRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysSupport"
      }
      LtiRoles::UserSystemRole => "http://purl.imsglobal.org/vocab/lis/v2/system/person#User",
      LtiRoles::AdministratorInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator"
      }
      LtiRoles::FacultyInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty"
      }
      LtiRoles::GuestInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Guest"
      }
      LtiRoles::NoneInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#None"
      }
      LtiRoles::OtherInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Other"
      }
      LtiRoles::StaffInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff"
      }
      LtiRoles::StudentInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student"
      }
      LtiRoles::AlumniInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Alumni"
      }
      LtiRoles::InstructorInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor"
      }
      LtiRoles::LearnerInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner"
      }
      LtiRoles::MemberInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Member"
      }
      LtiRoles::MentorInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Mentor"
      }
      LtiRoles::ObserverInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Observer"
      }
      LtiRoles::ProspectiveStudentInstitutionRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#ProspectiveStudent"
      }
      LtiRoles::AdministratorContextRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator"
      }
      LtiRoles::ContentDeveloperContextRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper"
      }
      LtiRoles::InstructorContextRole => {
        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
      }
      LtiRoles::LearnerContextRole => "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
      LtiRoles::MentorContextRole => "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor",
      LtiRoles::ManagerContextRole => "http://purl.imsglobal.org/vocab/lis/v2/membership#Manager",
      LtiRoles::MemberContextRole => "http://purl.imsglobal.org/vocab/lis/v2/membership#Member",
      LtiRoles::OfficerContextRole => "http://purl.imsglobal.org/vocab/lis/v2/membership#Officer",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  #[test]
  fn test_as_str() {
    assert_eq!(
      LtiRoles::AdministratorSystemRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator"
    );
    assert_eq!(
      LtiRoles::NoneSystemRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#None"
    );
    assert_eq!(
      LtiRoles::AccountAdminSystemRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#AccountAdmin"
    );
    assert_eq!(
      LtiRoles::CreatorSystemRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#Creator"
    );
    assert_eq!(
      LtiRoles::SysAdminSystemRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysAdmin"
    );
    assert_eq!(
      LtiRoles::SysSupportSystemRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysSupport"
    );
    assert_eq!(
      LtiRoles::UserSystemRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#User"
    );
    assert_eq!(
      LtiRoles::AdministratorInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator"
    );
    assert_eq!(
      LtiRoles::FacultyInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty"
    );
    assert_eq!(
      LtiRoles::GuestInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Guest"
    );
    assert_eq!(
      LtiRoles::NoneInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#None"
    );
    assert_eq!(
      LtiRoles::OtherInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Other"
    );
    assert_eq!(
      LtiRoles::StaffInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff"
    );
    assert_eq!(
      LtiRoles::StudentInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student"
    );
    assert_eq!(
      LtiRoles::AlumniInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Alumni"
    );
    assert_eq!(
      LtiRoles::InstructorInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor"
    );
    assert_eq!(
      LtiRoles::LearnerInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner"
    );
    assert_eq!(
      LtiRoles::MemberInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Member"
    );
    assert_eq!(
      LtiRoles::MentorInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Mentor"
    );
    assert_eq!(
      LtiRoles::ObserverInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Observer"
    );
    assert_eq!(
      LtiRoles::ProspectiveStudentInstitutionRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#ProspectiveStudent"
    );
    assert_eq!(
      LtiRoles::AdministratorContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator"
    );
    assert_eq!(
      LtiRoles::ContentDeveloperContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper"
    );
    assert_eq!(
      LtiRoles::InstructorContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
    );
    assert_eq!(
      LtiRoles::LearnerContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
    );
    assert_eq!(
      LtiRoles::MentorContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor"
    );
    assert_eq!(
      LtiRoles::ManagerContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Manager"
    );
    assert_eq!(
      LtiRoles::MemberContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Member"
    );
    assert_eq!(
      LtiRoles::OfficerContextRole.as_str(),
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Officer"
    );
  }
}
