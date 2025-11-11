# Atomic Decay

A high-performance LTI 1.3 tool implementation using async Rust with the Axum web framework and SQLx for database operations.

## Overview

Atomic Decay is a production-ready LTI (Learning Tools Interoperability) 1.3 tool that provides dynamic registration capabilities and integrates seamlessly with Learning Management Systems (LMS) like Canvas and Moodle. Built with modern async Rust, it leverages the Axum framework for high-performance HTTP handling and SQLx for compile-time verified database queries.

The application implements complete LTI 1.3 flows including OIDC authentication, JWT validation, dynamic registration, and LTI Advantage services (Names and Roles Provisioning Service, Assignment and Grade Services, Deep Linking).

## Why Use atomic-decay?

- **Modern Async Architecture**: Built on Axum and Tokio for excellent performance and scalability
- **Compile-Time Safety**: SQLx provides compile-time verification of SQL queries against your database schema
- **Multi-Tenant Ready**: Robust tenant isolation based on platform issuer + client ID combination
- **Just-In-Time Provisioning**: Automatic provisioning of tenants, courses, and users from LTI launches
- **Dynamic Registration**: Full support for LTI 1.3 dynamic registration workflow
- **Comprehensive Testing**: Extensive test suite with database isolation and test helpers
- **Type-Safe**: Leverages Rust's type system for correctness and safety
- **Production Ready**: Includes encrypted key storage, proper error handling, and CORS configuration

## Using as a Starter Template

Atomic Decay is designed to be a **production-ready starter template** for building new LTI 1.3 tools.

### Quick Start (Recommended)

Create a new LTI application from the Atomic Decay template with a single command:

```bash
# Clone the template repository
git clone <repository-url>
cd atomic-forge/atomic-decay

# Create your new app in a separate directory
make new APP_NAME=my-lti-app TARGET_DIR=../my-lti-app

# Navigate to your new app and start developing
cd ../my-lti-app
make setup    # Set up development environment
make dev      # Start development server
```

**What this does:**
- ✅ Creates a new directory with a complete copy of the template
- ✅ Renames the application throughout the codebase (atomic-decay → my-lti-app)
- ✅ Updates database names (atomic_decay_dev → my_lti_app_dev)
- ✅ Generates secure random secrets (JWT, session, JWK)
- ✅ Creates customized `.env` and `config/secrets.json` files
- ✅ Initializes a new git repository with initial commit
- ✅ Removes template-specific files (like init scripts)

**Your original atomic-decay directory stays untouched** - use it to create more apps!

### Other Options

**Generate secrets only:**
```bash
make generate-secrets
```

**Manual customization:**
See the detailed [Customization Guide (CUSTOMIZATION.md)](CUSTOMIZATION.md) for:
- Step-by-step manual instructions
- Configuration reference
- Common customizations
- Production deployment checklist

## Features

- **LTI 1.3 Core Implementation**
  - OIDC authentication flow with state management
  - JWT token validation and generation
  - Platform and registration management
  - JWKS endpoint for public key distribution

- **LTI Advantage Services**
  - Names and Roles Provisioning Service (NRPS)
  - Assignment and Grade Services (AGS)
  - Deep Linking support

- **Dynamic Registration**
  - Automated tool registration with platforms
  - Configuration storage with JSONB fields
  - Platform capability detection

- **Multi-Tenant Architecture**
  - Tenant isolation by platform issuer + client ID
  - Just-In-Time provisioning of resources
  - Automatic course and user creation

- **Security**
  - Encrypted RSA private key storage
  - JWT-based authentication
  - CORS configuration
  - State validation for OIDC flows

- **Developer Experience**
  - Auto-reload during development
  - Comprehensive test suite with test helpers
  - Database migrations with SQLx
  - Pre-seeded platform configurations

## Prerequisites

