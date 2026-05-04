#!/bin/bash
# PreToolUse hook: dependency-audit-gate.sh
# Fires BEFORE every Bash tool call.
# Detects package install commands (npm install, pnpm add, yarn add) and
# verifies the package exists on the registry before allowing the install.
#
# Exit codes:
#   0 = allow (not an install command, or package verified)
#   2 = block (package not found on registry)

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

# ── 4. Parse command ──────────────────────────────────────────────────────────
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$CMD" ]]; then
  exit 0
fi

# ── 5. Detect package install commands ────────────────────────────────────────
# Match: npm install <pkg>, npm i <pkg>, pnpm add <pkg>, yarn add <pkg>
# Skip: npm install (no args), npm ci, npm install --save-dev (without new pkg)

extract_packages() {
  local cmd="$1"

  # 0.15.0 fix: the previous parser ran `grep` against the entire bash
  # command string with no segment boundary anchor. A heredoc body or
  # commit-message containing `pnpm install` (e.g. inside
  # `git commit -m "$(cat <<EOF ... pnpm install ... EOF)"`) matched the
  # grep, the `.*` in the sed stripped up to that occurrence, and the rest
  # of the command (`chore:`, `&&`, `||`, etc.) was passed to
  # `npm view <token> name` and reported as missing packages. The hook
  # then refused to commit perfectly innocent code.
  #
  # Fix: split the command on shell command separators (`;`, `&&`, `||`,
  # `|`, newlines) and only run the install-detection on segments whose
  # FIRST non-whitespace token is one of the install commands. Heredoc
  # bodies inside `$()` substitutions are NOT split into separate segments
  # — the entire `$(cat <<EOF ... EOF)` is one token attached to the
  # outer command — but they're never the FIRST token on a segment, so
  # the anchor rejects them.

  # 0.17.0 helix-017 #3: unwrap nested-shell wrappers (`bash -c 'PAYLOAD'`,
  # `sh -lc "PAYLOAD"`, etc.) before splitting so the inner install
  # command becomes a segment that anchors against the install-pattern
  # check below. Pre-fix `bash -lc 'npm install pkg'` produced a single
  # segment whose first token was `bash` — install-detection skipped.
  # 0.17.0 helix-019 #3: delegate splitting to the shared
  # `_rea_split_segments` so this gate inherits the full separator set
  # (including bare `&` background-process operator added in 0.16.1)
  # and the quote-mask that prevents over-fire from in-quote separators.
  # Pre-fix the local segmenter splat on `|||&&|;|` only, missing bare
  # `&` — `echo warmup & pnpm add lodash` stayed merged into one segment
  # and the install-pattern leading-token check skipped it entirely.
  local segments
  if [ -f "$(dirname "$0")/_lib/cmd-segments.sh" ]; then
    # shellcheck source=_lib/cmd-segments.sh
    source "$(dirname "$0")/_lib/cmd-segments.sh"
    segments=$(_rea_split_segments "$cmd")
  else
    # Fallback (lib unavailable): legacy local splitter preserved.
    segments=$(printf '%s\n' "$cmd" | sed -E 's/(\|\||\&\&|;|\||\&)/\n/g')
  fi

  while IFS= read -r segment; do
    # Trim leading whitespace.
    segment="${segment#"${segment%%[![:space:]]*}"}"
    # Anchor to start: only match when the install command is the FIRST
    # thing on the segment, optionally preceded by `sudo` / `exec` /
    # `time` / etc.
    #
    # 0.16.1 helix-016 P2 fix: also strip leading KEY=VALUE env-var
    # assignments. Pre-fix the prefix allow-list only permitted
    # sudo/exec/time, so `CI=1 pnpm add foo` and
    # `NODE_ENV=development npm install bar` bypassed the audit
    # entirely. POSIX shell allows any number of leading KEY=VALUE
    # assignments before the command word; we strip them the same
    # way the shell does.
    local stripped_segment
    stripped_segment=$(printf '%s' "$segment" | sed -E 's/^([[:space:]]*[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+[[:space:]]+)+//')

    if printf '%s' "$stripped_segment" | grep -qiE '^(sudo[[:space:]]+|exec[[:space:]]+|time[[:space:]]+)*(npm[[:space:]]+(install|i|add)|pnpm[[:space:]]+(add|install|i)|yarn[[:space:]]+add)[[:space:]]+'; then
      # Strip the leading prefix wrappers + install command, leaving args.
      local after_cmd
      after_cmd=$(printf '%s' "$stripped_segment" | sed -E 's/^(sudo[[:space:]]+|exec[[:space:]]+|time[[:space:]]+)*(npm[[:space:]]+(install|i|add)|pnpm[[:space:]]+(add|install|i)|yarn[[:space:]]+add)[[:space:]]+//')

      for token in $after_cmd; do
        if [[ "$token" == -* ]]; then continue; fi
        if [[ "$token" == ./* || "$token" == /* || "$token" == ../* ]]; then continue; fi
        if [[ -z "$token" ]]; then continue; fi
        # 0.16.1: tighten token classification (helix-016 sibling concern).
        # A "package name" is something that doesn't contain shell
        # metacharacters — `2>&1`, `$VAR`, etc. are never valid npm
        # package names. Skip any token containing `=`, `>`, `<`, `&`,
        # `|`, `;`, `$`, backtick, or quotes.
        if [[ "$token" == *=* || "$token" == *">"* || "$token" == *"<"* ||
              "$token" == *"&"* || "$token" == *"|"* || "$token" == *";"* ||
              "$token" == *'$'* || "$token" == *'`'* ||
              "$token" == *'"'* || "$token" == *"'"* ]]; then continue; fi
        # `npm view` can't validate `@workspace:*` / `link:` / `file:`
        # prefixes (workspace protocols). Skip them — they're never npm
        # registry packages.
        if [[ "$token" == workspace:* || "$token" == link:* || "$token" == file:* || "$token" == git+* ]]; then continue; fi
        local pkg_name
        pkg_name=$(printf '%s' "$token" | sed -E 's/@[^@/]+$//')
        if [[ -z "$pkg_name" ]]; then
          pkg_name="$token"
        fi
        printf '%s\n' "$pkg_name"
      done
    fi
  done <<< "$segments"
}

PACKAGES=$(extract_packages "$CMD")

if [[ -z "$PACKAGES" ]]; then
  exit 0
fi

# ── 6. Verify packages exist on registry ──────────────────────────────────────
FAILED=""
CHECKED=0

while IFS= read -r pkg; do
  [[ -z "$pkg" ]] && continue
  CHECKED=$((CHECKED + 1))

  # Cap at 5 packages per command to avoid slow hook
  if [[ $CHECKED -gt 5 ]]; then
    break
  fi

  # Use npm view to check if package exists
  # macOS doesn't have `timeout` by default, use a background process with kill
  if command -v timeout >/dev/null 2>&1; then
    if ! timeout 5 npm view "$pkg" name >/dev/null 2>&1; then
      FAILED="${FAILED}  - ${pkg}\n"
    fi
  else
    # Fallback: run npm view without timeout (still fast for simple checks)
    if ! npm view "$pkg" name >/dev/null 2>&1; then
      FAILED="${FAILED}  - ${pkg}\n"
    fi
  fi
done <<< "$PACKAGES"

if [[ -n "$FAILED" ]]; then
  {
    printf 'DEPENDENCY AUDIT: Package not found on npm registry\n'
    printf '\n'
    printf '  The following packages could not be verified:\n'
    printf '%b' "$FAILED"
    printf '\n'
    printf '  Rule: All packages must exist on the npm registry before installation.\n'
    printf '  Check: Is the package name spelled correctly? Does it exist on npmjs.com?\n'
  } >&2
  exit 2
fi

exit 0
