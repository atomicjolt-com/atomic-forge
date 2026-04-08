## cmux Terminal Interaction

When running inside cmux, agents can interact with other terminals to manage the development environment. Always check for cmux availability first: `command -v cmux &>/dev/null`.

**IMPORTANT:** All cmux commands must be run from the **original terminal window** where `make cmux` (or `cmux`) was launched. cmux commands will not work from terminals spawned by cmux itself (e.g., Claude sessions, app servers). If you need to run cmux commands, use the Console tab or a shell that is in the original cmux window.

### Workspaces and Surfaces

Surface names match tab names in `.vscode/terminals.json`.

All three workspaces follow the same 3-pane layout: **Left (App)** | **Center (AI)** | **Right (Browser + Tunnel)**.

#### Workspace: Atomic Forge — 3 panes

**Pane 1 — Left: App (services & tests)**

| Surface Name | Command (cwd) |
|---|---|
| `Postgres` | `make docker-up` (root) |
| `LTI Library Test` | `cargo watch -x 'nextest run --no-fail-fast'` (`atomic-lti/`) |
| `LTI Tool Test` | `cargo watch -x 'nextest run --no-fail-fast'` (`atomic-lti-tool/`) |
| `LTI Tool Axum Frontend` | `npm run dev:build` (`atomic-lti-tool-axum/`) |
| `LTI Tool Axum Rust Tests` | `make test` (`atomic-lti-tool-axum/`) |
| `LTI Tool Axum JS Tests` | `npm run test` (`atomic-lti-tool-axum/`) |

**Pane 2 — Center: AI & Tools**

| Surface Name | Purpose |
|---|---|
| `Claude 1–4` | Claude Code sessions (root) |
| `Codex` | Codex CLI |
| `Console` | shell (root, focused tab) |
| `Plans` | `cd docs/plans` |
| `Super Plans` | `cd docs/super-plans` |
| `Usage` | `npx ccusage@latest` |

**Pane 3 — Right: Browser + Tunnel**

| Surface Name | Purpose |
|---|---|
| `Browser` | Tabs: Atomic Oxide / Atomic Decay (remote + local) |
| `Tunnel` | `cloudflared tunnel --config ./.vscode/tunnels.yaml run jb-atomic-forge` |

#### Workspace: Atomic Oxide

**Pane 1 — Left: App** — `Backend` (`make dev`), `Frontend` (`npm run dev:build`), `Rust Tests` (`make test`), `JS Tests` (`npm run test`), `Postgres` (root `make docker-up`). All cwd `atomic-oxide/` except Postgres.

**Pane 2 — Center: AI** — `Claude 1–4`, `Codex`, `Console` (focus). All cwd `atomic-oxide/`.

**Pane 3 — Right: Browser + Tunnel** — `Browser` (Oxide remote + local), `Tunnel`.

#### Workspace: Atomic Decay

**Pane 1 — Left: App** — `Backend` (`make dev`), `Frontend` (`npm run dev:build`), `Rust Tests` (`make test`), `JS Tests` (`npm run test`), `Postgres` (root `make docker-up`). All cwd `atomic-decay/` except Postgres.

**Pane 2 — Center: AI** — `Claude 1–4`, `Codex`, `Console` (focus). All cwd `atomic-decay/`.

**Pane 3 — Right: Browser + Tunnel** — `Browser` (Decay remote + local), `Tunnel`.

### Finding a Surface

Tab names like `Backend`, `Frontend`, `Rust Tests`, `JS Tests`, `Postgres`, `Console`, `Browser`, `Tunnel` are reused across workspaces, so always scope lookups by workspace when possible.

```bash
# List all panels in a specific workspace
cmux list-panels --workspace "Atomic Oxide" --json 2>/dev/null | grep '"Backend"'
# Example output: surface:325  terminal  "Backend"

# Or search by content visible on screen
cmux find-window --content "listening" --select
```

### Restarting a Service

To restart a service, send Ctrl+C to stop it, then re-send the start command:

