#!/bin/bash
# Run tests serially to avoid test isolation issues

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}=== Atomic Decay Serial Test Runner ===${NC}"
echo -e "${YELLOW}Running tests with single thread to avoid isolation issues...${NC}"

# Setup test database
"$SCRIPT_DIR/test-db-setup.sh"

# Export test database URL
export TEST_DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_test"
export DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_test"

# Force serial execution
export RUST_TEST_THREADS=1

# Run tests serially
cd "$PROJECT_DIR"
if cargo test -- --test-threads=1; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    echo -e "${YELLOW}Note: If tests are still failing, there may be issues with test data isolation.${NC}"
    echo -e "${YELLOW}Try running individual tests with: cargo test <test_name> -- --exact${NC}"
    exit 1
fi