# Atomic Forge

A monorepo containing LTI (Learning Tools Interoperability) tools and libraries.

## Projects

This monorepo contains six interconnected projects for building LTI 1.3 tools in Rust:

### Core Libraries

- **[atomic-lti](atomic-lti/README.md)** - Core LTI 1.3 library
  - Complete LTI 1.3 Core and LTI Advantage implementations
  - Store traits for platforms, registrations, OIDC state, keys, and JWTs
  - Framework-agnostic design (works with Actix, Axum, or any Rust framework)
  - Multi-platform support with CRUD operations

- **[atomic-lti-tool](atomic-lti-tool/README.md)** - Tool structures and dependency injection
  - Enhanced ToolJwt structure with full LTI 1.3 claim support
  - LtiDependencies trait for flexible, testable implementations
  - Nested claim structures for standards compliance
  - Framework-agnostic handlers

- **[atomic-lti-tool-axum](atomic-lti-tool-axum/README.md)** - Axum web framework integration
  - Complete LTI 1.3 handlers for Axum
  - JWT Claims extractor for protected routes
  - Deep Linking, NRPS, and Dynamic Registration support
  - Comprehensive error handling and security features

- **[atomic-lti-test](atomic-lti-test/README.md)** - Testing utilities
  - Mock implementations of all store traits
  - Pre-generated test keys
  - Test fixtures and helpers
  - Fast, isolated testing

### Applications

- **[atomic-oxide](atomic-oxide/README.md)** - Diesel ORM-based LTI tool
  - Actix Web + Diesel ORM implementation
  - Type-safe query builder patterns
  - Comprehensive database models and migrations
  - Full LTI 1.3 and registration support

- **[atomic-decay](atomic-decay/README.md)** - SQLx-based LTI tool
  - Axum + SQLx async implementation
  - Compile-time SQL verification
  - Multi-tenant architecture with JIT provisioning
  - Modern async/await patterns

Each project contains a comprehensive README.md with usage instructions. Application projects also include CLAUDE.md files with architecture and development guidance.

## Development Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Rust](https://rustup.rs/) (1.71+)
- [Diesel CLI](https://diesel.rs/guides/getting-started) (optional, for migrations)

### Quick Start

1. **Clone and setup**:

   ```bash
   git clone <repository-url>
   cd atomic-forge
   ./scripts/setup-dev.sh
   ```

2. **Start development**:

   ```bash
   # Start all services
   docker-compose up -d

   # Run a specific project
   cd atomic-oxide
   cargo run
   ```

### Database Management

The monorepo uses a single PostgreSQL 16.1 container with separate databases for each project:

- `atomic_oxide_dev` / `atomic_oxide_test`
- `atomic_decay_dev` / `atomic_decay_test`
- `atomic_lti_dev` / `atomic_lti_test`

#### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start only PostgreSQL
docker-compose up -d postgres

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This deletes all data!)
docker-compose down -v

# View logs
docker-compose logs postgres
docker-compose logs postgres -f  # Follow logs

# Restart PostgreSQL
docker-compose restart postgres

# Check service status
docker-compose ps
```

#### Database Connection

```bash
# Connect to main database
docker-compose exec postgres psql -U postgres -d atomic_forge_dev

# Connect to specific project database
docker-compose exec postgres psql -U postgres -d atomic_oxide_dev
docker-compose exec postgres psql -U postgres -d atomic_decay_dev
docker-compose exec postgres psql -U postgres -d atomic_lti_dev

# Connect to test databases
docker-compose exec postgres psql -U postgres -d atomic_oxide_test
docker-compose exec postgres psql -U postgres -d atomic_decay_test
docker-compose exec postgres psql -U postgres -d atomic_lti_test
```

#### Database Management Commands

```bash
# List all databases
docker-compose exec postgres psql -U postgres -c "\l"

# List tables in a database
docker-compose exec postgres psql -U postgres -d atomic_oxide_dev -c "\dt"

# Create a database backup
docker-compose exec postgres pg_dump -U postgres atomic_oxide_dev > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres -d atomic_oxide_dev < backup.sql

# Reset a database (⚠️ This deletes all data!)
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS atomic_oxide_dev;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE atomic_oxide_dev;"
```

#### Database Credentials

- **Host**: `localhost`
- **Port**: `5433`
- **Username**: `postgres`
- **Password**: `password`
- **Admin User**: `atomic_user` / `atomic_password`

#### Migrations

```bash
# Atomic Oxide
cd atomic-oxide
diesel migration run --database-url postgres://postgres:password@localhost:5433/atomic_oxide_dev

# Atomic Decay
cd atomic-decay
diesel migration run --database-url postgres://postgres:password@localhost:5433/atomic_decay_dev
```

### Services

When running `docker-compose up -d`:

- **PostgreSQL**: `localhost:5433`
  - Username: `postgres`
  - Password: `password`
  - Database: `atomic_forge_dev` (or project-specific)
- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@atomic-forge.com`
  - Password: `admin`

#### Connecting to pgAdmin

1. Open `http://localhost:5050` in your browser
2. Login with `admin@atomic-forge.com` / `admin`
3. Add a new server connection:
   - **Host**: `postgres` (container name)
   - **Port**: `5432` (internal container port)
   - **Username**: `postgres`
   - **Password**: `password`

### Testing

#### Automated Test Setup (Recommended)

For projects with database dependencies (atomic-oxide, atomic-decay):

