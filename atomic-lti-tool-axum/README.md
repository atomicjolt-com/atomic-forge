# atomic-lti-tool-axum

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A complete **LTI 1.3 (Learning Tools Interoperability)** tool implementation for the [Axum](https://github.com/tokio-rs/axum) web framework.

This library provides production-ready handlers for building LTI 1.3 tools that can integrate with Learning Management Systems (LMS) like Canvas, Moodle, Blackboard, and others.

## Why Use atomic-lti-tool-axum?

- **Complete LTI 1.3 Support**: All core LTI flows including OIDC, Deep Linking, NRPS, and Dynamic Registration
- **Production Ready**: Comprehensive error handling, security features, and battle-tested in production
- **Type-Safe**: Leverage Axum and Rust's type system for compile-time guarantees
- **JWT Claims Extractor**: Built-in extractor for protected routes with 14+ helper methods
- **Flexible Storage**: Trait-based design works with any database backend
- **Extensive Testing**: 21+ unit tests ensuring reliability
- **Developer Friendly**: Async/await throughout, clear examples, and excellent documentation

## Features

- ✅ **Complete LTI 1.3 Core Implementation**

  - OIDC Login Initiation
  - Authentication Response
  - Resource Link Launch
  - Deep Linking
  - Names and Roles Provisioning Service
  - Dynamic Registration

- ✅ **Security First**

  - JWT signature validation
  - OIDC state management
  - Cookie-based CSRF protection
  - Secure cookie handling with SameSite=None

- ✅ **Production Ready**

  - Comprehensive error handling
  - Type-safe API with Rust's type system
  - Extensive test coverage (21+ unit tests)
  - Built on proven `atomic-lti` library

- ✅ **Developer Friendly**
  - Async/await throughout
  - Dependency injection via traits
  - Flexible storage backends
  - Extensive documentation

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
atomic-lti-tool-axum = { path = "../atomic-lti-tool-axum" }
atomic-lti = { path = "../atomic-lti" }
axum = "0.8"
tokio = { version = "1.0", features = ["full"] }
```

## Quick Start

### 1. Implement the Dependencies Trait

```rust
use atomic_lti_tool_axum::handlers::LtiDependencies;
use std::collections::HashMap;

struct MyLtiDeps {
    // Your dependencies here
}

impl LtiDependencies for MyLtiDeps {
    type OidcStateStore = MyOidcStateStore;
    type PlatformStore = MyPlatformStore;
    type JwtStore = MyJwtStore;
    type KeyStore = MyKeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, ToolError> {
        // Return your OIDC state store
    }

    async fn create_platform_store(&self, iss: &str) -> Result<Self::PlatformStore, ToolError> {
        // Return your platform store
    }

    fn key_store(&self) -> &Self::KeyStore {
        // Return your key store
    }

    fn get_assets(&self) -> &HashMap<String, String> {
        // Return your asset mapping
    }

    fn get_host(&self, req: &Request) -> String {
        // Return the host from request
    }
}
```

### 2. Set Up Your Routes

```rust
use axum::{
    routing::{get, post},
    Router,
};
use atomic_lti_tool_axum::handlers::{init, jwks, redirect, launch};
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let deps = Arc::new(MyLtiDeps::new());

    let app = Router::new()
        // JWKS endpoint for platform to verify signatures
        .route("/lti/jwks", get(jwks::<MyLtiDeps>))

        // OIDC login initiation
        .route("/lti/init", post(init::<MyLtiDeps>))

        // OIDC authentication response
        .route("/lti/redirect", post(redirect::<MyLtiDeps>))

        // LTI launch
        .route("/lti/launch", post(launch::<MyLtiDeps>))

        .with_state(deps);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}
```

## Core Handlers

### JWKS Handler

Serves the public JSON Web Key Set for JWT signature verification.

```rust
use atomic_lti_tool_axum::handlers::jwks;

// GET /lti/jwks
.route("/lti/jwks", get(jwks::<MyLtiDeps>))
```

### Init Handler

Handles OIDC login initiation from the LMS platform.

```rust
use atomic_lti_tool_axum::handlers::init;

// POST /lti/init
.route("/lti/init", post(init::<MyLtiDeps>))
```

**Parameters:**

- `iss` - Platform issuer URL
- `login_hint` - User identifier hint
- `client_id` - LTI tool client ID
- `target_link_uri` - Target launch URL
- `lti_message_hint` - Optional message hint
- `lti_storage_target` - Storage target (iframe/parent)

### Redirect Handler

Handles OIDC authentication response and validates JWT.

```rust
use atomic_lti_tool_axum::handlers::redirect;

