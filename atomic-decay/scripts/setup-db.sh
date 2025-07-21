#!/bin/bash
# Setup script for Atomic Decay database

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

echo -e "${GREEN}🚀 Setting up Atomic Decay database...${NC}"

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
echo -e "${YELLOW}🔄 Setting up database...${NC}"
cd "$PROJECT_DIR"

# Check if sqlx-cli is installed
if ! command -v sqlx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing sqlx-cli...${NC}"
    cargo install sqlx-cli --no-default-features --features postgres
fi

# Create databases if they don't exist
echo -e "${YELLOW}🗄️  Creating databases...${NC}"
docker exec atomic-forge-postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'atomic_decay_dev'" | grep -q 1 || \
    docker exec atomic-forge-postgres psql -U postgres -c "CREATE DATABASE atomic_decay_dev"
docker exec atomic-forge-postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'atomic_decay_test'" | grep -q 1 || \
    docker exec atomic-forge-postgres psql -U postgres -c "CREATE DATABASE atomic_decay_test"

# Run migrations for development database
echo -e "${YELLOW}🔧 Running migrations for development database...${NC}"
DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_dev" sqlx migrate run

# Run migrations for test database
echo -e "${YELLOW}🧪 Running migrations for test database...${NC}"
DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_test" sqlx migrate run

echo -e "${GREEN}✅ Database migrations completed!${NC}"

echo -e "${GREEN}🎉 Atomic Decay database setup complete!${NC}"
echo ""
echo -e "${GREEN}Database connection details:${NC}"
echo "  Development: postgres://postgres:password@localhost:5433/atomic_decay_dev"
echo "  Test: postgres://postgres:password@localhost:5433/atomic_decay_test"