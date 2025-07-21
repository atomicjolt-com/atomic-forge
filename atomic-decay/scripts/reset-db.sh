#!/bin/bash
# Reset Atomic Decay database (drop and recreate)

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

echo -e "${YELLOW}⚠️  This will delete all data in the Atomic Decay databases!${NC}"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
fi

echo -e "${YELLOW}🗑️  Resetting Atomic Decay databases...${NC}"

# Ensure PostgreSQL is running
if ! docker exec atomic-forge-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${YELLOW}🐘 Starting PostgreSQL container...${NC}"
    cd "$ROOT_DIR"
    docker-compose up -d postgres
    sleep 5
fi

# Drop and recreate databases
echo -e "${YELLOW}🔧 Dropping and recreating databases...${NC}"
docker exec atomic-forge-postgres psql -U postgres -c "DROP DATABASE IF EXISTS atomic_decay_dev"
docker exec atomic-forge-postgres psql -U postgres -c "DROP DATABASE IF EXISTS atomic_decay_test"
docker exec atomic-forge-postgres psql -U postgres -c "CREATE DATABASE atomic_decay_dev"
docker exec atomic-forge-postgres psql -U postgres -c "CREATE DATABASE atomic_decay_test"

# Run migrations
echo -e "${YELLOW}🔄 Running migrations...${NC}"
cd "$PROJECT_DIR"
DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_dev" sqlx migrate run
DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_test" sqlx migrate run

echo -e "${GREEN}✅ Database reset complete!${NC}"