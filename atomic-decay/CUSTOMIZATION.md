# Customization Guide for Atomic Decay

This guide explains how to customize Atomic Decay to create your own LTI 1.3 application.

## Table of Contents

- [Quick Start (Automated)](#quick-start-automated)
- [Manual Customization](#manual-customization)
- [Configuration Reference](#configuration-reference)
- [Common Customizations](#common-customizations)

---

## Quick Start (Automated)

### Recommended: Create a New Project from Template

The easiest way to create a new application from Atomic Decay is to use the `make new` command, which creates a separate directory for your new app:

```bash
# From within the atomic-decay directory
make new APP_NAME=my-lti-app TARGET_DIR=../my-lti-app

# Then navigate to your new app
cd ../my-lti-app
make setup    # Set up development environment
make dev      # Start development server
```

This command will:
1. ✅ Create a new directory at the specified path
2. ✅ Copy the entire Atomic Decay template (excluding build artifacts)
3. ✅ Rename `atomic-decay` → `my-lti-app` throughout the codebase
4. ✅ Update database names from `atomic_decay_dev` → `my_lti_app_dev`
5. ✅ Generate secure random secrets for JWT, sessions, and JWK encryption
6. ✅ Create customized `.env` and `config/secrets.json` files
7. ✅ Update `Cargo.toml`, `package.json`, and `README.md`
8. ✅ Initialize a new git repository with initial commit
9. ✅ Remove template-specific files (init scripts)

**Benefits of this approach:**
- Your original `atomic-decay` directory stays pristine
- You can create multiple apps from the same template
- No need to re-clone the repository
- Each new app starts with a clean git history

### Alternative: Initialize in Current Directory

If you prefer to modify the current directory instead (not recommended for preserving the template):

```bash
make init-new-app APP_NAME=my-lti-app
```

**Note:** This modifies the current directory, so you'll need to clone the repository again to create another app.

---

## Manual Customization

If you prefer to customize manually or need to make specific changes, follow these steps:

### 1. Generate Secrets

Generate secure random secrets for your application:

```bash
make generate-secrets
```

Copy the generated values into:
- `.env` → `JWT_SECRET` and `SESSION_SECRET`
- `config/secrets.json` → `jwk_passphrase`

### 2. Update Package Configuration

**File: `Cargo.toml`**

```toml
[package]
name = "your-app-name"                    # Change from "atomic-decay"
version = "0.1.0"                         # Set your initial version
authors = ["Your Name <your.email@example.com>"]
description = "Your LTI 1.3 tool description"
repository = "https://github.com/yourusername/your-repo"
homepage = "https://your-app-domain.com"

# Also update the binary and lib names:
[[bin]]
name = "your-app-name"                    # Change from "atomic-decay"

[lib]
name = "your_app_name"                    # Change from "atomic_decay"
```

**File: `package.json`**

```json
{
  "name": "your-app-name",
  "version": "0.1.0"
}
```

### 3. Update Environment Configuration

**File: `.env` (copy from `.env.example`)**

```bash
# Database - change database names to match your app
DATABASE_URL=postgres://postgres:password@localhost:5433/your_app_dev
TEST_DATABASE_URL=postgres://postgres:password@localhost:5433/your_app_test

# Application
PORT=8383                                  # Your preferred port
HOST=127.0.0.1

# LTI Configuration - update with your values
LTI_ISSUER=https://your-domain.example.com
LTI_CLIENT_ID=your-client-id-from-lms
LTI_DEPLOYMENT_ID=your-deployment-id-from-lms

# Security - use generated secrets from make generate-secrets
JWT_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>
```

**File: `config/secrets.json`**

```json
{
  "jwk_passphrase": "<generated-passphrase>",
  "allowed_origins": [
    "http://localhost:3000",
    "https://your-production-domain.com"
  ]
}
```

### 4. Update Database References

**File: `Makefile`**

Replace all occurrences of:
- `atomic_decay` → `your_app_name` (snake_case for database names)
- `atomic-decay` → `your-app-name` (kebab-case for application name)

Key variables to update:
```makefile
DATABASE_URL ?= postgresql://postgres:password@localhost:5433/your_app_name
TEST_DATABASE_URL ?= postgresql://postgres:password@localhost:5433/your_app_name_test
```

### 5. Update Source Code

**Find and replace in all `.rs` files:**

- `atomic_decay` → `your_app_name` (snake_case)
- `atomic-decay` → `your-app-name` (kebab-case)

Key files:
- `src/lib.rs` - Library name
- `src/main.rs` - Application initialization
- All files importing from `atomic_decay::*`

### 6. Update Documentation

**File: `README.md`**

- Replace "Atomic Decay" with your application name
- Update the description and features
- Add your specific setup instructions
- Update repository URLs and links

---

## Configuration Reference

### Required Configuration Values

| Configuration | Location | Description | Example |
|--------------|----------|-------------|---------|
| **App Name** | `Cargo.toml` | Package name (kebab-case) | `my-lti-app` |
| **Lib Name** | `Cargo.toml` | Library name (snake_case) | `my_lti_app` |
| **Database Names** | `.env`, `Makefile` | PostgreSQL database names | `my_lti_app_dev` |
| **LTI Issuer** | `.env` | Your tool's issuer URL (HTTPS in prod) | `https://myapp.edu` |
| **Client ID** | `.env` | LMS-provided client identifier | `125900000000123` |
| **Deployment ID** | `.env` | LMS-provided deployment ID | `1:abc123xyz` |
| **JWT Secret** | `.env` | JWT signing secret (32+ chars) | Use `make generate-secrets` |
| **Session Secret** | `.env` | Session encryption key (32+ chars) | Use `make generate-secrets` |
| **JWK Passphrase** | `config/secrets.json` | Private key encryption passphrase | Use `make generate-secrets` |

### Optional Configuration Values

| Configuration | Location | Description | Default |
|--------------|----------|-------------|---------|
| **PORT** | `.env` | HTTP server port | `8383` |
| **HOST** | `.env` | Bind address | `127.0.0.1` |
| **RUST_LOG** | `.env` | Logging level | `debug` |
| **allowed_origins** | `config/secrets.json` | CORS allowed origins | `["http://localhost:3000"]` |

---

## Common Customizations

### 1. Adding Custom LTI Platforms

**File: `src/seed_platforms.rs`**

Add your institution's LMS configuration to the `PLATFORM_DATA` array:

```rust
const PLATFORM_DATA: &[(&str, &str, &str, &str)] = &[
    // ... existing platforms ...
    (
        "https://your-institution.instructure.com",  // issuer
        "https://your-institution.instructure.com/api/lti/security/jwks",  // jwks_url
        "https://your-institution.instructure.com/login/oauth2/token",  // token_url
        "https://your-institution.instructure.com/api/lti/authorize_redirect",  // oidc_url
    ),
];
```

### 2. Customizing CORS Origins

**File: `config/secrets.json`**

```json
{
  "jwk_passphrase": "your-passphrase",
  "allowed_origins": [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-production-domain.com",
    "https://your-institution-lms.edu"
  ]
}
```

### 3. Changing the Default Port

**File: `.env`**

```bash
PORT=9090  # Or any available port
```

**File: `Makefile` (optional - for documentation)**

Update the default in the `run` target if desired.

### 4. Customizing Database Connection

**Production database with SSL:**

```bash
DATABASE_URL=postgres://user:password@db.example.com:5432/myapp_prod?sslmode=require
```

**Different PostgreSQL version or host:**

```bash
DATABASE_URL=postgres://postgres:password@my-postgres-host:5432/myapp_dev
```

### 5. Adding Custom Routes

**File: `src/routes.rs`**

Add your custom routes to the router:

```rust
pub fn create_routes() -> Router<AppState> {
    Router::new()
        // ... existing routes ...
        .route("/api/custom", get(handlers::custom::my_handler))
        // ... rest of routes ...
}
```

### 6. Customizing JWT Token Claims

**File: `src/handlers/lti.rs`**

Modify the JWT claims structure in the launch handler to include custom data.

---

## Verification Checklist

After customization, verify these items:

- [ ] All references to `atomic-decay` and `atomic_decay` are updated
- [ ] `.env` file exists with valid configuration
- [ ] `config/secrets.json` exists with secure passphrase
- [ ] `JWT_SECRET` and `SESSION_SECRET` are secure random values (not examples)
- [ ] Database names match in `.env`, `Makefile`, and any scripts
- [ ] `Cargo.toml` has correct package name, authors, and repository
- [ ] `README.md` reflects your application name and purpose
- [ ] LTI platform configurations are correct in `seed_platforms.rs`
- [ ] CORS origins include your frontend URLs
- [ ] Port number doesn't conflict with other services

---

## Testing Your Customization

After customizing, test the setup:

```bash
# 1. Set up the development environment
make setup

# 2. Run tests to ensure everything works
make test

# 3. Start the development server
make dev

# 4. Verify the application starts without errors
curl http://localhost:8383/up
# Should return: {"status":"ok"}

# 5. Check that JWT keys are generated
curl http://localhost:8383/jwks
# Should return a JWKS response with keys
```

---

## Getting Help

If you encounter issues:

1. Check the [README.md](README.md) for detailed setup instructions
2. Run `make help` to see all available commands
3. Run `make env-check` to verify environment variables
4. Check logs with `make dev-logs`
5. Reset environment with `make dev-reset` if needed

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Change `RUST_LOG` to `info` or `warn` in `.env`
- [ ] Use HTTPS for `LTI_ISSUER` URL
- [ ] Generate new production secrets (never reuse dev secrets)
- [ ] Configure production database with SSL
- [ ] Set up proper CORS origins (no wildcards)
- [ ] Enable rate limiting and security headers
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Test LTI integration with your target LMS
- [ ] Review security audit with `make security-check`
- [ ] Run full test suite with `make test`
