use crate::errors::AtomicToolError;
use actix_web::HttpResponse;
use atomic_lti::{
  dynamic_registration::{register_tool, request_platform_config, validate_platform_config},
  stores::dynamic_registration_store::DynamicRegistrationStore,
};

// Starts the registration process
pub async fn dynamic_registration_init(
  openid_configuration_url: &str,
  registration_token: &str,
  registration_finish_path: &str,
  dynamic_registration_store: &dyn DynamicRegistrationStore,
) -> Result<HttpResponse, AtomicToolError> {
  // Get the configuration from the Platform
  let platform_config = request_platform_config(openid_configuration_url).await?;

  // Validate issuer
  validate_platform_config(&platform_config, openid_configuration_url)?;

  let html = dynamic_registration_store.registration_html(
    &platform_config,
    registration_finish_path,
    registration_token,
  );
  Ok(HttpResponse::Ok().content_type("text/html").body(html))
}

// Finishes the registration process
pub async fn dynamic_registration_finish(
  registration_endpoint: &str,
  registration_token: &str,
  dynamic_registration_store: &dyn DynamicRegistrationStore,
  current_url: &str,
  product_family_code: &str,
) -> Result<HttpResponse, AtomicToolError> {
  let client_registration_request =
    dynamic_registration_store.get_client_registration_request(current_url, product_family_code);
  // Send a request to the provider to register the tool
  let platform_response = register_tool(
    registration_endpoint,
    registration_token,
    &client_registration_request,
  )
  .await?;

  // Pass the response back to the store so that any required data can be saved
  dynamic_registration_store.handle_platform_response(platform_response)?;
  let html = dynamic_registration_store.complete_html();
  Ok(HttpResponse::Ok().content_type("text/html").body(html))
}
