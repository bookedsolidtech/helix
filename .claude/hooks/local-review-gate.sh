#!/bin/bash
# PreToolUse hook: local-review-gate.sh
# 0.26.0+ — forceful local-first delegation enforcement.
#
# Fires BEFORE every Bash tool call. Detects `git push` (and optionally
# `git commit` per policy) and refuses the command unless a recent
# `rea.local_review` audit entry covers HEAD.
#
# This is the AGENT-SPECIFIC enforcement layer — Claude Code's Bash
# tool fires PreToolUse hooks BEFORE the command runs, so an agent
# trying `git push` is stopped HERE, before husky even sees it. Husky
# is the second layer (terminal users + CI), `rea preflight` is the
# workhorse both layers call.
#
# The forceful aspect is exactly what CTO directive 2026-05-05 asked
# for: "an agent driving rea via Bash tool literally cannot push
# without first creating a `rea.local_review` audit entry, OR
# explicitly invoking the override, OR having the policy set to `off`
# for the team."
#
# Off-switch (FIRST-class concern): `policy.review.local_review.mode: off`
# — the gate becomes a silent no-op. Teams without codex/claude opt out
# cleanly via policy.
#
# Per-invocation override: REA_SKIP_LOCAL_REVIEW="<reason>" — the gate
# allows the command and `rea preflight` audits the bypass.
#
# Exit codes:
#   0 = allow (mode=off, override set, recent review found, non-git command)
#   2 = refuse (no recent review covering HEAD)

set -uo pipefail

# Source shared command segmenter — same parser the dangerous-bash and
# protected-paths hooks use. Lets us detect `git push`/`git commit` even
# when nested inside `bash -c "..."`, behind env-var prefixes, or chained
# with `&&` / `;`.
# shellcheck source=_lib/cmd-segments.sh
source "$(dirname "$0")/_lib/cmd-segments.sh"

# 1. Read stdin (Claude Code hook payload).
INPUT=$(cat)

# 2. Dependency check.
if ! command -v jq >/dev/null 2>&1; then
  printf 'REA ERROR: jq is required but not installed.\n' >&2
  exit 2
fi

# 3. HALT check (kill-switch wins over everything).
# shellcheck source=_lib/halt-check.sh
source "$(dirname "$0")/_lib/halt-check.sh"
check_halt
REA_ROOT=$(rea_root)

# 4. Source policy reader (needed to read mode + refuse_at + bypass_env_var).
# shellcheck source=_lib/policy-read.sh
source "$(dirname "$0")/_lib/policy-read.sh"

# 5. Off-switch — silent no-op when policy says so.
LOCAL_REVIEW_MODE=$(policy_get_local_review_mode)
if [[ "$LOCAL_REVIEW_MODE" == "off" ]]; then
  exit 0
fi

# 6. Parse `tool_input.command` from the hook payload.
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
if [[ -z "$CMD" ]]; then
  exit 0
fi

# 7. Determine which git ops to refuse from policy.review.local_review.refuse_at
#    (default 'push').
REFUSE_AT=$(policy_get_local_review_refuse_at)
[[ -z "$REFUSE_AT" ]] && REFUSE_AT='push'

REFUSE_PUSH=0
REFUSE_COMMIT=0
case "$REFUSE_AT" in
  push)   REFUSE_PUSH=1 ;;
  commit) REFUSE_COMMIT=1 ;;
  both)   REFUSE_PUSH=1; REFUSE_COMMIT=1 ;;
  *)      REFUSE_PUSH=1 ;;  # Unknown value falls back to safest default.
esac

