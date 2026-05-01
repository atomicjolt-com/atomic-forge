# Atomic Decay Deep Linking Tester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in the `DeepLinkTester` placeholder with a working tester for LTI Deep Linking. The browser can choose any of the five content-item types (link, html_fragment, image, file, ltiResourceLink), preview the signed JWT before submitting, and either submit to the platform's `deep_link_return_url` or stop at the preview. Six recipes cover every content-item type plus a multi-item bundle.

**Architecture:** The existing server endpoint `/lti_services/sign_deep_link` already accepts a `Vec<ContentItem>` and returns a signed JWT. This plan renames it to `/lti_services/deeplink/sign` for naming consistency and adds **no new server logic**. All new behavior is client-side: a content-item builder UI, six recipes, and a sign-and-preview flow that decodes and inspects the JWT before the user clicks "Submit."

**Tech Stack:** Server-side wraps the existing handler in a `ServiceEnvelope`. Client adds React components and recipe data. **Depends on the foundation plan, the `serviceClient.ts` helper from the NRPS plan, and the `envelope_ok`/`envelope_err` helpers from the AGS plan.** Run plans 1 → 2 → 3 → 4 in order; do not parallelize 3 and 4.

Spec reference: `docs/superpowers/specs/2026-04-25-atomic-decay-spec-tester-design.md`.

---

## File structure

```
atomic-decay/
├── src/handlers/
│   └── lti_services.rs           Modify: rename /lti_services/sign_deep_link → /lti_services/deeplink/sign (keep handler body)
└── client/
    ├── recipes/
    │   └── deepLinkRecipes.ts    Create: 6 recipe definitions
    ├── components/
    │   ├── ContentItemBuilder.tsx Create: per-type form for one content item, supports add/remove
    │   └── ContentItemBuilder.module.css Create
    └── testers/
        └── DeepLinkTester.tsx    Replace placeholder
```

The `app.ts` legacy already removed by Plan 1 means there are no other callers of the old endpoint URL — this rename is safe.

---

## Task 1: Rename server endpoint and wrap response in `ServiceEnvelope`

**Files:**
- Modify: `atomic-decay/src/handlers/lti_services.rs`

The existing `sign_deep_link` handler returns `{ jwt: "…" }` directly. The
client `callService` helper (added in the NRPS plan) expects every
`/lti_services/*` endpoint to return a `ServiceEnvelope`. We wrap the
response so the contract is uniform.

- [ ] **Step 1: Update the route registration**

In `lti_service_routes`, replace `.route("/lti_services/sign_deep_link", post(sign_deep_link))` with:
```rust
.route("/lti_services/deeplink/sign", post(sign_deep_link))
```

- [ ] **Step 2: Wrap the handler response in `ServiceEnvelope`**

Replace the body of `sign_deep_link` (the existing handler) with:
```rust
pub async fn sign_deep_link(
  State(state): State<Arc<AppState>>,
  jwt_claims: JwtClaims,
  Json(content_items): Json<Vec<ContentItem>>,
) -> Result<Response, AppError> {
  let started = Instant::now();
  let req_body = serde_json::to_value(&content_items).unwrap_or_default();

  let (kid, rsa_key) = match state.key_store.get_current_key().await {
    Ok(k) => k,
    Err(e) => {
      return Ok(Json(envelope_err(
        500, started, "POST", "/lti_services/deeplink/sign",
        Some(req_body), &format!("Failed to get signing key: {e}"),
      )).into_response());
    }
  };

  match DeepLinking::create_deep_link_jwt(
    &jwt_claims.claims.client_id,
    &jwt_claims.claims.iss,
    &jwt_claims.claims.deployment_id,
    &content_items,
    jwt_claims.claims.deep_link_claim_data.clone(),
    &kid,
    rsa_key,
  ) {
    Ok(jwt) => Ok(Json(envelope_ok(
      200, started, "POST", "/lti_services/deeplink/sign",
      Some(req_body), serde_json::json!({ "jwt": jwt }),
    )).into_response()),
    Err(e) => Ok(Json(envelope_err(
      500, started, "POST", "/lti_services/deeplink/sign",
      Some(req_body), &format!("Failed to create deep link JWT: {e}"),
    )).into_response()),
  }
}
```

`envelope_ok` and `envelope_err` are the helpers added in the AGS plan
(Task 2). If the AGS plan has not yet landed, this plan must be sequenced
after it — they share the helpers. Do not duplicate the helpers.

- [ ] **Step 3: Confirm clean compile**