```bash
# Find the surface ID (scoped to workspace)
SURFACE=$(cmux list-panels --workspace "Atomic Oxide" --json 2>/dev/null | grep '"Backend"' | grep -o 'surface:[0-9]*')

# Restart: Ctrl+C then re-run
cmux send --surface "$SURFACE" "\x03"
sleep 1
cmux send --surface "$SURFACE" "make dev\n"

# Verify it restarted
sleep 5
cmux read-screen --surface "$SURFACE" --scrollback --lines 20
```

### Common Restart Scenarios

**Atomic Oxide Backend** — restart after code changes or port conflicts:
```bash
SURFACE=$(cmux list-panels --workspace "Atomic Oxide" --json 2>/dev/null | grep '"Backend"' | grep -o 'surface:[0-9]*')
cmux send --surface "$SURFACE" "\x03" && sleep 1
cmux send --surface "$SURFACE" "make dev\n"
```

**Atomic Decay Backend** — restart after code changes:
```bash
SURFACE=$(cmux list-panels --workspace "Atomic Decay" --json 2>/dev/null | grep '"Backend"' | grep -o 'surface:[0-9]*')
cmux send --surface "$SURFACE" "\x03" && sleep 1
cmux send --surface "$SURFACE" "make dev\n"
```

**Atomic Decay Frontend** — restart after package changes:
```bash
SURFACE=$(cmux list-panels --workspace "Atomic Decay" --json 2>/dev/null | grep '"Frontend"' | grep -o 'surface:[0-9]*')
cmux send --surface "$SURFACE" "\x03" && sleep 1
cmux send --surface "$SURFACE" "npm run dev:build\n"
```

**Cloudflare Tunnel** — restart if tunnel drops (each workspace has its own `Tunnel` tab):
```bash
SURFACE=$(cmux list-panels --workspace "Atomic Forge" --json 2>/dev/null | grep '"Tunnel"' | grep -o 'surface:[0-9]*')
cmux send --surface "$SURFACE" "\x03" && sleep 1
cmux send --surface "$SURFACE" "cloudflared tunnel --config ./.vscode/tunnels.yaml run jb-atomic-forge\n"
```

### Running Tests in Dedicated Surfaces

```bash
# Re-trigger atomic-oxide Rust tests
SURFACE=$(cmux list-panels --workspace "Atomic Oxide" --json 2>/dev/null | grep '"Rust Tests"' | grep -o 'surface:[0-9]*')
cmux send --surface "$SURFACE" "\x03" && sleep 1
cmux send --surface "$SURFACE" "make test\n"

# Re-trigger atomic-decay Rust tests
SURFACE=$(cmux list-panels --workspace "Atomic Decay" --json 2>/dev/null | grep '"Rust Tests"' | grep -o 'surface:[0-9]*')
cmux send --surface "$SURFACE" "\x03" && sleep 1
cmux send --surface "$SURFACE" "make test\n"
```

### Checking Service Health

```bash
# Read the last 20 lines of a surface to check if a service is running
SURFACE=$(cmux list-panels --workspace "Atomic Oxide" --json 2>/dev/null | grep '"Backend"' | grep -o 'surface:[0-9]*')
cmux read-screen --surface "$SURFACE" --scrollback --lines 20
# Look for "listening" to confirm it's up
```

### Best Practices for Agents

1. **Run cmux commands from the original window only** — cmux commands must be executed from the terminal window where `make cmux` was launched, not from terminals spawned by cmux
2. **Find surfaces by name** — Surface IDs are dynamic; always look them up by name before interacting
3. **Read before acting** — Use `cmux read-screen` to check current state before restarting
4. **Wait after restart** — Rust services take time to compile; read screen to confirm "listening"
5. **Use sidebar for progress** — For long operations, use `cmux set-progress` and `cmux log`
6. **Notify on completion** — Use `cmux notify` for long ops
7. **Don't create duplicate surfaces** — Check if a surface already exists before creating new ones
