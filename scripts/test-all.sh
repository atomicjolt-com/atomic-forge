#!/bin/bash
# Run tests for all projects in the Atomic Forge monorepo

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
echo -e "${BLUE}║              Atomic Forge Test Runner                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track overall test status
OVERALL_STATUS=0

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Ensure databases are ready
echo -e "${YELLOW}🚀 Starting development environment...${NC}"
"$SCRIPT_DIR/start-dev.sh"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Run Atomic Oxide tests
if [ -d "$ROOT_DIR/atomic-oxide" ] && [ -f "$ROOT_DIR/atomic-oxide/Cargo.toml" ]; then
    echo -e "\n${BLUE}🧪 Running Atomic Oxide tests...${NC}"
    if "$ROOT_DIR/atomic-oxide/scripts/test-with-db.sh"; then
        echo -e "${GREEN}✓ Atomic Oxide tests passed${NC}"
    else
        echo -e "${RED}✗ Atomic Oxide tests failed${NC}"
        OVERALL_STATUS=1
    fi
else
    echo -e "\n${YELLOW}⚠️  Atomic Oxide project not found or not configured${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Run Atomic Decay tests
if [ -d "$ROOT_DIR/atomic-decay" ] && [ -f "$ROOT_DIR/atomic-decay/Cargo.toml" ]; then
    echo -e "\n${BLUE}🧪 Running Atomic Decay tests...${NC}"
    if "$ROOT_DIR/atomic-decay/scripts/test-with-db.sh"; then
        echo -e "${GREEN}✓ Atomic Decay tests passed${NC}"
    else
        echo -e "${RED}✗ Atomic Decay tests failed${NC}"
        OVERALL_STATUS=1
    fi
else
    echo -e "\n${YELLOW}⚠️  Atomic Decay project not found or not configured${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Summary
echo ""
if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed. Please check the output above.${NC}"
fi

exit $OVERALL_STATUS