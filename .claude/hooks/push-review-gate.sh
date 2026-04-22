#!/bin/bash
# PreToolUse hook: push-review-gate.sh
# Fires BEFORE every Bash tool call that matches "git push".
# Runs a full diff analysis against the target branch and requests
# security + code review before allowing the push.
#
# Exit codes:
#   0 = allow (no meaningful diff, or review cached, or escape hatch invoked)
#   2 = block (needs review, or escape hatch invoked but audit-append failed)
#
# ── Architecture (0.7.0 BUG-008 cleanup) ─────────────────────────────────────
# This file is now a thin ADAPTER. All logic lives in
# `hooks/_lib/push-review-core.sh` (see `pr_core_run`). The adapter's only
# job is to (a) capture stdin, and (b) hand its own script path + stdin +
# argv to the core so the cross-repo anchor walks up from the RIGHT script
# location.
#
# Two adapters share the core:
#   - push-review-gate.sh      ← this file, Claude Code PreToolUse stdin (JSON)
#   - push-review-gate-git.sh  ← native `.husky/pre-push` stdin (git refspec)
# The core's BUG-008 sniff makes either stdin shape work from either adapter,
# so in practice a consumer can wire THIS file into `.husky/pre-push` and it
# just works. The `-git` adapter exists for clarity of install intent.
#
# ── Codex-only waiver: REA_SKIP_CODEX_REVIEW ─────────────────────────────────
# Env var `REA_SKIP_CODEX_REVIEW=<reason>` waives the Codex adversarial-
# review requirement (section 7 protected-path check). Set to any non-empty
# value; the value IS the reason recorded in the audit record (no default
# reason is supplied — if the operator sets `REA_SKIP_CODEX_REVIEW=1` the
# reason is literally "1").
#
# SCOPE (0.8.0, #85): Codex-only. The waiver only satisfies the
# protected-path Codex-audit requirement. Every other gate this hook
# runs still runs:
#   • HALT (.rea/HALT) — still blocks.
#   • Cross-repo guard — still blocks.
#   • Ref-resolution failures — still block.
#   • Push-review cache — a miss still falls through to section 9's general
#     review-required block.
# (Blocked-paths enforcement is a separate hook on Edit/Write tiers, not
# this push hook — it was never gated by REA_SKIP_CODEX_REVIEW.)
#
# For a full-gate bypass, use `REA_SKIP_PUSH_REVIEW=<reason>` (section 5a).
# The 0.7.0 semantic (whole-gate bypass via the Codex hatch) was misleading
# — operators reached for REA_SKIP_CODEX_REVIEW to silence a transient
# Codex unavailability and accidentally bypassed every other check too.
# 0.8.0 narrows it to what the name implies.
#
# ORDERING: the waiver fires AFTER the HALT check but BEFORE ref-resolution.
# Prior to 0.7.0 the check ran inside the protected-path branch and only
# fired when the diff touched a protected path — which meant an operator
# who wanted to skip Codex review got blocked by a transient ref-resolution
# failure (missing remote object, unresolvable source ref, etc.) before the
# skip ever fired. The current ordering preserves the skip audit record
# even when downstream gates (ref-resolution, cache) block: the operator's
# commitment to waive is durable, even if the push itself is blocked on
# another gate.
#
# Every invocation appends a `tool_name: "codex.review.skipped"` record to
# `.rea/audit.jsonl` via the public audit helper. This record is intentionally
# NOT named `codex.review` so the existing jq predicate on `.tool_name ==
# "codex.review" and .metadata.verdict in {pass, concerns}` will never match
# a skip — a skipped review is not a review.
#
# Fail-closed contract:
#   - `dist/audit/append.js` missing → exit 2 (build rea first)
#   - Node invocation failure → exit 2
#   - Unable to resolve actor from git config → exit 2

set -uo pipefail

# Read ALL stdin immediately. The core's BUG-008 sniff decides whether this
# is Claude Code JSON or git's native pre-push refspec list.
INPUT=$(cat)

# Resolve the core library from this adapter's own on-disk location. Using
# BASH_SOURCE (not argv $0) so `bash hooks/push-review-gate.sh` and
# `.../.claude/hooks/push-review-gate.sh` both find `_lib/` next to the
# adapter. Consistent with the BUG-012 script-anchor rationale in core.
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
