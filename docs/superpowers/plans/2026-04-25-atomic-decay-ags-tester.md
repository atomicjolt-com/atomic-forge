# Atomic Decay AGS Tester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the `AgsTester` placeholder with a working tester for LTI Assignment & Grade Services. Server gains four endpoints (list line items, create line item, post score, list results). Client renders three sub-flows (Line items / Scores / Results), three recipes (happy path, re-grade, scope mismatch), and free-form per-endpoint request panels.

**Architecture:** All four server endpoints are thin proxies over `atomic_lti::assignment_grade_services::*` and return the same `ServiceEnvelope` shape used by NRPS. The AGS endpoint URL is read from `JwtClaims` (the AGS endpoint claim is already part of the launched id_token). Client follows the same anatomy as `NrpsTester`: `<ModeToggle>`, sub-flow chips, `<RecipeRunner>` or `<RequestPanel>` + `<ResponseViewer>`.

**Tech Stack:** Axum + atomic-lti AGS (server), React + RTL (client). Depends on the foundation plan and the `serviceClient.ts` helper added in the NRPS plan.

Spec reference: `docs/superpowers/specs/2026-04-25-atomic-decay-spec-tester-design.md`.

---

## File structure

```
atomic-decay/
├── src/
│   ├── handlers/
│   │   └── lti_services.rs       Modify: add ags_line_items_list / ags_line_items_create / ags_score_post / ags_results_list
│   └── extractors/
│       └── jwt_claims.rs         Modify: expose AGS endpoint URL + scopes from claims (read-only)
└── client/
    ├── recipes/
    │   └── agsRecipes.ts         Create: 3 recipe definitions
    ├── testers/
    │   └── AgsTester.tsx         Replace placeholder
    └── components/
        ├── LineItemTable.tsx     Create: render []LineItem
        └── LineItemTable.module.css Create
```

The AGS endpoint claim shape from `IdToken` provides the `lineitems` URL (collection) and per-line-item operations are URL-suffixed. The server endpoints accept either the collection URL (for list/create) or a line-item ID (for score/results) as part of the request — see Task 2.

---

## Task 1: Confirm AGS endpoint URL is reachable from `JwtClaims`

