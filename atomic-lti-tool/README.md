# atomic-lti-tool

Core LTI 1.3 tool structures and patterns for building Learning Tools Interoperability applications in Rust.

## Overview

`atomic-lti-tool` provides the foundational data structures and dependency injection patterns needed to build LTI 1.3 tools. It defines the enhanced ToolJwt structure with full LTI claim support and the LtiDependencies trait for flexible store implementations.

## Features

- Enhanced ToolJwt structure with full LTI 1.3 claim support
- Nested claim structures (context, resource_link)
- Full claim URIs for standards compliance
- LtiDependencies trait for dependency injection
- Framework-agnostic design (works with Actix, Axum, etc.)
- Comprehensive test coverage

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
atomic-lti-tool = { path = "../atomic-lti-tool" }
atomic-lti = { path = "../atomic-lti" }
```

## Enhanced ToolJwt Structure

The `ToolJwt` struct represents JWT tokens issued by your LTI tool to clients after successful launch. It includes all standard LTI claims plus custom fields for your application.

### Structure Overview

```rust
use atomic_lti_tool::tool_jwt::{ToolJwt, LtiContextClaim, LtiResourceLinkClaim};
use chrono::{Duration, Utc};

let tool_jwt = ToolJwt {
    // Standard JWT claims
    client_id: "my-client-123".to_string(),
    iss: "https://mytool.example.com".to_string(),
    sub: "user-456".to_string(),
    exp: (Utc::now() + Duration::minutes(60)).timestamp(),
    iat: Utc::now().timestamp(),

    // LTI-specific claims
    platform_iss: "https://lms.example.com".to_string(),
    deployment_id: "deployment-789".to_string(),
    message_type: "LtiResourceLinkRequest".to_string(),
    roles: vec!["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner".to_string()],

    // Optional user information
    email: Some("user@example.com".to_string()),
    name: Some("Test User".to_string()),

    // Optional nested claims (using full URIs)
    context: Some(LtiContextClaim {
        id: "course-123".to_string(),
    }),
    resource_link: Some(LtiResourceLinkClaim {
        id: "link-456".to_string(),
    }),

    // Optional service endpoints
    names_and_roles_endpoint_url: Some("https://lms.example.com/nrps".to_string()),
    deep_link_claim_data: None,
};
```

### Key Features

1. **Full Claim URIs**: LTI-specific claims use their complete URIs for standards compliance:
   - `https://purl.imsglobal.org/spec/lti/claim/deployment_id`
   - `https://purl.imsglobal.org/spec/lti/claim/message_type`
   - `https://purl.imsglobal.org/spec/lti/claim/roles`
   - `https://purl.imsglobal.org/spec/lti/claim/context`
   - `https://purl.imsglobal.org/spec/lti/claim/resource_link`

2. **Nested Claim Structures**:
   ```rust
   pub struct LtiContextClaim {
       pub id: String,  // Course or context identifier
   }

   pub struct LtiResourceLinkClaim {
       pub id: String,  // Resource link placement identifier
   }
   ```

3. **Backward Compatibility**: Optional fields allow decoding of JWTs with missing claims

### Usage Example

```rust
use atomic_lti_tool::tool_jwt::ToolJwt;
use atomic_lti::jwt::{encode_using_store, decode_using_store};

// Create a ToolJwt
let tool_jwt = ToolJwt {
    // ... populate fields
};

// Encode to JWT string
let jwt_string = encode_using_store(&tool_jwt, &key_store).await?;

// Decode back to ToolJwt
let decoded = decode_using_store::<ToolJwt>(&jwt_string, &key_store).await?;
println!("User ID: {}", decoded.claims.sub);
println!("Context ID: {:?}", decoded.claims.context.map(|c| c.id));
```

## LtiDependencies Trait

The `LtiDependencies` trait enables dependency injection for LTI handlers, making them testable and reusable across different storage backends.

### Purpose

