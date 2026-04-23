#!/usr/bin/env python3
import sys

path = '.husky/pre-push'
with open(path, 'r') as f:
    content = f.read()

old_block = '''# ── rea push-review-gate (Codex audit on protected paths) ────────────────────
# 0.9.1: push-review-gate.sh is the canonical gate. Its core (push-review-core.sh)
# has BUG-008 stdin-shape sniffing, so it handles both Claude Code JSON
# (.tool_input.command) and git's native pre-push refspec stdin. We pass "$@"
# through so the remote name (argv $1) is available to the core.
# We invoke without `exec` so the EXIT trap above still runs to clean $OUT.
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -x "$REPO_ROOT/.claude/hooks/push-review-gate.sh" ]; then
  "$REPO_ROOT/.claude/hooks/push-review-gate.sh" "$@"
  exit $?
fi

exit 0
'''

new_block = '''# ── rea push-review-gate — REMOVED 2026-04-22 ────────────────────────────────
# Removed per project owner directive. Two upstream rea bugs (schema mismatch
# between codex-adversarial agent output and the gate's jq predicate; escape
# hatch resolving `dist/audit/append.js` at repo root instead of node_modules)
# made the gate unworkable across multiple releases. Codex adversarial review
# is retained as a first-class step via the /codex-review slash command and
# the codex-adversarial subagent, and is enforced in CI rather than at the
# local push boundary. CodeRabbit + 3-tier agent review remain.

exit 0
'''

has_old = old_block in content
has_new = new_block in content

if has_old and has_new:
    print('MIXED STATE: both old and new blocks present — refusing to touch', file=sys.stderr)
    print('  fix .husky/pre-push by hand, then re-run', file=sys.stderr)
    sys.exit(1)

if has_new:
    print('OK (already applied)')
    sys.exit(0)

if not has_old:
    print('OLD BLOCK NOT FOUND', file=sys.stderr)
    sys.exit(1)

content = content.replace(old_block, new_block)

with open(path, 'w') as f:
    f.write(content)

print('OK')
