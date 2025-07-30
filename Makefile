# Atomic Forge Monorepo Makefile
# This is the root-level Makefile that orchestrates all projects

# Default shell
SHELL := /bin/bash

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Projects
PROJECTS := atomic-lti atomic-lti-test atomic-lti-tool atomic-lti-tool-axum atomic-decay atomic-oxide
DB_PROJECTS := atomic-decay atomic-oxide
FRONTEND_PROJECTS := atomic-decay atomic-oxide

# Database configuration
export DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_forge_dev
export TEST_DATABASE_URL ?= postgresql://postgres:password@localhost:5433/atomic_forge_test

# MacOS PostgreSQL library path
export PQ_LIB_DIR ?= $(shell brew --prefix libpq 2>/dev/null)/lib

.PHONY: help
help: ## Show this help message
	@echo 'Atomic Forge Monorepo - Available Commands'
	@echo ''
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ==============================================================================
# Development Environment
# ==============================================================================

.PHONY: setup
setup: ## Complete development environment setup
	@echo -e "$(BLUE)Setting up Atomic Forge development environment...$(NC)"
	@echo -e "$(YELLOW)Installing Rust dependencies...$(NC)"
	@command -v cargo >/dev/null 2>&1 || { echo -e "$(RED)Cargo not found. Please install Rust.$(NC)" >&2; exit 1; }
	@command -v sqlx >/dev/null 2>&1 || cargo install sqlx-cli --no-default-features --features postgres
	@command -v cargo-watch >/dev/null 2>&1 || cargo install cargo-watch
	@command -v cargo-tarpaulin >/dev/null 2>&1 || cargo install cargo-tarpaulin
	@command -v diesel >/dev/null 2>&1 || cargo install diesel_cli --no-default-features --features postgres
	@echo -e "$(YELLOW)Starting Docker services...$(NC)"
	@$(MAKE) docker-up
	@echo -e "$(YELLOW)Setting up databases...$(NC)"
	@$(MAKE) db-setup
	@echo -e "$(GREEN)✓ Development environment ready!$(NC)"

.PHONY: docker-up
docker-up: ## Start Docker services (PostgreSQL, pgAdmin)
	@echo -e "$(BLUE)Starting Docker services...$(NC)"
	@docker-compose up -d
	@echo -e "$(YELLOW)Waiting for PostgreSQL to be ready...$(NC)"
	@timeout 30s bash -c 'until docker-compose exec -T postgres pg_isready -U postgres; do sleep 1; done' || \
		(echo -e "$(RED)PostgreSQL failed to start$(NC)" && exit 1)
	@echo -e "$(GREEN)✓ Docker services started$(NC)"
	@echo -e "  PostgreSQL: localhost:5433"
	@echo -e "  pgAdmin: http://localhost:5050 (admin@atomic-forge.com / admin)"

.PHONY: docker-down
docker-down: ## Stop Docker services
	@echo -e "$(BLUE)Stopping Docker services...$(NC)"
	@docker-compose down
	@echo -e "$(GREEN)✓ Docker services stopped$(NC)"

.PHONY: docker-reset
docker-reset: ## Reset Docker services (removes volumes)
	@echo -e "$(RED)Resetting Docker services and removing volumes...$(NC)"
	@docker-compose down -v
	@echo -e "$(GREEN)✓ Docker services reset$(NC)"

# ==============================================================================
# Database Management
# ==============================================================================

.PHONY: db-setup
db-setup: ## Setup all project databases
	@echo -e "$(BLUE)Setting up databases...$(NC)"
	@for project in $(DB_PROJECTS); do \
		if [ -f "$$project/Makefile" ]; then \
			echo -e "$(YELLOW)Setting up $$project database...$(NC)"; \
			$(MAKE) -C $$project db-setup || exit 1; \
		fi; \
	done
	@echo -e "$(GREEN)✓ All databases setup complete$(NC)"

.PHONY: db-migrate
db-migrate: ## Run migrations for all projects
	@for project in $(DB_PROJECTS); do \
		if [ -f "$$project/Makefile" ]; then \
			echo -e "$(YELLOW)Running migrations for $$project...$(NC)"; \
			$(MAKE) -C $$project db-migrate || exit 1; \
		fi; \
	done
	@echo -e "$(GREEN)✓ All migrations complete$(NC)"

.PHONY: db-reset
db-reset: ## Reset all project databases
	@echo -e "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		for project in $(DB_PROJECTS); do \
			if [ -f "$$project/Makefile" ]; then \
				echo -e "$(YELLOW)Resetting $$project database...$(NC)"; \
				$(MAKE) -C $$project db-reset || exit 1; \
			fi; \
		done; \
		echo -e "$(GREEN)✓ All databases reset$(NC)"; \
	fi

