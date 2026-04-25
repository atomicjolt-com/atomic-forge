# Atomic Decay NRPS Tester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the `NrpsTester` placeholder shipped by the foundation plan with a working tester for LTI Names and Roles Provisioning Services. Server gains a parameterized `/lti_services/nrps/members` endpoint. Client renders three recipes plus a free-form request panel and a member-table response view.

**Architecture:** The new server endpoint reuses `atomic_lti::names_and_roles::list` from the existing implementation; it differs only in that it accepts query params (`role`, `limit`, `rlid`) and returns the standard `ServiceResponse` envelope defined in Plan 1. The client `NrpsTester` follows the foundation pattern: `<ModeToggle>` switches between `<RecipeRunner>` and `<RequestPanel>` + `<ResponseViewer>`.

**Tech Stack:** Axum + serde + atomic-lti (server), React + RTL + CSS Modules (client). Depends on the foundation plan being merged.

Spec reference: `docs/superpowers/specs/2026-04-25-atomic-decay-spec-tester-design.md`.

Foundation reference: `docs/superpowers/plans/2026-04-25-atomic-decay-tester-foundation.md`.

---

## File structure (this plan)

```
atomic-decay/
├── src/handlers/
│   └── lti_services.rs           Modify: replace `names_and_roles` GET with parameterized version that returns ServiceResponse-shaped JSON
├── tests/
│   └── nrps_tester_test.rs       Create: integration test for /lti_services/nrps/members
└── client/
    ├── recipes/
    │   └── nrpsRecipes.ts        Create: 3 recipe definitions
    ├── lib/
    │   └── serviceClient.ts      Create: thin wrapper around fetch that returns ServiceResponse
    ├── components/
    │   ├── MemberTable.tsx       Create: roster rendering for NRPS responses
    │   └── MemberTable.module.css Create
    └── testers/
        └── NrpsTester.tsx        Replace placeholder with full tester
```

The endpoint at `/lti_services/names_and_roles` (existing) is **kept temporarily** to avoid breaking the foundation plan's manual smoke test. It is removed at the end of this plan once the new endpoint is in production.

---

## Task 1: Add a service-client helper on the client

**Files:**
- Create: `atomic-decay/client/lib/serviceClient.ts`

- [ ] **Step 1: Write the failing test**

Write `atomic-decay/client/lib/serviceClient.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callService } from './serviceClient';

describe('callService', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('GETs the path with query params and returns the parsed envelope', async () => {
    const fakeResp: any = { status: 200, durationMs: 1, request: {}, response: { headers: {}, body: { ok: true } } };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeResp,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await callService({
      method: 'GET', path: '/lti_services/x', token: 'tok', query: { a: '1' }, body: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/lti_services/x?a=1',
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer tok' }) }),
    );
    expect(result.response.body).toEqual({ ok: true });
  });

  it('serializes JSON bodies on POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ status: 201, durationMs: 1, request: {}, response: { headers: {}, body: {} } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await callService({ method: 'POST', path: '/x', token: 't', query: {}, body: { a: 1 } });

    expect(fetchMock).toHaveBeenCalledWith(
      '/x',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ a: 1 }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('returns a synthetic envelope with error when fetch rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network fail'));
    vi.stubGlobal('fetch', fetchMock);
    const r = await callService({ method: 'GET', path: '/x', token: 't', query: {}, body: undefined });
    expect(r.error).toContain('network fail');
    expect(r.status).toBe(0);
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/lib/serviceClient.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `serviceClient.ts`**

```ts
import type { ServiceResponse } from '../types/tester';

export type CallInput = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  token: string;
  query: Record<string, string | number | undefined>;
  body: unknown;
};

function buildQuery(q: CallInput['query']): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? '?' + parts.join('&') : '';
}

