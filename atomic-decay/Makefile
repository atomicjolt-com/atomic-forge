# atomic-decay Makefile
# Full LTI Tool Application with SQLX and Vite

# Environment Variables
export DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_decay
export TEST_DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_decay_test
export PQ_LIB_DIR ?= $(shell brew --prefix libpq 2>/dev/null)/lib
export PORT ?= 3000

.PHONY: help
help: ## Show this help message
	@echo 'atomic-decay - LTI Tool Application'
	@echo ''
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ==============================================================================
# Database Management
# ==============================================================================

.PHONY: db-setup
db-setup: ## Create database and run migrations
	@echo "Creating database..."
	@sqlx database create || echo "Database might already exist"
	@$(MAKE) db-migrate

.PHONY: db-migrate
db-migrate: ## Run database migrations
	sqlx migrate run

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	@echo "Resetting database..."
	sqlx database drop -y || true
	sqlx database create
	sqlx migrate run

.PHONY: db-console
db-console: ## Open database console
	@echo "Opening database console..."
	psql $(DATABASE_URL)

.PHONY: db-seed
db-seed: ## Seed database with test data
	@echo "Seeding database not implemented yet"
	# cargo run --bin seed

.PHONY: migration-create
migration-create: ## Create new migration (usage: make migration-create NAME=migration_name)
	@if [ -z "$(NAME)" ]; then \
		echo "Error: NAME is required. Usage: make migration-create NAME=migration_name"; \
		exit 1; \
	fi
	./scripts/create-migration.sh $(NAME)

# ==============================================================================
# Testing
# ==============================================================================

.PHONY: test
test: ## Run all tests with test database
	./scripts/test-with-db.sh

.PHONY: test-unit
test-unit: ## Run unit tests only
	cargo test --lib

.PHONY: test-integration
test-integration: ## Run integration tests only
	./scripts/test-with-db.sh --test '*'

.PHONY: test-online
test-online: ## Run tests with real database (no SQLX_OFFLINE)
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test --no-fail-fast

.PHONY: test-offline
test-offline: ## Run tests with SQLX offline mode
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	export SQLX_OFFLINE=true; \
	cargo test --no-fail-fast

.PHONY: test-summary
test-summary: ## Run tests and show summary only
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test --no-fail-fast 2>&1 | grep -E "(test result:|FAILED|panicked)" | tail -20

.PHONY: test-specific
test-specific: ## Run specific test(s) by name (usage: make test-specific TEST=test_name)
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test $(TEST) -- --nocapture

.PHONY: test-watch
test-watch: ## Run tests with auto-reload
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo watch -x 'test --no-fail-fast'

# ==============================================================================
# Code Coverage
# ==============================================================================

.PHONY: coverage
coverage: ## Run tests with coverage report
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo tarpaulin --out Stdout

.PHONY: coverage-html
coverage-html: ## Generate HTML coverage report
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo tarpaulin --out Html
	@echo "Coverage report generated at target/tarpaulin/tarpaulin-report.html"

# ==============================================================================
# Code Quality
# ==============================================================================

.PHONY: lint
lint: ## Run clippy linter
	cargo clippy -- -D warnings

.PHONY: lint-fix
lint-fix: ## Run clippy linter and fix issues
	cargo clippy --fix --allow-dirty --allow-staged

.PHONY: fmt
fmt: ## Format code
	cargo fmt

.PHONY: fmt-check
fmt-check: ## Check code formatting
	cargo fmt -- --check

# ==============================================================================
# Building
# ==============================================================================

.PHONY: build
build: frontend-build ## Build debug binary and frontend
	cargo build

.PHONY: release
release: frontend-build ## Build release binary and frontend
	cargo build --release

.PHONY: clean
clean: ## Clean build artifacts
	cargo clean
	rm -rf target/tarpaulin
	rm -rf src/assets/js

# ==============================================================================
# Frontend Development
# ==============================================================================

.PHONY: frontend-install
frontend-install: ## Install frontend dependencies
	npm install

.PHONY: frontend-build
frontend-build: ## Build frontend assets
	npm run build

.PHONY: frontend-dev
frontend-dev: ## Run frontend in watch mode
	npm run dev

.PHONY: frontend-clean
frontend-clean: ## Clean frontend build artifacts
	npm run clean

.PHONY: frontend-test
frontend-test: ## Run frontend tests
	npm test

# ==============================================================================
# Development
# ==============================================================================

.PHONY: dev
dev: ## Run full development environment (Rust + Frontend)
	npm run dev:all

.PHONY: dev-rust
dev-rust: ## Run Rust development server with auto-reload
	systemfd --no-pid -s http::$(PORT) -- cargo watch -x run

.PHONY: dev-frontend
dev-frontend: ## Run frontend development server
	npm run dev:js

.PHONY: dev-setup
dev-setup: db-setup frontend-install ## Setup development environment
	@echo "Development environment ready!"

# ==============================================================================
# Documentation
# ==============================================================================

.PHONY: docs
docs: ## Generate documentation
	cargo doc --no-deps

.PHONY: docs-open
docs-open: ## Generate and open documentation
	cargo doc --no-deps --open

# ==============================================================================
# Dependencies
# ==============================================================================

.PHONY: deps-check
deps-check: ## Check for outdated dependencies
	cargo outdated
	npm outdated || true

.PHONY: deps-update
deps-update: ## Update dependencies
	cargo update
	npm update

# ==============================================================================
# Docker
# ==============================================================================

.PHONY: docker-build
docker-build: ## Build Docker image
	docker build -t atomic-decay:latest .

.PHONY: docker-run
docker-run: ## Run Docker container
	docker run -p 3000:3000 --env-file .env atomic-decay:latest

# ==============================================================================
# Utility
# ==============================================================================

.PHONY: check
check: fmt-check lint test ## Run all checks (format, lint, test)

.PHONY: pre-commit
pre-commit: fmt lint test ## Run pre-commit checks

.PHONY: sqlx-prepare
sqlx-prepare: ## Prepare SQLX offline data
	cargo sqlx prepare

.PHONY: env-check
env-check: ## Check environment variables
	@echo "DATABASE_URL: $(DATABASE_URL)"
	@echo "TEST_DATABASE_URL: $(TEST_DATABASE_URL)"
	@echo "PQ_LIB_DIR: $(PQ_LIB_DIR)"
	@echo "PORT: $(PORT)"

.DEFAULT_GOAL := help