# ==============================================================================
# Building
# ==============================================================================

.PHONY: build
build: ## Build all projects in debug mode
	@echo -e "$(BLUE)Building all projects...$(NC)"
	@for project in $(PROJECTS); do \
		echo -e "$(YELLOW)Building $$project...$(NC)"; \
		$(MAKE) -C $$project build || exit 1; \
	done
	@echo -e "$(GREEN)✓ All projects built$(NC)"

.PHONY: build-release
build-release: ## Build all projects in release mode
	@echo -e "$(BLUE)Building all projects in release mode...$(NC)"
	@for project in $(PROJECTS); do \
		echo -e "$(YELLOW)Building $$project...$(NC)"; \
		$(MAKE) -C $$project release || exit 1; \
	done
	@echo -e "$(GREEN)✓ All projects built in release mode$(NC)"

.PHONY: frontend-build
frontend-build: ## Build frontend assets for all projects
	@for project in $(FRONTEND_PROJECTS); do \
		if [ -f "$$project/package.json" ]; then \
			echo -e "$(YELLOW)Building frontend for $$project...$(NC)"; \
			$(MAKE) -C $$project frontend-build || exit 1; \
		fi; \
	done
	@echo -e "$(GREEN)✓ All frontend builds complete$(NC)"

# ==============================================================================
# Testing
# ==============================================================================

.PHONY: test
test: ## Run tests for all projects
	@echo -e "$(BLUE)Running tests for all projects...$(NC)"
	@./scripts/test-all.sh

.PHONY: test-unit
test-unit: ## Run unit tests for all projects
	@echo -e "$(BLUE)Running unit tests...$(NC)"
	@for project in $(PROJECTS); do \
		echo -e "$(YELLOW)Testing $$project...$(NC)"; \
		$(MAKE) -C $$project test-unit || exit 1; \
	done
	@echo -e "$(GREEN)✓ All unit tests passed$(NC)"

.PHONY: test-integration
test-integration: ## Run integration tests for all projects
	@echo -e "$(BLUE)Running integration tests...$(NC)"
	@for project in $(PROJECTS); do \
		echo -e "$(YELLOW)Testing $$project...$(NC)"; \
		$(MAKE) -C $$project test-integration || exit 1; \
	done
	@echo -e "$(GREEN)✓ All integration tests passed$(NC)"

.PHONY: coverage
coverage: ## Generate coverage reports for all projects
	@echo -e "$(BLUE)Generating coverage reports...$(NC)"
	@for project in $(PROJECTS); do \
		if [ -f "$$project/Makefile" ]; then \
			echo -e "$(YELLOW)Coverage for $$project...$(NC)"; \
			$(MAKE) -C $$project coverage || true; \
		fi; \
	done

# ==============================================================================
# Code Quality
# ==============================================================================

.PHONY: lint
lint: ## Run clippy on all projects
	@echo -e "$(BLUE)Running clippy...$(NC)"
	@for project in $(PROJECTS); do \
		echo -e "$(YELLOW)Linting $$project...$(NC)"; \
		$(MAKE) -C $$project lint || exit 1; \
	done
	@echo -e "$(GREEN)✓ All projects linted$(NC)"

.PHONY: fmt
fmt: ## Format all Rust code
	@echo -e "$(BLUE)Formatting code...$(NC)"
	@for project in $(PROJECTS); do \
		$(MAKE) -C $$project fmt || exit 1; \
	done
	@echo -e "$(GREEN)✓ All code formatted$(NC)"

.PHONY: fmt-check
fmt-check: ## Check code formatting
	@echo -e "$(BLUE)Checking code formatting...$(NC)"
	@for project in $(PROJECTS); do \
		$(MAKE) -C $$project fmt-check || exit 1; \
	done
	@echo -e "$(GREEN)✓ All code properly formatted$(NC)"

.PHONY: check
check: fmt-check lint test ## Run all checks (format, lint, test)
	@echo -e "$(GREEN)✓ All checks passed!$(NC)"

# ==============================================================================
# Development
# ==============================================================================

.PHONY: dev-atomic-decay
dev-atomic-decay: ## Run atomic-decay in development mode
	@$(MAKE) -C atomic-decay dev

.PHONY: dev-atomic-oxide
dev-atomic-oxide: ## Run atomic-oxide in development mode
	@$(MAKE) -C atomic-oxide dev