- Decouple handlers from specific store implementations
- Enable easy testing with mock stores
- Allow different projects to use different backends (SQLx, Diesel, in-memory)
- Support multiple LMS platforms in a single application

### Trait Definition

```rust
pub trait LtiDependencies: Send + Sync {
    type OidcStateStore: OIDCStateStore;
    type PlatformStore: PlatformStore;
    type JwtStore: JwtStore;
    type KeyStore: KeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, AtomicToolError>;
    async fn init_oidc_state_store(&self, state: &str) -> Result<Self::OidcStateStore, AtomicToolError>;
    async fn create_platform_store(&self, iss: &str) -> Result<Self::PlatformStore, AtomicToolError>;
    async fn create_jwt_store(&self) -> Result<Self::JwtStore, AtomicToolError>;
    fn key_store(&self) -> &Self::KeyStore;
    fn get_assets(&self) -> &HashMap<String, String>;
    fn get_host(&self, req: &HttpRequest) -> String;
}
```

### Implementation Example

```rust
use atomic_lti_tool::handlers::dependencies::LtiDependencies;
use atomic_lti::stores::*;
use std::sync::Arc;

pub struct MyAppDeps {
    pool: PgPool,
    key_store: DBKeyStore,
    assets: HashMap<String, String>,
}

impl LtiDependencies for MyAppDeps {
    type OidcStateStore = DBOIDCStateStore;
    type PlatformStore = DBPlatformStore;
    type JwtStore = ToolJwtStore;
    type KeyStore = DBKeyStore;

    async fn create_oidc_state_store(&self) -> Result<Self::OidcStateStore, AtomicToolError> {
        DBOIDCStateStore::create(&self.pool).await
            .map_err(|e| AtomicToolError::Internal(e.to_string()))
    }

    async fn init_oidc_state_store(&self, state: &str) -> Result<Self::OidcStateStore, AtomicToolError> {
        DBOIDCStateStore::init(&self.pool, state).await
            .map_err(|e| AtomicToolError::Internal(e.to_string()))
    }

    async fn create_platform_store(&self, iss: &str) -> Result<Self::PlatformStore, AtomicToolError> {
        Ok(DBPlatformStore::new(&self.pool, iss))
    }

    async fn create_jwt_store(&self) -> Result<Self::JwtStore, AtomicToolError> {
        Ok(ToolJwtStore::new(&self.pool, &self.key_store))
    }

    fn key_store(&self) -> &Self::KeyStore {
        &self.key_store
    }

    fn get_assets(&self) -> &HashMap<String, String> {
        &self.assets
    }

    fn get_host(&self, req: &HttpRequest) -> String {
        req.connection_info().host().to_string()
    }
}
```

### Using in Handlers

With the Actix Web framework:

```rust
use atomic_lti_tool::handlers::*;

pub async fn my_lti_init<D: LtiDependencies>(
    deps: Data<D>,
    Form(params): Form<InitParams>,
) -> Result<HttpResponse, AtomicToolError> {
    // Get stores from dependencies
    let platform_store = deps.create_platform_store(&params.iss).await?;
    let oidc_state_store = deps.create_oidc_state_store().await?;

    // Use stores to handle LTI flow
    // ...
}
```

With the Axum framework (via atomic-lti-tool-axum):

```rust
use atomic_lti_tool_axum::handlers::init;

// Handlers are generic over LtiDependencies
let app = Router::new()
    .route("/lti/init", post(init::<MyAppDeps>))
    .with_state(Arc::new(my_deps));
```

### Testing with Mock Dependencies

```rust
struct MockDeps {
    key_store: MockKeyStore,
    assets: HashMap<String, String>,
}

impl LtiDependencies for MockDeps {
    type OidcStateStore = MockOidcStateStore;
    type PlatformStore = MockPlatformStore;
    type JwtStore = MockJwtStore;
    type KeyStore = MockKeyStore;

    // Implement methods with test data
}

#[tokio::test]
async fn test_my_handler() {
    let mock_deps = MockDeps::new();
    // Test handlers using mock_deps
}
```

