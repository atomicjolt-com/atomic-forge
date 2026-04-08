#!/usr/bin/env python3
"""
cmux Tab Manager

Creates tabs in a single cmux workspace from .vscode/terminals.json.
Reads the "cmux" section for tab definitions with optional browser splits,
sidebar progress, health checks, and notifications.

Falls back to the flat "terminals" array if no "cmux" section exists.
"""
import json
import os
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, Optional

DEFAULT_CONFIG_PATH = os.path.join(".vscode", "terminals.json")


def load_config(project_dir: str, config_path: str = DEFAULT_CONFIG_PATH) -> Dict[str, Any]:
    full_path = os.path.join(project_dir, config_path)
    if not os.path.isfile(full_path):
        raise FileNotFoundError(f"Config file not found: {full_path}")
    with open(full_path, "r") as f:
        return json.load(f)


def load_env(project_dir: str) -> Dict[str, str]:
    env_vars = {}
    env_path = os.path.join(project_dir, ".env")
    if not os.path.isfile(env_path):
        return env_vars
    try:
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    if (value.startswith('"') and value.endswith('"')) or \
                       (value.startswith("'") and value.endswith("'")):
                        value = value[1:-1]
                    env_vars[key.strip()] = value
    except Exception as e:
        print(f"Warning: Could not load .env file: {e}")
    return env_vars


