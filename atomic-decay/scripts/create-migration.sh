#!/bin/bash
# Create a new SQLx migration for Atomic Decay

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if migration name was provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Please provide a migration name${NC}"
    echo "Usage: $0 <migration-name>"
    echo "Example: $0 add_user_table"
    exit 1
fi

MIGRATION_NAME="$1"

# Check if sqlx-cli is installed
if ! command -v sqlx &> /dev/null; then
    echo -e "${RED}❌ sqlx-cli is not installed${NC}"
    echo -e "${YELLOW}Run: cargo install sqlx-cli --no-default-features --features postgres${NC}"
    exit 1
fi

# Create migration
echo -e "${YELLOW}📝 Creating migration: ${MIGRATION_NAME}...${NC}"
cd "$PROJECT_DIR"
DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_dev" sqlx migrate add "$MIGRATION_NAME"

echo -e "${GREEN}✅ Migration created successfully!${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Edit the migration files in migrations/<timestamp>_${MIGRATION_NAME}/"
echo "2. Run: ./scripts/setup-db.sh to apply migrations"