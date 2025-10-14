pub mod deep_link;
pub mod dynamic_registration;
pub mod init;
pub mod jwks;
pub mod launch;
pub mod names_and_roles;
pub mod redirect;

use crate::ToolError;
use atomic_lti::stores::{
  jwt_store::JwtStore, key_store::KeyStore, oidc_state_store::OIDCStateStore,
  platform_store::PlatformStore,
};
use axum::extract::Request;
use std::collections::HashMap;

pub use deep_link::*;
pub use dynamic_registration::*;
pub use init::*;
pub use jwks::*;
pub use launch::*;
pub use names_and_roles::*;
pub use redirect::*;

// Trait for providing dependencies to handlers
pub trait LtiDependencies: Send + Sync {
  type OidcStateStore: OIDCStateStore;
  type PlatformStore: PlatformStore;
  type JwtStore: JwtStore;
  type KeyStore: KeyStore;

  fn create_oidc_state_store(
    &self,
  ) -> impl std::future::Future<Output = Result<Self::OidcStateStore, ToolError>> + Send;
  fn init_oidc_state_store(
    &self,
    state: &str,
  ) -> impl std::future::Future<Output = Result<Self::OidcStateStore, ToolError>> + Send;
  fn create_platform_store(
    &self,
    iss: &str,
  ) -> impl std::future::Future<Output = Result<Self::PlatformStore, ToolError>> + Send;
  fn create_jwt_store(
    &self,
  ) -> impl std::future::Future<Output = Result<Self::JwtStore, ToolError>> + Send;
  fn key_store(&self) -> &Self::KeyStore;
  fn get_assets(&self) -> &HashMap<String, String>;
  fn get_host(&self, req: &Request) -> String;
}
