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

#[cfg(test)]
mod tests {
  use super::*;
  use mockito;

  #[tokio::test]
  async fn test_list() {
    let mut server = mockito::Server::new();
    let server_url = server.url();
    let mock = server
      .mock("GET", "/line_items")
      .with_status(200)
      .with_header(
        "content-type",
        "application/vnd.ims.lis.v2.lineitemcontainer+json",
      )
      .with_body(
        r#"[
            {
              "id": "line_item_1",
              "scoreMaximum": 100.0,
              "label": "Test Item",
              "tag": "test",
              "resourceId": "res1",
              "resourceLinkId": "link1",
              "submission_type": null,
              "launch_url": null
            }
        ]"#,
      )
      .create();

    let api_token = "not a real token";
    let params = ListParams {
      tag: None,
      resource_id: None,
      resource_link_id: None,
      limit: None,
      include: None,
    };
    let url = format!("{}/line_items", &server_url);
    let result = list(api_token, &url, &params).await;

    mock.assert();
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.len(), 1);
    assert_eq!(response[0].id, "line_item_1");
  }

  #[tokio::test]
  async fn test_show() {
    let mut server = mockito::Server::new();
    let server_url = server.url();
    let mock = server
      .mock("GET", "/line_item_1")
      .with_status(200)
      .with_header("content-type", "application/vnd.ims.lis.v2.lineitem+json")
      .with_body(
        r#"{
          "id": "line_item_1",
          "scoreMaximum": 100.0,
          "label": "Test Item",
          "tag": "test",
          "resourceId": "res1",
          "resourceLinkId": "link1",
          "submission_type": null,
          "launch_url": null
        }"#,
      )
      .create();

    let api_token = "not a real token";
    let result = show(api_token, &format!("{}/line_item_1", server_url)).await;

    mock.assert();
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.id, "line_item_1");
  }

  #[tokio::test]
  async fn test_create() {
    let mut server = mockito::Server::new();
    let server_url = server.url();
    let mock = server
      .mock("POST", "/line_items")
      .with_status(201)
      .with_header("content-type", "application/vnd.ims.lis.v2.lineitem+json")
      .with_body(
        r#"{
          "id": "new_line_item",
          "scoreMaximum": 100.0,
          "label": "New Item",
          "tag": "new",
          "resourceId": "res_new",
          "resourceLinkId": "link_new",
          "submission_type": null,
          "launch_url": null
        }"#,
      )
      .create();

    let api_token = "not a real token";
    let new_line_item = NewLineItem::new(
      100.0,
      "New Item".to_string(),
      "res_new".to_string(),
      "new".to_string(),
      "link_new".to_string(),
      None,
    );
    let url = format!("{}/line_items", &server_url);
    let result = create(api_token, &url, &new_line_item).await;

    mock.assert();
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.id, "new_line_item");
  }

  #[tokio::test]
  async fn test_update() {
    let mut server = mockito::Server::new();
    let server_url = server.url();
    let mock = server
      .mock("PUT", "/line_item_1")
      .with_status(200)
      .with_header("content-type", "application/vnd.ims.lis.v2.lineitem+json")
      .with_body(
        r#"{
            "id": "line_item_1",
            "scoreMaximum": 95.0,
            "label": "Updated Item",
            "tag": "updated",
            "resourceId": "res1",
            "resourceLinkId": "link1",
            "submission_type": null,
            "launch_url": null
          }"#,
      )
      .create();

    let api_token = "not a real token";
    let update_line_item = UpdateLineItem::new(
      95.0,
      "Updated Item".to_string(),
      "res1".to_string(),
      "updated".to_string(),
      "link1".to_string(),
    );
    let result = update(
      api_token,
      &format!("{}/line_item_1", server_url),
      &update_line_item,
    )
    .await;

    mock.assert();
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.label, "Updated Item");
  }

  #[tokio::test]
  async fn test_delete() {
    let mut server = mockito::Server::new();
    let server_url = server.url();
    let mock = server
      .mock("DELETE", "/line_item_1")
      .with_status(200)
      .with_header("content-type", "application/vnd.ims.lis.v2.lineitem+json")
      .with_body(
        r#"{
          "id": "line_item_1",
          "scoreMaximum": 100.0,
          "label": "Deleted Item",
          "tag": "deleted",
          "resourceId": "res1",
          "resourceLinkId": "link1",
          "submission_type": null,
          "launch_url": null
        }"#,
      )
      .create();

    let api_token = "not a real token";
    let result = delete(api_token, &format!("{}/line_item_1", server_url)).await;

    mock.assert();
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.label, "Deleted Item");
  }
}
