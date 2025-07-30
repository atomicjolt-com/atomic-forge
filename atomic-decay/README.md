# atomic-decay

LTI Tool implementation written in Rust

## Prerequisites

1. Install PostgreSQL libraries:
   ```bash
   brew install libpq
   ```

2. Install Rust (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. Install required development tools:
   ```bash
   cargo install systemfd cargo-watch
   ```

## DB Setup

This project uses SQLx for database operations with PostgreSQL.

To set up the database:
```bash
# Start PostgreSQL container
./scripts/setup-db.sh
```

Setup DB for tests:
```bash
# Set up test database
./scripts/test-db-setup.sh
```

Note: SQLx migrations are not yet configured. Database tables will be created automatically on first run.

## Building the Project

1. Set the PostgreSQL library path:
   ```bash
   export PQ_LIB_DIR="$(brew --prefix libpq)/lib"
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` to configure your database and application settings.

4. Build the project:
   ```bash
   cargo build
   ```

   Or use the provided build script:
   ```bash
   ./build.sh
   ```

## Running the Application

After successful compilation:

```bash
# Run the application
cargo run

# Or with auto-reload during development
systemfd --no-pid -s http::$PORT -- cargo watch -x run
```

Make sure PostgreSQL is running and accessible at the URL specified in your `.env` file.

## Testing

### Test Setup

#### Prerequisites

1. **Docker**: The test database runs in a Docker container
2. **SQLx CLI**: Install with `cargo install sqlx-cli --no-default-features --features postgres`
3. **Environment Variables**: Tests require `TEST_DATABASE_URL` to be set

### Running Tests

1. **Setup Test Database** (first time or when migrations change):
   ```bash
   ./scripts/test-db-setup.sh
   ```

2. **Run All Tests**:
   ```bash
   ./scripts/test-with-db.sh
   ```

3. **Run Specific Test**:
   ```bash
   TEST_DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_decay_test cargo test test_name
   ```

4. **Run tests with output**:
   ```bash
   cargo test -- --nocapture
   ```

### Test Database Management

The test database is separate from the development database:

- **URL**: `postgres://postgres:password@localhost:5433/atomic_decay_test`
- **Port**: 5433 (different from dev database on 5432)
- **Scripts**:
  - `test-db-setup.sh`: Creates test database and runs migrations
  - `test-db-reset.sh`: Drops and recreates test database
  - `test-with-db.sh`: Runs tests with proper environment

### Writing Tests

The project provides comprehensive test helpers in `src/test_helpers.rs`:

#### Database Helpers

- **`TestDb`**: Manages test database connections
- **`TestTransaction`**: Provides automatic transaction rollback for test isolation
- **`clean_database()`**: Cleans all test data when transaction rollback isn't suitable

#### HTTP Test Helpers

- **`create_test_app_state()`**: Creates a complete AppState with mock dependencies
- **`create_test_app()`**: Creates a test Router instance
- **`test_get()`, `test_post()`, `test_post_json()`**: Make HTTP requests in tests
- **`assert_status()`**: Assert response status codes
- **`body_string()`, `body_bytes()`**: Extract response bodies

#### Test Macros

- **`test_with_db!`**: Sets up a test with database transaction that auto-rolls back
- **`test_with_app!`**: Sets up a test with complete app state and clean database

#### Example Tests

**Simple HTTP Test:**
```rust
use atomic_decay::test_helpers::*;
use axum::http::StatusCode;

#[tokio::test]
async fn test_health_endpoint() {
    let state = create_test_app_state().await;
    let app = create_test_app(state);

    let response = test_get(app, "/up").await;
    assert_status(&response, StatusCode::OK);
}
```

**Database Test with Automatic Rollback:**
```rust
use atomic_decay::test_helpers::*;

test_with_db!(test_key_operations, |txn| {
    // Insert test data
    sqlx::query("INSERT INTO keys ...")
        .execute(txn.conn())
        .await
        .expect("Failed to insert");

    // Query and verify
    let count: i64 = sqlx::query("SELECT COUNT(*) FROM keys")
        .fetch_one(txn.conn())
        .await
        .expect("Failed to count")
        .get(0);

    assert_eq!(count, 1);
    // All changes rolled back automatically
});
```

**Integration Test with App State:**
```rust
test_with_app!(test_lti_flow, |app, state| {
    // Test complete LTI flow
    let init_response = test_post(app.clone(), "/lti/init",
        "iss=https://lms.example.com&login_hint=user123"
    ).await;

    assert_status(&init_response, StatusCode::OK);

    // Continue with redirect, launch, etc.
});
```

### Best Practices

1. **Test Isolation**: Use transactions or `clean_database()` to ensure tests don't affect each other
2. **Mock External Dependencies**: Use `MockKeyStore`, `MockOIDCStateStore`, etc. from `atomic_lti_test`
3. **Test Real Database Operations**: The test database allows testing actual SQL queries
4. **Use Test Helpers**: Leverage the provided helpers for consistency and less boilerplate
5. **Async Tests**: All tests should use `#[tokio::test]` for async support

### Troubleshooting Tests

- **Database Connection Errors**: Ensure Docker is running and test database is set up
- **Migration Errors**: Run `./scripts/test-db-setup.sh` to apply latest migrations
- **Test Pollution**: Use transactions or clean database between tests
- **Timeout Errors**: Increase connection timeout in test helpers if needed

## Troubleshooting

### pq-sys compilation errors

If you encounter errors like:
```
error occurred in cc-rs: Command env -u IPHONEOS_DEPLOYMENT_TARGET...
```
Or:
```
note: ld: library not found for -lpq
```

This is due to the bundled PostgreSQL feature trying to compile C code. The fix is to:
1. Ensure libpq is installed: `brew install libpq`
2. Set the PQ_LIB_DIR environment variable: `export PQ_LIB_DIR="$(brew --prefix libpq)/lib"`
3. Clean and rebuild: `cargo clean && cargo build`

### Package name mismatch

If you see errors about package name mismatches, ensure that the package name in Cargo.toml matches the directory name.

## Using Atomic Decay

A successful LTI launch will call "launch" in atomic-decay/src/handlers/lti.rs which in turn will load app.ts

### Configuration

Atomic Decay uses dynamic registration for installation into the LMS. A basic configuration including dynamic registration is already configured. To modify the tool configuration update the code in atomic-decay/src/stores/db_dynamic_registration.rs. This file contains an implementation of the traits from DBDynamicRegistrationStore for PostGres. You may also modify this file to work with other data stores.

### Routes

/ - GET home route
/up - GET up route that returns JSON 'up'

LTI Routes:
/lti/init - POST
/lti/redirect - POST
/lti/launch - POST

JWKS:
/jwks

Dynamic Registration:
/lti/register - GET
/lti/registration_finish - POST

Names and Roles:
/lti/names_and_roles

Deeplinking:
/lti/sign_deep_link

### Cloudflare Tunnels

If you are using Cloudflare tunnels Atomic Decay will be available at atomic-decay.atomicjolt.win

Steps to setting up Cloudflare Tunnels:
Create the tunnel:
cloudflared tunnel create atomic-decay

You have to create the DNS manually:
cloudflared tunnel route dns atomic-decay atomic-decay.atomicjolt.win

If atomic-decay.atomicjolt.win is taken just setup a different DNS entry. For example, ad.atomicjolt.win
Be sure to change tunnels.yaml to use the DNS you choose.

Run a tunnel. Note that tunnels.yaml needs to contain the ingress rules
cloudflared tunnel --config ./.vscode/tunnels.yaml run atomic-decay

## Developing

Atomic Decay is built using the atomic-lti crate which relies on the implementation of traits to talk to a
data store. Atomic Decay provides implementations of stores that rely on PostGres that can be found in the
atomic-decay/src/stores directory.

The traits can be found in atomic-lti/src/stores. Using a different data store requires the implementation of new code that implements these traits.

## Recent Changes

1. Removed `bundled` feature from pq-sys dependency
2. Updated pq-sys from 0.6 to 0.7
3. Updated axum from 0.7 to 0.8
4. Fixed package name from "atomic-oxide" to "atomic-decay"
5. Updated various other dependencies to their latest versions