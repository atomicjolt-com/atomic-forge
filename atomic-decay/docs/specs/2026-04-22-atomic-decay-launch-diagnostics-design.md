---
name: Atomic Decay launch-page diagnostic UI
status: draft
date: 2026-04-22
owner: justin.ball@atomicjolt.com
---

# Atomic Decay Launch-Page Diagnostic UI

## Background

When a platform launches Atomic Decay via LTI 1.3, the `/lti/launch` handler validates
the OIDC state and id_token JWT, mints a tool-signed JWT (`ToolJwtStore::build_jwt`),
and returns an HTML shell that bootstraps `client/app.ts`. Today `app.ts` renders a
literal `<h1>Hello World</h1>` after the post-launch handshake completes, with a
Deep Linking button shown only for DL launches and a silent Names-and-Roles fetch
that logs to the console.

For anyone integrating Atomic Decay with a new LMS, this page is useless as a
diagnostic. The interesting LTI data (user, roles, context, platform, custom
claims) is decoded server-side and then thrown away — it never reaches the
browser.

This spec replaces the Hello World launch view with a styled diagnostic page that
exposes the launch payload, the tool JWT, and the HTTP request context behind
three explicit buttons. It preserves the existing Deep Linking and NRPS flows.

## Goals

1. Make the launch page visually consistent with the existing public landing page
   (`handlers/index.rs`) — same black/yellow palette, same typographic feel.
2. Show a "what just happened" summary at the top of the page the moment the
   launch completes (user, role badges, context title, platform, deployment).
3. Provide three toggle buttons that reveal diagnostic panels:
   - **LTI Claims (annotated)** — every claim from the decoded platform id_token,
     rendered as a two-column table with value + human-readable explanation.
   - **Raw JWT & launch data** — the raw tool JWT string, its decoded payload, the
     full decoded platform id_token as JSON, plus the full `LAUNCH_SETTINGS` object.
   - **HTTP context** — request headers, cookies, host, scheme, user-agent, client
     IP, and server-side timing breakdown of the launch validation.
4. Preserve existing Deep Linking and NRPS behavior; restyle only.

## Non-goals

- No dedicated `/diagnostics` route. The launch page itself is the diagnostic.
- No persistence, logging, or export of launch data.
- No React/Vue migration. Keep hand-rolled DOM.
- No dedicated CSS pipeline. Styles are inlined by the TS bundle.
- No UI tests. Behavior is presentational; only the server-side JSON shape is
  testable, and that's covered by a single unit test.
- No redaction of claim values on the rendered page. This is a debugging tool
  for the person who just performed the launch, viewing their own data.

## Architecture

```
  LMS platform
       │  POST /lti/launch (id_token, state)
       ▼
  ┌──────────────────────────────────────────────┐
  │ handlers/lti.rs::launch                      │
  │   1. decode+validate id_token  ──┐           │
  │   2. mint tool JWT               │ timings   │
  │   3. collect HttpContext    ◀────┘           │
  │   4. serialize LAUNCH_SETTINGS               │
  │   5. return HTML shell + app.js              │
  └──────────────────────────────────────────────┘
       │
       ▼
  ┌──────────────────────────────────────────────┐
  │ client/app.ts                                │
  │   ltiLaunch(launchSettings) ──► handshake    │
  │     ├─ renderShell()     (header + summary) │
  │     ├─ renderButtons()   (3 toggles + DL)   │
  │     └─ renderPanels()    (collapsed by dflt)│
  └──────────────────────────────────────────────┘
```

The design preserves the clean separation between the Rust handler (which owns
validation, JWT minting, and data collection) and the TS client (which owns
rendering). The only new coupling is a larger `LAUNCH_SETTINGS` JSON surface.

## Data contract

`LAUNCH_SETTINGS` — fields already present are kept verbatim. New fields:

