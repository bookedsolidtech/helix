#!/bin/bash
# PreToolUse hook: settings-protection.sh
# Fires BEFORE every Write or Edit tool call.
# Blocks modifications to critical configuration files that, if tampered with,
# would disable the entire hook safety layer.
#
# Protected paths (security controls and hook infrastructure ONLY):
#   .claude/settings.json       — hook configuration
#   .claude/settings.local.json — local hook overrides
#   .claude/hooks/*             — hook scripts themselves
#   .husky/*                    — git hook scripts
#   .rea/policy.yaml        — autonomy/blocking policy
#   .rea/HALT               — kill switch file
#
# NOT protected (operational files agents may legitimately write):
#   .rea/review-cache.json  — cache file, writable by CLI and agents
#   .rea/tasks.jsonl        — task store, managed by task MCP tools
#
# Exit codes:
#   0 = allow (path not protected)
#   2 = block (protected path modification attempt)

set -uo pipefail

# ── 1. Read ALL stdin immediately ─────────────────────────────────────────────
INPUT=$(cat)

# ── 2. Dependency check ──────────────────────────────────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  printf 'REA ERROR: jq is required but not installed.\n' >&2
  printf 'Install: brew install jq  OR  apt-get install -y jq\n' >&2
  exit 2
fi

# ── 3. HALT check ────────────────────────────────────────────────────────────
# 0.16.0: HALT check sourced from shared _lib/halt-check.sh.
# shellcheck source=_lib/halt-check.sh
source "$(dirname "$0")/_lib/halt-check.sh"
check_halt
REA_ROOT=$(rea_root)