# 8. Detect git push / git commit in any segment of the command.
#
# We use `any_segment_starts_with` so:
#   - `git push origin main`           → matches push
#   - `git commit -m "msg"`            → matches commit
#   - `cd /tmp && git push`            → matches push (segment after &&)
#   - `echo "git push later"`          → does NOT match (echo, not git)
#   - `git log --oneline | git push`   → matches push (last segment)
#
# We don't try to match `git commit --amend` separately — an amend
# rewrites HEAD, so it's the same coverage problem as a fresh commit.
#
# 0.26.0 codex round-23 P2 fix: `any_segment_starts_with` strips env-var
# prefixes via `_rea_strip_prefix`, whose regex `^NAME=[^[:space:]]+[[:space:]]+`
# stops at the first space inside a quoted value. For
# `REA_SKIP_LOCAL_REVIEW="urgent fix" git push origin main` the stripper
# bails halfway and the segment never starts with `git`, so the original
# detector returned false → NEEDS_PREFLIGHT=0 → hook exits 0 BEFORE the
# bypass-detection block ever ran (broke the documented "agent literally
# cannot push without an audit entry" guarantee).
#
# Fix: add an `any_segment_raw_matches` fallback whose pattern requires
# one or more env-var assignments (with quoted-value support) BEFORE the
# `git push`/`git commit` token. This anchors strictly on shapes the
# stripper would have eaten if values were unquoted, so it cannot
# false-positive on `echo "git push later"` (segment doesn't start with
# `NAME=...`) or on a quoted-mention inside a body.
NEEDS_PREFLIGHT=0
GIT_OP_LABEL=''
# 0.26.0 round-25 P1-B fix: capture EVERY trigger segment, not just the
# first. Pre-fix `find_first_segment_starting_with` returned only the
# first matching segment; if a multi-push command contained two pushes
# (e.g. `BYPASS=fake git push fake-remote --dry-run; git push origin main`),
# the bypass on segment 1 was honored globally and segment 2 (the real
# push to origin/main) went through ungated. Round-25 fix: collect every
# trigger segment into a newline-delimited list, then in step 9b validate
# each one independently. Bypass succeeds only if EVERY trigger segment
# carries its own bypass (process-env or inline). Any trigger without a
# bypass forces preflight invocation.
#
# Newline-delimited; empty when NEEDS_PREFLIGHT=0.
TRIGGER_SEGMENTS=''

# Raw-fallback regex shared between push and commit detection — anchors
# `^(NAME=value...)+git[[:space:]]+(push|commit)` at segment start. The
# prefix-stripper bails on quoted-value-with-spaces, so this fallback is
# the path that catches `REA_SKIP="urgent fix" git push`.
#
# 0.26.0 round-25 P2-A fix: extend the value-shape alternation to accept
# ANSI-C form `$'...'` (literal `$` followed by single-quoted body). Pre-
# fix `FOO=$'a b' git push` matched no shape — `_REA_RAW_INLINE_RE_PUSH`
# failed AND `_rea_strip_prefix` bailed — so detection silently dropped
# and the gate exited 0 BEFORE the bypass-detection block, defeating the
# documented "agent literally cannot push without an audit entry"
# guarantee under `refuse_at: commit/both` (ANSI-C form is rare for
# commits but covered for symmetry).
_REA_RAW_INLINE_RE_PUSH='^([A-Za-z_][A-Za-z0-9_]*=("[^"]*"|'"'"'[^'"'"']*'"'"'|\$'"'"'[^'"'"']*'"'"'|[^[:space:]]+)[[:space:]]+)+git[[:space:]]+push([[:space:]]|$)'
_REA_RAW_INLINE_RE_COMMIT='^([A-Za-z_][A-Za-z0-9_]*=("[^"]*"|'"'"'[^'"'"']*'"'"'|\$'"'"'[^'"'"']*'"'"'|[^[:space:]]+)[[:space:]]+)+git[[:space:]]+commit([[:space:]]|$)'

# Helper: append a segment list to TRIGGER_SEGMENTS (newline-delimited),
# preserving order and skipping empties.
_rea_append_triggers() {
  local list="$1"
  if [[ -z "$list" ]]; then
    return 0
  fi
  if [[ -z "$TRIGGER_SEGMENTS" ]]; then
    TRIGGER_SEGMENTS="$list"
  else
    TRIGGER_SEGMENTS="${TRIGGER_SEGMENTS}"$'\n'"${list}"
  fi
}