```ts
type LaunchSettings = {
  // Existing
  state: string;
  stateVerified: boolean;
  ltiStorageParams: LTIStorageParams;
  jwt: string;                  // tool JWT (unchanged)
  deepLinking: DeepLinkingClaim | null;

  // New
  idTokenClaims: Record<string, unknown>; // raw platform id_token claims
  launchInfo: {
    platformIss: string;
    clientId: string;
    deploymentId: string;
    targetLinkUri: string;
    messageType: string;        // e.g. LtiResourceLinkRequest
    ltiVersion: string;
    launchedAt: string;         // ISO-8601
  };
  httpContext: {
    host: string;
    scheme: string;             // http | https
    method: string;             // POST
    path: string;               // /lti/launch
    userAgent: string | null;   // from user-agent header
    clientIp: string | null;    // first value of X-Forwarded-For, else null
    headers: Record<string, string>;  // lowercased header names, values as-is
    cookies: Record<string, string>;  // parsed from Cookie header
    timingsMs: {
      oidcStateLookup: number;
      jwkFetch: number;
      jwtDecode: number;
      jwtValidation: number;
      toolJwtMint: number;
      total: number;
    };
  };
};
```

### Rust-side additions

- Add a small `LaunchTimings` struct in `handlers/lti.rs` that wraps
  `std::time::Instant` checkpoints and produces a map of ms durations.
- Collect headers + cookies into `HashMap<String, String>` from the existing
  `headers` clone. Lowercase header names; keep values as strings. Cookies are
  parsed from the `Cookie` header via a small helper (split on `;`, trim, split
  on first `=`).
- Add serialization of `id_token.claims` (it's already `Serialize`) into the
  settings JSON.
- The `launchInfo` block is derived entirely from values already in scope
  (`id_token.claims`, `id_token.target_link_uri`, `Utc::now()`).

### Sensitive header / cookie handling

The `httpContext.headers` map includes `authorization` and `cookie` verbatim.
This is a deliberate choice for a debugging surface served only to the user who
just authenticated — the page is rendered for their own session. **No
redaction.** If this tool is ever deployed in a shared-screen debugging
scenario, that's a deployment-time concern, not a code-time one.

## Client rendering plan

`client/app.ts` grows from ~80 lines to ~300 and is split into small named
functions. No framework, no new dependencies.

Structure:

```
app.ts
├─ STYLES (string constant, inlined on first render)
├─ CLAIM_EXPLANATIONS (Record<string, string>)
├─ renderShell(settings)        -> header + summary card + button bar
├─ renderClaimsPanel(claims)    -> two-column annotated table
├─ renderRawPanel(settings)     -> <pre> JSON + raw JWT
├─ renderHttpPanel(httpCtx)     -> headers + cookies + timing tables
├─ renderDeepLinkSection()      -> preserved, restyled
├─ renderNrpsSection(jwt)       -> fetch + render results panel
└─ main()                        -> ltiLaunch().then(wire everything up)
```

Button behavior: each toggles a single panel. Only one panel visible at a time
(clicking an open button collapses it; clicking a different button swaps).
No animation — just `display: none`/`block`.

Claim annotations: hardcoded map keyed by LTI claim URI. Unknown claims render
with "Platform-specific or custom claim" so the page works on any platform.

### Palette (matches `handlers/index.rs`)

- Background: `#000`
- Surface: `#1a1a1a`
- Accent: `rgb(255, 221, 0)`
- Body text: `#e5e5e5` on dark surfaces
- Monospace: system monospace stack, `0.9rem`

## Error handling

- If `ltiLaunch()` rejects (state verification fails, etc.), render a styled
  error card using the same palette, not the naked "Failed to launch" string.
- If `idTokenClaims` or `httpContext` is missing from `LAUNCH_SETTINGS`
  (e.g. during schema rollover), the relevant panel renders "No data
  available for this launch" rather than crashing.
- NRPS fetch failures render into the NRPS panel, not the console.

## Testing

- **Rust unit test** in `handlers/lti.rs` for one thing only: that
  `LaunchTimings` captures checkpoints in order and produces non-negative
  durations. The `LAUNCH_SETTINGS` JSON shape is verified by existing
  integration tests that hit `/lti/launch` — they will continue to pass since
  no existing field is renamed or removed.
- **No client tests.** Behavior is purely presentational.
- **Manual verification**: launch Atomic Decay from the atomic-lti-test
  platform, confirm all three panels render, confirm existing Deep Linking
  flow still works.

## Rollout

Single branch, single PR. No feature flag — the diagnostic surface is safe to
turn on for the one person viewing their own launch.

## Work breakdown (high-level, detailed plan to follow)

1. Extend `LAUNCH_SETTINGS` server-side (Rust).
2. Add `LaunchTimings` helper + wire checkpoints through the launch flow.
3. Rewrite `client/app.ts` with shell + three panels + restyled DL/NRPS.
4. Add the one Rust unit test.
5. Manual smoke test against atomic-lti-test.