export async function callService(input: CallInput): Promise<ServiceResponse> {
  const url = input.path + buildQuery(input.query);
  const headers: Record<string, string> = { Authorization: `Bearer ${input.token}` };
  let body: string | undefined;
  if (input.body !== undefined && input.body !== null) {
    headers['Content-Type'] = 'application/json';
    body = typeof input.body === 'string' ? input.body : JSON.stringify(input.body);
  }
  try {
    const resp = await fetch(url, { method: input.method, headers, body });
    return (await resp.json()) as ServiceResponse;
  } catch (e) {
    return {
      status: 0,
      durationMs: 0,
      request: { method: input.method, url, body: input.body ?? null },
      response: { headers: {}, body: null },
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
```

- [ ] **Step 4: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/lib/serviceClient.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/client/lib/serviceClient.ts atomic-decay/client/lib/serviceClient.test.ts
git commit -m "feat(decay): add service-client helper that returns ServiceResponse"
```

---

## Task 2: Server endpoint — parameterized NRPS members

**Files:**
- Modify: `atomic-decay/src/handlers/lti_services.rs`
- Create: `atomic-decay/tests/nrps_tester_test.rs`

- [ ] **Step 1: Add a Query type and wire the new route**

In `atomic-decay/src/handlers/lti_services.rs`, replace the existing `lti_service_routes` and `names_and_roles` handler with the version below. Keep the deep-link handler unchanged.

```rust
use crate::{errors::AppError, extractors::jwt_claims::JwtClaims, AppState};
use atomic_lti::client_credentials::request_service_token_cached;
use atomic_lti::deep_linking::{ContentItem, DeepLinking};
use atomic_lti::names_and_roles::{self, ListParams};
use crate::stores::db_platform_store::DBPlatformStore;
use atomic_lti::stores::key_store::KeyStore;
use atomic_lti::stores::platform_store::PlatformStore;
use axum::{
  extract::{Query, State},
  response::{IntoResponse, Response},
  routing::{get, post},
  Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json;
use std::sync::Arc;
use std::time::Instant;

pub fn lti_service_routes(
  _arc_key_store: Arc<dyn KeyStore + Send + Sync>,
) -> Router<Arc<AppState>> {
  Router::new()
    .route("/lti_services/nrps/members", get(nrps_members))
    .route("/lti_services/sign_deep_link", post(sign_deep_link))
}

#[derive(Debug, Deserialize)]
pub struct NrpsQuery {
  pub role: Option<String>,
  pub limit: Option<usize>,
  pub rlid: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ServiceEnvelope {
  pub status: u16,
  #[serde(rename = "durationMs")]
  pub duration_ms: u128,
  pub request: serde_json::Value,
  pub response: ServiceEnvelopeResponse,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ServiceEnvelopeResponse {
  pub headers: serde_json::Value,
  pub body: serde_json::Value,
}

pub async fn nrps_members(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Query(q): Query<NrpsQuery>,
) -> Result<Response, AppError> {
  let Some(endpoint_url) = jwt_claims.claims.names_and_roles_endpoint_url.clone() else {
    return Ok(Json(error_envelope(
      "GET",
      "/lti_services/nrps/members",
      "No NRPS endpoint claim in this launch.",
    ))
    .into_response());
  };

  let started = Instant::now();
  let (kid, rsa_key) = state
    .key_store
    .get_current_key()
    .await
    .map_err(|e| AppError::Custom(format!("Failed to get signing key: {e}")))?;
  let platform_store =
    DBPlatformStore::with_issuer(state.pool.clone(), jwt_claims.claims.platform_iss.clone());
  let token_url = platform_store
    .get_token_url()
    .await
    .map_err(|e| AppError::Custom(format!("Failed to get platform token URL: {e}")))?;
  let scope = "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly";
  let auth = request_service_token_cached(
    &jwt_claims.claims.client_id,
    &token_url,
    scope,
    &kid,
    rsa_key,
  )
  .await
  .map_err(|e| AppError::Custom(format!("Failed to mint NRPS token: {e}")))?;

  let params = ListParams {
    role: q.role.clone(),
    limit: q.limit,
    resource_link_id: q.rlid.clone(),
  };

  match names_and_roles::list(&auth.access_token, &endpoint_url, &params).await {
    Ok((container, _next, _diff)) => {
      let body = serde_json::to_value(&container).unwrap_or(serde_json::Value::Null);
      let env = ServiceEnvelope {
        status: 200,
        duration_ms: started.elapsed().as_millis(),
        request: serde_json::json!({
          "method": "GET",
          "url": endpoint_url,
          "body": null,
          "query": q_value(&q),
        }),
        response: ServiceEnvelopeResponse {
          headers: serde_json::json!({}),
          body,
        },
        error: None,
      };
      Ok(Json(env).into_response())
    }
    Err(e) => {
      let env = ServiceEnvelope {
        status: 502,
        duration_ms: started.elapsed().as_millis(),
        request: serde_json::json!({
          "method": "GET",
          "url": endpoint_url,
          "body": null,
          "query": q_value(&q),
        }),
        response: ServiceEnvelopeResponse {
          headers: serde_json::json!({}),
          body: serde_json::Value::Null,
        },
        error: Some(format!("NRPS request failed: {e}")),
      };
      Ok(Json(env).into_response())
    }
  }
}

fn q_value(q: &NrpsQuery) -> serde_json::Value {
  serde_json::json!({
    "role": q.role,
    "limit": q.limit,
    "rlid": q.rlid,
  })
}

fn error_envelope(method: &str, url: &str, msg: &str) -> ServiceEnvelope {
  ServiceEnvelope {
    status: 400,
    duration_ms: 0,
    request: serde_json::json!({ "method": method, "url": url, "body": null }),
    response: ServiceEnvelopeResponse {
      headers: serde_json::json!({}),
      body: serde_json::Value::Null,
    },
    error: Some(msg.to_string()),
  }
}

// Deep-link signer kept unchanged; will be renamed in Plan 4.
pub async fn sign_deep_link(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Json(content_items): Json<Vec<ContentItem>>,
) -> Result<Response, AppError> {
  let (kid, rsa_key) = state
    .key_store
    .get_current_key()
    .await
    .map_err(|e| AppError::Custom(format!("Failed to get signing key: {e}")))?;
  let deep_link_jwt = DeepLinking::create_deep_link_jwt(
    &jwt_claims.claims.client_id,
    &jwt_claims.claims.iss,
    &jwt_claims.claims.deployment_id,
    &content_items,
    jwt_claims.claims.deep_link_claim_data,
    &kid,
    rsa_key,
  )
  .map_err(|e| AppError::Custom(format!("Failed to create deep link JWT: {e}")))?;

  Ok(Json(serde_json::json!({ "jwt": deep_link_jwt })).into_response())
}
```

- [ ] **Step 2: Confirm Rust compiles**

Run: `cd atomic-decay && cargo check`
Expected: clean.

- [ ] **Step 3: Write integration test**

Write `atomic-decay/tests/nrps_tester_test.rs`:
```rust
// Verifies that GET /lti_services/nrps/members returns a ServiceEnvelope-shaped
// JSON when the JWT has no NRPS claim. End-to-end success (with a real platform
// roster) is covered by manual smoke-testing — mocking the platform here would
// be net-new infrastructure.

use atomic_decay::test_utils;
use axum::http::StatusCode;

#[tokio::test]
async fn nrps_members_without_claim_returns_error_envelope() {
  let app = test_utils::launched_app_without_nrps_claim().await;
  let resp = app
    .request("GET", "/lti_services/nrps/members")
    .with_authorized_jwt()
    .send()
    .await;
  assert_eq!(resp.status(), StatusCode::OK);
  let body: serde_json::Value = resp.json().await;
  assert_eq!(body["status"], 400);
  assert!(body["error"].as_str().unwrap().contains("NRPS endpoint"));
}
```

If `test_utils::launched_app_without_nrps_claim` does not yet exist, defer this test until the helper is added in a follow-up — do not block the plan on it. Mark the test `#[ignore]` and open a follow-up issue.

- [ ] **Step 4: Run Rust tests**

Run: `cd atomic-decay && cargo check && make test`
Expected: clean compile, existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/src/handlers/lti_services.rs atomic-decay/tests/nrps_tester_test.rs
git commit -m "feat(decay): add parameterized /lti_services/nrps/members endpoint"
```

---

## Task 3: NRPS recipes

**Files:**
- Create: `atomic-decay/client/recipes/nrpsRecipes.ts`

- [ ] **Step 1: Write the recipes**

```ts
import type { Recipe, ServiceEndpoint } from '../types/tester';

export const NRPS_MEMBERS: ServiceEndpoint = {
  spec: 'nrps',
  method: 'GET',
  path: '/lti_services/nrps/members',
  paramSchema: {
    fields: [
      {
        name: 'role',
        label: 'Role',
        kind: 'select',
        options: [
          { value: '', label: 'any' },
          { value: 'Learner', label: 'Learner' },
          { value: 'Instructor', label: 'Instructor' },
          { value: 'ContentDeveloper', label: 'ContentDeveloper' },
          { value: 'Mentor', label: 'Mentor' },
        ],
        default: '',
      },
      { name: 'limit', label: 'Limit', kind: 'number', default: 50, min: 1, max: 1000 },
      { name: 'rlid', label: 'Resource link ID', kind: 'text', default: '' },
    ],
  },
};

export const NRPS_RECIPES: Recipe[] = [
  {
    id: 'nrps-full-roster',
    name: 'Fetch full roster',
    description: 'GET context membership with no filter — returns every member of the launching course.',
    steps: [
      {
        label: 'GET /lti_services/nrps/members',
        endpoint: NRPS_MEMBERS,
        defaults: { role: '', limit: 100, rlid: '' },
        expect: { status: 200 },
      },
    ],
  },
  {
    id: 'nrps-learners-only',
    name: 'Filter to learners only',
    description: 'GET with role=Learner — verifies the platform honours the role filter.',
    steps: [
      {
        label: 'GET /lti_services/nrps/members?role=Learner',
        endpoint: NRPS_MEMBERS,
        defaults: { role: 'Learner', limit: 100, rlid: '' },
        expect: { status: 200 },
      },
    ],
  },
  {
    id: 'nrps-resource-link-membership',
    name: 'Resource-link membership',
    description: 'GET with rlid set to the current resource_link.id — narrows the roster to users who can access this placement.',
    steps: [
      {
        label: 'GET /lti_services/nrps/members?rlid=…',
        endpoint: NRPS_MEMBERS,
        defaults: { role: '', limit: 100, rlid: '' },
        expect: { status: 200 },
      },
    ],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/recipes/nrpsRecipes.ts
git commit -m "feat(decay): add NRPS recipes (full roster, learners only, resource-link membership)"
```

---

## Task 4: MemberTable component

**Files:**
- Create: `atomic-decay/client/components/MemberTable.tsx`
- Create: `atomic-decay/client/components/MemberTable.module.css`

- [ ] **Step 1: Write `MemberTable.module.css`**

```css
.table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
.table th, .table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); }
.table th { color: var(--accent); font-weight: 600; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em; }
.role { display: inline-block; background: var(--accent); color: var(--bg); padding: 1px 6px; border-radius: 3px; font-size: var(--fs-xs); margin: 1px 4px 1px 0; }
```

- [ ] **Step 2: Write the failing test**

Write `client/components/MemberTable.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemberTable } from './MemberTable';

const CONTAINER = {
  id: 'http://x/memberships',
  context: { id: 'c1', label: 'M101', title: 'Math 101' },
  members: [
    { user_id: 'u1', name: 'Jane Doe', email: 'j@x', roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'], status: 'Active' },
    { user_id: 'u2', name: 'John Roe', email: 'r@x', roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'], status: 'Active' },
  ],
};

describe('MemberTable', () => {
  it('renders one row per member', () => {
    render(<MemberTable container={CONTAINER as any} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('John Roe')).toBeInTheDocument();
  });
  it('renders short role names', () => {
    render(<MemberTable container={CONTAINER as any} />);
    expect(screen.getByText('Learner')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();
  });
  it('renders an empty-state when members is empty', () => {
    render(<MemberTable container={{ id: '', context: { id: '', label: '', title: '' }, members: [] } as any} />);
    expect(screen.getByText('(no members)')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/MemberTable.test.tsx`

- [ ] **Step 4: Implement `MemberTable.tsx`**

```tsx
import s from './MemberTable.module.css';
import { shortRole } from '../lib/format';

type Member = {
  user_id?: string;
  name?: string;
  email?: string;
  roles?: string[];
  status: string;
};

type Container = {
  id: string;
  context: { id: string; label: string; title: string };
  members: Member[];
};

export function MemberTable({ container }: { container: Container }) {
  if (!container?.members || container.members.length === 0) {
    return <p style={{ color: 'var(--text-dim)' }}>(no members)</p>;
  }
  return (
    <table className={s.table}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Roles</th>
          <th>Status</th>
          <th>User ID</th>
        </tr>
      </thead>
      <tbody>
        {container.members.map((m) => (
          <tr key={m.user_id ?? m.email ?? m.name}>
            <td>{m.name ?? '(unnamed)'}</td>
            <td>{m.email ?? ''}</td>
            <td>{(m.roles ?? []).map((r) => <span key={r} className={s.role}>{shortRole(r)}</span>)}</td>
            <td>{m.status}</td>
            <td><code>{m.user_id ?? ''}</code></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/MemberTable.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/MemberTable.tsx atomic-decay/client/components/MemberTable.module.css \
        atomic-decay/client/components/MemberTable.test.tsx
git commit -m "feat(decay): add MemberTable for NRPS responses"
```

---

## Task 5: NrpsTester component (replaces placeholder)

**Files:**
- Modify: `atomic-decay/client/testers/NrpsTester.tsx`

- [ ] **Step 1: Replace the placeholder with the real tester**

```tsx
import { useState } from 'react';
import { Card } from '../components/Card';
import { ModeToggle } from '../components/ModeToggle';
import { Chip } from '../components/Chip';
import { RecipeRunner } from '../components/RecipeRunner';
import { RequestPanel } from '../components/RequestPanel';
import { ResponseViewer } from '../components/ResponseViewer';
import { MemberTable } from '../components/MemberTable';
import { useLaunch } from '../context/LaunchContext';
import { callService } from '../lib/serviceClient';
import { NRPS_RECIPES, NRPS_MEMBERS } from '../recipes/nrpsRecipes';
import type { Mode, ServiceResponse } from '../types/tester';

export function NrpsTester() {
  const launch = useLaunch();
  const token = launch.jwt!;
  const [mode, setMode] = useState<Mode>('recipes');
  const [recipeId, setRecipeId] = useState(NRPS_RECIPES[0].id);
  const [response, setResponse] = useState<ServiceResponse | null>(null);

  const recipe = NRPS_RECIPES.find((r) => r.id === recipeId)!;

  async function execute(_step: { endpoint: typeof NRPS_MEMBERS }, values: Record<string, unknown>) {
    return callService({
      method: NRPS_MEMBERS.method,
      path: NRPS_MEMBERS.path,
      token,
      query: {
        role: values.role as string | undefined,
        limit: values.limit as number | undefined,
        rlid: values.rlid as string | undefined,
      },
      body: undefined,
    });
  }

  async function submit(values: Record<string, unknown>) {
    const r = await execute({ endpoint: NRPS_MEMBERS }, values);
    setResponse(r);
  }

  return (
    <Card title="Names &amp; Roles (NRPS)">
      <ModeToggle value={mode} onChange={setMode} />
      {mode === 'recipes' ? (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {NRPS_RECIPES.map((r) => (
              <Chip key={r.id} active={r.id === recipeId} onClick={() => setRecipeId(r.id)}>
                {r.name}
              </Chip>
            ))}
          </div>
          <RecipeRunner recipe={recipe} execute={execute} />
        </>
      ) : (
        <>
          <RequestPanel endpoint={NRPS_MEMBERS} initialValues={{}} onSubmit={submit} />
          <div style={{ marginTop: 16 }}>
            <ResponseViewer value={response} />
            {response && response.status === 200 && response.response.body && typeof response.response.body === 'object'
              ? <MemberTable container={response.response.body as any} />
              : null}
          </div>
        </>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Run all JS tests**

Run: `cd atomic-decay && npm test -- --run`
Expected: all green.

- [ ] **Step 3: Build**

Run: `cd atomic-decay && npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add atomic-decay/client/testers/NrpsTester.tsx
git commit -m "feat(decay): replace NRPS placeholder with full tester (recipes + free-form)"
```

---

## Task 6: Manual smoke + remove legacy endpoint

**Files:**
- Modify: `atomic-decay/src/handlers/lti_services.rs` (remove `/lti_services/names_and_roles`)

- [ ] **Step 1: Smoke-test against `atomic-lti-test`**

Start backend + frontend; launch from a Resource Link with an NRPS-supporting platform; in the browser, verify:
- Tab `#nrps` is enabled.
- "Recipes" mode runs the three recipes; happy path shows the roster.
- "Free-form" mode submits with custom params; member table renders for 200 responses.

- [ ] **Step 2: Remove the legacy `/lti_services/names_and_roles` endpoint**

Confirm with `grep -rn 'names_and_roles' atomic-decay/src/` that the only remaining route is `/lti_services/nrps/members`. Already done if Task 2 was followed exactly — this step just verifies.

- [ ] **Step 3: Final commit**

```bash
git status   # commit any drift
```

---

## Self-review checklist

1. **Spec coverage:** NRPS recipes (3) ✓; free-form mode with role/limit/rlid ✓; MemberTable response view ✓; server returns ServiceEnvelope ✓.
2. **Placeholder scan:** No "TBD" or vague steps; every test has full code; integration test caveat ("mark `#[ignore]` if helper missing") is explicit, not a TODO.
3. **Type consistency:** `ServiceResponse` shape matches `ServiceEnvelope` server-side fields (`status`, `durationMs`, `request`, `response`, `error`).
