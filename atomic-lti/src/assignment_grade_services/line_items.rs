use crate::{errors::AssignmentGradeServicesError, request::send_request};
use reqwest::header;
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[derive(Debug, Serialize, Deserialize)]
pub struct LineItem {
  pub id: String,
  #[serde(rename = "scoreMaximum")]
  pub score_maximum: f32,
  pub label: String,
  pub tag: String,
  #[serde(rename = "resourceId")]
  pub resource_id: String,
  #[serde(rename = "resourceLinkId")]
  pub resource_link_id: String,
  #[serde(rename = "https://canvas.instructure.com/lti/submission_type")]
  pub submission_type: SubmissionType,
  #[serde(rename = "https://canvas.instructure.com/lti/launch_url")]
  pub launch_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubmissionType {
  pub type_: String,
  #[serde(alias = "externalToolUrl")]
  pub external_tool_url: String,
}

#[derive(Debug, Serialize)]
#[skip_serializing_none]
pub struct ListParams {
  pub tag: Option<String>,
  pub resource_id: Option<String>,
  pub resource_link_id: Option<String>,
  pub limit: Option<usize>,
  pub include: Option<Vec<String>>,
}

// Gets a list of line items available based on the line_items_url
// Parameters:
// line_items_url: available from id_token.ags.lineitems
// params: ListParams list of optional parameters to filter the list of line items
pub async fn list(
  api_token: &str,
  line_items_url: &str,
  params: &ListParams,
) -> Result<Vec<LineItem>, AssignmentGradeServicesError> {
  let client = reqwest::Client::new();
  let request = client
    .get(line_items_url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .header(
      header::ACCEPT,
      "application/vnd.ims.lis.v2.lineitemcontainer+json",
    )
    .query(&params);
  let body = send_request(request).await?;

  let response: Vec<LineItem> = serde_json::from_str(&body)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;

  Ok(response)
}
