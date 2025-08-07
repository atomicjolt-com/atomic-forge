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
   - `DBOIDCStateStore`: OIDC state management for LTI flows
   - `DBDynamicRegistrationStore`: Dynamic registration configuration
   - `ToolJwtStore`: JWT creation and validation

2. **Database Models** (`src/models/`)
   - `Key`: RSA private keys (encrypted with passphrase)
   - `OIDCState`: Temporary state for OIDC flows
   - `LtiPlatform`: LMS platform configurations
   - `LtiRegistration`: Tool registrations per platform

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

### Common Issues and Solutions

1. **SQLX Compile Errors**: Ensure `DATABASE_URL` points to a database with migrations applied
2. **PEM Passphrase Prompts**: Tests use pre-generated unencrypted keys to avoid prompts
3. **Port Conflicts**: Docker PostgreSQL uses port 5433 to avoid conflicts with local installations