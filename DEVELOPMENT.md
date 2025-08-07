# Atomic Forge Development Setup

This monorepo contains two main LTI tools:
- **atomic-oxide**: An LTI tool built with Actix Web
- **atomic-decay**: An LTI tool built with Axum

Both projects share a single PostgreSQL database instance running on port 5433 to avoid conflicts with local installations.

## Quick Start

```bash
# Start the development environment
./scripts/start-dev.sh

# Run all tests
./scripts/test-all.sh
```

## Database Configuration

### PostgreSQL Docker Container
- **Port**: 5433 (to avoid conflicts with local PostgreSQL on 5432)
- **Container**: atomic-forge-postgres
- **User**: postgres
- **Password**: password

### Databases
Each project has its own development and test databases:

| Project | Development Database | Test Database |
|---------|---------------------|---------------|
| atomic-oxide | atomic_oxide_dev | atomic_oxide_test |
| atomic-decay | atomic_decay_dev | atomic_decay_test |
| atomic-lti | atomic_lti_dev | atomic_lti_test |

## Project Structure

```
atomic-forge/
├── atomic-oxide/          # Actix Web LTI tool
│   ├── scripts/
│   │   ├── setup-db.sh    # Setup database and run migrations
│   │   ├── test-db-setup.sh
│   │   ├── test-db-reset.sh
│   │   └── test-with-db.sh
│   └── .env.example       # Environment configuration
├── atomic-decay/          # Axum LTI tool
│   ├── scripts/
│   │   ├── setup-db.sh    # Setup database and run migrations
│   │   ├── test-db-setup.sh
│   │   ├── test-db-reset.sh
│   │   └── test-with-db.sh
│   └── .env.example       # Environment configuration
├── scripts/               # Global scripts
│   ├── start-dev.sh       # Unified startup script
│   └── test-all.sh        # Run all project tests
├── docker-compose.yml     # PostgreSQL container configuration
└── docker/postgres/init/  # Database initialization scripts
```

## Individual Project Setup

### Atomic Oxide
```bash
cd atomic-oxide
./scripts/setup-db.sh     # Setup database and run migrations
cargo run                 # Start development server (port 8282)
./scripts/test-with-db.sh  # Run tests with database
```

### Atomic Decay
```bash
cd atomic-decay
./scripts/setup-db.sh     # Setup database and run migrations
cargo run                 # Start development server (port 8283)
./scripts/test-with-db.sh  # Run tests with database
```

## Environment Configuration

Each project has its own `.env` file with project-specific settings:

### atomic-oxide/.env
```env
DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_oxide_dev
TEST_DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_oxide_test
HOST=127.0.0.1
PORT=8282
```

### atomic-decay/.env
```env
DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_decay_dev
TEST_DATABASE_URL=postgres://postgres:password@localhost:5433/atomic_decay_test
HOST=127.0.0.1
PORT=8283
```

## Docker Commands

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# View logs
docker-compose logs -f postgres

# Stop containers
docker-compose down

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres

# Connect to specific database
docker-compose exec postgres psql -U postgres -d atomic_oxide_dev
```

## Testing

### Run All Tests
```bash
./scripts/test-all.sh
```

### Run Individual Project Tests
```bash
# Atomic Oxide
cd atomic-oxide && ./scripts/test-with-db.sh

# Atomic Decay
cd atomic-decay && ./scripts/test-with-db.sh
```

### Test Database Management
Each project has its own test database scripts:
- `test-db-setup.sh`: Create and migrate test database
- `test-db-reset.sh`: Reset test database between runs
- `test-with-db.sh`: Run tests with automatic database setup

## Troubleshooting

### Port Conflicts
If port 5433 is already in use:
1. Check what's using the port: `lsof -i :5433`
2. Stop the conflicting process or change the port in `docker-compose.yml`
3. Update database URLs in all `.env` files

### Database Connection Issues
1. Ensure Docker is running
2. Check container status: `docker-compose ps`
3. Verify database exists: `docker-compose exec postgres psql -U postgres -l`

### Migration Issues
1. Check if database exists
2. Verify diesel.toml configuration
3. Run migrations manually: `diesel migration run --database-url="..."`

## Development Workflow

1. **Start Development Environment**
   ```bash
   ./scripts/start-dev.sh
   ```

2. **Work on a Project**
   ```bash
   cd atomic-oxide  # or atomic-decay
   ./scripts/setup-db.sh
   cargo run
   ```

3. **Run Tests**
   ```bash
   ./scripts/test-all.sh  # All projects
   # or
   cd atomic-oxide && ./scripts/test-with-db.sh  # Single project
   ```

4. **Stop Environment**
   ```bash
   docker-compose down
   ```