def run_cmux(*args: str) -> tuple[bool, str]:
    """Run a cmux command with --json --id-format uuids and return (success, stdout)."""
    result = subprocess.run(
        ["cmux", "--json", "--id-format", "uuids", *args],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False, result.stderr.strip()
    return True, result.stdout.strip()


def run_cmux_raw(*args: str) -> tuple[bool, str]:
    """Run a cmux command without --json flag."""
    result = subprocess.run(
        ["cmux", *args],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False, result.stderr.strip()
    return True, result.stdout.strip()


def list_workspaces() -> list[Dict[str, Any]]:
    ok, output = run_cmux("list-workspaces")
    if not ok:
        return []
    try:
        return json.loads(output).get("workspaces", [])
    except json.JSONDecodeError:
        return []


def find_workspace_by_name(name: str) -> Optional[str]:
    for ws in list_workspaces():
        if ws.get("title") == name:
            return ws["id"]
    return None


def get_surfaces(workspace_ref: str) -> list[Dict[str, Any]]:
    ok, output = run_cmux("list-pane-surfaces", "--workspace", workspace_ref)
    if not ok:
        return []
    try:
        return json.loads(output).get("surfaces", [])
    except json.JSONDecodeError:
        return []


def identify() -> Dict[str, Any]:
    ok, output = run_cmux("identify")
    if not ok:
        return {}
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return {}


def get_branch() -> str:
    """Get the current git branch name."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return "main"


def substitute(text: str, project_dir: str, env: Dict[str, str]) -> str:
    """Replace [workspaceFolder], [workspaceFolderBasename], [BRANCH], and [ENV_VAR] placeholders."""
    text = text.replace("[workspaceFolder]", project_dir)
    text = text.replace("[workspaceFolderBasename]", os.path.basename(project_dir))
    text = text.replace("[BRANCH]", get_branch())
    for key, value in env.items():
        text = text.replace(f"[{key}]", value)
    return text


def build_command(commands: list[str], project_dir: str, env: Dict[str, str]) -> str:
    replaced = [substitute(cmd, project_dir, env) for cmd in (commands or [])]
    if not replaced:
        return f"cd '{project_dir}'"
    return " && ".join(replaced)


def set_progress(fraction: float, label: str):
    run_cmux_raw("set-progress", str(fraction), "--label", label)


def log_message(message: str, level: str = "info"):
    run_cmux_raw("log", "--level", level, "--", message)


def send_command(surface_ref: str, workspace_ref: str, cmd: str):
    """Send a command to a surface and press Enter to execute."""
    if cmd:
        run_cmux_raw("send", "--workspace", workspace_ref, "--surface", surface_ref, "--", cmd)
        run_cmux_raw("send-key", "--workspace", workspace_ref, "--surface", surface_ref, "enter")


def create_workspace(name: str) -> Optional[str]:
    """Create a new workspace and return its UUID."""
    # Snapshot workspace list before creation so we can diff
    before_ids = {ws["id"] for ws in list_workspaces()}
    ok, output = run_cmux("new-workspace")
    if not ok:
        return None
    # Response is "OK <UUID>" — parse UUID from it
    uuid_match = re.search(r"[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}", output, re.IGNORECASE)
    if uuid_match:
        ws_id = uuid_match.group(0)
        run_cmux("rename-workspace", "--workspace", ws_id, name)
        return ws_id
    # Fallback: find the newly created workspace by diffing the list
    after = list_workspaces()
    for ws in after:
        if ws["id"] not in before_ids:
            ws_id = ws["id"]
            run_cmux("rename-workspace", "--workspace", ws_id, name)
            return ws_id
    return None


def get_panes(workspace_ref: str) -> list[Dict[str, Any]]:
    """List panes in a workspace."""
    ok, output = run_cmux("list-panes", "--workspace", workspace_ref)
    if not ok:
        return []
    try:
        return json.loads(output).get("panes", [])
    except json.JSONDecodeError:
        return []


def create_pane(workspace_ref: str, direction: str = "right",
                focus_pane_ref: Optional[str] = None) -> Optional[str]:
    """Create a new pane in a workspace via split. Returns pane ref."""
    if focus_pane_ref:
        run_cmux_raw("focus-pane", "--pane", focus_pane_ref, "--workspace", workspace_ref)
    before_ids = {p["id"] for p in get_panes(workspace_ref)}
    ok, output = run_cmux("new-pane", "--direction", direction, "--workspace", workspace_ref)
    if not ok:
        return None
    # Try to parse pane_id from response
    try:
        data = json.loads(output)
        pane_id = data.get("pane_id") or data.get("pane_ref")
        if pane_id:
            return pane_id
    except (json.JSONDecodeError, AttributeError):
        pass
    # Fallback: diff the pane list
    after = get_panes(workspace_ref)
    for p in after:
        if p["id"] not in before_ids:
            return p["id"]
    return None


def create_tab(workspace_ref: str, name: str, index: Optional[int] = None,
               pane_ref: Optional[str] = None) -> Optional[str]:
    """Create a new terminal surface tab in a workspace. Returns surface ref."""
    args = ["new-surface", "--workspace", workspace_ref]
    if pane_ref:
        args.extend(["--pane", pane_ref])
    ok, output = run_cmux(*args)
    if not ok:
        return None
    # Parse surface_ref from JSON response
    surface_ref = None
    try:
        data = json.loads(output)
        surface_ref = data.get("surface_id") or data.get("surface_ref")
    except json.JSONDecodeError:
        pass
    if not surface_ref:
        return None
    run_cmux_raw("rename-tab", "--workspace", workspace_ref, "--surface", surface_ref, name)
    if index is not None:
        run_cmux_raw("reorder-surface", "--surface", surface_ref, "--index", str(index))
    return surface_ref


def add_browser_split(workspace_ref: str, surface_ref: str, direction: str, url: str) -> Optional[str]:
    """Split a surface and add a browser pane next to it. Returns browser surface id."""
    # Focus the source tab first so the split anchors to its pane. Without this,
    # parallel tab creation means whichever tab was focused last gets split.
    run_cmux_raw("tab-action", "--action", "select", "--surface", surface_ref, "--workspace", workspace_ref)
    # Snapshot surfaces before split so we can diff
    before_ids = {s["id"] for s in get_surfaces(workspace_ref)}
    pane_args = ["new-pane", "--type", "browser", "--direction", direction, "--workspace", workspace_ref]
    if url:
        pane_args.extend(["--url", url])
    ok, output = run_cmux(*pane_args)
    if not ok:
        return None
    try:
        data = json.loads(output)
        surface_id = data.get("surface_id")
        if surface_id:
            return surface_id
    except json.JSONDecodeError:
        pass
    # Fallback: find the newly created surface by diffing the list
    after = get_surfaces(workspace_ref)
    for s in after:
        if s["id"] not in before_ids:
            return s["id"]
    return None


def close_surface(workspace_ref: str, surface_ref: str):
    """Close a surface in a workspace."""
    run_cmux_raw("close-surface", "--workspace", workspace_ref, "--surface", surface_ref)


def reconcile_existing_tabs(workspace_ref: str, tab_names: list[str]) -> Dict[str, str]:
    """Match existing surfaces to tab names. Close orphans. Return {name: surface_id} map."""
    existing = get_surfaces(workspace_ref)
    matched: Dict[str, str] = {}
    unmatched: list[str] = []

    for surface in existing:
        title = surface.get("title", "")
        sid = surface.get("id", "")
        if title in tab_names and title not in matched:
            matched[title] = sid
        else:
            unmatched.append(sid)

    for sid in unmatched:
        close_surface(workspace_ref, sid)
        log_message(f"  - Closed orphan tab", "info")

    return matched


def run_health_check(target: Dict):
    """Run a single health check after its configured wait time."""
    time.sleep(target["wait"])
    ok, screen = run_cmux_raw("read-screen", "--surface", target["surface"], "--scrollback", "--lines", "50")
    expect = target["expect"]
    name = target["name"]
    if ok and expect and expect.lower() in screen.lower():
        log_message(f"  {name}: '{expect}' found", "success")
    elif ok and expect:
        log_message(f"  {name}: '{expect}' not found yet", "warning")
    elif ok:
        log_message(f"  {name}: running", "info")
    else:
        log_message(f"  {name}: could not read screen", "warning")


def run_health_checks(targets: list[Dict]):
    """Run health checks concurrently, each waiting its own delay."""
    if not targets:
        return
    log_message("Running health checks...")
    with ThreadPoolExecutor(max_workers=len(targets)) as pool:
        futures = [pool.submit(run_health_check, t) for t in targets]
        for f in as_completed(futures):
            f.result()


def focus_tab(workspace_ref: str, surface_ref: str, select_workspace: bool = True):
    """Focus a specific surface/tab, optionally selecting the workspace."""
    if select_workspace:
        run_cmux_raw("select-workspace", "--workspace", workspace_ref)
    run_cmux_raw("tab-action", "--action", "select", "--surface", surface_ref, "--workspace", workspace_ref)


def create_browser_tab(workspace_ref: str, name: str, url: str, index: Optional[int] = None,
                       lock: Optional[threading.Lock] = None,
                       pane_ref: Optional[str] = None) -> Optional[str]:
    """Create a browser surface tab in a workspace. Returns surface ref."""
    args = ["new-surface", "--type", "browser", "--workspace", workspace_ref]
    if pane_ref:
        args.extend(["--pane", pane_ref])
    if url:
        args.extend(["--url", url])

    def _create():
        ok, output = run_cmux(*args)
        if not ok:
            return None
        try:
            data = json.loads(output)
            return data.get("surface_id") or data.get("surface_ref")
        except json.JSONDecodeError:
            return None

    if lock:
        with lock:
            surface_ref = _create()
    else:
        surface_ref = _create()

    if not surface_ref:
        return None
    run_cmux_raw("rename-tab", "--workspace", workspace_ref, "--surface", surface_ref, name)
    if index is not None:
        run_cmux_raw("reorder-surface", "--surface", surface_ref, "--index", str(index))
    return surface_ref


def add_browser_tabs(surface_ref: str, workspace_ref: str, urls: list[Dict[str, str]],
                     project_dir: str, env: Dict[str, str]):
    """Add additional browser tabs to an existing browser surface."""
    for url_config in urls:
        url = substitute(url_config.get("url", ""), project_dir, env)
        if url:
            run_cmux_raw("browser", "--surface", surface_ref, "tab", "new", url)
            time.sleep(0.3)


def setup_tab(
    i: int,
    tab_config: Dict[str, Any],
    workspace_ref: str,
    project_dir: str,
    env: Dict[str, str],
    reused_surfaces: Dict[str, str],
    first_surface: Optional[str],
    is_new_workspace: bool,
    lock: threading.Lock,
    fresh: bool = False,
    pane_ref: Optional[str] = None,
) -> tuple[Optional[str], Optional[Dict], bool]:
    """Set up a single tab: create/reuse surface, send commands, add splits.
    Returns (surface_ref, health_target_or_None, is_focus_tab)."""
    name = tab_config.get("name", f"Tab {i+1}")
    tab_type = tab_config.get("type", "terminal")
    commands = tab_config.get("commands", [])
    health_check = tab_config.get("healthCheck")
    split = tab_config.get("split")
    is_focus = tab_config.get("focus", False)

    # Handle browser-type tabs: create a browser pane with multiple URL tabs
    if tab_type == "browser":
        urls = tab_config.get("urls", [])
        if not urls:
            log_message(f"x Browser tab '{name}' has no urls", "warning")
            return None, None, False

        surface_ref = reused_surfaces.get(name)
        if surface_ref:
            run_cmux_raw("reorder-surface", "--surface", surface_ref, "--index", str(i))
        else:
            first_url = substitute(urls[0].get("url", ""), project_dir, env)
            surface_ref = create_browser_tab(workspace_ref, name, first_url, index=i, lock=lock, pane_ref=pane_ref)
            if not surface_ref:
                log_message(f"x Failed to create browser tab: {name}", "error")
                return None, None, False
            # Add remaining URLs as browser tabs
            if len(urls) > 1:
                time.sleep(0.5)
                add_browser_tabs(surface_ref, workspace_ref, urls[1:], project_dir, env)
                log_message(f"  + {name} with {len(urls)} browser tabs")

        return surface_ref, None, is_focus

    surface_ref = reused_surfaces.get(name)

    if surface_ref:
        # Reuse existing — reorder and optionally re-send commands
        run_cmux_raw("reorder-surface", "--surface", surface_ref, "--index", str(i))
    elif i == 0 and first_surface and is_new_workspace:
        # First tab in pane 0 reuses the workspace's default surface so we
        # don't leave an orphan unnamed tab behind. (pane_ref is always set
        # for pane 0 now, so we no longer gate on `not pane_ref`.)
        surface_ref = first_surface
        run_cmux_raw("rename-tab", "--workspace", workspace_ref, "--surface", surface_ref, name)
    else:
        with lock:
            surface_ref = create_tab(workspace_ref, name, index=i, pane_ref=pane_ref)
        if not surface_ref:
            log_message(f"x Failed to create tab: {name}", "error")
            return None, None, False

    if commands:
        cmd = build_command(commands, project_dir, env)
        send_command(surface_ref, workspace_ref, cmd)

    # Send delayed input to the running process (e.g., typing into an interactive CLI)
    delayed_input = tab_config.get("input")
    if delayed_input and surface_ref:
        delay = delayed_input.get("delay", 3)
        lines = delayed_input.get("lines", [])
        typed = delayed_input.get("typed")
        if lines or typed:
            time.sleep(delay)
            for line in lines:
                # Support dict entries: {"text": "...", "delay": N, "submit": bool}
                if isinstance(line, dict):
                    line_text = substitute(line.get("text", ""), project_dir, env)
                    line_delay = line.get("delay", 0.5)
                    submit = line.get("submit", True)
                else:
                    line_text = substitute(line, project_dir, env)
                    line_delay = 0.5
                    submit = True
                run_cmux_raw("send", "--workspace", workspace_ref, "--surface", surface_ref, "--", line_text)
                if submit:
                    run_cmux_raw("send-key", "--workspace", workspace_ref, "--surface", surface_ref, "enter")
                time.sleep(line_delay)
            # "typed" is sent without pressing Enter — it appears in the prompt but doesn't execute
            if typed:
                typed = substitute(typed, project_dir, env)
                time.sleep(0.5)
                run_cmux_raw("send", "--workspace", workspace_ref, "--surface", surface_ref, "--", typed)

    if split:
        split_type = split.get("type", "terminal")
        direction = split.get("direction", "right")
        split_name = split.get("name", "Browser")
        # Support either a single `url` or a list of `urls` like browser tabs
        split_urls = split.get("urls") or []
        single_url = substitute(split.get("url", ""), project_dir, env)
        first_url = single_url
        if not first_url and split_urls:
            first_url = substitute(split_urls[0].get("url", ""), project_dir, env)
        # Idempotency: skip if the split surface already exists from a prior run
        existing_split = reused_surfaces.get(split_name)
        if existing_split:
            log_message(f"  = {name} + {split_name} (reused)")
        elif split_type == "browser" and first_url:
            with lock:
                browser_ref = add_browser_split(workspace_ref, surface_ref, direction, first_url)
            if browser_ref:
                run_cmux_raw("rename-tab", "--workspace", workspace_ref, "--surface", browser_ref, split_name)
                # Add remaining URLs as additional browser tabs within the split
                if len(split_urls) > 1:
                    time.sleep(0.5)
                    add_browser_tabs(browser_ref, workspace_ref, split_urls[1:], project_dir, env)
                    log_message(f"  + {name} + browser split with {len(split_urls)} tabs")
                else:
                    log_message(f"  + {name} + browser split")
            else:
                log_message(f"  ~ {name} (browser split failed)", "warning")

    health_target = None
    if health_check and surface_ref:
        health_target = {
            "surface": surface_ref,
            "name": name,
            "wait": health_check.get("wait", 5),
            "expect": health_check.get("expect", ""),
        }

    return surface_ref, health_target, is_focus


def setup_workspace(ws_config: Dict[str, Any], project_dir: str, env: Dict[str, str],
                    notify: bool = False, fresh: bool = False):
    """Process a single workspace configuration: create workspace and its tabs.

    Supports two config formats:
    - Flat: {"workspace": "Name", "tabs": [...]}
    - Multi-pane: {"workspace": "Name", "panes": [{"tabs": [...], "direction": "right"}, ...]}
    """
    # Normalize to panes format for unified handling
    panes_config = ws_config.get("panes")
    if panes_config:
        pane_groups = panes_config
    else:
        pane_groups = [{"tabs": ws_config.get("tabs", [])}]

    all_tabs = []
    for pg in pane_groups:
        all_tabs.extend(pg.get("tabs", []))

    workspace_name = ws_config.get("workspace", os.path.basename(project_dir))
    total = len(all_tabs)

    print(f"Setting up {total} tabs in workspace '{workspace_name}'...")
    set_progress(0.0, f"Setting up '{workspace_name}'...")
    log_message(f"Starting tab setup for '{workspace_name}'...")

    # Create or reuse the workspace
    workspace_ref = find_workspace_by_name(workspace_name)
    reused_workspace = workspace_ref is not None
    if not workspace_ref:
        workspace_ref = create_workspace(workspace_name)
    if not workspace_ref:
        print("Failed to create workspace")
        return

    # Idempotency: reconcile existing tabs when reusing a workspace.
    # Include split sub-tab names (e.g. the "browser" pane under "console") so
    # they aren't treated as orphans and closed on every rerun.
    tab_names = [t.get("name", f"Tab {i+1}") for i, t in enumerate(all_tabs)]
    for t in all_tabs:
        split = t.get("split")
        if split:
            split_name = split.get("name", "Browser")
            if split_name not in tab_names:
                tab_names.append(split_name)
    reused_surfaces: Dict[str, str] = {}
    if reused_workspace and fresh:
        # Fresh mode: close all existing surfaces so tabs are recreated cleanly
        log_message("Fresh mode: closing all existing tabs...")
        for surface in get_surfaces(workspace_ref):
            close_surface(workspace_ref, surface.get("id", ""))
    elif reused_workspace:
        log_message("Reconciling existing tabs...")
        reused_surfaces = reconcile_existing_tabs(workspace_ref, tab_names)
        if reused_surfaces:
            log_message(f"  Reusing {len(reused_surfaces)} existing tab(s)")

    # Get the first surface for new/fresh workspaces
    existing_surfaces = get_surfaces(workspace_ref)
    first_surface = existing_surfaces[0]["id"] if existing_surfaces else None
    is_new_workspace = not reused_workspace or fresh

    # Create panes (first pane uses the default, subsequent panes are splits)
    # Reuse existing panes when possible to stay idempotent across reruns.
    existing_panes = get_panes(workspace_ref)
    pane_refs: list[Optional[str]] = []
    for pane_idx, pane_config in enumerate(pane_groups):
        if pane_idx == 0:
            # First pane is the default pane in the workspace. Capture its
            # actual ID so tabs are pinned to it explicitly — otherwise
            # parallel tab creation races against the focused pane (which
            # ends up being whichever pane was created last) and pane 0 tabs
            # leak into other panes.
            default_id = existing_panes[0]["id"] if existing_panes else None
            pane_refs.append(default_id)
        elif pane_idx < len(existing_panes):
            # Reuse an existing pane
            pane_ref = existing_panes[pane_idx]["id"]
            log_message(f"  Reusing existing pane {pane_idx + 1}")
            pane_refs.append(pane_ref)
        else:
            direction = pane_config.get("direction", "right")
            # Always focus the last created pane so each split anchors correctly
            focus_ref = None
            for ref in reversed(pane_refs):
                if ref is not None:
                    focus_ref = ref
                    break
            if focus_ref is None:
                existing_p = get_panes(workspace_ref)
                if existing_p:
                    focus_ref = existing_p[-1]["id"]
            pane_ref = create_pane(workspace_ref, direction, focus_pane_ref=focus_ref)
            if pane_ref:
                log_message(f"  Created pane {pane_idx + 1} ({direction})")
            else:
                log_message(f"  ~ Failed to create pane {pane_idx + 1}, skipping its tabs", "warning")
            pane_refs.append(pane_ref)

    # Create tabs in parallel, grouped by pane
    health_targets = []
    focus_surface = None
    lock = threading.Lock()
    results: Dict[int, tuple] = {}
    global_idx = 0

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {}
        for pane_idx, pane_config in enumerate(pane_groups):
            pane_ref = pane_refs[pane_idx]
            # Skip tabs for non-default panes that failed to create
            if pane_idx > 0 and pane_ref is None:
                skipped = pane_config.get("tabs", [])
                for t in skipped:
                    log_message(f"  Skipping tab '{t.get('name', '?')}' (pane {pane_idx + 1} unavailable)", "warning")
                    global_idx += 1
                continue
            tabs = pane_config.get("tabs", [])
            for i, tab_config in enumerate(tabs):
                # Use first_surface only for the very first tab in the first pane
                fs = first_surface if (pane_idx == 0) else None
                future = pool.submit(
                    setup_tab, i, tab_config, workspace_ref, project_dir, env,
                    reused_surfaces, fs, is_new_workspace, lock,
                    fresh=fresh, pane_ref=pane_ref,
                )
                futures[future] = global_idx
                global_idx += 1

        for future in as_completed(futures):
            idx = futures[future]
            results[idx] = future.result()

    # Process results in order for consistent output
    for i in range(total):
        surface_ref, health_target, is_focus = results.get(i, (None, None, False))
        name = all_tabs[i].get("name", f"Tab {i+1}")
        status = "ok" if surface_ref else "x"
        reused = " (reused)" if name in reused_surfaces else ""
        print(f"  [{i+1}/{total}] {name}{reused}" if status == "ok" else f"  x {name}")
        set_progress((i + 1) / total * 0.9, f"Created: {name}")

        if health_target:
            health_targets.append(health_target)
        if is_focus and surface_ref:
            focus_surface = surface_ref

    # Default focus: first tab
    if not focus_surface and results.get(0):
        focus_surface = results[0][0]

    # Health checks (concurrent, each with its own delay)
    if health_targets:
        set_progress(0.92, "Running health checks...")
        run_health_checks(health_targets)

    # Focus the designated tab (without switching the active workspace)
    if focus_surface:
        focus_tab(workspace_ref, focus_surface, select_workspace=False)

    set_progress(1.0, "Done")
    log_message("All tabs ready", "success")

    if notify:
        run_cmux_raw("notify", "--title", "Dev Environment Ready",
                     "--body", f"{total} tabs created in '{workspace_name}'")

    print(f"  Done! {total} tabs in workspace '{workspace_name}'.")


def save_focus() -> Optional[Dict[str, Any]]:
    """Save the currently focused workspace/surface so we can restore it later."""
    info = identify()
    if not info:
        return None
    focused = info.get("focused", {})
    return {
        "workspace_id": focused.get("workspace_id"),
        "surface_id": focused.get("surface_id") or focused.get("surface_ref"),
    }


def restore_focus(saved: Optional[Dict[str, Any]]):
    """Restore focus to the previously saved workspace/surface."""
    if not saved:
        return
    ws = saved.get("workspace_id")
    sf = saved.get("surface_id")
    if ws:
        run_cmux_raw("select-workspace", "--workspace", ws)
    if ws and sf:
        run_cmux_raw("tab-action", "--action", "select", "--surface", sf, "--workspace", ws)


def main_cmux_config(cmux_config: Dict[str, Any], project_dir: str, env: Dict[str, str],
                     suffix: Optional[str] = None, fresh: bool = False):
    """Process cmux configuration: supports both single and multi-workspace formats."""
    notify = cmux_config.get("notify", False)
    original_focus = save_focus()

    if suffix and "workspaces" in cmux_config:
        # Worktree mode: merge all tabs from all workspaces into a single
        # workspace named after the suffix (branch name)
        all_tabs = []
        for ws_config in cmux_config["workspaces"]:
            if ws_config.get("independent"):
                continue
            all_tabs.extend(ws_config.get("tabs", []))
        merged = {"workspace": suffix, "tabs": all_tabs}
        print(f"Setting up workspace '{suffix}' with {len(all_tabs)} tabs...\n")
        setup_workspace(merged, project_dir, env, notify=False, fresh=fresh)
        if notify:
            run_cmux_raw("notify", "--title", "Dev Environment Ready",
                         "--body", f"Workspace '{suffix}' ready with {len(all_tabs)} tabs")
        ws_ref = find_workspace_by_name(suffix)
        if ws_ref:
            run_cmux_raw("select-workspace", "--workspace", ws_ref)
        else:
            restore_focus(original_focus)
    elif "workspaces" in cmux_config:
        # Multi-workspace format (normal mode)
        workspaces = cmux_config["workspaces"]
        print(f"Setting up {len(workspaces)} workspace(s)...\n")
        for ws_config in workspaces:
            setup_workspace(ws_config, project_dir, env, notify=False, fresh=fresh)
            print()
        if notify:
            names = [ws.get("workspace", "?") for ws in workspaces]
            run_cmux_raw("notify", "--title", "Dev Environment Ready",
                         "--body", f"Workspaces: {', '.join(names)}")
        # Select the first workspace
        first_name = workspaces[0].get("workspace", os.path.basename(project_dir))
        first_ref = find_workspace_by_name(first_name)
        if first_ref:
            run_cmux_raw("select-workspace", "--workspace", first_ref)
        else:
            restore_focus(original_focus)
    else:
        # Single workspace format (backward compatible)
        setup_workspace(cmux_config, project_dir, env, notify=notify, fresh=fresh)
        restore_focus(original_focus)


def main_flat_config(terminals: list[Dict[str, Any]], project_dir: str, env: Dict[str, str]):
    """Fallback: process the flat terminals array as tabs in one workspace."""
    original_focus = save_focus()
    workspace_name = os.path.basename(project_dir)
    total = len(terminals)
    print(f"Creating {total} tabs in workspace '{workspace_name}' (legacy mode)...")
    set_progress(0.0, "Setting up dev environment...")

    workspace_ref = find_workspace_by_name(workspace_name)
    reused_workspace = workspace_ref is not None
    if not workspace_ref:
        workspace_ref = create_workspace(workspace_name)
    if not workspace_ref:
        print("Failed to create workspace")
        return

    # Idempotency: reconcile existing tabs
    term_names = [t.get("name", "Terminal") for t in terminals]
    reused_surfaces: Dict[str, str] = {}
    if reused_workspace:
        reused_surfaces = reconcile_existing_tabs(workspace_ref, term_names)

    existing_surfaces = get_surfaces(workspace_ref)
    first_surface = existing_surfaces[0]["id"] if existing_surfaces else None

    focus_surface = None

    for i, term in enumerate(terminals):
        name = term.get("name", "Terminal")
        commands = term.get("commands", [])
        execute = term.get("execute", True)
        is_focus = term.get("focus", False)

        if name == "Atomic Reactor" and "PORT" in env:
            name = f"{name} - [{env['PORT']}]"
        elif name == "Atomic Reactor Console" and "PUBLIC_URL" in env:
            name = f"{name} - [{env['PUBLIC_URL']}]"

        set_progress((i + 1) / total, f"Creating: {name}")

        surface_ref = reused_surfaces.get(term.get("name", "Terminal"))
        if surface_ref:
            run_cmux_raw("reorder-surface", "--surface", surface_ref, "--index", str(i))
        elif i == 0 and first_surface and not reused_workspace:
            surface_ref = first_surface
            run_cmux_raw("rename-tab", "--workspace", workspace_ref, "--surface", surface_ref, name)
        else:
            surface_ref = create_tab(workspace_ref, name, index=i)
            if not surface_ref:
                print(f"  x {name}")
                continue

        if execute and commands:
            cmd = build_command(commands, project_dir, env)
            send_command(surface_ref, workspace_ref, cmd)

        if is_focus and surface_ref:
            focus_surface = surface_ref

        print(f"  [{i+1}/{total}] {name}")

    # Default focus: first tab
    if not focus_surface:
        surfaces = get_surfaces(workspace_ref)
        if surfaces:
            focus_surface = surfaces[0]["id"]

    if focus_surface:
        focus_tab(workspace_ref, focus_surface, select_workspace=False)

    set_progress(1.0, "Done")
    log_message("All tabs ready", "success")
    run_cmux_raw("notify", "--title", "Dev Environment Ready",
                 "--body", f"{total} tabs created")
    restore_focus(original_focus)
    print(f"\nDone! {total} tabs in workspace '{workspace_name}'.")


def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description="cmux Tab Manager")
    parser.add_argument("config", nargs="?", default=DEFAULT_CONFIG_PATH,
                        help="Path to terminals.json config file")
    parser.add_argument("--suffix", default=None,
                        help="Append suffix to workspace names (e.g., branch name for worktrees)")
    parser.add_argument("--fresh", action="store_true",
                        help="Force re-send commands to reused tabs (useful for new worktrees)")
    return parser.parse_args()


def main():
    args = parse_args()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)

    try:
        config = load_config(project_dir, args.config)
    except FileNotFoundError as e:
        print(e)
        return

    env = load_env(project_dir)

    if "cmux" in config:
        main_cmux_config(config["cmux"], project_dir, env,
                         suffix=args.suffix, fresh=args.fresh)
    elif "terminals" in config:
        main_flat_config(config["terminals"], project_dir, env)
    else:
        print("No 'cmux' or 'terminals' section found in config.")


if __name__ == "__main__":
    main()