```bash
# Run tests with automatic database setup
./scripts/test-with-db.sh

# Run specific test
./scripts/test-with-db.sh test_name

# Run with output
./scripts/test-with-db.sh -- --nocapture
```

#### Manual Testing

```bash
# Run all tests across workspace
cargo test --workspace

# Run tests for specific project
cd atomic-lti
cargo test

# For database projects, ensure Docker is running first
docker-compose up -d postgres
cd atomic-oxide
cargo test
```

#### Test Database Management

```bash
# Setup/reset test database
./scripts/test-db-setup.sh

# Quick reset (truncate tables)
./scripts/test-db-reset.sh
```

See individual project READMEs for detailed test documentation.

### Environment Configuration

Each project has its own `.env` file. Copy from `.env.example`:

```bash
cp .env.example .env
cp atomic-oxide/.env.example atomic-oxide/.env
cp atomic-decay/.env.example atomic-decay/.env
```

## Quick Links

### Project Documentation
- **[atomic-lti](atomic-lti/README.md)** - Core library documentation
- **[atomic-lti-tool](atomic-lti-tool/README.md)** - Tool structures and patterns
- **[atomic-lti-tool-axum](atomic-lti-tool-axum/README.md)** - Axum integration guide
- **[atomic-lti-test](atomic-lti-test/README.md)** - Testing utilities guide
- **[atomic-oxide](atomic-oxide/README.md)** - Diesel application guide
- **[atomic-decay](atomic-decay/README.md)** - SQLx application guide

### Architecture Documentation
- **[atomic-oxide CLAUDE.md](atomic-oxide/CLAUDE.md)** - Diesel ORM architecture
- **[atomic-decay CLAUDE.md](atomic-decay/CLAUDE.md)** - SQLx async architecture

### LTI Implementation Guides
- **[LTI Improvements Plan](docs/lti-improvements/README.md)** - Comprehensive plan for LTI feature improvements
- **[Quick Start Guide](docs/lti-improvements/quick-start.md)** - Getting started with LTI tools
- **[Migration Guide](docs/lti-improvements/migration-guide.md)** - Upgrading from previous versions
- **[Documentation Index](docs/README.md)** - Complete documentation index

## Architecture

```
atomic-forge/
├── atomic-lti/              # Core LTI library
├── atomic-lti-tool/         # Actix Web LTI tool library
├── atomic-lti-tool-axum/    # Axum LTI tool library
├── atomic-lti-test/         # Testing utilities
├── atomic-oxide/            # Diesel ORM LTI application
├── atomic-decay/            # SQLx LTI application
├── docs/                    # Documentation and guides
├── docker-compose.yml       # Development services
└── scripts/                 # Development scripts
```

## Troubleshooting

### Docker Issues

**Port already in use (5433)**:

```bash
# Check what's using the port
lsof -i :5433

# Stop conflicting services
docker-compose down

# Or change the port in docker-compose.yml
```

**PostgreSQL container won't start**:

```bash
# Check logs
docker-compose logs postgres

# Remove and recreate
docker-compose down
docker-compose up -d postgres
```

**Permission denied errors**:

```bash
# Reset Docker permissions
docker-compose down -v
docker-compose up -d postgres
```

### Database Connection Issues

**Connection refused**:

```bash
# Make sure PostgreSQL is running
docker-compose ps

# Check if container is healthy
docker-compose exec postgres pg_isready -U postgres

# Restart if needed
docker-compose restart postgres
```

**Database doesn't exist**:

```bash
# Check available databases
docker-compose exec postgres psql -U postgres -c "\l"

# Create missing database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE atomic_oxide_dev;"
```

### Build Issues

**pq-sys compilation errors**:

```bash
# Make sure PostgreSQL is running
docker-compose up -d postgres

# Clean and rebuild
cargo clean
cargo build
```

**Migration errors**:

```bash
# Reset migrations
diesel migration redo --database-url postgres://postgres:password@localhost:5433/atomic_oxide_dev

# Or reset database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS atomic_oxide_dev;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE atomic_oxide_dev;"
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `cargo test --workspace`
4. Submit a pull request

## Quick Reference

### Daily Development Commands

```bash
# Start development environment
docker-compose up -d

# Run atomic-oxide
cd atomic-oxide
cargo run

# Run atomic-decay
cd atomic-decay
cargo run

# Run tests
cargo test --workspace

# View PostgreSQL logs
docker-compose logs postgres -f

# Connect to database
docker-compose exec postgres psql -U postgres -d atomic_oxide_dev

# Stop everything
docker-compose down
```

### Database URLs

- **Atomic Oxide Dev**: `postgres://postgres:password@localhost:5433/atomic_oxide_dev`
- **Atomic Oxide Test**: `postgres://postgres:password@localhost:5433/atomic_oxide_test`
- **Atomic Decay Dev**: `postgres://postgres:password@localhost:5433/atomic_decay_dev`
- **Atomic Decay Test**: `postgres://postgres:password@localhost:5433/atomic_decay_test`
- **Atomic LTI Dev**: `postgres://postgres:password@localhost:5433/atomic_lti_dev`
- **Atomic LTI Test**: `postgres://postgres:password@localhost:5433/atomic_lti_test`

### Key Files

- `docker-compose.yml` - Docker services configuration (modern format, no version needed)
- `scripts/setup-dev.sh` - Development environment setup
- `atomic-oxide/.env` - Atomic Oxide configuration
- `atomic-decay/.env` - Atomic Decay configuration
- `docker/postgres/init/01-init-databases.sql` - Database initialization

## License
