#!/bin/bash
# Native git `.husky/pre-push` adapter for the REA push-review gate.
# Fires BEFORE `git push` via husky. Runs a full diff analysis against the
# target branch and requests security + code review before allowing the push.
#
# Exit codes:
#   0 = allow (no meaningful diff, cached review pass, or escape hatch
#              invoked with successful audit-append)
#   2 = block (review required — protected-path gate OR general push-review
#              gate — or escape hatch invoked but audit-append failed)
#
# ── Install ───────────────────────────────────────────────────────────────────
# This adapter is the recommended entry point for husky-driven pushes. Point
# `.husky/pre-push` at this file:
#
#   #!/bin/sh
#   REA_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
#   exec "$REA_ROOT/.claude/hooks/push-review-gate-git.sh" "$@"
#
# `REA_ROOT` is resolved inside `.husky/pre-push` itself because neither git
# nor husky provides that env var — a bare `"$REA_ROOT/..."` would expand to
# `/.claude/...` and exit 126. See rea's own `.husky/pre-push` for the
# reference implementation.
#
# Git's native pre-push contract is:
#   - stdin: one line per ref being pushed, `<local_ref> <local_sha> <remote_ref> <remote_sha>`
#   - argv:  `<remote_name> <remote_url>`
#
# ── Architecture ──────────────────────────────────────────────────────────────
# This file is a thin ADAPTER. All logic lives in
# `hooks/_lib/push-review-core.sh` (see `pr_core_run`). The core ships a
# `pr_parse_prepush_stdin` helper that recognises git's native refspec stdin
# and synthesises an equivalent `git push <remote>` CMD for the downstream
# protected-path detection.
#
# Two adapters share the core:
#   - push-review-gate.sh      ← Claude Code PreToolUse stdin (JSON `.tool_input.command`)
#   - push-review-gate-git.sh  ← this file, native `.husky/pre-push` stdin
#
# The core's BUG-008 stdin sniff makes either shape work from either adapter,
# so a consumer CAN wire `push-review-gate.sh` into `.husky/pre-push` and it
# just works. The git-native adapter exists so `.husky/pre-push` expresses
# its install intent clearly and so future git-only behaviour (e.g. remote-
# URL-scoped policy overrides) has a natural home that does not bloat the
# generic Claude Code adapter.
#
# ── Escape hatches ────────────────────────────────────────────────────────────
#   REA_SKIP_CODEX_REVIEW=<reason>  — Codex-only waiver. Since 0.8.0 (#85)
#                                     this ONLY satisfies the protected-path
#                                     Codex-audit requirement. HALT, cross-
#                                     repo guard, ref-resolution, and the
#                                     push-review cache still run. See the
#                                     authoritative docstring in
#                                     `push-review-gate.sh` for the full
#                                     scope description. Audit record
#                                     `tool_name: "codex.review.skipped"`.
#   REA_SKIP_PUSH_REVIEW=<reason>   — bypass the WHOLE gate for this push.
#                                     Audit record
#                                     `tool_name: "push.review.skipped"`.
#
# Both hatches are value-carrying: the env value IS the reason recorded in
# the audit receipt. An empty value (`REA_SKIP_...=`) is treated as unset.
# The hatches sit behind `.rea/HALT` — HALT always wins.
#
# Fail-closed contract:
#   - `dist/audit/append.js` missing → exit 2 (build rea first)
#   - Node invocation failure → exit 2
#   - Unable to resolve actor from git config → exit 2

set -uo pipefail

# Read ALL stdin immediately. For husky-driven pushes this is git's refspec
# list; for any other caller it is whatever they hand us. The core's sniff
# decides.
INPUT=$(cat)

# Resolve the core library from this adapter's own on-disk location. Using
# BASH_SOURCE (not argv $0) so invocations from `.husky/pre-push`, from a
# consumer's `.claude/hooks/`, or from a direct `bash hooks/push-review-gate-git.sh`
# all find `_lib/` next to the adapter. Consistent with the BUG-012
# script-anchor rationale in core.
_adapter_script="${BASH_SOURCE[0]:-$0}"
_adapter_dir="$(cd -- "$(dirname -- "$_adapter_script")" && pwd -P 2>/dev/null)"
_core_lib="${_adapter_dir}/_lib/push-review-core.sh"
if [[ ! -f "$_core_lib" ]]; then
  printf 'rea-hook: push-review-core.sh not found next to %s\n' \
    "$_adapter_script" >&2
  printf 'rea-hook:   expected at %s\n' "$_core_lib" >&2
  exit 2
fi
# shellcheck source=_lib/push-review-core.sh
source "$_core_lib"

pr_core_run "$_adapter_script" "$INPUT" "$@"
