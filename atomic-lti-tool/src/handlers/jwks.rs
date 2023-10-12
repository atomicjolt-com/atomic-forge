use crate::errors::AtomicToolError;
use actix_web::HttpResponse;
use atomic_lti::jwks::{get_current_jwks, KeyStore};

pub async fn jwks(key_store: &dyn KeyStore) -> Result<HttpResponse, AtomicToolError> {
  let jwks = get_current_jwks(key_store)?;
  let jwks_json = serde_json::to_string(&jwks)?;

  // Return a JSON response with the JWK
  Ok(
    HttpResponse::Ok()
      .content_type("application/json")
      .body(jwks_json.to_string()),
  )
}

// #[cfg(test)]
// mod tests {
//   use super::*;
//   use atomic_lti::{errors::SecureError, jwks::KeyStore};
//   use openssl::rsa::Rsa;

//   struct MockKeyStore {}

//   impl KeyStore for MockKeyStore {
//     fn get_current_keys(&self) -> Result<Vec<Rsa<openssl::pkey::Private>>, SecureError> {
//       todo!()
//     }
//   }

//   #[actix_web::test]
//   async fn returns_jwks_with_valid_key_store() {
//     let key_store = MockKeyStore {};
//     let resp = jwks(&key_store).await.unwrap();

//     assert_eq!(resp.status(), http::StatusCode::OK);
//     assert_eq!(
//       resp.headers().get("content-type").unwrap(),
//       "application/json"
//     );

//     let body = test::read_body(resp).await;
//     let jwks: JWK = serde_json::from_slice(&body).unwrap();

//     assert_eq!(jwks.kty, "RSA");
//     assert_eq!(jwks.n, "n");
//     assert_eq!(jwks.e, "e");
//     assert_eq!(jwks.d, Some("d".to_string()));
//     assert_eq!(jwks.p, Some("p".to_string()));
//     assert_eq!(jwks.q, Some("q".to_string()));
//     assert_eq!(jwks.dp, Some("dp".to_string()));
//     assert_eq!(jwks.dq, Some("dq".to_string()));
//     assert_eq!(jwks.qi, Some("qi".to_string()));
//   }

//   #[actix_web::test]
//   async fn returns_internal_server_error_with_invalid_key_store() {
//     struct InvalidKeyStore {}

//     impl KeyStore for InvalidKeyStore {
//       fn get_current_keys(&self) -> Result<Vec<Rsa<openssl::pkey::Private>>, SecureError> {
//         Err(SecureError::PrivateKeyError("No private key found"))
//       }
//     }

//     let key_store = InvalidKeyStore {};
//     let resp = jwks(&key_store).await.unwrap();

//     assert_eq!(resp.status(), http::StatusCode::INTERNAL_SERVER_ERROR);
//   }
// }
