# LTI 1.3 Tool Implementation Plan - atomic-lti-tool-axum

## Status: ✅ COMPLETED
**Last Updated:** 2025-10-14
**Completion Date:** 2025-10-14

---

## Overview

This document tracks the implementation of LTI 1.3 core handlers for the Axum-based atomic-lti-tool-axum project. The goal is to port the complete LTI 1.3 functionality from the Actix-based atomic-lti-tool implementation while:

1. Reusing all LTI logic from the atomic-lti library
2. Only adapting framework-specific code (Axum vs Actix)
3. Leveraging atomic-lti-test for testing
4. Maintaining type safety throughout

---

## Current State Analysis

### ✅ Completed Components

#### Axum Implementation Has:
- [x] Error handling (ToolError with IntoResponse)
- [x] LtiDependencies trait for dependency injection
- [x] Enhanced html module with HtmlBuilder
- [x] Enhanced url module with security features
- [x] Validation module (LtiLaunchValidator)
- [x] Deep linking handlers (deep_link.rs)
- [x] Dynamic registration handlers (dynamic_registration.rs)
- [x] Names and roles handler (names_and_roles.rs)
- [x] Test common module with TestLtiDeps

#### Dependencies Available:
- [x] atomic-lti (core LTI library)
- [x] atomic-lti-tool (reference implementation)
- [x] atomic-lti-test (testing helpers)
- [x] axum, axum-extra (framework)
- [x] All necessary supporting crates

### ✅ All Components Implemented

#### Core LTI Handlers:
- [x] init handler (init.rs) - OIDC initialization
- [x] jwks handler (jwks.rs) - Public keys endpoint
- [x] redirect handler (redirect.rs) - OIDC redirect
- [x] launch handler (launch.rs) - LTI launch

#### Helper Functions:
- [x] full_url() function in url.rs
- [x] Simple build_html() function in html.rs (for compatibility)

#### Tests:
- [x] init handler tests (embedded in init.rs)
- [x] jwks handler tests (embedded in jwks.rs)
- [x] redirect handler tests (embedded in redirect.rs)
- [x] launch handler tests (embedded in launch.rs)
- [x] All 21 tests passing

---

## Implementation Strategy

### Phase 1: Helper Functions
Before implementing handlers, we need helper functions that handlers depend on.

#### Task 1.1: Add full_url() to url.rs ✅
**File:** `src/url.rs`

**Purpose:** Build complete URL from Axum Request (equivalent to actix version)

**Implementation:**
```rust
pub fn full_url(req: &Request) -> String {
    let scheme = get_scheme_from_request(req);
    let host = get_host_from_request(req);
    let path_and_query = req.uri().path_and_query().map_or("", |pq| pq.as_str());
    format!("{}://{}{}", scheme, host, path_and_query)
}
```

**Reference:** `atomic-lti-tool/src/url.rs:4-10`

**Status:** ✅ Completed

---

#### Task 1.2: Add build_html() to html.rs ✅
**File:** `src/html.rs`

**Purpose:** Simple HTML builder compatible with actix version

**Implementation:**
```rust
pub fn build_html(head: &str, body: &str) -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
  <head>
    <style>.hidden {{ display: none !important; }}</style>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="/assets/styles.css" />
    {head}
  </head>
  <body>
    <noscript>...</noscript>
    {body}
  </body>
</html>"#
    )
}
```

**Reference:** `atomic-lti-tool/src/html.rs:3-30`

**Status:** ✅ Completed

---

### Phase 2: Core Handlers

#### Task 2.1: Implement jwks handler ✅
**File:** `src/handlers/jwks.rs`

**Purpose:** Serve public JWKS keys for JWT verification

**Key Points:**
- Simplest handler - good starting point
- Uses atomic-lti's `get_current_jwks()`
- Returns JSON response
- No form data, no cookies

**Implementation:**
- Handler implemented with State extractor
- Uses atomic-lti's `get_current_jwks()`
- Returns `Json<Jwks>` response
- Includes comprehensive tests

**Reference:** `atomic-lti-tool/src/handlers/jwks.rs`

**Status:** ✅ Completed - All tests passing

---

#### Task 2.2: Implement init handler ⏳
**File:** `src/handlers/init.rs`

**Purpose:** OIDC initialization with cookie-based state management

**Key Points:**
- Most complex handler due to cookies
- Uses atomic-lti's OIDC functions
- Needs axum-extra cookie support
- Two response types: redirect or HTML

