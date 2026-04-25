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

const launchSettings: DiagnosticLaunchSettings = window.LAUNCH_SETTINGS;

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
