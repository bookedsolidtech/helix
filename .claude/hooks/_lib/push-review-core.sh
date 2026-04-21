#!/bin/bash
# hooks/_lib/push-review-core.sh — shared core for push-review adapters.
#
# Source, do not execute. Callers (adapters) must:
#   1. capture stdin into INPUT
#   2. source this file
#   3. call `pr_core_run "$0" "$INPUT" "$@"` (passing the adapter's own
#      script path as $1, the raw stdin as $2, and the adapter's argv after)
#
# BUG-008 cleanup (0.7.0): the same core serves two physical adapters —
#
#   hooks/push-review-gate.sh       — Claude Code PreToolUse adapter. Stdin
#                                      is JSON `.tool_input.command`; argv
#                                      is empty. BUG-008 sniff handles the
#                                      case where this hook is wired into
#                                      `.husky/pre-push` directly and git's
#                                      native refspec lines arrive on stdin.
#
#   hooks/push-review-gate-git.sh   — Native `.husky/pre-push` adapter. Stdin
#                                      is always git's refspec contract; argv
#                                      $1 is the remote name, $2 is the URL.
#
# Both adapters delegate here unchanged. The sniff inside `pr_core_run`
# recognizes the two stdin shapes and routes accordingly.
#
# The functions are prefixed `pr_` (push-review) so sourcing this file into
# another hook (which may already define its own helpers) is safe.

# The caller sets `set -uo pipefail`; core inherits.

# Unused-in-isolation globals that `pr_core_run` writes as locals:
# REA_ROOT, CMD, CODEX_REQUIRED, ZERO_SHA. We do NOT declare them at file
# scope — dynamic scoping means `pr_core_run`'s `local` declarations are
# visible inside the helpers it calls.

# ── pr_parse_prepush_stdin ───────────────────────────────────────────────────
# Parse git's pre-push stdin contract.
#
# Stdin shape: one line per refspec, with fields
#   `<local_ref> <local_sha> <remote_ref> <remote_sha>`
# Emits one record per accepted line on stdout:
#   `local_sha|remote_sha|local_ref|remote_ref`
# Returns non-zero with no output if stdin does not match the contract, so
# the caller can switch to argv fallback. Portable to macOS /bin/bash 3.2.
pr_parse_prepush_stdin() {
  local raw="$1"
  local accepted=0
  local line local_ref local_sha remote_ref remote_sha rest
  local -a records
  records=()
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    read -r local_ref local_sha remote_ref remote_sha rest <<<"$line"
    if [[ -z "$local_ref" || -z "$local_sha" || -z "$remote_ref" || -z "$remote_sha" ]]; then
      continue
    fi
    if [[ ! "$local_sha" =~ ^[0-9a-f]{40}$ ]] || [[ ! "$remote_sha" =~ ^[0-9a-f]{40}$ ]]; then
      return 1
    fi
    records+=("${local_sha}|${remote_sha}|${local_ref}|${remote_ref}")
    accepted=1
  done <<<"$raw"
  if [[ "$accepted" -ne 1 ]]; then
    return 1
  fi
  local r
  for r in "${records[@]}"; do
    printf '%s\n' "$r"
  done
}

# ── pr_resolve_argv_refspecs ─────────────────────────────────────────────────
# Fallback refspec resolver: parse `git push [remote] [refspec...]` from the
# command string when stdin has no pre-push lines. Emits newline-separated
# records as "local_sha|remote_sha|local_ref|remote_ref" where `local_sha` is
# HEAD of the named source ref (or HEAD itself for bare refspecs) and
# `remote_sha` is zero so merge-base logic falls back to the configured
# default. Exits the script with code 2 on operator-error conditions
# (HEAD target, unresolvable source ref).
#
# Reads REA_ROOT and ZERO_SHA from the caller's function scope.
pr_resolve_argv_refspecs() {
  local cmd="$1"
  local segment
  segment=$(printf '%s' "$cmd" | awk '
    {
      idx = match($0, /git[[:space:]]+push([[:space:]]|$)/)
      if (!idx) exit
      tail = substr($0, idx)
      n = match(tail, /[;&|]|&&|\|\|/)
      if (n > 0) tail = substr(tail, 1, n - 1)
      print tail
    }
  ')

  local -a specs
  specs=()
  local seen_push=0 remote_seen=0 delete_mode=0 tok
  # shellcheck disable=SC2086
  set -- $segment
  for tok in "$@"; do
    case "$tok" in
      git|push) seen_push=1; continue ;;
      --delete|-d)
        delete_mode=1
        continue
        ;;
      --delete=*)
        delete_mode=1
        specs+=("${tok#--delete=}")
        continue
        ;;
      -*) continue ;;
    esac
    [[ "$seen_push" -eq 0 ]] && continue
    if [[ "$remote_seen" -eq 0 ]]; then
      remote_seen=1
      continue
    fi
    if [[ "$delete_mode" -eq 1 ]]; then
      specs+=("__REA_DELETE__${tok}")
    else
      specs+=("$tok")
    fi
  done

  if [[ "${#specs[@]}" -eq 0 ]]; then
    local upstream dst_ref head_sha
    upstream=$(cd "$REA_ROOT" && git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || echo "")
    dst_ref="refs/heads/main"
    if [[ -n "$upstream" && "$upstream" == */* ]]; then
      dst_ref="refs/heads/${upstream#*/}"
    fi
    head_sha=$(cd "$REA_ROOT" && git rev-parse HEAD 2>/dev/null || echo "")
    [[ -z "$head_sha" ]] && return 1
    printf '%s|%s|HEAD|%s\n' "$head_sha" "$ZERO_SHA" "$dst_ref"
    return 0
  fi

  local spec src dst src_sha is_delete
  for spec in "${specs[@]}"; do
    is_delete=0
    if [[ "$spec" == __REA_DELETE__* ]]; then
      is_delete=1
      spec="${spec#__REA_DELETE__}"
    fi
    spec="${spec#+}"
    if [[ "$spec" == *:* ]]; then
      src="${spec%%:*}"
      dst="${spec##*:}"
    else
      src="$spec"
      dst="$spec"
    fi
    if [[ -z "$dst" ]]; then
      dst="${spec##*:}"
      src=""
    fi
    dst="${dst#refs/heads/}"
    dst="${dst#refs/for/}"
    if [[ "$is_delete" -eq 1 ]]; then
      if [[ -z "$dst" || "$dst" == "HEAD" ]]; then
        {
          printf 'PUSH BLOCKED: --delete refspec resolves to HEAD or empty (from %q)\n' "$spec"
        } >&2
        exit 2
      fi
      printf '%s|%s|(delete)|refs/heads/%s\n' "$ZERO_SHA" "$ZERO_SHA" "$dst"
      continue
    fi
    if [[ "$dst" == "HEAD" || -z "$dst" ]]; then
      {
        printf 'PUSH BLOCKED: refspec resolves to HEAD (from %q)\n' "$spec"
        printf '\n'
        # shellcheck disable=SC2016
        printf '  `git push <remote> HEAD:<branch>` or similar is almost always\n'
        printf '  operator error in this context. Name the destination branch\n'
        printf '  explicitly so the review gate can diff against it.\n'
        printf '\n'
      } >&2
      exit 2
    fi
    if [[ -z "$src" ]]; then
      printf '%s|%s|(delete)|refs/heads/%s\n' "$ZERO_SHA" "$ZERO_SHA" "$dst"
      continue
    fi
    src_sha=$(cd "$REA_ROOT" && git rev-parse --verify "${src}^{commit}" 2>/dev/null || echo "")
    if [[ -z "$src_sha" ]]; then
      {
        printf 'PUSH BLOCKED: could not resolve source ref %q to a commit.\n' "$src"
      } >&2
      exit 2
    fi
    printf '%s|%s|refs/heads/%s|refs/heads/%s\n' "$src_sha" "$ZERO_SHA" "$src" "$dst"
  done
}