**Implementation Steps:**
1. Define InitParams struct
2. Define InitSettings struct
3. Implement build_cookie helper for Axum cookies
4. Implement html() helper
5. Implement init() handler with State + Form extractors
6. Handle cookie detection logic
7. Add module to handlers.rs
8. Export types from lib.rs

**Reference:** `atomic-lti-tool/src/handlers/init.rs`

**Axum-specific considerations:**
- Use `axum_extra::extract::cookie::Cookie` instead of actix Cookie
- Use `State<Arc<T>>` for dependencies
- Use `Form<InitParams>` for form data
- Return `Result<Response, ToolError>` for mixed response types

**Status:** ✅ Completed - All tests passing

---

#### Task 2.3: Implement redirect handler ✅
**File:** `src/handlers/redirect.rs`

**Purpose:** Handle OIDC redirect, validate JWT, redirect to launch

**Key Points:**
- Uses atomic-lti's decode() and validate_launch()
- Returns HTML with auto-submit form
- Validates JWT against platform's JWK

**Implementation Steps:**
1. Define RedirectParams struct
2. Implement redirect_html() helper
3. Implement redirect() handler
4. Use atomic-lti's get_jwk_set() and decode()
5. Use atomic-lti's validate_launch()
6. Return Html response
7. Add module to handlers.rs
8. Export types from lib.rs

**Reference:** `atomic-lti-tool/src/handlers/redirect.rs`

**Status:** ✅ Completed - All tests passing

---

#### Task 2.4: Implement launch handler ✅
**File:** `src/handlers/launch.rs`

**Purpose:** Complete LTI launch with full validation

**Key Points:**
- Uses atomic-lti's validation and JWT handling
- Cookie-based state verification
- Builds JWT for client application
- Returns HTML with launch settings

**Implementation Steps:**
1. Define LaunchParams struct
2. Define LaunchSettings struct
3. Implement launch_html() helper
4. Implement setup_launch() helper
5. Implement launch() handler
6. Full JWT validation via atomic-lti
7. State and cookie verification
8. Add module to handlers.rs
9. Export types from lib.rs

**Reference:** `atomic-lti-tool/src/handlers/launch.rs`

**Status:** ✅ Completed - All tests passing

---

### Phase 3: Integration

#### Task 3.1: Update handlers.rs ✅
**File:** `src/handlers.rs`

Add module declarations:
```rust
pub mod init;
pub mod jwks;
pub mod launch;
pub mod redirect;
```

Add re-exports:
```rust
pub use init::*;
pub use jwks::*;
pub use launch::*;
pub use redirect::*;
```

**Status:** ✅ Completed

---

#### Task 3.2: Update lib.rs ✅
**File:** `src/lib.rs`

Ensure all new types are accessible:
- InitParams, InitSettings
- LaunchParams, LaunchSettings
- RedirectParams

**Status:** ✅ Completed

---

### Phase 4: Testing

#### Task 4.1: Embedded tests in jwks.rs ✅
**File:** `tests/test_jwks_handler.rs`

**Tests to implement:**
1. Returns JWKS with valid key store
2. Returns error with invalid key store
3. Caches JWKS properly

**Tests Implemented:**
1. Returns JWKS with valid key store ✅
2. Returns error with invalid key store ✅

**Reference:** `atomic-lti-tool/src/handlers/jwks.rs:17-78`

**Status:** ✅ Completed - All tests passing

---

#### Task 4.2: Embedded tests in init.rs ✅
**File:** `src/handlers/init.rs` (tests module)

**Tests Implemented:**
1. OIDC init success with cookie ✅
2. OIDC init without cookie (returns HTML) ✅

**Reference:** `atomic-lti-tool/src/handlers/init.rs:79-191`

**Status:** ✅ Completed - All tests passing

---

#### Task 4.3: Embedded tests in redirect.rs ✅
**File:** `src/handlers/redirect.rs` (tests module)

**Tests Implemented:**
1. Redirect success ✅
2. Invalid ID token ✅
3. Invalid OIDC state ✅

**Reference:** `atomic-lti-tool/src/handlers/redirect.rs:74-169`

**Status:** ✅ Completed - All tests passing

---

#### Task 4.4: Embedded tests in launch.rs ✅
**File:** `src/handlers/launch.rs` (tests module)