Run: `cd atomic-decay && cargo check`
Expected: clean.

- [ ] **Step 4: Confirm no remaining references to the old path**

Run: `cd atomic-decay && grep -rn 'sign_deep_link\|/lti_services/sign_deep_link' src/ client/`
Expected: only the Rust function name `sign_deep_link` appears; no string literal of the old path.

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/src/handlers/lti_services.rs
git commit -m "refactor(decay): rename DL signer to /lti_services/deeplink/sign, wrap in ServiceEnvelope"
```

---

## Task 2: Deep Linking recipes

**Files:**
- Create: `atomic-decay/client/recipes/deepLinkRecipes.ts`

- [ ] **Step 1: Write the recipes**

```ts
import type { Recipe, ServiceEndpoint } from '../types/tester';

// The Deep Linking endpoint is special — it takes an array of ContentItem objects.
// We pass the array as a single JSON-textarea field and let the client wrap it.
export const DEEPLINK_SIGN: ServiceEndpoint = {
  spec: 'deeplink',
  method: 'POST',
  path: '/lti_services/deeplink/sign',
  paramSchema: {
    fields: [
      {
        name: 'content_items',
        label: 'Content items (JSON array)',
        kind: 'textarea',
        rows: 10,
        default: '[]',
      },
    ],
  },
};

