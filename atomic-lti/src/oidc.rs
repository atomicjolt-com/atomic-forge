use url::Url;

pub fn build_response_url(
  platform_oidc_url: &str,
  state: &str,
  client_id: &str,
  login_hint: &str,
  lti_message_hint: &str,
  nonce: &str,
  redirect_url: &str,
) -> Url {
  let mut url = Url::parse(platform_oidc_url).unwrap();
  url
    .query_pairs_mut()
    .append_pair("response_type", "id_token")
    .append_pair("redirect_uri", redirect_url)
    .append_pair("response_mode", "form_post")
    .append_pair("client_id", client_id)
    .append_pair("scope", "openid")
    .append_pair("state", state)
    .append_pair("login_hint", login_hint)
    .append_pair("prompt", "none")
    .append_pair("lti_message_hint", lti_message_hint)
    .append_pair("nonce", nonce);
  url
}

pub fn build_relaunch_init_url(url: &Url) -> String {
  let query: Vec<(String, String)> = url
    .query_pairs()
    .filter(|(name, _)| name != "lti_storage_target")
    .map(|(name, value)| (name.into_owned(), value.into_owned()))
    .collect();

  let mut tmp_url = url.clone();
  tmp_url.query_pairs_mut().clear().extend_pairs(&query);

  tmp_url.to_string()
}

#[cfg(test)]

mod tests {
  use super::*;

  #[test]
  fn test_build_response_url() {
    let platform_oidc_url = "https://example.com/oidc";
    let state = "state";
    let client_id = "client_id";
    let login_hint = "login_hint";
    let lti_message_hint = "lti_message_hint";
    let nonce = "nonce";
    let redirect_url = "https://example.com/redirect";
    let url = build_response_url(
      platform_oidc_url,
      state,
      client_id,
      login_hint,
      lti_message_hint,
      nonce,
      redirect_url,
    );
    assert_eq!(
          url.as_str(),
          "https://example.com/oidc?response_type=id_token&redirect_uri=https%3A%2F%2Fexample.com%2Fredirect&response_mode=form_post&client_id=client_id&scope=openid&state=state&login_hint=login_hint&prompt=none&lti_message_hint=lti_message_hint&nonce=nonce"
      );
  }

  #[test]
  fn test_build_relaunch_init_url() {
    let request_url =
      Url::parse("https://example.com?lti_storage_target=target").expect("Invalid URL");
    let url = build_relaunch_init_url(&request_url);
    assert_eq!(url, "https://example.com/?");
  }

  #[test]
  fn build_relaunch_init_url_removes_lti_storage_target() {
    let url =
      Url::parse("https://example.com?lti_storage_target=123&foo=bar").expect("Invalid URL");
    let expected = "https://example.com/?foo=bar";
    assert_eq!(build_relaunch_init_url(&url), expected);
  }
}