**Tests Implemented:**
1. Launch success ✅
2. Invalid ID token ✅
3. Invalid target link URI ✅
4. State not verified ✅

**Reference:** `atomic-lti-tool/src/handlers/launch.rs:111-321`

**Status:** ✅ Completed - All tests passing

---

#### Task 4.5: Run all tests ✅
**Command:** `cargo test --lib`

**Results:** ✅ 21 tests passed, 0 failed

**Status:** ✅ Completed - All tests passing

---

## Key Framework Differences (Actix → Axum)

### Request Handling
| Actix | Axum |
|-------|------|
| `HttpRequest` | `Request` |
| `web::Form<T>` | `Form<T>` |
| Direct params | Extractors |

### Response Types
| Actix | Axum |
|-------|------|
| `HttpResponse` | `Response` / `Html` / `Json` |
| `.body()` | Return from handler |
| `ResponseError` | `IntoResponse` |

### Cookies
| Actix | Axum |
|-------|------|
| `actix_web::cookie::Cookie` | `axum_extra::cookie::Cookie` |
| `.cookie()` method | Cookie jar middleware |
| Direct from request | Extract from headers |

### Dependency Injection
| Actix | Axum |
|-------|------|
| Function params | `State<Arc<T>>` |
| `&dyn Store` | Trait via State |

### Host/URL Extraction
| Actix | Axum |
|-------|------|
| `req.connection_info().host()` | `req.headers().get("host")` |
| `req.connection_info().scheme()` | `req.uri().scheme_str()` |

---

## Reuse Strategy

### From atomic-lti Library
- ✅ OIDC functions: `build_response_url()`, `build_relaunch_init_url()`
- ✅ JWT functions: `decode()`, `get_current_jwks()`
- ✅ Validation: `validate_launch()`
- ✅ Platform functions: `get_jwk_set()`
- ✅ All types: `IdToken`, `Jwks`, etc.
- ✅ Constants: `OPEN_ID_COOKIE_PREFIX`, etc.

### From atomic-lti-test Library
- ✅ Mock stores: `MockOIDCStateStore`, `MockPlatformStore`, `MockKeyStore`, `MockJwtStore`
- ✅ Test helpers: `generate_launch()`, `create_mock_platform_store()`

### From atomic-lti-tool (Reference Only)
- 📖 Handler structure and logic flow
- 📖 Test patterns
- ⚠️ DO NOT copy actix-specific code

---

## Progress Tracking

### Legend
- [ ] Not Started
- ⏳ In Progress
- ✅ Completed
- ❌ Blocked
- 🔄 Needs Review

### Overall Progress: 100% ✅

#### Phase 1: Helper Functions (2/2) ✅
- ✅ full_url() in url.rs
- ✅ build_html() in html.rs

#### Phase 2: Core Handlers (4/4) ✅
- ✅ jwks.rs
- ✅ init.rs
- ✅ redirect.rs
- ✅ launch.rs

#### Phase 3: Integration (2/2) ✅
- ✅ handlers.rs updates
- ✅ lib.rs updates

#### Phase 4: Testing (5/5) ✅
- ✅ jwks handler tests (embedded in jwks.rs)
- ✅ init handler tests (embedded in init.rs)
- ✅ redirect handler tests (embedded in redirect.rs)
- ✅ launch handler tests (embedded in launch.rs)
- ✅ All 21 tests passing

---

## Notes and Decisions

### Cookie Handling Approach
We'll need to handle cookies differently in Axum:
1. Extract cookies from request headers manually OR
2. Use axum-extra's cookie jar middleware
3. Build cookies using axum_extra::cookie::Cookie

**Decision:** Use manual cookie extraction from headers for consistency with existing pattern.

### Error Handling
The existing ToolError already implements IntoResponse, which is perfect for Axum. No changes needed.

### Testing Framework
Using axum-test crate (already in dev-dependencies) for integration testing.

---

## Success Criteria

✅ Implementation Complete:
- ✅ All 4 core handlers implemented (init, jwks, redirect, launch)
- ✅ All helper functions added
- ✅ All handlers properly exported
- ✅ All tests written and passing (21/21)
- ✅ No compilation errors
- ✅ Code follows existing patterns in codebase
- ✅ Documentation updated

## Final Implementation Summary

### What Was Implemented

1. **Helper Functions:**
   - `full_url()` in `src/url.rs` - Extracts complete URL from Axum request
   - `build_html()` in `src/html.rs` - Simple HTML builder matching actix version

