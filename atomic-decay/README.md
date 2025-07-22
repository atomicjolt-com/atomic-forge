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

## Running Tests

```sh
cargo test -- --nocapture
```

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