// POST /lti/redirect
.route("/lti/redirect", post(redirect::<MyLtiDeps>))
```

**Parameters:**

- `id_token` - Signed JWT from platform
- `state` - OIDC state value
- `lti_storage_target` - Optional storage target

### Launch Handler

Completes the LTI launch and returns HTML with launch data.

```rust
use atomic_lti_tool_axum::handlers::launch;

// POST /lti/launch
.route("/lti/launch", post(launch::<MyLtiDeps>))
```

**Parameters:**

- `id_token` - Signed JWT from platform
- `state` - OIDC state value
- `lti_storage_target` - Storage target

## Storage Traits

You need to implement these storage traits from `atomic-lti`:

### OIDCStateStore

Manages OIDC state and nonce values.

```rust
#[async_trait]
pub trait OIDCStateStore {
    async fn get_state(&self) -> String;
    async fn get_nonce(&self) -> String;
    async fn get_created_at(&self) -> NaiveDateTime;
    async fn destroy(&self) -> Result<usize, OIDCError>;
}
```

### PlatformStore

Stores LMS platform configuration.

```rust
#[async_trait]
pub trait PlatformStore {
    async fn get_oidc_url(&self) -> Result<String, PlatformError>;
    async fn get_jwk_server_url(&self) -> Result<String, PlatformError>;
}
```

### JwtStore

Manages JWT creation for your application.

```rust
#[async_trait]
pub trait JwtStore {
    async fn build_jwt(&self, id_token: &IdToken) -> Result<String, SecureError>;
}
```

### KeyStore

Manages RSA key pairs for signing.

```rust
#[async_trait]
pub trait KeyStore {
    async fn get_current_key(&self) -> Result<(String, Rsa<Private>), SecureError>;
    async fn get_current_keys(&self, limit: i64) -> Result<HashMap<String, Rsa<Private>>, SecureError>;
    async fn get_key(&self, kid: &str) -> Result<Rsa<Private>, SecureError>;
}
```

## Advanced Features

### Deep Linking

```rust
use atomic_lti_tool_axum::handlers::{deep_link_init, deep_link_response};

.route("/lti/deep-link", post(deep_link_init::<MyLtiDeps>))
.route("/lti/deep-link/response", post(deep_link_response::<MyLtiDeps>))
```

### Names and Roles Service

```rust
use atomic_lti_tool_axum::handlers::names_and_roles;

.route("/lti/names-and-roles", get(names_and_roles::<MyLtiDeps>))
```

### Dynamic Registration

```rust
use atomic_lti_tool_axum::handlers::{dynamic_registration_init, dynamic_registration_complete};

.route("/lti/register", get(dynamic_registration_init::<MyLtiDeps>))
.route("/lti/register/complete", post(dynamic_registration_complete::<MyLtiDeps>))
```

## Error Handling

The library provides comprehensive error types:

```rust
use atomic_lti_tool_axum::ToolError;

pub enum ToolError {
    Internal(String),
    BadRequest(String),
    Unauthorized(String),
    NotFound(String),
    Forbidden(String),
    // ... and more
}
```

All errors implement `IntoResponse` for Axum, automatically converting to appropriate HTTP responses.

## Testing

The library includes comprehensive tests using `atomic-lti-test` helpers:

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_launch_success
```

**Test Coverage:**

- ✅ JWKS endpoint (valid/invalid key stores)
- ✅ Init handler (with/without cookies)
- ✅ Redirect handler (success/invalid token/invalid state)
- ✅ Launch handler (success/invalid token/invalid URI/state verification)

## Examples

See the `examples/` directory for complete working examples:

- **Basic LTI Tool** - Minimal working implementation
- **With Database** - Using PostgreSQL for storage
- **Deep Linking** - Content selection and return
- **Names and Roles** - Roster retrieval

## Architecture

