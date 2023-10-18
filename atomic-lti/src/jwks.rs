use crate::errors::{JwkError, JwtError, SecureError};
use crate::id_token::IdToken;
use base64::{engine::general_purpose, Engine as _};
use jsonwebtoken::jwk::{AlgorithmParameters, JwkSet};
use jsonwebtoken::{decode_header, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use openssl::rsa::Rsa;
use serde::{Deserialize, Serialize};

const ALGORITHM: Algorithm = Algorithm::RS256;

pub trait KeyStore {
  fn get_current_keys(&self) -> Result<Vec<Rsa<openssl::pkey::Private>>, SecureError>;
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Jwk {
  pub kid: String,
  pub kty: String,
  pub n: String,
  pub e: String,
  pub r#use: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Jwks {
  pub keys: Vec<Jwk>,
}

// Decode a json web token (JWT) using a JwkSet
// Generate a JwkSet from a JSON string:
// let jwks: JwkSet = serde_json::from_str(&jwks_json).expect("Failed to parse jwks json");
pub fn decode(token: &str, jwks: &JwkSet) -> Result<IdToken, JwtError> {
  let header = decode_header(token).map_err(|e| JwtError::CannotDecodeJwtToken(e.to_string()))?;
  let kid = header.kid.ok_or_else(|| {
    JwtError::CannotDecodeJwtToken("Token doesn't have a `kid` header field".into())
  })?;

  let jwk = jwks.find(&kid).ok_or_else(|| {
    JwtError::CannotDecodeJwtToken("No matching JWK found for the given kid".into())
  })?;

  match jwk.algorithm {
    AlgorithmParameters::RSA(ref rsa) => {
      let decoding_key = DecodingKey::from_rsa_components(&rsa.n, &rsa.e)
        .map_err(|e| JwtError::CannotDecodeJwtToken(e.to_string()))?;
      let validation = Validation::new(ALGORITHM);

      jsonwebtoken::decode::<IdToken>(token, &decoding_key, &validation)
        .map(|data| data.claims)
        .map_err(|e| JwtError::CannotDecodeJwtToken(e.to_string()))
    }
    _ => Err(JwtError::InvalidEncoding),
  }
}

// Encode a json web token (JWT) using a Jwk
pub fn encode(
  id_token: &IdToken,
  kid: String,
  rsa_key_pair: Rsa<openssl::pkey::Private>,
) -> Result<String, JwtError> {
  let der = rsa_key_pair
    .private_key_to_der()
    .map_err(|e| JwtError::PrivateKeyError(format!("Failed to get private key as DER: {}", e)))?;
  let key: EncodingKey = EncodingKey::from_rsa_der(der.as_ref());

  let mut header = Header::new(ALGORITHM);
  header.kid = Some(kid);

  let token = jsonwebtoken::encode(&header, &id_token, &key)
    .map_err(|e| JwtError::CannotEncodeJwtToken(e.to_string()))?;

  Ok(token)
}

// Generate a JWK from a private key
// Generate a new RSA key
// let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
pub fn generate_jwk(rsa_key_pair: &Rsa<openssl::pkey::Private>) -> Result<Jwk, JwkError> {
  let jwk = Jwk {
    kty: "RSA".to_string(),
    kid: "id".to_string(),
    n: general_purpose::URL_SAFE_NO_PAD.encode(rsa_key_pair.n().to_vec()),
    e: general_purpose::URL_SAFE_NO_PAD.encode(rsa_key_pair.e().to_vec()),
    r#use: "sig".to_string(),
  };

  Ok(jwk)
}

// Get a JwkSet using the current keys in the provided KeyStore
pub fn get_current_jwks(key_store: &dyn KeyStore) -> Result<Jwks, JwkError> {
  let keys = key_store.get_current_keys()?;
  let jwks = Jwks {
    keys: keys
      .iter()
      .map(generate_jwk)
      .collect::<Result<Vec<Jwk>, JwkError>>()?,
  };
  Ok(jwks)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::id_token::{AcceptTypes, DeepLinkingClaim, DocumentTargets, LTI_DEEP_LINKING_REQUEST};
  use chrono::{Duration, Utc};

  #[test]
  fn test_encode_decode() {
    let iss = "https://lms.example.com";
    let aud = "https://www.example.com/lti/auth/token".to_string();
    let user_id = "12";
    let rsa_key_pair = Rsa::generate(2048).expect("Failed to generate RSA key");
    let jwk = generate_jwk(&rsa_key_pair).expect("Failed to generate JWK");

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
    let token = encode(&id_token, jwk.kid.clone(), rsa_key_pair).expect("Failed to encode token");

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
}
