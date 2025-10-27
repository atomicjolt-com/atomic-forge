# atomic-lti

`atomic-lti` is a Rust library that provides support for integrating with the LTI 1.3 and LTI Advantage standards provided by 1EdTech.

## Overview

This library provides core types, traits, and utilities for building LTI 1.3 compliant tools. It includes comprehensive store traits for managing platforms, registrations, OIDC state, keys, and JWTs.

## Supported LTI Advantage Specifications

The following LTI Advantage specifications are supported:

- Names and Roles Provisioning Service (NRPS)
- Assignment and Grade Services (AGS)
- Deep Linking 2.0

## Features

- Complete LTI 1.3 Core support
- Enhanced store traits with CRUD operations
- Platform and registration management
- OIDC state tracking with issuer support
- JWT validation and signing
- Type-safe error handling
- Async/await throughout

## Installation

To use `atomic-lti` in your Rust project, add the following to your `Cargo.toml` file:

```toml
[dependencies]
atomic-lti = "2.1.0"
```

## Enhanced Store Traits

### PlatformStore

The `PlatformStore` trait manages LMS platform configurations. It provides both legacy single-platform methods and modern CRUD operations for multi-platform scenarios.

#### Platform Data Structure

```rust
use atomic_lti::stores::platform_store::PlatformData;

let platform = PlatformData {
    issuer: "https://canvas.instructure.com".to_string(),
    name: Some("Canvas LMS".to_string()),
    jwks_url: "https://canvas.instructure.com/api/lti/security/jwks".to_string(),
    token_url: "https://canvas.instructure.com/login/oauth2/token".to_string(),
    oidc_url: "https://canvas.instructure.com/api/lti/authorize_redirect".to_string(),
};
```

#### CRUD Operations

```rust
use atomic_lti::stores::platform_store::PlatformStore;

// Create a new platform
let created = store.create(platform).await?;

// Find by issuer
let found = store.find_by_iss("https://canvas.instructure.com").await?;

// Update platform
platform.name = Some("Updated Canvas".to_string());
let updated = store.update(&platform.issuer, platform).await?;

// List all platforms
let all_platforms = store.list().await?;

// Delete platform
store.delete("https://canvas.instructure.com").await?;
```

#### Backward Compatible Methods

For single-platform scenarios, legacy methods are still supported:

```rust
let oidc_url = store.get_oidc_url().await?;
let jwks_url = store.get_jwk_server_url().await?;
let token_url = store.get_token_url().await?;
```

#### Implementation Example

```rust
use atomic_lti::stores::platform_store::{PlatformStore, PlatformData};
use atomic_lti::errors::PlatformError;
use async_trait::async_trait;

struct DBPlatformStore {
    pool: PgPool,
    issuer: String,
}

#[async_trait]
impl PlatformStore for DBPlatformStore {
    async fn get_oidc_url(&self) -> Result<String, PlatformError> {
        // Query database for platform config
        let platform = sqlx::query_as!(
            Platform,
            "SELECT * FROM lti_platforms WHERE issuer = $1",
            &self.issuer
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(platform.oidc_url)
    }

    async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError> {
        // Insert new platform into database
        sqlx::query!(
            "INSERT INTO lti_platforms (issuer, name, jwks_url, token_url, oidc_url)
             VALUES ($1, $2, $3, $4, $5)",
            platform.issuer,
            platform.name,
            platform.jwks_url,
            platform.token_url,
            platform.oidc_url
        )
        .execute(&self.pool)
        .await?;

        Ok(platform)
    }

    async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError> {
        let result = sqlx::query_as!(
            Platform,
            "SELECT * FROM lti_platforms WHERE issuer = $1",
            issuer
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(result.map(|p| PlatformData {
            issuer: p.issuer,
            name: p.name,
            jwks_url: p.jwks_url,
            token_url: p.token_url,
            oidc_url: p.oidc_url,
        }))
    }

    // Implement other methods...
}
```

### RegistrationStore

The `RegistrationStore` trait manages LTI tool registrations, including OAuth2 credentials, deployment information, and tool capabilities.

#### Registration Data Structure

```rust
use atomic_lti::stores::registration_store::RegistrationData;
use serde_json::json;

let registration = RegistrationData {
    platform_id: 1,
    client_id: "abc123".to_string(),
    deployment_id: Some("deployment-1".to_string()),
    registration_config: json!({
        "client_name": "My LTI Tool",
        "redirect_uris": ["https://example.com/lti/launch"]
    }),
    registration_token: None,
    status: "active".to_string(),
    supported_placements: Some(json!(["course_navigation", "assignment_selection"])),
    supported_message_types: Some(json!(["LtiResourceLinkRequest", "LtiDeepLinkingRequest"])),
    capabilities: Some(json!({
        "can_create_line_items": true,
        "can_update_grades": true
    })),
};
```

#### Helper Methods

```rust
// Check if registration supports a placement
if registration.supports_placement("course_navigation") {
    println!("Course navigation is supported");
}

// Check if registration supports a message type
if registration.supports_message_type("LtiResourceLinkRequest") {
    println!("Resource link requests are supported");
}

// Get a specific capability
if let Some(value) = registration.get_capability("can_create_line_items") {
    println!("Can create line items: {}", value);
}
```

#### Store Operations

```rust
use atomic_lti::stores::registration_store::RegistrationStore;

// Create a new registration
let created = store.create(registration).await?;

// Find by client ID
let found = store.find_by_client_id("abc123").await?;

// Find by platform and client ID (useful for multi-tenant scenarios)
let found = store.find_by_platform_and_client(1, "abc123").await?;

// Update status
let updated = store.update_status("abc123", "revoked").await?;

// Update capabilities
let new_capabilities = json!({
    "can_create_line_items": true,
    "can_update_grades": true,
    "max_score": 100
});
let updated = store.update_capabilities("abc123", new_capabilities).await?;
```

