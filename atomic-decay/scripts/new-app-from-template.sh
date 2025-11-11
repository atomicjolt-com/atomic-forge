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

# Check arguments
if [ "$#" -lt 2 ]; then
    print_error "Missing required arguments"
    echo "Usage: $0 <app-name> <target-directory>"
    echo "Example: $0 my-lti-app ../my-lti-app"
    echo "Example: $0 canvas-tool ~/projects/canvas-tool"
    exit 1
fi

APP_NAME="$1"
TARGET_DIR="$2"
APP_NAME_SNAKE=$(echo "$APP_NAME" | tr '-' '_')
APP_NAME_KEBAB="$APP_NAME"

print_header "Creating new LTI application: $APP_NAME"
echo "Target directory: $TARGET_DIR"
echo ""

# Validate app name (only alphanumeric and hyphens)
if ! [[ "$APP_NAME" =~ ^[a-z0-9-]+$ ]]; then
    print_error "App name must contain only lowercase letters, numbers, and hyphens"
    exit 1
fi

# Check if we're in the atomic-decay directory
if [ ! -f "Cargo.toml" ] || ! grep -q "atomic-decay" Cargo.toml 2>/dev/null; then
    print_error "This script must be run from the atomic-decay directory"
    exit 1
fi

# Check if target directory already exists
if [ -d "$TARGET_DIR" ]; then
    print_error "Target directory already exists: $TARGET_DIR"
    read -p "Delete and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$TARGET_DIR"
        print_success "Removed existing directory"
    else
        print_warning "Operation cancelled"
        exit 0
    fi
fi

print_header "Step 1: Creating target directory"
mkdir -p "$TARGET_DIR"
print_success "Created $TARGET_DIR"

print_header "Step 2: Copying template files"
# Copy all files except build artifacts, git, and dependencies
cp -r . "$TARGET_DIR/"

# Remove unwanted files/directories from the copy
rm -rf "$TARGET_DIR/.git" \
       "$TARGET_DIR/target" \
       "$TARGET_DIR/node_modules" \
       "$TARGET_DIR/.sqlx" \
       "$TARGET_DIR/.env" \
       "$TARGET_DIR/.env.backup" \
       "$TARGET_DIR/config/secrets.json" \
       "$TARGET_DIR/dist" 2>/dev/null || true
find "$TARGET_DIR" -name "*.profraw" -delete 2>/dev/null || true
find "$TARGET_DIR" -name "*.log" -delete 2>/dev/null || true

print_success "Copied template files to $TARGET_DIR"

# Change to target directory for all remaining operations
cd "$TARGET_DIR"

print_header "Step 3: Updating Cargo.toml"
# Update package name
sed -i.bak "s/^name = \"atomic-decay\"/name = \"$APP_NAME_KEBAB\"/" Cargo.toml
# Update description
sed -i.bak 's/^description = "Example LTI Tool using Axum and Atomic LTI"/description = "LTI 1.3 Tool built with Axum and Atomic LTI"/' Cargo.toml
# Update lib name
sed -i.bak "s/^name = \"atomic_decay\"/name = \"$APP_NAME_SNAKE\"/" Cargo.toml
# Remove backup
rm -f Cargo.toml.bak
print_success "Updated Cargo.toml"

print_header "Step 4: Updating database names in Makefile"
sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" Makefile
sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" Makefile
rm -f Makefile.bak
print_success "Updated Makefile"

print_header "Step 5: Updating .env.example"
sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" .env.example
sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" .env.example
rm -f .env.example.bak
print_success "Updated .env.example"

print_header "Step 6: Creating new .env file with generated secrets"
# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
JWK_PASSPHRASE=$(openssl rand -base64 24)

# Copy from example and update with real secrets
cp .env.example .env
sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
rm -f .env.bak
print_success "Created .env with generated secrets"

print_header "Step 7: Creating config/secrets.json"
mkdir -p config
cat > config/secrets.json <<EOF
{
  "jwk_passphrase": "$JWK_PASSPHRASE",
  "allowed_origins": [
    "http://localhost:3000",
    "http://localhost:5173"
  ]
}
EOF
print_success "Created config/secrets.json with generated passphrase"

print_header "Step 8: Updating source code references"
# Update lib name in source files
find src -type f -name "*.rs" -exec sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" {} \; 2>/dev/null || true
find src -type f -name "*.rs.bak" -delete 2>/dev/null || true
print_success "Updated source code references"

print_header "Step 9: Updating README.md"
sed -i.bak "s/Atomic Decay/${APP_NAME}/g" README.md
sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" README.md
sed -i.bak "s/atomic_decay/${APP_NAME_SNAKE}/g" README.md
# Remove the "Using as a Starter Template" section since this is now a new app
sed -i.bak '/## Using as a Starter Template/,/## Features/{ /## Features/!d; }' README.md
rm -f README.md.bak
print_success "Updated README.md"

print_header "Step 10: Updating package.json"
if [ -f "package.json" ]; then
    sed -i.bak "s/atomic-decay/${APP_NAME_KEBAB}/g" package.json
    rm -f package.json.bak
    print_success "Updated package.json"
fi

print_header "Step 11: Initializing git repository"
git init
git add .
git commit --no-gpg-sign -m "Initial commit: Created $APP_NAME from Atomic Decay template" --quiet 2>/dev/null || \
  git commit -m "Initial commit: Created $APP_NAME from Atomic Decay template" --quiet
print_success "Initialized git repository with initial commit"

print_header "Step 12: Cleaning up template-specific files"
# Remove the template initialization scripts since they're not needed in the new app
rm -f scripts/init-new-app.sh
rm -f scripts/new-app-from-template.sh
print_success "Removed template-specific files"

print_header "✅ Success! Your new LTI application is ready!"
echo ""
print_success "Created: $APP_NAME at $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. Review .env and customize if needed"
echo "  3. Update Cargo.toml with your author info and repository URL"
echo "  4. Update README.md with your app-specific documentation"
echo "  5. Run: make setup    # Set up development environment"
echo "  6. Run: make dev      # Start development server"
echo ""
echo "Configuration:"
echo "  📁 Database: ${APP_NAME_SNAKE}_dev"
echo "  🔐 Secrets: Generated and saved in .env and config/secrets.json"
echo "  📝 Git: Initialized with initial commit"
echo ""
print_warning "Remember to update .env with your LTI configuration before deploying!"
