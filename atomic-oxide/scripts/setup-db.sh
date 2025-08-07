#!/bin/bash
# Setup script for Atomic Oxide database

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

echo -e "${GREEN}🚀 Setting up Atomic Oxide database...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}📋 Creating .env file from .env.example...${NC}"
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
fi

# Start PostgreSQL container
echo -e "${YELLOW}🐘 Starting PostgreSQL container...${NC}"
cd "$ROOT_DIR"
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
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
echo -e "\n${GREEN}✅ PostgreSQL is ready!${NC}"

# Run migrations
echo -e "${YELLOW}🔄 Running Atomic Oxide migrations...${NC}"
cd "$PROJECT_DIR"
if [ -f "diesel.toml" ]; then
    diesel migration run --database-url postgres://postgres:password@localhost:5433/atomic_oxide_dev
else
    echo -e "${RED}❌ diesel.toml not found${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Atomic Oxide database setup complete!${NC}"
echo ""
echo -e "${GREEN}Database connection details:${NC}"
echo "  Development: postgres://postgres:password@localhost:5433/atomic_oxide_dev"
echo "  Test: postgres://postgres:password@localhost:5433/atomic_oxide_test"