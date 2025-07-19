use crate::{handlers::LtiDependencies, ToolError};
use atomic_lti::{
    deep_linking::{ContentItem, DeepLinkPayload, DeepLinking},
    deep_linking::lti_resource_link::LTIResourceLink,
    id_token::{IdToken, DeepLinkingClaim},
    stores::key_store::KeyStore,
};
use axum::{
    extract::{Form, State},
    response::Html,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct DeepLinkParams {
    pub id_token: String,
    pub state: String,
}

pub async fn deep_link_init<T>(
    State(_deps): State<Arc<T>>,
    Form(params): Form<DeepLinkParams>,
) -> Result<Html<String>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Parse and validate the ID token (using insecure decode for demo)
    let id_token = atomic_lti::jwt::insecure_decode::<IdToken>(&params.id_token)
        .map_err(|e| ToolError::BadRequest(format!("Invalid ID token: {}", e)))?;

    // Get deep linking claim
    let deep_linking_claim = id_token
        .claims
        .deep_linking
        .ok_or_else(|| ToolError::BadRequest("Missing deep linking claim".to_string()))?;

    // Create HTML response for deep linking content selection
    let html = format!(
        r#"
<!DOCTYPE html>
<html>
<head>
    <title>Deep Linking - Content Selection</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .content-item {{ border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .content-item:hover {{ background-color: #f5f5f5; cursor: pointer; }}
        .selected {{ background-color: #e6f3ff; border-color: #0066cc; }}
        button {{ background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }}
        button:hover {{ background-color: #0052a3; }}
    </style>
</head>
<body>
    <h1>Select Content to Link</h1>
    <p>Choose content to add to your course:</p>
    
    <div class="content-item" onclick="selectContent(this, 'lesson1')">
        <h3>Lesson 1: Introduction</h3>
        <p>Basic introduction to the topic</p>
    </div>
    
    <div class="content-item" onclick="selectContent(this, 'lesson2')">
        <h3>Lesson 2: Advanced Topics</h3>
        <p>Deep dive into advanced concepts</p>
    </div>
    
    <div class="content-item" onclick="selectContent(this, 'quiz1')">
        <h3>Quiz 1: Knowledge Check</h3>
        <p>Test your understanding</p>
    </div>
    
    <button onclick="submitSelection()">Add Selected Content</button>
    
    <script>
        let selectedContent = null;
        
        function selectContent(element, contentId) {{
            // Remove previous selection
            document.querySelectorAll('.content-item').forEach(item => {{
                item.classList.remove('selected');
            }});
            
            // Add selection to clicked item
            element.classList.add('selected');
            selectedContent = contentId;
        }}
        
        function submitSelection() {{
            if (!selectedContent) {{
                alert('Please select content first');
                return;
            }}
            
            // Submit the selection
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/deep-link/response';
            
            const contentInput = document.createElement('input');
            contentInput.type = 'hidden';
            contentInput.name = 'content_id';
            contentInput.value = selectedContent;
            
            const stateInput = document.createElement('input');
            stateInput.type = 'hidden';
            stateInput.name = 'state';
            stateInput.value = '{state}';
            
            const deepLinkInput = document.createElement('input');
            deepLinkInput.type = 'hidden';
            deepLinkInput.name = 'deep_link_settings';
            deepLinkInput.value = '{deep_link_settings}';
            
            form.appendChild(contentInput);
            form.appendChild(stateInput);
            form.appendChild(deepLinkInput);
            
            document.body.appendChild(form);
            form.submit();
        }}
    </script>
</body>
</html>
        "#,
        state = params.state,
        deep_link_settings = serde_json::to_string(&deep_linking_claim).unwrap_or_default()
    );

    Ok(Html(html))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeepLinkResponseParams {
    pub content_id: String,
    pub state: String,
    pub deep_link_settings: String,
}

pub async fn deep_link_response<T>(
    State(deps): State<Arc<T>>,
    Form(params): Form<DeepLinkResponseParams>,
) -> Result<Html<String>, ToolError>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    // Parse deep linking settings
    let deep_link_settings: DeepLinkingClaim = serde_json::from_str(&params.deep_link_settings)
        .map_err(|e| ToolError::BadRequest(format!("Invalid deep link settings: {}", e)))?;

    // Create content items based on selection
    let content_items = match params.content_id.as_str() {
        "lesson1" => vec![ContentItem::LTIResourceLink(LTIResourceLink {
            url: Some("https://example.com/lesson1".to_string()),
            title: Some("Lesson 1: Introduction".to_string()),
            text: Some("Basic introduction to the topic".to_string()),
            ..Default::default()
        })],
        "lesson2" => vec![ContentItem::LTIResourceLink(LTIResourceLink {
            url: Some("https://example.com/lesson2".to_string()),
            title: Some("Lesson 2: Advanced Topics".to_string()),
            text: Some("Deep dive into advanced concepts".to_string()),
            ..Default::default()
        })],
        "quiz1" => vec![ContentItem::LTIResourceLink(LTIResourceLink {
            url: Some("https://example.com/quiz1".to_string()),
            title: Some("Quiz 1: Knowledge Check".to_string()),
            text: Some("Test your understanding".to_string()),
            ..Default::default()
        })],
        _ => {
            return Err(ToolError::BadRequest("Invalid content selection".to_string()));
        }
    };

    // Create deep linking response payload
    let deployment_id = "deployment_id".to_string(); // This should come from the original ID token
    let response = DeepLinkPayload::new(
        "tool-client-id",
        "https://example.com",
        &deployment_id,
        content_items,
        deep_link_settings.data.clone(),
    );

    // Sign the JWT response using the DeepLinking helper
    let key_store = deps.key_store();
    let (kid, rsa_key) = key_store
        .get_current_key()
        .map_err(|e| ToolError::Internal(format!("Failed to get current key: {}", e)))?;

    let jwt = DeepLinking::create_deep_link_jwt(
        "tool-client-id",
        "https://example.com",
        &deployment_id,
        &response.content_items,
        response.data.clone(),
        &kid,
        rsa_key,
    )
    .map_err(|e| ToolError::Internal(format!("Failed to create deep link JWT: {}", e)))?;

    // Create HTML form to submit the response back to the platform
    let html = format!(
        r#"
<!DOCTYPE html>
<html>
<head>
    <title>Deep Linking Response</title>
</head>
<body>
    <p>Content selected successfully. Redirecting back to your course...</p>
    <form id="deepLinkForm" action="{return_url}" method="POST">
        <input type="hidden" name="JWT" value="{jwt}">
    </form>
    <script>
        document.getElementById('deepLinkForm').submit();
    </script>
</body>
</html>
        "#,
        return_url = deep_link_settings.deep_link_return_url,
        jwt = jwt
    );

    Ok(Html(html))
}