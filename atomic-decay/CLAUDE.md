# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Atomic Decay is an LTI (Learning Tools Interoperability) Tool implementation written in Rust. It provides dynamic registration capabilities and integrates with Learning Management Systems (LMS) using the LTI 1.3 standard.

## Development Commands

### Building and Running

```bash
# Set PostgreSQL library path (required for macOS)
export PQ_LIB_DIR="$(brew --prefix libpq)/lib"

# Build the project
cargo build

# Run the application
cargo run

# Run with auto-reload during development
systemfd --no-pid -s http::$PORT -- cargo watch -x run
```

### Database Operations

```bash
# Start PostgreSQL container (uses port 5433)
./scripts/setup-db.sh

# Setup test database
./scripts/test-db-setup.sh

# Run migrations (automated on startup, manual command if needed)
sqlx migrate run

# Create a new migration
./scripts/create-migration.sh <migration_name>
```

### Testing

```bash
# Run all tests with database setup/teardown
./scripts/test-with-db.sh

# Run tests without database setup (faster, requires DB already running)
cargo test

# Run specific test
cargo test <test_name>

# Run tests with output
cargo test -- --nocapture

# Run single-threaded (useful for database tests)
cargo test -- --test-threads=1

# Run only unit tests (no integration tests)
cargo test --lib
```

### Linting and Formatting

```bash
# Format code
cargo fmt

# Check formatting
cargo fmt -- --check

# Run clippy
cargo clippy -- -D warnings

# Run clippy with all features
cargo clippy --all-features -- -D warnings
```

## Architecture Overview

### Core Application Structure

The application follows a modular architecture with clear separation of concerns:

1. **Main Entry Point** (`src/main.rs`)
   - Initializes the application state with database pool, JWT passphrase, assets, and key store
   - Sets up CORS, tracing, and other middleware
   - Ensures at least one RSA key exists in the database for JWT signing

2. **Application State** (`AppState`)
   - Shared across all handlers via Arc<AppState>
   - Contains: database pool, JWT passphrase, compiled assets map, and key store

3. **LTI Integration** (`src/handlers/lti.rs`)
   - Implements `LtiDependencies` trait through `LtiAppState` wrapper
   - Handles LTI 1.3 flows: init, redirect, launch, registration
   - Uses atomic-lti and atomic-lti-tool-axum crates for LTI functionality

### Data Store Architecture

The application uses trait-based data stores that can be swapped out:

1. **Store Implementations** (`src/stores/`)
   - `DBKeyStore`: RSA key management for JWT signing
   - `DBOIDCStateStore`: OIDC state management with issuer tracking
   - `DBRegistrationStore`: LTI registration management with JSONB capabilities
   - `DBPlatformStore`: Platform configuration with full CRUD operations
   - `ToolJwtStore`: JWT creation and validation

2. **Database Models** (`src/models/`)
   - `Key`: RSA private keys (encrypted with passphrase)
   - `OIDCState`: Temporary state for OIDC flows (now includes issuer field)
   - `LtiPlatform`: LMS platform configurations (Canvas, Moodle, etc.)
   - `LtiRegistration`: Tool registrations with JSONB fields for flexibility
   - `Tenant`: Isolated data spaces (platform_iss + client_id combination)
   - `Course`: Course/context records linked to tenants
   - `User`: User records linked to tenants

3. **Services** (`src/services/`)
   - `LtiProvisioningService`: Just-In-Time provisioning of resources from LTI launches

### Database Schema

#### Core LTI Tables

**lti_platforms** - LMS platform configurations
```sql
CREATE TABLE lti_platforms (
    id SERIAL PRIMARY KEY,
    issuer TEXT NOT NULL UNIQUE,
    name TEXT,
    jwks_url TEXT NOT NULL,
    token_url TEXT NOT NULL,
    oidc_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**lti_registrations** - Tool registrations with JSONB fields
```sql
CREATE TABLE lti_registrations (
    id SERIAL PRIMARY KEY,
    platform_id INTEGER NOT NULL REFERENCES lti_platforms(id),
    client_id TEXT NOT NULL UNIQUE,
    deployment_id TEXT,
    registration_config JSONB NOT NULL,
    registration_token TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    supported_placements JSONB,
    supported_message_types JSONB,
    capabilities JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**oidc_states** - Enhanced with issuer tracking
```sql
CREATE TABLE oidc_states (
    state TEXT PRIMARY KEY,
    nonce TEXT NOT NULL,
    issuer TEXT,  -- New field for multi-platform support
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Provisioning Tables

**tenants** - Multi-tenant isolation (Tenant = platform_iss + client_id)
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    platform_iss TEXT NOT NULL,
    client_id TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform_iss, client_id)
);
```

**courses** - Course/context records
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    lti_context_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, lti_context_id)
);
```

**users** - User records
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    lti_user_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    roles JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, lti_user_id)
);
```

