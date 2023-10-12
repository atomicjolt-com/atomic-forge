use serde::{Deserialize, Serialize};

// Below are all the roles specified in the LTI 1.3 spec. (https://www.imsglobal.org/spec/lti/v1p3#role-vocabularies-0)
// https://www.imsglobal.org/spec/lti/v1p3#roles-claim
// Core system roles
#[derive(Debug, PartialEq, Deserialize, Serialize, Clone)]
pub enum LtiRoles {
  AdministratorSystemRole,
  NoneSystemRole,
  AccountAdminSystemRole,
  CreatorSystemRole,
  SysAdminSystemRole,
  SysSupportSystemRole,
  UserSystemRole,
  AdministratorInstitutionRole,
  FacultyInstitutionRole,
  GuestInstitutionRole,
  NoneInstitutionRole,
  OtherInstitutionRole,
  StaffInstitutionRole,
  StudentInstitutionRole,
  AlumniInstitutionRole,
  InstructorInstitutionRole,
  LearnerInstitutionRole,
  MemberInstitutionRole,
  MentorInstitutionRole,
  ObserverInstitutionRole,
  ProspectiveStudentInstitutionRole,
  AdministratorContextRole,
  ContentDeveloperContextRole,
  InstructorContextRole,
  LearnerContextRole,
  MentorContextRole,
  ManagerContextRole,
  MemberContextRole,
  OfficerContextRole,
}

impl LtiRoles {
  pub fn from_str(s: &str) -> Option<Self> {
    match s {
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator" => {
        Some(LtiRoles::AdministratorSystemRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#None" => Some(LtiRoles::NoneSystemRole),
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#AccountAdmin" => {
        Some(LtiRoles::AccountAdminSystemRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#Creator" => {
        Some(LtiRoles::CreatorSystemRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysAdmin" => {
        Some(LtiRoles::SysAdminSystemRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#SysSupport" => {
        Some(LtiRoles::SysSupportSystemRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/system/person#User" => Some(LtiRoles::UserSystemRole),
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator" => {
        Some(LtiRoles::AdministratorInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty" => {
        Some(LtiRoles::FacultyInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Guest" => {
        Some(LtiRoles::GuestInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#None" => {
        Some(LtiRoles::NoneInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Other" => {
        Some(LtiRoles::OtherInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff" => {
        Some(LtiRoles::StaffInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student" => {
        Some(LtiRoles::StudentInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Alumni" => {
        Some(LtiRoles::AlumniInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor" => {
        Some(LtiRoles::InstructorInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner" => {
        Some(LtiRoles::LearnerInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Member" => {
        Some(LtiRoles::MemberInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Mentor" => {
        Some(LtiRoles::MentorInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Observer" => {
        Some(LtiRoles::ObserverInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#ProspectiveStudent" => {
        Some(LtiRoles::ProspectiveStudentInstitutionRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator" => {
        Some(LtiRoles::AdministratorContextRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper" => {
        Some(LtiRoles::ContentDeveloperContextRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor" => {
        Some(LtiRoles::InstructorContextRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner" => {
        Some(LtiRoles::LearnerContextRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor" => {
        Some(LtiRoles::MentorContextRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Manager" => {
        Some(LtiRoles::ManagerContextRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Member" => {
        Some(LtiRoles::MemberContextRole)
      }
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Officer" => {
        Some(LtiRoles::OfficerContextRole)
      }
      _ => None,
    }
  }

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
  fn test_from_str() {
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator"),
      Some(LtiRoles::AdministratorSystemRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/system/person#None"),
      Some(LtiRoles::NoneSystemRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/system/person#AccountAdmin"),
      Some(LtiRoles::AccountAdminSystemRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/system/person#Creator"),
      Some(LtiRoles::CreatorSystemRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/system/person#SysAdmin"),
      Some(LtiRoles::SysAdminSystemRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/system/person#SysSupport"),
      Some(LtiRoles::SysSupportSystemRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/system/person#User"),
      Some(LtiRoles::UserSystemRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator"),
      Some(LtiRoles::AdministratorInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty"),
      Some(LtiRoles::FacultyInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Guest"),
      Some(LtiRoles::GuestInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#None"),
      Some(LtiRoles::NoneInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Other"),
      Some(LtiRoles::OtherInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff"),
      Some(LtiRoles::StaffInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student"),
      Some(LtiRoles::StudentInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Alumni"),
      Some(LtiRoles::AlumniInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor"),
      Some(LtiRoles::InstructorInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner"),
      Some(LtiRoles::LearnerInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Member"),
      Some(LtiRoles::MemberInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Mentor"),
      Some(LtiRoles::MentorInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/institution/person#Observer"),
      Some(LtiRoles::ObserverInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str(
        "http://purl.imsglobal.org/vocab/lis/v2/institution/person#ProspectiveStudent"
      ),
      Some(LtiRoles::ProspectiveStudentInstitutionRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator"),
      Some(LtiRoles::AdministratorContextRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper"),
      Some(LtiRoles::ContentDeveloperContextRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"),
      Some(LtiRoles::InstructorContextRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"),
      Some(LtiRoles::LearnerContextRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor"),
      Some(LtiRoles::MentorContextRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#Manager"),
      Some(LtiRoles::ManagerContextRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#Member"),
      Some(LtiRoles::MemberContextRole)
    );
    assert_eq!(
      LtiRoles::from_str("http://purl.imsglobal.org/vocab/lis/v2/membership#Officer"),
      Some(LtiRoles::OfficerContextRole)
    );
    assert_eq!(LtiRoles::from_str("invalid_role"), None);
  }

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
