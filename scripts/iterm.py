#!/usr/bin/env python3
"""
iTerm2 Tab Manager

Creates iTerm2 tabs from a JSON configuration file with custom names.

IMPORTANT: For tab names to appear, configure iTerm2:
1. Open iTerm2 → Preferences → Appearance → Tabs
2. Under "Tab title", ensure one of these is checked:
   - "Session Name"
   - Or create custom format that includes "Session Name"
3. Under "Show tab bar when", select "Always"
"""
import json
import os
import subprocess
import sys
from typing import List, Dict, Any

# Default path to the JSON config relative to the project root
DEFAULT_CONFIG_PATH = os.path.join(".vscode", "terminals.json")


def load_config(project_dir: str, config_path: str = DEFAULT_CONFIG_PATH) -> Dict[str, Any]:
    full_path = os.path.join(project_dir, config_path)
    if not os.path.isfile(full_path):
        raise FileNotFoundError(f"Config file not found: {full_path}")
    with open(full_path, "r") as f:
        return json.load(f)


def build_command(commands: list[str], project_dir: str, execute: bool) -> str:
    """
    - Replace [workspaceFolder] with the project dir
    - Join multiple commands with &&
    - If execute is False, just cd into the project
    """
    if not execute:
        return f"cd '{project_dir}'"

    replaced = [
        (cmd or "").replace("[workspaceFolder]", project_dir)
        for cmd in (commands or [])
    ]

    if not replaced:
        return f"cd '{project_dir}'"

    return " && ".join(replaced)


def make_applescript(
    name: str,
    description: str,
    full_cmd: str,
) -> str:
    """
    - Ensures there's at least one iTerm window.
    - Reuses existing tab with matching answerback string if found.
    - Creates new tab if no matching tab exists.
    - Sets the tab title using session name.
    - Uses `description` as a badge if present.
    - Returns "REUSED" or "CREATED" to indicate action taken.

    NOTE: Tab names will only appear if iTerm2 is configured to show
    session names in tab titles (Preferences → Appearance → Tabs).
    """

    name_esc = (name or "Terminal").replace('"', '\\"')
    desc_esc = (description or "").replace('"', '\\"')
    cmd_esc = full_cmd.replace('"', '\\"')

    badge_line = f'set badge to "{desc_esc}"' if desc_esc else ""

    # Try to find existing tab with matching answerback string, otherwise create new one
    # We use answerback string because session name can be overwritten by shell prompts
    script = f'''
tell application "iTerm"
  activate
  if (count of windows) = 0 then
    create window with default profile
  end if

  tell current window
    set foundTab to missing value
    set foundSession to missing value
    set actionTaken to "CREATED"

    -- Search for existing tab with matching answerback string
    repeat with aTab in tabs
      tell current session of aTab
        try
          if answerback string is "{name_esc}" then
            set foundTab to aTab
            set foundSession to current session of aTab
            set actionTaken to "REUSED"
            exit repeat
          end if
        end try
      end tell
    end repeat

    -- Use existing tab or create new one
    if foundTab is missing value then
      set targetTab to (create tab with default profile)
      set targetSession to current session of targetTab
    else
      set targetTab to foundTab
      set targetSession to foundSession
      select foundTab
    end if

    tell targetSession
      set name to "{name_esc}"
      set answerback string to "{name_esc}"
      {badge_line}
      write text "{cmd_esc}"
    end tell

    return actionTaken
  end tell
end tell
'''
    return script


def run_applescript(script: str) -> tuple[bool, str, str]:
    """
    Run AppleScript and return success status, output, and any error message.
    Returns: (success: bool, output: str, error_message: str)
    """
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False, "", result.stderr.strip()
    return True, result.stdout.strip(), ""


def main():
    # Project dir is the parent directory (project root) of where this script lives
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)

    # Allow passing a custom config path as first argument, if you ever want to
    config_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CONFIG_PATH

    try:
        config: Dict[str, Any] = load_config(project_dir, config_path)
    except FileNotFoundError as e:
        print(e)
        return

    terminals = config.get("terminals", [])
    if not terminals:
        print("No terminals defined in config.")
        return

    print("Creating iTerm2 tabs...")
    print("\nℹ️  If tab names don't appear:")
    print("   1. Open iTerm2 → Preferences → Appearance → Tabs")
    print("   2. Under 'Tab title', check 'Session Name'")
    print("   3. Restart iTerm2 if needed\n")

    # Prioritize focus == True first, but preserve relative order
    terminals_sorted = sorted(
        terminals,
        key=lambda t: 0 if t.get("focus") else 1
    )

    for term in terminals_sorted:
        name = term.get("name", "Terminal")
        description = term.get("description", "")
        commands = term.get("commands", [])
        execute = term.get("execute", True)

        full_cmd = build_command(commands, project_dir, execute)
        script = make_applescript(
            name=name,
            description=description,
            full_cmd=full_cmd,
        )
        success, output, error = run_applescript(script)
        if success:
            action = output if output in ["CREATED", "REUSED"] else "PROCESSED"
            icon = "+" if action == "CREATED" else "↻"
            print(f"{icon} {name} ({action.lower()})")
        else:
            print(f"✗ Failed to process tab '{name}':")
            print(f"  {error}")


if __name__ == "__main__":
    main()
