#!/bin/bash
# Unified startup script for Atomic Forge development environment
# Starts Docker PostgreSQL and ensures all databases are ready

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Atomic Forge Development Environment            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check if port 5433 is already in use
if check_port 5433; then
    # Check if it's our PostgreSQL container
    if docker ps | grep -q "atomic-forge-postgres"; then
        echo -e "${GREEN}✓ PostgreSQL container is already running on port 5433${NC}"
    else
        echo -e "${RED}❌ Port 5433 is already in use by another process${NC}"
        echo -e "${YELLOW}Please stop the process using port 5433 or change the port in docker-compose.yml${NC}"
        exit 1
    fi
else
    # Start PostgreSQL container
    echo -e "${YELLOW}🐘 Starting PostgreSQL container on port 5433...${NC}"
    cd "$ROOT_DIR"
    docker-compose up -d postgres
fi

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

# Verify all databases exist
echo -e "\n${YELLOW}🔍 Verifying databases...${NC}"
DATABASES=("atomic_oxide_dev" "atomic_oxide_test" "atomic_decay_dev" "atomic_decay_test" "atomic_lti_dev" "atomic_lti_test")

for db in "${DATABASES[@]}"; do
    if docker exec atomic-forge-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db"; then
        echo -e "  ${GREEN}✓${NC} $db"
    else
        echo -e "  ${RED}✗${NC} $db - Creating..."
        docker exec atomic-forge-postgres psql -U postgres -c "CREATE DATABASE $db;"
        docker exec atomic-forge-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $db TO postgres;"
    fi
done

# Setup environment files for projects if they don't exist
echo -e "\n${YELLOW}📋 Checking environment files...${NC}"

# Atomic Oxide
if [ ! -f "$ROOT_DIR/atomic-oxide/.env" ]; then
    if [ -f "$ROOT_DIR/atomic-oxide/.env.example" ]; then
        echo -e "  Creating atomic-oxide/.env from .env.example"
        cp "$ROOT_DIR/atomic-oxide/.env.example" "$ROOT_DIR/atomic-oxide/.env"
    fi
fi

# Atomic Decay
if [ ! -f "$ROOT_DIR/atomic-decay/.env" ]; then
    if [ -f "$ROOT_DIR/atomic-decay/.env.example" ]; then
        echo -e "  Creating atomic-decay/.env from .env.example"
        cp "$ROOT_DIR/atomic-decay/.env.example" "$ROOT_DIR/atomic-decay/.env"
    fi
fi

echo -e "\n${GREEN}🎉 Development environment is ready!${NC}"
echo ""
echo -e "${BLUE}📊 Database Information:${NC}"
echo -e "  Host: localhost"
echo -e "  Port: 5433"
echo -e "  User: postgres"
echo -e "  Password: password"
echo ""
echo -e "${BLUE}🗃️  Available Databases:${NC}"
echo -e "  - atomic_oxide_dev  (Atomic Oxide development)"
echo -e "  - atomic_oxide_test (Atomic Oxide testing)"
echo -e "  - atomic_decay_dev  (Atomic Decay development)"
echo -e "  - atomic_decay_test (Atomic Decay testing)"
echo -e "  - atomic_lti_dev    (Atomic LTI development)"
echo -e "  - atomic_lti_test   (Atomic LTI testing)"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "  For Atomic Oxide:"
echo -e "    cd atomic-oxide && ./scripts/setup-db.sh"
echo -e "  For Atomic Decay:"
echo -e "    cd atomic-decay && ./scripts/setup-db.sh"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "  docker-compose ps                    # Check container status"
echo -e "  docker-compose logs -f postgres      # View PostgreSQL logs"
echo -e "  docker-compose down                  # Stop all containers"
echo -e "  docker-compose exec postgres psql -U postgres  # Access PostgreSQL"

# Optional: Run migrations for each project
read -p $'\n'"Do you want to run database migrations for all projects? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}🔄 Running migrations...${NC}"

    # Atomic Oxide
    if [ -d "$ROOT_DIR/atomic-oxide" ] && [ -f "$ROOT_DIR/atomic-oxide/diesel.toml" ]; then
        echo -e "  Running Atomic Oxide migrations..."
        cd "$ROOT_DIR/atomic-oxide"
        diesel migration run --database-url postgres://postgres:password@localhost:5433/atomic_oxide_dev || echo -e "${YELLOW}  ⚠️  Failed to run Atomic Oxide migrations${NC}"
    fi

    # Atomic Decay
    if [ -d "$ROOT_DIR/atomic-decay" ] && [ -f "$ROOT_DIR/atomic-decay/diesel.toml" ]; then
        echo -e "  Running Atomic Decay migrations..."
        cd "$ROOT_DIR/atomic-decay"
        diesel migration run --database-url postgres://postgres:password@localhost:5433/atomic_decay_dev || echo -e "${YELLOW}  ⚠️  Failed to run Atomic Decay migrations${NC}"
    fi

    echo -e "\n${GREEN}✅ Migration process complete!${NC}"
fi