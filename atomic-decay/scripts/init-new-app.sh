#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if app name is provided
if [ -z "${1:-}" ]; then
    print_error "App name is required"
    echo "Usage: $0 <app-name>"
    echo "Example: $0 my-lti-app"
    exit 1
fi

APP_NAME="$1"
APP_NAME_SNAKE=$(echo "$APP_NAME" | tr '-' '_')
APP_NAME_KEBAB="$APP_NAME"

print_header "Initializing new LTI application: $APP_NAME"

# Validate app name (only alphanumeric and hyphens)
if ! [[ "$APP_NAME" =~ ^[a-z0-9-]+$ ]]; then
    print_error "App name must contain only lowercase letters, numbers, and hyphens"
    exit 1
fi

# Check if we're in the atomic-decay directory
if [ ! -f "Cargo.toml" ] || ! grep -q "atomic-decay" Cargo.toml; then
    print_error "This script must be run from the atomic-decay directory"
    exit 1
fi

# Confirm with user
print_warning "This will rename atomic-decay to $APP_NAME throughout the codebase"
echo "Files that will be modified:"
echo "  - Cargo.toml"
echo "  - .env (if exists) and .env.example"
echo "  - Makefile"
echo "  - README.md"
echo "  - All source files with references to atomic_decay/atomic-decay"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Operation cancelled"
    exit 0
fi

print_header "Step 1: Backing up current configuration"
if [ -f ".env" ]; then
    cp .env .env.backup
    print_success "Backed up .env to .env.backup"
fi

print_header "Step 2: Updating Cargo.toml"
# Update package name
sed -i.bak "s/^name = \"atomic-decay\"/name = \"$APP_NAME_KEBAB\"/" Cargo.toml
# Update binary name
sed -i.bak "s/^name = \"atomic-decay\"/name = \"$APP_NAME_KEBAB\"/" Cargo.toml
# Update description
sed -i.bak 's/^description = "Example LTI Tool using Axum and Atomic LTI"/description = "LTI 1.3 Tool built with Axum and Atomic LTI"/' Cargo.toml
# Update lib name
sed -i.bak "s/^name = \"atomic_decay\"/name = \"$APP_NAME_SNAKE\"/" Cargo.toml
# Remove backup
rm Cargo.toml.bak
print_success "Updated Cargo.toml"

print_header "Step 3: Updating database names in Makefile"
# Update database names in Makefile
sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" Makefile
sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" Makefile
rm Makefile.bak
print_success "Updated Makefile"

print_header "Step 4: Updating .env.example"
sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" .env.example
sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" .env.example
rm .env.example.bak
print_success "Updated .env.example"

print_header "Step 5: Creating new .env file with generated secrets"
# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
JWK_PASSPHRASE=$(openssl rand -base64 24)

# Copy from example and update with real secrets
cp .env.example .env
sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
rm .env.bak
print_success "Created .env with generated secrets"

print_header "Step 6: Updating config/secrets.json"
if [ ! -f "config/secrets.json" ]; then
    mkdir -p config
    cat > config/secrets.json <<EOF
{
  "jwk_passphrase": "$JWK_PASSPHRASE"
}
EOF
    print_success "Created config/secrets.json with generated passphrase"
else
    print_warning "config/secrets.json already exists, skipping"
fi

print_header "Step 7: Updating source code references"
# Update lib name in source files
find src -type f -name "*.rs" -exec sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" {} \;
find src -type f -name "*.rs.bak" -delete
print_success "Updated source code references"

print_header "Step 8: Updating README.md"
sed -i.bak "s/Atomic Decay/${APP_NAME}/g" README.md
sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" README.md
sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" README.md
rm README.md.bak
print_success "Updated README.md"

print_header "Step 9: Updating package.json"
if [ -f "package.json" ]; then
    sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" package.json
    rm package.json.bak
    print_success "Updated package.json"
fi

print_header "Step 10: Cleaning up build artifacts"
cargo clean 2>/dev/null || true
rm -rf target 2>/dev/null || true
rm -rf .sqlx 2>/dev/null || true
print_success "Cleaned build artifacts"

print_header "✅ Initialization Complete!"
echo ""
print_success "Your new LTI application '$APP_NAME' is ready!"
echo ""
echo "Next steps:"
echo "  1. Review and customize .env (database: ${APP_NAME_SNAKE}_dev)"
echo "  2. Update Cargo.toml with your author info and repository"
echo "  3. Update README.md with your app-specific documentation"
echo "  4. Run: make setup    # Set up development environment"
echo "  5. Run: make dev      # Start development server"
echo ""
print_warning "Your original .env has been backed up to .env.backup"
echo ""
print_success "Generated secrets saved in:"
echo "  - .env (JWT_SECRET, SESSION_SECRET)"
echo "  - config/secrets.json (jwk_passphrase)"
