use crate::{errors::AssignmentGradeServicesError, request::send_request};
use chrono::{DateTime, Utc};
use reqwest::header;
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use std::time::SystemTime;

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
  pub submission_type: Option<SubmissionType>,
  #[serde(rename = "https://canvas.instructure.com/lti/launch_url")]
  pub launch_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewLineItem {
  #[serde(rename = "scoreMaximum")]
  pub score_maximum: f32,
  pub label: String,
  #[serde(rename = "resourceId")]
  pub resource_id: String,
  pub tag: String,
  #[serde(rename = "resourceLinkId")]
  pub resource_link_id: String,
  #[serde(rename = "endDateTime")]
  pub end_date_time: String, // Must be ISO8601 date and time
  #[serde(rename = "https://canvas.instructure.com/lti/submission_type")]
  pub submission_type: Option<SubmissionType>,
}

impl NewLineItem {
  pub fn new(
    score_maximum: f32,
    label: String,
    resource_id: String,
    tag: String,
    resource_link_id: String,
    submission_type: Option<SubmissionType>,
  ) -> Self {
    let now = SystemTime::now();
    let datetime: DateTime<Utc> = now.into();
    let iso_string = datetime.to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    Self {
      score_maximum,
      label,
      resource_id,
      tag,
      resource_link_id,
      end_date_time: iso_string,
      submission_type,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateLineItem {
  #[serde(rename = "scoreMaximum")]
  pub score_maximum: f32,
  pub label: String,
  #[serde(rename = "resourceId")]
  pub resource_id: String,
  pub tag: String,
  #[serde(rename = "resourceLinkId")]
  pub resource_link_id: String,
  #[serde(rename = "endDateTime")]
  pub end_date_time: String, // Must be ISO8601 date and time
}

impl UpdateLineItem {
  pub fn new(
    score_maximum: f32,
    label: String,
    resource_id: String,
    tag: String,
    resource_link_id: String,
  ) -> Self {
    let now = SystemTime::now();
    let datetime: DateTime<Utc> = now.into();
    let iso_string = datetime.to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    Self {
      score_maximum,
      label,
      resource_id,
      tag,
      resource_link_id,
      end_date_time: iso_string,
    }
  }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubmissionType {
  pub type_: String,
  #[serde(alias = "externalToolUrl")]
  pub external_tool_url: String,
}

// Gets a list of line items available based on the line_items_url
// Parameters:
// line_items_url: available from id_token.ags.lineitems
// params: ListParams list of optional parameters to filter the list of line items
#[derive(Debug, Serialize)]
#[skip_serializing_none]
pub struct ListParams {
  pub tag: Option<String>,
  pub resource_id: Option<String>,
  pub resource_link_id: Option<String>,
  pub limit: Option<usize>,
  pub include: Option<Vec<String>>,
}

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

pub async fn show(
  api_token: &str,
  line_item_url: &str,
) -> Result<LineItem, AssignmentGradeServicesError> {
  let client = reqwest::Client::new();
  let request = client
    .get(line_item_url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .header(header::ACCEPT, "application/vnd.ims.lis.v2.lineitem+json");
  let body = send_request(request).await?;

  let response: LineItem = serde_json::from_str(&body)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;

  Ok(response)
}

// Create a line item
// Parameters:
//  line_items_url: available from id_token.ags.lineitems
//  params: ListParams list of optional parameters to filter the list of line items
pub async fn create(
  api_token: &str,
  line_items_url: &str,
  new_line_item: &NewLineItem,
) -> Result<LineItem, AssignmentGradeServicesError> {
  let client = reqwest::Client::new();
  let json = serde_json::to_string(new_line_item)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;
  let request = client
    .post(line_items_url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .header(header::ACCEPT, "application/vnd.ims.lis.v2.lineitem+json")
    .body(json);
  let body = send_request(request).await?;

  let response: LineItem = serde_json::from_str(&body)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;

  Ok(response)
}

pub async fn update(
  api_token: &str,
  line_item_url: &str,
  update_line_item: &UpdateLineItem,
) -> Result<LineItem, AssignmentGradeServicesError> {
  let client = reqwest::Client::new();
  let json = serde_json::to_string(update_line_item)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;
  let request = client
    .put(line_item_url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .header(header::ACCEPT, "application/vnd.ims.lis.v2.lineitem+json")
    .body(json);
  let body = send_request(request).await?;

  let response: LineItem = serde_json::from_str(&body)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;

  Ok(response)
}

pub async fn delete(
  api_token: &str,
  line_item_url: &str,
) -> Result<LineItem, AssignmentGradeServicesError> {
  let client = reqwest::Client::new();

  let request = client
    .delete(line_item_url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token));
  let body = send_request(request).await?;

  let response: LineItem = serde_json::from_str(&body)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;

  Ok(response)
}