if [[ $REFUSE_PUSH -eq 1 ]]; then
  # Sweep ALL push trigger segments. A multi-push command must validate
  # bypass on EACH trigger; first-only capture leaks the laundering class.
  _push_segs_stripped=$(find_all_segments_starting_with "$CMD" 'git[[:space:]]+push([[:space:]]|$)' || true)
  if [[ -n "$_push_segs_stripped" ]]; then
    NEEDS_PREFLIGHT=1
    GIT_OP_LABEL='git push'
    _rea_append_triggers "$_push_segs_stripped"
  fi
  # ALSO sweep raw-form push trigger segments (env-prefix shapes the
  # stripper bails on). Combined with the stripped sweep this gives full
  # coverage. Note: a segment matched by the stripped sweep may ALSO
  # match the raw sweep — that's fine, we de-dupe in the bypass loop.
  _push_segs_raw=$(find_all_segments_raw_matches "$CMD" "$_REA_RAW_INLINE_RE_PUSH" || true)
  if [[ -n "$_push_segs_raw" ]]; then
    NEEDS_PREFLIGHT=1
    GIT_OP_LABEL='git push'
    _rea_append_triggers "$_push_segs_raw"
  fi
fi

if [[ $REFUSE_COMMIT -eq 1 ]]; then
  # `git commit` alone (interactive editor) is also covered — once committed,
  # HEAD moves and any subsequent push would refuse anyway. Catching it here
  # prevents the agent from doing N commits and only discovering the gate
  # at push time.
  _commit_segs_stripped=$(find_all_segments_starting_with "$CMD" 'git[[:space:]]+commit([[:space:]]|$)' || true)
  if [[ -n "$_commit_segs_stripped" ]]; then
    NEEDS_PREFLIGHT=1
    [[ -z "$GIT_OP_LABEL" ]] && GIT_OP_LABEL='git commit'
    _rea_append_triggers "$_commit_segs_stripped"
  fi
  _commit_segs_raw=$(find_all_segments_raw_matches "$CMD" "$_REA_RAW_INLINE_RE_COMMIT" || true)
  if [[ -n "$_commit_segs_raw" ]]; then
    NEEDS_PREFLIGHT=1
    [[ -z "$GIT_OP_LABEL" ]] && GIT_OP_LABEL='git commit'
    _rea_append_triggers "$_commit_segs_raw"
  fi
fi

if [[ $NEEDS_PREFLIGHT -eq 0 ]]; then
  # Not a git push or git commit — let it through.
  if [[ "${REA_LOCAL_REVIEW_DEBUG_TRACE:-}" == "1" ]]; then
    printf 'rea-local-review-trace: detect=none\n' >&2
  fi
  exit 0
fi

# 9. Per-invocation override env-var. Default REA_SKIP_LOCAL_REVIEW; the
#    policy can rename the var (e.g. for organizations that want a
#    bespoke audit signature). When set with a non-empty value the gate
#    allows the command — `rea preflight` itself will audit the bypass
#    when invoked downstream.
BYPASS_VAR=$(policy_get_local_review_bypass_env_var)
[[ -z "$BYPASS_VAR" ]] && BYPASS_VAR='REA_SKIP_LOCAL_REVIEW'

# 9a. Read the configured env-var from the hook's PROCESS env (indirect
#     expansion, bash 3.2 compatible). This catches the case where the
#     operator exported the var BEFORE invoking Claude Code.
BYPASS_VALUE="${!BYPASS_VAR:-}"

# 9b. Detect inline `VAR=value [VAR=value...] git ...` assignment for
#     EACH trigger segment. POSIX shells parse `VAR=value cmd` as a
#     single-call env override — the variable lives in the spawned cmd's
#     env only, never in the hook's process env. ${!BYPASS_VAR} therefore
#     returns empty for the override form
#     `REA_SKIP_LOCAL_REVIEW="reason" git push` and the gate would
#     silently refuse a documented escape hatch. Detect the inline
#     assignment so the hook honors it.
#
#     0.26.0 round-25 P1-B fix: pre-fix the gate captured only the FIRST
#     trigger segment and validated bypass against it. Multi-push
#     laundering PoCs:
#       BYPASS=fake git push fake-remote --dry-run; git push origin main
#         → bypass on segment 1 honored, segment 2 (real push) ungated.
#     Round-25 fix: iterate over EVERY trigger segment in TRIGGER_SEGMENTS.
#     Bypass succeeds globally only if EVERY trigger segment carries its
#     own bypass (process-env covers all uniformly; otherwise each
#     trigger segment must have an inline bypass). Any trigger segment
#     without bypass forces preflight invocation.
#
#     Empty values MUST NOT bypass (REA_SKIP_LOCAL_REVIEW="" must refuse,
#     same as missing). The value-capture group requires at least one
#     non-quote / non-whitespace char inside whatever quoting form was
#     used; explicit length-check after match also enforces non-empty.

