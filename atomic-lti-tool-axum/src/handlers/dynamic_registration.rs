use crate::{handlers::LtiDependencies, ToolError};
use axum::{
    extract::{Query, State},
    response::Html,
    Form,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct DynamicRegistrationParams {
    pub openid_configuration: String,
    pub registration_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegistrationInitParams {
    pub openid_configuration: String,
    pub registration_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegistrationFinishParams {
    pub client_id: String,
    pub deployment_id: String,
    pub platform_id: String,
    pub tool_configuration: String,
}

pub async fn dynamic_registration_init<T>(
    State(_deps): State<Arc<T>>,
    Query(params): Query<DynamicRegistrationParams>,
) -> Result<Html<String>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Fetch OpenID configuration from the platform
    let client = Client::new();
    let openid_config_response = client
        .get(&params.openid_configuration)
        .send()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to fetch OpenID config: {}", e)))?;

    if !openid_config_response.status().is_success() {
        return Err(ToolError::Internal(format!(
            "OpenID config request failed with status: {}",
            openid_config_response.status()
        )));
    }

    let openid_config: serde_json::Value = openid_config_response
        .json()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to parse OpenID config: {}", e)))?;

    let registration_endpoint = openid_config["registration_endpoint"]
        .as_str()
        .ok_or_else(|| ToolError::BadRequest("Missing registration_endpoint in OpenID config".to_string()))?;

    // Generate tool configuration
    let tool_config = serde_json::json!({
        "application_type": "web",
        "response_types": ["id_token"],
        "grant_types": ["implicit", "client_credentials"],
        "initiate_login_uri": "https://example.com/login/init",
        "redirect_uris": ["https://example.com/login/redirect"],
        "client_name": "Example LTI Tool",
        "jwks_uri": "https://example.com/.well-known/jwks.json",
        "logo_uri": "https://example.com/logo.png",
        "client_uri": "https://example.com",
        "tos_uri": "https://example.com/terms",
        "policy_uri": "https://example.com/privacy",
        "token_endpoint_auth_method": "private_key_jwt",
        "contacts": ["support@example.com"],
        "scope": "openid",
        "https://purl.imsglobal.org/spec/lti-tool-configuration": {
            "domain": "example.com",
            "description": "Example LTI 1.3 Tool",
            "target_link_uri": "https://example.com/launch",
            "custom_parameters": {},
            "claims": [
                "iss",
                "sub",
                "aud",
                "exp",
                "iat",
                "nonce",
                "https://purl.imsglobal.org/spec/lti/claim/deployment_id",
                "https://purl.imsglobal.org/spec/lti/claim/target_link_uri",
                "https://purl.imsglobal.org/spec/lti/claim/message_type",
                "https://purl.imsglobal.org/spec/lti/claim/version",
                "https://purl.imsglobal.org/spec/lti/claim/resource_link",
                "https://purl.imsglobal.org/spec/lti/claim/context",
                "https://purl.imsglobal.org/spec/lti/claim/roles",
                "https://purl.imsglobal.org/spec/lti/claim/platform_instance",
                "https://purl.imsglobal.org/spec/lti/claim/launch_presentation",
                "https://purl.imsglobal.org/spec/lti/claim/lis",
                "https://purl.imsglobal.org/spec/lti/claim/custom"
            ],
            "messages": [
                {
                    "type": "LtiResourceLinkRequest",
                    "target_link_uri": "https://example.com/launch",
                    "label": "Example Tool"
                },
                {
                    "type": "LtiDeepLinkingRequest",
                    "target_link_uri": "https://example.com/deep-link",
                    "label": "Select Content"
                }
            ]
        }
    });

    // Create HTML form for completing registration
    let html = format!(
        r#"
<!DOCTYPE html>
<html>
<head>
    <title>LTI Dynamic Registration</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .form-group {{ margin-bottom: 15px; }}
        label {{ display: block; margin-bottom: 5px; font-weight: bold; }}
        input[type="text"], textarea {{ width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }}
        textarea {{ height: 100px; resize: vertical; }}
        button {{ background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }}
        button:hover {{ background-color: #0052a3; }}
        .readonly {{ background-color: #f5f5f5; }}
        .config-section {{ background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px; }}
    </style>
</head>
<body>
    <h1>LTI Dynamic Registration</h1>
    <p>Complete the registration with the platform:</p>
    
    <div class="config-section">
        <h3>Platform Configuration</h3>
        <p><strong>OpenID Configuration:</strong> {openid_config}</p>
        <p><strong>Registration Endpoint:</strong> {registration_endpoint}</p>
    </div>
    
    <form action="/registration/finish" method="POST">
        <div class="form-group">
            <label for="platform_id">Platform ID:</label>
            <input type="text" id="platform_id" name="platform_id" required>
        </div>
        
        <div class="form-group">
            <label for="deployment_id">Deployment ID:</label>
            <input type="text" id="deployment_id" name="deployment_id" required>
        </div>
        
        <div class="form-group">
            <label for="tool_configuration">Tool Configuration (JSON):</label>
            <textarea id="tool_configuration" name="tool_configuration" class="readonly" readonly>{tool_config}</textarea>
        </div>
        
        <input type="hidden" name="registration_endpoint" value="{registration_endpoint}">
        <input type="hidden" name="registration_token" value="{registration_token}">
        
        <button type="submit">Complete Registration</button>
    </form>
    
    <script>
        // Auto-generate client ID when form loads
        document.getElementById('platform_id').value = new URL('{openid_config}').hostname;
        document.getElementById('deployment_id').value = 'deployment-' + Date.now();
    </script>
</body>
</html>
        "#,
        openid_config = params.openid_configuration,
        registration_endpoint = registration_endpoint,
        tool_config = serde_json::to_string_pretty(&tool_config).unwrap_or_default(),
        registration_token = params.registration_token.unwrap_or_default()
    );

    Ok(Html(html))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegistrationFinishFormParams {
    pub platform_id: String,
    pub deployment_id: String,
    pub tool_configuration: String,
    pub registration_endpoint: String,
    pub registration_token: Option<String>,
}

pub async fn dynamic_registration_finish<T>(
    State(deps): State<Arc<T>>,
    Form(params): Form<RegistrationFinishFormParams>,
) -> Result<Html<String>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Parse tool configuration
    let tool_config: serde_json::Value = serde_json::from_str(&params.tool_configuration)
        .map_err(|e| ToolError::BadRequest(format!("Invalid tool configuration: {}", e)))?;

    // Send registration request to platform
    let client = Client::new();
    let mut request_builder = client
        .post(&params.registration_endpoint)
        .json(&tool_config);

    // Add registration token if provided
    if let Some(token) = &params.registration_token {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", token));
    }

    let response = request_builder
        .send()
        .await
        .map_err(|e| ToolError::Internal(format!("Registration request failed: {}", e)))?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(ToolError::Internal(format!(
            "Registration failed with status {}: {}",
            status,
            error_text
        )));
    }

    let registration_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| ToolError::Internal(format!("Failed to parse registration response: {}", e)))?;

    // Store the registration information
    let _platform_store = deps.create_platform_store(&params.platform_id).await?;
    
    // In a real implementation, you would store this information in your platform store
    // platform_store.store_registration(&registration_response).await?;

    // Create success response
    let html = format!(
        r#"
<!DOCTYPE html>
<html>
<head>
    <title>Registration Complete</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .success {{ background-color: #d4edda; color: #155724; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px; margin-bottom: 20px; }}
        .info {{ background-color: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; }}
        pre {{ background-color: #f8f9fa; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px; overflow-x: auto; }}
    </style>
</head>
<body>
    <h1>Registration Complete</h1>
    
    <div class="success">
        <strong>Success!</strong> Your LTI tool has been successfully registered with the platform.
    </div>
    
    <div class="info">
        <h3>Registration Details:</h3>
        <p><strong>Client ID:</strong> {client_id}</p>
        <p><strong>Platform ID:</strong> {platform_id}</p>
        <p><strong>Deployment ID:</strong> {deployment_id}</p>
        
        <h4>Configuration:</h4>
        <pre>{registration_response}</pre>
    </div>
    
    <p>You can now use this tool in your LTI platform. Make sure to save the client ID and other configuration details for future reference.</p>
</body>
</html>
        "#,
        client_id = registration_response.get("client_id").and_then(|v| v.as_str()).unwrap_or("unknown"),
        platform_id = params.platform_id,
        deployment_id = params.deployment_id,
        registration_response = serde_json::to_string_pretty(&registration_response).unwrap_or_default()
    );

    Ok(Html(html))
}