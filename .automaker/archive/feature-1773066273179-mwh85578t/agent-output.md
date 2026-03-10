
🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-dialog status --short && git -C /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-dialog diff main --name-only 2>&1",
  "description": "Check branch status and files changed vs main"
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-dialog diff main --name-only 2>&1 | grep -E \"hx-dialog|docs\" | head -20",
  "description": "Filter for hx-dialog and doc files changed"
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-launch-ready-hx-dialog log --oneline -5 2>&1",
  "description": "Show recent commits on branch"
}
