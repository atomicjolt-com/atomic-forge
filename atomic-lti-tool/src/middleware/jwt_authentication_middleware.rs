use actix_web::HttpMessage;
use actix_web::{
  dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
  Error,
};
use atomic_lti::jwt::decode;
use atomic_lti::stores::key_store::KeyStore;
use jsonwebtoken::decode_header;
use serde::de::DeserializeOwned;
use std::boxed::Box;
use std::sync::Arc;
use std::{
  future::{ready, Future, Ready},
  pin::Pin,
};

// Fields:
// key_store: a key store that implements the KeyStore trait wrapped in an Arc
// marker: PhantomData is a zero-sized type used to mark generic structs and indicate to the Rust compiler that
// JwtAuthenticationConfig is parameterized over T, even though T is not used in any of the struct's fields.
pub struct JwtAuthenticationConfig<T> {
  pub key_store: Arc<dyn KeyStore>,
  pub marker: std::marker::PhantomData<T>,
}

impl<T> Clone for JwtAuthenticationConfig<T> {
  fn clone(&self) -> Self {
    JwtAuthenticationConfig {
      key_store: Arc::clone(&self.key_store),
      marker: std::marker::PhantomData,
    }
  }
}

#[derive(Clone)]
pub struct JwtAuthentication<T> {
  pub config: JwtAuthenticationConfig<T>,
}

impl<T> JwtAuthentication<T> {
  pub fn new(config: JwtAuthenticationConfig<T>) -> Self {
    JwtAuthentication { config }
  }
}

// `S` - type of the next service
// `B` - type of response's body
impl<S, B, T> Transform<S, ServiceRequest> for JwtAuthentication<T>
where
  S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + Clone + 'static,
  S::Future: 'static,
  B: 'static,
  //T: DeserializeOwned + 'static,
  T: DeserializeOwned + for<'de> serde::Deserialize<'de> + 'static + Clone,
{
  type Response = ServiceResponse<B>;
  type Error = Error;
  type InitError = ();
  type Transform = JwtAuthenticationMiddleware<S, T>;
  type Future = Ready<Result<Self::Transform, Self::InitError>>;

  fn new_transform(&self, service: S) -> Self::Future {
    ready(Ok(JwtAuthenticationMiddleware {
      service,
      config: self.config.clone(),
    }))
  }
}

pub struct JwtAuthenticationMiddleware<S, T> {
  /// The next service to call
  service: S,
  config: JwtAuthenticationConfig<T>,
}

// This future doesn't have the requirement of being `Send`.
// See: futures_util::future::LocalBoxFuture
type LocalBoxFuture<T> = Pin<Box<dyn Future<Output = T> + 'static>>;

// `S`: type of the wrapped service
// `B`: type of the body - try to be generic over the body where possible
impl<S, B, T> Service<ServiceRequest> for JwtAuthenticationMiddleware<S, T>
where
  S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + Clone + 'static,
  S::Future: 'static,
  B: 'static,
  T: DeserializeOwned + for<'de> serde::Deserialize<'de> + 'static + Clone,
{
  type Response = ServiceResponse<B>;
  type Error = Error;
  type Future = LocalBoxFuture<Result<Self::Response, Self::Error>>;

  // This service is ready when its next service is ready
  forward_ready!(service);

  fn call(&self, req: ServiceRequest) -> Self::Future {
    let headers = req.headers();
    let auth_header = headers.get("Authorization");

    let encoded_jwt = match auth_header {
      Some(value) => {
        let value_str = value.to_str().unwrap_or("");
        if value_str.starts_with("Bearer ") {
          value_str.trim_start_matches("Bearer ").to_string()
        } else {
          return Box::pin(async move { Err(actix_web::error::ErrorUnauthorized("Unauthorized")) });
        }
      }
      None => {
        return Box::pin(async move { Err(actix_web::error::ErrorUnauthorized("Unauthorized")) });
      }
    };

    let header = match decode_header(&encoded_jwt) {
      Ok(header) => header,
      Err(e) => {
        return Box::pin(async move {
          Err(actix_web::error::ErrorUnauthorized(format!(
            "Unauthorized: {e}"
          )))
        });
      }
    };

    let kid = match header.kid {
      Some(kid) => kid,
      None => {
        return Box::pin(async move {
          Err(actix_web::error::ErrorUnauthorized(
            "Unauthorized: No kid in JWT header".to_string(),
          ))
        });
      }
    };

    let key_store = self.config.key_store.clone();
    let service = self.service.clone();

    Box::pin(async move {
      let req = req;
      let key = match key_store.get_key(&kid).await {
        Ok(key) => key,
        Err(e) => {
          return Err(actix_web::error::ErrorUnauthorized(format!(
            "Unauthorized: {e}"
          )));
        }
      };

      let jwt = match decode::<T>(&encoded_jwt, key) {
        Ok(data) => data.claims,
        Err(e) => {
          return Err(actix_web::error::ErrorUnauthorized(format!(
            "Unauthorized: {}",
            e
          )));
        }
      };

      // Store the decoded JWT in the request's extensions.
      req.extensions_mut().insert(jwt);

      // Call the next service
      let res = service.call(req).await?;
      Ok(res)
    })
  }
}