### LtiProvisioningService

The provisioning service implements Just-In-Time (JIT) provisioning of resources from LTI launches.

#### Key Principle: Tenant = platform_iss + client_id

**NOT just platform_iss**. This pattern ensures that each tool registration gets its own isolated tenant, even if multiple institutions use the same LMS platform.

- `platform_iss`: LMS vendor (e.g., "https://canvas.instructure.com")
- `client_id`: Unique per tool registration per institution

Example:
- Institution A using Canvas: tenant = "https://canvas.instructure.com" + "client-abc"
- Institution B using Canvas: tenant = "https://canvas.instructure.com" + "client-xyz"
- Result: Two isolated tenants, even though both use Canvas

#### Provisioning Flow

```rust
use atomic_decay::services::lti_provisioning::LtiProvisioningService;

let service = LtiProvisioningService::new(pool.clone());

// 1. Provision tenant (or get existing)
let tenant = service.provision_tenant(&jwt_claims).await?;

// 2. Provision course (or get existing) - returns None if no context
let course = service.provision_course(
    tenant.id,
    jwt_claims.context.as_ref().map(|c| c.id.as_str()),
    Some("Math 101"),  // context_title
).await?;

// 3. Provision user (or get existing)
let user = service.provision_user(tenant.id, &jwt_claims).await?;
```

#### Tenant Slug Generation

Tenants get a unique slug based on platform + client ID:

```rust
// Format: {domain}-{client_id_prefix}
// "https://canvas.instructure.com" + "abc123xyz"
// → "canvas-instructure-com-abc123xy" (max 50 chars)
```

#### Implementation Example

