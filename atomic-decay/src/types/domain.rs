use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

/// Strong type for LTI Client ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ClientId(String);

impl ClientId {
  pub fn new(id: String) -> Self {
    Self(id)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl Display for ClientId {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl From<String> for ClientId {
  fn from(s: String) -> Self {
    Self(s)
  }
}

impl From<&str> for ClientId {
  fn from(s: &str) -> Self {
    Self(s.to_string())
  }
}

/// Strong type for LTI Platform Issuer
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Issuer(String);

impl Issuer {
  pub fn new(iss: String) -> Self {
    Self(iss)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl Display for Issuer {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl From<String> for Issuer {
  fn from(s: String) -> Self {
    Self(s)
  }
}

impl From<&str> for Issuer {
  fn from(s: &str) -> Self {
    Self(s.to_string())
  }
}

/// Strong type for LTI Deployment ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct DeploymentId(String);

impl DeploymentId {
  pub fn new(id: String) -> Self {
    Self(id)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl Display for DeploymentId {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl From<String> for DeploymentId {
  fn from(s: String) -> Self {
    Self(s)
  }
}

impl From<&str> for DeploymentId {
  fn from(s: &str) -> Self {
    Self(s.to_string())
  }
}

/// Strong type for OIDC State
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct OidcState(String);

impl OidcState {
  pub fn new(state: String) -> Self {
    Self(state)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl Display for OidcState {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl From<String> for OidcState {
  fn from(s: String) -> Self {
    Self(s)
  }
}

impl From<&str> for OidcState {
  fn from(s: &str) -> Self {
    Self(s.to_string())
  }
}
