use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::handlers::LtiDependencies;
use atomic_lti::stores::key_store::KeyStore;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub exp: u64,
    pub iat: u64,
    pub iss: String,
    pub aud: Vec<String>,
}

pub async fn jwt_auth<T>(
    State(deps): State<Arc<T>>,
    mut request: Request,
    next: Next,
) -> Result<Response, impl IntoResponse>
where
    T: LtiDependencies + Send + Sync + 'static,
{
    let authorization = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    let token = match authorization {
        Some(token) => token,
        None => {
            return Err((
                StatusCode::UNAUTHORIZED,
                "Missing or invalid authorization header",
            ));
        }
    };

    // Decode the header to get the key ID
    let header = match decode_header(token) {
        Ok(h) => h,
        Err(_) => {
            return Err((StatusCode::UNAUTHORIZED, "Invalid token header"));
        }
    };

    let kid = match header.kid {
        Some(k) => k,
        None => {
            return Err((StatusCode::UNAUTHORIZED, "Missing key ID in token"));
        }
    };

    // Get the public key from the key store
    let key_store = deps.key_store();
    let rsa_key = match key_store.get_key(&kid) {
        Ok(key) => key,
        Err(_) => {
            return Err((StatusCode::UNAUTHORIZED, "Unknown key ID"));
        }
    };
    
    // Convert RSA key to PEM format for JWT validation
    let public_key_pem = rsa_key.public_key_to_pem()
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to extract public key"))?;

    // Create the decoding key
    let decoding_key = match DecodingKey::from_rsa_pem(&public_key_pem) {
        Ok(key) => key,
        Err(_) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Invalid public key"));
        }
    };

    // Set up validation
    let mut validation = Validation::new(Algorithm::RS256);
    validation.validate_exp = true;
    validation.validate_nbf = true;

    // Decode and validate the token
    match decode::<Claims>(token, &decoding_key, &validation) {
        Ok(token_data) => {
            // Add claims to request extensions for downstream handlers
            request.extensions_mut().insert(token_data.claims);
            Ok(next.run(request).await)
        }
        Err(_) => Err((StatusCode::UNAUTHORIZED, "Invalid or expired token")),
    }
}