```rust
// In your launch handler
pub async fn handle_lti_launch(
    jwt_claims: &ToolJwt,
    pool: &PgPool,
) -> Result<(Tenant, Option<Course>, User), AppError> {
    let provisioning_service = LtiProvisioningService::new(pool.clone());

    // Provision tenant
    let tenant = provisioning_service.provision_tenant(jwt_claims).await?;

    // Provision course (if context exists)
    let course = provisioning_service.provision_course(
        tenant.id,
        jwt_claims.context.as_ref().map(|c| c.id.as_str()),
        jwt_claims.context.as_ref().and_then(|c| c.title.as_deref()),
    ).await?;

    // Provision user
    let user = provisioning_service.provision_user(tenant.id, jwt_claims).await?;

    Ok((tenant, course, user))
}

### Request Flow

1. **LTI Launch Flow**:
   - `/lti/init` (GET/POST) → Creates OIDC state, returns auth redirect
   - `/lti/redirect` (POST) → Handles OIDC callback, validates state
   - `/lti/launch` (POST) → Validates JWT, loads app.ts

2. **Dynamic Registration**:
   - `/lti/register` (GET) → Starts registration with LMS
   - `/lti/registration/finish` (POST) → Completes registration, stores config

3. **Service Endpoints**:
   - `/jwks` → Public keys for JWT validation
   - `/lti/names_and_roles` → Course roster service
   - `/lti/sign_deep_link` → Deep linking support

### Key Design Decisions

1. **Trait-Based Storage**: All stores implement traits from atomic-lti crate, allowing different backends
2. **Encrypted Keys**: RSA private keys are encrypted at rest using configurable passphrase
3. **Test Isolation**: Test helpers provide clean database state and pre-generated test keys
4. **SQLX Compile-Time Checks**: Database queries are validated at compile time against schema

### Environment Configuration

Required environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string (compile-time for SQLX)
- `TEST_DATABASE_URL`: Test database URL
- `PQ_LIB_DIR`: PostgreSQL library path (macOS)

Secrets configuration (`config/secrets.json`):
- `jwt_passphrase`: Passphrase for RSA key encryption
- `allowed_origins`: CORS allowed origins list

### Testing Strategy

1. **Database Tests**: Use `setup_test_db()` for isolated test database
2. **Pre-generated Keys**: Avoid passphrase prompts with test keys in `test_helpers`
3. **Test Cleanup**: Automatic cleanup of all tables respecting FK constraints
4. **Integration Tests**: Full LTI flow tests with real database

### Database Models Overview

#### LtiPlatform
- Represents an LMS platform (Canvas, Moodle, etc.)
- Stores JWKS URL, token URL, OIDC URL
- Foreign key for registrations
- Helper methods: `find_by_issuer()`, `create()`, `update()`, `delete()`

#### LtiRegistration
- Links platforms to tool installations
- Stores `client_id`, `deployment_id`
- Uses JSONB fields for flexibility:
  - `registration_config`: Complete registration data
  - `supported_placements`: Array of placement types
  - `supported_message_types`: Array of LTI message types
  - `capabilities`: Object with capability flags
- Helper methods: `supports_placement()`, `supports_message_type()`, `get_capability()`

#### Tenant
- Represents isolated data space (platform_iss + client_id)
- Contains `slug`, `name`, `platform_iss`, `client_id`
- Unique constraint on (platform_iss, client_id)
- Helper methods: `find_by_slug()`, `find_by_platform_and_client()`

#### Course
- Represents an LTI context (usually a course)
- Linked to tenant via `tenant_id`
- Contains `lti_context_id`, `title`
- Unique constraint on (tenant_id, lti_context_id)
- Helper methods: `find_by_tenant_and_context()`, `update_title()`

#### User
- Represents a user within a tenant
- Linked to tenant via `tenant_id`
- Contains `lti_user_id`, `email`, `name`, `roles` (JSONB)
- Unique constraint on (tenant_id, lti_user_id)
- Helper methods: `find_by_tenant_and_lti_user()`

### Migration Workflow

#### Creating Migrations

```bash
# Create a new migration
./scripts/create-migration.sh add_new_field

# This creates:
# migrations/TIMESTAMP_add_new_field.sql
```

#### Running Migrations

```bash
# Automated on startup (see src/main.rs)
# Or manually:
sqlx migrate run

# Revert last migration:
sqlx migrate revert
```

#### SQLx Offline Mode

For CI/CD environments without database access:

```bash
# Prepare offline data
cargo sqlx prepare

# This creates .sqlx/ directory with query metadata
# Commit .sqlx/ to version control
```

### Testing Infrastructure

#### Test Helpers

```rust
use atomic_decay::tests::helpers::test_helpers::*;

#[tokio::test]
async fn test_something() {
    // Setup isolated test database
    let pool = setup_test_db().await;

    // Run your test
    let result = MyModel::create(&pool, "data").await.unwrap();

    // Cleanup happens automatically
}
```

#### TestContext and TestGuard

```rust
use atomic_decay::tests::helpers::test_helpers::*;

#[tokio::test]
async fn test_with_context() {
    let mut ctx = TestContext::new().await;

    // Use context
    let tenant = create_test_tenant(&ctx.pool, "test-tenant").await;

    // Cleanup with guard
    let _guard = TestGuard::new(ctx.pool.clone(), vec![
        "users",
        "courses",
        "tenants",
    ]);

    // Guard ensures cleanup even if test panics
}
```

### Common Issues and Solutions

1. **SQLX Compile Errors**: Ensure `DATABASE_URL` points to a database with migrations applied
2. **PEM Passphrase Prompts**: Tests use pre-generated unencrypted keys to avoid prompts
3. **Port Conflicts**: Docker PostgreSQL uses port 5433 to avoid conflicts with local installations
4. **JSONB Query Issues**: Use proper type casting in queries: `registration_config::jsonb`
5. **Foreign Key Violations**: Delete in correct order: users → courses → tenants → platforms
6. **Tenant Slug Conflicts**: Slug generation is deterministic; same platform+client = same slug