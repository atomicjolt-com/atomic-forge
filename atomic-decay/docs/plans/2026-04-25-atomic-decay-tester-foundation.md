# Atomic Decay Tester Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `client/app.ts` with a React SPA shell — top-tab nav, theme tokens, hash routing, ported inspectors (Claims, HTTP, Raw), and a complete primitive library that the three spec testers (NRPS, AGS, Deep Linking) will plug into. After this plan ships, the launch page looks identical to today's diagnostic page in user-visible behavior, but is built from React components that the spec-tester plans extend.

**Architecture:** Single SPA at `/lti/launch`. `client/main.tsx` is the entry; reads `window.LAUNCH_SETTINGS` once, mounts `<App>` with a `LaunchContext` provider, and delegates the existing `ltiLaunch()` handshake. Routing is hash-based (`#claims`, `#http`, `#raw`, `#nrps`, `#ags`, `#deeplink`); a 30-line custom hook listens for `hashchange`. Styling is CSS Modules with one `theme.module.css` file holding the yellow/black design tokens. State is local-only — `useState`/`useReducer` plus one read-only Context for `LAUNCH_SETTINGS`.

**Tech Stack:** React 18, TypeScript, Vite + `@vitejs/plugin-react`, CSS Modules, Vitest + React Testing Library, jsdom.

Spec reference: `docs/superpowers/specs/2026-04-25-atomic-decay-spec-tester-design.md`.

---

## File structure (this plan)

```
atomic-decay/
├── package.json                  Modify: add React, RTL, plugin-react
├── vite.config.js                Modify: register @vitejs/plugin-react
├── tsconfig.json                 Create: enable JSX
├── vitest.config.ts              Create: jsdom + RTL setup
├── client/
│   ├── app.ts                    Delete (replaced by main.tsx)
│   ├── app-init.ts               Unchanged
│   ├── main.tsx                  Create: React entry, ltiLaunch() handshake
│   ├── App.tsx                   Create: top-level layout
│   ├── theme.module.css          Create: design tokens
│   ├── context/
│   │   └── LaunchContext.tsx     Create: read-only LAUNCH_SETTINGS context
│   ├── hooks/
│   │   └── useHashRoute.ts       Create: tiny hash router
│   ├── components/
│   │   ├── Header.tsx            Create
│   │   ├── Header.module.css     Create
│   │   ├── TabBar.tsx            Create
│   │   ├── TabBar.module.css     Create
│   │   ├── ModeToggle.tsx        Create
│   │   ├── ModeToggle.module.css Create
│   │   ├── Card.tsx              Create
│   │   ├── Card.module.css       Create
│   │   ├── Chip.tsx              Create
│   │   ├── Chip.module.css       Create
│   │   ├── RequestPanel.tsx      Create
│   │   ├── RequestPanel.module.css Create
│   │   ├── ResponseViewer.tsx    Create
│   │   ├── ResponseViewer.module.css Create
│   │   ├── RecipeRunner.tsx      Create
│   │   ├── RecipeRunner.module.css Create
│   │   ├── JsonInspector.tsx     Create
│   │   ├── JsonInspector.module.css Create
│   │   └── CopyAsCurlButton.tsx  Create
│   ├── inspectors/
│   │   ├── ClaimsInspector.tsx   Create (port from app.ts)
│   │   ├── HttpInspector.tsx     Create (port from app.ts)
│   │   └── RawInspector.tsx      Create (port from app.ts)
│   ├── testers/
│   │   ├── NrpsTester.tsx        Create (placeholder; filled by Plan 2)
│   │   ├── AgsTester.tsx         Create (placeholder; filled by Plan 3)
│   │   └── DeepLinkTester.tsx    Create (placeholder; filled by Plan 4)
│   ├── lib/
│   │   ├── claimExplanations.ts  Create (port from app.ts)
│   │   ├── format.ts             Create (port escapeHtml/formatValue/decodeJwtPayload from app.ts)
│   │   └── curl.ts               Create (cURL string builder)
│   └── types/
│       └── tester.ts             Create (Recipe, ServiceEndpoint, ServiceResponse types)
└── src/handlers/lti.rs           Modify: change asset key from "app.js" to "main.js"
```

`Header.tsx`, `Card.tsx`, `Chip.tsx` are pure render — no behavioral tests. Behavioral components (`TabBar`, `ModeToggle`, `RequestPanel`, `ResponseViewer`, `RecipeRunner`, `JsonInspector`) get TDD-written tests.

---

## Task 1: Add React + test-runner dependencies

**Files:**
- Modify: `atomic-decay/package.json`

- [ ] **Step 1: Install React + plugin-react + RTL + jsdom**

Run:
```bash
cd atomic-decay
npm install react@^18 react-dom@^18
npm install -D @types/react@^18 @types/react-dom@^18 @vitejs/plugin-react@^4 \
  @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25
```
Expected: `package.json` and `package-lock.json` updated; no errors.

- [ ] **Step 2: Verify deps landed**

Run: `node -e "const p=require('./package.json');console.log(p.dependencies.react, p.devDependencies['@vitejs/plugin-react'])"`
Expected: prints React version and plugin version, no `undefined`.

- [ ] **Step 3: Commit**

```bash
git add atomic-decay/package.json atomic-decay/package-lock.json
git commit -m "chore(decay): add React, RTL, jsdom, plugin-react for SPA migration"
```

---

## Task 2: Configure Vite for React + JSX

**Files:**
- Modify: `atomic-decay/vite.config.js`
- Create: `atomic-decay/tsconfig.json`

- [ ] **Step 1: Update `vite.config.js` to register React plugin and rename entry**

Replace the existing file with:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const assetsManifestPlugin = () => ({
  name: 'assets-manifest',
  apply: 'build',
  generateBundle(_options, bundle) {
    const manifest = {};
    for (const [fileName, chunk] of Object.entries(bundle)) {
      if (chunk.type === 'chunk' && chunk.isEntry) {
        // Map "app-init" -> "app-init.ts", "main" -> "main.tsx" so handlers can look them up
        const ext = chunk.name === 'app-init' ? '.ts' : '.tsx';
        manifest[chunk.name + ext] = `/assets/js/${fileName}`;
      }
    }
    this.emitFile({
      type: 'asset',
      fileName: 'assets.json',
      source: JSON.stringify(manifest, null, 2),
    });
  },
});

export default defineConfig({
  root: '.',
  publicDir: false,
  plugins: [react(), assetsManifestPlugin()],
  build: {
    outDir: 'src/assets/js',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'app-init': path.resolve(__dirname, 'client/app-init.ts'),
        'main': path.resolve(__dirname, 'client/main.tsx'),
      },
      output: {
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
      },
    },
    manifest: false,
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : true,
    minify: process.env.NODE_ENV !== 'development',
  },
  server: { watch: { ignored: ['!**/client/**'] } },
});
```

- [ ] **Step 2: Create `tsconfig.json` for JSX + strict TS**

Write `atomic-decay/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "types": ["vite/client"]
  },
  "include": ["client", "types.d.ts"]
}
```

- [ ] **Step 3: Confirm Vite still builds with empty entry**

Run:
```bash
cd atomic-decay
mkdir -p client && touch client/main.tsx
echo 'console.log("placeholder");' > client/main.tsx
npm run build
```
Expected: build succeeds, `src/assets/js/assets.json` contains `"main.tsx": "/assets/js/main-...js"`.

- [ ] **Step 4: Commit**

```bash
git add atomic-decay/vite.config.js atomic-decay/tsconfig.json atomic-decay/client/main.tsx
git commit -m "chore(decay): wire Vite for React + JSX, add tsconfig"
```

---

## Task 3: Configure Vitest for React Testing Library

**Files:**
- Create: `atomic-decay/vitest.config.ts`
- Create: `atomic-decay/client/test-setup.ts`
- Modify: `atomic-decay/package.json` (test script — already `vitest`, verify)

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./client/test-setup.ts'],
    globals: true,
    include: ['client/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 2: Write `client/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Sanity test — write a trivial passing test**

