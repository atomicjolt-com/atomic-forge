use crate::{handlers::LtiDependencies, ToolError};
use atomic_lti::{
    names_and_roles::{Context, MembershipContainer},
    stores::{key_store::KeyStore, platform_store::PlatformStore},
};
use axum::{
    extract::{Query, State},
    http::header,
    Extension, Json,
};
use cached::proc_macro::cached;
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct NrpsParams {
    pub context_id: Option<String>,
    pub role: Option<String>,
    pub limit: Option<u32>,
    pub rlid: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceTokenClaims {
    pub iss: String,
    pub sub: String,
    pub aud: Vec<String>,
    pub exp: u64,
    pub iat: u64,
    pub jti: String,
    pub scopes: Vec<String>,
}

// Cached service token retrieval
#[cached(
    time = 3600,
    key = "String",
    convert = r#"{ format!("{}:{}", _platform_id, scopes.join(",")) }"#
)]
async fn get_cached_service_token(
    _platform_id: String,
    scopes: Vec<String>,
    token_url: String,
    client_id: String,
    private_key: String,
    key_id: String,
) -> Result<String, String> {
    let now = Utc::now();
    let exp = now + Duration::minutes(5);

    let claims = ServiceTokenClaims {
        iss: client_id.clone(),
        sub: client_id.clone(),
        aud: vec![token_url.clone()],
        exp: exp.timestamp() as u64,
        iat: now.timestamp() as u64,
        jti: Uuid::new_v4().to_string(),
        scopes: scopes.clone(),
    };

    let encoding_key = EncodingKey::from_rsa_pem(private_key.as_bytes())
        .map_err(|e| format!("Invalid private key: {}", e))?;

    let mut header = Header::new(Algorithm::RS256);
    header.kid = Some(key_id);

    let jwt = encode(&header, &claims, &encoding_key)
        .map_err(|e| format!("Failed to sign JWT: {}", e))?;

    // Request access token
    let client = Client::new();
    let params = [
        ("grant_type", "client_credentials"),
        ("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"),
        ("client_assertion", &jwt),
        ("scope", &scopes.join(" ")),
    ];

    let response = client
        .post(&token_url)
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Token request failed with status: {}", response.status()));
    }

    let token_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let access_token = token_response["access_token"]
        .as_str()
        .ok_or_else(|| "Missing access_token in response".to_string())?;

    Ok(access_token.to_string())
}

pub async fn names_and_roles<T>(
    State(deps): State<Arc<T>>,
    Query(params): Query<NrpsParams>,
    Extension(claims): Extension<crate::middleware::jwt_authentication_middleware::Claims>,
) -> Result<Json<MembershipContainer>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Get platform configuration
    let platform_store = deps.create_platform_store(&claims.iss).await?;
    
    // Get NRPS endpoint from platform configuration
    let nrps_endpoint = "https://platform.example.com/nrps".to_string(); // This should come from platform configuration

    // Get service token
    let key_store = deps.key_store();
    let (kid, _rsa_key) = key_store
        .get_current_key()
        .map_err(|e| ToolError::Internal(format!("Failed to get current key: {}", e)))?;

    let token_url = platform_store
        .get_token_url()
        .map_err(|e| ToolError::Internal(format!("Failed to get token URL: {}", e)))?;

    let client_id = "mock_client_id".to_string(); // This should come from platform store

    let scopes = vec!["https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly".to_string()];

    let access_token = get_cached_service_token(
        claims.iss.clone(),
        scopes,
        token_url,
        client_id,
        "mock_private_key".to_string(),
        kid,
    )
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get service token: {}", e)))?;

    // Build NRPS request URL
    let mut nrps_url = nrps_endpoint;
    let mut query_params = Vec::new();

    if let Some(context_id) = params.context_id {
        query_params.push(format!("context_id={}", urlencoding::encode(&context_id)));
    }
    if let Some(role) = params.role {
        query_params.push(format!("role={}", urlencoding::encode(&role)));
    }
    if let Some(limit) = params.limit {
        query_params.push(format!("limit={}", limit));
    }
    if let Some(rlid) = params.rlid {
        query_params.push(format!("rlid={}", urlencoding::encode(&rlid)));
    }

    if !query_params.is_empty() {
        nrps_url.push('?');
        nrps_url.push_str(&query_params.join("&"));
    }

    // Make NRPS request
    let client = Client::new();
    let response = client
        .get(&nrps_url)
        .header(header::AUTHORIZATION, format!("Bearer {}", access_token))
        .header(header::ACCEPT, "application/vnd.ims.lti-nrps.v2.membershipcontainer+json")
        .send()
        .await
        .map_err(|e| ToolError::Internal(format!("NRPS request failed: {}", e)))?;

    if !response.status().is_success() {
        return Err(ToolError::Internal(format!(
            "NRPS request failed with status: {}",
            response.status()
        )));
    }

    let membership_container: MembershipContainer = response
        .json()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to parse NRPS response: {}", e)))?;

    Ok(Json(membership_container))
}

pub async fn names_and_roles_context<T>(
    State(deps): State<Arc<T>>,
    Query(_params): Query<NrpsParams>,
    Extension(claims): Extension<crate::middleware::jwt_authentication_middleware::Claims>,
) -> Result<Json<Context>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Similar to names_and_roles but returns context information
    let platform_store = deps.create_platform_store(&claims.iss).await?;
    
    let nrps_endpoint = "https://platform.example.com/nrps".to_string(); // This should come from platform configuration

    // Get service token (similar to above)
    let key_store = deps.key_store();
    let (kid, _rsa_key) = key_store
        .get_current_key()
        .map_err(|e| ToolError::Internal(format!("Failed to get current key: {}", e)))?;

    let token_url = platform_store
        .get_token_url()
        .map_err(|e| ToolError::Internal(format!("Failed to get token URL: {}", e)))?;

    let client_id = "mock_client_id".to_string(); // This should come from platform store

    let scopes = vec!["https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly".to_string()];

    let access_token = get_cached_service_token(
        claims.iss.clone(),
        scopes,
        token_url,
        client_id,
        "mock_private_key".to_string(),
        kid,
    )
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get service token: {}", e)))?;

    // Request context information
    let context_url = format!("{}/context", nrps_endpoint);
    let client = Client::new();
    
    let response = client
        .get(&context_url)
        .header(header::AUTHORIZATION, format!("Bearer {}", access_token))
        .header(header::ACCEPT, "application/vnd.ims.lti-nrps.v2.context+json")
        .send()
        .await
        .map_err(|e| ToolError::Internal(format!("Context request failed: {}", e)))?;

    if !response.status().is_success() {
        return Err(ToolError::Internal(format!(
            "Context request failed with status: {}",
            response.status()
        )));
    }

    let context: Context = response
        .json()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to parse context response: {}", e)))?;

    Ok(Json(context))
}