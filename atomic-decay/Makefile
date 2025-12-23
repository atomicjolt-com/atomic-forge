.PHONY: help test test-unit test-integration coverage coverage-html lint fmt clean dev build release

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Database URLs
DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_decay
TEST_DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_decay_test
PQ_LIB_DIR ?= $(shell brew --prefix libpq 2>/dev/null)/lib

# Helper functions
define print_header
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)$(1)$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
endef

define print_success
	@echo "$(GREEN)✓ $(1)$(NC)"
endef

define print_warning
	@echo "$(YELLOW)⚠ $(1)$(NC)"
endef

define print_error
	@echo "$(RED)✗ $(1)$(NC)"
endef

define check_command
	@if ! command -v $(1) &> /dev/null; then \
		echo "$(RED)✗ $(1) is not installed$(NC)"; \
		exit 1; \
	else \
		echo "$(GREEN)✓ $(1) is installed$(NC)"; \
	fi
endef

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ============================================================================
# DEVELOPMENT ENVIRONMENT
# ============================================================================

setup: ## Complete development setup
	$(call print_header,"Setting up Atomic Decay development environment")
	$(call check_command,cargo)
	$(call check_command,docker)
	$(call check_command,npm)
	$(call print_success,"Installing Rust development tools")
	@cargo install cargo-watch --locked || true
	@cargo install sqlx-cli --no-default-features --features rustls,postgres --locked || true
	@if [ ! -f .env ]; then \
		echo "📄 Creating .env file..."; \
		cp .env.example .env; \
		$(call print_warning,"Please update .env with your configuration"); \
	fi
	$(call print_success,"Starting Docker services")
	@cd .. && docker-compose up -d postgres
	$(call print_warning,"Waiting for PostgreSQL")
	@until cd .. && docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	$(call print_success,"Running database migrations")
	@DATABASE_URL="$(DATABASE_URL)" sqlx database create || true
	@if ! DATABASE_URL="$(DATABASE_URL)" sqlx migrate run 2>/dev/null; then \
		$(call print_warning,"Migration failed, resetting database"); \
		DATABASE_URL="$(DATABASE_URL)" sqlx database drop -y || true; \
		DATABASE_URL="$(DATABASE_URL)" sqlx database create; \
		DATABASE_URL="$(DATABASE_URL)" sqlx migrate run; \
	fi
	$(call print_success,"Installing npm dependencies")
	@npm install
	$(call print_success,"Generating SQLx offline query data")
	@DATABASE_URL="$(DATABASE_URL)" cargo sqlx prepare || $(call print_warning,"Failed to prepare SQLx data - run 'make db-prepare' after database is ready")
	$(call print_success,"Setup complete! You can now run:")
	@echo "  make dev     - Start development server"
	@echo "  make test    - Run tests (handles all setup automatically)"
	@echo "  make test-quick - Run tests quickly (assumes environment is ready)"
	@echo "  make help    - Show all available commands"