# ── pr_core_run ──────────────────────────────────────────────────────────────
# Main orchestrator. Arguments:
#   $1 = adapter script path (BASH_SOURCE[0] from the adapter)
#   $2 = raw stdin (INPUT) captured by the adapter
#   $3..$N = adapter's original argv ($@). For git-native adapters, $3 is the
#            remote name and $4 is the URL. For Claude Code, typically absent.
#
# The function may `exit 0` (allow), `exit 2` (block), or fall through to
# section 9 which prints the review prompt and exits 2.
pr_core_run() {
  local adapter_script="$1"
  local INPUT="$2"
  shift 2
  # Remaining positional args are the adapter's original argv. For a git
  # native pre-push the first is the remote name; for Claude Code it is
  # typically unset. Default to `origin` for BUG-008 sniff consistency.
  local argv_remote="${1:-origin}"

  # 0.8.0 (#85): when REA_SKIP_CODEX_REVIEW is set, this flag flips to 1
  # in section 5c. The protected-path Codex-audit check (section 7) then
  # treats the requirement as satisfied — but every other gate (HALT,
  # cross-repo guard, ref-resolution, push-review cache, blocked-paths)
  # still runs. Full-gate bypass moved to REA_SKIP_PUSH_REVIEW a release
  # cycle ago; this narrows REA_SKIP_CODEX_REVIEW to what its name implies.
  local CODEX_WAIVER_ACTIVE=0

  # ── 1a. Cross-repo guard (must come FIRST — before any rea-scoped check) ──
  # BUG-012 (0.6.2) — anchor the install to the SCRIPT'S OWN LOCATION on disk.
  # The hook knows where it lives: installed at `<root>/.claude/hooks/<name>.sh`,
  # so `<root>` is two levels up from the adapter's BASH_SOURCE. No
  # caller-controlled env var participates in the trust decision.
  #
  # See THREAT_MODEL.md § CLAUDE_PROJECT_DIR for the full rationale.
  local SCRIPT_DIR
  SCRIPT_DIR="$(cd -- "$(dirname -- "$adapter_script")" && pwd -P 2>/dev/null)"
  # Walk up from SCRIPT_DIR looking for `.rea/policy.yaml`. This resolves
  # correctly for every reasonable topology — installed copy at
  # `<root>/.claude/hooks/<name>.sh` (2 up), source-of-truth copy at
  # `<root>/hooks/<name>.sh` (1 up, used when rea dogfoods itself or a
  # developer runs `bash hooks/push-review-gate.sh` to smoke-test), and any
  # future `hooks/_lib/` nesting. Cap at 4 levels so a stray hook dropped in
  # the wrong spot fails fast instead of walking to the filesystem root.
  local REA_ROOT=""
  local _anchor_candidate="$SCRIPT_DIR"
  local _i
  for _i in 1 2 3 4; do
    _anchor_candidate="$(cd -- "$_anchor_candidate/.." && pwd -P 2>/dev/null || true)"
    if [[ -n "$_anchor_candidate" && -f "$_anchor_candidate/.rea/policy.yaml" ]]; then
      REA_ROOT="$_anchor_candidate"
      break
    fi
  done
  if [[ -z "$REA_ROOT" ]]; then
    printf 'rea-hook: no .rea/policy.yaml found within 4 parents of %s\n' \
      "$SCRIPT_DIR" >&2
    printf 'rea-hook:   is this an installed rea hook, or is `.rea/policy.yaml`\n' >&2
    printf 'rea-hook:   nested more than 4 directories above the hook script?\n' >&2
    exit 2
  fi

  # Advisory-only: warn if the caller set CLAUDE_PROJECT_DIR to a path that
  # does not match the script anchor. Never let the env var override the
  # decision.
  if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
    local CPD_REAL
    CPD_REAL=$(cd -- "${CLAUDE_PROJECT_DIR}" 2>/dev/null && pwd -P 2>/dev/null || true)
    if [[ -n "$CPD_REAL" && "$CPD_REAL" != "$REA_ROOT" ]]; then
      printf 'rea-hook: ignoring CLAUDE_PROJECT_DIR=%s — anchoring to script location %s\n' \
        "$CLAUDE_PROJECT_DIR" "$REA_ROOT" >&2
    fi
  fi

  local CWD_REAL CWD_COMMON REA_COMMON CWD_COMMON_REAL REA_COMMON_REAL
  CWD_REAL=$(pwd -P 2>/dev/null || pwd)
  CWD_COMMON=$(git -C "$CWD_REAL" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)
  REA_COMMON=$(git -C "$REA_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)
  if [[ -n "$CWD_COMMON" && -n "$REA_COMMON" ]]; then
    # Both sides are git checkouts. Realpath'd common-dirs match IFF they
    # point at the same underlying repository (main or linked worktree).
    CWD_COMMON_REAL=$(cd "$CWD_COMMON" 2>/dev/null && pwd -P 2>/dev/null || echo "$CWD_COMMON")
    REA_COMMON_REAL=$(cd "$REA_COMMON" 2>/dev/null && pwd -P 2>/dev/null || echo "$REA_COMMON")
    if [[ "$CWD_COMMON_REAL" != "$REA_COMMON_REAL" ]]; then
      exit 0
    fi
  elif [[ -z "$CWD_COMMON" && -z "$REA_COMMON" ]]; then
    # Both sides non-git: legitimate 0.5.1 non-git escape-hatch. Fall back to
    # a literal path-prefix match. Quoted expansions prevent glob expansion.
    case "$CWD_REAL/" in
      "$REA_ROOT"/*|"$REA_ROOT"/) : ;;  # inside rea — run the gate
      *) exit 0 ;;                       # outside rea — not our gate
    esac
  fi
  # Mixed state (one side git, other not) or either probe failed → fail
  # CLOSED: run the gate.

  # ── 2. Dependency check ───────────────────────────────────────────────────
  if ! command -v jq >/dev/null 2>&1; then
    printf 'REA ERROR: jq is required but not installed.\n' >&2
    printf 'Install: brew install jq  OR  apt-get install -y jq\n' >&2
    exit 2
  fi

  # ── 3. HALT check ─────────────────────────────────────────────────────────
  local HALT_FILE="${REA_ROOT}/.rea/HALT"
  if [ -f "$HALT_FILE" ]; then
    printf 'REA HALT: %s\nAll agent operations suspended. Run: rea unfreeze\n' \
      "$(head -c 1024 "$HALT_FILE" 2>/dev/null || echo 'Reason unknown')" >&2
    exit 2
  fi

  # ── 4. Parse command ──────────────────────────────────────────────────────
  local CMD
  CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

  # ── 4a. BUG-008: self-detect git's native pre-push contract ───────────────
  # When the hook is wired into `.husky/pre-push`, git invokes it with
  #   `$1 = remote name`, `$2 = remote url`
  # and delivers one line per refspec on stdin:
  #   `<local_ref> <local_sha> <remote_ref> <remote_sha>`
  # The Claude Code PreToolUse wrapper instead delivers JSON on stdin, which
  # is what the jq parse above targets. When jq returns empty, the stdin may
  # in fact be git's pre-push ref-list — sniff the first non-blank line, and
  # if it matches the `<ref> <40-hex> <ref> <40-hex>` shape, synthesize CMD
  # as `git push <remote>` (from the adapter's argv_remote) so the remainder
  # of the gate runs through the pre-push parser in step 6 rather than the
  # argv fallback.
  #
  # Any other stdin shape (empty, random JSON, a non-push tool call) still
  # exits 0 here — the gate is a no-op for non-push Bash calls by design.
  local FIRST_STDIN_LINE
  FIRST_STDIN_LINE=$(printf '%s' "$INPUT" | awk 'NF { print; exit }')
  if [[ -z "$CMD" ]]; then
    if [[ -n "$FIRST_STDIN_LINE" ]] \
       && printf '%s' "$FIRST_STDIN_LINE" \
          | grep -qE '^[^[:space:]]+[[:space:]]+[0-9a-f]{40}[[:space:]]+[^[:space:]]+[[:space:]]+[0-9a-f]{40}[[:space:]]*$'; then
      CMD="git push ${argv_remote}"
    else
      exit 0
    fi
  fi

  # Only trigger on git push commands
  if ! printf '%s' "$CMD" | grep -qiE 'git[[:space:]]+push'; then
    exit 0
  fi

  # ── 5. Check if quality gates are enabled ─────────────────────────────────
  local POLICY_FILE="${REA_ROOT}/.rea/policy.yaml"
  if [[ -f "$POLICY_FILE" ]]; then
    if grep -qE 'push_review:[[:space:]]*false' "$POLICY_FILE" 2>/dev/null; then
      exit 0
    fi
  fi

  # ── 5a. REA_SKIP_PUSH_REVIEW — whole-gate escape hatch ────────────────────
  # An opt-in bypass for the ENTIRE push-review gate (not just the Codex
  # branch). Exists to unblock consumers when rea itself is broken or a
  # corrupt policy/audit file would otherwise deadlock a push. Requires an
  # explicit non-empty reason; the value of REA_SKIP_PUSH_REVIEW is recorded
  # verbatim in the audit record as the reason.
  #
  # Audit tool_name is `push.review.skipped`. This is intentionally NOT
  # `codex.review` or `codex.review.skipped` — a skip of the whole gate is a
  # separately-audited event and does not satisfy the Codex-review jq
  # predicate.
  if [[ -n "${REA_SKIP_PUSH_REVIEW:-}" ]]; then
    local SKIP_REASON="$REA_SKIP_PUSH_REVIEW"
    local AUDIT_APPEND_JS="${REA_ROOT}/dist/audit/append.js"

    if [[ ! -f "$AUDIT_APPEND_JS" ]]; then
      {
        printf 'PUSH BLOCKED: REA_SKIP_PUSH_REVIEW requires rea to be built.\n'
        printf '\n'
        printf '  REA_SKIP_PUSH_REVIEW is set but %s is missing.\n' "$AUDIT_APPEND_JS"
        printf '  Run: pnpm build\n'
        printf '\n'
      } >&2
      exit 2
    fi

    # Codex F2: CI-aware refusal.
    if [[ -n "${CI:-}" ]]; then
      local ALLOW_CI_SKIP=""
      local READ_FIELD_JS="${REA_ROOT}/dist/scripts/read-policy-field.js"
      if [[ -f "$READ_FIELD_JS" ]]; then
        ALLOW_CI_SKIP=$(REA_ROOT="$REA_ROOT" node "$READ_FIELD_JS" review.allow_skip_in_ci 2>/dev/null || echo "")
      fi
      if [[ "$ALLOW_CI_SKIP" != "true" ]]; then
        {
          printf 'PUSH BLOCKED: REA_SKIP_PUSH_REVIEW refused in CI context.\n'
          printf '\n'
          printf '  CI env var is set. An unauthenticated env-var bypass in a shared\n'
          printf '  build agent is not trusted. To enable, set\n'
          printf '    review:\n'
          printf '      allow_skip_in_ci: true\n'
          printf '  in .rea/policy.yaml — explicitly authorizing env-var skips in CI.\n'
          printf '\n'
        } >&2
        exit 2
      fi
    fi

    local SKIP_ACTOR
    SKIP_ACTOR=$(cd "$REA_ROOT" && git config user.email 2>/dev/null || echo "")
    if [[ -z "$SKIP_ACTOR" ]]; then
      SKIP_ACTOR=$(cd "$REA_ROOT" && git config user.name 2>/dev/null || echo "")
    fi
    if [[ -z "$SKIP_ACTOR" ]]; then
      {
        printf 'PUSH BLOCKED: REA_SKIP_PUSH_REVIEW requires a git identity.\n'
        printf '\n'
        # shellcheck disable=SC2016  # backticks are literal markdown in user-facing message
        printf '  Neither `git config user.email` nor `git config user.name`\n'
        printf '  is set. The skip audit record would have no actor; refusing\n'
        printf '  to bypass without one.\n'
        printf '\n'
      } >&2
      exit 2
    fi

    local SKIP_BRANCH SKIP_HEAD
    SKIP_BRANCH=$(cd "$REA_ROOT" && git branch --show-current 2>/dev/null || echo "")
    SKIP_HEAD=$(cd "$REA_ROOT" && git rev-parse HEAD 2>/dev/null || echo "")

    # Codex F2: record OS identity alongside the (mutable, git-sourced) actor
    # so downstream auditors can reconstruct who REALLY invoked the bypass on
    # a shared host. None of these are forgeable from inside the push process
    # alone.
    local SKIP_OS_UID SKIP_OS_WHOAMI SKIP_OS_HOST SKIP_OS_PID SKIP_OS_PPID
    local SKIP_OS_PPID_CMD SKIP_OS_TTY SKIP_OS_CI
    SKIP_OS_UID=$(id -u 2>/dev/null || echo "")
    SKIP_OS_WHOAMI=$(whoami 2>/dev/null || echo "")
    SKIP_OS_HOST=$(hostname 2>/dev/null || echo "")
    SKIP_OS_PID=$$
    SKIP_OS_PPID=$PPID
    SKIP_OS_PPID_CMD=$(ps -o command= -p "$PPID" 2>/dev/null | head -c 512 || echo "")
    SKIP_OS_TTY=$(tty 2>/dev/null || echo "not-a-tty")
    SKIP_OS_CI="${CI:-}"

    local SKIP_METADATA
    SKIP_METADATA=$(jq -n \
      --arg head_sha "$SKIP_HEAD" \
      --arg branch "$SKIP_BRANCH" \
      --arg reason "$SKIP_REASON" \
      --arg actor "$SKIP_ACTOR" \
      --arg os_uid "$SKIP_OS_UID" \
      --arg os_whoami "$SKIP_OS_WHOAMI" \
      --arg os_hostname "$SKIP_OS_HOST" \
      --arg os_pid "$SKIP_OS_PID" \
      --arg os_ppid "$SKIP_OS_PPID" \
      --arg os_ppid_cmd "$SKIP_OS_PPID_CMD" \
      --arg os_tty "$SKIP_OS_TTY" \
      --arg os_ci "$SKIP_OS_CI" \
      '{
        head_sha: $head_sha,
        branch: $branch,
        reason: $reason,
        actor: $actor,
        verdict: "skipped",
        os_identity: {
          uid: $os_uid,
          whoami: $os_whoami,
          hostname: $os_hostname,
          pid: $os_pid,
          ppid: $os_ppid,
          ppid_cmd: $os_ppid_cmd,
          tty: $os_tty,
          ci: $os_ci
        }
      }' 2>/dev/null)

    if [[ -z "$SKIP_METADATA" ]]; then
      {
        printf 'PUSH BLOCKED: REA_SKIP_PUSH_REVIEW could not serialize audit metadata.\n' >&2
      } >&2
      exit 2
    fi

    REA_ROOT="$REA_ROOT" REA_SKIP_METADATA="$SKIP_METADATA" \
      node --input-type=module -e "
        const mod = await import(process.env.REA_ROOT + '/dist/audit/append.js');
        const metadata = JSON.parse(process.env.REA_SKIP_METADATA);
        await mod.appendAuditRecord(process.env.REA_ROOT, {
          tool_name: 'push.review.skipped',
          server_name: 'rea.escape_hatch',
          status: mod.InvocationStatus.Allowed,
          tier: mod.Tier.Read,
          metadata,
        });
      " 2>/dev/null
    local NODE_STATUS=$?
    if [[ "$NODE_STATUS" -ne 0 ]]; then
      {
        printf 'PUSH BLOCKED: REA_SKIP_PUSH_REVIEW audit-append failed (node exit %s).\n' "$NODE_STATUS"
        printf '  Refusing to bypass the push gate without a receipt.\n'
      } >&2
      exit 2
    fi

    {
      printf '\n'
      printf '==  PUSH REVIEW GATE SKIPPED via REA_SKIP_PUSH_REVIEW\n'
      printf '    Reason:  %s\n' "$SKIP_REASON"
      printf '    Actor:   %s\n' "$SKIP_ACTOR"
      printf '    Branch:  %s\n' "${SKIP_BRANCH:-<detached>}"
      printf '    Head:    %s\n' "${SKIP_HEAD:-<unknown>}"
      printf '    Audited: .rea/audit.jsonl (tool_name=push.review.skipped)\n'
      printf '\n'
      printf '    This is a gate weakening. Every invocation is permanently audited.\n'
      printf '\n'
    } >&2
    exit 0
  fi

  # ── 5b. Resolve review.codex_required (hoisted from section 7a) ───────────
  # We need this BEFORE the REA_SKIP_CODEX_REVIEW check so G11.4 first-class
  # no-Codex mode stays a clean no-op: when the policy says Codex is not
  # required at all, there is nothing to skip, and setting
  # REA_SKIP_CODEX_REVIEW must not write a skip audit record.
  #
  # Fail-closed: a malformed/unparseable policy is treated as
  # codex_required=true so we never silently drop the Codex gate on a broken
  # policy file.
  local READ_FIELD_JS="${REA_ROOT}/dist/scripts/read-policy-field.js"
  local CODEX_REQUIRED="true"
  if [[ -f "$READ_FIELD_JS" ]]; then
    local FIELD_VALUE FIELD_STATUS
    FIELD_VALUE=$(REA_ROOT="$REA_ROOT" node "$READ_FIELD_JS" review.codex_required 2>/dev/null)
    FIELD_STATUS=$?
    case "$FIELD_STATUS" in
      0)
        if [[ "$FIELD_VALUE" == "false" ]]; then
          CODEX_REQUIRED="false"
        elif [[ "$FIELD_VALUE" == "true" ]]; then
          CODEX_REQUIRED="true"
        else
          printf 'REA WARN: review.codex_required resolved to non-boolean %q — treating as true\n' "$FIELD_VALUE" >&2
          CODEX_REQUIRED="true"
        fi
        ;;
      1)
        CODEX_REQUIRED="true"
        ;;
      *)
        printf 'REA WARN: read-policy-field exited %s — treating review.codex_required as true (fail-closed)\n' "$FIELD_STATUS" >&2
        CODEX_REQUIRED="true"
        ;;
    esac
  fi

  # ── 5c. REA_SKIP_CODEX_REVIEW — Codex-review bypass ───────────────────────
  # Runs here (before ref-resolution) so ref-resolution failures in section 6
  # do not strand an operator who has committed to the skip. See the
  # adapter's file-top docstring for the ordering rationale (0.7.0).
  #
  # Gated on CODEX_REQUIRED=true (from section 5b): if policy explicitly opts
  # into no-Codex mode, the skip is a no-op — nothing to skip, no audit noise.
  if [[ -n "${REA_SKIP_CODEX_REVIEW:-}" && "$CODEX_REQUIRED" == "true" ]]; then
    local SKIP_REASON="$REA_SKIP_CODEX_REVIEW"
    local AUDIT_APPEND_JS="${REA_ROOT}/dist/audit/append.js"

    if [[ ! -f "$AUDIT_APPEND_JS" ]]; then
      {
        printf 'PUSH BLOCKED: escape hatch requires rea to be built.\n'
        printf '\n'
        printf '  REA_SKIP_CODEX_REVIEW is set but %s is missing.\n' "$AUDIT_APPEND_JS"
        printf '  Run: pnpm build\n'
        printf '\n'
      } >&2
      exit 2
    fi

    local SKIP_ACTOR
    SKIP_ACTOR=$(cd "$REA_ROOT" && git config user.email 2>/dev/null || echo "")
    if [[ -z "$SKIP_ACTOR" ]]; then
      SKIP_ACTOR=$(cd "$REA_ROOT" && git config user.name 2>/dev/null || echo "")
    fi
    if [[ -z "$SKIP_ACTOR" ]]; then
      {
        printf 'PUSH BLOCKED: escape hatch requires a git identity.\n'
        printf '\n'
        # shellcheck disable=SC2016  # backticks are literal markdown in user-facing message
        printf '  Neither `git config user.email` nor `git config user.name`\n'
        printf '  is set. The skip audit record would have no actor; refusing\n'
        printf '  to bypass without one.\n'
        printf '\n'
      } >&2
      exit 2
    fi

    # Metadata source of truth: the pre-push stdin contract. Parse the FIRST
    # well-formed refspec line from the captured INPUT so the skip audit
    # record describes the actual push, not the checkout that happened to be
    # active.
    local SKIP_HEAD="" SKIP_TARGET="" SKIP_SOURCE=""
    local SKIP_UPSTREAM

    local __line __lref __lsha __rref __rsha __rest
    while IFS= read -r __line; do
      # shellcheck disable=SC2034  # field-splitting into named vars is the intent
      read -r __lref __lsha __rref __rsha __rest <<< "$__line"
      if [[ -z "$__rest" && "$__lsha" =~ ^[0-9a-f]{40}$ && -n "$__rref" ]]; then
        SKIP_HEAD="$__lsha"
        SKIP_TARGET="${__rref#refs/heads/}"
        SKIP_SOURCE="prepush-stdin"
        break
      fi
    done <<< "$INPUT"

    if [[ -z "$SKIP_HEAD" ]]; then
      SKIP_HEAD=$(cd "$REA_ROOT" && git rev-parse HEAD 2>/dev/null || echo "")
      SKIP_UPSTREAM=$(cd "$REA_ROOT" && git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || echo "")
      SKIP_TARGET="main"
      if [[ -n "$SKIP_UPSTREAM" && "$SKIP_UPSTREAM" == */* ]]; then
        SKIP_TARGET="${SKIP_UPSTREAM#*/}"
      fi
      SKIP_SOURCE="local-fallback"
    fi

    local SKIP_METADATA
    SKIP_METADATA=$(jq -n \
      --arg head_sha "$SKIP_HEAD" \
      --arg target "$SKIP_TARGET" \
      --arg reason "$SKIP_REASON" \
      --arg actor "$SKIP_ACTOR" \
      --arg source "$SKIP_SOURCE" \
      '{
        head_sha: $head_sha,
        target: $target,
        reason: $reason,
        actor: $actor,
        verdict: "skipped",
        files_changed: null,
        metadata_source: $source
      }' 2>/dev/null)

    if [[ -z "$SKIP_METADATA" ]]; then
      {
        printf 'PUSH BLOCKED: escape hatch could not serialize audit metadata.\n' >&2
      } >&2
      exit 2
    fi

    REA_ROOT="$REA_ROOT" REA_SKIP_METADATA="$SKIP_METADATA" \
      node --input-type=module -e "
        const mod = await import(process.env.REA_ROOT + '/dist/audit/append.js');
        const metadata = JSON.parse(process.env.REA_SKIP_METADATA);
        await mod.appendAuditRecord(process.env.REA_ROOT, {
          tool_name: 'codex.review.skipped',
          server_name: 'rea.escape_hatch',
          status: mod.InvocationStatus.Allowed,
          tier: mod.Tier.Read,
          metadata,
        });
      " 2>/dev/null
    local NODE_STATUS=$?
    if [[ "$NODE_STATUS" -ne 0 ]]; then
      {
        printf 'PUSH BLOCKED: escape hatch audit-append failed (node exit %s).\n' "$NODE_STATUS"
        printf '  Refusing to bypass the Codex-review gate without a receipt.\n'
      } >&2
      exit 2
    fi

    {
      printf '\n'
      printf '==  CODEX REVIEW WAIVER active (REA_SKIP_CODEX_REVIEW)\n'
      printf '    Reason:   %s\n' "$SKIP_REASON"
      printf '    Actor:    %s\n' "$SKIP_ACTOR"
      printf '    Head SHA: %s\n' "${SKIP_HEAD:-<unknown>}"
      printf '    Audited:  .rea/audit.jsonl (tool_name=codex.review.skipped)\n'
      printf '\n'
      printf '    Scope:    waives the protected-path Codex-audit requirement only.\n'
      printf '    Still active: HALT, cross-repo guard, ref-resolution,\n'
      printf '                  push-review cache. For a full-gate bypass\n'
      # shellcheck disable=SC2016  # backticks are literal markdown in user-facing message
      printf '                  use `REA_SKIP_PUSH_REVIEW=<reason>`.\n'
      printf '\n'
      printf '    This is a gate weakening. The waiver receipt is written BEFORE\n'
      printf '    this banner — seeing this banner means the audit is durable.\n'
      printf '\n'
    } >&2
    CODEX_WAIVER_ACTIVE=1
  fi

  # ── 6. Determine source/target commits for each refspec ───────────────────
  # The authoritative source for which commits are being pushed is the pre-
  # push hook stdin contract: one line per refspec, with fields
  #     <local_ref> <local_sha> <remote_ref> <remote_sha>
  # (https://git-scm.com/docs/githooks#_pre_push). We drive the gate off
  # those SHAs directly — NOT off HEAD — so that `git push origin hotfix:main`
  # from a checked-out `foo` branch reviews the `hotfix` commits, not `foo`.
  #
  # If what we read on stdin does not look like pre-push refspec lines, we
  # treat it as "no stdin" and use the argv fallback.
  local ZERO_SHA='0000000000000000000000000000000000000000'
  local CURRENT_BRANCH
  CURRENT_BRANCH=$(cd "$REA_ROOT" && git branch --show-current 2>/dev/null || echo "")

  # Collect refspec records. Stdin takes priority; fall back to argv parsing.
  local -a REFSPEC_RECORDS
  REFSPEC_RECORDS=()
  local RECORDS_OUT _rec
  if RECORDS_OUT=$(pr_parse_prepush_stdin "$INPUT") && [[ -n "$RECORDS_OUT" ]]; then
    :
  else
    RECORDS_OUT=$(pr_resolve_argv_refspecs "$CMD")
  fi
  while IFS= read -r _rec; do
    [[ -z "$_rec" ]] && continue
    REFSPEC_RECORDS+=("$_rec")
  done <<<"$RECORDS_OUT"

  if [[ "${#REFSPEC_RECORDS[@]}" -eq 0 ]]; then
    {
      printf 'PUSH BLOCKED: no push refspecs could be resolved.\n'
      printf '  Refusing to pass without a source commit to review.\n'
    } >&2
    exit 2
  fi

  # ── 7. Pick the source commit and merge-base to review ────────────────────
  # Across all refspecs, we pick the one whose source commit is furthest from
  # its merge-base (i.e. the largest diff). That way a mixed push like
  # `foo:main bar:dev` is gated on whichever refspec actually contributes new
  # commits. A deletion refspec (local_sha all zeros) is still concerning —
  # we check the remote side for protected-path changes against the merge-
  # base of the remote sha and the default branch, but the diff body comes
  # from the non-delete refspec if present. If every refspec is a delete, we
  # fail-closed and require an explicit review.
  local SOURCE_SHA="" MERGE_BASE="" TARGET_BRANCH="" SOURCE_REF=""
  local HAS_DELETE=0 BEST_COUNT=0
  local rec local_sha remote_sha local_ref remote_ref target mb mb_status count count_status
  for rec in "${REFSPEC_RECORDS[@]}"; do
    IFS='|' read -r local_sha remote_sha local_ref remote_ref <<<"$rec"
    target="${remote_ref#refs/heads/}"
    target="${target#refs/for/}"
    [[ -z "$target" ]] && target="main"

    if [[ "$local_sha" == "$ZERO_SHA" ]]; then
      HAS_DELETE=1
      continue
    fi

    if [[ "$remote_sha" != "$ZERO_SHA" ]]; then
      if ! (cd "$REA_ROOT" && git cat-file -e "${remote_sha}^{commit}" 2>/dev/null); then
        {
          printf 'PUSH BLOCKED: remote object %s is not in the local object DB.\n' "$remote_sha"
          printf '\n'
          printf '  The gate cannot compute a review diff without it. Fetch the\n'
          printf '  remote and retry:\n'
          printf '\n'
          printf '    git fetch origin\n'
          printf '    # then retry the push\n'
          printf '\n'
        } >&2
        exit 2
      fi
      mb=$(cd "$REA_ROOT" && git merge-base "$remote_sha" "$local_sha" 2>/dev/null)
      mb_status=$?
      if [[ "$mb_status" -ne 0 || -z "$mb" ]]; then
        {
          printf 'PUSH BLOCKED: no merge-base between remote %s and local %s\n' \
            "${remote_sha:0:12}" "${local_sha:0:12}"
          printf '  The two histories are unrelated; refusing to pass without a\n'
          printf '  reviewable diff.\n'
        } >&2
        exit 2
      fi
    else
      # New branch (remote_sha == ZERO). `target` is the REMOTE ref name (the
      # branch being created on origin), not a sensible merge-base anchor:
      # if the local repo already has a branch by that name pointing at
      # `local_sha`, `git merge-base <target> <local_sha>` returns `local_sha`
      # — collapsing the reviewable diff to empty and silently bypassing the
      # gate.
      #
      # We MUST anchor on a REMOTE-TRACKING ref (e.g. refs/remotes/origin/main),
      # not the bare branch name. Bare `main` resolves to the local short ref
      # `refs/heads/main`, which the pusher controls — a local `main` that has
      # been fast-forwarded to contain the feature tip (or a rebased topic
      # branch) would give `merge-base main <local_sha> == local_sha`, silently
      # passing the gate. Remote-tracking refs are server-authoritative from
      # the most recent fetch, so they cannot be tampered with locally.
      #
      # argv_remote is set from the adapter's argv (git passes the remote name
      # as $1 on pre-push); defaults to "origin" when absent (BUG-008 sniff).
      local default_ref default_ref_status
      default_ref=$(cd "$REA_ROOT" && git symbolic-ref "refs/remotes/${argv_remote}/HEAD" 2>/dev/null)
      default_ref_status=$?
      if [[ "$default_ref_status" -ne 0 || -z "$default_ref" ]]; then
        # symbolic-ref failed (common on shallow or mirror clones where
        # origin/HEAD was never set). Probe the common default-branch names in
        # order: main, then master. Both are remote-tracking refs and still
        # server-authoritative; the order matters only for projects that still
        # default to `master` (older internal forks), where without this
        # fallback the first push of a new branch would fail closed.
        if cd "$REA_ROOT" && git rev-parse --verify --quiet "refs/remotes/${argv_remote}/main" >/dev/null 2>&1; then
          default_ref="refs/remotes/${argv_remote}/main"
        elif cd "$REA_ROOT" && git rev-parse --verify --quiet "refs/remotes/${argv_remote}/master" >/dev/null 2>&1; then
          default_ref="refs/remotes/${argv_remote}/master"
        else
          default_ref=""
        fi
      fi
      if [[ -n "$default_ref" ]]; then
        mb=$(cd "$REA_ROOT" && git merge-base "$default_ref" "$local_sha" 2>/dev/null || echo "")
        if [[ -z "$mb" ]]; then
          # default_ref resolved but merge-base came back empty (unrelated
          # histories, grafted branch, or transient git failure). Mirror the
          # `.husky/pre-push` fix in 701b631 by falling through to the
          # empty-tree baseline rather than silently `continue`-ing (the
          # pre-pass-4 behavior). `continue` here combined with the
          # longest-diff selection below let a protected-path refspec with
          # an empty merge-base silently bypass the gate whenever another
          # refspec in the same push was selected as BEST. Flagged HIGH by
          # Codex pass-4 finding #1.
          mb='4b825dc642cb6eb9a060e54bf8d69288fbee4904'
        fi
      else
        # Bootstrap: no remote-tracking ref resolved. Use the well-known
        # empty-tree SHA as the merge-base baseline so the per-refspec diff
        # covers the full push content and the per-refspec protected-path
        # check below still runs. Prior behavior silently `continue`d here,
        # which — combined with the longest-diff selection accumulator at
        # :822-828 — let a bootstrap protected-path refspec bypass the gate
        # whenever a second, well-anchored refspec in the same push was
        # selected as BEST instead. Flagged HIGH by Codex pass-3 and fixed
        # for the `.husky/pre-push` side in 701b631. `git diff` accepts a
        # tree SHA as LHS, so :861 `git diff "${MERGE_BASE}..${SOURCE_SHA}"`
        # (two-dot is required — three-dot would compute an implicit
        # merge-base with the tree on LHS and fail) works transparently
        # with this baseline.
        mb='4b825dc642cb6eb9a060e54bf8d69288fbee4904'
      fi
    fi
    if [[ -z "$mb" ]]; then
      continue
    fi

    # Per-refspec protected-path check (Codex pass-4 finding #2). The
    # BEST_COUNT accumulator below selects a single winning refspec for
    # the general push-review gate, but the protected-path Codex audit
    # requirement must run on EVERY refspec — otherwise a multi-refspec
    # push like `git push origin big-feature:big-feature hotfix:main` can
    # hide a small protected-path refspec behind a larger, non-protected
    # one (husky's per-refspec loop at .husky/pre-push:89-175 blocks this
    # case; pre-pass-4 shared core did not).
    if [[ "$CODEX_REQUIRED" == "true" ]]; then
      local _refspec_hits _refspec_diff_status
      _refspec_hits=$(cd "$REA_ROOT" && git diff --name-status "${mb}..${local_sha}" 2>/dev/null)
      _refspec_diff_status=$?
      if [[ "$_refspec_diff_status" -ne 0 ]]; then
        {
          printf 'PUSH BLOCKED: git diff --name-status %s..%s failed (exit %s)\n' \
            "${mb:0:12}" "${local_sha:0:12}" "$_refspec_diff_status"
          printf '  Refspec: %s\n' "${local_ref:-<unknown>}"
          printf '  Cannot determine whether protected paths changed; refusing to pass.\n'
        } >&2
        exit 2
      fi
      if printf '%s\n' "$_refspec_hits" | awk -v re='^(src/gateway/middleware/|hooks/|[.]claude/hooks/|src/policy/|[.]github/workflows/)' '
          {
            status = $1
            if (status !~ /^[ACDMRTU]/) next
            for (i = 2; i <= NF; i++) {
              if ($i ~ re) { found = 1; next }
            }
          }
          END { exit found ? 0 : 1 }
        '; then
        local _audit="${REA_ROOT}/.rea/audit.jsonl"
        local _codex_ok=0
        # 0.8.0 (#85): Codex-only waiver satisfies this check without a real
        # audit entry. Every other gate still ran — HALT, cross-repo guard,
        # ref-resolution, push-review cache — and the waiver itself is
        # already recorded in .rea/audit.jsonl as tool_name=codex.review.skipped.
        if [[ "$CODEX_WAIVER_ACTIVE" == "1" ]]; then
          _codex_ok=1
        elif [[ -f "$_audit" ]]; then
          if jq -e --arg sha "$local_sha" '
              select(
                .tool_name == "codex.review"
                and .metadata.head_sha == $sha
                and (.metadata.verdict == "pass" or .metadata.verdict == "concerns")
              )
            ' "$_audit" >/dev/null 2>&1; then
            _codex_ok=1
          fi
        fi
        if [[ "$_codex_ok" -eq 0 ]]; then
          {
            printf 'PUSH BLOCKED: protected paths changed — /codex-review required for %s\n' "$local_sha"
            printf '\n'
            printf '  Source ref: %s\n' "${local_ref:-<unknown>}"
            printf '  Diff touches one of:\n'
            printf '    - src/gateway/middleware/\n'
            printf '    - hooks/\n'
            printf '    - .claude/hooks/\n'
            printf '    - src/policy/\n'
            printf '    - .github/workflows/\n'
            printf '\n'
            printf '  Run /codex-review against %s, then retry the push.\n' "$local_sha"
            printf '  The codex-adversarial agent emits the required audit entry.\n'
            # shellcheck disable=SC2016  # backticks are literal markdown in user-facing message
            printf '  Only `pass` or `concerns` verdicts satisfy this gate.\n'
            printf '\n'
          } >&2
          exit 2
        fi
      fi
    fi

    count=$(cd "$REA_ROOT" && git rev-list --count "${mb}..${local_sha}" 2>/dev/null)
    count_status=$?
    if [[ "$count_status" -ne 0 ]]; then
      {
        printf 'PUSH BLOCKED: git rev-list --count %s..%s failed (exit %s)\n' \
          "${mb:0:12}" "${local_sha:0:12}" "$count_status"
        printf '  Cannot size the diff; refusing to pass.\n'
      } >&2
      exit 2
    fi
    if [[ -z "$count" ]]; then
      count=0
    fi
    if [[ -z "$SOURCE_SHA" ]] || [[ "$count" -gt "$BEST_COUNT" ]]; then
      SOURCE_SHA="$local_sha"
      MERGE_BASE="$mb"
      TARGET_BRANCH="$target"
      SOURCE_REF="$local_ref"
      BEST_COUNT="$count"
    fi
  done

  if [[ -z "$SOURCE_SHA" || -z "$MERGE_BASE" ]]; then
    if [[ "$HAS_DELETE" -eq 1 ]]; then
      {
        printf 'PUSH BLOCKED: refspec is a branch deletion.\n'
        printf '\n'
        printf '  Branch deletions are sensitive operations and require explicit\n'
        printf '  human action outside the agent. Perform the deletion manually.\n'
        printf '\n'
      } >&2
      exit 2
    fi
    {
      printf 'PUSH BLOCKED: could not resolve a merge-base for any push refspec.\n'
      printf '\n'
      printf '  Fetch the remote and retry, or name an explicit destination.\n'
      printf '\n'
    } >&2
    exit 2
  fi

  # Capture git diff exit status explicitly.
  #
  # Use two-dot (`A..B`) rather than three-dot (`A...B`). Three-dot form
  # computes an implicit merge-base between A and B, which FAILS when A
  # is a tree (e.g. the empty-tree baseline used on bootstrap refspecs
  # — see pr_parse_prepush_stdin's new-branch block). Two-dot accepts
  # any revision on the left and is equivalent to `A...B` here because
  # MERGE_BASE is ALREADY the merge-base of the two commit cases, so the
  # implicit merge-base in three-dot would be redundant.
  local DIFF_FULL DIFF_STATUS
  DIFF_FULL=$(cd "$REA_ROOT" && git diff "${MERGE_BASE}..${SOURCE_SHA}" 2>/dev/null)
  DIFF_STATUS=$?
  if [[ "$DIFF_STATUS" -ne 0 ]]; then
    {
      printf 'PUSH BLOCKED: git diff %s..%s failed (exit %s)\n' \
        "${MERGE_BASE:0:12}" "${SOURCE_SHA:0:12}" "$DIFF_STATUS"
      printf '  Cannot compute reviewable diff; refusing to pass.\n'
    } >&2
    exit 2
  fi

  if [[ -z "$DIFF_FULL" ]]; then
    exit 0
  fi

  local LINE_COUNT
  LINE_COUNT=$(printf '%s' "$DIFF_FULL" | grep -cE '^\+[^+]|^-[^-]' 2>/dev/null || echo "0")

  # ── 7a. Protected-path Codex adversarial review gate ──────────────────────
  # The per-refspec check runs inside the main loop (section 7, above) so
  # that a multi-refspec push cannot hide a protected-path refspec behind
  # a larger, non-protected one. See Codex pass-4 finding #2. If any
  # protected-path refspec lacked a valid Codex audit, the loop already
  # exited with code 2; reaching this point means every protected-path
  # refspec was either clean or had an acceptable audit.

  # ── 8. Check review cache ─────────────────────────────────────────────────
  local PUSH_SHA
  PUSH_SHA=$(printf '%s' "$DIFF_FULL" | shasum -a 256 | cut -d' ' -f1 2>/dev/null || echo "")

  local -a REA_CLI_ARGS
  REA_CLI_ARGS=()
  # node_modules/.bin/rea is a launcher (pnpm writes a POSIX shell shim, npm
  # writes a symlink to dist/cli/index.js with its own `#!/usr/bin/env node`
  # shebang). Either way it is NOT a plain JS file, so running `node` on it
  # would parse shell syntax as JavaScript and SyntaxError. Execute the shim
  # directly — it handles `exec node` itself — and only prepend `node` on the
  # dist fallback, which is a real JS module. The `-x` guard picks up both
  # pnpm shims (executable regular file) and npm symlinks (executable target).
  if [[ -x "${REA_ROOT}/node_modules/.bin/rea" ]]; then
    REA_CLI_ARGS=("${REA_ROOT}/node_modules/.bin/rea")
  elif [[ -f "${REA_ROOT}/dist/cli/index.js" ]]; then
    REA_CLI_ARGS=(node "${REA_ROOT}/dist/cli/index.js")
  fi

  # Cache-branch derivation (Codex 0.8.0 pass-2 finding #2, pass-3 finding #1):
  # Use the PUSHED source ref (from pre-push stdin / bootstrap walk), not the
  # checkout branch. `git push origin hotfix:main` from a `feature` checkout
  # must look up a cache entry keyed on `hotfix`, not `feature`. Strip the
  # `refs/heads/` prefix.
  #
  # Fall back to the checkout branch when SOURCE_REF is:
  #   • unset (defence-in-depth, not reached on any observed path), or
  #   • the literal string "HEAD" — emitted by pr_resolve_argv_refspecs for a
  #     bare `git push` with no explicit refspec. Keying a cache lookup on
  #     "HEAD" would force a miss on every bare push; the checkout branch
  #     name is the right lookup key for that workflow.
  local SOURCE_BRANCH="${SOURCE_REF#refs/heads/}"
  if [[ -z "$SOURCE_BRANCH" || "$SOURCE_BRANCH" == "HEAD" ]]; then
    SOURCE_BRANCH="$CURRENT_BRANCH"
  fi

  if [[ -n "$PUSH_SHA" ]] && [[ ${#REA_CLI_ARGS[@]} -gt 0 ]]; then
    local CACHE_RESULT
    CACHE_RESULT=$("${REA_CLI_ARGS[@]}" cache check "$PUSH_SHA" --branch "$SOURCE_BRANCH" --base "$TARGET_BRANCH" 2>/dev/null || echo '{"hit":false}')
    # Require BOTH hit == true AND result == "pass". A cached `fail` verdict
    # (Codex 0.8.0 pass-2 finding #1) must NOT satisfy the gate — cache.ts
    # serializes `result` verbatim, so a negative verdict would otherwise
    # slip through. Under the #85 narrowed semantic the cache is the ONLY
    # way a waiver-using operator reaches exit 0, so a permissive predicate
    # here would be a real security regression.
    if printf '%s' "$CACHE_RESULT" | jq -e '.hit == true and .result == "pass"' >/dev/null 2>&1; then
      local DISCORD_LIB="${REA_ROOT}/hooks/_lib/discord.sh"
      if [ -f "$DISCORD_LIB" ]; then
        # shellcheck source=/dev/null
        source "$DISCORD_LIB"
        discord_notify "dev" "Push passed quality gates on \`${SOURCE_BRANCH}\` -- $(cd "$REA_ROOT" && git log -1 --oneline 2>/dev/null)" "green"
      fi
      exit 0
    fi
  fi

  # ── 9. Block and request review ───────────────────────────────────────────
  local FILE_COUNT
  FILE_COUNT=$(printf '%s' "$DIFF_FULL" | grep -c '^\+\+\+ ' 2>/dev/null || echo "0")

  {
    printf 'PUSH REVIEW GATE: Review required before pushing\n'
    printf '\n'
    printf '  Source ref: %s (%s)\n' "${SOURCE_REF:-HEAD}" "${SOURCE_SHA:0:12}"
    printf '  Target: %s\n' "$TARGET_BRANCH"
    printf '  Scope: %s files changed, %s lines\n' "$FILE_COUNT" "$LINE_COUNT"
    printf '\n'
    printf '  Action required:\n'
    printf '  1. Spawn a code-reviewer agent to review: git diff %s..%s\n' "$MERGE_BASE" "$SOURCE_SHA"
    printf '  2. Spawn a security-engineer agent for security review\n'
    printf '  3. After both pass, cache the result:\n'
    printf '     rea cache set %s pass --branch %s --base %s\n' "$PUSH_SHA" "$SOURCE_BRANCH" "$TARGET_BRANCH"
    printf '\n'
  } >&2
  exit 2
}
