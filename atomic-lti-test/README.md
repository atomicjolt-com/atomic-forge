# atomic-lti-test

Testing utilities and helper functions for building and testing LTI 1.3 applications in the Atomic Forge ecosystem.

## Overview

`atomic-lti-test` provides mock implementations of store traits, test helpers, and utilities for writing comprehensive tests for LTI 1.3 tools. It includes pre-generated test keys, mock stores, and helper functions that make testing LTI flows straightforward and reliable.

## Why Use atomic-lti-test?

- **Mock Implementations**: Ready-to-use mock stores for all LTI traits (KeyStore, PlatformStore, OIDCStateStore, etc.)
- **Pre-generated Keys**: Avoid runtime key generation and passphrase prompts in tests
- **Test Helpers**: Utility functions for common testing scenarios
- **Consistent Test Data**: Standardized test fixtures for platforms, registrations, and JWTs
- **Fast Tests**: In-memory implementations for lightning-fast test execution
- **No External Dependencies**: Tests don't require databases or external services

## Installation

Add to your `Cargo.toml`:

```toml
[dev-dependencies]
atomic-lti-test = "2.1.0"
```

## Features

- Mock KeyStore with pre-generated RSA keys
- Mock PlatformStore with in-memory platform storage
- Mock OIDCStateStore for testing authentication flows
- Mock RegistrationStore for testing tool registrations
- Helper functions for creating test JWTs
- Pre-built LTI launch fixtures
- Consistent test data generation

## Getting Started

### Basic Test Setup

```rust
use atomic_lti_test::helpers::MockKeyStore;
use atomic_lti::stores::key_store::KeyStore;

#[tokio::test]
async fn test_my_feature() {
    // Use mock key store for testing
    let key_store = MockKeyStore::default();

    // Get a key for testing JWT operations
    let (kid, private_key) = key_store.get_current_key().await.unwrap();

    // Test your feature...
}
```

### Mock KeyStore

The `MockKeyStore` provides pre-generated RSA keys for testing without needing to generate new keys or handle passphrases.

```rust
use atomic_lti_test::helpers::MockKeyStore;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti::jwt::{encode_using_store, decode_using_store};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct TestClaims {
    sub: String,
    exp: i64,
}

#[tokio::test]
async fn test_jwt_operations() {
    let key_store = MockKeyStore::default();

    let claims = TestClaims {
        sub: "test-user".to_string(),
        exp: 9999999999,
    };

    // Encode claims to JWT
    let jwt = encode_using_store(&claims, &key_store).await.unwrap();

    // Decode JWT back to claims
    let decoded = decode_using_store::<TestClaims>(&jwt, &key_store).await.unwrap();
    assert_eq!(decoded.claims.sub, "test-user");
}
```

### Mock PlatformStore

Test platform operations without a database:

```rust
use atomic_lti_test::helpers::MockPlatformStore;
use atomic_lti::stores::platform_store::{PlatformStore, PlatformData};

#[tokio::test]
async fn test_platform_operations() {
    let store = MockPlatformStore::new("https://canvas.example.com");

    // Test platform methods
    let oidc_url = store.get_oidc_url().await.unwrap();
    assert!(oidc_url.contains("canvas.example.com"));

    // Test CRUD operations
    let platform = PlatformData {
        issuer: "https://canvas.example.com".to_string(),
        name: Some("Test Canvas".to_string()),
        jwks_url: "https://canvas.example.com/jwks".to_string(),
        token_url: "https://canvas.example.com/token".to_string(),
        oidc_url: "https://canvas.example.com/oidc".to_string(),
    };

    let created = store.create(platform).await.unwrap();
    assert_eq!(created.name, Some("Test Canvas".to_string()));
}
```

### Mock OIDCStateStore

Test OIDC authentication flows:

```rust
use atomic_lti_test::helpers::MockOIDCStateStore;
use atomic_lti::stores::oidc_state_store::OIDCStateStore;

#[tokio::test]
async fn test_oidc_flow() {
    let store = MockOIDCStateStore::new(
        "test-state-123",
        "test-nonce-456",
        Some("https://platform.example.com")
    );

    // Verify state and nonce
    assert_eq!(store.get_state().await, "test-state-123");
    assert_eq!(store.get_nonce().await, "test-nonce-456");
    assert_eq!(store.get_issuer().await, Some("https://platform.example.com".to_string()));

    // Test cleanup
    store.destroy().await.unwrap();
}
```

### Testing LTI Handlers

