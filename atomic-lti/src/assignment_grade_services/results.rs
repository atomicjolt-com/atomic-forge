use crate::{errors::AssignmentGradeServicesError, request::send_request};
use reqwest::header;
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

#[derive(Debug, Serialize, Deserialize)]
pub struct LineItemResult {
  pub id: String,
  #[serde(rename = "userId")]
  pub user_id: String,
  #[serde(rename = "resultScore")]
  pub result_score: f32,
  #[serde(rename = "resultMaximum")]
  pub result_maximum: f32,
  pub comment: Option<String>,
  #[serde(rename = "scoreOf")]
  pub score_of: String,
}

#[derive(Debug, Serialize)]
#[skip_serializing_none]
pub struct ListParams {
  pub user_id: Option<String>,
  pub limit: Option<usize>,
}

// Show results for a given line item.
// Parameters:
//   user_id: filter the results to a single user. The results MUST contain at most 1 result.
//            An empty array MAY be returned if the user does not have any result recorded.
//   limit: restrict the number of results returned; the platform MAY further reduce the number
//          of results returned at its own discretion
pub async fn list(
  api_token: &str,
  line_item_id: &str,
  user_id: Option<String>,
  limit: Option<usize>,
) -> Result<Vec<LineItemResult>, AssignmentGradeServicesError> {
  let url = format!("{}/results", line_item_id);
  let params = ListParams { user_id, limit };
  let client = reqwest::Client::new();
  let request = client
    .get(url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .header(
      header::ACCEPT,
      "application/vnd.ims.lis.v2.resultcontainer+json",
    )
    .query(&params);
  let body = send_request(request).await?;

  let response: Vec<LineItemResult> = serde_json::from_str(&body)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;

  Ok(response)
}

pub async fn show(
  api_token: &str,
  line_item_id: &str,
  result_id: &str,
) -> Result<LineItemResult, AssignmentGradeServicesError> {
  let client = reqwest::Client::new();
  let url = format!("{}/results/{}", line_item_id, result_id);
  let request = client
    .get(url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .header(
      header::ACCEPT,
      "application/vnd.ims.lis.v2.resultcontainer+json",
    );
  let body = send_request(request).await?;

  let response: LineItemResult = serde_json::from_str(&body)
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
      .mock("GET", "/123/results")
      .with_status(200)
      .with_header(
        "content-type",
        "application/vnd.ims.lis.v2.resultcontainer+json",
      )
      .with_body(
        r#"[
            {
              "id": "http://institution.canvas.com/api/lti/courses/5/line_items/2/results/1",
              "userId": "50",
              "resultScore": 50,
              "resultMaximum": 50,
              "comment": null,
              "scoreOf": "http://institution.canvas.com/api/lti/courses/5/line_items/2"
            }
        ]"#,
      )
      .create();

    let api_token = "not a real token";
    let line_item_id = format!("{}/123", server_url);
    let result = list(api_token, &line_item_id, None, None).await;

    mock.assert();
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.len(), 1);
  }

  #[tokio::test]
  async fn test_show() {
    let mut server = mockito::Server::new();
    let server_url = server.url();
    let mock = server
      .mock("GET", "/123/results/1")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(
        r#"{
            "id": "http://institution.canvas.com/api/lti/courses/5/line_items/2/results/1",
            "userId": "50",
            "resultScore": 50,
            "resultMaximum": 50,
            "comment": null,
            "scoreOf": "http://institution.canvas.com/api/lti/courses/5/line_items/2"
        }"#,
      )
      .create();

    let api_token = "not a real token";
    let line_item_id = format!("{}/123", server_url);
    let result = show(api_token, &line_item_id, "1").await;

    mock.assert();
    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(
      response.id,
      "http://institution.canvas.com/api/lti/courses/5/line_items/2/results/1"
    );
  }
}
