# Atomic Decay Launch Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hello World view on Atomic Decay's LTI launch page with a styled diagnostic UI that exposes decoded LTI claims, the raw tool JWT, and the HTTP request context via three toggle buttons, all in the project's black/yellow palette.

**Architecture:** The Rust launch handler (`handlers/lti.rs::launch`) already validates the id_token, mints a tool JWT, and emits `LAUNCH_SETTINGS` JSON into the returned HTML shell. We extend that JSON with three new blocks (`idTokenClaims`, `launchInfo`, `httpContext`), instrument the five existing awaits with timing checkpoints, and rewrite `client/app.ts` (plain TypeScript, no framework) into a small set of render functions that paint the diagnostic shell and three collapsible panels. Styling is inlined from the TS bundle, with all dynamic values routed through a single `escapeHtml()` helper before reaching the DOM. No Vite CSS wiring is added.

**Tech Stack:** Rust + Axum (server), TypeScript + Vite (client), `@atomicjolt/lti-client` for the LTI handshake, `serde_json` for JSON serialization, `chrono` for timestamps, `cargo nextest` for Rust tests.

**Spec:** `docs/superpowers/specs/2026-04-22-atomic-decay-launch-diagnostics-design.md`

**Security note for implementers:** `client/app.ts` assigns strings to `document.body.innerHTML` and to per-section container `.innerHTML`. Every interpolated value in those template literals passes through `escapeHtml()` (defined in Task 5). Static markup is a fixed literal. Do not introduce any interpolation path that skips `escapeHtml()`. If you need to insert already-encoded HTML (e.g. pre-rendered markup from a trusted function), route it through a local variable whose name begins with `safe_` so review can spot it at a glance.

---

## File Structure

**Created:**
- `atomic-decay/src/handlers/launch_diagnostics.rs` — helpers for timings, HTTP context, and the settings-JSON builder. Kept separate from `handlers/lti.rs` so the 500-line launch module does not grow further and the new pure functions are easy to unit-test.

**Modified:**
- `atomic-decay/src/handlers/lti.rs` — call the helpers; extend the `LAUNCH_SETTINGS` JSON literal.
- `atomic-decay/src/handlers.rs` — register the new module.
- `atomic-decay/client/app.ts` — full rewrite (Hello World → diagnostic shell + 3 panels).
- `atomic-decay/types.d.ts` — widen `Window.LAUNCH_SETTINGS` with the three new optional blocks.

**Not modified:**
- Existing routes (`src/routes.rs`), OIDC init, redirect, deep-link service, NRPS service. Their behavior is unchanged.
- `@atomicjolt/lti-client` package — we extend its `LaunchSettings` type locally, not upstream.

---

## Task 1: Add `LaunchTimings` helper (pure Rust, unit-tested)

**Files:**
- Create: `atomic-decay/src/handlers/launch_diagnostics.rs`
- Modify: `atomic-decay/src/handlers.rs`

### Steps

- [ ] **Step 1: Create the module file with a failing test**

Create `atomic-decay/src/handlers/launch_diagnostics.rs`:

```rust
use std::time::Instant;

/// Records wall-clock checkpoints across the LTI launch pipeline so the
/// diagnostic page can show where time was spent.
pub struct LaunchTimings {
  start: Instant,
  last: Instant,
  spans: Vec<(&'static str, u128)>,
}

impl LaunchTimings {
  pub fn start() -> Self {
    let now = Instant::now();
    Self {
      start: now,
      last: now,
      spans: Vec::with_capacity(5),
    }
  }

  /// Record the milliseconds elapsed since the previous checkpoint (or
  /// since `start()` for the first checkpoint).
  pub fn checkpoint(&mut self, label: &'static str) {
    let now = Instant::now();
    let ms = now.duration_since(self.last).as_millis();
    self.spans.push((label, ms));
    self.last = now;
  }

  /// Serialize checkpoints into a `{label: ms, ..., "total": ms}` JSON map.
  pub fn to_json(&self) -> serde_json::Value {
    let mut map = serde_json::Map::new();
    for (label, ms) in &self.spans {
      map.insert((*label).to_string(), serde_json::json!(ms));
    }
    let total = self.start.elapsed().as_millis();
    map.insert("total".to_string(), serde_json::json!(total));
    serde_json::Value::Object(map)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn timings_record_checkpoints_in_order_and_total_is_nonzero() {
    let mut t = LaunchTimings::start();
    std::thread::sleep(std::time::Duration::from_millis(2));
    t.checkpoint("phase_a");
    std::thread::sleep(std::time::Duration::from_millis(2));
    t.checkpoint("phase_b");

    let json = t.to_json();
    let obj = json.as_object().expect("timings json is an object");

    assert!(obj.contains_key("phase_a"), "phase_a missing: {json}");
    assert!(obj.contains_key("phase_b"), "phase_b missing: {json}");
    assert!(obj.contains_key("total"), "total missing: {json}");

    let total = obj.get("total").and_then(|v| v.as_u64()).unwrap();
    let a = obj.get("phase_a").and_then(|v| v.as_u64()).unwrap();
    let b = obj.get("phase_b").and_then(|v| v.as_u64()).unwrap();

    assert!(a >= 1, "phase_a should be >=1ms, got {a}");
    assert!(b >= 1, "phase_b should be >=1ms, got {b}");
    assert!(total >= a + b, "total ({total}) should be >= a+b ({})", a + b);
  }
}
```

Register the module. Add the following line to `atomic-decay/src/handlers.rs` next to the existing `pub mod lti;` entries:

```rust
pub mod launch_diagnostics;
```

- [ ] **Step 2: Run the test to verify it passes**

```bash
cd atomic-decay
cargo test --lib launch_diagnostics -- --nocapture
```

