#!/bin/bash

# Set the PostgreSQL library path for macOS
export PQ_LIB_DIR="/usr/local/opt/libpq/lib"

echo "Building atomic-decay with PostgreSQL library path: $PQ_LIB_DIR"
echo ""

# Clean previous build artifacts
cargo clean

# Build the project
cargo build

echo ""
echo "Build complete! To run the project use: cargo run"
echo "Make sure you have PostgreSQL running and configured in your .env file"