# ── 4. Extract file path from payload ─────────────────────────────────────────
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# ── 5. Normalize path for comparison ──────────────────────────────────────────
# Convert to relative path from project root for consistent matching
normalize_path() {
  local p="$1"
  local root="$REA_ROOT"

  # Strip project root prefix if present
  if [[ "$p" == "$root"/* ]]; then
    p="${p#$root/}"
  fi

  # URL decode common sequences. Include %5C (`\`) so Windows-style or
  # percent-encoded back-slash traversal (`..%5C`, `\..\`) normalizes to the
  # forward-slash form the §5a detector sees.
  p=$(printf '%s' "$p" \
    | sed 's/%2[Ff]/\//g; s/%2[Ee]/./g; s/%20/ /g; s/%5[Cc]/\\/g')

  # Translate any backslash separators to forward slashes. Keeps the traversal
  # check in §5a working for `.claude\hooks\..\settings.json`-style inputs.
  p=$(printf '%s' "$p" | tr '\\\\' '/')

  # Strip leading ./ components only. We intentionally do NOT strip interior
  # ./ sequences — that transformation corrupts `..` traversals (e.g. `.../`
  # collapsed to `../`, or `../` collapsed to `./`) and hides traversal from
  # the §5a detector.
  while [[ "$p" == ./* ]]; do
    p="${p#./}"
  done

  printf '%s' "$p"
}

# Strip C0/C1 control characters from a string to prevent terminal escape
# injection when we echo protected paths back to the operator. Escape sequences
# in file names could otherwise rewrite lines above the deny message.
#
# Byte ranges stripped:
#   \000-\037  — C0 controls (BEL, BS, HT, LF, CR, ESC, …)
#   \177       — DEL
#   \200-\237  — C1 controls (CSI 0x9B, OSC 0x9D, …). Many terminals still
#                interpret these as single-byte CSI introducers; without
#                stripping, a UTF-8 file name whose bytes fall in this range
#                could still drive the cursor on older emulators.
sanitize_for_stderr() {
  printf '%s' "$1" | LC_ALL=C tr -d '\000-\037\177\200-\237'
}

NORMALIZED=$(normalize_path "$FILE_PATH")
SAFE_FILE_PATH=$(sanitize_for_stderr "$FILE_PATH")
SAFE_NORMALIZED=$(sanitize_for_stderr "$NORMALIZED")

# ── 5a. Reject path traversal segments (Codex HIGH: Defect I bypass) ─────────
# A path containing `..` segments can be used to bypass the protected-path
# globs in §6 — e.g. `.claude/hooks/../settings.json` would pass the
# `.claude/hooks/*` case-glob in the patch-session allowlist but actually
# refers to `.claude/settings.json`. We refuse any path that contains a `..`
# segment in either the raw input OR the normalized form. The request must
# be reissued with a canonical path.
#
# For the raw-input check, translate backslashes first so a Windows-style
# `.claude\hooks\..\settings.json` is rejected at the raw stage too (the
# normalized form also catches it — this is defense in depth).
RAW_PATH_SLASHED=$(printf '%s' "$FILE_PATH" | tr '\\\\' '/')
raw_has_traversal=0
case "/$RAW_PATH_SLASHED/" in
  */../*) raw_has_traversal=1 ;;
esac
norm_has_traversal=0
case "/$NORMALIZED/" in
  */../*) norm_has_traversal=1 ;;
esac
if [[ "$raw_has_traversal" -eq 1 ]] || [[ "$norm_has_traversal" -eq 1 ]]; then
  {
    printf 'SETTINGS PROTECTION: path traversal rejected\n'
    printf '\n'
    printf '  File: %s\n' "$SAFE_FILE_PATH"
    printf "  Rule: path contains a '..' segment; rewrite to a canonical\n"
    printf '        project-relative path without traversal.\n'
  } >&2
  exit 2
fi

# Compute lower-cased path early so the §5b allow-list (and §6/§6b matchers
# below) all reference a single normalized variable.
LOWER_NORM=$(printf '%s' "$NORMALIZED" | tr '[:upper:]' '[:lower:]')

# ── 5b. Extension-surface allow-list ──────────────────────────────────────────
# `.husky/commit-msg.d/*` and `.husky/pre-push.d/*` are the documented
# consumer extension surface (Fix H / 0.13.0). Consumers — and the agents
# that govern those consumers — are expected to write here freely so they
# can layer commitlint, lint-staged, branch-policy, act-CI, etc. without
# losing rea coverage on `rea upgrade`.
#
# The §6 PROTECTED_PATTERNS list below has `.husky/` as a prefix block,
# which (correctly) keeps `.husky/pre-push`, `.husky/commit-msg`, and
# the `.husky/_/*` runtime stubs out of agent reach. But the same prefix
# also caught `.husky/pre-push.d/00-act-ci` and `.husky/commit-msg.d/*`
# until 0.13.2 — the very directories advertised as the extension
# surface. This early allow-list closes that contract gap.
#
# Anchored on the literal `.d/` segment (not `.d`) so `.husky/pre-push.d.bak/`
# or `.husky/pre-push.dump` still hit the prefix block. Nested fragments
# (e.g. `pre-push.d/sub/file`) are allowed so the surface composes naturally.
#
# SECURITY: runs AFTER §5a (path-traversal reject), so a clever
# `.husky/pre-push.d/../pre-push` cannot bypass §6's protection of the
# package-managed body — §5a kills it before this matcher runs.
#
# SECURITY (defense-in-depth): symlinks INSIDE the .d/ surface are
# refused — both final-component AND intermediate-directory symlinks.
# A fragment is a short shell script authored in place; consumers do
# not need symlinks here. Without these checks the gate has two
# bypass shapes:
#
#   (a) Final-component symlink:
#       ln -s ../pre-push .husky/pre-push.d/00-evil; write 00-evil
#       — caught by `[ -L "$FILE_PATH" ]`.
#
#   (b) Intermediate-directory symlink (helix Finding 2 / 0.15.0):
#       mkdir .husky/pre-push.d; ln -s ../ .husky/pre-push.d/linkdir
#       write .husky/pre-push.d/linkdir/pre-push
#       — `[ -L $FILE_PATH ]` only inspects the FINAL component, so a
#       not-yet-existing target whose parent contains a symlink resolves
#       to outside the surface (here: `.husky/pre-push`), letting the
#       attacker write through to the package-managed body.
#
# Resolve the realpath of the parent directory and require it to live
# under the literal extension surface. Use a portable `cd ... && pwd -P`
# subshell pattern (no Python or readlink -f dependency required).
# Closes the path-string→symlink bypass completely.
case "$LOWER_NORM" in
  .husky/commit-msg.d/*|.husky/pre-push.d/*)
    if [ -L "$FILE_PATH" ]; then
      {
        printf 'SETTINGS PROTECTION: symlink in extension surface refused\n'
        printf '\n'
        printf '  File: %s\n' "$SAFE_FILE_PATH"
        printf '  Rule: .husky/commit-msg.d/* and .husky/pre-push.d/* must be\n'
        printf '        regular files (a symlink could resolve to a protected\n'
        printf '        package-managed body and bypass §6 protection).\n'
      } >&2
      exit 2
    fi
    # Resolve the parent directory's realpath. If any intermediate
    # component is a symlink whose target leaves the surface, the
    # resolved path no longer contains `/.husky/<surface>.d/` and we
    # refuse. The parent dir must already exist for this check; if it
    # doesn't, the write is creating the parent, in which case there
    # is no intermediate symlink to follow yet.
    parent_dir=$(dirname -- "$FILE_PATH")
    if [ -d "$parent_dir" ]; then
      resolved_parent=$(cd -P -- "$parent_dir" 2>/dev/null && pwd -P 2>/dev/null) || resolved_parent=""
      if [ -n "$resolved_parent" ]; then
        # 0.20.1 helix-021 #3: directory-boundary on the case glob.
        # Pre-fix `*"/.husky/commit-msg.d"*` matched `.husky/commit-msg.d.bak/`
        # too (substring without trailing-slash anchor). A symlink
        # `.husky/pre-push.d/linkdir -> ../pre-push.d.bak` then resolved
        # to `.husky/pre-push.d.bak/...` and slipped through.
        # The trailing `/` on each pattern (and the explicit
        # exact-match arm) requires a real directory boundary.
        case "$resolved_parent" in
          */.husky/commit-msg.d|*/.husky/commit-msg.d/*|*/.husky/pre-push.d|*/.husky/pre-push.d/*) : ;;
          *)
            {
              printf 'SETTINGS PROTECTION: extension path resolves outside surface\n'
              printf '\n'
              printf '  Logical:  %s\n' "$SAFE_FILE_PATH"
              printf '  Resolved: %s\n' "$resolved_parent"
              printf '  Rule: an intermediate directory of the extension path is a\n'
              printf '        symlink whose target leaves .husky/{commit-msg,pre-push}.d/.\n'
              printf '        Refused to prevent symlinked-parent bypass of the\n'
              printf '        package-managed body protection.\n'
            } >&2
            exit 2
          ;;
        esac
      fi
    fi
    # Documented extension surface — agents can write here freely.
    exit 0
    ;;
esac

# ── 6. Protected path patterns ────────────────────────────────────────────────
# §6 runs BEFORE the patch-session allowlist so hook-patch sessions cannot
# reach .rea/policy.yaml, .rea/HALT, or .claude/settings.json via any glob
# creativity.
#
# 0.16.3 F7: list is sourced from `_lib/protected-paths.sh`, which honors
# the `protected_paths_relax` policy key (kill-switch invariants always
# stay protected — see the lib for the always-protected subset).
# shellcheck source=_lib/protected-paths.sh
source "$(dirname "$0")/_lib/protected-paths.sh"
# Trigger lazy load now so PROTECTED_PATTERNS reflects the relaxed list
# from the start of this hook process.
rea_path_is_protected "/__rea_force_load__" >/dev/null 2>&1 || true
PROTECTED_PATTERNS=("${REA_PROTECTED_PATTERNS[@]}")

# Patterns that are protected from general agent edits but can be unlocked by
# REA_HOOK_PATCH_SESSION. Kept separate from the hard-protected list above so
# the patch-session gate in §6b only applies to these directories.
PATCH_SESSION_PATTERNS=(
  '.claude/hooks/'
)

# LOWER_NORM was computed in §5b above and is reused here.

# Match $NORMALIZED against PROTECTED_PATTERNS (exact or prefix for patterns
# ending in '/'). Sets $PROTECTED_MATCH to the matched pattern; exit 0 on hit.
match_protected() {
  local pattern
  PROTECTED_MATCH=""
  for pattern in "${PROTECTED_PATTERNS[@]}"; do
    if [[ "$NORMALIZED" == "$pattern" ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
    if [[ "$pattern" == */ ]] && [[ "$NORMALIZED" == "$pattern"* ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
  done
  return 1
}

match_protected_ci() {
  local pattern lp
  PROTECTED_MATCH=""
  for pattern in "${PROTECTED_PATTERNS[@]}"; do
    lp=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
    if [[ "$LOWER_NORM" == "$lp" ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
    if [[ "$lp" == */ ]] && [[ "$LOWER_NORM" == "$lp"* ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
  done
  return 1
}

match_patch_session() {
  local pattern
  PROTECTED_MATCH=""
  for pattern in "${PATCH_SESSION_PATTERNS[@]}"; do
    if [[ "$NORMALIZED" == "$pattern" ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
    if [[ "$pattern" == */ ]] && [[ "$NORMALIZED" == "$pattern"* ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
  done
  return 1
}

match_patch_session_ci() {
  local pattern lp
  PROTECTED_MATCH=""
  for pattern in "${PATCH_SESSION_PATTERNS[@]}"; do
    lp=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
    if [[ "$LOWER_NORM" == "$lp" ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
    if [[ "$lp" == */ ]] && [[ "$LOWER_NORM" == "$lp"* ]]; then
      PROTECTED_MATCH="$pattern"
      return 0
    fi
  done
  return 1
}

if match_protected; then
  {
    printf 'SETTINGS PROTECTION: Modification blocked\n'
    printf '\n'
    printf '  File: %s\n' "$SAFE_FILE_PATH"
    printf '  Matched: %s\n' "$PROTECTED_MATCH"
    printf '  Rule: This file is protected from agent modification, including\n'
    printf '        sessions with REA_HOOK_PATCH_SESSION set.\n'
  } >&2
  exit 2
fi

if match_protected_ci; then
  {
    printf 'SETTINGS PROTECTION: Modification blocked (case-insensitive match)\n'
    printf '\n'
    printf '  File: %s\n' "$SAFE_FILE_PATH"
    printf '  Matched: %s\n' "$PROTECTED_MATCH"
  } >&2
  exit 2
fi

# ── 6c. Intermediate-symlink resolution (0.16.0 fix H.1) ──────────────────────
# Helix Finding 2 reborn against the hard-protected list. The §5b
# extension-surface fix (0.13.2) resolved parent realpath for the
# `.husky/{commit-msg,pre-push}.d/*` allowlist; §6 was never given the
# same protection. Attack:
#
#   mkdir innocuous_path
#   ln -s ../.husky innocuous_path/maybe   # symlink resolves to .husky/
#   write innocuous_path/maybe/pre-push    # writes through to .husky/pre-push
#
# §5a (`..` traversal) doesn't catch — the path string has no `..`.
# §6 PROTECTED_PATTERNS sees `innocuous_path/maybe/pre-push` — doesn't
# match `.husky/` prefix. The write succeeds and the package-managed
# pre-push body is overwritten.
#
# Fix: when the parent directory of the target exists, resolve its
# realpath via cd -P && pwd -P (same shape as §5b) and check whether
# the resolved path falls inside any protected directory. Only resolve
# when the parent already exists — a write that creates the parent has
# nothing to follow.
if [[ -e "$FILE_PATH" || -d "$(dirname -- "$FILE_PATH")" ]]; then
  parent_dir=$(dirname -- "$FILE_PATH")
  if [[ -d "$parent_dir" ]]; then
    resolved_parent=$(cd -P -- "$parent_dir" 2>/dev/null && pwd -P 2>/dev/null) || resolved_parent=""
    if [[ -n "$resolved_parent" ]]; then
      # If the resolved parent is inside REA_ROOT, compute the project-
      # relative path and test it against the protected patterns.
      if [[ "$resolved_parent" == "$REA_ROOT"/* ]]; then
        relative_resolved="${resolved_parent#"$REA_ROOT"/}"
        # Walk every PROTECTED_PATTERN that's a directory prefix and
        # check whether the resolved parent falls inside it. Direct
        # filename matches against PROTECTED_PATTERNS for the resolved
        # final path (parent + basename).
        resolved_target="${relative_resolved}/$(basename -- "$FILE_PATH")"
        resolved_target_lc=$(printf '%s' "$resolved_target" | tr '[:upper:]' '[:lower:]')
        for pattern in "${PROTECTED_PATTERNS[@]}"; do
          pattern_lc=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
          if [[ "$resolved_target_lc" == "$pattern_lc" ]] || \
             { [[ "$pattern_lc" == */ ]] && [[ "$resolved_target_lc" == "$pattern_lc"* ]]; }; then
            {
              printf 'SETTINGS PROTECTION: intermediate-symlink resolution blocked\n'
              printf '\n'
              printf '  Logical:  %s\n' "$SAFE_FILE_PATH"
              printf '  Resolved: %s\n' "$resolved_target"
              printf '  Matched:  %s\n' "$pattern"
              printf '  Rule: an intermediate directory of the target path is a\n'
              printf '        symlink whose target falls inside a hard-protected\n'
              printf '        path. Refused to prevent symlinked-parent bypass.\n'
            } >&2
            exit 2
          fi
        done
      fi
    fi
  fi
fi

# ── 6b. Hook-patch session (Defect I / rea#76) ───────────────────────────────
# When REA_HOOK_PATCH_SESSION is set to a non-empty reason, allow edits under
# .claude/hooks/ and hooks/ for this session. The session boundary IS the
# expiry — a new shell requires a fresh opt-in. Every allowed edit is audited
# as hooks.patch.session so the bypass is never silent.
#
# SECURITY: runs AFTER §5a (traversal reject) and §6 (hard-protected denies),
# so no glob creativity can reach policy/HALT/settings files from here.
if [[ -n "${REA_HOOK_PATCH_SESSION:-}" ]]; then
  if match_patch_session; then
    SAFE_REASON=$(sanitize_for_stderr "${REA_HOOK_PATCH_SESSION}")
    # Audit record via the TypeScript chain so the hash chain stays intact.
    # If the append fails, block the edit — silent failure would let an
    # attacker disable audit logging and then patch hooks unobserved.
    SHA_BEFORE=""
    if [[ -f "$FILE_PATH" ]]; then
      if command -v sha256sum >/dev/null 2>&1; then
        SHA_BEFORE=$(sha256sum "$FILE_PATH" 2>/dev/null | awk '{print $1}')
      elif command -v shasum >/dev/null 2>&1; then
        SHA_BEFORE=$(shasum -a 256 "$FILE_PATH" 2>/dev/null | awk '{print $1}')
      elif command -v openssl >/dev/null 2>&1; then
        SHA_BEFORE=$(openssl dgst -sha256 "$FILE_PATH" 2>/dev/null | awk '{print $NF}')
      fi
    fi
    ACTOR_NAME=$(git -C "$REA_ROOT" config user.name 2>/dev/null || printf 'unknown')
    ACTOR_EMAIL=$(git -C "$REA_ROOT" config user.email 2>/dev/null || printf 'unknown')

    AUDIT_PAYLOAD=$(
      cd "$REA_ROOT" 2>/dev/null || true
      REA_AUDIT_REASON="${REA_HOOK_PATCH_SESSION}" \
      REA_AUDIT_FILE="$NORMALIZED" \
      REA_AUDIT_SHA="$SHA_BEFORE" \
      REA_AUDIT_ACTOR_NAME="$ACTOR_NAME" \
      REA_AUDIT_ACTOR_EMAIL="$ACTOR_EMAIL" \
      REA_AUDIT_PID="$$" \
      REA_AUDIT_PPID="$PPID" \
      REA_AUDIT_SESSION="${CLAUDE_SESSION_ID:-external}" \
      REA_AUDIT_ROOT="$REA_ROOT" \
      node --input-type=module -e '
        const root = process.env.REA_AUDIT_ROOT;
        async function loadMod() {
          // Consumer path: `@bookedsolid/rea` resolvable via node_modules
          // (how `rea init`-installed consumers reach the published package)
          // or via package self-reference when the hook runs inside the rea
          // source repo itself.
          try {
            return await import("@bookedsolid/rea/audit");
          } catch (e1) {
            // Dev path: direct file import from the source repos dist/.
            try {
              return await import(root + "/dist/audit/append.js");
            } catch (e2) {
              process.stderr.write(
                "audit import failed: package=" + (e1 && e1.message ? e1.message : e1) +
                "; dist=" + (e2 && e2.message ? e2.message : e2) + "\n");
              process.exit(1);
            }
          }
        }
        (async () => {
          const mod = await loadMod();
          try {
            await mod.appendAuditRecord(root, {
              session_id: process.env.REA_AUDIT_SESSION,
              tool_name: "hooks.patch.session",
              server_name: "rea",
              tier: "write",
              status: "allowed",
              autonomy_level: "unknown",
              duration_ms: 0,
              metadata: {
                reason: process.env.REA_AUDIT_REASON,
                file: process.env.REA_AUDIT_FILE,
                sha_before: process.env.REA_AUDIT_SHA,
                actor: {
                  name: process.env.REA_AUDIT_ACTOR_NAME,
                  email: process.env.REA_AUDIT_ACTOR_EMAIL,
                },
                pid: Number(process.env.REA_AUDIT_PID),
                ppid: Number(process.env.REA_AUDIT_PPID),
              },
            });
            process.exit(0);
          } catch (e) {
            process.stderr.write("audit append failed: " + (e && e.message ? e.message : e) + "\n");
            process.exit(1);
          }
        })();
      ' 2>&1
    )
    AUDIT_EXIT=$?
    if [[ "$AUDIT_EXIT" -ne 0 ]]; then
      # Fail closed. We deliberately do NOT fall back to a raw `jq … >> audit`
      # write: that path skips prev_hash/hash computation and would silently
      # degrade the hash-chain integrity the rest of REA (and `rea audit verify`)
      # relies on. If the TypeScript chain is unavailable (no `dist/`, missing
      # Node, broken import), refuse the hook-patch edit and surface why. The
      # operator resolves by building the package (`pnpm build`) or running
      # against a published install that ships `dist/`.
      {
        printf 'SETTINGS PROTECTION: audit-append failed; refusing hook-patch edit\n'
        printf '  File: %s\n' "$SAFE_FILE_PATH"
        printf '  Rule: hash-chained audit is required; no raw-jq fallback.\n'
        printf '  Detail: %s\n' "$(sanitize_for_stderr "$AUDIT_PAYLOAD")"
      } >&2
      exit 2
    fi
    printf 'REA_HOOK_PATCH_SESSION: allowing edit to %s (reason: %s)\n' \
      "$SAFE_NORMALIZED" "$SAFE_REASON" >&2
    exit 0
  fi
fi

# ── 6c. Patch-session patterns are still blocked when env var is NOT set ─────
if match_patch_session; then
  {
    printf 'SETTINGS PROTECTION: Modification blocked\n'
    printf '\n'
    printf '  File: %s\n' "$SAFE_FILE_PATH"
    printf '  Matched: %s\n' "$PROTECTED_MATCH"
    printf '  Rule: Files under this path are protected. To apply an upstream\n'
    printf '        hook finding, set REA_HOOK_PATCH_SESSION=<reason> and retry.\n'
  } >&2
  exit 2
fi

if match_patch_session_ci; then
  {
    printf 'SETTINGS PROTECTION: Modification blocked (case-insensitive match)\n'
    printf '\n'
    printf '  File: %s\n' "$SAFE_FILE_PATH"
    printf '  Matched: %s\n' "$PROTECTED_MATCH"
  } >&2
  exit 2
fi

exit 0