Create complete test scenarios for LTI handlers:

```rust
use atomic_lti_test::helpers::*;
use atomic_lti_tool::tool_jwt::ToolJwt;
use atomic_lti::jwt::encode_using_store;

#[tokio::test]
async fn test_lti_launch_handler() {
    // Setup mock stores
    let key_store = MockKeyStore::default();
    let platform_store = MockPlatformStore::new("https://canvas.example.com");
    let oidc_store = MockOIDCStateStore::new("state", "nonce", None);

    // Create test JWT
    let tool_jwt = ToolJwt {
        client_id: "test-client".to_string(),
        sub: "user-123".to_string(),
        platform_iss: "https://canvas.example.com".to_string(),
        deployment_id: "deployment-1".to_string(),
        message_type: "LtiResourceLinkRequest".to_string(),
        roles: vec!["Learner".to_string()],
        // ... other fields
    };

    let jwt_string = encode_using_store(&tool_jwt, &key_store).await.unwrap();

    // Test your handler with the JWT
    // let result = handle_launch(jwt_string).await;
    // assert!(result.is_ok());
}
```

## Test Helpers

### Pre-generated Keys

The library includes pre-generated RSA keys to avoid runtime key generation:

```rust
use atomic_lti_test::keys::{TEST_PRIVATE_KEY_PEM, TEST_PUBLIC_KEY_PEM};

// Use in your tests without generating new keys
```

### Standard Test Fixtures

```rust
use atomic_lti_test::fixtures::*;

// Standard platform data for Canvas
let canvas_platform = get_test_platform_canvas();

// Standard platform data for Moodle
let moodle_platform = get_test_platform_moodle();

// Standard LTI claims
let test_claims = get_test_tool_jwt();
```

## Mock Store Implementations

All mock stores implement the same traits as production stores:

- `MockKeyStore` → implements `KeyStore`
- `MockPlatformStore` → implements `PlatformStore`
- `MockOIDCStateStore` → implements `OIDCStateStore`
- `MockRegistrationStore` → implements `RegistrationStore`
- `MockJwtStore` → implements `JwtStore`

This means you can use dependency injection to swap production stores with mocks in your tests.

## Best Practices

### 1. Use Mocks for Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use atomic_lti_test::helpers::*;

    #[tokio::test]
    async fn test_feature() {
        // Use mocks for fast, isolated tests
        let key_store = MockKeyStore::default();
        // ... test logic
    }
}
```

### 2. Use Real Stores for Integration Tests

```bash
# Integration tests use real database
cargo test --test integration_tests
```

### 3. Clean Test Data

Always clean up test data, especially in integration tests:

```rust
#[tokio::test]
async fn test_with_cleanup() {
    let store = create_test_store().await;

    // Test logic

    // Cleanup
    cleanup_test_data(&store).await;
}
```

### 4. Isolate Tests

Ensure tests don't interfere with each other:

```rust
#[tokio::test]
async fn test_isolated() {
    let unique_id = uuid::Uuid::new_v4().to_string();
    let store = create_test_store(&unique_id).await;
    // Test uses unique data
}
```

## Development

### Building

```bash
# Build the library
cargo build

# Check for errors
cargo check
```

### Testing

```bash
# Run tests
cargo test

# Run with output
cargo test -- --nocapture
```

### Code Quality

```bash
# Format code
cargo fmt

# Run clippy
cargo clippy -- -D warnings
```

## Examples

### Testing a Custom LtiDependencies Implementation

```rust
use atomic_lti_test::helpers::*;
use atomic_lti_tool::handlers::dependencies::LtiDependencies;

struct TestDeps {
    key_store: MockKeyStore,
}

impl LtiDependencies for TestDeps {
    type KeyStore = MockKeyStore;
    type PlatformStore = MockPlatformStore;
    type OidcStateStore = MockOIDCStateStore;
    type JwtStore = MockJwtStore;

    fn key_store(&self) -> &Self::KeyStore {
        &self.key_store
    }

    // Implement other methods with mocks
}

#[tokio::test]
async fn test_dependencies() {
    let deps = TestDeps {
        key_store: MockKeyStore::default(),
    };

    // Test handlers using deps
}
```

## Related Crates

- **atomic-lti** - Core LTI 1.3 types and validation
- **atomic-lti-tool** - Tool structures and dependency injection
- **atomic-lti-tool-axum** - Axum web framework handlers
- **atomic-oxide** - Diesel-based LTI tool implementation
- **atomic-decay** - SQLx-based LTI tool implementation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT
