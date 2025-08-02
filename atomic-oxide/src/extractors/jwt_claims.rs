use crate::stores::tool_jwt_store::ToolJwt;
use crate::AppState;
use actix_web::{dev::Payload, error, web, Error, FromRequest, HttpRequest};
use atomic_lti::jwt::decode;
use atomic_lti::stores::key_store::KeyStore;
use jsonwebtoken::decode_header;
use std::future::Future;
use std::pin::Pin;

/// JWT claims extractor for authenticated routes
/// Validates JWT token and extracts claims for use in handlers
#[derive(Clone)]
pub struct JwtClaims {
  pub claims: ToolJwt,
}

impl JwtClaims {
  pub fn client_id(&self) -> &str {
    &self.claims.client_id
  }

  pub fn platform_iss(&self) -> &str {
    &self.claims.platform_iss
  }

  pub fn deployment_id(&self) -> &str {
    &self.claims.deployment_id
  }
}

impl FromRequest for JwtClaims {
  type Error = Error;
  type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

  fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
    let req = req.clone();

    Box::pin(async move {
      // Get app state
      let app_state = req
        .app_data::<web::Data<AppState>>()
        .ok_or_else(|| error::ErrorInternalServerError("App state not found"))?;

      // Extract JWT token from Authorization header
      let token = req
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .ok_or_else(|| error::ErrorUnauthorized("Missing or invalid Authorization header"))?;

      // Decode header to get kid
      let header = decode_header(token)
        .map_err(|e| error::ErrorUnauthorized(format!("Invalid JWT header: {}", e)))?;

      let kid = header
        .kid
        .ok_or_else(|| error::ErrorUnauthorized("No kid in JWT header"))?;

      // Get the key from the key store
      let key = app_state
        .key_store
        .get_key(&kid)
        .await
        .map_err(|e| error::ErrorUnauthorized(format!("Failed to get key: {}", e)))?;

      // Decode and validate the JWT
      let token_data = decode::<ToolJwt>(token, key)
        .map_err(|e| error::ErrorUnauthorized(format!("JWT validation failed: {}", e)))?;

      Ok(JwtClaims {
        claims: token_data.claims,
      })
    })
  }
}
