# Test Database Setup

This document explains how to set up and use the Docker-based PostgreSQL database for testing.

## Overview

The test environment uses Docker to provide a consistent, isolated PostgreSQL 16 database for running tests. This ensures:

- Clean database state for each test run
- No interference with development database
- Consistent test environment across all developers and CI/CD
- Fast test execution with optimized PostgreSQL settings

## Prerequisites

- Docker and Docker Compose installed
- Rust and Cargo installed
- Diesel CLI installed: `cargo install diesel_cli --no-default-features --features postgres`

## Quick Start

### 1. Start the test database

```bash
# From the project root
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d postgres
```

### 2. Run tests with automatic database setup

```bash
# From the project root
./scripts/test-with-db.sh
```

This script will:
- Start Docker containers (if not running)
- Create/recreate the test database
- Run migrations
- Execute all tests
- Keep containers running for faster subsequent runs

### 3. Run specific tests

```bash
# Run a specific test
./scripts/test-with-db.sh test_name

# Run tests matching a pattern
./scripts/test-with-db.sh -- --test-threads=1 authentication

# Run tests in a specific module
./scripts/test-with-db.sh models::
```

## Manual Database Management

### Setup test database

```bash
./scripts/test-db-setup.sh
```

This creates a fresh test database and runs all migrations.

### Reset test database

```bash
./scripts/test-db-reset.sh
```

This truncates all tables but keeps the schema intact (faster than drop/recreate).

### Connect to test database

```bash
docker exec -it atomic-forge-postgres psql -U postgres -d atomic_oxide_test
```

## Environment Variables

The test database URL is configured in `.env.example`:

```env
TEST_DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_oxide_test
```

Note: Port 5433 is used to avoid conflicts with local PostgreSQL installations.

## Docker Configuration

### docker-compose.yml

The main compose file defines the PostgreSQL service with:
- PostgreSQL 16.1
- Health checks for container readiness
- Persistent volume for data
- Initialization scripts in `docker/postgres/init/`

### docker-compose.test.yml

Test-specific overrides for better performance:
- In-memory storage (tmpfs)
- Disabled fsync and synchronous commits
- Optimized PostgreSQL settings for tests

## Writing Tests with Database

### Using Test Helpers

```rust
use crate::tests::db_test_helpers::{TestDb, test_with_db};

// Simple test with automatic transaction rollback
test_with_db!(test_user_creation, |txn| {
    let user = create_user(txn.conn(), "test@example.com");
    assert_eq!(user.email, "test@example.com");
    // All changes are rolled back automatically
});

// Test requiring manual database management
#[test]
fn test_complex_scenario() {
    let db = TestDb::new();
    db.clean_database(); // Start with clean state
    
    // Your test code here
    let mut conn = db.conn();
    // ...
}
```

### Transaction-based Test Isolation

The `test_with_db!` macro automatically:
1. Starts a database transaction
2. Runs your test code
3. Rolls back all changes

This ensures tests don't affect each other and run quickly.

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/test.yml`) automatically:
- Spins up a PostgreSQL 16 service container
- Runs migrations
- Executes all tests

## Troubleshooting

### "TEST_DATABASE_URL must be set"

Ensure you have a `.env` file with the test database URL:
```bash
cp .env.example .env
```

### "Failed to connect to database"

1. Check Docker is running: `docker info`
2. Check containers are up: `docker-compose ps`
3. Verify PostgreSQL is ready: `docker exec atomic-forge-postgres pg_isready`

### Tests are slow

1. Ensure you're using `docker-compose.test.yml` for optimized settings
2. Use transaction-based tests when possible
3. Consider running tests in parallel: `cargo test -- --test-threads=4`

### Database state issues

If tests fail due to dirty database state:
```bash
./scripts/test-db-reset.sh  # Quick reset
# or
./scripts/test-db-setup.sh  # Full recreation
```

## Performance Tips

1. **Keep containers running**: The scripts don't stop containers after tests for faster subsequent runs
2. **Use transactions**: Tests using `test_with_db!` are much faster than those requiring full cleanup
3. **Parallel execution**: Most tests can run in parallel safely with transaction isolation
4. **Local SSD**: Docker volumes on SSD significantly improve test performance