### OIDCStateStore

The `OIDCStateStore` trait manages OIDC authentication state and nonce values. Enhanced with issuer tracking for multi-platform support.

```rust
use atomic_lti::stores::oidc_state_store::OIDCStateStore;

// Get state and nonce
let state = store.get_state().await;
let nonce = store.get_nonce().await;

// Get issuer (enhanced feature)
if let Some(issuer) = store.get_issuer().await {
    println!("State is for platform: {}", issuer);
}

// Check creation time
let created_at = store.get_created_at().await;

// Destroy state after use
store.destroy().await?;
```

The issuer field allows associating OIDC state with specific platforms, enabling proper state validation in multi-platform scenarios.

### KeyStore

The `KeyStore` trait manages RSA key pairs for JWT signing and verification.

```rust
use atomic_lti::stores::key_store::KeyStore;

// Get current key for signing
let (kid, private_key) = store.get_current_key().await?;

// Get multiple keys (for key rotation)
let keys = store.get_current_keys(5).await?;

// Get specific key by ID
let key = store.get_key("key-id-123").await?;
```

### JwtStore

The `JwtStore` trait handles JWT creation from LTI ID tokens.

```rust
use atomic_lti::stores::jwt_store::JwtStore;

// Build JWT from ID token
let jwt = store.build_jwt(&id_token).await?;
```

## JWT Utilities

The library provides utilities for encoding and decoding JWTs with automatic key management:

```rust
use atomic_lti::jwt::{encode_using_store, decode_using_store};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct MyClaims {
    sub: String,
    exp: i64,
}

// Encode claims to JWT
let claims = MyClaims {
    sub: "user123".to_string(),
    exp: 1234567890,
};
let jwt_string = encode_using_store(&claims, &key_store).await?;

// Decode JWT back to claims
let token_data = decode_using_store::<MyClaims>(&jwt_string, &key_store).await?;
println!("User: {}", token_data.claims.sub);
```

## Error Handling

The library provides comprehensive error types:

```rust
use atomic_lti::errors::*;

// Platform errors
PlatformError::InvalidIss(String)
PlatformError::NotFound(String)

// Registration errors
RegistrationError::NotFound(String)
RegistrationError::AlreadyExists(String)

// OIDC errors
OIDCError::InvalidState
OIDCError::ExpiredState

// Security errors
SecureError::InvalidKeyId
SecureError::EmptyKeys
SecureError::JwtError(String)
```

## Migration from Previous Versions

### PlatformStore Changes

**Before (single platform):**
```rust
async fn get_oidc_url(&self) -> Result<String, PlatformError>;
```

**After (multi-platform):**
```rust
// Legacy method still works
async fn get_oidc_url(&self) -> Result<String, PlatformError>;

// New CRUD methods
async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError>;
async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError>;
async fn update(&self, issuer: &str, platform: PlatformData) -> Result<PlatformData, PlatformError>;
async fn delete(&self, issuer: &str) -> Result<(), PlatformError>;
async fn list(&self) -> Result<Vec<PlatformData>, PlatformError>;
```

### OIDCStateStore Changes

**Enhanced with issuer tracking:**

```rust
// New method
async fn get_issuer(&self) -> Option<String>;
```

All existing methods remain backward compatible.

### New RegistrationStore

The `RegistrationStore` trait is entirely new and provides registration management capabilities.

## Best Practices

### 1. Multi-Platform Support

When supporting multiple LMS platforms, use the enhanced CRUD methods:

```rust
// List all configured platforms
let platforms = platform_store.list().await?;

for platform in platforms {
    println!("Platform: {} ({})", platform.name.unwrap_or_default(), platform.issuer);
}
```

### 2. Registration Management

Store registration data with all relevant fields for proper tool configuration:

```rust
let registration = RegistrationData {
    platform_id: platform.id,
    client_id: registration_response.client_id,
    deployment_id: Some(registration_response.deployment_id),
    registration_config: serde_json::to_value(&registration_response)?,
    status: "active".to_string(),
    supported_placements: Some(json!(placements)),
    supported_message_types: Some(json!(message_types)),
    capabilities: Some(json!(capabilities)),
};

registration_store.create(registration).await?;
```

### 3. State Cleanup

Always clean up OIDC states after use to prevent database bloat:

```rust
async fn handle_oidc_callback(state: &str, store: &impl OIDCStateStore) -> Result<(), Error> {
    // Validate state
    let state_obj = store.get_state().await;

    // ... process callback

    // Clean up
    store.destroy().await?;

    Ok(())
}
```

### 4. Error Handling

Use pattern matching for comprehensive error handling:

```rust
match platform_store.find_by_iss(issuer).await {
    Ok(Some(platform)) => {
        // Platform found, proceed
    }
    Ok(None) => {
        // Platform not found, maybe create it
        platform_store.create(new_platform).await?;
    }
    Err(e) => {
        // Database or other error
        eprintln!("Error: {}", e);
    }
}
```

## Testing

The library includes comprehensive tests for all store traits:

```bash
cargo test -- --nocapture
```

For testing your implementations, use the in-memory test stores provided in the test modules, or create mock implementations.

## Examples

See the following projects for complete implementations:

- **atomic-decay** - SQLx-based implementation with PostgreSQL
- **atomic-oxide** - Diesel-based implementation with PostgreSQL

## Related Crates

- **atomic-lti-tool** - Tool-specific structures and dependency injection
- **atomic-lti-tool-axum** - Axum web framework integration
- **atomic-lti-test** - Testing utilities and mock implementations

## Run Tests

To run the tests for `atomic-lti`, use the following command:

```bash
cargo test -- --nocapture
```

## License

MIT
