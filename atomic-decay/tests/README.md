# Atomic Decay Test Guide

This guide explains how to write and run tests for the Atomic Decay Axum-based application.

## Test Setup

### Prerequisites

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

## Test Helpers

The project provides comprehensive test helpers in `src/test_helpers.rs`:

### Database Helpers

- **`TestDb`**: Manages test database connections
- **`TestTransaction`**: Provides automatic transaction rollback for test isolation
- **`clean_database()`**: Cleans all test data when transaction rollback isn't suitable

### HTTP Test Helpers

- **`create_test_app_state()`**: Creates a complete AppState with mock dependencies
- **`create_test_app()`**: Creates a test Router instance
- **`test_get()`, `test_post()`, `test_post_json()`**: Make HTTP requests in tests
- **`assert_status()`**: Assert response status codes
- **`body_string()`, `body_bytes()`**: Extract response bodies

### Test Macros

- **`test_with_db!`**: Sets up a test with database transaction that auto-rolls back
- **`test_with_app!`**: Sets up a test with complete app state and clean database

## Writing Tests

### Simple HTTP Test

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

### Database Test with Automatic Rollback

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

### Integration Test with App State

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

## Test Database Management

The test database is separate from the development database:
- **URL**: `postgres://postgres:password@localhost:5433/atomic_decay_test`
- **Port**: 5433 (different from dev database on 5432)
- **Scripts**:
  - `test-db-setup.sh`: Creates test database and runs migrations
  - `test-db-reset.sh`: Drops and recreates test database
  - `test-with-db.sh`: Runs tests with proper environment

## Best Practices

1. **Test Isolation**: Use transactions or `clean_database()` to ensure tests don't affect each other
2. **Mock External Dependencies**: Use `MockKeyStore`, `MockOIDCStateStore`, etc. from `atomic_lti_test`
3. **Test Real Database Operations**: The test database allows testing actual SQL queries
4. **Use Test Helpers**: Leverage the provided helpers for consistency and less boilerplate
5. **Async Tests**: All tests should use `#[tokio::test]` for async support

## Troubleshooting

- **Database Connection Errors**: Ensure Docker is running and test database is set up
- **Migration Errors**: Run `./scripts/test-db-setup.sh` to apply latest migrations
- **Test Pollution**: Use transactions or clean database between tests
- **Timeout Errors**: Increase connection timeout in test helpers if needed