export const DEEPLINK_RECIPES: Recipe[] = [
  {
    id: 'dl-link',
    name: 'Return single link',
    description: 'Return a single ContentItem of type "link" pointing at example.com.',
    steps: [
      {
        label: 'Sign and return link content item',
        endpoint: DEEPLINK_SIGN,
        defaults: {
          content_items: JSON.stringify(
            [{ type: 'link', url: 'https://example.com/article', title: 'An interesting article' }],
            null,
            2,
          ),
        },
        expect: { status: 200 },
      },
    ],
  },
  {
    id: 'dl-html',
    name: 'Return HTML fragment',
    description: 'Return a ContentItem of type "html" with a brief HTML body.',
    steps: [
      {
        label: 'Sign and return html fragment',
        endpoint: DEEPLINK_SIGN,
        defaults: {
          content_items: JSON.stringify(
            [{ type: 'html', html: '<h2>Hi from Atomic Decay</h2>', title: 'Decay HTML', text: 'sample fragment' }],
            null,
            2,
          ),
        },
        expect: { status: 200 },
      },
    ],
  },
  {
    id: 'dl-image',
    name: 'Return image',
    description: 'Return a ContentItem of type "image" with explicit width and height.',
    steps: [
      {
        label: 'Sign and return image content item',
        endpoint: DEEPLINK_SIGN,
        defaults: {
          content_items: JSON.stringify(
            [{ type: 'image', url: 'https://example.com/decay.png', width: 600, height: 400, title: 'Decay logo' }],
            null,
            2,
          ),
        },
        expect: { status: 200 },
      },
    ],
  },
  {
    id: 'dl-file',
    name: 'Return file',
    description: 'Return a ContentItem of type "file" with a media type.',
    steps: [
      {
        label: 'Sign and return file content item',
        endpoint: DEEPLINK_SIGN,
        defaults: {
          content_items: JSON.stringify(
            [{ type: 'file', url: 'https://example.com/syllabus.pdf', title: 'Syllabus', mediaType: 'application/pdf' }],
            null,
            2,
          ),
        },
        expect: { status: 200 },
      },
    ],
  },
  {
    id: 'dl-lti-resource-link',
    name: 'Return LTI resource link',
    description: 'Return a "ltiResourceLink" content item pointing back at this tool.',
    steps: [
      {
        label: 'Sign and return lti resource link',
        endpoint: DEEPLINK_SIGN,
        defaults: {
          content_items: JSON.stringify(
            [{
              type: 'ltiResourceLink',
              title: 'Decay reference launch',
              url: 'https://example.com/lti/launch',
              custom: { decay_test: 'true' },
            }],
            null,
            2,
          ),
        },
        expect: { status: 200 },
      },
    ],
  },
  {
    id: 'dl-multi',
    name: 'Return multiple items',
    description: 'Return a link and an html fragment in a single response.',
    steps: [
      {
        label: 'Sign and return two items',
        endpoint: DEEPLINK_SIGN,
        defaults: {
          content_items: JSON.stringify(
            [
              { type: 'link', url: 'https://example.com', title: 'Decay link' },
              { type: 'html', html: '<p>plus html</p>', title: 'Decay html' },
            ],
            null,
            2,
          ),
        },
        expect: { status: 200 },
      },
    ],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/recipes/deepLinkRecipes.ts
git commit -m "feat(decay): add 6 Deep Linking recipes (link, html, image, file, ltiResourceLink, multi)"
```

---

## Task 3: ContentItemBuilder component

**Files:**
- Create: `atomic-decay/client/components/ContentItemBuilder.tsx`
- Create: `atomic-decay/client/components/ContentItemBuilder.module.css`

- [ ] **Step 1: Write `ContentItemBuilder.module.css`**

```css
.row { display: flex; gap: 8px; align-items: center; margin: 6px 0; }
.label { color: var(--text-dim); min-width: 110px; font-size: var(--fs-sm); }
.input { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 6px 8px; border-radius: var(--radius-sm); font-size: var(--fs-sm); flex: 1; font-family: inherit; }
.item { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-3); margin-bottom: var(--space-3); }
.itemHead { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
.btn { background: var(--accent); color: var(--bg); border: none; padding: 5px 12px; border-radius: var(--radius-sm); font-size: var(--fs-xs); font-weight: 600; cursor: pointer; font-family: inherit; }
.btn.secondary { background: var(--border); color: var(--text); }
.btn.danger { background: var(--danger); color: #fff; }
```

- [ ] **Step 2: Write the failing test**

Write `client/components/ContentItemBuilder.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentItemBuilder } from './ContentItemBuilder';

describe('ContentItemBuilder', () => {
  it('renders one form per item', () => {
    const items = [{ type: 'link', url: 'https://x', title: 'X' }];
    render(<ContentItemBuilder items={items} onChange={() => {}} />);
    expect(screen.getByDisplayValue('https://x')).toBeInTheDocument();
  });

  it('emits a new array when "Add item" is clicked', async () => {
    const onChange = vi.fn();
    render(<ContentItemBuilder items={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add link' }));
    expect(onChange).toHaveBeenCalled();
    const arr = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(arr).toHaveLength(1);
    expect(arr[0].type).toBe('link');
  });

  it('removes an item when its remove button is clicked', async () => {
    const onChange = vi.fn();
    const items = [
      { type: 'link', url: 'a', title: 'A' },
      { type: 'link', url: 'b', title: 'B' },
    ];
    render(<ContentItemBuilder items={items} onChange={onChange} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(onChange).toHaveBeenLastCalledWith([items[1]]);
  });
});
```

- [ ] **Step 3: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/ContentItemBuilder.test.tsx`

- [ ] **Step 4: Implement `ContentItemBuilder.tsx`**

```tsx
import s from './ContentItemBuilder.module.css';

export type CIType = 'link' | 'html' | 'image' | 'file' | 'ltiResourceLink';

export type ContentItem =
  | { type: 'link'; url: string; title?: string }
  | { type: 'html'; html: string; title?: string; text?: string }
  | { type: 'image'; url: string; width?: number; height?: number; title?: string }
  | { type: 'file'; url: string; mediaType?: string; title?: string }
  | { type: 'ltiResourceLink'; url?: string; title?: string; custom?: Record<string, string> };

const TEMPLATES: Record<CIType, ContentItem> = {
  link: { type: 'link', url: 'https://example.com', title: 'New link' },
  html: { type: 'html', html: '<p>hello</p>', title: 'New html', text: '' },
  image: { type: 'image', url: 'https://example.com/img.png', width: 400, height: 300, title: 'New image' },
  file: { type: 'file', url: 'https://example.com/file.pdf', mediaType: 'application/pdf', title: 'New file' },
  ltiResourceLink: { type: 'ltiResourceLink', title: 'New LTI resource link', url: '', custom: {} },
};

function ItemForm({
  item,
  onChange,
  onRemove,
}: {
  item: ContentItem;
  onChange: (next: ContentItem) => void;
  onRemove: () => void;
}) {
  const Field = ({ label, value, set }: { label: string; value: string; set: (v: string) => void }) => (
    <div className={s.row}>
      <label className={s.label}>{label}</label>
      <input className={s.input} value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <div className={s.item}>
      <div className={s.itemHead}>
        <strong>{item.type}</strong>
        <button type="button" className={`${s.btn} ${s.danger}`} onClick={onRemove}>Remove</button>
      </div>
      {item.type === 'link' && (
        <>
          <Field label="url" value={item.url} set={(v) => onChange({ ...item, url: v })} />
          <Field label="title" value={item.title ?? ''} set={(v) => onChange({ ...item, title: v })} />
        </>
      )}
      {item.type === 'html' && (
        <>
          <Field label="title" value={item.title ?? ''} set={(v) => onChange({ ...item, title: v })} />
          <div className={s.row}>
            <label className={s.label}>html</label>
            <textarea className={s.input} rows={4} value={item.html} onChange={(e) => onChange({ ...item, html: e.target.value })} />
          </div>
          <Field label="text" value={item.text ?? ''} set={(v) => onChange({ ...item, text: v })} />
        </>
      )}
      {item.type === 'image' && (
        <>
          <Field label="url" value={item.url} set={(v) => onChange({ ...item, url: v })} />
          <Field label="width" value={String(item.width ?? '')} set={(v) => onChange({ ...item, width: Number(v) })} />
          <Field label="height" value={String(item.height ?? '')} set={(v) => onChange({ ...item, height: Number(v) })} />
          <Field label="title" value={item.title ?? ''} set={(v) => onChange({ ...item, title: v })} />
        </>
      )}
      {item.type === 'file' && (
        <>
          <Field label="url" value={item.url} set={(v) => onChange({ ...item, url: v })} />
          <Field label="mediaType" value={item.mediaType ?? ''} set={(v) => onChange({ ...item, mediaType: v })} />
          <Field label="title" value={item.title ?? ''} set={(v) => onChange({ ...item, title: v })} />
        </>
      )}
      {item.type === 'ltiResourceLink' && (
        <>
          <Field label="url" value={item.url ?? ''} set={(v) => onChange({ ...item, url: v })} />
          <Field label="title" value={item.title ?? ''} set={(v) => onChange({ ...item, title: v })} />
          <div className={s.row}>
            <label className={s.label}>custom (JSON)</label>
            <input
              className={s.input}
              value={JSON.stringify(item.custom ?? {})}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange({ ...item, custom: parsed });
                } catch {
                  // ignore parse errors while typing
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function ContentItemBuilder({
  items,
  onChange,
}: {
  items: ContentItem[];
  onChange: (next: ContentItem[]) => void;
}) {
  function add(type: CIType) {
    onChange([...items, TEMPLATES[type]]);
  }
  function update(idx: number, next: ContentItem) {
    onChange(items.map((it, i) => (i === idx ? next : it)));
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['link', 'html', 'image', 'file', 'ltiResourceLink'] as CIType[]).map((t) => (
          <button key={t} type="button" className={`${s.btn} ${s.secondary}`} onClick={() => add(t)}>
            {`Add ${t}`}
          </button>
        ))}
      </div>
      {items.map((it, i) => (
        <ItemForm key={i} item={it} onChange={(n) => update(i, n)} onRemove={() => remove(i)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/ContentItemBuilder.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/ContentItemBuilder.tsx atomic-decay/client/components/ContentItemBuilder.module.css \
        atomic-decay/client/components/ContentItemBuilder.test.tsx
git commit -m "feat(decay): add ContentItemBuilder for Deep Linking"
```

---

## Task 4: DeepLinkTester component

**Files:**
- Modify: `atomic-decay/client/testers/DeepLinkTester.tsx`

- [ ] **Step 1: Replace placeholder with full tester**

```tsx
import { useState } from 'react';
import { Card } from '../components/Card';
import { ModeToggle } from '../components/ModeToggle';
import { Chip } from '../components/Chip';
import { RecipeRunner } from '../components/RecipeRunner';
import { ResponseViewer } from '../components/ResponseViewer';
import { JsonInspector } from '../components/JsonInspector';
import { ContentItemBuilder, type ContentItem } from '../components/ContentItemBuilder';
import { useLaunch } from '../context/LaunchContext';
import { callService } from '../lib/serviceClient';
import { decodeJwtPayload } from '../lib/format';
import { DEEPLINK_RECIPES, DEEPLINK_SIGN } from '../recipes/deepLinkRecipes';
import type { Mode, ServiceResponse } from '../types/tester';

export function DeepLinkTester() {
  const launch = useLaunch();
  const token = launch.jwt!;
  const returnUrl = launch.deepLinking?.deep_link_return_url ?? '';

  const [mode, setMode] = useState<Mode>('recipes');
  const [recipeId, setRecipeId] = useState(DEEPLINK_RECIPES[0].id);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [signResp, setSignResp] = useState<ServiceResponse | null>(null);

  const recipe = DEEPLINK_RECIPES.find((r) => r.id === recipeId)!;

  async function execute(_step: { endpoint: typeof DEEPLINK_SIGN }, values: Record<string, unknown>) {
    let parsed: ContentItem[];
    try {
      parsed = JSON.parse(String(values.content_items ?? '[]'));
    } catch (e) {
      return {
        status: 0,
        durationMs: 0,
        request: { method: 'POST', url: DEEPLINK_SIGN.path, body: values.content_items },
        response: { headers: {}, body: null },
        error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      } as ServiceResponse;
    }
    return callService({ method: 'POST', path: DEEPLINK_SIGN.path, token, query: {}, body: parsed });
  }

  async function signFreeForm() {
    const r = await callService({ method: 'POST', path: DEEPLINK_SIGN.path, token, query: {}, body: items });
    setSignResp(r);
  }

  function submitJwtToPlatform(jwt: string) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = returnUrl;
    const f = document.createElement('input');
    f.type = 'hidden';
    f.name = 'JWT';
    f.value = jwt;
    form.appendChild(f);
    document.body.appendChild(form);
    form.submit();
  }

  // The /lti_services/deeplink/sign endpoint returns { jwt: "..." } not a ServiceResponse.
  // We wrap it locally to fit ResponseViewer.
  const signedJwt =
    signResp && (signResp.response.body as { jwt?: string } | null)?.jwt
      ? (signResp.response.body as { jwt: string }).jwt
      : null;

  return (
    <Card title="Deep Linking">
      <ModeToggle value={mode} onChange={setMode} />
      {mode === 'recipes' ? (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {DEEPLINK_RECIPES.map((r) => (
              <Chip key={r.id} active={r.id === recipeId} onClick={() => setRecipeId(r.id)}>
                {r.name}
              </Chip>
            ))}
          </div>
          <RecipeRunner recipe={recipe} execute={execute} />
        </>
      ) : (
        <>
          <p style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-sm)' }}>
            Build the content-item array, sign it, preview the JWT, then submit to the platform.
            Return URL: <code>{returnUrl || '(none)'}</code>
          </p>
          <ContentItemBuilder items={items} onChange={setItems} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={signFreeForm}
              style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', padding: '7px 14px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
              Sign &amp; preview JWT
            </button>
            <button type="button"
              disabled={!signedJwt || !returnUrl}
              onClick={() => signedJwt && submitJwtToPlatform(signedJwt)}
              style={{ background: signedJwt && returnUrl ? 'var(--accent)' : 'var(--border)', color: 'var(--bg)', border: 'none', padding: '7px 14px', borderRadius: 4, fontWeight: 600, cursor: signedJwt && returnUrl ? 'pointer' : 'not-allowed' }}>
              Submit to platform
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <ResponseViewer value={signResp} />
            {signedJwt ? (
              <Card title="Decoded JWT payload">
                <JsonInspector data={decodeJwtPayload(signedJwt)} />
              </Card>
            ) : null}
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
git add atomic-decay/client/testers/DeepLinkTester.tsx
git commit -m "feat(decay): replace Deep Linking placeholder with full tester (recipes + content-item builder)"
```

---

## Task 5: Manual smoke

- [ ] **Step 1: Smoke-test against `atomic-lti-test`**

Trigger a Deep Linking launch (set the LMS placement to `LtiDeepLinkingRequest`). Verify:
- Tab `#deeplink` is enabled.
- "Recipes" mode runs each of the six recipes; the response panel shows the signed JWT.
- "Free-form" mode renders the ContentItemBuilder; "Add link" / "Add html" / etc. add forms; entries can be edited and removed; "Sign & preview JWT" calls the server, displays the JWT in `ResponseViewer`, and decodes it in a JsonInspector.
- "Submit to platform" submits a hidden form to `deep_link_return_url`; verify on the LMS that the content item was placed.
- Switching back to a non-Deep-Linking launch disables the tab.

- [ ] **Step 2: Final commit**

```bash
git status   # commit any drift
```

---

## Self-review checklist

1. **Spec coverage:** Six recipes covering all five content-item types + multi ✓; free-form content-item builder ✓; sign-and-preview JWT before submit ✓; tab disabled outside DL launches (already wired in foundation App.tsx) ✓.
2. **Placeholder scan:** No "TBD" / vague tasks. Server-side change is one route rename; everything else is full code.
3. **Type consistency:** Local `ContentItem` type covers the five spec types; matches the variants accepted by `atomic_lti::deep_linking::ContentItem` (link / html / image / file / ltiResourceLink with case-insensitive aliases). The recipe defaults use the lowercase `type` form which the Rust deserializer accepts.