dev: ## Start full development environment
	$(call print_header,"Starting Development Environment")
	$(call print_header,"Checking Prerequisites")
	$(call check_command,docker)
	$(call check_command,docker-compose)
	$(call check_command,cargo)
	$(call check_command,npm)
	$(call print_header,"Checking Port Availability")
	@# Load PORT from .env or use default
	@BACKEND_PORT=$${PORT:-3000}; \
	FRONTEND_PORT=$${VITE_PORT:-3100}; \
	for PORT in $$BACKEND_PORT $$FRONTEND_PORT; do \
		if [ "$$PORT" = "$$BACKEND_PORT" ]; then \
			SERVICE="backend"; \
		else \
			SERVICE="frontend"; \
		fi; \
		if lsof -Pi :$$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(RED)✗ Port $$PORT ($$SERVICE) is already in use!$(NC)"; \
			echo "$(YELLOW)Process using port $$PORT:$(NC)"; \
			lsof -i :$$PORT | grep LISTEN || true; \
			echo ""; \
			echo "$(YELLOW)Would you like to kill the process? (Y/n)$(NC)"; \
			read -r CONFIRM; \
			if [ "$$CONFIRM" != "n" ] && [ "$$CONFIRM" != "N" ]; then \
				PID=$$(lsof -Pi :$$PORT -sTCP:LISTEN -t); \
				if [ -n "$$PID" ]; then \
					kill -9 $$PID && echo "$(GREEN)✓ Process on port $$PORT killed$(NC)"; \
				fi; \
			else \
				echo "$(RED)✗ Cannot start $$SERVICE server while port $$PORT is in use$(NC)"; \
				exit 1; \
			fi; \
		else \
			echo "$(GREEN)✓ Port $$PORT ($$SERVICE) is available$(NC)"; \
		fi; \
	done
	$(call print_header,"Starting Docker Services")
	@cd .. && docker-compose up -d postgres
	$(call print_warning,"Waiting for services to be ready")
	@sleep 5
	$(call print_header,"Running Database Migrations")
	@make db-migrate || $(call print_warning,"Migrations may have already been applied")
	$(call print_header,"Installing Dependencies")
	@npm install
	$(call print_header,"Starting Development Servers")
	@BACKEND_PORT=$${PORT:-3000}; \
	echo "$(GREEN)✓ Starting backend server on http://localhost:$$BACKEND_PORT$(NC)"
	@make run &
	@FRONTEND_PORT=$${VITE_PORT:-5173}; \
	echo "$(GREEN)✓ Starting frontend server on http://localhost:$$FRONTEND_PORT$(NC)"
	@npm run dev &
	$(call print_success,"Development servers are running!")
	$(call print_warning,"Press Ctrl+C to stop all services")
	@# Wait a bit for servers to start
# 	@sleep 6
# 	@# Open browser - try different commands for different platforms
# 	@BACKEND_PORT=$${PORT:-3000}; \
# 	if command -v open >/dev/null 2>&1; then \
# 		open http://localhost:$$BACKEND_PORT; \
# 	elif command -v xdg-open >/dev/null 2>&1; then \
# 		xdg-open http://localhost:$$BACKEND_PORT; \
# 	elif command -v wsl-open >/dev/null 2>&1; then \
# 		wsl-open http://localhost:$$BACKEND_PORT; \
# 	elif command -v start >/dev/null 2>&1; then \
# 		start http://localhost:$$BACKEND_PORT; \
# 	else \
# 		echo "$(YELLOW)⚠ Could not open browser automatically. Please navigate to http://localhost:$$BACKEND_PORT$(NC)"; \
# 	fi

dev-start-docker: ## Start development environment in Docker
	$(call print_header,"Starting Development Environment in Docker")
	@docker-compose -f docker-compose.dev.yml up

dev-stop: ## Stop development environment
	$(call print_header,"Stopping Development Environment")
	@cd .. && docker-compose down
	@pkill -f "cargo watch" || true
	@pkill -f "npm run dev" || true
	$(call print_success,"All services stopped")

dev-reset: ## Reset development environment
	$(call print_header,"Resetting Development Environment")
	$(call print_warning,"This will delete all data. Continue? (y/N)")
	@read -r CONFIRM; \
	if [ "$$CONFIRM" = "y" ] || [ "$$CONFIRM" = "Y" ]; then \
		cd .. && docker-compose down -v; \
		make db-reset; \
		$(call print_success,"Environment reset complete"); \
	else \
		$(call print_warning,"Reset cancelled"); \
	fi

dev-logs: ## Show development logs for service (usage: make dev-logs SERVICE=app)
	@SERVICE=$${SERVICE:-app}; \
	$(call print_header,"Showing logs for $$SERVICE"); \
	case "$$SERVICE" in \
		"app"|"backend") \
			cd .. && docker-compose logs -f app || journalctl -f -u atomic-decay ;; \
		"postgres"|"db") \
			cd .. && docker-compose logs -f postgres ;; \
		*) \
			$(call print_error,"Unknown service: $$SERVICE"); \
			$(call print_warning,"Available services: app, postgres") ;; \
	esac

