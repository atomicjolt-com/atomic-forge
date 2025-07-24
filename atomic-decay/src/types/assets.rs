use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

/// Strong type for asset identification
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AssetType {
    AppInit,
    App,
    Custom(String),
}

impl AssetType {
    pub fn filename(&self) -> &str {
        match self {
            AssetType::AppInit => "app-init.ts",
            AssetType::App => "app.ts",
            AssetType::Custom(name) => name,
        }
    }
    
    pub fn from_filename(filename: &str) -> Option<Self> {
        match filename {
            "app-init.ts" => Some(AssetType::AppInit),
            "app.ts" => Some(AssetType::App),
            name => Some(AssetType::Custom(name.to_string())),
        }
    }
    
    pub fn try_from_filename(filename: &str) -> Result<Self, AppError> {
        Self::from_filename(filename)
            .ok_or_else(|| AppError::Custom(format!("Invalid asset filename: {filename}")))
    }
}

impl Display for AssetType {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.filename())
    }
}

impl From<&str> for AssetType {
    fn from(s: &str) -> Self {
        Self::from_filename(s).unwrap_or_else(|| AssetType::Custom(s.to_string()))
    }
}

/// Strong type for asset names/keys
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AssetName(String);

impl AssetName {
    pub fn new(name: String) -> Self {
        Self(name)
    }
    
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for AssetName {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<String> for AssetName {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl From<&str> for AssetName {
    fn from(s: &str) -> Self {
        Self(s.to_string())
    }
}

/// Strong type for hashed asset values
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct HashedAsset(String);

impl HashedAsset {
    pub fn new(hash: String) -> Self {
        Self(hash)
    }
    
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for HashedAsset {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<String> for HashedAsset {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl From<&str> for HashedAsset {
    fn from(s: &str) -> Self {
        Self(s.to_string())
    }
}