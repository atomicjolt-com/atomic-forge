#!/bin/bash
# Simple test runner for atomic-decay

# Export database URLs
export DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_test"
export TEST_DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_test"

# Run the test(s) passed as arguments
cargo test "$@"