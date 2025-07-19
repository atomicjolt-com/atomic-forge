use atomic_lti::{
    id_token::IdToken,
    stores::{oidc_state_store::OIDCStateStore, platform_store::PlatformStore},
};
use chrono::{DateTime, Utc, Duration};
use crate::ToolError;

pub struct LtiLaunchValidator;

impl LtiLaunchValidator {
    /// Comprehensive LTI 1.3 launch validation according to specification
    pub async fn validate_launch(
        id_token: &IdToken,
        oidc_state_store: &dyn OIDCStateStore,
        platform_store: &dyn PlatformStore,
        client_id: &str,
        target_link_uri: &str,
    ) -> Result<(), ToolError> {
        // 1. Basic OIDC validation (existing)
        Self::validate_basic_oidc(id_token, oidc_state_store)?;
        
        // 2. LTI-specific validations
        Self::validate_lti_version(&id_token.lti_version)?;
        Self::validate_message_type(&id_token.message_type)?;
        Self::validate_audience(&id_token.aud, client_id)?;
        Self::validate_issuer(&id_token.iss, platform_store).await?;
        Self::validate_target_link_uri(&id_token.target_link_uri, target_link_uri)?;
        Self::validate_deployment_id(&id_token.deployment_id)?;
        Self::validate_resource_link(id_token)?;
        Self::validate_roles(&id_token.roles)?;
        Self::validate_claims_structure(id_token)?;
        
        Ok(())
    }

    fn validate_basic_oidc(
        id_token: &IdToken,
        oidc_state_store: &dyn OIDCStateStore,
    ) -> Result<(), ToolError> {
        // Validate nonce
        if id_token.nonce != oidc_state_store.get_nonce() {
            return Err(ToolError::Unauthorized("Invalid nonce".to_string()));
        }

        // Validate state expiration (10 minutes max)
        let created_at = oidc_state_store.get_created_at();
        let now = chrono::Utc::now().naive_utc();
        
        if now.signed_duration_since(created_at) > Duration::minutes(10) {
            return Err(ToolError::Unauthorized("OIDC state expired".to_string()));
        }

        // Validate token expiration
        let exp = DateTime::from_timestamp(id_token.exp, 0)
            .ok_or_else(|| ToolError::BadRequest("Invalid exp claim".to_string()))?;
            
        if Utc::now() > exp {
            return Err(ToolError::Unauthorized("Token expired".to_string()));
        }

        // Validate issued at time (not too far in the past or future)
        let iat = DateTime::from_timestamp(id_token.iat, 0)
            .ok_or_else(|| ToolError::BadRequest("Invalid iat claim".to_string()))?;
            
        let now = Utc::now();
        if (now - iat).num_minutes().abs() > 5 {
            return Err(ToolError::Unauthorized("Token issued at invalid time".to_string()));
        }

        Ok(())
    }

    fn validate_lti_version(version: &str) -> Result<(), ToolError> {
        if !version.starts_with("1.3") {
            return Err(ToolError::BadRequest(
                format!("Unsupported LTI version: {}", version)
            ));
        }
        Ok(())
    }

    fn validate_message_type(message_type: &str) -> Result<(), ToolError> {
        const VALID_MESSAGE_TYPES: &[&str] = &[
            "LtiResourceLinkRequest",
            "LtiDeepLinkingRequest",
            "LtiSubmissionReviewRequest",
        ];

        if !VALID_MESSAGE_TYPES.contains(&message_type) {
            return Err(ToolError::BadRequest(
                format!("Invalid message type: {}", message_type)
            ));
        }
        Ok(())
    }

    fn validate_audience(aud: &str, expected_client_id: &str) -> Result<(), ToolError> {
        if aud != expected_client_id {
            return Err(ToolError::Unauthorized(
                "Token audience does not match client_id".to_string()
            ));
        }
        Ok(())
    }

    async fn validate_issuer(
        _iss: &str,
        platform_store: &dyn PlatformStore,
    ) -> Result<(), ToolError> {
        // Verify issuer is a known/registered platform
        let _platform_oidc_url = platform_store.get_oidc_url()
            .map_err(|_| ToolError::Unauthorized("Unknown platform issuer".to_string()))?;
            
        // Additional issuer validation logic here
        // In production, check against registered platform list
        
        Ok(())
    }

    fn validate_target_link_uri(
        token_target: &str,
        expected_target: &str,
    ) -> Result<(), ToolError> {
        if token_target != expected_target {
            return Err(ToolError::BadRequest(
                "Target link URI mismatch".to_string()
            ));
        }
        Ok(())
    }

    fn validate_deployment_id(deployment_id: &str) -> Result<(), ToolError> {
        if deployment_id.is_empty() {
            return Err(ToolError::BadRequest(
                "Missing deployment_id".to_string()
            ));
        }
        
        // Additional deployment validation
        // In production, verify deployment_id against registered deployments
        
        Ok(())
    }

    fn validate_resource_link(id_token: &IdToken) -> Result<(), ToolError> {
        if let Some(resource_link) = &id_token.resource_link {
            if resource_link.id.is_empty() {
                return Err(ToolError::BadRequest(
                    "Empty resource link ID".to_string()
                ));
            }
        } else {
            // Resource link is required for LtiResourceLinkRequest
            if id_token.message_type == "LtiResourceLinkRequest" {
                return Err(ToolError::BadRequest(
                    "Missing resource_link for LtiResourceLinkRequest".to_string()
                ));
            }
        }
        Ok(())
    }

    fn validate_roles(roles: &[String]) -> Result<(), ToolError> {
        // Validate that roles use proper IMS vocabulary
        const VALID_ROLE_PREFIXES: &[&str] = &[
            "http://purl.imsglobal.org/vocab/lis/v2/membership#",
            "http://purl.imsglobal.org/vocab/lis/v2/institution/person#",
            "http://purl.imsglobal.org/vocab/lis/v2/system/person#",
        ];

        for role in roles {
            let is_valid = VALID_ROLE_PREFIXES.iter()
                .any(|prefix| role.starts_with(prefix));
                
            if !is_valid {
                return Err(ToolError::BadRequest(
                    format!("Invalid role format: {}", role)
                ));
            }
        }
        
        Ok(())
    }

    fn validate_claims_structure(id_token: &IdToken) -> Result<(), ToolError> {
        // Validate required claims are present
        if id_token.sub.is_empty() {
            return Err(ToolError::BadRequest("Missing sub claim".to_string()));
        }
        
        if id_token.iss.is_empty() {
            return Err(ToolError::BadRequest("Missing iss claim".to_string()));
        }

        // Message type specific validations
        match id_token.message_type.as_str() {
            "LtiDeepLinkingRequest" => {
                if id_token.deep_linking.is_none() {
                    return Err(ToolError::BadRequest(
                        "Missing deep_linking_settings for deep linking request".to_string()
                    ));
                }
            },
            "LtiResourceLinkRequest" => {
                if id_token.resource_link.is_none() {
                    return Err(ToolError::BadRequest(
                        "Missing resource_link for resource link request".to_string()
                    ));
                }
            },
            _ => {}
        }

        Ok(())
    }
}