# atomic-lti Makefile
# Pure Rust library for LTI functionality

.PHONY: help
help: ## Show this help message
	@echo 'atomic-lti - LTI Core Library'
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

.PHONY: test-integration
test-integration: ## Run integration tests only
	cargo test --test '*'

.PHONY: test-doc
test-doc: ## Run documentation tests
	cargo test --doc

.PHONY: test-verbose
test-verbose: ## Run tests with output
	cargo test -- --nocapture

.PHONY: test-specific
test-specific: ## Run specific test(s) by name (usage: make test-specific TEST=test_name)
	cargo test $(TEST) -- --nocapture

# ==============================================================================
# Code Coverage
# ==============================================================================

.PHONY: coverage
coverage: ## Run tests with coverage report
	cargo tarpaulin --out Stdout

.PHONY: coverage-html
coverage-html: ## Generate HTML coverage report
	cargo tarpaulin --out Html
	@echo "Coverage report generated at target/tarpaulin/tarpaulin-report.html"

# ==============================================================================
# Code Quality
# ==============================================================================

.PHONY: lint
lint: ## Run clippy linter
	cargo clippy -- -D warnings

.PHONY: lint-all
lint-all: ## Run clippy with all features
	cargo clippy --all-features -- -D warnings

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

.PHONY: build-release
release: ## Build release version
	cargo build --release

.PHONY: clean
clean: ## Clean build artifacts
	cargo clean
	rm -rf target/tarpaulin

# ==============================================================================
# Documentation
# ==============================================================================

.PHONY: docs
docs: ## Generate documentation
	cargo doc --no-deps

.PHONY: docs-open
docs-open: ## Generate and open documentation
	cargo doc --no-deps --open

.PHONY: docs-all
docs-all: ## Generate documentation with dependencies
	cargo doc

# ==============================================================================
# Dependencies
# ==============================================================================

.PHONY: deps-check
deps-check: ## Check for outdated dependencies
	cargo outdated

.PHONY: deps-update
deps-update: ## Update dependencies
	cargo update

.PHONY: deps-tree
deps-tree: ## Show dependency tree
	cargo tree

# ==============================================================================
# Development
# ==============================================================================

.PHONY: check
check: ## Run cargo check
	cargo check

.PHONY: check-all
check-all: ## Run cargo check with all features
	cargo check --all-features

.PHONY: bench
bench: ## Run benchmarks
	cargo bench

# ==============================================================================
# Utility
# ==============================================================================

.PHONY: pre-commit
pre-commit: fmt lint test ## Run pre-commit checks

.PHONY: ci
ci: fmt-check lint test ## Run CI checks

.DEFAULT_GOAL := help