# Validate bypass_env_var is a POSIX env-var name. If the policy returns
# junk (regex metachars, empty), skip inline detection (the gate then
# requires preflight unless process-env BYPASS_VALUE is set).
_BYPASS_VAR_VALID=0
if [[ "$BYPASS_VAR" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  _BYPASS_VAR_VALID=1
fi

# Three accepted value shapes for inline bypass:
#   VAR=word              (no quotes; value = chars up to whitespace)
#   VAR="quoted"          (double-quoted; value between the quotes)
#   VAR='quoted'          (single-quoted; value between the quotes)
# (ANSI-C `VAR=$'a b'` is also recognized via the prefix-stripper in
# round-25 P2-A, but bypass detection still anchors on the conventional
# three quote forms — ANSI-C as a bypass value is not a documented
# escape hatch, only as an env-prefix shape.)
# The trailing `git` anchor (with optional intervening env assignments)
# prevents echo / commit-message false-positives.
_INLINE_TAIL_RE='([[:space:]]+([A-Za-z_][A-Za-z0-9_]*=([^[:space:]"'"'"']*|"[^"]*"|'"'"'[^'"'"']*'"'"')[[:space:]]+)*git([[:space:]]|$))'

# Round-30 F1 sibling-sweep: allow ZERO-or-more LEADING env-var prefixes
# at segment start before the bypass var. POSIX-legal shapes like
# `GIT_TRACE=1 REA_SKIP_LOCAL_REVIEW="reason" git push` were rejected by
# the round-27 F1 anchor tightening (`^[[:space:]]*${BYPASS_VAR}=`).
# This sub-pattern matches the same env-prefix shapes as
# `_REA_RAW_INLINE_RE_PUSH` so the comment-tail safety property
# round-27 F1 added is preserved (comments don't start at segment
# start).
_INLINE_LEAD_PREFIX_RE='^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=("[^"]*"|'"'"'[^'"'"']*'"'"'|\$'"'"'[^'"'"']*'"'"'|[^[:space:]]+)[[:space:]]+)*'

# Per-segment bypass evaluator. Echoes the inline bypass value (if any)
# on stdout for the supplied segment. Empty stdout means no inline bypass
# was detected for that segment.
_rea_evaluate_inline_bypass() {
  local seg="$1"
  if [[ $_BYPASS_VAR_VALID -eq 0 || -z "$seg" ]]; then
    return 0
  fi
  local masked
  masked=$(quote_masked_cmd "$seg")
  # Round-27 F1 fix: anchor at SEGMENT START (post-mask, post-strip).
  # Pre-round-27 the alternation `(^|[[:space:]])` allowed the bypass
  # shape to appear anywhere in the segment — including inside a `#`
  # shell-comment tail. PoC: `git push origin main # see PR —
  # REA_SKIP_LOCAL_REVIEW=fake git push`. The `# REA_SKIP_LOCAL_REVIEW=fake`
  # portion was whitespace-prefixed and matched the unquoted alternative,
  # yielding val=fake and authorizing the real `git push origin main`.
  #
  # Round-27 F1 anchored at `^[[:space:]]*` — segment start after leading
  # whitespace. Comment tails are not segment start (they sit AFTER a
  # `git push` or other primary command), so the anchor refuses them.
  # Round-30 F1 sibling-sweep extends the anchor to also accept leading
  # env-var prefix shapes (`GIT_TRACE=1 BAR=baz REA_SKIP=...`) since
  # those ALSO sit at segment start by construction. Comment-tail safety
  # is preserved because `#` is not part of the env-prefix grammar.
  local val=""
  # _INLINE_LEAD_PREFIX_RE adds 2 capture groups (outer iteration body +
  # inner value-shape). The bypass value capture is the 3rd group:
  # BASH_REMATCH[3].
  if [[ "$masked" =~ ${_INLINE_LEAD_PREFIX_RE}${BYPASS_VAR}=\"([^\"]*)\"${_INLINE_TAIL_RE} ]]; then
    val="${BASH_REMATCH[3]}"
  elif [[ "$masked" =~ ${_INLINE_LEAD_PREFIX_RE}${BYPASS_VAR}=\'([^\']*)\'${_INLINE_TAIL_RE} ]]; then
    val="${BASH_REMATCH[3]}"
  elif [[ "$masked" =~ ${_INLINE_LEAD_PREFIX_RE}${BYPASS_VAR}=([^[:space:]\"\']+)${_INLINE_TAIL_RE} ]]; then
    val="${BASH_REMATCH[3]}"
  fi
  # Non-empty value only — empty string from any of the three regexes
  # (e.g. VAR="") MUST NOT bypass.
  if [[ -n "$val" ]]; then
    printf '%s' "$val"
  fi
}

# Round-25 P1-B sweep: every trigger segment must independently authorize
# the bypass. Process-env is global (a single non-empty value covers all
# trigger segments); inline is per-segment.
ALL_BYPASSED=1
INLINE_BYPASS_VALUE=""
ANY_INLINE_VALUE=""
# Track first-failed segment for refusal trace (debug only).
FIRST_UNCOVERED_SEGMENT=""

# When the operator's process env carries a non-empty bypass, that single
# value covers every trigger segment uniformly — process-env is a
# session-wide override, not a per-segment one. Skip the per-segment
# inline scan entirely in that case.
if [[ -n "$BYPASS_VALUE" ]]; then
  ALL_BYPASSED=1
else
  # Iterate trigger segments via process-substitution to preserve the
  # newline-delimited list. Empty/duplicate entries are silently skipped.
  _seen_segments=""
  while IFS= read -r _seg; do
    [[ -z "$_seg" ]] && continue
    # De-dupe: a segment matched by both the stripped and raw sweeps
    # appears twice. Compare against a delimited concatenation of seen
    # segments to avoid re-evaluating the same one.
    if [[ "$_seen_segments" == *$'\x1f'"$_seg"$'\x1f'* ]]; then
      continue
    fi
    _seen_segments="${_seen_segments}"$'\x1f'"${_seg}"$'\x1f'
    _seg_inline=$(_rea_evaluate_inline_bypass "$_seg")
    if [[ -z "$_seg_inline" ]]; then
      ALL_BYPASSED=0
      [[ -z "$FIRST_UNCOVERED_SEGMENT" ]] && FIRST_UNCOVERED_SEGMENT="$_seg"
      # Don't break — keep scanning so trace can report the count below.
    else
      # Capture the FIRST observed inline bypass value for the trace
      # message (so legitimate single-trigger flows still report
      # `reason=...`). Not load-bearing for the decision itself — the
      # ALL_BYPASSED gate is what governs the exit.
      [[ -z "$ANY_INLINE_VALUE" ]] && ANY_INLINE_VALUE="$_seg_inline"
    fi
  done <<< "$TRIGGER_SEGMENTS"
fi

# 9c. Allow ONLY when every trigger segment authorized bypass (process-env
#     covers globally; inline must be present on each segment). Failure
#     of any single trigger segment forces preflight invocation.
if [[ $ALL_BYPASSED -eq 1 ]]; then
  if [[ -n "$BYPASS_VALUE" ]]; then
    INLINE_BYPASS_VALUE=""
  else
    INLINE_BYPASS_VALUE="$ANY_INLINE_VALUE"
  fi
  # Override active — allow. The downstream `rea preflight` (in husky
  # or otherwise) will write the audit override entry. We do NOT write
  # one here because that would double-audit any push that crosses both
  # the bash-tier and the husky tier.
  #
  # Test-only debug trace: when REA_LOCAL_REVIEW_DEBUG_TRACE=1 the gate
  # emits a structured marker on stderr identifying the branch taken
  # (bypass-process-env, bypass-inline, or refuse). Production never
  # sets this env var; the trace is silent by default. The trace lets
  # the codex round-23 P2 regression test distinguish "honored as
  # bypass" from "command shape unrecognized → silent exit" — both
  # exit 0 and produce no other output.
  if [[ "${REA_LOCAL_REVIEW_DEBUG_TRACE:-}" == "1" ]]; then
    if [[ -n "$INLINE_BYPASS_VALUE" ]]; then
      printf 'rea-local-review-trace: bypass=inline reason=%q op=%s\n' \
        "$INLINE_BYPASS_VALUE" "$GIT_OP_LABEL" >&2
    else
      printf 'rea-local-review-trace: bypass=process-env reason=%q op=%s\n' \
        "$BYPASS_VALUE" "$GIT_OP_LABEL" >&2
    fi
  fi
  exit 0
fi
# Round-25 P1-B trace: surface that at least one trigger segment lacked
# a bypass (the laundering-class signal). Production stays silent.
if [[ "${REA_LOCAL_REVIEW_DEBUG_TRACE:-}" == "1" ]]; then
  printf 'rea-local-review-trace: refuse op=%s reason=trigger-without-bypass\n' \
    "$GIT_OP_LABEL" >&2
fi

# 10. Resolve the rea binary the same way the husky pre-push template
#     does — local node_modules first, dogfood dist next, PATH, then npx.
#
# Round-30 F1 fix: align this 4-branch ladder with
# templates/pre-push.local-first.sh:55-61 and the canonical husky body in
# src/cli/install/pre-push.ts. Pre-fix the gate stopped at PATH and fell
# open with the "could not locate" advisory whenever the operator only
# had npx available (pnpm dlx-style installs, npx --no-install cache
# hits, CI nodes that don't `npm i`). Adding the `npx --no-install`
# branch closes that drift.
REA_BIN=()
if [ -x "${REA_ROOT}/node_modules/.bin/rea" ]; then
  REA_BIN=("${REA_ROOT}/node_modules/.bin/rea")
elif [ -f "${REA_ROOT}/dist/cli/index.js" ] \
   && [ -f "${REA_ROOT}/package.json" ] \
   && grep -q '"name": *"@bookedsolid/rea"' "${REA_ROOT}/package.json" 2>/dev/null; then
  REA_BIN=(node "${REA_ROOT}/dist/cli/index.js")
elif command -v rea >/dev/null 2>&1; then
  REA_BIN=(rea)
elif command -v npx >/dev/null 2>&1; then
  # Last resort: npx will resolve the package from npm or the cache.
  # Pass `--no-install` so a rare cache-cold machine surfaces a clear
  # error instead of silently downloading at hook time.
  REA_BIN=(npx --no-install @bookedsolid/rea)
fi

if [[ ${#REA_BIN[@]} -eq 0 ]]; then
  # Fail OPEN when rea itself can't be found — the agent's bash command
  # would have failed downstream too, and refusing here would be a
  # confusing error. Log to stderr so the operator sees the gap.
  printf 'rea: local-review-gate skipped — could not locate rea CLI. Install: pnpm add -D @bookedsolid/rea\n' >&2
  exit 0
fi

# 11. Run `rea preflight --strict` and use its exit code.
"${REA_BIN[@]}" preflight --strict
PREFLIGHT_STATUS=$?

if [[ $PREFLIGHT_STATUS -eq 0 ]]; then
  exit 0
fi

# Refuse — print a friendly explanation tied to the git op the agent
# tried to run. Exit 2 so Claude Code refuses the Bash command.
{
  printf 'BASH BLOCKED: %s — local-first review required\n' "$GIT_OP_LABEL"
  printf '\n'
  printf '  rea preflight refused (exit %d). The local-first guardrail (CTO directive\n' "$PREFLIGHT_STATUS"
  printf '  2026-05-05) requires a recent codex review of the working tree before any\n'
  printf '  push or commit.\n'
  printf '\n'
  printf '  To unblock, do ONE of:\n'
  printf '    1. Run `rea review` first — writes the canonical audit entry.\n'
  printf '    2. Set %s="<reason>" — per-invocation override (audited).\n' "$BYPASS_VAR"
  printf '    3. Edit .rea/policy.yaml — set:\n'
  printf '         review:\n'
  printf '           local_review:\n'
  printf '             mode: off\n'
  printf '       (use this if your team does not have codex/claude installed)\n'
} >&2
exit 2
