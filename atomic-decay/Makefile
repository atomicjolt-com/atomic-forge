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
	sqlx database drop -y -f || true
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

.PHONY: db-tables
db-tables: ## List all tables in the database
	@PGPASSWORD=postgres psql -h localhost -U postgres -d atomic_decay -c "\dt" 2>/dev/null || echo "Failed to connect to database"

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

.PHONY: test-serial
test-serial: ## Run tests serially to avoid isolation issues
	./scripts/test-serial.sh

.PHONY: test-parallel
test-parallel: ## Run tests in parallel (default behavior)
	@echo "Running tests in parallel mode..."
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test

.PHONY: test-unit
test-unit: ## Run unit tests only
	cargo test --lib

.PHONY: test-integration
test-integration: ## Run integration tests only
	./scripts/test-with-db.sh --test '*'

.PHONY: test-db-setup
test-db-setup: ## Setup test database
	./scripts/test-db-setup.sh

.PHONY: test-db-reset
test-db-reset: ## Reset test database (drop and recreate)
	@echo "Resetting test database..."
	@docker exec atomic-forge-postgres psql -U postgres -c "DROP DATABASE IF EXISTS atomic_decay_test;" || true
	@docker exec atomic-forge-postgres psql -U postgres -c "CREATE DATABASE atomic_decay_test;"
	@docker exec atomic-forge-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE atomic_decay_test TO postgres;"
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	sqlx migrate run

.PHONY: test-db-clean
test-db-clean: ## Clean all data from test database tables
	@echo "Cleaning test database tables..."
	@docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "TRUNCATE lti_registrations, lti_platforms, keys, oidc_states CASCADE;" || true

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

.PHONY: test-isolated
test-isolated: ## Run specific test in complete isolation (usage: make test-isolated TEST=test_name)
	@$(MAKE) test-db-clean
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	export RUST_TEST_THREADS=1; \
	cargo test $(TEST) -- --exact --nocapture

.PHONY: test-watch
test-watch: ## Run tests with auto-reload
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo watch -x 'test --no-fail-fast'

.PHONY: test-failed
test-failed: ## Re-run only the tests that failed in the last run
	@echo "Re-running failed tests serially..."
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	export RUST_TEST_THREADS=1; \
	cargo test test_find_by_id_exists test_list_keys test_list_keys_with_limit test_ensure_keys test_get_current_keys test_get_current_keys_with_limit -- --test-threads=1

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

.PHONY: compile-check
compile-check: ## Check compilation without building
	cargo check

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

.PHONY: docker-postgres-start
docker-postgres-start: ## Start PostgreSQL container
	@cd .. && docker-compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@while ! docker exec atomic-forge-postgres pg_isready -U postgres > /dev/null 2>&1; do \
		echo -n "."; \
		sleep 1; \
	done
	@echo "\nPostgreSQL is ready!"

.PHONY: docker-postgres-stop
docker-postgres-stop: ## Stop PostgreSQL container
	@cd .. && docker-compose stop postgres

.PHONY: docker-postgres-restart
docker-postgres-restart: ## Restart PostgreSQL container
	@$(MAKE) docker-postgres-stop
	@$(MAKE) docker-postgres-start

.PHONY: docker-postgres-logs
docker-postgres-logs: ## Show PostgreSQL container logs
	docker logs atomic-forge-postgres --tail 50 -f

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

.PHONY: test-diagnose
test-diagnose: ## Diagnose test database state
	@echo "=== Test Database Diagnostics ==="
	@echo "Checking database connection..."
	@docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "SELECT version();" || echo "❌ Failed to connect to test database"
	@echo "\nChecking table row counts:"
	@docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "SELECT 'keys' as table_name, COUNT(*) as row_count FROM keys UNION SELECT 'oidc_states', COUNT(*) FROM oidc_states UNION SELECT 'lti_platforms', COUNT(*) FROM lti_platforms UNION SELECT 'lti_registrations', COUNT(*) FROM lti_registrations;" || true
	@echo "\nChecking for stale test data:"
	@docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "SELECT id, LEFT(uuid, 10) as uuid_prefix, created_at FROM keys ORDER BY created_at DESC LIMIT 5;" || true

.PHONY: test-fix
test-fix: ## Fix common test issues
	@echo "Fixing common test issues..."
	@$(MAKE) docker-postgres-restart
	@$(MAKE) test-db-reset
	@$(MAKE) test-db-clean
	@echo "✅ Test environment reset. Try running tests again with: make test-serial"

.DEFAULT_GOAL := help