Write `client/sanity.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('vitest + RTL setup', () => {
  it('renders text', () => {
    render(<p>hello</p>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the sanity test**

Run: `cd atomic-decay && npm test -- --run`
Expected: 1 test passes.

- [ ] **Step 5: Delete the sanity test, keep configs**

Run: `rm atomic-decay/client/sanity.test.tsx`

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/vitest.config.ts atomic-decay/client/test-setup.ts
git commit -m "chore(decay): configure Vitest with jsdom + RTL setup"
```

---

## Task 4: Create theme tokens

**Files:**
- Create: `atomic-decay/client/theme.module.css`

- [ ] **Step 1: Write `theme.module.css` with design tokens**

```css
:root {
  --bg: #000;
  --surface: #1a1a1a;
  --surface-2: #111;
  --border: #2a2a2a;
  --text: #e5e5e5;
  --text-dim: #888;
  --text-faint: #555;
  --accent: rgb(255, 221, 0);
  --accent-hover: #ffe833;
  --success: #4a4;
  --danger: #b00;
  --danger-bg: #2a0000;
  --warn: #fc6;

  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-lg: 8px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;

  --fs-xs: 0.75rem;
  --fs-sm: 0.85rem;
  --fs-md: 1rem;
  --fs-lg: 1.25rem;
  --fs-xl: 1.5rem;
}

body {
  margin: 0;
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
}

*, *::before, *::after { box-sizing: border-box; }
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/theme.module.css
git commit -m "feat(decay): add design tokens for tester SPA"
```

---

## Task 5: Define tester types

**Files:**
- Create: `atomic-decay/client/types/tester.ts`

- [ ] **Step 1: Write `client/types/tester.ts`**

```ts
export type SpecId = 'nrps' | 'ags' | 'deeplink';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ParamSchema = {
  fields: ParamField[];
};

export type ParamField =
  | { name: string; label: string; kind: 'text'; default?: string; placeholder?: string }
  | { name: string; label: string; kind: 'number'; default?: number; min?: number; max?: number }
  | { name: string; label: string; kind: 'select'; options: { value: string; label: string }[]; default?: string }
  | { name: string; label: string; kind: 'textarea'; default?: string; rows?: number };

export type ServiceEndpoint = {
  spec: SpecId;
  method: HttpMethod;
  path: string;             // /lti_services/...
  paramSchema: ParamSchema;
};

export type ServiceResponse = {
  status: number;
  durationMs: number;
  request: { method: string; url: string; body: unknown };
  response: { headers: Record<string, string>; body: unknown };
  error?: string;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  steps: RecipeStep[];
};

export type RecipeStep = {
  label: string;
  endpoint: ServiceEndpoint;
  defaults: Record<string, unknown>;
  expect?: { status: number };
};

export type Mode = 'recipes' | 'freeform';
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/types/tester.ts
git commit -m "feat(decay): define Recipe, ServiceEndpoint, ServiceResponse types"
```

---

## Task 6: Port format helpers from `app.ts`

**Files:**
- Create: `atomic-decay/client/lib/format.ts`

- [ ] **Step 1: Write the failing test**

Write `atomic-decay/client/lib/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatValue, decodeJwtPayload, shortRole } from './format';

describe('format', () => {
  it('formatValue stringifies objects with 2-space indent', () => {
    expect(formatValue({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
  it('formatValue returns string values verbatim', () => {
    expect(formatValue('plain')).toBe('plain');
  });
  it('formatValue returns empty string for null/undefined', () => {
    expect(formatValue(null)).toBe('');
    expect(formatValue(undefined)).toBe('');
  });
  it('decodeJwtPayload decodes the payload of a 3-part JWT', () => {
    const payload = btoa(JSON.stringify({ sub: '42' })).replace(/=+$/, '');
    const jwt = `header.${payload}.sig`;
    expect(decodeJwtPayload(jwt)).toEqual({ sub: '42' });
  });
  it('decodeJwtPayload returns null for empty input', () => {
    expect(decodeJwtPayload('')).toBe(null);
  });
  it('shortRole returns the fragment after #', () => {
    expect(shortRole('http://purl.imsglobal.org/vocab/lis/v2/membership#Learner')).toBe('Learner');
  });
  it('shortRole returns the last path segment if no #', () => {
    expect(shortRole('http://example.com/Instructor')).toBe('Instructor');
  });
});
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `cd atomic-decay && npm test -- --run client/lib/format.test.ts`
Expected: FAIL with "Cannot find module './format'".

- [ ] **Step 3: Implement `client/lib/format.ts`**

```ts
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function decodeJwtPayload(jwt: string): unknown {
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

export function shortRole(uri: string): string {
  const hash = uri.lastIndexOf('#');
  if (hash >= 0) return uri.slice(hash + 1);
  const slash = uri.lastIndexOf('/');
  return slash >= 0 ? uri.slice(slash + 1) : uri;
}
```

- [ ] **Step 4: Run the test — verify it passes**

Run: `cd atomic-decay && npm test -- --run client/lib/format.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/client/lib/format.ts atomic-decay/client/lib/format.test.ts
git commit -m "feat(decay): port format helpers (formatValue, decodeJwtPayload, shortRole)"
```

---

## Task 7: Port claim explanations

**Files:**
- Create: `atomic-decay/client/lib/claimExplanations.ts`

- [ ] **Step 1: Write `claimExplanations.ts` (port from `app.ts`)**

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

export function explainClaim(key: string): string {
  return CLAIM_EXPLANATIONS[key] || 'Platform-specific or custom claim.';
}
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/lib/claimExplanations.ts
git commit -m "feat(decay): port claim explanations table"
```

---

## Task 8: cURL builder

**Files:**
- Create: `atomic-decay/client/lib/curl.ts`

- [ ] **Step 1: Write the failing test**

Write `client/lib/curl.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildCurl } from './curl';

describe('buildCurl', () => {
  it('produces a GET command with header', () => {
    expect(
      buildCurl({ method: 'GET', url: 'https://example.com/x', headers: { authorization: 'Bearer abc' } }),
    ).toBe(
      "curl -X GET 'https://example.com/x' -H 'authorization: Bearer abc'",
    );
  });

  it('includes JSON body when provided', () => {
    expect(
      buildCurl({
        method: 'POST',
        url: 'https://example.com/x',
        headers: { 'content-type': 'application/json' },
        body: { a: 1 },
      }),
    ).toBe(
      "curl -X POST 'https://example.com/x' -H 'content-type: application/json' --data '{\"a\":1}'",
    );
  });

  it('escapes single quotes in body', () => {
    const out = buildCurl({ method: 'POST', url: 'https://x', headers: {}, body: { msg: "it's" } });
    expect(out).toContain("--data '{\"msg\":\"it'\\''s\"}'");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

Run: `cd atomic-decay && npm test -- --run client/lib/curl.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `client/lib/curl.ts`**

```ts
export type CurlInput = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
};

function shellQuote(s: string): string {
  // Escape single quotes for safe inclusion inside single-quoted shell strings.
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export function buildCurl({ method, url, headers, body }: CurlInput): string {
  const parts = [`curl -X ${method}`, shellQuote(url)];
  for (const [k, v] of Object.entries(headers)) {
    parts.push(`-H ${shellQuote(`${k}: ${v}`)}`);
  }
  if (body !== undefined && body !== null) {
    const json = typeof body === 'string' ? body : JSON.stringify(body);
    parts.push(`--data ${shellQuote(json)}`);
  }
  return parts.join(' ');
}
```

- [ ] **Step 4: Run — verify pass**

Run: `cd atomic-decay && npm test -- --run client/lib/curl.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/client/lib/curl.ts atomic-decay/client/lib/curl.test.ts
git commit -m "feat(decay): add cURL string builder"
```

---

## Task 9: LaunchContext

**Files:**
- Create: `atomic-decay/client/context/LaunchContext.tsx`

- [ ] **Step 1: Write `LaunchContext.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import type { DiagnosticLaunchSettings } from '../../types';

const LaunchContext = createContext<DiagnosticLaunchSettings | null>(null);

export function LaunchProvider({
  value,
  children,
}: {
  value: DiagnosticLaunchSettings;
  children: ReactNode;
}) {
  return <LaunchContext.Provider value={value}>{children}</LaunchContext.Provider>;
}

export function useLaunch(): DiagnosticLaunchSettings {
  const v = useContext(LaunchContext);
  if (!v) throw new Error('useLaunch must be used inside <LaunchProvider>');
  return v;
}
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/context/LaunchContext.tsx
git commit -m "feat(decay): add read-only LaunchContext"
```

---

## Task 10: useHashRoute hook

**Files:**
- Create: `atomic-decay/client/hooks/useHashRoute.ts`

- [ ] **Step 1: Write the failing test**

Write `client/hooks/useHashRoute.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  beforeEach(() => { window.location.hash = ''; });
  afterEach(() => { window.location.hash = ''; });

  it('returns the default when hash is empty', () => {
    const { result } = renderHook(() => useHashRoute('claims'));
    expect(result.current[0]).toBe('claims');
  });

  it('returns the hash without the leading #', () => {
    window.location.hash = '#nrps';
    const { result } = renderHook(() => useHashRoute('claims'));
    expect(result.current[0]).toBe('nrps');
  });

  it('updates when navigate() is called', () => {
    const { result } = renderHook(() => useHashRoute('claims'));
    act(() => result.current[1]('ags'));
    expect(window.location.hash).toBe('#ags');
    expect(result.current[0]).toBe('ags');
  });

  it('reacts to hashchange events', () => {
    const { result } = renderHook(() => useHashRoute('claims'));
    act(() => {
      window.location.hash = '#deeplink';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current[0]).toBe('deeplink');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/hooks/useHashRoute.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useHashRoute`**

```ts
import { useCallback, useEffect, useState } from 'react';

function readHash(fallback: string): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.length > 0 ? h : fallback;
}

export function useHashRoute(defaultRoute: string): [string, (next: string) => void] {
  const [route, setRoute] = useState<string>(() => readHash(defaultRoute));

  useEffect(() => {
    const onChange = () => setRoute(readHash(defaultRoute));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [defaultRoute]);

  const navigate = useCallback((next: string) => {
    window.location.hash = next;
  }, []);

  return [route, navigate];
}
```

- [ ] **Step 4: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/hooks/useHashRoute.test.tsx`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/client/hooks/useHashRoute.ts atomic-decay/client/hooks/useHashRoute.test.tsx
git commit -m "feat(decay): add useHashRoute hook"
```

---

## Task 11: Card and Chip primitives (no tests — pure render)

**Files:**
- Create: `atomic-decay/client/components/Card.tsx`
- Create: `atomic-decay/client/components/Card.module.css`
- Create: `atomic-decay/client/components/Chip.tsx`
- Create: `atomic-decay/client/components/Chip.module.css`

- [ ] **Step 1: Write `Card.module.css`**

```css
.card {
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}
.title {
  margin: 0 0 var(--space-3);
  color: var(--accent);
  font-size: var(--fs-md);
  font-weight: 600;
}
```

- [ ] **Step 2: Write `Card.tsx`**

```tsx
import type { ReactNode } from 'react';
import s from './Card.module.css';

export function Card({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.card}>
      {title ? <h3 className={s.title}>{title}</h3> : null}
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Write `Chip.module.css`**

```css
.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  background: var(--surface);
  color: var(--text-dim);
  cursor: pointer;
  border: none;
  font-family: inherit;
}
.chip.on {
  background: var(--accent);
  color: var(--bg);
  font-weight: 600;
}
.chip:disabled { cursor: not-allowed; opacity: 0.5; }
```

- [ ] **Step 4: Write `Chip.tsx`**

```tsx
import s from './Chip.module.css';

