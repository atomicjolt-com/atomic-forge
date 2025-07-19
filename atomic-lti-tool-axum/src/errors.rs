use thiserror::Error;

#[derive(Error, Debug)]
pub enum ToolError {
    #[error("Internal error: {0}")]
    Internal(String),
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Forbidden: {0}")]
    Forbidden(String),
    
    #[error("Conflict: {0}")]
    Conflict(String),
    
    #[error("Unprocessable entity: {0}")]
    UnprocessableEntity(String),
    
    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
    
    #[error("Gateway timeout: {0}")]
    GatewayTimeout(String),
    
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    
    #[error("HTTP client error: {0}")]
    HttpClient(#[from] reqwest::Error),
    
    #[error("URL parsing error: {0}")]
    UrlParse(#[from] url::ParseError),
    
    #[error("Base64 decode error: {0}")]
    Base64Decode(#[from] base64::DecodeError),
    
    #[error("OpenSSL error: {0}")]
    OpenSsl(#[from] openssl::error::ErrorStack),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Configuration error: {0}")]
    Configuration(String),
    
    #[error("Database error: {0}")]
    Database(String),
    
    #[error("Cache error: {0}")]
    Cache(String),
    
    #[error("Network error: {0}")]
    Network(String),
    
    #[error("Timeout error: {0}")]
    Timeout(String),
    
    #[error("Rate limit exceeded: {0}")]
    RateLimit(String),
    
    #[error("Insufficient permissions: {0}")]
    InsufficientPermissions(String),
}

// Conversion from atomic-lti errors
impl From<atomic_lti::errors::OIDCError> for ToolError {
    fn from(err: atomic_lti::errors::OIDCError) -> Self {
        ToolError::Internal(err.to_string())
    }
}

impl From<atomic_lti::errors::PlatformError> for ToolError {
    fn from(err: atomic_lti::errors::PlatformError) -> Self {
        ToolError::Internal(err.to_string())
    }
}

impl From<atomic_lti::errors::SecureError> for ToolError {
    fn from(err: atomic_lti::errors::SecureError) -> Self {
        ToolError::Internal(err.to_string())
    }
}

// These error types might not exist in the current atomic-lti version
// Commenting out for now until we can verify the actual error types
/*
impl From<atomic_lti::errors::LtiError> for ToolError {
    fn from(err: atomic_lti::errors::LtiError) -> Self {
        match err {
            atomic_lti::errors::LtiError::InvalidMessageType => ToolError::BadRequest("Invalid LTI message type".to_string()),
            atomic_lti::errors::LtiError::InvalidVersion => ToolError::BadRequest("Invalid LTI version".to_string()),
            atomic_lti::errors::LtiError::MissingClaim(claim) => ToolError::BadRequest(format!("Missing required claim: {}", claim)),
            atomic_lti::errors::LtiError::InvalidClaim(claim) => ToolError::BadRequest(format!("Invalid claim: {}", claim)),
            atomic_lti::errors::LtiError::InvalidDeploymentId => ToolError::BadRequest("Invalid deployment ID".to_string()),
            atomic_lti::errors::LtiError::InvalidResourceLink => ToolError::BadRequest("Invalid resource link".to_string()),
            atomic_lti::errors::LtiError::InvalidContext => ToolError::BadRequest("Invalid context".to_string()),
            atomic_lti::errors::LtiError::InvalidRole => ToolError::BadRequest("Invalid role".to_string()),
            atomic_lti::errors::LtiError::UnsupportedMessageType => ToolError::BadRequest("Unsupported message type".to_string()),
            _ => ToolError::Internal(err.to_string()),
        }
    }
}

impl From<atomic_lti::errors::ValidationError> for ToolError {
    fn from(err: atomic_lti::errors::ValidationError) -> Self {
        ToolError::Validation(err.to_string())
    }
}

impl From<atomic_lti::errors::StoreError> for ToolError {
    fn from(err: atomic_lti::errors::StoreError) -> Self {
        match err {
            atomic_lti::errors::StoreError::NotFound => ToolError::NotFound("Resource not found in store".to_string()),
            atomic_lti::errors::StoreError::Conflict => ToolError::Conflict("Resource conflict in store".to_string()),
            atomic_lti::errors::StoreError::Database(msg) => ToolError::Database(msg),
            atomic_lti::errors::StoreError::Network(msg) => ToolError::Network(msg),
            atomic_lti::errors::StoreError::Timeout(msg) => ToolError::Timeout(msg),
            _ => ToolError::Internal(err.to_string()),
        }
    }
}
*/

// Helper methods for error handling
impl ToolError {
    pub fn is_client_error(&self) -> bool {
        matches!(
            self,
            ToolError::BadRequest(_)
                | ToolError::Unauthorized(_)
                | ToolError::Forbidden(_)
                | ToolError::NotFound(_)
                | ToolError::Conflict(_)
                | ToolError::UnprocessableEntity(_)
                | ToolError::Validation(_)
                | ToolError::RateLimit(_)
                | ToolError::InsufficientPermissions(_)
        )
    }

    pub fn is_server_error(&self) -> bool {
        matches!(
            self,
            ToolError::Internal(_)
                | ToolError::ServiceUnavailable(_)
                | ToolError::GatewayTimeout(_)
                | ToolError::Configuration(_)
                | ToolError::Database(_)
                | ToolError::Cache(_)
                | ToolError::Network(_)
                | ToolError::Timeout(_)
        )
    }

    pub fn status_code(&self) -> axum::http::StatusCode {
        use axum::http::StatusCode;
        
        match self {
            ToolError::BadRequest(_) => StatusCode::BAD_REQUEST,
            ToolError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            ToolError::Forbidden(_) => StatusCode::FORBIDDEN,
            ToolError::NotFound(_) => StatusCode::NOT_FOUND,
            ToolError::Conflict(_) => StatusCode::CONFLICT,
            ToolError::UnprocessableEntity(_) => StatusCode::UNPROCESSABLE_ENTITY,
            ToolError::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            ToolError::GatewayTimeout(_) => StatusCode::GATEWAY_TIMEOUT,
            ToolError::RateLimit(_) => StatusCode::TOO_MANY_REQUESTS,
            ToolError::InsufficientPermissions(_) => StatusCode::FORBIDDEN,
            ToolError::Validation(_) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    pub fn error_code(&self) -> &'static str {
        match self {
            ToolError::Internal(_) => "INTERNAL_ERROR",
            ToolError::BadRequest(_) => "BAD_REQUEST",
            ToolError::Unauthorized(_) => "UNAUTHORIZED",
            ToolError::NotFound(_) => "NOT_FOUND",
            ToolError::Forbidden(_) => "FORBIDDEN",
            ToolError::Conflict(_) => "CONFLICT",
            ToolError::UnprocessableEntity(_) => "UNPROCESSABLE_ENTITY",
            ToolError::ServiceUnavailable(_) => "SERVICE_UNAVAILABLE",
            ToolError::GatewayTimeout(_) => "GATEWAY_TIMEOUT",
            ToolError::Json(_) => "JSON_ERROR",
            ToolError::Jwt(_) => "JWT_ERROR",
            ToolError::HttpClient(_) => "HTTP_CLIENT_ERROR",
            ToolError::UrlParse(_) => "URL_PARSE_ERROR",
            ToolError::Base64Decode(_) => "BASE64_DECODE_ERROR",
            ToolError::OpenSsl(_) => "OPENSSL_ERROR",
            ToolError::Validation(_) => "VALIDATION_ERROR",
            ToolError::Configuration(_) => "CONFIGURATION_ERROR",
            ToolError::Database(_) => "DATABASE_ERROR",
            ToolError::Cache(_) => "CACHE_ERROR",
            ToolError::Network(_) => "NETWORK_ERROR",
            ToolError::Timeout(_) => "TIMEOUT_ERROR",
            ToolError::RateLimit(_) => "RATE_LIMIT_ERROR",
            ToolError::InsufficientPermissions(_) => "INSUFFICIENT_PERMISSIONS",
        }
    }
}