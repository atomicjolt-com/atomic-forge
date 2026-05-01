---
name: Atomic Decay multi-spec LTI tester
status: draft
date: 2026-04-25
owner: justin.ball@atomicjolt.com
---

# Atomic Decay Multi-Spec LTI Tester

## Background

Atomic Decay's `/lti/launch` page today renders a single-purpose diagnostic
view (shipped 2026-04-22 via the launch-page diagnostic UI spec). It shows a
launch summary, three toggleable inspector panels (annotated claims, raw JWT &
launch data, HTTP context), an auto-fetched NRPS roster dump, and a
hardcoded "Hello World" Deep Linking submitter. The shell is hand-rolled
TypeScript that mounts a static DOM tree from `LAUNCH_SETTINGS`.

That surface is great for *inspecting* a single launch but is not built for
*exercising* LTI services. NRPS has no parameters; Deep Linking has one fixed
content type; AGS has zero scaffolding even though `atomic-lti` already
implements line items, scores, and results. There is no way for a developer or
QA engineer to drive a parameterized request, run a multi-step happy path, or
compare canned scenarios against an LMS.

This spec turns the launch page into a **multi-spec LTI conformance tester** —
a single SPA where any user (tool implementer, platform implementer, QA
engineer) can pick an LTI Advantage service, choose a recipe (e.g. "AGS happy
path") or drop into free-form mode to fire arbitrary requests, and see the
exact request and response in a structured viewer.

The tester covers three specs in this effort: **NRPS**, **AGS**, and **Deep
Linking**. Asset Processor and Link & Content Service are explicitly out of
scope here — they require net-new protocol implementations in `atomic-lti` and
will each be brainstormed as their own efforts (protocol → handlers → tester).

## Goals

1. Convert the launch page into a single SPA with a top tab bar — one tab per
   spec or inspector — preserving the existing launch-summary header.
2. Each spec tab supports two modes via a toggle:
   - **Recipes** — curated multi-step flows (e.g. AGS happy path) that run
     step-by-step with each request and response visible.
   - **Free-form** — per-endpoint request panels where the user fills any
     parameters and fires a single request.
3. Cover three specs with full recipe + free-form support: **NRPS**, **AGS**
   (line items / scores / results), **Deep Linking** (link / html_fragment /
   image / file / lti_resource_link).
4. Preserve the existing inspector panels (Claims, HTTP, Raw JWT) — they
   become tabs in the new shell.
5. Migrate the client from hand-rolled TS to **React** with CSS Modules,
   keeping the existing yellow/black aesthetic. No new heavy dependencies.
6. Server-side endpoints stay thin: each spec gets a small `/lti_services/*`
   surface that proxies requests through to the platform with the proper
   client-credentials token. The browser never sees the platform token.

## Non-goals

- **No** Asset Processor support. Out of scope; will be its own project.
- **No** Link & Content Service support. Out of scope; will be its own project.
- **No** persistence of request/response history. Each launch is ephemeral.
  Export path is "Copy as cURL" on every request panel.
- **No** authentication or authorization changes. The tester is gated by the
  same launch JWT as today.
- **No** changes to `/lti/init`, `/lti/redirect`, or the OIDC flow.
- **No** server-side proxy of arbitrary URLs. Every backend endpoint maps to
  exactly one LTI service operation; no "send any request anywhere" hatch.
- **No** Redux, Zustand, MobX, or other state-management library. React
  built-ins are sufficient.
- **No** UI component library (Chakra, MUI, Radix, etc.). All primitives are
  hand-rolled in CSS Modules.
- **No** redaction in response viewers. Same trust model as the existing
  diagnostic page — the user is viewing their own launch session.

## Personas

The tester serves three personas with one UI:

1. **Tool developer** building their own LTI tool, using Atomic Decay as a
   reference implementation. Wants to see correct request/response shapes,
   canonical recipes for each spec, and copy-paste-able cURL exports.
2. **Platform/LMS implementer** testing their own platform's compliance.
   Wants to drive each LTI service from the tool side and observe whether the
   platform responds correctly to happy-path and negative scenarios.
3. **QA engineer** doing pre-release acceptance testing on a specific LMS
   deployment. Wants a checklist-style "did each recipe pass" view.

The two modes serve these personas differently: recipes for learners and QA
("show me what AGS looks like, did it pass"); free-form for hands-on
developers ("fire a one-off request with these exact params").

## Architecture

```
  LMS platform
       │  POST /lti/launch (id_token, state)
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ atomic-decay / handlers/lti.rs::launch                       │
  │   1. validate id_token, mint tool JWT  (unchanged)          │
  │   2. serialize LAUNCH_SETTINGS         (unchanged shape)    │
  │   3. return HTML shell + main.js bundle                     │
  └─────────────────────────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ client/main.tsx (React)                                      │
  │   <App> root                                                 │
  │     ├─ <Header>           launch summary, always visible    │
  │     ├─ <TabBar>           hash-routed: #claims, #http,      │
  │     │                       #nrps, #ags, #deeplink, #raw    │
  │     └─ <Tester> for active tab                               │
  │           ├─ <ModeToggle> Recipes ⇄ Free-form               │
  │           ├─ <RecipeRunner> in recipes mode                  │
  │           └─ <RequestPanel> + <ResponseViewer> in free-form │
  └─────────────────────────────────────────────────────────────┘
       │  fetch /lti_services/*  (Bearer = tool JWT)
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ atomic-decay / handlers/lti_services.rs                      │
  │   - validates tool JWT via JwtClaims extractor              │
  │   - mints platform-scoped client-credentials token          │
  │   - proxies one operation per endpoint to platform          │
  │   - returns JSON with { request, response, timings, error } │
  └─────────────────────────────────────────────────────────────┘
       │
       ▼
   Platform (Canvas, Moodle, …)
```

The tool JWT is the only auth secret the browser ever holds. Platform tokens
are minted server-side per request with cached short-lived results
(`request_service_token_cached` from `atomic-lti::client_credentials`).

## Tech choices (locked-in defaults)

These are second-order decisions that the brainstorm settled. They are
captured here so plan authors don't relitigate them.

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Replaces the hand-rolled DOM in `app.ts`. The tester has enough internal state (per-tab mode, recipe step, request history) that components are warranted. |
| Routing | Custom 30-line hash router | No `react-router` dependency. URL state is just `location.hash`; the App listens to `hashchange` and re-renders. |
| State management | `useState`/`useReducer` + one Context for `LAUNCH_SETTINGS` | No Redux, no Zustand. Each tester owns its local state; launch claims live in a single read-only context. |
| Styling | CSS Modules + design tokens | Keeps the existing yellow/black palette in `theme.module.css`. No Tailwind, no styled-components. |
| Component primitives | Hand-rolled (~7 components) | RequestPanel, ResponseViewer, RecipeRunner, JsonInspector, ModeToggle, Chip, Card. All small, no headless lib. |
| Build | Extend existing Vite config with `@vitejs/plugin-react` | Same `npm run build` / `npm run dev` flow. Output bundle replaces `app.js`. |
| Tests | Vitest + React Testing Library for the shell + one component test per recipe runner | The existing Rust integration tests for `/lti/launch` keep passing because `LAUNCH_SETTINGS` shape is unchanged. |
| Persistence | None (ephemeral, per-launch) | Export path is "Copy as cURL" on every request panel. |

## Component model

```
client/
├── main.tsx                       entry: ltiLaunch() then mount <App>
├── App.tsx                        top-level layout, tab routing
├── theme.module.css               design tokens (palette, spacing, fonts)
├── context/
│   └── LaunchContext.tsx          read-only context wrapping LAUNCH_SETTINGS
├── components/
│   ├── Header.tsx                 logo + launch summary
│   ├── TabBar.tsx                 hash-routed tab nav
│   ├── ModeToggle.tsx             Recipes ⇄ Free-form pill toggle
│   ├── Card.tsx                   surface container with title slot
│   ├── Chip.tsx                   pill (used for filters, sub-flow nav)
│   ├── RequestPanel.tsx           form-driven request builder
│   ├── ResponseViewer.tsx         status badge + headers + body (JSON or table)
│   ├── RecipeRunner.tsx           multi-step flow with per-step request/response
│   ├── JsonInspector.tsx          collapsible JSON tree
│   └── CopyAsCurlButton.tsx       export action
├── inspectors/
│   ├── ClaimsInspector.tsx        annotated claim table (ported from app.ts)
│   ├── HttpInspector.tsx          headers/cookies/timings (ported)
│   └── RawInspector.tsx           raw JWT + LAUNCH_SETTINGS dump (ported)
├── testers/
│   ├── NrpsTester.tsx             tab body for #nrps
│   ├── AgsTester.tsx              tab body for #ags (3 sub-flows)
│   └── DeepLinkTester.tsx         tab body for #deeplink (5 content types)
└── recipes/
    ├── nrpsRecipes.ts             recipe definitions for NRPS
    ├── agsRecipes.ts              recipe definitions for AGS
    └── deepLinkRecipes.ts         recipe definitions for Deep Linking
```

### Recipe data shape

A recipe is a sequence of steps; each step is a server endpoint call with
parameter defaults that the user can override before running. Recipes are
authored as plain TS data — no DSL, no runtime parser.

```ts
type Recipe = {
  id: string;                     // "ags-happy-path"
  name: string;                   // "Happy path · full grade round-trip"
  description: string;
  steps: RecipeStep[];
};

type RecipeStep = {
  label: string;                  // "Create line item"
  endpoint: ServiceEndpoint;      // identifies a /lti_services/* operation
  defaults: Record<string, unknown>;  // pre-filled params
  expect?: { status: number };    // pass/fail criteria
};

type ServiceEndpoint = {
  spec: 'nrps' | 'ags' | 'deeplink';
  method: 'GET' | 'POST' | 'PUT';
  path: string;                   // server-side route under /lti_services/*
  paramSchema: ParamSchema;       // describes form fields for this endpoint
};
```

### Server-side endpoint surface

The browser only knows `/lti_services/*` URLs. Each endpoint validates the
tool JWT (existing `JwtClaims` extractor), mints/uses a platform token, and
proxies exactly one operation:

| Spec | Endpoint | Method | Maps to |
|---|---|---|---|
| NRPS | `/lti_services/nrps/members` | GET | `names_and_roles::list` with query params `role`, `limit`, `rlid` |
| AGS | `/lti_services/ags/line_items` | GET | `assignment_grade_services::line_items::list` |
| AGS | `/lti_services/ags/line_items` | POST | `assignment_grade_services::line_items::create` |
| AGS | `/lti_services/ags/line_items/:id/scores` | POST | `assignment_grade_services::score::post` |
| AGS | `/lti_services/ags/line_items/:id/results` | GET | `assignment_grade_services::results::list` |
| Deep Linking | `/lti_services/deeplink/sign` | POST | `DeepLinking::create_deep_link_jwt` (existing endpoint, renamed for consistency) |

Every endpoint returns the same envelope so the client can render a uniform
`ResponseViewer`:

```ts
type ServiceResponse = {
  status: number;                 // HTTP status from platform
  durationMs: number;             // round-trip time
  request: { method: string; url: string; body: unknown };
  response: { headers: Record<string, string>; body: unknown };
  error?: string;                 // populated on transport / token errors
};
```

### Hash routing

```
/lti/launch          → redirects to #claims by default
/lti/launch#claims   → ClaimsInspector
/lti/launch#http     → HttpInspector
/lti/launch#raw      → RawInspector
/lti/launch#nrps     → NrpsTester
/lti/launch#ags      → AgsTester
/lti/launch#deeplink → DeepLinkTester
```

Tabs that can't apply to the current launch render disabled with a tooltip
("This launch did not include an AGS endpoint claim"). The tab is still
clickable to show the disabled-state explanation; it just doesn't render a
working tester.

## Per-spec testers

### NRPS

- **Recipes**:
  1. *Fetch full roster* — GET with no filter; render member table.
  2. *Filter to learners only* — GET with `role=Learner`.
  3. *Resource-link membership* — GET with `rlid` from current launch.
- **Free-form**: form fields for `role` (dropdown), `limit` (number), `rlid`
  (text), pagination via "next" link from `Link` header.
- **Response viewer**: members table (id, name, email, roles, status) with a
  toggle to raw JSON.

### AGS

Three sub-flows shown as chips beneath the mode toggle:

1. **Line items** — list and create. Get-by-id, update, and delete are
   deferred; the three recipes below don't need them, and adding them later
   is a pure addition (no contract changes).
2. **Scores** — POST a score for a given line item and user.
3. **Results** — list results for a given line item.

- **Recipes**:
  1. *Happy path* — POST line item → POST score → GET results, expects success at each step.
  2. *Re-grade existing student* — GET line items → pick one → POST new score for an existing user.
  3. *Token scope mismatch* (negative test) — request a line item operation
     with a deliberately-wrong scope; expects 403.
- **Free-form**: per-endpoint request panel with the right form fields.
- **Response viewer**: line items shown as a table; scores and results as
  JSON tree with a "decoded" view that flags `scoreGiven > scoreMaximum`,
  `activityProgress`/`gradingProgress` enum mismatches, etc.

### Deep Linking

- **Recipes**:
  1. *Return single link* — one `link` content item.
  2. *Return HTML fragment* — one `html` fragment.
  3. *Return file* — one `file` content item with media type and url.
  4. *Return image* — one `image` with width/height.
  5. *Return LTI resource link* — one `ltiResourceLink` with custom params.
  6. *Return multiple items* — array combining link + html_fragment.
- **Free-form**: a content-item builder that lets the user add multiple
  items, pick a type per item, fill its fields, and preview the signed JWT
  before submitting to the platform.
- **Sign-and-preview**: the existing `/lti_services/deeplink/sign` endpoint is
  reused (renamed from `/lti_services/sign_deep_link` for consistency); the
  signed JWT is shown decoded in a JsonInspector before the user submits.

Tester is disabled with explanation if the launch was not a `LtiDeepLinkingRequest`.

### Inspectors (preserved)

- **ClaimsInspector** — annotated claim table from current `app.ts`.
- **HttpInspector** — headers/cookies/timings tables from current `app.ts`.
- **RawInspector** — raw tool JWT, decoded payload, full LAUNCH_SETTINGS.

These are direct ports — same content, restyled with CSS Modules and
restructured as React components.

## Data contract

`LAUNCH_SETTINGS` is unchanged from the launch-diagnostics spec. The tester
reads existing fields:

- `idTokenClaims` — for tab availability detection (NRPS claim presence,
  AGS endpoint presence, Deep Linking request type).
- `jwt` — sent as Bearer token to all `/lti_services/*` endpoints.
- `deepLinking` — drives Deep Linking tab availability and `deep_link_return_url`.
- `httpContext`, `launchInfo` — read by HttpInspector.

No new server-side fields required. The new `/lti_services/ags/*` endpoints
read `JwtClaims` (existing extractor) for `client_id`, `platform_iss`, and
the AGS endpoint URL from claims.

## Error handling

Three categories of failures, all surfaced into the active tester (not the
console):

1. **Tool-side errors** — invalid form, unparseable JSON, network failure
   reaching `/lti_services/*`. Shown as a red banner inside the
   `ResponseViewer` with a "Retry" button.
2. **Server-side errors from the proxy** — token mint failure, JSON
   serialization, missing required claim. Returned in the `ServiceResponse`
   envelope as `error: string` with a descriptive message; status reflects
   the HTTP failure code.
3. **Platform errors** — non-2xx response from the LMS. `ServiceResponse`
   echoes the platform's status, headers, and body so the user can see what
   the platform said.

Tabs that can't apply (e.g. AGS tab on a launch with no AGS claim) render
the tester body as a single explanation card, not an error.

## Testing

- **React component tests** (Vitest + React Testing Library) for:
  - `<TabBar>` — hash routing, disabled-tab behavior.
  - `<RecipeRunner>` — step progression, error handling, "Run all" vs.
    "Step through".
  - `<RequestPanel>` — form rendering from `ParamSchema`, submit wiring.
  - `<ResponseViewer>` — JSON tree, error rendering, "Copy as cURL".
- **Rust integration tests** (one per new endpoint) — verify the proxy
  endpoint validates JWT, calls the right `atomic-lti` function, and returns
  the `ServiceResponse` envelope shape. Mock the platform with the existing
  `atomic-lti-test` fixtures.
- **Existing tests for `/lti/launch`** continue to pass — `LAUNCH_SETTINGS`
  shape is unchanged.
- **Manual verification** — launch from `atomic-lti-test`, run each recipe
  for each spec, confirm responses look sensible.

## Rollout

Four sequential plans. Each plan is one PR. After plan 1 lands, plans 2–4 are
independent and can be parallelized; this spec recommends sequential execution
so each tester can validate the foundation primitives.

| # | Plan file | Scope |
|---|---|---|
| 1 | `docs/superpowers/plans/2026-04-25-atomic-decay-tester-foundation.md` | React migration of `app.ts`, hash router, theme, primitives (RequestPanel, ResponseViewer, RecipeRunner, etc.), ported inspectors (Claims, HTTP, Raw), TabBar with placeholder tester tabs |
| 2 | `docs/superpowers/plans/2026-04-25-atomic-decay-nrps-tester.md` | Server param-aware NRPS endpoint, NrpsTester component, three recipes, free-form mode, member table response view |
| 3 | `docs/superpowers/plans/2026-04-25-atomic-decay-ags-tester.md` | Server line-items / scores / results endpoints, AgsTester with three sub-flows, three recipes, free-form per endpoint |
| 4 | `docs/superpowers/plans/2026-04-25-atomic-decay-deep-linking-tester.md` | Server endpoint rename + multi-content-item support, DeepLinkTester with five content types, six recipes, sign-and-preview |

Asset Processor and Link & Content Service are deliberately excluded from
this rollout. Each will be its own brainstorm → spec → plan series, starting
with the protocol implementation in `atomic-lti` before any UI design.

## Work breakdown (high-level, detailed plans to follow)

For each of the four plans:

1. Spec the externally-visible behavior (component props, server endpoint
   shape, recipe definitions).
2. Write Rust handlers + Rust tests.
3. Write React components + Vitest tests.
4. Wire into TabBar / hash router.
5. Manual smoke-test against `atomic-lti-test`.
6. Open PR; squash-merge.

The foundation plan (#1) is the gate — it establishes the components and
patterns the three spec plans build on. Once it lands, the three spec plans
are mechanically similar and can be executed in any order or in parallel.