export function Chip({
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${s.chip} ${active ? s.on : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/client/components/Card.tsx atomic-decay/client/components/Card.module.css \
        atomic-decay/client/components/Chip.tsx atomic-decay/client/components/Chip.module.css
git commit -m "feat(decay): add Card and Chip primitives"
```

---

## Task 12: ModeToggle (with tests)

**Files:**
- Create: `atomic-decay/client/components/ModeToggle.tsx`
- Create: `atomic-decay/client/components/ModeToggle.module.css`

- [ ] **Step 1: Write the failing test**

Write `client/components/ModeToggle.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeToggle } from './ModeToggle';

describe('ModeToggle', () => {
  it('marks the active mode', () => {
    render(<ModeToggle value="recipes" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Recipes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Free-form' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('calls onChange when the other mode is clicked', async () => {
    const onChange = vi.fn();
    render(<ModeToggle value="recipes" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Free-form' }));
    expect(onChange).toHaveBeenCalledWith('freeform');
  });
});
```

Note: `@testing-library/user-event` ships with RTL ≥ 16.

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/ModeToggle.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `ModeToggle.module.css`**

```css
.toggle { display: inline-flex; background: var(--surface); border-radius: var(--radius-md); padding: 3px; margin-bottom: var(--space-3); }
.btn { padding: 6px 14px; font-size: var(--fs-xs); color: var(--text-dim); background: transparent; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; }
.btn.on { background: var(--accent); color: var(--bg); font-weight: 600; }
```

- [ ] **Step 4: Implement `ModeToggle.tsx`**

```tsx
import s from './ModeToggle.module.css';
import type { Mode } from '../types/tester';

const MODES: Array<{ value: Mode; label: string }> = [
  { value: 'recipes', label: 'Recipes' },
  { value: 'freeform', label: 'Free-form' },
];

export function ModeToggle({ value, onChange }: { value: Mode; onChange: (next: Mode) => void }) {
  return (
    <div className={s.toggle} role="group" aria-label="Mode">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          aria-pressed={value === m.value}
          className={`${s.btn} ${value === m.value ? s.on : ''}`}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/ModeToggle.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/ModeToggle.tsx atomic-decay/client/components/ModeToggle.module.css \
        atomic-decay/client/components/ModeToggle.test.tsx
git commit -m "feat(decay): add ModeToggle component"
```

---

## Task 13: TabBar (with tests)

**Files:**
- Create: `atomic-decay/client/components/TabBar.tsx`
- Create: `atomic-decay/client/components/TabBar.module.css`

- [ ] **Step 1: Write the failing test**

Write `client/components/TabBar.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from './TabBar';

const TABS = [
  { id: 'claims', label: 'Claims', enabled: true },
  { id: 'nrps', label: 'NRPS', enabled: true },
  { id: 'ags', label: 'AGS', enabled: false, disabledReason: 'No AGS claim' },
];

describe('TabBar', () => {
  it('marks the current tab', () => {
    render(<TabBar tabs={TABS} current="nrps" onSelect={() => {}} />);
    expect(screen.getByRole('tab', { name: 'NRPS' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Claims' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onSelect with the tab id when clicked', async () => {
    const onSelect = vi.fn();
    render(<TabBar tabs={TABS} current="claims" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('tab', { name: 'NRPS' }));
    expect(onSelect).toHaveBeenCalledWith('nrps');
  });

  it('disables tabs with enabled=false but still allows selection', async () => {
    const onSelect = vi.fn();
    render(<TabBar tabs={TABS} current="claims" onSelect={onSelect} />);
    const ags = screen.getByRole('tab', { name: /AGS/ });
    expect(ags).toHaveAttribute('aria-disabled', 'true');
    expect(ags).toHaveAttribute('title', 'No AGS claim');
    await userEvent.click(ags);
    // disabled tabs are still clickable so the user sees the disabled-state explanation
    expect(onSelect).toHaveBeenCalledWith('ags');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/TabBar.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `TabBar.module.css`**

```css
.bar { display: flex; background: var(--bg); border-bottom: 1px solid var(--border); padding: 0 var(--space-4); }
.tab { padding: 10px 14px; color: var(--text-dim); border: none; border-bottom: 2px solid transparent; background: transparent; font-size: var(--fs-xs); cursor: pointer; font-family: inherit; }
.tab[aria-selected='true'] { color: var(--accent); border-bottom-color: var(--accent); }
.tab[aria-disabled='true'] { color: var(--text-faint); }
```

- [ ] **Step 4: Implement `TabBar.tsx`**

```tsx
import s from './TabBar.module.css';

export type TabDef = {
  id: string;
  label: string;
  enabled: boolean;
  disabledReason?: string;
};

export function TabBar({
  tabs,
  current,
  onSelect,
}: {
  tabs: TabDef[];
  current: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className={s.bar} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === current}
          aria-disabled={!t.enabled}
          title={!t.enabled ? t.disabledReason : undefined}
          className={s.tab}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/TabBar.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/TabBar.tsx atomic-decay/client/components/TabBar.module.css \
        atomic-decay/client/components/TabBar.test.tsx
git commit -m "feat(decay): add TabBar component"
```

---

## Task 14: Header

**Files:**
- Create: `atomic-decay/client/components/Header.tsx`
- Create: `atomic-decay/client/components/Header.module.css`

- [ ] **Step 1: Write `Header.module.css`**

```css
.header { padding: var(--space-3) var(--space-5); border-bottom: 3px solid var(--accent); background: var(--bg); display: flex; align-items: baseline; gap: var(--space-3); justify-content: space-between; }
.logo { color: #fff; font-weight: 700; font-size: var(--fs-md); margin: 0; }
.logo .accent { color: var(--accent); }
.summary { padding: var(--space-3) var(--space-5); background: var(--surface-2); display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); border-bottom: 1px solid var(--border); }
.summary dt { color: var(--text-dim); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em; }
.summary dd { margin: 2px 0 0; color: #fff; font-size: var(--fs-sm); word-break: break-word; }
.role { display: inline-block; background: var(--accent); color: var(--bg); padding: 2px 8px; border-radius: 3px; font-size: var(--fs-xs); font-weight: 600; margin: 2px 4px 2px 0; }
.dim { color: var(--text-dim); }
```

- [ ] **Step 2: Write `Header.tsx`**

```tsx
import s from './Header.module.css';
import { useLaunch } from '../context/LaunchContext';
import { shortRole } from '../lib/format';

export function Header() {
  const launch = useLaunch();
  const claims = (launch.idTokenClaims ?? {}) as Record<string, unknown>;
  const info = launch.launchInfo;

  const userName =
    (claims['name'] as string | undefined) ||
    (claims['email'] as string | undefined) ||
    '(not provided)';
  const rolesRaw = claims['https://purl.imsglobal.org/spec/lti/claim/roles'];
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : [];
  const ctx = claims['https://purl.imsglobal.org/spec/lti/claim/context'] as
    | { title?: string; label?: string; id?: string }
    | undefined;
  const contextTitle = ctx?.title || ctx?.label || ctx?.id || '(no context)';

  return (
    <>
      <header className={s.header}>
        <h1 className={s.logo}>
          Atomic <span className={s.accent}>Decay</span>
        </h1>
        <span className={s.dim}>{info?.messageType ?? 'LTI Tester'}</span>
      </header>
      <dl className={s.summary}>
        <div><dt>User</dt><dd>{userName}</dd></div>
        <div><dt>Roles</dt><dd>
          {roles.length > 0
            ? roles.map((r) => <span key={r} className={s.role}>{shortRole(r)}</span>)
            : <span className={s.dim}>(no roles)</span>}
        </dd></div>
        <div><dt>Context</dt><dd>{contextTitle}</dd></div>
        <div><dt>Platform</dt><dd>{info?.platformIss ?? '(unknown)'}</dd></div>
        <div><dt>Client ID</dt><dd>{info?.clientId ?? '(unknown)'}</dd></div>
        <div><dt>Deployment</dt><dd>{info?.deploymentId ?? '(unknown)'}</dd></div>
      </dl>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add atomic-decay/client/components/Header.tsx atomic-decay/client/components/Header.module.css
git commit -m "feat(decay): add Header with launch summary"
```

---

## Task 15: JsonInspector (with tests)

**Files:**
- Create: `atomic-decay/client/components/JsonInspector.tsx`
- Create: `atomic-decay/client/components/JsonInspector.module.css`

- [ ] **Step 1: Write the failing test**

Write `client/components/JsonInspector.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JsonInspector } from './JsonInspector';

describe('JsonInspector', () => {
  it('renders a pretty-printed JSON string', () => {
    render(<JsonInspector data={{ a: 1 }} />);
    const pre = screen.getByTestId('json');
    expect(pre.textContent).toContain('"a": 1');
  });

  it('renders the placeholder when data is null', () => {
    render(<JsonInspector data={null} />);
    expect(screen.getByText('(no data)')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/JsonInspector.test.tsx`

- [ ] **Step 3: Implement `JsonInspector.module.css`**

```css
.pre { background: var(--bg); border: 1px solid var(--border); color: var(--accent); padding: var(--space-3); border-radius: var(--radius-sm); overflow-x: auto; font-size: var(--fs-xs); font-family: var(--font-mono); white-space: pre-wrap; word-break: break-all; margin: 0; }
.empty { color: var(--text-dim); font-size: var(--fs-sm); }
```

- [ ] **Step 4: Implement `JsonInspector.tsx`**

```tsx
import s from './JsonInspector.module.css';
import { formatValue } from '../lib/format';

export function JsonInspector({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <p className={s.empty}>(no data)</p>;
  }
  return (
    <pre className={s.pre} data-testid="json">
      {formatValue(data)}
    </pre>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/JsonInspector.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/JsonInspector.tsx atomic-decay/client/components/JsonInspector.module.css \
        atomic-decay/client/components/JsonInspector.test.tsx
git commit -m "feat(decay): add JsonInspector component"
```

---

## Task 16: CopyAsCurlButton

**Files:**
- Create: `atomic-decay/client/components/CopyAsCurlButton.tsx`

- [ ] **Step 1: Write `CopyAsCurlButton.tsx`** (presentational; logic is in `lib/curl.ts` and is already tested)

```tsx
import { useState } from 'react';
import { buildCurl, type CurlInput } from '../lib/curl';

export function CopyAsCurlButton({ input }: { input: CurlInput }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(buildCurl(input));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied!' : 'Copy as cURL'}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/components/CopyAsCurlButton.tsx
git commit -m "feat(decay): add CopyAsCurlButton"
```

---

## Task 17: RequestPanel (with tests)

**Files:**
- Create: `atomic-decay/client/components/RequestPanel.tsx`
- Create: `atomic-decay/client/components/RequestPanel.module.css`

- [ ] **Step 1: Write the failing test**

Write `client/components/RequestPanel.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestPanel } from './RequestPanel';
import type { ServiceEndpoint } from '../types/tester';

const ENDPOINT: ServiceEndpoint = {
  spec: 'nrps',
  method: 'GET',
  path: '/lti_services/nrps/members',
  paramSchema: {
    fields: [
      { name: 'role', label: 'Role', kind: 'select',
        options: [{ value: '', label: 'any' }, { value: 'Learner', label: 'Learner' }] },
      { name: 'limit', label: 'Limit', kind: 'number', default: 50 },
    ],
  },
};

describe('RequestPanel', () => {
  it('renders one input per field with defaults', () => {
    render(<RequestPanel endpoint={ENDPOINT} initialValues={{}} onSubmit={() => {}} />);
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Limit')).toHaveValue(50);
  });

  it('submits a record of name -> value', async () => {
    const onSubmit = vi.fn();
    render(<RequestPanel endpoint={ENDPOINT} initialValues={{ role: 'Learner' }} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /Send/ }));
    expect(onSubmit).toHaveBeenCalledWith({ role: 'Learner', limit: 50 });
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/RequestPanel.test.tsx`

- [ ] **Step 3: Implement `RequestPanel.module.css`**

```css
.row { display: flex; gap: var(--space-2); align-items: center; margin: 6px 0; }
.label { color: var(--text-dim); min-width: 110px; font-size: var(--fs-sm); }
.input { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 6px 8px; border-radius: var(--radius-sm); font-size: var(--fs-sm); flex: 1; font-family: inherit; }
.actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
.btn { background: var(--accent); color: var(--bg); border: none; padding: 7px 14px; border-radius: var(--radius-sm); font-size: var(--fs-sm); font-weight: 600; cursor: pointer; font-family: inherit; }
.btn.secondary { background: var(--border); color: var(--text); }
.method { font-family: var(--font-mono); font-weight: 700; padding: 2px 7px; border-radius: var(--radius-sm); font-size: var(--fs-xs); margin-right: var(--space-2); }
.method.get { background: #1a3a1a; color: var(--success); }
.method.post { background: #3a2a1a; color: var(--warn); }
.method.put { background: #2a1a3a; color: #c9c; }
.method.delete { background: #3a1a1a; color: #f88; }
```

- [ ] **Step 4: Implement `RequestPanel.tsx`**

```tsx
import { useMemo, useState } from 'react';
import s from './RequestPanel.module.css';
import type { ParamField, ServiceEndpoint } from '../types/tester';

function defaultsFromSchema(endpoint: ServiceEndpoint, initial: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of endpoint.paramSchema.fields) {
    if (initial[f.name] !== undefined) {
      out[f.name] = initial[f.name];
    } else if ('default' in f && f.default !== undefined) {
      out[f.name] = f.default;
    } else {
      out[f.name] = f.kind === 'number' ? 0 : '';
    }
  }
  return out;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ParamField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const id = `f-${field.name}`;
  if (field.kind === 'select') {
    return (
      <select
        id={id}
        className={s.input}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (field.kind === 'number') {
    return (
      <input
        id={id}
        type="number"
        className={s.input}
        value={Number(value ?? 0)}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }
  if (field.kind === 'textarea') {
    return (
      <textarea
        id={id}
        className={s.input}
        rows={field.rows ?? 4}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      id={id}
      type="text"
      className={s.input}
      placeholder={field.placeholder}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function RequestPanel({
  endpoint,
  initialValues,
  onSubmit,
  submitLabel = 'Send request',
}: {
  endpoint: ServiceEndpoint;
  initialValues: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  submitLabel?: string;
}) {
  const initial = useMemo(() => defaultsFromSchema(endpoint, initialValues), [endpoint, initialValues]);
  const [values, setValues] = useState(initial);
  const methodClass = `${s.method} ${s[endpoint.method.toLowerCase()] ?? ''}`;

  return (
    <div>
      <p>
        <span className={methodClass}>{endpoint.method}</span>
        <code>{endpoint.path}</code>
      </p>
      {endpoint.paramSchema.fields.map((f) => (
        <div key={f.name} className={s.row}>
          <label htmlFor={`f-${f.name}`} className={s.label}>{f.label}</label>
          <FieldInput field={f} value={values[f.name]} onChange={(v) => setValues({ ...values, [f.name]: v })} />
        </div>
      ))}
      <div className={s.actions}>
        <button type="button" className={s.btn} onClick={() => onSubmit(values)}>
          {submitLabel}
        </button>
        <button type="button" className={`${s.btn} ${s.secondary}`} onClick={() => setValues(initial)}>
          Reset
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/RequestPanel.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/RequestPanel.tsx atomic-decay/client/components/RequestPanel.module.css \
        atomic-decay/client/components/RequestPanel.test.tsx
git commit -m "feat(decay): add RequestPanel form-driven component"
```

---

## Task 18: ResponseViewer (with tests)

**Files:**
- Create: `atomic-decay/client/components/ResponseViewer.tsx`
- Create: `atomic-decay/client/components/ResponseViewer.module.css`

- [ ] **Step 1: Write the failing test**

Write `client/components/ResponseViewer.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponseViewer } from './ResponseViewer';
import type { ServiceResponse } from '../types/tester';

const RESP: ServiceResponse = {
  status: 201,
  durationMs: 84,
  request: { method: 'POST', url: 'https://x/line_items', body: { label: 'Q1' } },
  response: { headers: { 'content-type': 'application/json' }, body: { id: 'li_1' } },
};

describe('ResponseViewer', () => {
  it('renders status badge and duration', () => {
    render(<ResponseViewer value={RESP} />);
    expect(screen.getByText(/201/)).toBeInTheDocument();
    expect(screen.getByText(/84 ms/)).toBeInTheDocument();
  });

  it('renders the response body as JSON', () => {
    render(<ResponseViewer value={RESP} />);
    expect(screen.getByTestId('json').textContent).toContain('"id": "li_1"');
  });

  it('renders an error banner when error is present', () => {
    const err: ServiceResponse = { ...RESP, status: 500, error: 'token mint failed' };
    render(<ResponseViewer value={err} />);
    expect(screen.getByText('token mint failed')).toBeInTheDocument();
  });

  it('renders nothing when value is null', () => {
    const { container } = render(<ResponseViewer value={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/ResponseViewer.test.tsx`

- [ ] **Step 3: Implement `ResponseViewer.module.css`**

```css
.head { display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-2); font-family: var(--font-mono); font-size: var(--fs-sm); }
.status { padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 700; }
.status.ok { background: #1a3a1a; color: var(--success); }
.status.err { background: #3a1a1a; color: #f88; }
.duration { color: var(--text-dim); }
.error { background: var(--danger-bg); border: 1px solid var(--danger); color: #ffb3b3; padding: 10px; border-radius: var(--radius-sm); margin-bottom: var(--space-3); }
```

- [ ] **Step 4: Implement `ResponseViewer.tsx`**

```tsx
import s from './ResponseViewer.module.css';
import type { ServiceResponse } from '../types/tester';
import { JsonInspector } from './JsonInspector';

export function ResponseViewer({ value }: { value: ServiceResponse | null }) {
  if (!value) return null;
  const ok = value.status >= 200 && value.status < 300 && !value.error;
  return (
    <div>
      <div className={s.head}>
        <span className={`${s.status} ${ok ? s.ok : s.err}`}>{value.status}</span>
        <span className={s.duration}>{value.durationMs} ms</span>
        <span className={s.duration}>{value.request.method} {value.request.url}</span>
      </div>
      {value.error ? <div className={s.error}>{value.error}</div> : null}
      <JsonInspector data={value.response.body} />
    </div>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/ResponseViewer.test.tsx`
Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/ResponseViewer.tsx atomic-decay/client/components/ResponseViewer.module.css \
        atomic-decay/client/components/ResponseViewer.test.tsx
git commit -m "feat(decay): add ResponseViewer component"
```

---

## Task 19: RecipeRunner (with tests)

**Files:**
- Create: `atomic-decay/client/components/RecipeRunner.tsx`
- Create: `atomic-decay/client/components/RecipeRunner.module.css`

- [ ] **Step 1: Write the failing test**

Write `client/components/RecipeRunner.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeRunner } from './RecipeRunner';
import type { Recipe, ServiceResponse } from '../types/tester';

const RECIPE: Recipe = {
  id: 'r1',
  name: 'two-step',
  description: 'two steps',
  steps: [
    {
      label: 'Step 1',
      endpoint: { spec: 'nrps', method: 'GET', path: '/a', paramSchema: { fields: [] } },
      defaults: {},
      expect: { status: 200 },
    },
    {
      label: 'Step 2',
      endpoint: { spec: 'nrps', method: 'GET', path: '/b', paramSchema: { fields: [] } },
      defaults: {},
      expect: { status: 200 },
    },
  ],
};

function ok(status = 200): ServiceResponse {
  return {
    status,
    durationMs: 1,
    request: { method: 'GET', url: '/x', body: null },
    response: { headers: {}, body: { ok: true } },
  };
}

describe('RecipeRunner', () => {
  it('runs steps sequentially when "Run all" is clicked', async () => {
    const exec = vi.fn().mockResolvedValue(ok());
    render(<RecipeRunner recipe={RECIPE} execute={exec} />);
    await userEvent.click(screen.getByRole('button', { name: /Run all/ }));
    await waitFor(() => expect(exec).toHaveBeenCalledTimes(2));
  });

  it('marks a step as failed when status does not match expected', async () => {
    const exec = vi.fn().mockResolvedValue(ok(500));
    render(<RecipeRunner recipe={RECIPE} execute={exec} />);
    await userEvent.click(screen.getByRole('button', { name: /Run all/ }));
    await waitFor(() => expect(screen.getAllByText(/FAIL/).length).toBeGreaterThan(0));
  });

  it('stops after a failure', async () => {
    const exec = vi.fn().mockResolvedValueOnce(ok(500)).mockResolvedValueOnce(ok());
    render(<RecipeRunner recipe={RECIPE} execute={exec} />);
    await userEvent.click(screen.getByRole('button', { name: /Run all/ }));
    await waitFor(() => expect(exec).toHaveBeenCalledTimes(1));
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `cd atomic-decay && npm test -- --run client/components/RecipeRunner.test.tsx`

- [ ] **Step 3: Implement `RecipeRunner.module.css`**

```css
.step { display: flex; align-items: center; gap: var(--space-3); padding: 8px 0; border-bottom: 1px solid var(--border); font-size: var(--fs-sm); }
.step:last-child { border-bottom: none; }
.num { width: 22px; height: 22px; border-radius: 999px; background: var(--border); color: var(--text-dim); display: inline-flex; align-items: center; justify-content: center; font-size: var(--fs-xs); font-weight: 700; }
.step.done .num { background: var(--success); color: var(--bg); }
.step.fail .num { background: var(--danger); color: #fff; }
.step.active .num { background: var(--accent); color: var(--bg); }
.label { flex: 1; color: var(--text); }
.meta { color: var(--success); font-size: var(--fs-xs); }
.fail .meta { color: #f88; }
.actions { margin-top: var(--space-3); display: flex; gap: var(--space-2); }
.btn { background: var(--accent); color: var(--bg); border: none; padding: 7px 14px; border-radius: var(--radius-sm); font-size: var(--fs-sm); font-weight: 600; cursor: pointer; font-family: inherit; }
.btn.secondary { background: var(--border); color: var(--text); }
```

- [ ] **Step 4: Implement `RecipeRunner.tsx`**

```tsx
import { useState } from 'react';
import s from './RecipeRunner.module.css';
import type { Recipe, ServiceResponse } from '../types/tester';
import { JsonInspector } from './JsonInspector';

type StepState = 'idle' | 'running' | 'done' | 'fail';

export function RecipeRunner({
  recipe,
  execute,
}: {
  recipe: Recipe;
  execute: (step: Recipe['steps'][number], values: Record<string, unknown>) => Promise<ServiceResponse>;
}) {
  const [statuses, setStatuses] = useState<StepState[]>(() => recipe.steps.map(() => 'idle'));
  const [responses, setResponses] = useState<(ServiceResponse | null)[]>(() => recipe.steps.map(() => null));

  async function runAll() {
    const next = recipe.steps.map(() => 'idle' as StepState);
    setStatuses([...next]);
    setResponses(recipe.steps.map(() => null));
    for (let i = 0; i < recipe.steps.length; i++) {
      next[i] = 'running';
      setStatuses([...next]);
      try {
        const resp = await execute(recipe.steps[i], recipe.steps[i].defaults);
        setResponses((rs) => rs.map((r, idx) => (idx === i ? resp : r)));
        const expectedStatus = recipe.steps[i].expect?.status;
        const ok = expectedStatus ? resp.status === expectedStatus : resp.status >= 200 && resp.status < 300;
        next[i] = ok ? 'done' : 'fail';
        setStatuses([...next]);
        if (!ok) return;
      } catch (e) {
        next[i] = 'fail';
        setStatuses([...next]);
        return;
      }
    }
  }

  return (
    <div>
      <p style={{ color: 'var(--text-dim)', fontSize: 'var(--fs-sm)' }}>{recipe.description}</p>
      {recipe.steps.map((step, i) => {
        const st = statuses[i];
        const klass = `${s.step} ${st === 'done' ? s.done : ''} ${st === 'fail' ? s.fail : ''} ${st === 'running' ? s.active : ''}`;
        const meta =
          st === 'running' ? 'running…' :
          st === 'done' ? `OK · ${responses[i]?.durationMs ?? '?'} ms` :
          st === 'fail' ? `FAIL · ${responses[i]?.status ?? '—'}` :
          '';
        return (
          <div key={i} className={klass}>
            <span className={s.num}>{i + 1}</span>
            <span className={s.label}>{step.label}</span>
            <span className={s.meta}>{meta}</span>
          </div>
        );
      })}
      <div className={s.actions}>
        <button type="button" className={s.btn} onClick={runAll}>Run all</button>
      </div>
      {responses.map((r, i) => r ? (
        <details key={i} style={{ marginTop: 'var(--space-3)' }}>
          <summary>Step {i + 1} response</summary>
          <JsonInspector data={r.response.body} />
        </details>
      ) : null)}
    </div>
  );
}
```

- [ ] **Step 5: Run — pass**

Run: `cd atomic-decay && npm test -- --run client/components/RecipeRunner.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add atomic-decay/client/components/RecipeRunner.tsx atomic-decay/client/components/RecipeRunner.module.css \
        atomic-decay/client/components/RecipeRunner.test.tsx
git commit -m "feat(decay): add RecipeRunner with sequential step execution"
```

---

## Task 20: ClaimsInspector

**Files:**
- Create: `atomic-decay/client/inspectors/ClaimsInspector.tsx`
- Create: `atomic-decay/client/inspectors/ClaimsInspector.module.css`

- [ ] **Step 1: Write `ClaimsInspector.module.css`**

```css
.table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
.table th, .table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
.table th { color: var(--accent); font-weight: 600; }
.key { color: #fff; font-family: var(--font-mono); font-size: var(--fs-xs); }
.value { color: #ccc; font-family: var(--font-mono); font-size: var(--fs-xs); white-space: pre-wrap; word-break: break-all; max-width: 400px; }
.explain { color: var(--text-dim); font-size: var(--fs-sm); }
```

- [ ] **Step 2: Write `ClaimsInspector.tsx`**

```tsx
import s from './ClaimsInspector.module.css';
import { useLaunch } from '../context/LaunchContext';
import { explainClaim } from '../lib/claimExplanations';
import { formatValue } from '../lib/format';
import { Card } from '../components/Card';

export function ClaimsInspector() {
  const launch = useLaunch();
  const claims = launch.idTokenClaims;
  if (!claims || Object.keys(claims).length === 0) {
    return <Card><p style={{ color: 'var(--text-dim)' }}>No id_token claims were forwarded to the browser.</p></Card>;
  }
  return (
    <Card title="LTI Claims (annotated)">
      <table className={s.table}>
        <thead><tr><th>Claim</th><th>Value</th><th>Meaning</th></tr></thead>
        <tbody>
          {Object.entries(claims).map(([k, v]) => (
            <tr key={k}>
              <td className={s.key}>{k}</td>
              <td className={s.value}>{formatValue(v)}</td>
              <td className={s.explain}>{explainClaim(k)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add atomic-decay/client/inspectors/ClaimsInspector.tsx atomic-decay/client/inspectors/ClaimsInspector.module.css
git commit -m "feat(decay): port ClaimsInspector to React"
```

---

## Task 21: HttpInspector

**Files:**
- Create: `atomic-decay/client/inspectors/HttpInspector.tsx`
- Create: `atomic-decay/client/inspectors/HttpInspector.module.css`

- [ ] **Step 1: Write `HttpInspector.module.css`**

```css
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); }
.grid dt { color: var(--text-dim); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em; }
.grid dd { margin: 4px 0 0; color: #fff; word-break: break-word; }
.timing { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-family: var(--font-mono); font-size: var(--fs-sm); }
.timing .label { color: #ccc; }
.timing .ms { color: var(--accent); }
.kvtable { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
.kvtable td { padding: 6px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
.k { color: #fff; font-family: var(--font-mono); font-size: var(--fs-xs); }
.v { color: #ccc; font-family: var(--font-mono); font-size: var(--fs-xs); white-space: pre-wrap; word-break: break-all; max-width: 600px; }
.section { margin-bottom: var(--space-4); }
.section h4 { margin: 0 0 var(--space-2); color: var(--accent); font-size: var(--fs-md); }
```

- [ ] **Step 2: Write `HttpInspector.tsx`**

```tsx
import s from './HttpInspector.module.css';
import { useLaunch } from '../context/LaunchContext';
import { Card } from '../components/Card';

export function HttpInspector() {
  const ctx = useLaunch().httpContext;
  if (!ctx) {
    return <Card><p style={{ color: 'var(--text-dim)' }}>No HTTP context was forwarded.</p></Card>;
  }
  const cookieEntries = Object.entries(ctx.cookies || {});
  const headerEntries = Object.entries(ctx.headers || {});
  const timingEntries = Object.entries(ctx.timingsMs || {});

  return (
    <Card title="HTTP Context">
      <div className={s.section}>
        <h4>Request</h4>
        <dl className={s.grid}>
          <div><dt>Host</dt><dd>{ctx.host}</dd></div>
          <div><dt>Scheme</dt><dd>{ctx.scheme}</dd></div>
          <div><dt>Method</dt><dd>{ctx.method}</dd></div>
          <div><dt>Path</dt><dd>{ctx.path}</dd></div>
          <div><dt>User-Agent</dt><dd>{ctx.userAgent ?? '(none)'}</dd></div>
          <div><dt>Client IP</dt><dd>{ctx.clientIp ?? '(none)'}</dd></div>
        </dl>
      </div>
      <div className={s.section}>
        <h4>Server timings</h4>
        {timingEntries.length === 0
          ? <p style={{ color: 'var(--text-dim)' }}>(no timings recorded)</p>
          : timingEntries.map(([k, v]) => (
              <div key={k} className={s.timing}>
                <span className={s.label}>{k}</span>
                <span className={s.ms}>{Number(v)} ms</span>
              </div>
            ))}
      </div>
      <div className={s.section}>
        <h4>Request headers</h4>
        <table className={s.kvtable}>
          <tbody>
            {headerEntries.map(([k, v]) => (
              <tr key={k}><td className={s.k}>{k}</td><td className={s.v}>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={s.section}>
        <h4>Cookies</h4>
        <table className={s.kvtable}>
          <tbody>
            {cookieEntries.length === 0
              ? <tr><td colSpan={2} style={{ color: 'var(--text-dim)' }}>(no cookies)</td></tr>
              : cookieEntries.map(([k, v]) => (
                  <tr key={k}><td className={s.k}>{k}</td><td className={s.v}>{v}</td></tr>
                ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add atomic-decay/client/inspectors/HttpInspector.tsx atomic-decay/client/inspectors/HttpInspector.module.css
git commit -m "feat(decay): port HttpInspector to React"
```

---

## Task 22: RawInspector

**Files:**
- Create: `atomic-decay/client/inspectors/RawInspector.tsx`

- [ ] **Step 1: Write `RawInspector.tsx`**

```tsx
import { useLaunch } from '../context/LaunchContext';
import { Card } from '../components/Card';
import { JsonInspector } from '../components/JsonInspector';
import { decodeJwtPayload } from '../lib/format';

export function RawInspector() {
  const launch = useLaunch();
  const decodedToolJwt = decodeJwtPayload(launch.jwt ?? '');
  return (
    <>
      <Card title="Tool JWT (raw)">
        <pre style={{ background: 'var(--bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--accent)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
          {launch.jwt ?? '(no JWT)'}
        </pre>
      </Card>
      <Card title="Tool JWT payload (decoded)"><JsonInspector data={decodedToolJwt} /></Card>
      <Card title="Platform id_token claims (decoded)"><JsonInspector data={launch.idTokenClaims ?? null} /></Card>
      <Card title="Full LAUNCH_SETTINGS"><JsonInspector data={launch} /></Card>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add atomic-decay/client/inspectors/RawInspector.tsx
git commit -m "feat(decay): port RawInspector to React"
```

---

## Task 23: Tester placeholders

**Files:**
- Create: `atomic-decay/client/testers/NrpsTester.tsx`
- Create: `atomic-decay/client/testers/AgsTester.tsx`
- Create: `atomic-decay/client/testers/DeepLinkTester.tsx`

- [ ] **Step 1: Write `NrpsTester.tsx`** (placeholder; filled by Plan 2)

```tsx
import { Card } from '../components/Card';

export function NrpsTester() {
  return (
    <Card title="Names & Roles (NRPS)">
      <p style={{ color: 'var(--text-dim)' }}>
        Tester arrives in Plan 2. Placeholder lives at <code>#nrps</code>.
      </p>
    </Card>
  );
}
```

- [ ] **Step 2: Write `AgsTester.tsx`**

```tsx
import { Card } from '../components/Card';

export function AgsTester() {
  return (
    <Card title="Assignment & Grade Services (AGS)">
      <p style={{ color: 'var(--text-dim)' }}>
        Tester arrives in Plan 3. Placeholder lives at <code>#ags</code>.
      </p>
    </Card>
  );
}
```

- [ ] **Step 3: Write `DeepLinkTester.tsx`**

```tsx
import { Card } from '../components/Card';

export function DeepLinkTester() {
  return (
    <Card title="Deep Linking">
      <p style={{ color: 'var(--text-dim)' }}>
        Tester arrives in Plan 4. Placeholder lives at <code>#deeplink</code>.
      </p>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add atomic-decay/client/testers/
git commit -m "feat(decay): add placeholder testers for NRPS, AGS, Deep Linking"
```

---

## Task 24: App.tsx

**Files:**
- Create: `atomic-decay/client/App.tsx`
- Create: `atomic-decay/client/App.module.css`

- [ ] **Step 1: Write `App.module.css`**

```css
.shell { display: flex; flex-direction: column; min-height: 100vh; }
.body { padding: var(--space-4); max-width: 1200px; margin: 0 auto; width: 100%; }
.error { background: var(--danger-bg); border: 1px solid var(--danger); color: #ffb3b3; padding: var(--space-4); border-radius: var(--radius-sm); margin: var(--space-4); }
```

- [ ] **Step 2: Write `App.tsx`**

```tsx
import s from './App.module.css';
import { Header } from './components/Header';
import { TabBar, type TabDef } from './components/TabBar';
import { useHashRoute } from './hooks/useHashRoute';
import { ClaimsInspector } from './inspectors/ClaimsInspector';
import { HttpInspector } from './inspectors/HttpInspector';
import { RawInspector } from './inspectors/RawInspector';
import { NrpsTester } from './testers/NrpsTester';
import { AgsTester } from './testers/AgsTester';
import { DeepLinkTester } from './testers/DeepLinkTester';
import { useLaunch } from './context/LaunchContext';

export function App() {
  const launch = useLaunch();
  const claims = (launch.idTokenClaims ?? {}) as Record<string, unknown>;

  const hasNrps = Boolean(claims['https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice']);
  const hasAgs = Boolean(claims['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint']);
  const isDeepLink = Boolean(launch.deepLinking);

  const tabs: TabDef[] = [
    { id: 'claims', label: 'Claims', enabled: true },
    { id: 'http', label: 'HTTP', enabled: true },
    { id: 'raw', label: 'Raw', enabled: true },
    { id: 'nrps', label: 'NRPS', enabled: hasNrps, disabledReason: 'No NRPS claim in this launch' },
    { id: 'ags', label: 'AGS', enabled: hasAgs, disabledReason: 'No AGS claim in this launch' },
    { id: 'deeplink', label: 'Deep Link', enabled: isDeepLink, disabledReason: 'Not a Deep Linking launch' },
  ];

  const [route, navigate] = useHashRoute('claims');

  let body;
  switch (route) {
    case 'http': body = <HttpInspector />; break;
    case 'raw': body = <RawInspector />; break;
    case 'nrps': body = hasNrps ? <NrpsTester /> : <DisabledExplanation reason="No NRPS claim in this launch." />; break;
    case 'ags': body = hasAgs ? <AgsTester /> : <DisabledExplanation reason="No AGS claim in this launch." />; break;
    case 'deeplink': body = isDeepLink ? <DeepLinkTester /> : <DisabledExplanation reason="Not a Deep Linking launch." />; break;
    case 'claims':
    default: body = <ClaimsInspector />;
  }

  return (
    <div className={s.shell}>
      <Header />
      <TabBar tabs={tabs} current={route} onSelect={navigate} />
      <main className={s.body}>{body}</main>
    </div>
  );
}

function DisabledExplanation({ reason }: { reason: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', color: 'var(--text-dim)' }}>
      {reason}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add atomic-decay/client/App.tsx atomic-decay/client/App.module.css
git commit -m "feat(decay): wire App.tsx with TabBar, hash routing, tester selection"
```

---

## Task 25: main.tsx entry

**Files:**
- Modify: `atomic-decay/client/main.tsx`
- Delete: `atomic-decay/client/app.ts`

- [ ] **Step 1: Replace `client/main.tsx`**

```tsx
import { createRoot } from 'react-dom/client';
import { ltiLaunch } from '@atomicjolt/lti-client';
import { App } from './App';
import { LaunchProvider } from './context/LaunchContext';
import './theme.module.css';

const root = createRoot(document.getElementById('main-content') ?? document.body);

const launchSettings = window.LAUNCH_SETTINGS;

ltiLaunch(launchSettings)
  .then((valid) => {
    if (!valid) {
      root.render(<ErrorView message="ltiLaunch() returned false. State verification failed or platform storage was unavailable." />);
      return;
    }
    root.render(
      <LaunchProvider value={launchSettings}>
        <App />
      </LaunchProvider>,
    );
  })
  .catch((err) => {
    root.render(<ErrorView message={err instanceof Error ? err.message : String(err)} />);
  });

function ErrorView({ message }: { message: string }) {
  return (
    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#ffb3b3', padding: 16, margin: 16, borderRadius: 4 }}>
      <strong>Launch failed.</strong> {message}
    </div>
  );
}
```

- [ ] **Step 2: Delete the legacy `app.ts`**

Run: `rm atomic-decay/client/app.ts`

- [ ] **Step 3: Build and confirm `assets.json` exposes `main.tsx`**

Run:
```bash
cd atomic-decay
npm run build
cat src/assets/js/assets.json
```
Expected: JSON contains `"main.tsx": "/assets/js/main-...js"` and `"app-init.ts": "/assets/js/app-init-...js"`.

- [ ] **Step 4: Commit**

```bash
git add atomic-decay/client/main.tsx atomic-decay/src/assets/js/assets.json
git rm atomic-decay/client/app.ts
git commit -m "feat(decay): replace app.ts with React main.tsx entry"
```

---

## Task 26: Update Rust launch handler to load `main.js`

**Files:**
- Modify: `atomic-decay/src/handlers/lti.rs:51-56` and `:405-407`

- [ ] **Step 1: Find current asset key references**

Run: `cd atomic-decay && grep -n '"app.js"\|"app.ts"\|"main' src/handlers/lti.rs`
Expected output: shows two sites — `assets_with_js_keys.insert("app.js"...)` (line ~51) and `.get("app.js")` (line ~405).

- [ ] **Step 2: In `LtiDeps::new`, replace the `app.ts → app.js` shim with `main.tsx → main.js`**

Edit `atomic-decay/src/handlers/lti.rs`. Replace:
```rust
    if let Some(value) = app_state.assets.get("app.ts") {
      assets_with_js_keys.insert("app.js".to_string(), value.clone());
    }
```
with:
```rust
    if let Some(value) = app_state.assets.get("main.tsx") {
      assets_with_js_keys.insert("main.js".to_string(), value.clone());
    }
```

- [ ] **Step 3: In the launch handler, replace the `"app.js"` lookup with `"main.js"`**

In `atomic-decay/src/handlers/lti.rs::launch`, replace:
```rust
  let hashed_script_name = deps.get_assets()
    .get("app.js")
    .ok_or_else(|| ToolError::Configuration("Missing app.js asset".to_string()))?;
```
with:
```rust
  let hashed_script_name = deps.get_assets()
    .get("main.js")
    .ok_or_else(|| ToolError::Configuration("Missing main.js asset".to_string()))?;
```

- [ ] **Step 4: Build Rust to confirm it still compiles**

Run: `cd atomic-decay && cargo check`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add atomic-decay/src/handlers/lti.rs
git commit -m "feat(decay): point launch handler at React main.js bundle"
```

---

## Task 27: Run all tests and the build end-to-end

- [ ] **Step 1: Run JS tests**

Run: `cd atomic-decay && npm test -- --run`
Expected: all tests pass (format, curl, useHashRoute, ModeToggle, TabBar, RequestPanel, ResponseViewer, RecipeRunner, JsonInspector).

- [ ] **Step 2: Run Rust tests**

Run: `cd atomic-decay && make test`
Expected: existing tests still pass; no regressions.

- [ ] **Step 3: Build production JS bundle**

Run: `cd atomic-decay && npm run build`
Expected: `src/assets/js/assets.json` lists `main.tsx` and `app-init.ts`.

- [ ] **Step 4: Manual smoke**

Start the dev backend (`make dev-backend`) and frontend (`npm run dev:build`); launch from `atomic-lti-test` against `localhost`. Confirm:
- Header renders with launch summary.
- All six tabs present; disabled ones show tooltip on hover.
- `#claims`, `#http`, `#raw` show the same content as the old single-page diagnostic.
- `#nrps`, `#ags`, `#deeplink` each show their placeholder card.
- Reloading the page preserves the active tab via the hash.

- [ ] **Step 5: Commit any final fixes**

```bash
git status   # only commit if there are remaining changes
```

---

## Self-review checklist

1. **Spec coverage:** Foundation goal #1 (SPA + tab bar) ✓; #4 (preserve inspectors) ✓; #5 (React + CSS Modules + theme) ✓; primitives table from spec ✓; tester placeholders for NRPS/AGS/DL ✓.
2. **Placeholder scan:** No "TBD" / "TODO" / "fill in details" — every step has full code or exact commands.
3. **Type consistency:** `Recipe`, `RecipeStep`, `ServiceEndpoint`, `ServiceResponse`, `Mode` defined once in `client/types/tester.ts`; all components import from there.
