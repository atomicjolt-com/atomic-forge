use crate::constants::ALGORITHM;
use crate::errors::SecureError;
use crate::id_token::IdToken;
use crate::jwt;
use crate::stores::key_store::KeyStore;
use base64::{engine::general_purpose, Engine};
use jsonwebtoken::jwk::{AlgorithmParameters, JwkSet};
use jsonwebtoken::{decode_header, DecodingKey, Validation};
use openssl::rsa::Rsa;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Jwk {
  pub kid: String,
  pub kty: String,
  pub n: String,
  pub e: String,
  pub r#use: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Jwks {
  pub keys: Vec<Jwk>,
}

// Decode a json web token (JWT) using a JwkSet
// Generate a JwkSet from a JSON string:
// let jwks: JwkSet = serde_json::from_str(&jwks_json).expect("Failed to parse jwks json");
pub fn decode_w_aud(token: &str, jwks: &JwkSet, aud: &[&str]) -> Result<IdToken, SecureError> {
  let header =
    decode_header(token).map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))?;
  let kid = header.kid.ok_or_else(|| {
    SecureError::CannotDecodeJwtToken("Token doesn't have a `kid` header field".into())
  })?;

  let jwk = jwks.find(&kid).ok_or_else(|| {
    SecureError::CannotDecodeJwtToken("No matching JWK found for the given kid".into())
  })?;

  match jwk.algorithm {
    AlgorithmParameters::RSA(ref rsa) => {
      let decoding_key = DecodingKey::from_rsa_components(&rsa.n, &rsa.e)
        .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))?;
      let mut validation = Validation::new(ALGORITHM);
      validation.set_audience(aud);
      jsonwebtoken::decode::<IdToken>(token, &decoding_key, &validation)
        .map(|data| data.claims)
        .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))
    }
    _ => Err(SecureError::InvalidEncoding),
  }
}

// Decode a json web token (JWT) using a JwkSet
// Generate a JwkSet from a JSON string:
// let jwks: JwkSet = serde_json::from_str(&jwks_json).expect("Failed to parse jwks json");
pub fn decode(token: &str, jwks: &JwkSet) -> Result<IdToken, SecureError> {
  // Decode the JWT header to extract the `kid`
  let header =
    decode_header(token).map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))?;
  let kid = header.kid.ok_or_else(|| {
    SecureError::CannotDecodeJwtToken("Token doesn't have a `kid` header field".into())
  })?;

  // Find the JWK corresponding to the `kid`
  let jwk = jwks.find(&kid).ok_or_else(|| {
    SecureError::CannotDecodeJwtToken("No matching JWK found for the given kid".into())
  })?;

  match jwk.algorithm {
    AlgorithmParameters::RSA(ref rsa) => {
      // let decoding_key =
      //   DecodingKey::from_jwk(jwk).map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))?;
      let decoding_key = DecodingKey::from_rsa_components(&rsa.n, &rsa.e)
        .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))?;

      let mut validation = Validation::new(ALGORITHM);
      validation.validate_aud = false;
      dbg!(&token);
      jsonwebtoken::decode::<IdToken>(token, &decoding_key, &validation)
        .map(|data| data.claims)
        .map_err(|e| SecureError::CannotDecodeJwtToken(e.to_string()))
    }
    _ => Err(SecureError::InvalidEncoding),
  }
}

// Encode a json web token (JWT) using a Jwk
pub fn encode(
  id_token: &IdToken,
  kid: &str,
  rsa_key_pair: Rsa<openssl::pkey::Private>,
) -> Result<String, SecureError> {
  jwt::encode(id_token, kid, rsa_key_pair)
}