- **Rust 1.71+**: Install via [rustup](https://rustup.rs/)
- **PostgreSQL 14+**: Provided via Docker or install locally
- **Docker Desktop**: Required for running PostgreSQL container
- **libpq** (macOS): Required for PostgreSQL client library
  ```bash
  brew install libpq
  ```

## Getting Started

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd atomic-forge/atomic-decay

# Copy environment configuration
cp .env.example .env

# Copy secrets configuration
cp config/secrets.json.example config/secrets.json

# Edit config/secrets.json and set your JWT passphrase
# {
#   "jwk_passphrase": "your-secure-passphrase-here",
#   "allowed_origins": ["http://localhost:3000"]
# }
```

### 2. Database Setup

```bash
# Start PostgreSQL container (uses port 5433)
./scripts/setup-db.sh

# This script will:
# - Start Docker container with PostgreSQL 16.1
# - Create atomic_decay_dev database
# - Run all migrations
# - Create atomic_decay_test database for testing
```

### 3. Set PostgreSQL Library Path (macOS only)

```bash
export PQ_LIB_DIR="$(brew --prefix libpq)/lib"

# Add to your shell profile (~/.zshrc or ~/.bashrc)
echo 'export PQ_LIB_DIR="$(brew --prefix libpq)/lib"' >> ~/.zshrc
```

### 4. Run the Application

```bash
# Build and run
cargo run

# Application will start at http://127.0.0.1:8383
# Health check endpoint: http://127.0.0.1:8383/up
```

## Development

### Building

```bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release

# Check for compilation errors without building
cargo check
```

### Running with Auto-Reload

```bash
# Install cargo-watch (one-time setup)
cargo install cargo-watch systemfd

# Run with auto-reload on file changes
systemfd --no-pid -s http::8383 -- cargo watch -x run
```

This will automatically restart the server when source files change.

### Database Migrations

Atomic Decay uses SQLx for migrations, which provides compile-time query verification.

#### Creating a New Migration

```bash
# Create a new migration file
./scripts/create-migration.sh add_new_field

# This creates: migrations/TIMESTAMP_add_new_field.sql
# Edit the file and add your SQL
```

Example migration:
```sql
-- migrations/20251023002006_add_new_field.sql
ALTER TABLE users ADD COLUMN preferences JSONB;
```

#### Running Migrations

```bash
# Migrations run automatically on application startup
# Manual migration command:
sqlx migrate run

# Revert last migration
sqlx migrate revert

# Check migration status
sqlx migrate info
```

#### SQLx Offline Mode (for CI/CD)

```bash
# Prepare offline query metadata
cargo sqlx prepare

# This creates .sqlx/ directory with query metadata
# Commit .sqlx/ to version control for CI builds
```

### Testing

```bash
# Run all tests with database setup/teardown
./scripts/test-with-db.sh

# Run tests (requires database already running)
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_provision_tenant

# Run tests single-threaded (useful for database tests)
cargo test -- --test-threads=1

# Run only unit tests (skip integration tests)
cargo test --lib

# Run only integration tests
cargo test --test '*'
```

#### Test Database Management

```bash
# Setup test database
./scripts/test-db-setup.sh

# Reset test database (drop and recreate)
./scripts/test-db-reset.sh

# Run tests serially (for debugging)
./scripts/test-serial.sh
```

### Code Quality Tools

```bash
# Format code
cargo fmt

# Check formatting without modifying files
cargo fmt -- --check

# Run Clippy linter
cargo clippy -- -D warnings

# Run Clippy with all features
cargo clippy --all-features -- -D warnings

# Run all checks (recommended before committing)
cargo fmt -- --check && cargo clippy --all-features -- -D warnings && cargo test
```

## Architecture Overview

### Application Structure

```
atomic-decay/
├── src/
│   ├── main.rs              # Application entry point
│   ├── lib.rs               # Library exports
│   ├── config.rs            # Configuration management
│   ├── db.rs                # Database connection pool
│   ├── errors.rs            # Error types and handling
│   ├── routes.rs            # Route definitions
│   ├── handlers/            # HTTP request handlers
│   │   ├── index.rs         # Health check endpoints
│   │   ├── lti.rs           # LTI flow handlers
│   │   ├── lti_services.rs  # LTI Advantage services
│   │   └── assets.rs        # Static asset serving
│   ├── models/              # Database models
│   │   ├── key.rs           # RSA key storage
│   │   ├── lti_platform.rs  # LMS platform configs
│   │   ├── lti_registration.rs  # Tool registrations
│   │   ├── oidc_state.rs    # OIDC state management
│   │   ├── tenant.rs        # Multi-tenant isolation
│   │   ├── course.rs        # Course/context records
│   │   └── user.rs          # User records
│   ├── stores/              # Data access layer
│   │   ├── db_key_store.rs  # Key storage implementation
│   │   ├── db_platform_store.rs  # Platform CRUD
│   │   ├── db_registration_store.rs  # Registration CRUD
│   │   ├── db_oidc_state_store.rs  # State management
│   │   └── tool_jwt_store.rs  # JWT operations
│   ├── services/            # Business logic
│   │   └── lti_provisioning.rs  # JIT provisioning
│   ├── extractors/          # Axum extractors
│   │   ├── jwt_claims.rs    # JWT validation extractor
│   │   ├── app_context.rs   # Application context
│   │   └── host_info.rs     # Host information
│   └── tests/               # Test utilities
│       ├── test_context.rs  # Test database setup
│       └── helpers.rs       # Test helper functions
├── tests/                   # Integration tests
├── migrations/              # SQLx migrations
├── scripts/                 # Development scripts
└── config/                  # Configuration files
```

### Core Components

#### AppState
Shared application state accessible to all handlers:
```rust
pub struct AppState {
    pub pool: db::Pool,              // Database connection pool
    pub jwk_passphrase: String,      // RSA key encryption passphrase
    pub assets: HashMap<String, String>,  // Compiled frontend assets
    pub key_store: Arc<dyn KeyStore + Send + Sync>,  // Key management
}
```

#### Multi-Tenant Architecture

**Key Principle: Tenant = platform_iss + client_id**

This pattern ensures each tool registration gets its own isolated tenant, even if multiple institutions use the same LMS platform.

```rust
// Example:
// Institution A using Canvas:
//   tenant = "https://canvas.instructure.com" + "client-abc"
// Institution B using Canvas:
//   tenant = "https://canvas.instructure.com" + "client-xyz"
// Result: Two isolated tenants
```

#### Just-In-Time Provisioning

The `LtiProvisioningService` automatically creates resources during LTI launches:

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

**oidc_states** - OIDC state tracking with issuer
```sql
CREATE TABLE oidc_states (
    state TEXT PRIMARY KEY,
    nonce TEXT NOT NULL,
    issuer TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Provisioning Tables

**tenants** - Multi-tenant isolation
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

### Request Flow

#### LTI Launch Flow
1. **OIDC Initiation** - `GET/POST /lti/init`
   - Creates OIDC state with nonce
   - Returns authentication redirect URL

2. **OIDC Redirect** - `POST /lti/redirect`
   - Validates state and nonce
   - Exchanges authorization code for JWT

3. **LTI Launch** - `POST /lti/launch`
   - Validates JWT claims
   - Provisions tenant, course, and user
   - Loads application frontend

#### Dynamic Registration Flow
1. **Registration Initiation** - `GET /lti/register`
   - Starts registration with LMS platform
   - Generates registration token

2. **Registration Completion** - `POST /lti/registration/finish`
   - Receives registration configuration
   - Stores platform and registration data
   - Returns success confirmation

#### Service Endpoints
- `GET /jwks` - Public keys for JWT validation
- `GET /lti/names_and_roles` - Course roster service (NRPS)
- `POST /lti/sign_deep_link` - Deep linking support

## Configuration

### Environment Variables

Configure via `.env` file:

```bash
# Database Configuration
# Port 5433 avoids conflicts with local PostgreSQL
DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_decay_dev
TEST_DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_decay_test

# Application Configuration
RUST_LOG=debug
HOST=127.0.0.1
PORT=8383

# PostgreSQL Library Path (macOS)
# Set this before running cargo build/run
PQ_LIB_DIR=/opt/homebrew/opt/libpq/lib
```

### Secrets Configuration

Configure via `config/secrets.json`:

```json
{
  "jwk_passphrase": "your-secure-passphrase-here",
  "allowed_origins": [
    "http://localhost:3000",
    "https://your-frontend-domain.com"
  ]
}
```

**Security Note**: Never commit `config/secrets.json` to version control. Use `config/secrets.json.example` as a template.

### Configuration Loading

The application uses a layered configuration approach:
1. Environment variables (`.env` file)
2. Secrets file (`config/secrets.json`)
3. Default values for optional settings

```rust
// Configuration is loaded in src/config.rs
let config = Config::from_env().expect("Invalid environment configuration");
```

## API Endpoints

### Health and Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root endpoint, returns app info |
| `/up` | GET | Health check endpoint |

### LTI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/lti/init` | GET, POST | OIDC authentication initiation |
| `/lti/redirect` | POST | OIDC callback handler |
| `/lti/launch` | POST | LTI launch handler with JWT validation |
| `/lti/register` | GET | Dynamic registration initiation |
| `/lti/registration/finish` | POST | Registration completion |
| `/jwks` | GET | Public JWKS endpoint |

### LTI Advantage Services

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/lti/names_and_roles` | GET | Names and Roles Provisioning Service |
| `/lti/sign_deep_link` | POST | Deep Linking signature generation |

### Assets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assets/{filename}` | GET | Serve static frontend assets |

## Testing Infrastructure

### Test Helpers

Atomic Decay provides comprehensive test helpers for database isolation:

```rust
use atomic_decay::tests::helpers::*;

#[tokio::test]
async fn test_something() {
    // Setup isolated test database
    let pool = setup_test_db().await;

    // Create test data
    let tenant = create_test_tenant(&pool, "test-tenant").await;

    // Run your test
    let result = MyModel::create(&pool, "data").await.unwrap();

    // Cleanup happens automatically
}
```

### TestContext and TestGuard

```rust
use atomic_decay::tests::test_context::TestContext;
use atomic_decay::tests::helpers::TestGuard;

#[tokio::test]
async fn test_with_context() {
    let mut ctx = TestContext::new().await;

    // Use context
    let tenant = create_test_tenant(&ctx.pool, "test-tenant").await;

    // Cleanup with guard (respects foreign key constraints)
    let _guard = TestGuard::new(ctx.pool.clone(), vec![
        "users",
        "courses",
        "tenants",
    ]);

    // Guard ensures cleanup even if test panics
}
```

### Key Testing Features

- **Isolated Databases**: Each test uses a clean database state
- **Pre-generated Keys**: Tests use unencrypted keys to avoid passphrase prompts
- **Automatic Cleanup**: Foreign key-aware cleanup with TestGuard
- **Integration Tests**: Full LTI flow tests with real database
- **Mock Support**: Mockito integration for external API testing

## Common Issues and Solutions

### Compilation Issues

**SQLx compile errors**
```bash
# Ensure DATABASE_URL points to database with migrations applied
sqlx migrate run

# Regenerate query metadata
cargo sqlx prepare
```

**PQ_LIB_DIR errors on macOS**
```bash
# Install libpq
brew install libpq

# Set library path
export PQ_LIB_DIR="$(brew --prefix libpq)/lib"
```

### Database Issues

**Port conflicts**
```bash
# Docker PostgreSQL uses port 5433 to avoid conflicts
# Update .env if needed
DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_decay_dev
```

**Migration errors**
```bash
# Reset database and rerun migrations
./scripts/reset-db.sh
```

**JSONB query issues**
```sql
-- Use proper type casting
SELECT registration_config::jsonb FROM lti_registrations;
```

### Testing Issues

**Foreign key violations during cleanup**
```rust
// Delete in correct order: users → courses → tenants → platforms
let _guard = TestGuard::new(pool.clone(), vec![
    "users",
    "courses",
    "tenants",
    "lti_registrations",
    "lti_platforms",
]);
```

**PEM passphrase prompts**
```rust
// Tests use pre-generated unencrypted keys
// Located in src/tests/helpers.rs
```

## Related Projects

Atomic Decay is part of the Atomic Forge ecosystem:

- **[atomic-lti](../atomic-lti/)** - Core LTI 1.3 library with JWT, JWKS, and protocol implementations
- **[atomic-lti-tool-axum](../atomic-lti-tool-axum/)** - Axum-based LTI tool framework with extractors and utilities
- **[atomic-lti-test](../atomic-lti-test/)** - Testing utilities and mock LTI platform for development
- **[atomic-oxide](../atomic-oxide/)** - Alternative LTI implementation using Diesel ORM

### When to Use atomic-decay vs atomic-oxide

**Use atomic-decay when:**
- You prefer async/await with SQLx
- You want compile-time query verification
- You're building new async applications
- You need native async database operations

**Use atomic-oxide when:**
- You prefer Diesel ORM's query builder
- You want traditional synchronous code
- You need complex ORM relationships
- You're integrating with existing Diesel projects

## License

MIT License - see [LICENSE](../LICENSE) for details

Copyright (c) 2024-2025 Atomic Jolt

---

For detailed architecture information and development guidelines, see [CLAUDE.md](./CLAUDE.md).