## Store Traits

The LtiDependencies trait relies on several store traits from `atomic-lti`:

### OIDCStateStore

Manages OIDC state and nonce values for authentication flows.

```rust
pub trait OIDCStateStore {
    async fn get_state(&self) -> String;
    async fn get_nonce(&self) -> String;
    async fn get_created_at(&self) -> NaiveDateTime;
    async fn destroy(&self) -> Result<usize, OIDCError>;
    async fn get_issuer(&self) -> Option<String>;  // Enhanced
}
```

### PlatformStore

Manages LMS platform configurations with CRUD operations.

```rust
pub trait PlatformStore {
    // Legacy methods
    async fn get_oidc_url(&self) -> Result<String, PlatformError>;
    async fn get_jwk_server_url(&self) -> Result<String, PlatformError>;
    async fn get_token_url(&self) -> Result<String, PlatformError>;

    // Enhanced CRUD methods
    async fn create(&self, platform: PlatformData) -> Result<PlatformData, PlatformError>;
    async fn find_by_iss(&self, issuer: &str) -> Result<Option<PlatformData>, PlatformError>;
    async fn update(&self, issuer: &str, platform: PlatformData) -> Result<PlatformData, PlatformError>;
    async fn delete(&self, issuer: &str) -> Result<(), PlatformError>;
    async fn list(&self) -> Result<Vec<PlatformData>, PlatformError>;
}
```

### JwtStore

Handles JWT creation and validation.

```rust
pub trait JwtStore {
    async fn build_jwt(&self, id_token: &IdToken) -> Result<String, SecureError>;
}
```

### KeyStore

Manages RSA keys for JWT signing and verification.

```rust
pub trait KeyStore {
    async fn get_current_key(&self) -> Result<(String, Rsa<Private>), SecureError>;
    async fn get_current_keys(&self, limit: i64) -> Result<HashMap<String, Rsa<Private>>, SecureError>;
    async fn get_key(&self, kid: &str) -> Result<Rsa<Private>, SecureError>;
}
```

## Best Practices

### 1. Asset Mapping

When using TypeScript/Vite builds, map `.ts` extensions to `.js`:

```rust
fn get_assets(&self) -> &HashMap<String, String> {
    let mut assets = self.raw_assets.clone();

    // Map .ts to .js for client compatibility
    if let Some(value) = assets.get("app.ts") {
        assets.insert("app.js".to_string(), value.clone());
    }

    &assets
}
```

### 2. Error Handling

Use the `AtomicToolError` type for consistent error handling:

```rust
use atomic_lti_tool::errors::AtomicToolError;

async fn my_function() -> Result<(), AtomicToolError> {
    store.do_something()
        .await
        .map_err(|e| AtomicToolError::Internal(e.to_string()))?;
    Ok(())
}
```

### 3. State Lifecycle

OIDC states are temporary and should be cleaned up:

```rust
// After successful validation
oidc_state_store.destroy().await?;
```

### 4. Multi-Platform Support

Use the `iss` parameter to select the right platform:

```rust
async fn create_platform_store(&self, iss: &str) -> Result<Self::PlatformStore, AtomicToolError> {
    // Platform store is scoped to specific issuer
    Ok(DBPlatformStore::new(&self.pool, iss))
}
```

## Testing

Run tests with:

```bash
cargo test -- --nocapture
```

The test suite includes:
- ToolJwt serialization/deserialization tests
- JWT encoding/decoding with key rotation
- LtiDependencies trait implementation tests
- Mock store implementations for testing

## Examples

See `atomic-decay` and `atomic-oxide` for complete implementations using:
- SQLx (atomic-decay)
- Diesel (atomic-oxide)

## Related Crates

- **atomic-lti** - Core LTI 1.3 types and validation
- **atomic-lti-tool-axum** - Axum web framework handlers
- **atomic-lti-test** - Testing utilities and mocks

## License

MIT
