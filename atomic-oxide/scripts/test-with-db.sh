#!/bin/bash
# Run tests with automatic database setup and cleanup for Atomic Oxide

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default to running all tests
TEST_ARGS="${@:-}"

echo -e "${GREEN}=== Atomic Oxide Test Runner ===${NC}"

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Setup test database
echo -e "\n${YELLOW}Setting up test database...${NC}"
"$SCRIPT_DIR/test-db-setup.sh"

# Function to cleanup on exit
cleanup() {
    local exit_code=$?
    echo -e "\n${YELLOW}Cleaning up...${NC}"

    # Optionally stop containers (commented out to keep them running for faster subsequent runs)
    # docker-compose -f "$ROOT_DIR/docker-compose.yml" down

    exit $exit_code
}

# Register cleanup function
trap cleanup EXIT INT TERM

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"
cd "$PROJECT_DIR"

# Export test database URL
export TEST_DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_oxide_test"

# Run cargo test with any provided arguments
if cargo test $TEST_ARGS; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi