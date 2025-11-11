use crate::errors::OIDCError;
use crate::id_token::IdToken;
use crate::stores::oidc_state_store::OIDCStateStore;
use chrono::{Duration, NaiveDateTime, Utc};

/// Validate the launch request
/// #arguements
/// * `state` - The state parameter from the launch request parameters
/// * `oidc_state_store` - The OIDC state store that implements the OIDCStateStore trait
/// * `id_token` - The id token from the launch request
/// #returns
/// * `Result<(), OIDCError>` - Returns an error if the launch is invalid
/// #example
/// ```no_run
/// use atomic_lti::validate::validate_launch;
/// use atomic_lti::id_token::IdToken;
/// use atomic_lti::stores::oidc_state_store::OIDCStateStore;
/// # use atomic_lti::errors::OIDCError;
///
/// # async fn example(
/// #   state: &str,
/// #   oidc_state_store: &dyn OIDCStateStore,
/// #   id_token: &IdToken,
/// # ) -> Result<(), OIDCError> {
/// validate_launch(state, oidc_state_store, id_token).await?;
/// # Ok(())
/// # }
/// ```
pub async fn validate_launch(
  state: &str,
  oidc_state_store: &dyn OIDCStateStore,
  id_token: &IdToken,
) -> Result<(), OIDCError> {
  // Check the state from parameters matches the state in the store
  if state != oidc_state_store.get_state().await {
    return Err(OIDCError::StateInvalid("Invalid state value".to_string()));
  }

  // Check the OIDC state entry and make sure the state is not older than 10 minutes
  if !is_expired(oidc_state_store.get_created_at().await) {
    return Err(OIDCError::NonceExpired);
  }

  // Check the id token nonce against the oidc state nonce
  if id_token.nonce != oidc_state_store.get_nonce().await {
    return Err(OIDCError::NonceInvalid);
  }

  Ok(())
}

fn is_expired(datetime: NaiveDateTime) -> bool {
  let now = Utc::now().naive_utc();
  let ten_minutes_ago = now - Duration::minutes(10);

  datetime > ten_minutes_ago
}