**Files:**
- Read: `atomic-decay/src/stores/tool_jwt_store.rs` (no edit)
- Modify: `atomic-decay/src/extractors/jwt_claims.rs` (only if AGS fields aren't yet on `ToolJwt`)

- [ ] **Step 1: Inspect `ToolJwt` for AGS-related fields**

Run: `cd atomic-decay && grep -n -A 30 'struct ToolJwt' src/stores/tool_jwt_store.rs`
Expected: a struct with at least `client_id`, `platform_iss`, `deployment_id`. Look for `ags_endpoint`, `ags_scopes`, or `ags_lineitems_url`.

- [ ] **Step 2: If `ags_lineitems_url` is missing on `ToolJwt`, add it**

If the inspection in Step 1 shows no AGS fields, edit `atomic-decay/src/stores/tool_jwt_store.rs` to add (preserving existing fields):
```rust
#[serde(default)]
pub ags_lineitems_url: Option<String>,
#[serde(default)]
pub ags_scopes: Vec<String>,
```
And populate them from the platform `IdToken` in the existing `build_jwt` flow:
```rust
ags_lineitems_url: id_token.assignment_and_grades_service.as_ref().and_then(|a| a.lineitems.clone()),
ags_scopes: id_token.assignment_and_grades_service.as_ref().map(|a| a.scope.clone()).unwrap_or_default(),
```
Adjust property names to match the actual `IdToken` shape (run `grep -rn 'assignment_and_grades_service\|ags' atomic-lti/src/id_token.rs` to confirm).

- [ ] **Step 3: Run Rust check**

Run: `cd atomic-decay && cargo check`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add atomic-decay/src/stores/tool_jwt_store.rs
git commit -m "feat(decay): expose AGS lineitems URL + scopes on ToolJwt"
```

---

## Task 2: AGS server endpoints

**Files:**
- Modify: `atomic-decay/src/handlers/lti_services.rs`

- [ ] **Step 1: Extend `lti_service_routes` with the four AGS routes**

In `atomic-decay/src/handlers/lti_services.rs`, replace the `lti_service_routes` function with:
```rust
pub fn lti_service_routes(
  _arc_key_store: Arc<dyn KeyStore + Send + Sync>,
) -> Router<Arc<AppState>> {
  Router::new()
    .route("/lti_services/nrps/members", get(nrps_members))
    .route("/lti_services/ags/line_items", get(ags_line_items_list).post(ags_line_items_create))
    .route("/lti_services/ags/scores", post(ags_score_post))
    .route("/lti_services/ags/results", get(ags_results_list))
    .route("/lti_services/sign_deep_link", post(sign_deep_link))
}
```

- [ ] **Step 2: Add the four handlers**

Append to `atomic-decay/src/handlers/lti_services.rs`:
```rust
use atomic_lti::assignment_grade_services::{line_items, results, score};

const AGS_LINEITEM_SCOPE: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem";
const AGS_SCORE_SCOPE: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/score";
const AGS_RESULT_SCOPE: &str = "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly";

#[derive(Debug, Deserialize)]
pub struct AgsListLineItemsQuery {
  pub limit: Option<usize>,
  pub tag: Option<String>,
  pub resource_id: Option<String>,
  pub resource_link_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AgsCreateLineItemBody {
  pub label: String,
  pub score_maximum: f32,
  pub resource_id: String,
  pub tag: String,
  pub resource_link_id: String,
}

#[derive(Debug, Deserialize)]
pub struct AgsScoreBody {
  pub line_item_id: String,
  pub user_id: String,
  pub score_given: f32,
  pub score_maximum: f32,
  pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AgsResultsQuery {
  pub line_item_id: String,
  pub user_id: Option<String>,
  pub limit: Option<usize>,
}

async fn mint_ags_token(
  state: &Arc<AppState>,
  jwt_claims: &JwtClaims,
  scope: &str,
) -> Result<String, AppError> {
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
  let auth = request_service_token_cached(
    &jwt_claims.claims.client_id,
    &token_url,
    scope,
    &kid,
    rsa_key,
  )
  .await
  .map_err(|e| AppError::Custom(format!("Failed to mint AGS token: {e}")))?;
  Ok(auth.access_token)
}

fn ags_endpoint(jwt_claims: &JwtClaims) -> Result<String, AppError> {
  jwt_claims
    .claims
    .ags_lineitems_url
    .clone()
    .ok_or_else(|| AppError::Custom("No AGS endpoint claim in this launch.".to_string()))
}

pub async fn ags_line_items_list(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Query(q): Query<AgsListLineItemsQuery>,
) -> Result<Response, AppError> {
  let url = ags_endpoint(&jwt_claims)?;
  let started = Instant::now();
  let token = mint_ags_token(&state, &jwt_claims, AGS_LINEITEM_SCOPE).await?;
  let params = line_items::ListParams {
    tag: q.tag,
    resource_id: q.resource_id,
    resource_link_id: q.resource_link_id,
    limit: q.limit,
    include: None,
  };
  match line_items::list(&token, &url, &params).await {
    Ok(items) => Ok(Json(envelope_ok(200, started, "GET", &url, None, serde_json::to_value(&items).unwrap_or_default())).into_response()),
    Err(e) => Ok(Json(envelope_err(502, started, "GET", &url, None, &e.to_string())).into_response()),
  }
}

pub async fn ags_line_items_create(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Json(body): Json<AgsCreateLineItemBody>,
) -> Result<Response, AppError> {
  let url = ags_endpoint(&jwt_claims)?;
  let started = Instant::now();
  let token = mint_ags_token(&state, &jwt_claims, AGS_LINEITEM_SCOPE).await?;
  let new_item = line_items::NewLineItem::new(
    body.score_maximum,
    body.label.clone(),
    body.resource_id.clone(),
    body.tag.clone(),
    body.resource_link_id.clone(),
    None,
  );
  let req_body = serde_json::to_value(&new_item).unwrap_or_default();
  match line_items::create(&token, &url, &new_item).await {
    Ok(item) => Ok(Json(envelope_ok(201, started, "POST", &url, Some(req_body), serde_json::to_value(&item).unwrap_or_default())).into_response()),
    Err(e) => Ok(Json(envelope_err(502, started, "POST", &url, Some(req_body), &e.to_string())).into_response()),
  }
}

pub async fn ags_score_post(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Json(body): Json<AgsScoreBody>,
) -> Result<Response, AppError> {
  let started = Instant::now();
  let token = mint_ags_token(&state, &jwt_claims, AGS_SCORE_SCOPE).await?;
  let line_item_id = body.line_item_id.clone();
  let mut s = score::Score::default(&body.user_id, body.score_given, body.score_maximum);
  s.activity_progress = score::ActivityProgress::Completed;
  s.grading_progress = score::GradingProgress::FullyGraded;
  s.comment = body.comment;
  let req_body = serde_json::to_value(&s).unwrap_or_default();
  match score::send_score(&token, &line_item_id, &s).await {
    Ok(resp) => Ok(Json(envelope_ok(200, started, "POST", &format!("{}/scores", line_item_id), Some(req_body), serde_json::to_value(&resp).unwrap_or_default())).into_response()),
    Err(e) => Ok(Json(envelope_err(502, started, "POST", &format!("{}/scores", line_item_id), Some(req_body), &e.to_string())).into_response()),
  }
}

pub async fn ags_results_list(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Query(q): Query<AgsResultsQuery>,
) -> Result<Response, AppError> {
  let started = Instant::now();
  let token = mint_ags_token(&state, &jwt_claims, AGS_RESULT_SCOPE).await?;
  let line_item_id = q.line_item_id.clone();
  let params = results::ListParams { user_id: q.user_id, limit: q.limit };
  match results::list(&token, &line_item_id, &params).await {
    Ok(rows) => Ok(Json(envelope_ok(200, started, "GET", &format!("{}/results", line_item_id), None, serde_json::to_value(&rows).unwrap_or_default())).into_response()),
    Err(e) => Ok(Json(envelope_err(502, started, "GET", &format!("{}/results", line_item_id), None, &e.to_string())).into_response()),
  }
}

fn envelope_ok(
  status: u16,
  started: Instant,
  method: &str,
  url: &str,
  body: Option<serde_json::Value>,
  resp_body: serde_json::Value,
) -> ServiceEnvelope {
  ServiceEnvelope {
    status,
    duration_ms: started.elapsed().as_millis(),
    request: serde_json::json!({ "method": method, "url": url, "body": body }),
    response: ServiceEnvelopeResponse {
      headers: serde_json::json!({}),
      body: resp_body,
    },
    error: None,
  }
}

fn envelope_err(
  status: u16,
  started: Instant,
  method: &str,
  url: &str,
  body: Option<serde_json::Value>,
  msg: &str,
) -> ServiceEnvelope {
  ServiceEnvelope {
    status,
    duration_ms: started.elapsed().as_millis(),
    request: serde_json::json!({ "method": method, "url": url, "body": body }),
    response: ServiceEnvelopeResponse {
      headers: serde_json::json!({}),
      body: serde_json::Value::Null,
    },
    error: Some(msg.to_string()),
  }
}
```

- [ ] **Step 3: Run Rust tests**

Run: `cd atomic-decay && cargo check && make test`
Expected: clean compile, existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add atomic-decay/src/handlers/lti_services.rs
git commit -m "feat(decay): add AGS service endpoints (line items / scores / results)"
```

---

## Task 3: AGS recipes

**Files:**
- Create: `atomic-decay/client/recipes/agsRecipes.ts`

- [ ] **Step 1: Write the recipes**

```ts
import type { Recipe, ServiceEndpoint } from '../types/tester';

export const AGS_LIST_LINE_ITEMS: ServiceEndpoint = {
  spec: 'ags',
  method: 'GET',
  path: '/lti_services/ags/line_items',
  paramSchema: {
    fields: [
      { name: 'limit', label: 'Limit', kind: 'number', default: 25 },
      { name: 'tag', label: 'Tag', kind: 'text', default: '' },
      { name: 'resource_id', label: 'Resource ID', kind: 'text', default: '' },
      { name: 'resource_link_id', label: 'Resource link ID', kind: 'text', default: '' },
    ],
  },
};

export const AGS_CREATE_LINE_ITEM: ServiceEndpoint = {
  spec: 'ags',
  method: 'POST',
  path: '/lti_services/ags/line_items',
  paramSchema: {
    fields: [
      { name: 'label', label: 'Label', kind: 'text', default: 'Atomic Decay test item' },
      { name: 'score_maximum', label: 'Score maximum', kind: 'number', default: 100 },
      { name: 'resource_id', label: 'Resource ID', kind: 'text', default: 'decay-quiz-1' },
      { name: 'tag', label: 'Tag', kind: 'text', default: 'quiz' },
      { name: 'resource_link_id', label: 'Resource link ID', kind: 'text', default: '' },
    ],
  },
};

export const AGS_POST_SCORE: ServiceEndpoint = {
  spec: 'ags',
  method: 'POST',
  path: '/lti_services/ags/scores',
  paramSchema: {
    fields: [
      { name: 'line_item_id', label: 'Line item ID (URL)', kind: 'text', default: '' },
      { name: 'user_id', label: 'User ID', kind: 'text', default: '' },
      { name: 'score_given', label: 'Score given', kind: 'number', default: 92 },
      { name: 'score_maximum', label: 'Score maximum', kind: 'number', default: 100 },
      { name: 'comment', label: 'Comment', kind: 'textarea', default: 'graded by atomic-decay tester', rows: 2 },
    ],
  },
};

export const AGS_LIST_RESULTS: ServiceEndpoint = {
  spec: 'ags',
  method: 'GET',
  path: '/lti_services/ags/results',
  paramSchema: {
    fields: [
      { name: 'line_item_id', label: 'Line item ID (URL)', kind: 'text', default: '' },
      { name: 'user_id', label: 'User ID', kind: 'text', default: '' },
      { name: 'limit', label: 'Limit', kind: 'number', default: 25 },
    ],
  },
};

export const AGS_RECIPES: Recipe[] = [
  {
    id: 'ags-happy-path',
    name: 'Happy path · full grade round-trip',
    description: 'Create a new line item, post a score for the launching user, then verify with results.',
    steps: [
      { label: 'Create line item', endpoint: AGS_CREATE_LINE_ITEM, defaults: { label: 'Atomic Decay happy path', score_maximum: 100, resource_id: 'decay-happy', tag: 'quiz', resource_link_id: '' }, expect: { status: 201 } },
      { label: 'POST score 92/100', endpoint: AGS_POST_SCORE, defaults: { line_item_id: '', user_id: '', score_given: 92, score_maximum: 100, comment: 'happy path' }, expect: { status: 200 } },
      { label: 'GET results, expect 1 score', endpoint: AGS_LIST_RESULTS, defaults: { line_item_id: '', user_id: '', limit: 25 }, expect: { status: 200 } },
    ],
  },
  {
    id: 'ags-regrade',
    name: 'Re-grade existing student',
    description: 'List line items, pick the first one, POST a higher score, fetch results to verify.',
    steps: [
      { label: 'GET line_items', endpoint: AGS_LIST_LINE_ITEMS, defaults: { limit: 5, tag: '', resource_id: '', resource_link_id: '' }, expect: { status: 200 } },
      { label: 'POST score 100/100', endpoint: AGS_POST_SCORE, defaults: { line_item_id: '', user_id: '', score_given: 100, score_maximum: 100, comment: 're-grade' }, expect: { status: 200 } },
      { label: 'GET results', endpoint: AGS_LIST_RESULTS, defaults: { line_item_id: '', user_id: '', limit: 25 }, expect: { status: 200 } },
    ],
  },
  {
    id: 'ags-token-scope-mismatch',
    name: 'Token scope mismatch (negative)',
    description: 'POST a score and expect 403 — exercises the platform error path. Run only on platforms that enforce scopes.',
    steps: [
      { label: 'POST score with default scope (expect 403)', endpoint: AGS_POST_SCORE, defaults: { line_item_id: '', user_id: '', score_given: 50, score_maximum: 100, comment: 'scope test' }, expect: { status: 403 } },
    ],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/recipes/agsRecipes.ts
git commit -m "feat(decay): add AGS recipes (happy path, re-grade, scope mismatch)"
```

---

## Task 4: LineItemTable component

**Files:**
- Create: `atomic-decay/client/components/LineItemTable.tsx`
- Create: `atomic-decay/client/components/LineItemTable.module.css`

- [ ] **Step 1: Write `LineItemTable.module.css`** (mirrors `MemberTable.module.css`)

```css
.table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
.table th, .table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); }
.table th { color: var(--accent); font-weight: 600; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em; }
.id { font-family: var(--font-mono); font-size: var(--fs-xs); word-break: break-all; max-width: 380px; }
```

- [ ] **Step 2: Write the failing test**

Write `client/components/LineItemTable.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineItemTable } from './LineItemTable';

const ITEMS = [
  { id: 'http://x/li/1', label: 'Quiz 1', scoreMaximum: 100, tag: 'quiz', resourceId: 'q1', resourceLinkId: 'rl1' },
  { id: 'http://x/li/2', label: 'Quiz 2', scoreMaximum: 50, tag: 'quiz', resourceId: 'q2', resourceLinkId: 'rl2' },
];

describe('LineItemTable', () => {
  it('renders one row per line item', () => {
    render(<LineItemTable items={ITEMS as any} />);
    expect(screen.getByText('Quiz 1')).toBeInTheDocument();
    expect(screen.getByText('Quiz 2')).toBeInTheDocument();
  });
  it('renders the empty state', () => {
    render(<LineItemTable items={[]} />);
    expect(screen.getByText('(no line items)')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/LineItemTable.test.tsx`

- [ ] **Step 4: Implement `LineItemTable.tsx`**

```tsx
import s from './LineItemTable.module.css';

type LineItem = {
  id: string;
  label: string;
  scoreMaximum: number;
  tag?: string;
  resourceId?: string;
  resourceLinkId?: string;
};

export function LineItemTable({ items }: { items: LineItem[] }) {
  if (!items || items.length === 0) {
    return <p style={{ color: 'var(--text-dim)' }}>(no line items)</p>;
  }
  return (
    <table className={s.table}>
      <thead>
        <tr>
          <th>Label</th>
          <th>Max</th>
          <th>Tag</th>
          <th>Resource</th>
          <th>ID</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.id}>
            <td>{it.label}</td>
            <td>{it.scoreMaximum}</td>
            <td>{it.tag ?? ''}</td>
            <td>{it.resourceId ?? ''}</td>
            <td className={s.id}>{it.id}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/LineItemTable.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/LineItemTable.tsx atomic-decay/client/components/LineItemTable.module.css \
        atomic-decay/client/components/LineItemTable.test.tsx
git commit -m "feat(decay): add LineItemTable for AGS responses"
```

---

## Task 5: AgsTester component

**Files:**
- Modify: `atomic-decay/client/testers/AgsTester.tsx`

- [ ] **Step 1: Replace placeholder with full tester**

```tsx
import { useState } from 'react';
import { Card } from '../components/Card';
import { ModeToggle } from '../components/ModeToggle';
import { Chip } from '../components/Chip';
import { RecipeRunner } from '../components/RecipeRunner';
import { RequestPanel } from '../components/RequestPanel';
import { ResponseViewer } from '../components/ResponseViewer';
import { LineItemTable } from '../components/LineItemTable';
import { useLaunch } from '../context/LaunchContext';
import { callService } from '../lib/serviceClient';
import {
  AGS_RECIPES,
  AGS_LIST_LINE_ITEMS,
  AGS_CREATE_LINE_ITEM,
  AGS_POST_SCORE,
  AGS_LIST_RESULTS,
} from '../recipes/agsRecipes';
import type { Mode, ServiceResponse, ServiceEndpoint } from '../types/tester';

type SubFlow = 'lineitems' | 'scores' | 'results';

const SUBFLOW_ENDPOINTS: Record<SubFlow, ServiceEndpoint[]> = {
  lineitems: [AGS_LIST_LINE_ITEMS, AGS_CREATE_LINE_ITEM],
  scores: [AGS_POST_SCORE],
  results: [AGS_LIST_RESULTS],
};

export function AgsTester() {
  const launch = useLaunch();
  const token = launch.jwt!;

  const [mode, setMode] = useState<Mode>('recipes');
  const [recipeId, setRecipeId] = useState(AGS_RECIPES[0].id);
  const [subflow, setSubflow] = useState<SubFlow>('lineitems');
  const [endpointIdx, setEndpointIdx] = useState(0);
  const [response, setResponse] = useState<ServiceResponse | null>(null);

  const recipe = AGS_RECIPES.find((r) => r.id === recipeId)!;
  const endpoint = SUBFLOW_ENDPOINTS[subflow][endpointIdx];

  async function execute(step: { endpoint: ServiceEndpoint }, values: Record<string, unknown>) {
    const ep = step.endpoint;
    const isQueryEndpoint = ep.method === 'GET';
    const query: Record<string, string | number | undefined> = {};
    const body: Record<string, unknown> = {};
    for (const f of ep.paramSchema.fields) {
      if (isQueryEndpoint) {
        query[f.name] = values[f.name] as string | number | undefined;
      } else {
        body[f.name] = values[f.name];
      }
    }
    return callService({
      method: ep.method,
      path: ep.path,
      token,
      query,
      body: isQueryEndpoint ? undefined : body,
    });
  }

  async function submit(values: Record<string, unknown>) {
    const r = await execute({ endpoint }, values);
    setResponse(r);
  }

  const showLineItemTable =
    endpoint === AGS_LIST_LINE_ITEMS &&
    response?.status === 200 &&
    Array.isArray(response.response.body);

  return (
    <Card title="Assignment &amp; Grade Services (AGS)">
      <ModeToggle value={mode} onChange={setMode} />
      {mode === 'recipes' ? (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {AGS_RECIPES.map((r) => (
              <Chip key={r.id} active={r.id === recipeId} onClick={() => setRecipeId(r.id)}>
                {r.name}
              </Chip>
            ))}
          </div>
          <RecipeRunner recipe={recipe} execute={execute} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['lineitems', 'scores', 'results'] as SubFlow[]).map((sf) => (
              <Chip key={sf} active={subflow === sf} onClick={() => { setSubflow(sf); setEndpointIdx(0); }}>
                {sf === 'lineitems' ? 'Line items' : sf === 'scores' ? 'Scores' : 'Results'}
              </Chip>
            ))}
          </div>
          {SUBFLOW_ENDPOINTS[subflow].length > 1 ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {SUBFLOW_ENDPOINTS[subflow].map((ep, i) => (
                <Chip key={ep.path + ep.method} active={i === endpointIdx} onClick={() => setEndpointIdx(i)}>
                  {ep.method} {ep.path.split('/').slice(-1)[0]}
                </Chip>
              ))}
            </div>
          ) : null}
          <RequestPanel endpoint={endpoint} initialValues={{}} onSubmit={submit} />
          <div style={{ marginTop: 16 }}>
            <ResponseViewer value={response} />
            {showLineItemTable ? <LineItemTable items={response!.response.body as any} /> : null}
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
git add atomic-decay/client/testers/AgsTester.tsx
git commit -m "feat(decay): replace AGS placeholder with full tester (recipes + free-form sub-flows)"
```

---

## Task 6: Manual smoke + cleanup

- [ ] **Step 1: Smoke-test against `atomic-lti-test`**

Launch from a Resource Link with AGS support (Canvas test instance is the canonical option). Verify:
- Tab `#ags` is enabled.
- "Recipes" mode runs the happy path; line item is created, score posts, results returns at least one row.
- "Free-form" mode shows three sub-flow chips; switching sub-flow swaps the request panel; submit hits the matching endpoint and renders the response.
- "Re-grade" recipe successfully POSTs a score against the first line item from list.
- "Token scope mismatch" recipe shows 403 (or whatever the platform returns) and is marked FAIL — this is expected.

- [ ] **Step 2: Final commit**

```bash
git status   # commit any drift
```

---

## Self-review checklist

1. **Spec coverage:** AGS sub-flows (line items list+create / scores POST / results list) ✓; three recipes ✓; free-form per endpoint ✓; LineItemTable response view ✓; PUT/DELETE deferred per spec scope ✓.
2. **Placeholder scan:** No "TBD" / vague tasks. Step 2 of Task 1 is conditional but explicit ("if missing, add"); the property names map to real `IdToken` fields verifiable via `grep`.
3. **Type consistency:** `ServiceEndpoint`, `Recipe`, `Mode`, `ServiceResponse` imported from `client/types/tester.ts` (foundation plan); `ServiceEnvelope` server-side mirrors that shape.
