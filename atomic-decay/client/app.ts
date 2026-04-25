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
