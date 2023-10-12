use crate::errors::OIDCError;
use crate::id_token::IdToken;
use chrono::{Duration, NaiveDateTime, Utc};

pub trait OIDCStateStore {
  fn get_state(&self) -> String;
  fn get_nonce(&self) -> String;
  fn get_created_at(&self) -> chrono::NaiveDateTime;
  fn destroy(&self) -> Result<usize, OIDCError>;
}

pub fn validate_launch(
  oidc_state_store: &dyn OIDCStateStore,
  id_token: &IdToken,
) -> Result<(), OIDCError> {
  // Check the OIDC state entry and make sure the state is not older than 10 minutes
  if !is_expired(oidc_state_store.get_created_at()) {
    return Err(OIDCError::NonceExpired);
  }

  // Check the id token nonce against the oidc state nonce
  if id_token.nonce != oidc_state_store.get_nonce() {
    return Err(OIDCError::StateInvalid);
  }

  Ok(())
}

fn is_expired(datetime: NaiveDateTime) -> bool {
  let now = Utc::now().naive_utc();
  let ten_minutes_ago = now - Duration::minutes(10);

  datetime > ten_minutes_ago
}

// use atomic_lti::id_token::IdToken;
// use atomic_lti::jwks::decode;
// use jsonwebtoken::jwk::JwkSet;

// pub async fn validate_request(
//   state: &str,
//   id_token: &str,
//   remote_jwks: &str,
// ) -> Result<IdToken, String> {
//   let jwks: JwkSet = serde_json::from_str(&remote_jwks).expect("Failed to parse jwks");
//   let id_token_result = decode(id_token, jwks);
//   let oidc_state = get_oidc(state).await?;

//   if state != oidc_state.state {
//     return Err("Incorrect LTI state. Please launch the application again.".to_owned());
//   }

//   Ok(id_token_result)
// }
