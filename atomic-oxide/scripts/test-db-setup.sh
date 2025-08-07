#!/bin/bash
# Setup script for Atomic Oxide test database

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$PROJECT_DIR")"

echo -e "${GREEN}Setting up Atomic Oxide test database...${NC}"

# Navigate to the project directory
cd "$PROJECT_DIR"

# Export test database URL
export TEST_DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_oxide_test"

# Start Docker containers if not running
echo -e "${YELLOW}Starting Docker containers...${NC}"
cd "$ROOT_DIR"
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
max_attempts=30
attempt=0
while ! docker exec atomic-forge-postgres pg_isready -U postgres > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo -e "${RED}PostgreSQL failed to start after $max_attempts attempts${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}PostgreSQL is ready!${NC}"

# Drop and recreate test database
echo -e "${YELLOW}Recreating test database...${NC}"
docker exec atomic-forge-postgres psql -U postgres -c "DROP DATABASE IF EXISTS atomic_oxide_test;" || true
docker exec atomic-forge-postgres psql -U postgres -c "CREATE DATABASE atomic_oxide_test;"
docker exec atomic-forge-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE atomic_oxide_test TO postgres;"

# Run migrations
cd "$PROJECT_DIR"
echo -e "${YELLOW}Running migrations...${NC}"
diesel migration run --database-url "$TEST_DATABASE_URL"

echo -e "${GREEN}Test database setup complete!${NC}"
echo -e "${GREEN}You can now run tests with: cargo test${NC}"