use crate::errors::AtomicToolError;
use actix_web::HttpResponse;
use atomic_lti::{
  dynamic_registration::{register_tool, request_platform_config, validate_platform_config},
  stores::dynamic_registration_store::DynamicRegistrationStore,
};

// Starts the registration process
pub async fn dynamic_registration_init<T: DynamicRegistrationStore>(
  openid_configuration_url: &str,
  registration_token: &str,
  registration_finish_path: &str,
  dynamic_registration_store: &T,
) -> Result<HttpResponse, AtomicToolError> {
  // Get the configuration from the Platform
  let platform_config = request_platform_config(openid_configuration_url).await?;

  // Validate issuer
  validate_platform_config(&platform_config, openid_configuration_url)?;

  let html = dynamic_registration_store.registration_html(
    &platform_config,
    registration_finish_path,
    registration_token,
    openid_configuration_url,
  );
  Ok(HttpResponse::Ok().content_type("text/html").body(html))
}

// Finishes the registration process
pub async fn dynamic_registration_finish<T: DynamicRegistrationStore>(
  registration_endpoint: &str,
  registration_token: &str,
  dynamic_registration_store: &T,
  current_url: &str,
  product_family_code: &str,
  openid_configuration_url: &str,
) -> Result<HttpResponse, AtomicToolError> {
  let client_registration_request =
    dynamic_registration_store.get_client_registration_request(current_url, product_family_code)?;
  // Send a request to the provider to register the tool
  let platform_response = register_tool(
    registration_endpoint,
    registration_token,
    &client_registration_request,
  )
  .await?;

  // Re-fetch the platform configuration so the store has the issuer and
  // OIDC endpoints it needs to persist the platform row. We can't trust a
  // user-posted form field to carry those endpoints directly — re-fetching
  // the .well-known document is what keeps the resolved values
  // platform-authoritative rather than client-editable.
  let platform_config = request_platform_config(openid_configuration_url).await?;
  validate_platform_config(&platform_config, openid_configuration_url)?;

  dynamic_registration_store
    .handle_platform_response(&platform_config, platform_response)
    .await?;
  let html = dynamic_registration_store.complete_html();
  Ok(HttpResponse::Ok().content_type("text/html").body(html))
}
