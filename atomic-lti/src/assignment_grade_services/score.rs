use crate::errors::AssignmentGradeServicesError;
use crate::request::send_request;
use chrono::{DateTime, Utc};
use reqwest::header;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;

#[derive(Debug, PartialEq, Serialize, Deserialize, Clone)]
pub enum ActivityProgress {
  Initialized,
  Started,
  InProgress,
  Submitted,
  Completed,
}

#[derive(Debug, PartialEq, Serialize, Deserialize, Clone)]
pub enum GradingProgress {
  NotReady,
  Failed,
  Pending,
  PendingManual,
  FullyGraded,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Score {
  pub user_id: String, // The lti_user_id
  pub score_given: f32,
  pub score_maximum: f32,
  pub comment: Option<String>,
  pub timestamp: String,
  pub activity_progress: ActivityProgress,
  pub grading_progress: GradingProgress,
  #[serde(rename = "https://canvas.instructure.com/lti/submission[new_submission]")]
  pub new_submission: Option<bool>,
  #[serde(rename = "https://canvas.instructure.com/lti/submission[preserve_score]")]
  pub preserve_score: Option<bool>,
  #[serde(rename = "https://canvas.instructure.com/lti/submission[prioritize_non_tool_grade]")]
  pub prioritize_non_tool_grade: Option<bool>,
  #[serde(rename = "https://canvas.instructure.com/lti/submission[submission_type]")]
  pub submission_type: Option<String>,
  #[serde(rename = "https://canvas.instructure.com/lti/submission[submission_data]")]
  pub submission_data: Option<String>,
  #[serde(rename = "https://canvas.instructure.com/lti/submission[submitted_at]")]
  pub submitted_at: Option<String>,
  #[serde(rename = "https://canvas.instructure.com/lti/submission[content_items]")]
  pub content_items: Option<Vec<ScoreContentItem>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScoreContentItem {
  #[serde(rename = "type")]
  pub type_: String,
  pub url: String,
  pub title: Option<String>,
  pub media_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScoreResponse {
  #[serde(alias = "resultUrl")]
  pub result_url: String,
  #[serde(rename = "https://canvas.instructure.com/lti/submission")]
  pub submission: Submission,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Submission {
  pub content_items: Vec<ScoreContentItem>,
}

impl Score {
  pub fn new(
    user_id: String,
    score_given: f32,
    score_maximum: f32,
    comment: Option<String>,
    activity_progress: ActivityProgress,
    grading_progress: GradingProgress,
  ) -> Self {
    let now = SystemTime::now();
    let datetime: DateTime<Utc> = now.into();
    let iso_string = datetime.to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    Self {
      user_id,
      score_given,
      score_maximum,
      comment,
      timestamp: iso_string,
      activity_progress,
      grading_progress,
      new_submission: None,
      preserve_score: None,
      prioritize_non_tool_grade: None,
      submission_type: None,
      submission_data: None,
      submitted_at: None,
      content_items: None,
    }
  }

  pub fn default(user_id: &str, score_given: f32, score_maximum: f32) -> Self {
    let now = SystemTime::now();
    let datetime: DateTime<Utc> = now.into();
    let iso_string = datetime.to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    Self {
      user_id: user_id.to_string(),
      score_given,
      score_maximum,
      comment: None,
      timestamp: iso_string,
      activity_progress: ActivityProgress::Initialized,
      grading_progress: GradingProgress::NotReady,
      new_submission: None,
      preserve_score: None,
      prioritize_non_tool_grade: None,
      submission_type: None,
      submission_data: None,
      submitted_at: None,
      content_items: None,
    }
  }
}

pub async fn send_score(
  api_token: &str,
  id: &str,
  score: &Score,
) -> Result<ScoreResponse, AssignmentGradeServicesError> {
  let url = format!("{}/scores", id);

  let json = serde_json::to_string(score)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;
  let client = reqwest::Client::new();
  let request = client
    .post(url)
    .header(header::AUTHORIZATION, format!("Bearer {}", api_token))
    .header("Content-Type", "application/vnd.ims.lis.v1.score+json")
    .header(header::ACCEPT, "application/json")
    .body(json);
  let body = send_request(request).await?;

  let response: ScoreResponse = serde_json::from_str(&body)
    .map_err(|e| AssignmentGradeServicesError::RequestFailed(e.to_string()))?;

  Ok(response)
}

#[cfg(test)]
mod tests {
  use super::*;
  use mockito;

  #[tokio::test]
  async fn test_send_score() {
    let mut server = mockito::Server::new();
    let server_url = server.url();
    let mock = server
      .mock("POST", "/123/scores")
      .with_status(200)
      .with_header("content-type", "application/json")
      .with_body(
        r#"{
          "resultUrl": "https://canvas.instructure.com/url/to/result",
          "https://canvas.instructure.com/lti/submission": {
            "content_items": [
              {
                "type": "file",
                "url": "https://instructure.com/test_file.txt",
                "title": "Submission File",
                "progress": "https://canvas.instructure.com/url/to/progress"
              }
            ]
          }
        }"#,
      )
      .create();

    let api_token = "not a real token";
    let user_id = "1".to_string();
    let score = Score::default(&user_id, 9.0, 10.0);
    let id = format!("{}/123", server_url);
    let result = send_score(api_token, &id, &score).await;

    dbg!(&result);
    mock.assert();
    assert!(&result.is_ok());
    let response = result.unwrap();
    assert_eq!(
      response.result_url,
      "https://canvas.instructure.com/url/to/result"
    );
    assert_eq!(response.submission.content_items.len(), 1);
  }
}