Expected: `test handlers::launch_diagnostics::tests::timings_record_checkpoints_in_order_and_total_is_nonzero ... ok`

- [ ] **Step 3: Commit**

```bash
cd atomic-decay
git add src/handlers/launch_diagnostics.rs src/handlers.rs
git commit -m "feat(decay): add LaunchTimings helper for launch diagnostics"
```

---

## Task 2: Add `build_http_context` helper (pure function, unit-tested)

**Files:**
- Modify: `atomic-decay/src/handlers/launch_diagnostics.rs`

### Steps

- [ ] **Step 1: Add a failing test at the bottom of `launch_diagnostics.rs`**

Append inside the existing `#[cfg(test)] mod tests` block (keep the `timings_record_checkpoints_in_order_and_total_is_nonzero` test intact):

```rust
  #[test]
  fn http_context_extracts_headers_cookies_host_and_ua() {
    use axum::http::HeaderMap;
    use axum::http::HeaderValue;

    let mut headers = HeaderMap::new();
    headers.insert("host", HeaderValue::from_static("decay.example.com"));
    headers.insert("user-agent", HeaderValue::from_static("UA/1.0"));
    headers.insert("x-forwarded-proto", HeaderValue::from_static("https"));
    headers.insert("x-forwarded-for", HeaderValue::from_static("203.0.113.7, 10.0.0.1"));
    headers.insert("cookie", HeaderValue::from_static("a=1; b=two; c=three"));

    let ctx = build_http_context(&headers, "POST", "/lti/launch");
    let obj = ctx.as_object().unwrap();

    assert_eq!(obj["host"].as_str().unwrap(), "decay.example.com");
    assert_eq!(obj["scheme"].as_str().unwrap(), "https");
    assert_eq!(obj["method"].as_str().unwrap(), "POST");
    assert_eq!(obj["path"].as_str().unwrap(), "/lti/launch");
    assert_eq!(obj["userAgent"].as_str().unwrap(), "UA/1.0");
    assert_eq!(obj["clientIp"].as_str().unwrap(), "203.0.113.7");

    let headers_map = obj["headers"].as_object().unwrap();
    assert!(headers_map.contains_key("host"));
    assert!(headers_map.contains_key("cookie"));

    let cookies = obj["cookies"].as_object().unwrap();
    assert_eq!(cookies["a"].as_str().unwrap(), "1");
    assert_eq!(cookies["b"].as_str().unwrap(), "two");
    assert_eq!(cookies["c"].as_str().unwrap(), "three");
  }

  #[test]
  fn http_context_handles_missing_optional_headers() {
    use axum::http::HeaderMap;

    let headers = HeaderMap::new();
    let ctx = build_http_context(&headers, "POST", "/lti/launch");
    let obj = ctx.as_object().unwrap();

    assert_eq!(obj["host"].as_str().unwrap(), "");
    assert_eq!(obj["scheme"].as_str().unwrap(), "https");
    assert!(obj["userAgent"].is_null());
    assert!(obj["clientIp"].is_null());
    assert!(obj["cookies"].as_object().unwrap().is_empty());
  }
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd atomic-decay
cargo test --lib launch_diagnostics::tests::http_context 2>&1 | tail -5
```

Expected: `error[E0425]: cannot find function 'build_http_context' in this scope`.

- [ ] **Step 3: Implement `build_http_context`**

Add at the top of `atomic-decay/src/handlers/launch_diagnostics.rs` (above the `LaunchTimings` struct, below `use std::time::Instant;`):

```rust
use axum::http::HeaderMap;
use std::collections::BTreeMap;

/// Build the `httpContext` block for `LAUNCH_SETTINGS`. Produces a JSON
/// object with host, scheme, method, path, user agent, client IP, the
/// full header map (lowercased keys), and parsed cookies.
///
/// This is intentionally un-redacted — the page it feeds is served only
/// to the user who just authenticated, viewing their own session.
pub fn build_http_context(
  headers: &HeaderMap,
  method: &str,
  path: &str,
) -> serde_json::Value {
  let header_str = |name: &str| -> Option<String> {
    headers
      .get(name)
      .and_then(|v| v.to_str().ok())
      .map(str::to_string)
  };

  let host = header_str("host").unwrap_or_default();
  let scheme = header_str("x-forwarded-proto").unwrap_or_else(|| "https".to_string());
  let user_agent = header_str("user-agent");

  // X-Forwarded-For is a comma-separated list; the original client is the
  // first entry. Everything after is intermediate proxies (e.g. cloudflared).
  let client_ip = header_str("x-forwarded-for").map(|v| {
    v.split(',')
      .next()
      .map(|s| s.trim().to_string())
      .unwrap_or(v)
  });

  // Headers: lowercased names -> string values. BTreeMap for stable
  // ordering in the rendered diagnostic table.
  let mut header_map: BTreeMap<String, String> = BTreeMap::new();
  for (name, value) in headers.iter() {
    if let Ok(v) = value.to_str() {
      header_map.insert(name.as_str().to_lowercase(), v.to_string());
    }
  }

  // Cookies: parsed from the Cookie header.
  let mut cookie_map: BTreeMap<String, String> = BTreeMap::new();
  if let Some(cookie_header) = header_str("cookie") {
    for pair in cookie_header.split(';') {
      let trimmed = pair.trim();
      if trimmed.is_empty() {
        continue;
      }
      match trimmed.split_once('=') {
        Some((k, v)) => {
          cookie_map.insert(k.trim().to_string(), v.trim().to_string());
        }
        None => {
          cookie_map.insert(trimmed.to_string(), String::new());
        }
      }
    }
  }

  serde_json::json!({
    "host": host,
    "scheme": scheme,
    "method": method,
    "path": path,
    "userAgent": user_agent,
    "clientIp": client_ip,
    "headers": header_map,
    "cookies": cookie_map,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd atomic-decay
cargo test --lib launch_diagnostics 2>&1 | tail -10
```

