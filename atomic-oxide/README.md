# atomic-oxide

LTI Tool implementation written in Rust

## Usage

Install Rust

### DB Setup

#### Using Docker (Recommended)

The project uses Docker for database management. To set up:

```sh
# Start the database containers
docker-compose up -d postgres

# Run migrations for development database
diesel migration run

# For test database setup, see Testing section below
```

#### Manual Setup

If not using Docker, install PostgreSQL 16 and:

```sh
# Create databases
createdb atomic_oxide_dev
createdb atomic_oxide_test

# Run migrations
diesel setup
diesel migration run
```

### If there are problems building

Fix: https://github.com/sgrif/pq-sys/issues/34
If you get this error: `note: ld: library not found for -lpq`

1. Fix:
   `brew install libpq`
   take note on the path of the installed lib
2. Set the environment variable for PQ_LIB_DIR
   `export PQ_LIB_DIR="$(brew --prefix libpq)/lib"`
3. Try cargo build

### Testing

#### Quick Start - Run Tests with Docker

```sh
# Run all tests with automatic database setup
../scripts/test-with-db.sh

# Run specific tests
../scripts/test-with-db.sh test_name

# Run with test output visible
../scripts/test-with-db.sh -- --nocapture
```

#### Manual Test Database Setup

```sh
# Setup test database
../scripts/test-db-setup.sh

# Run tests
cargo test

# Reset database between test runs if needed
../scripts/test-db-reset.sh
```

#### Test Database Documentation

See [docs/TEST_DATABASE_SETUP.md](docs/TEST_DATABASE_SETUP.md) for detailed information about:
- Docker-based test database configuration
- Writing tests with database access
- Troubleshooting test database issues
- CI/CD integration

### Running Server

```sh
cargo run
```

### Running Server with watch

Install required crates

```sh
cargo install systemfd cargo-watch
```

Run the server

```sh
systemfd --no-pid -s http::$PORT -- cargo watch -x run
```

## Using Atomic Oxide

A succcessful LTI launch will call "launch" in atomic-oxide/src/handlers/lti.rs which in turn will load app.ts

### Configuration

Atomic Oxide uses dynamic registration for installation into the LMS. A basic configuration including dynamic registration is already configured. To modify the tool configuration update the code in atomic-oxide/src/stores/db_dynamic_registration.rs. This file contains an implementation of the traits from DBDynamicRegistrationStore for PostGres. You may also modify this file to work with other data stores.

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

If you are using Cloudflare tunnels Atomic Oxide will be available at atomic-oxide.atomicjolt.win

Steps to setting up Cloudflare Tunnels:
Create the tunnel:
cloudflared tunnel create atomic-oxide

You have to create the DNS manually:
cloudflared tunnel route dns atomic-oxide atomic-oxide.atomicjolt.win

If atomic-oxide.atomicjolt.win is taken just setup a different DNS entry. For example, ao.atomicjolt.win
Be sure to change tunnels.yaml to use the DNS you choose.

Run a tunnel. Note that tunnels.yaml needs to contain the ingress rules
cloudflared tunnel --config ./.vscode/tunnels.yaml run atomic-oxide

## Developing

Atomic Oxide is built using the atomic-lti crate which relies on the implementation of traits to talk to a
data store. Atomic Oxide provides implementations of stores that rely on PostGres that can be found in the
atomic-oxide/src/stores directory.

The traits can be found in atomic-lti/src/stores. Using a different data store requires the implementation of new code that implements these traits.
