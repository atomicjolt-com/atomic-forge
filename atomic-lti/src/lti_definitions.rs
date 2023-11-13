pub const LTI_VERSION: &str = "https://purl.imsglobal.org/spec/lti/claim/version";
pub const LAUNCH_PRESENTATION: &str =
  "https://purl.imsglobal.org/spec/lti/claim/launch_presentation";
pub const DEPLOYMENT_ID: &str = "https://purl.imsglobal.org/spec/lti/claim/deployment_id";
pub const MESSAGE_TYPE: &str = "https://purl.imsglobal.org/spec/lti/claim/message_type";

// Valid values for message_type
pub const LTI_RESOURCE_LINK_REQUEST: &str = "LtiResourceLinkRequest";
pub const LTI_DEEP_LINKING_REQUEST: &str = "LtiDeepLinkingRequest";

pub const LTI_DEEP_LINKING_RESPONSE: &str = "LtiDeepLinkingResponse";

// Claims
pub const CONTEXT_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/context";
pub const RESOURCE_LINK_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/resource_link";
pub const TOOL_PLATFORM_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/tool_platform";
pub const AGS_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint";
pub const BASIC_OUTCOME_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-bo/claim/basicoutcome";

pub const MENTOR_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/role_scope_mentor";
pub const ROLES_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/roles";

pub const CUSTOM_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/custom";
pub const EXTENSION_CLAIM: &str = "http://www.ExamplePlatformVendor.com/session";

pub const LIS_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/lis";
pub const TARGET_LINK_URI_CLAIM: &str = "https://purl.imsglobal.org/spec/lti/claim/target_link_uri";
pub const LTI11_LEGACY_USER_ID_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti/claim/lti11_legacy_user_id";
pub const DEEP_LINKING_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings";
pub const DEEP_LINKING_DATA_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/data";
pub const DEEP_LINKING_TOOL_MSG_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/msg";
pub const DEEP_LINKING_TOOL_LOG_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/log";
pub const CONTENT_ITEM_CLAIM: &str = "https://purl.imsglobal.org/spec/lti-dl/claim/content_items";
pub const DEEP_LINKING_VERSION: &str = "1.3.0";

// Names and Roles
pub const NAMES_AND_ROLES_SERVICE_VERSIONS: [&str; 1] = ["2.0"];
pub const NAMES_AND_ROLES_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice";
pub const NAMES_AND_ROLES_SCOPE: &str =
  "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";

pub const CALIPER_CLAIM: &str =
  "https://purl.imsglobal.org/spec/lti-ces/claim/caliper-endpoint-service";

pub const TOOL_LAUNCH_CALIPER_CONTEXT: &str =
  "http://purl.imsglobal.org/ctx/caliper/v1p1/ToolLaunchProfile-extension";
pub const TOOL_USE_CALIPER_CONTEXT: &str = "http://purl.imsglobal.org/ctx/caliper/v1p1";

// Scopes
pub const AGS_SCOPE_LINE_ITEM: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem";
pub const AGS_SCOPE_LINE_ITEM_READONLY: &str =
  "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly";
pub const AGS_SCOPE_RESULT: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly";
pub const AGS_SCOPE_SCORE: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/score";

pub const CALIPER_SCOPE: &str = "https://purl.imsglobal.org/spec/lti-ces/v1p0/scope/send";

pub const STUDENT_SCOPE: &str = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student";
pub const INSTRUCTOR_SCOPE: &str =
  "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor";
pub const LEARNER_SCOPE: &str = "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner";
pub const MENTOR_SCOPE: &str = "http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor";
pub const MENTOR_ROLE_SCOPE: &str = "a62c52c02ba262003f5e";

// Launch contexts
pub const COURSE_CONTEXT: &str = "http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering";
pub const ACCOUNT_CONTEXT: &str = "Account";

// Configuration
pub const TOOL_CONFIGURATION: &str = "https://purl.imsglobal.org/spec/lti-tool-configuration";

// Specifies all available scopes.
pub const ALL_SCOPES: [&str; 5] = [
  AGS_SCOPE_LINE_ITEM,
  AGS_SCOPE_LINE_ITEM_READONLY,
  AGS_SCOPE_RESULT,
  AGS_SCOPE_SCORE,
  NAMES_AND_ROLES_SCOPE,
];