2. **Core LTI 1.3 Handlers:**
   - `src/handlers/jwks.rs` - JWKS public keys endpoint
   - `src/handlers/init.rs` - OIDC initialization with cookie management
   - `src/handlers/redirect.rs` - OIDC redirect with JWT validation
   - `src/handlers/launch.rs` - LTI launch with full validation

3. **Integration:**
   - Updated `src/handlers.rs` to export all new handlers
   - All types properly exported from `lib.rs`

4. **Tests:**
   - 21 unit tests implemented across all handlers
   - All tests passing
   - Tests cover success cases and error cases
   - Uses atomic-lti-test helper functions

### Key Design Decisions

1. **Reused atomic-lti Library:**
   - All LTI logic from atomic-lti library
   - JWT handling via atomic-lti's `decode()` and `get_current_jwks()`
   - Validation via atomic-lti's `validate_launch()`
   - Platform management via atomic-lti stores

2. **Framework Adaptations:**
   - Axum State extractor for dependency injection
   - Form extractor for POST parameters
   - Html response type for HTML returns
   - Json response type for JWKS
   - Cookie handling via axum-extra

3. **Test Strategy:**
   - Embedded tests in handler files (not separate test files)
   - Mock dependencies using atomic-lti-test
   - Used mockito for HTTP mocking
   - Static LazyLock for singleton test dependencies

### Files Created/Modified

**Created:**
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/docs/implementation-plan.md`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/init.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/jwks.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/redirect.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/launch.rs`

**Modified:**
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/Cargo.toml` - Added mockito dev dependency
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers.rs` - Added module declarations and exports
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/html.rs` - Added build_html() function
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/url.rs` - Added full_url() function

### Test Results

```
running 21 tests
test handlers::jwks::tests::returns_error_with_invalid_key_store ... ok
test handlers::redirect::tests::test_redirect_invalid_id_token ... ok
test html::tests::test_build_error_page ... ok
test html::tests::test_build_form_page ... ok
test html::tests::test_html_builder_basic ... ok
test url::tests::test_append_query_params ... ok
test url::tests::test_build_oidc_auth_url ... ok
test handlers::init::tests::test_oidc_init_without_cookie_returns_html ... ok
test handlers::init::tests::test_oidc_init_with_cookie_success ... ok
test url::tests::test_build_query_string ... ok
test url::tests::test_extract_domain ... ok
test url::tests::test_is_secure_url ... ok
test url::tests::test_parse_query_string ... ok
test url::tests::test_validate_redirect_url ... ok
test handlers::jwks::tests::returns_jwks_with_valid_key_store ... ok
test handlers::launch::tests::test_launch_invalid_id_token ... ok
test handlers::redirect::tests::test_redirect_invalid_oidc_state ... ok
test handlers::redirect::tests::test_redirect_success ... ok
test handlers::launch::tests::test_launch_state_not_verified ... ok
test handlers::launch::tests::test_launch_invalid_target_link_uri ... ok
test handlers::launch::tests::test_launch_success ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

---

## Timeline Estimate

Based on complexity and dependencies:

1. **Phase 1 (Helpers):** 30 minutes
2. **Phase 2 (Handlers):** 2-3 hours
   - jwks: 20 min
   - init: 60 min
   - redirect: 40 min
   - launch: 60 min
3. **Phase 3 (Integration):** 15 minutes
4. **Phase 4 (Testing):** 2 hours

**Total Estimated Time:** 4.5-5.5 hours

---

## References

### Source Files (atomic-lti-tool - Actix)
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool/src/handlers/init.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool/src/handlers/jwks.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool/src/handlers/redirect.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool/src/handlers/launch.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool/src/html.rs`
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool/src/url.rs`

### Target Files (atomic-lti-tool-axum - Axum)
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/init.rs` (new)
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/jwks.rs` (new)
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/redirect.rs` (new)
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/handlers/launch.rs` (new)
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/html.rs` (update)
- `/Users/jbasdf/projects/atomic-forge/atomic-lti-tool-axum/src/url.rs` (update)

### Library References
- atomic-lti: `/Users/jbasdf/projects/atomic-forge/atomic-lti/src/`
- atomic-lti-test: `/Users/jbasdf/projects/atomic-forge/atomic-lti-test/src/`

---

**End of Implementation Plan**
