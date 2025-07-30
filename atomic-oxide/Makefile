# atomic-oxide Makefile
# Full LTI Tool Application with Diesel and ESBuild

# Environment Variables
export DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_oxide
export TEST_DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_oxide_test
export PQ_LIB_DIR ?= $(shell brew --prefix libpq 2>/dev/null)/lib
export PORT ?= 3001

.PHONY: help
help: ## Show this help message
	@echo 'atomic-oxide - LTI Tool Application (Actix-web + Diesel)'
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
	@diesel setup || echo "Database might already exist"
	@$(MAKE) db-migrate

.PHONY: db-migrate
db-migrate: ## Run database migrations
	diesel migration run

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	@echo "Resetting database..."
	diesel database reset

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
	diesel migration generate $(NAME)

.PHONY: migration-revert
migration-revert: ## Revert last migration
	diesel migration revert

.PHONY: migration-redo
migration-redo: ## Redo last migration
	diesel migration redo

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
frontend-dev: ## Build frontend in development mode
	npm run dev:build

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
dev: ## Run development server with auto-reload
	@$(MAKE) frontend-build
	systemfd --no-pid -s http::$(PORT) -- cargo watch -x run

.PHONY: dev-rust
dev-rust: ## Run Rust development server
	cargo run

.PHONY: dev-frontend
dev-frontend: ## Build frontend and watch for changes
	npm run dev:build

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
	docker build -t atomic-oxide:latest .

.PHONY: docker-run
docker-run: ## Run Docker container
	docker run -p 3001:3001 --env-file .env atomic-oxide:latest

# ==============================================================================
# Utility
# ==============================================================================

.PHONY: check
check: fmt-check lint test ## Run all checks (format, lint, test)

.PHONY: pre-commit
pre-commit: fmt lint test ## Run pre-commit checks

.PHONY: schema-print
schema-print: ## Print database schema
	diesel print-schema

.PHONY: env-check
env-check: ## Check environment variables
	@echo "DATABASE_URL: $(DATABASE_URL)"
	@echo "TEST_DATABASE_URL: $(TEST_DATABASE_URL)"
	@echo "PQ_LIB_DIR: $(PQ_LIB_DIR)"
	@echo "PORT: $(PORT)"

.DEFAULT_GOAL := help