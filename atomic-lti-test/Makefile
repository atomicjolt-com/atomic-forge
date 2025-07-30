# atomic-lti-test Makefile
# Test helper library for LTI testing

.PHONY: help
help: ## Show this help message
	@echo 'atomic-lti-test - LTI Test Helper Library'
	@echo ''
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ==============================================================================
# Testing
# ==============================================================================

.PHONY: test
test: ## Run all tests
	cargo test

.PHONY: test-unit
test-unit: ## Run unit tests only
	cargo test --lib

.PHONY: test-verbose
test-verbose: ## Run tests with output
	cargo test -- --nocapture

# ==============================================================================
# Code Quality
# ==============================================================================

.PHONY: lint
lint: ## Run clippy linter
	cargo clippy -- -D warnings

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
build: ## Build debug version
	cargo build

.PHONY: release
release: ## Build release version
	cargo build --release

.PHONY: clean
clean: ## Clean build artifacts
	cargo clean

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

.PHONY: deps-update
deps-update: ## Update dependencies
	cargo update

# ==============================================================================
# Development
# ==============================================================================

.PHONY: check
check: ## Run cargo check
	cargo check

.PHONY: pre-commit
pre-commit: fmt lint test ## Run pre-commit checks

.DEFAULT_GOAL := help