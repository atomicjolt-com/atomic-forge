# atomic-oxide

Production-ready LTI 1.3 tool implementation using Actix Web and Diesel ORM, demonstrating best practices for building Learning Tools Interoperability applications with Rust.

## Overview

`atomic-oxide` is a complete LTI 1.3 tool implementation built with Actix Web and Diesel ORM. It demonstrates the same LTI improvements as `atomic-decay` but uses Diesel's type-safe query builder instead of SQLx's compile-time SQL verification. This project showcases how to build a robust, multi-platform LTI tool with PostgreSQL as the database backend.

## Why Use atomic-oxide?

- **Complete LTI 1.3 Implementation**: Full support for LTI 1.3 Core, Deep Linking, Names and Roles (NRPS), and Dynamic Registration
- **Type-Safe Queries**: Leverage Diesel's compile-time query builder for guaranteed SQL correctness
- **Production Ready**: Includes comprehensive error handling, logging, and security features
- **Multi-Platform Support**: Manage multiple LMS platforms and tool registrations in a single deployment
- **Enhanced Testing**: TestContext and TestGuard helpers ensure clean, isolated test execution
- **JWT Claims Extraction**: Built-in extractor for protected routes with automatic JWT validation
- **Asset Management**: Integrated static asset serving with content hashing
- **Migration-First Workflow**: Diesel's migration system ensures database schema consistency

## Features

### LTI 1.3 Support
- OIDC authentication flow
- LTI launch handling with state validation
- JWT-based session management
- Dynamic Registration for automatic platform setup
- Deep Linking 2.0 for content selection
- Names and Roles Provisioning Service (NRPS)

### Database Layer
- Diesel ORM with compile-time schema verification
- PostgreSQL with JSONB support for flexible data storage
- Automatic schema generation from migrations
- Connection pooling with r2d2
- Multi-platform data management

### Enhanced Features
- JWT Claims extractor for protected routes
- TestContext for isolated test execution
- TestGuard for automatic test cleanup
- Asset versioning and content hashing
- Comprehensive error handling with thiserror
- Request logging and debugging

### Architecture
- Actix Web for high-performance HTTP handling
- Diesel for type-safe database operations
- Async wrapper pattern for Diesel in async contexts
- Store trait implementations for all LTI components
- Framework-agnostic core with atomic-lti

## Prerequisites

- **Rust**: 1.71 or higher
- **PostgreSQL**: 12 or higher
- **Diesel CLI**: For database migrations
- **Docker**: For running PostgreSQL (optional)
- **macOS**: `libpq` library (install via Homebrew)

### macOS Setup

```bash
# Install PostgreSQL library
brew install libpq

# Set environment variable (add to ~/.zshrc or ~/.bashrc)
export PQ_LIB_DIR="$(brew --prefix libpq)/lib"

# Install Diesel CLI with PostgreSQL support only
cargo install diesel_cli --no-default-features --features postgres
```

## Getting Started

### 1. Database Setup

#### Using Docker (Recommended)

From the `atomic-forge` root directory:

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Verify PostgreSQL is running
docker ps | grep atomic-forge-postgres
```

The Docker setup provides:
- PostgreSQL 16.1 on port 5433
- Default database: `atomic_forge_dev`
- User: `postgres`
- Password: `password`

#### Using Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create development database
createdb atomic_oxide_dev

# Create test database
createdb atomic_oxide_test
```

### 2. Environment Configuration

Create a `.env` file in the `atomic-oxide` directory:

```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
# Note: Port 5433 is used for Docker PostgreSQL
DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_oxide_dev
TEST_DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_oxide_test

# Application configuration
RUST_LOG=debug
HOST=127.0.0.1
PORT=8282

# LTI configuration
LTI_ISSUER=https://atomic-oxide.atomicjolt.win
LTI_CLIENT_ID=atomic-oxide-client
LTI_DEPLOYMENT_ID=atomic-oxide-deployment

# Security (generate secure values for production)
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here
```

Create `config/secrets.json` with your JWK passphrase:

```json
{
  "jwk_passphrase": "your-secure-passphrase-here"
}
```

### 3. Run Migrations

```bash
# Setup database and run all migrations
diesel setup

# Or run migrations separately
diesel migration run
```

This creates all required tables:
- `keys` - RSA key pairs for JWT signing
- `lti_platforms` - LMS platform configurations
- `lti_registrations` - Tool registrations with OAuth2 credentials
- `oidc_states` - OIDC authentication state tracking

### 4. Run the Application

```bash
# Build and run
cargo run

# The server starts at http://127.0.0.1:8282
```

## Development

### Building

```bash
# Development build
cargo build

# Production build with optimizations
cargo build --release

# Check for errors without building
cargo check
```

### Running with Auto-Reload

For development with automatic reloading on file changes:

```bash
# Install cargo-watch
cargo install cargo-watch systemfd

# Run with auto-reload
systemfd --no-pid -s http::8282 -- cargo watch -x run
```

The application will automatically restart when you save changes to Rust files.

### Database Migrations

#### Creating Migrations

```bash
# Generate a new migration
diesel migration generate create_my_table

# This creates:
# migrations/TIMESTAMP_create_my_table/
#   ├── up.sql    (apply migration)
#   └── down.sql  (rollback migration)
```

Example migration:

```sql
-- up.sql
CREATE TABLE my_table (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- down.sql
DROP TABLE my_table;
```

#### Running Migrations

```bash
# Run all pending migrations
diesel migration run

# This automatically:
# 1. Executes SQL in up.sql
# 2. Regenerates src/schema.rs
# 3. Updates migration tracking table

# Revert last migration
diesel migration revert

# Redo (revert + run)
diesel migration redo

# Regenerate schema.rs manually
diesel print-schema > src/schema.rs
```

### Testing

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_jwks

# Single-threaded (useful for database tests)
cargo test -- --test-threads=1

# Run tests with specific log level
RUST_LOG=debug cargo test -- --nocapture
```

#### Using TestContext and TestGuard

The project includes helpers for clean, isolated testing:

```rust
use crate::tests::test_context::{TestContext, TestGuard};

#[tokio::test]
async fn test_create_platform() {
    let ctx = TestContext::new("create_platform");
    let pool = get_pool();
    let mut guard = TestGuard::new(pool.clone());

    // Create test data with unique identifiers
    let platform = create_test_platform(&ctx);
    guard.track_platform(platform.id);

    // ... test logic

    // Cleanup happens automatically when guard is dropped
    // Or call guard.cleanup() explicitly
    guard.cleanup().expect("Cleanup failed");
}
```

Features:
- **TestContext**: Generates unique identifiers for test isolation
- **TestGuard**: Automatically cleans up test data on drop
- **Targeted Cleanup**: Only deletes tracked resources, respecting foreign keys

### Code Quality Tools

```bash
# Format code
cargo fmt

# Check formatting without making changes
cargo fmt -- --check

# Run Clippy linter
cargo clippy -- -D warnings