# ============================================================================
# STARTER TEMPLATE INITIALIZATION
# ============================================================================

new: ## Create a new LTI app from this template (usage: make new APP_NAME=my-app TARGET_DIR=../my-app)
	@if [ -z "$(APP_NAME)" ] || [ -z "$(TARGET_DIR)" ]; then \
		$(call print_error,"APP_NAME and TARGET_DIR are required"); \
		echo "Usage: make new APP_NAME=my-app TARGET_DIR=../my-app"; \
		echo ""; \
		echo "Examples:"; \
		echo "  make new APP_NAME=canvas-tool TARGET_DIR=../canvas-tool"; \
		echo "  make new APP_NAME=my-lti-app TARGET_DIR=~/projects/my-lti-app"; \
		echo ""; \
		echo "This will:"; \
		echo "  - Create a new directory at TARGET_DIR"; \
		echo "  - Copy the Atomic Decay template"; \
		echo "  - Rename everything to APP_NAME"; \
		echo "  - Generate secure secrets"; \
		echo "  - Initialize a git repository"; \
		exit 1; \
	fi
	@./scripts/new-app-from-template.sh $(APP_NAME) $(TARGET_DIR)

generate-secrets: ## Generate random secrets for .env configuration
	$(call print_header,"Generated Secrets")
	@echo "Copy these values into your .env file:"
	@echo ""
	@echo "JWT_SECRET=$$(openssl rand -base64 32)"
	@echo "SESSION_SECRET=$$(openssl rand -base64 32)"
	@echo ""
	@echo "Copy this value into config/secrets.json:"
	@echo ""
	@echo '{"jwk_passphrase": "'$$(openssl rand -base64 24)'"}'
	@echo ""
	$(call print_warning,"Keep these secrets secure and never commit them to git")

# ============================================================================
# BUILD COMMANDS
# ============================================================================

run: ## Run development server with auto-reload
	systemfd --no-pid -s http::$${PORT:-3000} -- cargo watch -x run

build: ## Build debug binary
	cargo build

release: ## Build release binary
	cargo build --release

build-all: ## Build for production (backend + frontend)
	$(call print_header,"Building for Production")
	$(call print_header,"Building Frontend")
	@npm run build
	$(call print_header,"Building Backend")
	@cargo build --release
	$(call print_success,"Build completed")

# ============================================================================
# DOCKER COMMANDS
# ============================================================================

docker-build: ## Build Docker images
	$(call print_header,"Building Docker Images")
	@docker build -t atomic-decay:latest .
	$(call print_success,"Docker images built")

docker-dev: dev-start-docker ## Run development in Docker

docker-postgres-start: ## Start PostgreSQL container
	@cd .. && docker-compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@while ! cd .. && docker exec atomic-forge-postgres pg_isready -U postgres > /dev/null 2>&1; do \
		echo -n "."; \
		sleep 1; \
	done
	@echo "\nPostgreSQL is ready!"

docker-postgres-stop: ## Stop PostgreSQL container
	@cd .. && docker-compose stop postgres

docker-postgres-restart: ## Restart PostgreSQL container
	@$(MAKE) docker-postgres-stop
	@$(MAKE) docker-postgres-start

docker-postgres-logs: ## Show PostgreSQL container logs
	@cd .. && docker logs atomic-forge-postgres --tail 50 -f

# ============================================================================
# DATABASE COMMANDS
# ============================================================================

db-migrate: ## Run database migrations
	sqlx migrate run

db-reset: ## Reset database (drop and recreate)
	@echo "Resetting database..."
	@echo "Database URL: $(DATABASE_URL)"
	@DATABASE_URL="$(DATABASE_URL)" sqlx database drop -y -f || true
	@DATABASE_URL="$(DATABASE_URL)" sqlx database create
	@DATABASE_URL="$(DATABASE_URL)" sqlx migrate run

db-console: ## Open database console
	@echo "Opening database console..."
	@echo "Database URL: $(DATABASE_URL)"
	@psql $(DATABASE_URL)

