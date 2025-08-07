use crate::{handlers::LtiDependencies, middleware::LtiClaims, ToolError};
use atomic_lti::{
    client_credentials::request_service_token_cached,
    names_and_roles::{Context, MembershipContainer},
    stores::{key_store::KeyStore, platform_store::PlatformStore},
};
use axum::{
    extract::{Query, State},
    http::header,
    Extension, Json,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct NrpsParams {
    pub context_id: Option<String>,
    pub role: Option<String>,
    pub limit: Option<u32>,
    pub rlid: Option<String>,
}

pub async fn names_and_roles<T>(
    State(deps): State<Arc<T>>,
    Query(params): Query<NrpsParams>,
    Extension(claims): Extension<LtiClaims>,
) -> Result<Json<MembershipContainer>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Get NRPS endpoint from the JWT claims (populated during launch)
    let nrps_endpoint = claims
        .names_and_roles_endpoint_url
        .ok_or_else(|| ToolError::BadRequest("Names and Roles service not available for this launch".to_string()))?;

    // Get platform configuration
    let platform_store = deps.create_platform_store(&claims.platform_iss).await?;

    // Get service token
    let key_store = deps.key_store();
    let (kid, rsa_key) = key_store
        .get_current_key()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to get current key: {e}")))?;

    let token_url = platform_store
        .get_token_url()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to get token URL: {e}")))?;

    let scopes = "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";

    // Use the existing client_credentials function from atomic_lti
    let token_response = request_service_token_cached(
        &claims.client_id,
        &token_url,
        scopes,
        &kid,
        rsa_key,
    )
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get service token: {e}")))?;

    let access_token = token_response.access_token;

    // Build NRPS request URL with query parameters
    let mut nrps_url = nrps_endpoint.clone();
    let mut query_params = Vec::new();

    if let Some(context_id) = &params.context_id {
        query_params.push(format!("context_id={}", urlencoding::encode(context_id)));
    }
    if let Some(role) = &params.role {
        query_params.push(format!("role={}", urlencoding::encode(role)));
    }
    if let Some(limit) = params.limit {
        query_params.push(format!("limit={}", limit));
    }
    if let Some(rlid) = &params.rlid {
        query_params.push(format!("rlid={}", urlencoding::encode(rlid)));
    }

    if !query_params.is_empty() {
        nrps_url.push_str(if nrps_url.contains('?') { "&" } else { "?" });
        nrps_url.push_str(&query_params.join("&"));
    }

    // Make NRPS request
    let client = Client::new();
    let response = client
        .get(&nrps_url)
        .header(header::AUTHORIZATION, format!("Bearer {access_token}"))
        .header(header::ACCEPT, "application/vnd.ims.lti-nrps.v2.membershipcontainer+json")
        .send()
        .await
        .map_err(|e| ToolError::Internal(format!("NRPS request failed: {e}")))?;

    if !response.status().is_success() {
        let status = response.status();
        return Err(ToolError::Internal(format!(
            "NRPS request failed with status: {status}"
        )));
    }

    let membership_container: MembershipContainer = response
        .json()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to parse NRPS response: {e}")))?;

    Ok(Json(membership_container))
}

pub async fn names_and_roles_context<T>(
    State(deps): State<Arc<T>>,
    Query(_params): Query<NrpsParams>,
    Extension(claims): Extension<LtiClaims>,
) -> Result<Json<Context>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Get NRPS endpoint from the JWT claims
    let nrps_endpoint = claims
        .names_and_roles_endpoint_url
        .ok_or_else(|| ToolError::BadRequest("Names and Roles service not available for this launch".to_string()))?;

    // Get platform configuration
    let platform_store = deps.create_platform_store(&claims.platform_iss).await?;

    // Get service token
    let key_store = deps.key_store();
    let (kid, rsa_key) = key_store
        .get_current_key()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to get current key: {e}")))?;

    let token_url = platform_store
        .get_token_url()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to get token URL: {e}")))?;

    let scopes = "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";

    let token_response = request_service_token_cached(
        &claims.client_id,
        &token_url,
        scopes,
        &kid,
        rsa_key,
    )
    .await
    .map_err(|e| ToolError::Internal(format!("Failed to get service token: {e}")))?;

    let access_token = token_response.access_token;

    // Request context information
    let context_url = format!("{nrps_endpoint}/context");
    let client = Client::new();

    let response = client
        .get(&context_url)
        .header(header::AUTHORIZATION, format!("Bearer {access_token}"))
        .header(header::ACCEPT, "application/vnd.ims.lti-nrps.v2.context+json")
        .send()
        .await
        .map_err(|e| ToolError::Internal(format!("Context request failed: {e}")))?;

    if !response.status().is_success() {
        let status = response.status();
        return Err(ToolError::Internal(format!(
            "Context request failed with status: {status}"
        )));
    }

    let context: Context = response
        .json()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to parse context response: {e}")))?;

    Ok(Json(context))
}