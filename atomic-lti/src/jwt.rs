use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation};

use crate::errors::JwtError;
use crate::id_token::IdToken;

// encode a json web token (JWT)
pub fn encode(id_token: IdToken, jwt_key: &str) -> Result<String, JwtError> {
  let encoding_key = EncodingKey::from_secret(jwt_key.as_ref());
  jsonwebtoken::encode(&Header::default(), &id_token, &encoding_key)
    .map_err(|e| JwtError::CannotEncodeJwtToken(e.to_string()))
}

// Decode a json web token (JWT)
pub fn decode(id_token: &str, jwt_key: &str) -> Result<IdToken, JwtError> {
  let decoding_key = DecodingKey::from_secret(jwt_key.as_ref());
  jsonwebtoken::decode::<IdToken>(id_token, &decoding_key, &Validation::default())
    .map(|data| data.claims)
    .map_err(|e| JwtError::CannotDecodeJwtToken(e.to_string()))
}