db-tables: ## List all tables in the database
	@PGPASSWORD=postgres psql -h localhost -U postgres -d atomic_decay -c "\dt" 2>/dev/null || echo "Failed to connect to database"

db-inspect-table: ## Inspect a specific table structure (usage: make db-inspect-table TABLE=users)
	@PGPASSWORD=postgres psql -h localhost -U postgres -d atomic_decay -c "\d $(TABLE)" 2>/dev/null || echo "Failed to inspect table $(TABLE)"

db-seed: ## Seed database with test data
	cargo run --bin seed

db-prepare: ## Prepare SQLx offline data for compile-time checking
	@echo "$(GREEN)✓ Preparing SQLx offline data$(NC)"
	@DATABASE_URL="$(DATABASE_URL)" cargo sqlx prepare
	@echo "$(GREEN)✓ SQLx offline data prepared$(NC)"

db-reset-and-prepare: ## Reset database and prepare SQLx offline data
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)Resetting Database and Preparing SQLx Data$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
	@make db-reset
	@make db-prepare

db-reset-and-test: ## Reset database, prepare SQLx data, and run tests
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)Resetting Database and Running Tests$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
	@make db-reset
	@make db-prepare
	@make test

migration-create: ## Create new migration (usage: make migration-create NAME=migration_name)
	@if [ -z "$(NAME)" ]; then \
		echo "Error: NAME is required. Usage: make migration-create NAME=migration_name"; \
		exit 1; \
	fi
	./scripts/create-migration.sh $(NAME)

# ============================================================================
# TEST DATABASE COMMANDS
# ============================================================================

test-db-create: ## Create test database
	$(call print_success,"Creating test database: atomic_decay_test")
	@PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -c "CREATE DATABASE atomic_decay_test;" 2>/dev/null || true
	$(call print_success,"Test database created or already exists")

test-db-drop: ## Drop test database
	$(call print_success,"Dropping test database: atomic_decay_test")
	@PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -c "\
		SELECT pg_terminate_backend(pid) \
		FROM pg_stat_activity \
		WHERE datname = 'atomic_decay_test' AND pid <> pg_backend_pid();" 2>/dev/null || true
	@PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -c "DROP DATABASE IF EXISTS atomic_decay_test;" 2>/dev/null
	$(call print_success,"Test database dropped")

test-db-migrate: ## Run migrations on test database
	$(call print_success,"Running migrations on test database")
	@DATABASE_URL="$(TEST_DATABASE_URL)" sqlx migrate run
	$(call print_success,"Migrations completed")

test-db-reset: ## Reset test database (drop, create, migrate)
	@make test-db-drop
	@make test-db-create
	@make test-db-migrate

test-db-verify: ## Verify test database connection
	$(call print_success,"Verifying test database connection")
	@PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d atomic_decay_test -c "\dt" > /dev/null 2>&1
	@if [ $$? -eq 0 ]; then \
		$(call print_success,"Test database is accessible"); \
		TABLE_COUNT=$$(PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d atomic_decay_test -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null); \
		$(call print_success,"Found $$TABLE_COUNT tables in test database"); \
	else \
		$(call print_error,"Failed to connect to test database"); \
		exit 1; \
	fi

test-db-clean: ## Clean all data from test database tables
	@echo "Cleaning test database tables..."
	@cd .. && docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "TRUNCATE lti_registrations, lti_platforms, keys, oidc_states CASCADE;" || true

# ============================================================================
# TEST COMMANDS
# ============================================================================