Expected: three passing tests — `timings_record_checkpoints_in_order_and_total_is_nonzero`, `http_context_extracts_headers_cookies_host_and_ua`, `http_context_handles_missing_optional_headers`.

- [ ] **Step 5: Commit**

```bash
cd atomic-decay
git add src/handlers/launch_diagnostics.rs
git commit -m "feat(decay): add build_http_context helper with header/cookie parsing"
```

---

## Task 3: Wire timings, HTTP context, and id_token claims into `LAUNCH_SETTINGS`

**Files:**
- Modify: `atomic-decay/src/handlers/lti.rs` (the `launch` function, lines 321-411)

### Steps

- [ ] **Step 1: Thread `LaunchTimings` through the five validation awaits**

In `atomic-decay/src/handlers/lti.rs`, locate the `launch` function (starts at line 321). Replace the body from `let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;` (line 341) through `let encoded_jwt = jwt_store.build_jwt(&id_token).await?;` (line 393) with the following instrumented version:

```rust
  let mut timings = crate::handlers::launch_diagnostics::LaunchTimings::start();

  let oidc_state_store = deps.init_oidc_state_store(&params.state).await?;
  timings.checkpoint("oidcStateLookup");

  let id_token_decoded = atomic_lti::jwt::insecure_decode::<IdToken>(&params.id_token)
    .map_err(|e| ToolError::Unauthorized(format!("Failed to decode ID token: {}", e)))?;

  let platform_store = deps.create_platform_store(&id_token_decoded.claims.iss).await?;

  let jwk_server_url = platform_store.get_jwk_server_url().await?;
  let jwk_set = get_jwk_set(jwk_server_url).await?;
  timings.checkpoint("jwkFetch");

  let id_token = atomic_lti::jwks::decode(&params.id_token, &jwk_set)?;
  timings.checkpoint("jwtDecode");

  atomic_lti::validate::validate_launch(&params.state, &oidc_state_store, &id_token).await?;
  let _ = oidc_state_store.destroy().await;
  timings.checkpoint("jwtValidation");

  let requested_url = format!("https://{}/lti/launch", host);
  let parsed_target_link_uri = url::Url::parse(&id_token.target_link_uri)
    .map_err(|e| ToolError::Unauthorized(format!("Invalid target link URI in ID token: {e}")))?;

  if parsed_target_link_uri.to_string() != requested_url {
    return Err(ToolError::Unauthorized(format!(
      "Invalid target link URI. Expected: {requested_url}, Got: {parsed_target_link_uri}"
    )));
  }

  let state_cookie_name = format!("{}{}", OPEN_ID_COOKIE_PREFIX, &params.state);
  let state_verified = headers
    .get("cookie")
    .and_then(|c| c.to_str().ok())
    .and_then(|cookies| {
      cookies.split(';')
        .find(|c| c.trim().starts_with(&format!("{}=", state_cookie_name)))
        .map(|c| c.trim().ends_with("=1"))
    })
    .unwrap_or(false);

  let storage_target = params.lti_storage_target.as_deref().unwrap_or("");
  if storage_target.is_empty() && !state_verified {
    return Err(ToolError::Unauthorized(
      "Unable to securely launch tool. Please ensure cookies are enabled".to_string(),
    ));
  }

  let platform_oidc_url = platform_store.get_oidc_url().await?;
  let lti_storage_params = LTIStorageParams {
    target: storage_target.to_string(),
    platform_oidc_url,
  };

  let jwt_store = ToolJwtStore {
    key_store: Arc::new(DBKeyStore::new(&app_state.pool, &app_state.jwk_passphrase)),
    host: host.clone(),
  };

  let encoded_jwt = jwt_store.build_jwt(&id_token).await?;
  timings.checkpoint("toolJwtMint");
```

- [ ] **Step 2: Replace the `settings` JSON literal with the extended shape**

Immediately below the `let encoded_jwt = ...` line (still inside `launch`), replace the existing `let settings = serde_json::json!({ ... });` literal (lines 398-404) with:

```rust
  let http_context = crate::handlers::launch_diagnostics::build_http_context(
    &headers,
    "POST",
    "/lti/launch",
  );

  // Merge server-side timings into the http_context block. We do this
  // after build_http_context so the helper remains a pure function of
  // HeaderMap + method + path (easy to unit-test).
  let mut http_context = http_context;
  if let Some(obj) = http_context.as_object_mut() {
    obj.insert("timingsMs".to_string(), timings.to_json());
  }

  let launch_info = serde_json::json!({
    "platformIss": id_token.iss,
    "clientId": id_token.client_id(),
    "deploymentId": id_token.deployment_id,
    "targetLinkUri": id_token.target_link_uri,
    "messageType": id_token.message_type,
    "ltiVersion": id_token.lti_version,
    "launchedAt": chrono::Utc::now().to_rfc3339(),
  });

  let settings = serde_json::json!({
    "stateVerified": state_verified,
    "state": params.state,
    "ltiStorageParams": lti_storage_params,
    "jwt": encoded_jwt,
    "deepLinking": id_token.deep_linking,
    "idTokenClaims": id_token,
    "launchInfo": launch_info,
    "httpContext": http_context,
  });
```

The existing lines that follow (`let settings_json = serde_json::to_string(&settings)?;` through the end of the function) remain unchanged.

- [ ] **Step 3: Verify the crate compiles**

```bash
cd atomic-decay
cargo check 2>&1 | tail -20
```

Expected: `Finished \`dev\` profile` with no errors. `chrono` is already in the dependency graph via `ToolJwtStore`; if `cargo check` reports that `chrono::Utc` is not resolved from inside `handlers/lti.rs`, add `use chrono::Utc;` near the other `use` lines and change the call to `Utc::now().to_rfc3339()`.

