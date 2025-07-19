use crate::{errors::AppError, stores::tool_jwt_store::ToolJwt, AppState};
use axum::{
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use std::sync::Arc;

/// JWT claims extractor for authenticated routes
/// Validates JWT token and extracts claims for use in handlers
#[derive(Clone)]
pub struct JwtClaims {
    pub claims: ToolJwt,
}

impl JwtClaims {
    pub fn client_id(&self) -> &str {
        &self.claims.client_id
    }
    
    pub fn platform_iss(&self) -> &str {
        &self.claims.platform_iss
    }
    
    pub fn deployment_id(&self) -> &str {
        &self.claims.deployment_id
    }
}

impl<S> FromRequestParts<S> for JwtClaims
where
    S: Send + Sync,
    Arc<AppState>: FromRef<S>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let _app_state = Arc::<AppState>::from_ref(state);
        
        // Extract JWT token from Authorization header
        let _token = parts
            .headers
            .get("authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "))
            .ok_or_else(|| AppError::Custom("Missing or invalid Authorization header".to_string()))?;
        
        // TODO: Implement JWT validation using the key store
        // For now, we'll return an error to indicate this needs implementation
        Err(AppError::Custom("JWT validation not yet implemented".to_string()))
    }
}