# Internal target to ensure test environment is ready
test-ensure-ready:
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)Checking Test Environment$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
	@# Check if PostgreSQL is running
	@if ! cd .. && docker-compose ps postgres 2>/dev/null | grep -q "Up"; then \
		echo "$(YELLOW)⚠ PostgreSQL not running, starting it...$(NC)"; \
		cd .. && docker-compose up -d postgres; \
		echo "$(YELLOW)⚠ Waiting for PostgreSQL to be ready...$(NC)"; \
		sleep 5; \
		until cd .. && docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do \
			sleep 1; \
		done; \
	fi
	@# Check if database exists
	@if ! PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -lqt 2>/dev/null | grep -q atomic_decay; then \
		echo "$(YELLOW)⚠ Database does not exist, creating it...$(NC)"; \
		DATABASE_URL="$(DATABASE_URL)" sqlx database create || true; \
	fi
	@# Run migrations with error handling
	@echo "$(YELLOW)⚠ Ensuring migrations are up to date...$(NC)"
	@if ! DATABASE_URL="$(DATABASE_URL)" sqlx migrate run 2>/dev/null; then \
		echo "$(YELLOW)⚠ Migration error detected, resetting database...$(NC)"; \
		DATABASE_URL="$(DATABASE_URL)" sqlx database drop -y -f || true; \
		DATABASE_URL="$(DATABASE_URL)" sqlx database create; \
		DATABASE_URL="$(DATABASE_URL)" sqlx migrate run; \
	fi
	@# Check if SQLx offline data exists
	@if [ ! -d ".sqlx" ] || [ -z "$$(ls -A .sqlx 2>/dev/null)" ]; then \
		echo "$(YELLOW)⚠ SQLx offline data missing, generating...$(NC)"; \
		DATABASE_URL="$(DATABASE_URL)" cargo sqlx prepare || echo "$(RED)✗ Failed to prepare SQLx data$(NC)"; \
	fi
	@# Ensure test database exists
	@if ! PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -lqt 2>/dev/null | grep -q atomic_decay_test; then \
		echo "$(YELLOW)⚠ Test database does not exist, creating it...$(NC)"; \
		make test-db-create; \
		make test-db-migrate; \
	fi
	@echo "$(GREEN)✓ Test environment ready!$(NC)"

test-watch: ## Run tests with auto-reload
	cargo watch -x 'nextest run --no-fail-fast'

test-quick: ## Run tests quickly (assumes environment is ready)
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)Running Tests (Quick Mode)$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
	@cargo test

test: test-ensure-ready ## Run all tests
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)Running All Tests$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
	@./scripts/test-with-db.sh

test-serial: ## Run tests serially to avoid isolation issues
	./scripts/test-serial.sh

test-parallel: ## Run tests in parallel (default behavior)
	@echo "Running tests in parallel mode..."
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test

test-unit: test-ensure-ready ## Run unit tests only
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)Running Unit Tests$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
	@cargo test --lib

test-integration: test-ensure-ready ## Run integration tests only
	@echo "$(BLUE)==================================================$(NC)"
	@echo "$(BLUE)Running Integration Tests$(NC)"
	@echo "$(BLUE)==================================================$(NC)"
	@./scripts/test-with-db.sh --test '*'

test-online: ## Run tests with real database (no SQLX_OFFLINE)
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test --no-fail-fast

test-offline: ## Run tests with SQLX offline mode
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	export SQLX_OFFLINE=true; \
	cargo test --no-fail-fast

test-summary: ## Run tests and show summary only
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test --no-fail-fast 2>&1 | grep -E "(test result:|FAILED|panicked)" | tail -20

test-specific: ## Run specific test(s) by name (usage: make test-specific TEST=test_name)
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	cargo test $(TEST) -- --nocapture

test-isolated: ## Run specific test in complete isolation (usage: make test-isolated TEST=test_name)
	@$(MAKE) test-db-clean
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	export RUST_TEST_THREADS=1; \
	cargo test $(TEST) -- --exact --nocapture

test-failed: ## Re-run only the tests that failed in the last run
	@echo "Re-running failed tests serially..."
	@export DATABASE_URL="$(TEST_DATABASE_URL)"; \
	export RUST_TEST_THREADS=1; \
	cargo test test_find_by_id_exists test_list_keys test_list_keys_with_limit test_ensure_keys test_get_current_keys test_get_current_keys_with_limit -- --test-threads=1