```
┌─────────────┐
│     LMS     │
│  (Canvas,   │
│   Moodle)   │
└──────┬──────┘
       │
       │ 1. OIDC Init
       ▼
┌─────────────┐
│  /lti/init  │──────┐
└─────────────┘      │
       │             │ 2. Redirect to LMS
       │             │
       │ 3. Auth     │
       ▼             │
┌─────────────┐      │
│/lti/redirect│◄─────┘
└─────────────┘
       │
       │ 4. Auto-submit form
       ▼
┌─────────────┐
│ /lti/launch │
└─────────────┘
       │
       │ 5. Return HTML with JWT
       ▼
┌─────────────┐
│   Your App  │
└─────────────┘
```

## Dependencies

Built on top of:

- **[atomic-lti](../atomic-lti)** - Core LTI 1.3 types and validation
- **[axum](https://github.com/tokio-rs/axum)** - Web framework
- **[tokio](https://tokio.rs/)** - Async runtime
- **[serde](https://serde.rs/)** - Serialization
- **[jsonwebtoken](https://github.com/Keats/jsonwebtoken)** - JWT handling
- **[openssl](https://docs.rs/openssl/)** - Cryptography

## Comparison with atomic-lti-tool

| Feature          | atomic-lti-tool (Actix) | atomic-lti-tool-axum (This) |
| ---------------- | ----------------------- | --------------------------- |
| Web Framework    | Actix Web 4.x           | Axum 0.8.x                  |
| Async Runtime    | Tokio                   | Tokio                       |
| Handler Style    | Function parameters     | State + Extractors          |
| Cookie Support   | actix-web cookies       | axum-extra cookies          |
| Type Safety      | ✅                      | ✅                          |
| Test Coverage    | ✅                      | ✅                          |
| Production Ready | ✅                      | ✅                          |

Both implementations use the same underlying `atomic-lti` library for LTI logic.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Documentation

- **[Implementation Plan](docs/implementation-plan.md)** - Detailed implementation notes
- **[LTI 1.3 Spec](https://www.imsglobal.org/spec/lti/v1p3/)** - Official IMS specification
- **[Axum Docs](https://docs.rs/axum/)** - Axum web framework documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:

- Open an issue on GitHub
- Check the [examples/](examples/) directory
- Review the [implementation plan](docs/implementation-plan.md)

## JWT Claims Extractor

The `JwtClaims` extractor allows you to build protected routes that require JWT authentication. It automatically validates the JWT and provides convenient access to all LTI claims.

### Basic Usage

```rust
use atomic_lti_tool_axum::extractors::JwtClaims;
use axum::{Json, response::IntoResponse};
use serde_json::json;

async fn protected_route(
    jwt_claims: JwtClaims,
) -> impl IntoResponse {
    let user_id = jwt_claims.user_id();
    let context_id = jwt_claims.context_id();

    Json(json!({
        "user_id": user_id,
        "context_id": context_id,
        "roles": jwt_claims.roles()
    }))
}
```

### Setup Requirements

Your application state must implement the `HasKeyStore` trait:

```rust
use atomic_lti_tool_axum::extractors::HasKeyStore;
use atomic_lti::stores::key_store::KeyStore;

struct AppState {
    key_store: MyKeyStore,
}

impl HasKeyStore for AppState {
    type KeyStore = MyKeyStore;

    fn key_store(&self) -> &Self::KeyStore {
        &self.key_store
    }
}
```

### Authentication

The extractor expects a Bearer token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

If the token is missing, invalid, or expired, the extractor returns a 401 Unauthorized error.

### Helper Methods

The `JwtClaims` struct provides 14 helper methods for accessing claim data:

#### Core Claims
```rust
jwt_claims.client_id()         // OAuth2 client ID
jwt_claims.platform_iss()      // LMS platform issuer URL
jwt_claims.deployment_id()     // LTI deployment ID
jwt_claims.user_id()           // User's subject ID
jwt_claims.message_type()      // LTI message type
```

#### User Information
```rust
jwt_claims.user_email()        // Option<&str>
jwt_claims.user_name()         // Option<&str>
jwt_claims.roles()             // &[String]
```

#### Context and Resource Link
```rust
jwt_claims.context_id()        // Option<&str> - Course ID
jwt_claims.resource_link_id()  // Option<&str> - Placement ID
```

#### LTI Services
```rust
jwt_claims.names_and_roles_endpoint_url()  // Option<&str>
jwt_claims.deep_link_claim_data()          // Option<&str>
```

#### Role Checking
```rust
jwt_claims.has_role("http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor")
jwt_claims.is_instructor()     // Convenience method
jwt_claims.is_learner()        // Convenience method
```

### Complete Example

```rust
use axum::{
    routing::get,
    Router,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use atomic_lti_tool_axum::extractors::{JwtClaims, HasKeyStore};
use atomic_lti::stores::key_store::KeyStore;
use serde_json::json;
use std::sync::Arc;

// Application state
struct AppState {
    key_store: DBKeyStore,
}

impl HasKeyStore for AppState {
    type KeyStore = DBKeyStore;

    fn key_store(&self) -> &Self::KeyStore {
        &self.key_store
    }
}

// Protected route - requires valid JWT
async fn dashboard(
    jwt_claims: JwtClaims,
) -> impl IntoResponse {
    Json(json!({
        "welcome": format!("Hello, {}", jwt_claims.user_name().unwrap_or("User")),
        "user_id": jwt_claims.user_id(),
        "course_id": jwt_claims.context_id(),
        "is_instructor": jwt_claims.is_instructor()
    }))
}

// Instructor-only route
async fn gradebook(
    jwt_claims: JwtClaims,
) -> Result<impl IntoResponse, StatusCode> {
    if !jwt_claims.is_instructor() {
        return Err(StatusCode::FORBIDDEN);
    }

    Ok(Json(json!({
        "course_id": jwt_claims.context_id(),
        "instructor": jwt_claims.user_name()
    })))
}

// Course roster route
async fn roster(
    jwt_claims: JwtClaims,
) -> impl IntoResponse {
    let nrps_url = jwt_claims.names_and_roles_endpoint_url();

    if let Some(url) = nrps_url {
        // Fetch roster from LMS using NRPS endpoint
        Json(json!({
            "message": "Fetching roster",
            "endpoint": url
        }))
    } else {
        Json(json!({
            "error": "Names and Roles service not available"
        }))
    }
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        key_store: DBKeyStore::new(/* ... */),
    });

    let app = Router::new()
        .route("/api/dashboard", get(dashboard))
        .route("/api/gradebook", get(gradebook))
        .route("/api/roster", get(roster))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}
```

### Error Handling

The extractor can return the following errors:

- `401 Unauthorized` - Missing or invalid Authorization header
- `401 Unauthorized` - JWT validation failed (invalid signature, expired token)
- `401 Unauthorized` - JWT decoding failed

All errors are automatically converted to appropriate HTTP responses.

### Testing Protected Routes

```rust
use atomic_lti_tool::tool_jwt::ToolJwt;
use atomic_lti::jwt::encode_using_store;
use atomic_lti_test::helpers::MockKeyStore;
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt;

#[tokio::test]
async fn test_protected_route() {
    let key_store = MockKeyStore::default();

    // Create test JWT
    let tool_jwt = ToolJwt {
        client_id: "test-client".to_string(),
        sub: "user123".to_string(),
        // ... other fields
    };

    let token = encode_using_store(&tool_jwt, &key_store).await.unwrap();

    // Make request with JWT
    let req = Request::builder()
        .uri("/api/dashboard")
        .header("Authorization", format!("Bearer {}", token))
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}
```

### Security Considerations

1. **Token Expiration**: Always set appropriate expiration times for JWTs
2. **Signature Validation**: The extractor automatically validates signatures using the key store
3. **HTTPS Only**: Always use HTTPS in production to protect tokens in transit
4. **Token Storage**: Store tokens securely on the client (avoid localStorage if possible)

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
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_launch_success

# Run tests with coverage (requires tarpaulin)
cargo tarpaulin --out Html
```

### Code Quality

```bash
# Format code
cargo fmt

# Check formatting
cargo fmt -- --check

# Run clippy
cargo clippy -- -D warnings

# Run all checks before committing
cargo fmt --check && cargo clippy -- -D warnings && cargo test
```

### Documentation

```bash
# Generate documentation
cargo doc --no-deps --open

# Check documentation
cargo doc --no-deps
```

### Running Examples

```bash
# Basic example
cargo run --example basic_server

# With database
cargo run --example with_database
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`cargo test`)
6. Run clippy (`cargo clippy -- -D warnings`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## Roadmap

- [ ] Assignment and Grade Services (AGS)
- [ ] Course Groups Service
- [ ] Resource Search Service
- [ ] Full LTI Advantage support
- [ ] More examples and documentation

## Acknowledgments

Built with support from Atomic Jolt and the Rust community.

Special thanks to the IMS Global Learning Consortium for the LTI specification.

---

**Made with ❤️ and Rust**