# Run all quality checks
cargo fmt --check && cargo clippy -- -D warnings && cargo test
```

## Architecture Overview

### Diesel ORM vs SQLx

| Feature | atomic-oxide (Diesel) | atomic-decay (SQLx) |
|---------|----------------------|---------------------|
| ORM | Query builder | SQL macros |
| Query Style | Type-safe builder | SQL with compile-time checking |
| Async | Sync with async wrappers | Native async |
| Migrations | Two-way (up/down) | One-way by default |
| Schema | Compile-time (schema.rs) | Runtime |
| CLI | `diesel` | `sqlx` |

### Key Patterns

#### 1. Diesel Schema Definition

The `src/schema.rs` file is auto-generated and defines the database schema at compile-time:

```rust
diesel::table! {
    lti_platforms (id) {
        id -> Int8,
        uuid -> Varchar,
        issuer -> Text,
        name -> Nullable<Text>,
        jwks_url -> Text,
        token_url -> Text,
        oidc_url -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    lti_registrations (id) {
        id -> Int8,
        uuid -> Varchar,
        platform_id -> Int8,
        client_id -> Text,
        deployment_id -> Nullable<Text>,
        registration_config -> Jsonb,  // PostgreSQL JSONB
        registration_token -> Nullable<Text>,
        status -> Text,
        supported_placements -> Nullable<Jsonb>,
        supported_message_types -> Nullable<Jsonb>,
        capabilities -> Nullable<Jsonb>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::joinable!(lti_registrations -> lti_platforms (platform_id));
```

#### 2. Model Definitions

Diesel uses separate structs for querying vs inserting:

```rust
use diesel::prelude::*;

// For SELECT queries
#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::schema::lti_platforms)]
pub struct LtiPlatform {
    pub id: i64,
    pub uuid: String,
    pub issuer: String,
    pub name: Option<String>,
    pub jwks_url: String,
    pub token_url: String,
    pub oidc_url: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// For INSERT queries
#[derive(Insertable, Debug)]
#[diesel(table_name = crate::schema::lti_platforms)]
pub struct NewLtiPlatform {
    pub uuid: String,
    pub issuer: String,
    pub name: Option<String>,
    pub jwks_url: String,
    pub token_url: String,
    pub oidc_url: String,
}
```

#### 3. Query Builder Pattern

```rust
use diesel::prelude::*;
use crate::schema::lti_platforms::dsl::*;

// Simple query
let platforms = lti_platforms
    .load::<LtiPlatform>(&mut conn)?;

// Filtered query
let platform = lti_platforms
    .filter(issuer.eq("https://canvas.instructure.com"))
    .first::<LtiPlatform>(&mut conn)?;

// Insert with RETURNING
let new_platform = NewLtiPlatform { /* ... */ };
let created = diesel::insert_into(lti_platforms)
    .values(&new_platform)
    .get_result::<LtiPlatform>(&mut conn)?;

// Update
diesel::update(lti_platforms.filter(id.eq(platform_id)))
    .set(name.eq("Updated Name"))
    .execute(&mut conn)?;

// Delete
diesel::delete(lti_platforms.filter(id.eq(platform_id)))
    .execute(&mut conn)?;
```

#### 4. Async Wrapper Pattern

Diesel is synchronous, so we wrap calls for async contexts:

```rust
use tokio::task;
use diesel::prelude::*;

pub async fn find_platform(
    pool: &Pool,
    platform_iss: &str
) -> Result<Option<LtiPlatform>, Error> {
    let iss = platform_iss.to_string();
    let mut conn = pool.get()?;

    // Run Diesel query in blocking thread pool
    task::spawn_blocking(move || {
        use crate::schema::lti_platforms::dsl::*;

        lti_platforms
            .filter(issuer.eq(&iss))
            .first::<LtiPlatform>(&mut conn)
            .optional()
    })
    .await?
}
```

#### 5. JSONB Support

Diesel handles PostgreSQL JSONB seamlessly:

```rust
use serde_json::Value as JsonValue;

// In model
#[derive(Queryable, Selectable)]
pub struct LtiRegistration {
    pub registration_config: JsonValue,
    pub supported_placements: Option<JsonValue>,
    pub capabilities: Option<JsonValue>,
}

// In query
let registration = lti_registrations
    .filter(client_id.eq("abc123"))
    .first::<LtiRegistration>(&mut conn)?;

// Access JSONB data
if let Some(placements) = &registration.supported_placements {
    println!("Placements: {}", placements);
}
```

#### 6. Store Implementations

All LTI stores are implemented using Diesel:

- **DBPlatformStore**: Manages LMS platform configurations
- **DBRegistrationStore**: Handles tool registrations and OAuth2 credentials
- **DBOIDCStateStore**: Tracks OIDC authentication state
- **DBKeyStore**: Manages RSA key pairs for JWT signing
- **ToolJwtStore**: Creates JWTs for authenticated tool sessions

### JWT Claims Extractor

Protected routes use the `JwtClaims` extractor for automatic authentication:

```rust
use crate::extractors::jwt_claims::JwtClaims;
use actix_web::{get, web, Responder};

#[get("/protected")]
async fn protected_route(
    jwt_claims: JwtClaims,
    state: web::Data<AppState>
) -> impl Responder {
    // JWT is automatically validated and decoded
    let client_id = jwt_claims.client_id();
    let platform_iss = jwt_claims.platform_iss();
    let deployment_id = jwt_claims.deployment_id();

    // Use claims in your handler
    format!("Authenticated: {} on {}", client_id, platform_iss)
}
```

The extractor:
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Decodes header to get `kid` (key ID)
3. Fetches public key from KeyStore
4. Validates and decodes JWT
5. Returns claims or appropriate HTTP error

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `TEST_DATABASE_URL` | Test database connection string | - | Yes |
| `HOST` | Server bind address | 127.0.0.1 | No |
| `PORT` | Server port | 8282 | No |
| `RUST_LOG` | Log level (error, warn, info, debug, trace) | info | No |
| `PQ_LIB_DIR` | PostgreSQL library path (macOS) | - | macOS only |

### Secrets Configuration

The `config/secrets.json` file contains sensitive configuration:

```json
{
  "jwk_passphrase": "your-secure-passphrase-here-minimum-32-characters"
}
```

Important:
- Never commit `config/secrets.json` to version control
- Use strong, randomly generated passphrases in production
- Rotate keys regularly for security best practices

### Diesel Configuration

The `diesel.toml` file configures Diesel CLI:

```toml
[print_schema]
file = "src/schema.rs"
custom_type_derives = ["diesel::query_builder::QueryId"]

[migrations_directory]
dir = "migrations"
```

## API Endpoints

### Core LTI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/lti/init` | OIDC authentication initiation |
| POST | `/lti/redirect` | OIDC authentication redirect handler |
| POST | `/lti/launch` | LTI launch handler (main entry point) |
| GET | `/jwks` | JSON Web Key Set for JWT validation |
| GET | `/lti/register` | Dynamic registration initiation |
| POST | `/lti/registration_finish` | Dynamic registration completion |

### LTI Service Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/lti_services/names_and_roles` | Names and Roles Provisioning Service |
| POST | `/lti_services/sign_deep_link` | Sign Deep Linking JWT response |

### Utility Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Application index page |
| GET | `/up` | Health check endpoint |
| GET | `/assets/{filename}` | Static asset serving |

### Example LTI Launch Flow

1. **Platform initiates launch** → `GET /lti/init?iss=...`
2. **Tool redirects to platform** → Platform OIDC endpoint
3. **Platform redirects back** → `POST /lti/redirect`
4. **Tool processes launch** → `POST /lti/launch`
5. **Tool returns launch page** → HTML with embedded JWT

### Using Protected Endpoints

Protected endpoints require a valid JWT in the Authorization header:

```bash
# Get JWT from launch
curl -X POST http://localhost:8282/lti/launch \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "state=<state>&id_token=<id_token>"

# Use JWT for authenticated requests
curl http://localhost:8282/lti_services/names_and_roles \
  -H "Authorization: Bearer <jwt_from_launch>"
```

## Related Projects

### Core Libraries

- **[atomic-lti](../atomic-lti)**: Core LTI 1.3 library with store traits and utilities
- **[atomic-lti-tool](../atomic-lti-tool)**: Tool-specific structures and dependency injection patterns
- **[atomic-lti-test](../atomic-lti-test)**: Testing utilities and mock implementations

### Companion Projects

- **[atomic-decay](../atomic-decay)**: Similar LTI tool using SQLx instead of Diesel
- **[atomic-lti-tool-axum](../atomic-lti-tool-axum)**: Axum web framework integration

### Diesel vs SQLx Comparison

Choose **atomic-oxide (Diesel)** if you prefer:
- Type-safe query builder API
- Compile-time schema verification
- Two-way migrations (up/down)
- More ORM-like abstractions

Choose **atomic-decay (SQLx)** if you prefer:
- Writing SQL directly
- Native async/await
- Compile-time SQL verification with macros
- One-way migrations by default

Both implementations demonstrate the same LTI improvements and architectural patterns.

## Common Issues and Solutions

### 1. PQ_LIB_DIR Not Set (macOS)

**Issue**: `error: could not find native static library 'pq'`

**Solution**:
```bash
export PQ_LIB_DIR="$(brew --prefix libpq)/lib"

# Add to shell profile for persistence
echo 'export PQ_LIB_DIR="$(brew --prefix libpq)/lib"' >> ~/.zshrc
```

### 2. Schema Out of Sync

**Issue**: Compile errors after running migrations

**Solution**:
```bash
# Regenerate schema
diesel migration run
# or
diesel print-schema > src/schema.rs
```

### 3. Connection Pool Exhaustion

**Issue**: `Error: connection pool timeout`

**Solution**: Configure pool size in `src/db.rs`:
```rust
use diesel::r2d2::{self, ConnectionManager, Pool};

let manager = ConnectionManager::<PgConnection>::new(&database_url);
let pool = Pool::builder()
    .max_size(10)  // Increase pool size
    .build(manager)?;
```

### 4. JSONB Type Errors

**Issue**: Type mismatch with JSONB columns

**Solution**: Use `serde_json::Value`:
```rust
use serde_json::Value as JsonValue;

// Diesel maps JSONB → JsonValue automatically
pub struct MyModel {
    pub json_field: JsonValue,
}
```

### 5. Foreign Key Violations

**Issue**: Cannot delete parent row

**Solution**: Delete in correct order (children first):
```rust
// Delete registrations first
diesel::delete(lti_registrations::table
    .filter(platform_id.eq(pid)))
    .execute(&mut conn)?;

// Then delete platform
diesel::delete(lti_platforms::table
    .filter(id.eq(pid)))
    .execute(&mut conn)?;
```

## Best Practices

### 1. Use Transactions

```rust
use diesel::Connection;

conn.transaction::<_, Error, _>(|conn| {
    // Multiple operations are atomic
    diesel::insert_into(lti_platforms::table)
        .values(&new_platform)
        .execute(conn)?;

    diesel::insert_into(lti_registrations::table)
        .values(&new_registration)
        .execute(conn)?;

    Ok(())
})?;
```

### 2. Batch Operations

```rust
// Insert multiple records at once
diesel::insert_into(lti_platforms::table)
    .values(&vec_of_platforms)
    .execute(&mut conn)?;
```

### 3. Connection Management

```rust
// Get connection only when needed
let mut conn = pool.get()?;

// Connection automatically returned to pool when dropped
// Use scoped blocks for early return:
{
    let mut conn = pool.get()?;
    // ... use connection
}  // Connection returned here
```

### 4. Error Handling

```rust
use diesel::result::Error as DieselError;

match result {
    Ok(data) => Ok(data),
    Err(DieselError::NotFound) => Ok(None),  // Expected case
    Err(e) => Err(e.into()),  // Convert to app error
}
```

### 5. Testing with TestGuard

```rust
#[tokio::test]
async fn test_with_cleanup() {
    let ctx = TestContext::new("my_test");
    let pool = get_pool();
    let mut guard = TestGuard::new(pool.clone());

    // Create test data
    let platform = create_platform(&pool);
    guard.track_platform(platform.id);

    // Test logic...

    // Explicit cleanup before test ends
    guard.cleanup().expect("Cleanup failed");
}
```

## Documentation

### Generate Documentation

```bash
# Generate and open documentation
cargo doc --no-deps --open

# Generate without opening
cargo doc --no-deps

# Include private items
cargo doc --document-private-items
```

### Architecture Documentation

For detailed architecture and Diesel-specific patterns, see:
- [CLAUDE.md](./CLAUDE.md) - Comprehensive Diesel patterns and examples
- [atomic-lti README](../atomic-lti/README.md) - Core LTI library documentation
- [Diesel Getting Started](https://diesel.rs/guides/getting-started)

## License

MIT