test-setup: test-db-reset ## Setup test environment
	$(call print_success,"Test environment ready")

test-integration-full: test-setup ## Run integration tests with fresh database
	@source .env.test 2>/dev/null || true && cargo test --test '*' -- --test-threads=1

test-all: test-ensure-ready ## Run all tests (unit + integration) with fresh test database
	$(call print_header,"Running All Tests with Fresh Database")
	@make test-db-reset
	@cargo test --all

test-with-coverage: ## Run tests with coverage and threshold check
	$(call print_header,"Running Atomic Decay tests with coverage")
	@export DATABASE_URL="$(TEST_DATABASE_URL)"
	@export RUST_LOG="atomic_decay=debug,sqlx=warn"
	$(call print_success,"Setting up test database")
	@make test-db-reset
	$(call print_success,"Running tests with coverage")
	@cargo tarpaulin \
		--verbose \
		--all-features \
		--workspace \
		--timeout 120 \
		--out Html \
		--out Xml \
		--out Lcov || true
	@coverage=$$(cargo tarpaulin --print-summary 2>/dev/null | grep "Coverage" | awk '{print $$2}' | sed 's/%//' || echo "0"); \
	threshold=70; \
	if [ -n "$$coverage" ] && [ "$$(echo "$$coverage < $$threshold" | bc -l 2>/dev/null || echo "0")" -eq 1 ]; then \
		$(call print_error,"Coverage $$coverage% is below threshold $$threshold%"); \
		exit 1; \
	else \
		$(call print_success,"Coverage $$coverage% meets threshold $$threshold%"); \
	fi
	$(call print_success,"Coverage report generated:")
	@echo "  - HTML: target/tarpaulin/tarpaulin-report.html"
	@echo "  - XML: cobertura.xml"
	@echo "  - LCOV: lcov.info"

test-diagnose: ## Diagnose test database state
	@echo "=== Test Database Diagnostics ==="
	@echo "Checking database connection..."
	@cd .. && docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "SELECT version();" || echo "❌ Failed to connect to test database"
	@echo "\nChecking table row counts:"
	@cd .. && docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "SELECT 'keys' as table_name, COUNT(*) as row_count FROM keys UNION SELECT 'oidc_states', COUNT(*) FROM oidc_states UNION SELECT 'lti_platforms', COUNT(*) FROM lti_platforms UNION SELECT 'lti_registrations', COUNT(*) FROM lti_registrations;" || true
	@echo "\nChecking for stale test data:"
	@cd .. && docker exec atomic-forge-postgres psql -U postgres -d atomic_decay_test -c "SELECT id, LEFT(uuid, 10) as uuid_prefix, created_at FROM keys ORDER BY created_at DESC LIMIT 5;" || true

test-fix: ## Fix common test issues
	@echo "Fixing common test issues..."
	@$(MAKE) docker-postgres-restart
	@$(MAKE) test-db-reset
	@$(MAKE) test-db-clean
	@echo "✅ Test environment reset. Try running tests again with: make test-serial"

coverage: ## Run tests with coverage report
	cargo tarpaulin

coverage-html: ## Generate HTML coverage report
	cargo tarpaulin --out Html
	@echo "Coverage report generated at target/tarpaulin/tarpaulin-report.html"

# ============================================================================
# CODE QUALITY COMMANDS
# ============================================================================

lint: ## Run clippy linter
	cargo clippy -- -D warnings

lint-fix: ## Run clippy linter and fix issues
	cargo clippy --fix --allow-dirty --allow-staged

fmt: ## Format code
	cargo fmt

fmt-check: ## Check code formatting
	cargo fmt -- --check

lint-all: ## Run all linters (Rust + Frontend)
	$(call print_header,"Running Linters")
	$(call print_header,"Running Rust Linters")
	@cargo fmt -- --check
	@cargo clippy -- -D warnings
	$(call print_header,"Running Frontend Linters")
	@npm run lint || $(call print_warning,"Frontend linting skipped (no lint script)")
	@npm run check || $(call print_warning,"Frontend type checking skipped (no check script)")
	$(call print_success,"Linting completed")

