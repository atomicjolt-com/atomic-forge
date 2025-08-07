# Testing Guide for Atomic Decay

This guide covers how to run and manage tests for the Atomic Decay LTI tool.

## Quick Start

```bash
# Run all tests (recommended)
make test

# Run tests serially if you encounter isolation issues
make test-serial

# Fix common test issues and reset environment
make test-fix
```

## Test Commands

### Basic Test Execution

- `make test` - Run all tests with test database setup
- `make test-serial` - Run tests serially to avoid isolation issues
- `make test-unit` - Run unit tests only
- `make test-integration` - Run integration tests only

### Test Database Management

- `make test-db-setup` - Setup test database and run migrations
- `make test-db-reset` - Drop and recreate test database
- `make test-db-clean` - Clean all data from test database tables
- `make test-diagnose` - Show test database state and diagnostics

### Specific Test Execution

- `make test-specific TEST=test_name` - Run specific test by name
- `make test-isolated TEST=test_name` - Run specific test in complete isolation
- `make test-failed` - Re-run only the tests that failed in the last run

### Advanced Testing

- `make test-watch` - Run tests with auto-reload on file changes
- `make test-summary` - Show only test summary (pass/fail)
- `make coverage` - Run tests with coverage report
- `make coverage-html` - Generate HTML coverage report

## Troubleshooting Test Failures

### Test Isolation Issues

If you see failures like "expected 2 keys, got 3", this indicates test isolation problems:

1. **Quick Fix**: Run tests serially
   ```bash
   make test-serial
   ```

2. **Reset Test Environment**:
   ```bash
   make test-fix
   ```

3. **Manual Cleanup**:
   ```bash
   make test-db-clean
   make test
   ```

### Diagnosing Issues

Use these commands to understand what's happening:

```bash
# Check test database state
make test-diagnose

# View PostgreSQL logs
make docker-postgres-logs

# Run a single test in isolation
make test-isolated TEST=test_list_keys
```

### Common Issues and Solutions

1. **"Database does not exist"**
   ```bash
   make test-db-setup
   ```

2. **"Too many connections"**
   ```bash
   make docker-postgres-restart
   ```

3. **Stale test data**
   ```bash
   make test-db-clean
   ```

4. **All tests failing**
   ```bash
   make test-fix
   ```

## Docker PostgreSQL Management

- `make docker-postgres-start` - Start PostgreSQL container
- `make docker-postgres-stop` - Stop PostgreSQL container
- `make docker-postgres-restart` - Restart PostgreSQL container
- `make docker-postgres-logs` - View PostgreSQL logs

## Writing Tests

### Test Structure

All tests should follow this pattern to ensure proper isolation:

```rust
#[tokio::test]
async fn test_example() {
    let pool = setup_test_db().await;
    
    // Clean up any existing data
    Key::destroy_all(&pool).await.ok();
    
    // Your test logic here
    
    // Clean up created data
    Key::destroy(&pool, key.id).await.ok();
}
```

### Best Practices

1. **Always clean before and after tests**
2. **Use descriptive test names**
3. **Test one thing per test**
4. **Use proper assertions with helpful messages**
5. **Avoid hardcoded values when possible**

## CI/CD Integration

For CI/CD pipelines, use:

```yaml
# GitHub Actions example
- name: Setup test database
  run: make test-db-setup

- name: Run tests
  run: make test-serial

- name: Generate coverage
  run: make coverage
```

## Environment Variables

Required for testing:
- `TEST_DATABASE_URL` - Test database connection string
- `DATABASE_URL` - Required for SQLX compile-time verification
- `PQ_LIB_DIR` - PostgreSQL library directory (macOS)

Check your environment:
```bash
make env-check
```