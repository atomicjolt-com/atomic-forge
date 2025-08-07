#!/bin/bash
# Reset script for Atomic Decay test database between test runs

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Resetting Atomic Decay test database...${NC}"

# Export test database URL
export TEST_DATABASE_URL="postgres://postgres:password@localhost:5433/atomic_decay_test"

# Truncate all tables (faster than drop/recreate)
echo -e "${YELLOW}Truncating all tables...${NC}"
docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "
DO \$\$ 
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers
    SET session_replication_role = 'replica';
    
    -- Truncate all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
END \$\$;
"

echo -e "${GREEN}Test database reset complete!${NC}"