# ==============================================================================
# Cleaning
# ==============================================================================

.PHONY: clean
clean: ## Clean all build artifacts
	@echo -e "$(BLUE)Cleaning build artifacts...$(NC)"
	@for project in $(PROJECTS); do \
		echo -e "$(YELLOW)Cleaning $$project...$(NC)"; \
		$(MAKE) -C $$project clean || true; \
	done
	@echo -e "$(GREEN)✓ All artifacts cleaned$(NC)"

.PHONY: clean-deep
clean-deep: clean ## Deep clean including caches and dependencies
	@echo -e "$(RED)Deep cleaning all projects...$(NC)"
	@for project in $(PROJECTS); do \
		rm -rf $$project/target || true; \
		rm -rf $$project/node_modules || true; \
	done
	@cargo clean
	@echo -e "$(GREEN)✓ Deep clean complete$(NC)"

# ==============================================================================
# Dependencies
# ==============================================================================

.PHONY: update-deps
update-deps: ## Update all dependencies
	@echo -e "$(BLUE)Updating Rust dependencies...$(NC)"
	@for project in $(PROJECTS); do \
		if [ -f "$$project/Cargo.toml" ]; then \
			echo -e "$(YELLOW)Updating $$project...$(NC)"; \
			cd $$project && cargo update || exit 1; \
			cd ..; \
		fi; \
	done
	@echo -e "$(BLUE)Updating Node dependencies...$(NC)"
	@for project in $(FRONTEND_PROJECTS); do \
		if [ -f "$$project/package.json" ]; then \
			echo -e "$(YELLOW)Updating $$project...$(NC)"; \
			cd $$project && npm update || exit 1; \
			cd ..; \
		fi; \
	done
	@echo -e "$(GREEN)✓ All dependencies updated$(NC)"

.PHONY: security-check
security-check: ## Run security audits
	@echo -e "$(BLUE)Running security audits...$(NC)"
	@command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit
	@for project in $(PROJECTS); do \
		if [ -f "$$project/Cargo.toml" ]; then \
			echo -e "$(YELLOW)Auditing $$project...$(NC)"; \
			cd $$project && cargo audit || exit 1; \
			cd ..; \
		fi; \
	done
	@for project in $(FRONTEND_PROJECTS); do \
		if [ -f "$$project/package.json" ]; then \
			echo -e "$(YELLOW)Auditing $$project npm packages...$(NC)"; \
			cd $$project && npm audit --production || true; \
			cd ..; \
		fi; \
	done

# ==============================================================================
# Documentation
# ==============================================================================

.PHONY: docs
docs: ## Generate documentation for all projects
	@echo -e "$(BLUE)Generating documentation...$(NC)"
	@for project in $(PROJECTS); do \
		echo -e "$(YELLOW)Documenting $$project...$(NC)"; \
		cd $$project && cargo doc --no-deps || exit 1; \
		cd ..; \
	done
	@echo -e "$(GREEN)✓ Documentation generated$(NC)"

.PHONY: docs-open
docs-open: docs ## Generate and open documentation
	@echo -e "$(BLUE)Opening documentation...$(NC)"
	@cd atomic-lti && cargo doc --no-deps --open

# ==============================================================================
# Utility
# ==============================================================================

.PHONY: env-check
env-check: ## Check environment setup
	@echo -e "$(BLUE)Checking environment...$(NC)"
	@echo "DATABASE_URL: $$DATABASE_URL"
	@echo "TEST_DATABASE_URL: $$TEST_DATABASE_URL"
	@echo "PQ_LIB_DIR: $$PQ_LIB_DIR"
	@command -v cargo >/dev/null 2>&1 && echo -e "$(GREEN)✓ Cargo found$(NC)" || echo -e "$(RED)✗ Cargo not found$(NC)"
	@command -v sqlx >/dev/null 2>&1 && echo -e "$(GREEN)✓ sqlx-cli found$(NC)" || echo -e "$(YELLOW)⚠ sqlx-cli not found$(NC)"
	@command -v diesel >/dev/null 2>&1 && echo -e "$(GREEN)✓ diesel-cli found$(NC)" || echo -e "$(YELLOW)⚠ diesel-cli not found$(NC)"
	@command -v docker >/dev/null 2>&1 && echo -e "$(GREEN)✓ Docker found$(NC)" || echo -e "$(RED)✗ Docker not found$(NC)"
	@docker info >/dev/null 2>&1 && echo -e "$(GREEN)✓ Docker running$(NC)" || echo -e "$(RED)✗ Docker not running$(NC)"

.DEFAULT_GOAL := help