- [ ] **Step 4: Run all existing tests to confirm no regressions**

```bash
cd atomic-decay
cargo test --lib 2>&1 | tail -15
```

Expected: all tests pass. Existing tests do not assert on the shape of `LAUNCH_SETTINGS`, so they should be unaffected.

- [ ] **Step 5: Commit**

```bash
cd atomic-decay
git add src/handlers/lti.rs
git commit -m "feat(decay): extend LAUNCH_SETTINGS with id_token claims, launch info, http context, timings"
```

---

## Task 4: Extend client-side `LaunchSettings` type

**Files:**
- Modify: `atomic-decay/types.d.ts`

### Steps

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `atomic-decay/types.d.ts` with:

```ts
import 'vite/client';
import type { InitSettings, LaunchSettings } from '@atomicjolt/lti-client';

export interface ResponseError {
  message: string;
}

export interface LaunchInfo {
  platformIss: string;
  clientId: string;
  deploymentId: string;
  targetLinkUri: string;
  messageType: string;
  ltiVersion: string;
  launchedAt: string;
}

export interface HttpTimings {
  oidcStateLookup?: number;
  jwkFetch?: number;
  jwtDecode?: number;
  jwtValidation?: number;
  toolJwtMint?: number;
  total?: number;
  [label: string]: number | undefined;
}

export interface HttpContext {
  host: string;
  scheme: string;
  method: string;
  path: string;
  userAgent: string | null;
  clientIp: string | null;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  timingsMs?: HttpTimings;
}

export interface DiagnosticLaunchSettings extends LaunchSettings {
  idTokenClaims?: Record<string, unknown>;
  launchInfo?: LaunchInfo;
  httpContext?: HttpContext;
}

declare global {
  interface Window {
    INIT_SETTINGS: InitSettings;
    LAUNCH_SETTINGS: DiagnosticLaunchSettings;
  }
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
cd atomic-decay
npx tsc --noEmit
```

Expected: no output (success). If `tsc` is not configured at the project root, run `npm run build` instead — Vite runs the type check during bundling.

- [ ] **Step 3: Commit**

```bash
cd atomic-decay
git add types.d.ts
git commit -m "feat(decay): widen LaunchSettings type with diagnostic fields"
```

---

## Task 5: Rewrite `client/app.ts` — shell, inline styles, summary card

This task replaces `app.ts` with a new skeleton that renders the styled shell and a launch-summary card. Tasks 6 and 7 add the panels and the preserved Deep Linking / NRPS flows.

Dynamic values are always routed through the `escapeHtml()` helper before interpolation into template literals. Do not bypass this helper. Static markup is a fixed literal.

**Files:**
- Modify: `atomic-decay/client/app.ts` (full rewrite)

### Steps

- [ ] **Step 1: Replace `app.ts` with the shell**

Overwrite `atomic-decay/client/app.ts` with the content saved alongside this plan at `docs/superpowers/plans/assets/2026-04-23-atomic-decay-launch-diagnostics/app.ts.step5`. The file content is reproduced literally below so this plan remains self-contained — no external files are actually required by the plan, but if a future refactor factors out the TS template literals, that path is the intended home.

File content to write:

```ts
import { ltiLaunch } from '@atomicjolt/lti-client';
import type { DiagnosticLaunchSettings } from '../types';

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #e5e5e5; line-height: 1.5; }
  .decay-header { padding: 1.25rem 2rem; border-bottom: 3px solid rgb(255, 221, 0); display: flex; align-items: baseline; gap: 1rem; }
  .decay-header h1 { margin: 0; font-size: 1.25rem; color: #fff; }
  .decay-header .accent { color: rgb(255, 221, 0); font-weight: 600; }
  .decay-container { max-width: 1100px; margin: 0 auto; padding: 2rem; }
  .decay-card { background: #1a1a1a; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .decay-card h2 { margin: 0 0 1rem 0; color: rgb(255, 221, 0); font-size: 1.25rem; }
  .decay-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
  .decay-summary-grid dt { color: #999; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .decay-summary-grid dd { margin: 0.25rem 0 0 0; color: #fff; word-break: break-word; }
  .decay-role-badge { display: inline-block; background: rgb(255, 221, 0); color: #000; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; margin: 0.15rem 0.25rem 0.15rem 0; }
  .decay-buttons { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
  .decay-btn { background: rgb(255, 221, 0); color: #000; border: none; padding: 0.65rem 1.25rem; border-radius: 5px; font-weight: 600; cursor: pointer; font-size: 0.95rem; transition: transform 0.15s, box-shadow 0.15s; }
  .decay-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(255, 221, 0, 0.25); }
  .decay-btn.active { background: #fff; }
  .decay-btn.secondary { background: #333; color: #fff; }
  .decay-claim-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .decay-claim-table th, .decay-claim-table td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #2a2a2a; vertical-align: top; }
  .decay-claim-table th { color: rgb(255, 221, 0); font-weight: 600; }
  .decay-claim-table .key { color: #fff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; }
  .decay-claim-table .value { color: #ccc; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; white-space: pre-wrap; word-break: break-all; max-width: 400px; }
  .decay-claim-table .explain { color: #888; font-size: 0.85rem; }
  .decay-pre { background: #000; color: rgb(255, 221, 0); border: 1px solid #333; padding: 1rem; border-radius: 5px; overflow-x: auto; font-size: 0.8rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-all; }
  .decay-subsection { margin-bottom: 1.25rem; }
  .decay-subsection h3 { margin: 0 0 0.5rem 0; font-size: 1rem; color: rgb(255, 221, 0); }
  .decay-timing-row { display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid #2a2a2a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; }
  .decay-timing-row .label { color: #ccc; }
  .decay-timing-row .ms { color: rgb(255, 221, 0); }
  .decay-error { background: #2a0000; border: 1px solid #b00; border-radius: 5px; padding: 1rem 1.25rem; color: #ffb3b3; }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortRole(uri: string): string {
  const hash = uri.lastIndexOf('#');
  if (hash >= 0) return uri.slice(hash + 1);
  const slash = uri.lastIndexOf('/');
  return slash >= 0 ? uri.slice(slash + 1) : uri;
}

function injectStyles(): void {
  const style = document.createElement('style');
  style.id = 'decay-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function buildShellHtml(settings: DiagnosticLaunchSettings): string {
  const claims = settings.idTokenClaims as Record<string, unknown> | undefined;
  const info = settings.launchInfo;

  const userName = (claims?.['name'] as string) || (claims?.['email'] as string) || '(not provided)';
  const rolesRaw = claims?.['https://purl.imsglobal.org/spec/lti/claim/roles'];
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : [];
  const context = claims?.['https://purl.imsglobal.org/spec/lti/claim/context'] as
    | { title?: string; label?: string; id?: string }
    | undefined;
  const contextTitle = context?.title || context?.label || context?.id || '(no context)';
  const platform = info?.platformIss || '(unknown)';

  const rolesHtml = roles.length > 0
    ? roles.map(r => `<span class="decay-role-badge">${escapeHtml(shortRole(r))}</span>`).join('')
    : '<span style="color:#888;">(no roles)</span>';

  return `
    <header class="decay-header">
      <h1>Atomic <span class="accent">Decay</span></h1>
      <span style="color:#888;">LTI Launch Diagnostics</span>
    </header>
    <main class="decay-container">
      <section class="decay-card">
        <h2>Launch Summary</h2>
        <dl class="decay-summary-grid">
          <div><dt>User</dt><dd>${escapeHtml(userName)}</dd></div>
          <div><dt>Roles</dt><dd>${rolesHtml}</dd></div>
          <div><dt>Context</dt><dd>${escapeHtml(contextTitle)}</dd></div>
          <div><dt>Platform</dt><dd>${escapeHtml(platform)}</dd></div>
          <div><dt>Client ID</dt><dd>${escapeHtml(info?.clientId || '(unknown)')}</dd></div>
          <div><dt>Deployment</dt><dd>${escapeHtml(info?.deploymentId || '(unknown)')}</dd></div>
        </dl>
      </section>
      <div class="decay-buttons" id="decay-buttons"></div>
      <div id="decay-panels"></div>
      <div id="decay-extras"></div>
    </main>
  `;
}

function renderShell(settings: DiagnosticLaunchSettings): void {
  document.body.innerHTML = buildShellHtml(settings);
}

function renderError(message: string): void {
  document.body.innerHTML = `
    <header class="decay-header">
      <h1>Atomic <span class="accent">Decay</span></h1>
    </header>
    <main class="decay-container">
      <div class="decay-error">
        <strong>Launch failed.</strong> ${escapeHtml(message)}
      </div>
    </main>
  `;
}

const launchSettings: DiagnosticLaunchSettings = window.LAUNCH_SETTINGS;

ltiLaunch(launchSettings)
  .then(valid => {
    injectStyles();
    if (!valid) {
      renderError('ltiLaunch() returned false. State verification failed or platform storage was unavailable.');
      return;
    }
    renderShell(launchSettings);
  })
  .catch(err => {
    injectStyles();
    renderError(err instanceof Error ? err.message : String(err));
  });
```

- [ ] **Step 2: Build the client bundle to verify it compiles**

```bash
cd atomic-decay
npm run build 2>&1 | tail -10
```

Expected: the build completes and emits `src/assets/js/app-*.js` and `assets.json`. No type errors.

- [ ] **Step 3: Commit**

```bash
cd atomic-decay
git add client/app.ts
git commit -m "feat(decay): rewrite launch client shell with styled diagnostic summary"
```

---

## Task 6: Add the three diagnostic panels (claims / raw / HTTP context)

**Files:**
- Modify: `atomic-decay/client/app.ts`

### Steps

- [ ] **Step 1: Add the `CLAIM_EXPLANATIONS` map and the three renderers**

Insert the following block in `app.ts` immediately **after** the `escapeHtml`/`shortRole` helpers and **before** the `injectStyles` function:

```ts
const CLAIM_EXPLANATIONS: Record<string, string> = {
  iss: 'Issuer — the LMS platform that issued this id_token.',
  sub: 'Subject — the LMS-assigned user ID (stable per platform+client).',
  aud: 'Audience — the client_id this token was issued for.',
  azp: 'Authorized party — client_id when multiple audiences are present.',
  exp: 'Expiration (unix seconds). Tokens past this value must be rejected.',
  iat: 'Issued-at (unix seconds).',
  nonce: 'Replay-protection nonce. Must match the one the tool sent in the OIDC auth request.',
  name: 'User full name.',
  given_name: 'User first name.',
  family_name: 'User last name.',
  email: 'User email address (may be absent depending on platform privacy settings).',
  locale: 'User locale, e.g. "en-US".',
  picture: 'URL to the user profile picture.',
  'https://purl.imsglobal.org/spec/lti/claim/message_type':
    'LTI message type, e.g. LtiResourceLinkRequest or LtiDeepLinkingRequest.',
  'https://purl.imsglobal.org/spec/lti/claim/version': 'LTI specification version (1.3.0).',
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id':
    'Deployment ID — identifies this specific install of the tool within the platform.',
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri':
    'The URL the platform is redirecting the user to (should match /lti/launch).',
  'https://purl.imsglobal.org/spec/lti/claim/resource_link':
    'Resource-link claim — identifies the specific assignment/placement being launched.',
  'https://purl.imsglobal.org/spec/lti/claim/roles':
    'Array of role URIs assigned to this user in the current context.',
  'https://purl.imsglobal.org/spec/lti/claim/role_scope_mentor':
    'User IDs the current user (as a mentor) is authorized to view.',
  'https://purl.imsglobal.org/spec/lti/claim/context':
    'Context claim — the course/group the launch is happening in.',
  'https://purl.imsglobal.org/spec/lti/claim/tool_platform':
    'Platform metadata: product name, vendor, version, etc.',
  'https://purl.imsglobal.org/spec/lti/claim/launch_presentation':
    'How the tool should present itself (iframe/window) and where to return.',
  'https://purl.imsglobal.org/spec/lti/claim/lis':
    'Learning Information Services claim — SIS identifiers for user and course.',
  'https://purl.imsglobal.org/spec/lti/claim/custom':
    'Custom parameters configured on the platform for this tool.',
  'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings':
    'Deep Linking request parameters — present only on DL launches.',
  'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice':
    'Names and Roles service endpoint for fetching the course roster.',
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint':
    'Assignment and Grade Services endpoints for score passback.',
};

function explainClaim(key: string): string {
  return CLAIM_EXPLANATIONS[key] || 'Platform-specific or custom claim.';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function decodeJwtPayload(jwt: string): unknown {
  if (!jwt) return null;
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '==='.slice((payload.length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch (e) {
    return `(failed to decode: ${e instanceof Error ? e.message : String(e)})`;
  }
}

function renderClaimsPanel(claims: Record<string, unknown> | undefined): string {
  if (!claims || Object.keys(claims).length === 0) {
    return '<div class="decay-card"><p style="color:#888;">No id_token claims were forwarded to the browser.</p></div>';
  }
  const rows = Object.entries(claims)
    .map(
      ([k, v]) => `
        <tr>
          <td class="key">${escapeHtml(k)}</td>
          <td class="value">${escapeHtml(formatValue(v))}</td>
          <td class="explain">${escapeHtml(explainClaim(k))}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="decay-card">
      <h2>LTI Claims (annotated)</h2>
      <table class="decay-claim-table">
        <thead><tr><th>Claim</th><th>Value</th><th>Meaning</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderRawPanel(settings: DiagnosticLaunchSettings): string {
  const decodedToolJwt = decodeJwtPayload(settings.jwt);
  return `
    <div class="decay-card">
      <h2>Raw JWT &amp; Launch Data</h2>
      <div class="decay-subsection">
        <h3>Tool JWT (raw)</h3>
        <pre class="decay-pre">${escapeHtml(settings.jwt || '')}</pre>
      </div>
      <div class="decay-subsection">
        <h3>Tool JWT payload (decoded)</h3>
        <pre class="decay-pre">${escapeHtml(formatValue(decodedToolJwt))}</pre>
      </div>
      <div class="decay-subsection">
        <h3>Platform id_token claims (decoded)</h3>
        <pre class="decay-pre">${escapeHtml(formatValue(settings.idTokenClaims))}</pre>
      </div>
      <div class="decay-subsection">
        <h3>Full LAUNCH_SETTINGS</h3>
        <pre class="decay-pre">${escapeHtml(formatValue(settings))}</pre>
      </div>
    </div>
  `;
}

