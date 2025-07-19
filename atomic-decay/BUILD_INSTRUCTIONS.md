# Build Instructions for atomic-decay

## macOS Build Fix

This project requires PostgreSQL libraries to compile. On macOS, you may encounter compilation errors with pq-sys.

### Prerequisites

1. Install PostgreSQL libraries:
   ```bash
   brew install libpq
   ```

2. Install Rust (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### Building the Project

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

### Troubleshooting

#### pq-sys compilation errors

If you encounter errors like:
```
error occurred in cc-rs: Command env -u IPHONEOS_DEPLOYMENT_TARGET...
```

This is due to the bundled PostgreSQL feature trying to compile C code. The fix is to:
1. Remove the `bundled` feature from pq-sys in Cargo.toml
2. Set the PQ_LIB_DIR environment variable
3. Clean and rebuild

#### Package name mismatch

If you see errors about package name mismatches, ensure that the package name in Cargo.toml matches the directory name.

### Recent Changes

1. Removed `bundled` feature from pq-sys dependency
2. Updated pq-sys from 0.6 to 0.7
3. Updated axum from 0.7 to 0.8
4. Fixed package name from "atomic-oxide" to "atomic-decay"
5. Updated various other dependencies to their latest versions

### Running the Application

After successful compilation:

```bash
# Run the application
cargo run

# Or with auto-reload during development
systemfd --no-pid -s http::$PORT -- cargo watch -x run
```

Make sure PostgreSQL is running and accessible at the URL specified in your `.env` file.