format-all: ## Format all code (Rust + Frontend)
	$(call print_header,"Formatting Code")
	@cargo fmt
	@npm run prettier:fix || $(call print_warning,"Frontend formatting skipped (no prettier:fix script)")
	$(call print_success,"Code formatted")

check: fmt-check lint test ## Run all checks (format, lint, test)

pre-commit: fmt lint test ## Run pre-commit checks

# ============================================================================
# FRONTEND COMMANDS
# ============================================================================

frontend-dev: ## Run frontend in watch mode
	npm run dev

frontend-build: ## Build frontend assets
	npm run build

frontend-test: ## Run frontend tests
	npm test

frontend-install: ## Install frontend dependencies
	npm install

frontend-clean: ## Clean frontend build artifacts
	npm run clean

# ============================================================================
# DEPENDENCY MANAGEMENT
# ============================================================================

update-deps: ## Update all dependencies
	$(call print_header,"Updating Dependencies")
	$(call print_header,"Updating Rust Dependencies")
	@cargo update
	$(call print_header,"Updating NPM Dependencies")
	@npm update
	$(call print_success,"Dependencies updated")

deps-check: ## Check for outdated dependencies
	cargo outdated
	npm outdated || true

# ============================================================================
# GIT HOOKS
# ============================================================================

setup-hooks: ## Install git hooks
	$(call print_header,"Setting Up Git Hooks")
	@if ! command -v pre-commit &> /dev/null; then \
		$(call print_warning,"Installing pre-commit"); \
		pip install pre-commit || pip3 install pre-commit; \
	fi
	@pre-commit install
	$(call print_success,"Git hooks installed")

# ============================================================================
# MONITORING
# ============================================================================

monitoring: ## Start monitoring stack
	$(call print_header,"Starting Monitoring Stack")
	@docker-compose -f docker-compose.monitoring.yml up -d
	$(call print_success,"Monitoring stack started:")
	$(call print_success,"  - Prometheus: http://localhost:9090")
	$(call print_success,"  - Grafana: http://localhost:3001 (admin/admin)")
	$(call print_success,"  - Metrics: http://localhost:9101/metrics")

monitoring-stop: ## Stop monitoring stack
	@docker-compose -f docker-compose.monitoring.yml down

# ============================================================================
# SECURITY & QUALITY CHECKS
# ============================================================================

security-check: ## Run security audits
	@cargo audit || $(call print_warning,"cargo audit not available")
	@npm audit --production || $(call print_warning,"npm audit failed")

coverage-generate: ## Generate coverage report
	$(call print_header,"Generating Coverage Report")
	@make coverage-html
	$(call print_success,"Coverage report generated at target/tarpaulin/tarpaulin-report.html")

# ============================================================================
# CLEANUP
# ============================================================================

clean: ## Clean build artifacts
	cargo clean
	rm -rf target/tarpaulin
	rm -f *.profraw
	rm -rf src/assets/js

rmprof: ## Remove profiling files
	rm -f *.profraw

# ============================================================================
# DOCUMENTATION
# ============================================================================

docs: ## Generate documentation
	cargo doc --no-deps

docs-open: ## Generate and open documentation
	cargo doc --no-deps --open

# ============================================================================
# UTILITY
# ============================================================================

sqlx-prepare: ## Prepare SQLX offline data
	cargo sqlx prepare

env-check: ## Check environment variables
	@echo "DATABASE_URL: $(DATABASE_URL)"
	@echo "TEST_DATABASE_URL: $(TEST_DATABASE_URL)"
	@echo "PQ_LIB_DIR: $(PQ_LIB_DIR)"
	@echo "PORT: $${PORT:-3000}"

# ============================================================================
# ALIASES AND SHORTCUTS
# ============================================================================

start: dev ## Alias for dev
stop: dev-stop ## Alias for dev-stop
reset: dev-reset ## Alias for dev-reset

.DEFAULT_GOAL := help