// Generate a JWK from a private key
// Generate a new RSA key
// let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
pub fn generate_jwk(
  id: &str,
  rsa_key_pair: &Rsa<openssl::pkey::Private>,
) -> Result<Jwk, SecureError> {
  let jwk = Jwk {
    kty: "RSA".to_string(),
    kid: id.to_string(),
    n: general_purpose::URL_SAFE_NO_PAD.encode(rsa_key_pair.n().to_vec()),
    e: general_purpose::URL_SAFE_NO_PAD.encode(rsa_key_pair.e().to_vec()),
    r#use: "sig".to_string(),
  };

  Ok(jwk)
}

// Get a JwkSet using the current keys in the provided KeyStore
pub fn get_current_jwks(key_store: &dyn KeyStore) -> Result<Jwks, SecureError> {
  let keys = key_store.get_current_keys(3)?;
  let jwks = Jwks {
    keys: keys
      .iter()
      .map(|(key, value)| generate_jwk(key, value))
      .collect::<Result<Vec<Jwk>, SecureError>>()?,
  };
  Ok(jwks)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::{
    id_token::{AcceptTypes, DeepLinkingClaim, DocumentTargets},
    lti_definitions::LTI_DEEP_LINKING_REQUEST,
  };
  use chrono::{Duration, Utc};

  #[test]
  fn test_encode_decode() {
    let iss = "https://lms.example.com";
    let aud = "https://www.example.com/lti/auth/token".to_string();
    let user_id = "12";
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let id = "1234567890";
    let jwk = generate_jwk(id, &rsa_key_pair).expect("Failed to generate JWK");

    // Set the expiration time to 15 minutes from now
    let expiration = Utc::now() + Duration::minutes(15);

    let id_token = IdToken {
      iss: iss.to_string(),
      sub: user_id.to_string(),
      aud: aud.clone(),
      exp: expiration.timestamp(),
      message_type: LTI_DEEP_LINKING_REQUEST.to_string(),
      deep_linking: Some(DeepLinkingClaim {
        deep_link_return_url: "example.com".to_string(),
        accept_types: vec![AcceptTypes::Link],
        accept_presentation_document_targets: vec![DocumentTargets::Iframe],
        accept_media_types: None,
        accept_multiple: None,
        accept_lineitem: None,
        auto_create: None,
        title: None,
        text: None,
        data: None,
      }),
      launch_presentation: None,
      ..Default::default()
    };

    // Encode the ID Token using the private key
    let token = encode(&id_token, &jwk.kid, rsa_key_pair).expect("Failed to encode token");

    // Turn the JWK into JSON and then read it back into a JWK set compatible with jsonwebtoken
    let jwks = Jwks { keys: vec![jwk] };
    let jwks_json = serde_json::to_string(&jwks).expect("Serialization failed");
    let jwks: JwkSet = serde_json::from_str(&jwks_json).expect("Failed to parse jwks");

    // Decode the JWT using the JWK set
    let result = decode(&token, &jwks);
    let decoded_claims = result.expect("Failed to decode token");

    assert_eq!(decoded_claims.iss, iss);
    assert_eq!(decoded_claims.aud, aud);
    assert_eq!(decoded_claims.sub, user_id);
    assert!(decoded_claims.is_deep_link_launch());
  }

  #[test]
  fn test_encode_decode_auds() {
    let iss = "https://lms.example.com";
    let aud = "https://www.example.com/lti/auth/token".to_string();
    let user_id = "12";
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let id = "1234567890";
    let jwk = generate_jwk(id, &rsa_key_pair).expect("Failed to generate JWK");

    // Set the expiration time to 15 minutes from now
    let expiration = Utc::now() + Duration::minutes(15);

    let id_token = IdToken {
      iss: iss.to_string(),
      sub: user_id.to_string(),
      aud: aud.clone(),
      exp: expiration.timestamp(),
      message_type: LTI_DEEP_LINKING_REQUEST.to_string(),
      deep_linking: Some(DeepLinkingClaim {
        deep_link_return_url: "example.com".to_string(),
        accept_types: vec![AcceptTypes::Link],
        accept_presentation_document_targets: vec![DocumentTargets::Iframe],
        accept_media_types: None,
        accept_multiple: None,
        accept_lineitem: None,
        auto_create: None,
        title: None,
        text: None,
        data: None,
      }),
      launch_presentation: None,
      ..Default::default()
    };

    // Encode the ID Token using the private key
    let token = encode(&id_token, &jwk.kid, rsa_key_pair).expect("Failed to encode token");

    // Turn the JWK into JSON and then read it back into a JWK set compatible with jsonwebtoken
    let jwks = Jwks { keys: vec![jwk] };
    let jwks_json = serde_json::to_string(&jwks).expect("Serialization failed");
    let jwks: JwkSet = serde_json::from_str(&jwks_json).expect("Failed to parse jwks");

    // Decode the JWT using the JWK set and aud
    let auds = vec![aud.as_str()];
    let result = decode_w_aud(&token, &jwks, &auds);
    let decoded_claims = result.expect("Failed to decode token");

    assert_eq!(decoded_claims.iss, iss);
    assert_eq!(decoded_claims.aud, aud);
    assert_eq!(decoded_claims.sub, user_id);
    assert!(decoded_claims.is_deep_link_launch());
  }

  #[test]
  fn test_encode_decode_bad_auds() {
    let iss = "https://lms.example.com";
    let aud = "https://www.example.com/lti/auth/token".to_string();
    let user_id = "12";
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let id = "1234567890";
    let jwk = generate_jwk(id, &rsa_key_pair).expect("Failed to generate JWK");

    // Set the expiration time to 15 minutes from now
    let expiration = Utc::now() + Duration::minutes(15);

    let id_token = IdToken {
      iss: iss.to_string(),
      sub: user_id.to_string(),
      aud: aud.clone(),
      exp: expiration.timestamp(),
      message_type: LTI_DEEP_LINKING_REQUEST.to_string(),
      deep_linking: Some(DeepLinkingClaim {
        deep_link_return_url: "example.com".to_string(),
        accept_types: vec![AcceptTypes::Link],
        accept_presentation_document_targets: vec![DocumentTargets::Iframe],
        accept_media_types: None,
        accept_multiple: None,
        accept_lineitem: None,
        auto_create: None,
        title: None,
        text: None,
        data: None,
      }),
      launch_presentation: None,
      ..Default::default()
    };

    // Encode the ID Token using the private key
    let token = encode(&id_token, &jwk.kid, rsa_key_pair).expect("Failed to encode token");

    // Turn the JWK into JSON and then read it back into a JWK set compatible with jsonwebtoken
    let jwks = Jwks { keys: vec![jwk] };
    let jwks_json = serde_json::to_string(&jwks).expect("Serialization failed");
    let jwks: JwkSet = serde_json::from_str(&jwks_json).expect("Failed to parse jwks");

    // Decode the JWT using the JWK set and aud
    let auds = vec!["bad_aud"];
    let result = decode_w_aud(&token, &jwks, &auds);
    assert!(result.is_err());
  }

  #[test]
  fn test_schoology() {
    let token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjlkNDM0OWM5NGYwOTg5YzQifQ.eyJpc3MiOiJodHRwczovL3NjaG9vbG9neS5zY2hvb2xvZ3kuY29tIiwiYXVkIjpbIjc0ODUzOTM4MTUiXSwic3ViIjoiNjM3Nzg3MjU6OjkyY2U5NzM3N2M1OGVlZWVkY2E2NjcyM2M0YjY5NDk2IiwiZXhwIjoxNzI2MjQyMDI4LCJpYXQiOjE3MjYyNDE0MjgsIm5vbmNlIjoibWlXc2JmM1oyNHZDMjVOYmNpNlNpT3BDV3dyTjE0UkEiLCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9tZXNzYWdlX3R5cGUiOiJMdGlSZXNvdXJjZUxpbmtSZXF1ZXN0IiwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vdmVyc2lvbiI6IjEuMy4wIiwiaHR0cHM6Ly9wdXJsLmltc2dsb2JhbC5vcmcvc3BlYy9sdGkvY2xhaW0vZGVwbG95bWVudF9pZCI6Ijc0ODUzOTM4MTUtMTM4MDQyNjY3OSIsImh0dHBzOi8vcHVybC5pbXNnbG9iYWwub3JnL3NwZWMvbHRpL2NsYWltL3RhcmdldF9saW5rX3VyaSI6Imh0dHBzOi8vYXRvbWljLW94aWRlLmF0b21pY2pvbHQud2luL2x0aS9sYXVuY2giLCJodHRwczovL3B1cmwuaW1zZ2xvYmFsLm9yZy9zcGVjL2x0aS9jbGFpbS9yb2xlcyI6WyJodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI0FkbWluaXN0cmF0b3IiLCJodHRwOi8vcHVybC5pbXNnbG9iYWwub3JnL3ZvY2FiL2xpcy92Mi9tZW1iZXJzaGlwI0luc3RydWN0b3IiXX0.Lo8Ywk3YduGNgstvqgIthSjW2OS76jTDp0B5BqhO6olZP_CpbyiSR0sydZTzSroFCNAOzKUfxJ9W_KHbFhv07KpiWWkSkjjLwcuAp2dt811u87G3okfxWmSEQrRLlxjdIS-ZugV7GPtAz1gY3iC20ah60KpQ_JomrHoXylUa1IKQYSm-V076sJ6IzR7Hf33mZILCLjF_2Nfv1Km8I6eWot-r5rAiB7183UGbasXZ0nQFan4RMUdd2aX8f82kP4biNV9Wf8Jll5tFHV4L0gw-DjXShT4Pkql7AanRdLbv6Axtac-SiI2DbvxMwuITSwN9cmjZEz8Sh7Yc-LZRNUbm2g";
    let jwks_json = r#"{
        "keys": [{
            "kty": "RSA",
            "use": "sig",
            "kid": "9d4349c94f0989c4",
            "alg": "RS256",
            "n": "AKPqVGpHSaqo4KcgLmqB_jdlTaLtZjegBJd2aGksxL12mxYyHE64lxcK79QeKt0f9C3O_uIZP5wQBuSMIDtcletIw5JkHKjK6eijn97gRJY9ocJ412D37wOusPe9ToleE3yI0rd_AjJtYjig9-9BLNwhtPWtnHTfvUOvffKYURSXY-XMatuFSRXA4fX3hgZV83521EoRbq9TPwKXHe3Ef6aEoTnkZpXkuA_--lTQ98_QP8GT0Dx12w4uAjKd-90KnCgGAvcauN6FgOjG8SUR7i1mfKZcCPzLoObKRNXeawhmFn-rsL3DRKYQVWHJljO1LnQYnSAHQjD8yVYuaZzdHHs",
            "e": "AQAB"
        }]
    }"#;

    let jwks: JwkSet = serde_json::from_str(jwks_json).expect("Failed to parse jwks");

    // Add debug prints
    println!("Token header: {:?}", decode_header(token));
    if let Ok(header) = decode_header(token) {
      if let Some(kid) = header.kid {
        println!("Found key ID: {}", kid);
        if let Some(key) = jwks.find(&kid) {
          println!("Found matching JWK: {:?}", key);
        } else {
          println!("No matching key found in JWKS");
        }
      }
    }

    // Modified validation
    let mut validation = Validation::new(ALGORITHM);
    validation.validate_exp = false; // Optionally disable exp validation for testing
    validation.validate_aud = false; // Disable audience validation if not needed
    validation.required_spec_claims.clear(); // Clear required claims for testing

    let result = decode(token, &jwks);
    match &result {
      Ok(_) => println!("Successfully decoded token"),
      Err(e) => println!("Error decoding token: {:?}", e),
    }

    let decoded_claims = result.expect("Failed to decode token");

    assert_eq!(decoded_claims.iss, "https://schoology.schoology.com");
  }
}