function renderHttpPanel(ctx: DiagnosticLaunchSettings['httpContext']): string {
  if (!ctx) {
    return '<div class="decay-card"><p style="color:#888;">No HTTP context was forwarded.</p></div>';
  }
  const headerRows = Object.entries(ctx.headers || {})
    .map(([k, v]) => `<tr><td class="key">${escapeHtml(k)}</td><td class="value">${escapeHtml(v)}</td></tr>`)
    .join('');
  const cookieEntries = Object.entries(ctx.cookies || {});
  const cookieRows = cookieEntries.length > 0
    ? cookieEntries
        .map(([k, v]) => `<tr><td class="key">${escapeHtml(k)}</td><td class="value">${escapeHtml(v)}</td></tr>`)
        .join('')
    : '<tr><td colspan="2" style="color:#888;">(no cookies)</td></tr>';
  const timingRows = ctx.timingsMs
    ? Object.entries(ctx.timingsMs)
        .map(
          ([label, ms]) =>
            `<div class="decay-timing-row"><span class="label">${escapeHtml(label)}</span><span class="ms">${Number(ms)} ms</span></div>`,
        )
        .join('')
    : '<p style="color:#888;">(no timings recorded)</p>';

  return `
    <div class="decay-card">
      <h2>HTTP Context</h2>
      <div class="decay-subsection">
        <h3>Request</h3>
        <dl class="decay-summary-grid">
          <div><dt>Host</dt><dd>${escapeHtml(ctx.host)}</dd></div>
          <div><dt>Scheme</dt><dd>${escapeHtml(ctx.scheme)}</dd></div>
          <div><dt>Method</dt><dd>${escapeHtml(ctx.method)}</dd></div>
          <div><dt>Path</dt><dd>${escapeHtml(ctx.path)}</dd></div>
          <div><dt>User-Agent</dt><dd>${escapeHtml(ctx.userAgent || '(none)')}</dd></div>
          <div><dt>Client IP</dt><dd>${escapeHtml(ctx.clientIp || '(none)')}</dd></div>
        </dl>
      </div>
      <div class="decay-subsection">
        <h3>Server timings</h3>
        ${timingRows}
      </div>
      <div class="decay-subsection">
        <h3>Request headers</h3>
        <table class="decay-claim-table"><tbody>${headerRows}</tbody></table>
      </div>
      <div class="decay-subsection">
        <h3>Cookies</h3>
        <table class="decay-claim-table"><tbody>${cookieRows}</tbody></table>
      </div>
    </div>
  `;
}
```

- [ ] **Step 2: Add `wireDiagnosticButtons` and call it from the success path**

Append the following function to `app.ts` (above the `ltiLaunch` call):

```ts
function wireDiagnosticButtons(settings: DiagnosticLaunchSettings): void {
  const buttons = document.getElementById('decay-buttons');
  const panels = document.getElementById('decay-panels');
  if (!buttons || !panels) return;

  const views: Array<{ id: string; label: string; html: () => string }> = [
    { id: 'claims', label: 'Show LTI Claims (Annotated)', html: () => renderClaimsPanel(settings.idTokenClaims) },
    { id: 'raw', label: 'Show Raw JWT & Launch Data', html: () => renderRawPanel(settings) },
    { id: 'http', label: 'Show HTTP Context', html: () => renderHttpPanel(settings.httpContext) },
  ];

  buttons.innerHTML = views
    .map(v => `<button class="decay-btn" data-view="${v.id}">${escapeHtml(v.label)}</button>`)
    .join('');

  let currentView: string | null = null;

  buttons.querySelectorAll<HTMLButtonElement>('button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view!;
      if (currentView === viewId) {
        panels.innerHTML = '';
        currentView = null;
        buttons.querySelectorAll('button[data-view]').forEach(b => b.classList.remove('active'));
        return;
      }
      const view = views.find(v => v.id === viewId)!;
      panels.innerHTML = view.html();
      currentView = viewId;
      buttons.querySelectorAll('button[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
```

Update the `.then(valid => { ... })` block to call `wireDiagnosticButtons(launchSettings)` after `renderShell(launchSettings)`:

```ts
ltiLaunch(launchSettings)
  .then(valid => {
    injectStyles();
    if (!valid) {
      renderError('ltiLaunch() returned false. State verification failed or platform storage was unavailable.');
      return;
    }
    renderShell(launchSettings);
    wireDiagnosticButtons(launchSettings);
  })
  .catch(err => {
    injectStyles();
    renderError(err instanceof Error ? err.message : String(err));
  });
```

- [ ] **Step 3: Rebuild and sanity-check the bundle**

```bash
cd atomic-decay
npm run build 2>&1 | tail -10
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
cd atomic-decay
git add client/app.ts
git commit -m "feat(decay): add three diagnostic panels (claims, raw JWT, http context)"
```

---

## Task 7: Restyle Deep Linking and NRPS flows (preserve behavior)

**Files:**
- Modify: `atomic-decay/client/app.ts`

### Steps

- [ ] **Step 1: Add restyled DL + NRPS renderers**

Append the three functions below to `app.ts` (near `wireDiagnosticButtons`, above the `ltiLaunch` promise chain):

```ts
function renderDeepLinkSection(settings: DiagnosticLaunchSettings): void {
  const extras = document.getElementById('decay-extras');
  if (!extras || !settings.deepLinking) return;

  const section = document.createElement('section');
  section.className = 'decay-card';
  section.innerHTML = `
    <h2>Deep Linking</h2>
    <p style="color:#ccc;">This launch was a Deep Linking request. Click the button to return a sample "Hello World" content item to the platform.</p>
    <button id="deep-linking-button" class="decay-btn">Return Deep Link</button>
    <form id="deep-linking-form" method="post" style="display:none;">
      <input id="deep-link-jwt" type="hidden" name="JWT" value="" />
      <button id="deep-link-submit" type="submit">Submit</button>
    </form>
  `;
  extras.appendChild(section);

  const button = document.getElementById('deep-linking-button');
  button?.addEventListener('click', () => {
    const deepLink = {
      type: 'html',
      html: '<h2>Just saying hi!</h2>',
      title: 'Hello World',
      text: 'A simple hello world example',
    };

    fetch('/lti_services/sign_deep_link', {
      method: 'POST',
      body: JSON.stringify([deepLink]),
      headers: {
        Authorization: `Bearer ${settings.jwt}`,
        'Content-Type': 'application/json',
      },
    })
      .then(r => r.json())
      .then(data => {
        const form = document.getElementById('deep-linking-form') as HTMLFormElement | null;
        form?.setAttribute('action', settings.deepLinking?.deep_link_return_url || '');
        const field = document.getElementById('deep-link-jwt');
        field?.setAttribute('value', data.jwt);
        form?.submit();
      })
      .catch(err => {
        renderExtrasError(`Deep-link sign failed: ${err instanceof Error ? err.message : String(err)}`);
      });
  });
}

function renderNrpsSection(settings: DiagnosticLaunchSettings): void {
  const extras = document.getElementById('decay-extras');
  if (!extras) return;

  const section = document.createElement('section');
  section.className = 'decay-card';
  section.innerHTML = `
    <h2>Names &amp; Roles (NRPS)</h2>
    <p style="color:#ccc;">Fetching the course roster using the tool JWT...</p>
    <pre id="decay-nrps-result" class="decay-pre">loading...</pre>
  `;
  extras.appendChild(section);

  fetch('/lti_services/names_and_roles', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${settings.jwt}`,
      'Content-Type': 'application/json',
    },
  })
    .then(r => r.json())
    .then(data => {
      const target = document.getElementById('decay-nrps-result');
      if (target) target.textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      const target = document.getElementById('decay-nrps-result');
      if (target) target.textContent = `NRPS fetch failed: ${err instanceof Error ? err.message : String(err)}`;
    });
}

function renderExtrasError(msg: string): void {
  const extras = document.getElementById('decay-extras');
  if (!extras) return;
  const err = document.createElement('div');
  err.className = 'decay-error';
  err.textContent = msg;
  extras.appendChild(err);
}
```

- [ ] **Step 2: Call them from the success path**

Update the `.then(valid => { ... })` block to also call the two section renderers:

```ts
ltiLaunch(launchSettings)
  .then(valid => {
    injectStyles();
    if (!valid) {
      renderError('ltiLaunch() returned false. State verification failed or platform storage was unavailable.');
      return;
    }
    renderShell(launchSettings);
    wireDiagnosticButtons(launchSettings);
    renderDeepLinkSection(launchSettings);
    renderNrpsSection(launchSettings);
  })
  .catch(err => {
    injectStyles();
    renderError(err instanceof Error ? err.message : String(err));
  });
```

- [ ] **Step 3: Rebuild**

```bash
cd atomic-decay
npm run build 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
cd atomic-decay
git add client/app.ts
git commit -m "feat(decay): restyle deep link and NRPS sections in the diagnostic shell"
```

---

## Task 8: Verification — full workspace compile + manual smoke test

**Files:** none modified.

### Steps

- [ ] **Step 1: Run full Rust check, format, clippy, and unit tests**

```bash
cd atomic-decay
cargo fmt
cargo clippy -- -D warnings 2>&1 | tail -20
cargo test --lib 2>&1 | tail -20
```

Expected: `cargo fmt` rewrites nothing (or only minor formatting), `clippy` emits no warnings, `cargo test --lib` passes including the three new `launch_diagnostics` tests (`timings_record_checkpoints_in_order_and_total_is_nonzero`, `http_context_extracts_headers_cookies_host_and_ua`, `http_context_handles_missing_optional_headers`).

- [ ] **Step 2: Run integration tests**

```bash
cd atomic-decay
./scripts/test-with-db.sh 2>&1 | tail -20
```

Expected: existing integration tests (`lti_oidc_flow_test.rs`, `lti_dynamic_registration_test.rs`, etc.) all pass. If any test explicitly asserts on `LAUNCH_SETTINGS` JSON structure, update the assertion to allow the new fields — our changes are additive, so no existing field is removed.

- [ ] **Step 3: Rebuild the client bundle**

```bash
cd atomic-decay
npm run build 2>&1 | tail -10
```

Expected: clean build; `src/assets/js/app-*.js` written; `src/assets/js/assets.json` updated.

- [ ] **Step 4: Start the Atomic Decay backend and launch from the test platform**

From the cmux original terminal:

```bash
SURFACE=$(cmux list-panels --workspace "Atomic Decay" --json | grep '"Backend"' | grep -o 'surface:[0-9]*')
cmux send --surface "$SURFACE" "\x03" && sleep 1
cmux send --surface "$SURFACE" "make dev-backend\n"
```

Wait for "listening" in the output:

```bash
cmux read-screen --surface "$SURFACE" --scrollback --lines 20
```

Launch Atomic Decay from a connected LTI test platform (atomic-lti-test or a registered Canvas sandbox). In the launched iframe, confirm:

- Header reads "Atomic Decay — LTI Launch Diagnostics".
- Launch summary card shows a user name, role badges, a context title, and the platform URL.
- The three yellow buttons appear.
- Clicking **Show LTI Claims (Annotated)** opens a table with annotated claims; the button turns white (active).
- Clicking the same button again collapses the panel.
- Clicking **Show Raw JWT & Launch Data** shows the raw tool JWT, decoded tool JWT payload, decoded platform claims, and full `LAUNCH_SETTINGS`.
- Clicking **Show HTTP Context** shows host, scheme, method, path, user-agent, client IP, server timings (five labelled rows plus `total`), headers table, cookies table.
- The Names & Roles panel below shows a JSON roster response (or an explanatory error if the test platform does not expose NRPS).
- For a Deep Link launch, the **Return Deep Link** button returns a content item to the platform as before.

- [ ] **Step 5: Final sanity commit if anything needed a fix**

If Step 4 surfaced a bug fix, commit it:

```bash
cd atomic-decay
git status
git add -A
git commit -m "fix(decay): <describe fix from smoke test>"
```

If nothing needed fixing, skip this step.

---

## Self-Review

**Spec coverage** — each goal in the spec is covered by at least one task:

- Goal 1 (palette + header matching public site) → Task 5 (STYLES constant + shell).
- Goal 2 (summary card on launch) → Task 5 (`renderShell`).
- Goal 3 (three buttons: annotated claims, raw, HTTP context) → Task 6 (`wireDiagnosticButtons`, `renderClaimsPanel`, `renderRawPanel`, `renderHttpPanel`).
- Goal 4 (preserve DL + NRPS) → Task 7 (`renderDeepLinkSection`, `renderNrpsSection`).
- Data contract (`idTokenClaims`, `launchInfo`, `httpContext`) → Task 3.
- `LaunchTimings` helper → Task 1 (with unit test).
- `build_http_context` → Task 2 (with unit tests including a missing-header edge case).
- TypeScript type widening → Task 4.
- Error card → Task 5 (`renderError`).
- Verification → Task 8.

**Non-goals respected** — no dedicated route added, no persistence, no framework pulled in, no CSS pipeline wired up.

**Placeholder scan** — no `TBD`, `TODO`, `fill in`; every code block is complete; every step has a concrete expected output.

**Type consistency** — `DiagnosticLaunchSettings` is defined in `types.d.ts` (Task 4) and imported by `client/app.ts` (Tasks 5–7). `LaunchTimings::checkpoint` takes `&'static str`, and the five call sites in Task 3 pass string literals (`"oidcStateLookup"`, `"jwkFetch"`, `"jwtDecode"`, `"jwtValidation"`, `"toolJwtMint"`), matching the `HttpTimings` TS interface (Task 4) and the client's `timingsMs` rendering (Task 6). `build_http_context` signature (Task 2) matches the call site in Task 3. Claim-key strings in `CLAIM_EXPLANATIONS` (Task 6) match the serde-renamed LTI claim URIs on the Rust `IdToken` struct (`atomic-lti/src/id_token.rs:240-274`).
