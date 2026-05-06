# shellcheck shell=bash
# hooks/_lib/protected-paths.sh — single source of truth for the
# hard-protected path list shared between the Write/Edit tier
# (`settings-protection.sh`) and the Bash tier (`protected-paths-bash-gate.sh`).
#
# Pre-0.15.0 this list was duplicated inline in settings-protection.sh;
# the bash-redirect bypass (`> .rea/HALT`, `tee .rea/policy.yaml`,
# `cp X .claude/settings.json`, `sed -i .husky/pre-push`) was caught
# by the principal-engineer audit. The fix: factor the list out so
# both hooks read the same data, and protect against shell redirects
# in addition to Write/Edit/MultiEdit tools.
#
# 0.16.3 F7: the list is now policy-driven via `protected_paths_relax`.
# Consumers who legitimately need to author `.husky/<hookname>` files
# (or other paths in the rea-managed hard list) can opt out per-pattern
# by listing the entry in `.rea/policy.yaml`:
#
#   protected_paths_relax:
#     - .husky/    # I author my own husky hooks; opt out of rea protection
#
# Pre-0.16.3 the only escape was editing rea-managed source itself —
# which `protected-paths-bash-gate.sh` (also rea-managed) would refuse.
# That left consumers stuck. The relax list closes that escape hatch
# without weakening the integrity of the governance layer itself.
#
# KILL-SWITCH INVARIANTS — these patterns are ALWAYS protected, even
# if a consumer lists them in `protected_paths_relax`. They represent
# the integrity of the governance layer; relaxing them would let an
# agent disable rea, defeating the entire product.
#
#   .rea/HALT             — the kill switch itself
#   .rea/policy.yaml      — the policy that defines all enforcement
#   .claude/settings.json — the hook registration that activates rea
#
# Listing a kill-switch invariant in `protected_paths_relax` is silently
# ignored AND a stderr advisory is emitted on first read.

# The full hard-protected list. Suffix `/` indicates a prefix match;
# no suffix means (case-insensitive) exact match — see
# `rea_path_is_protected` for the helix-015 #2 lowercase-comparison
# rationale.
REA_PROTECTED_PATTERNS_FULL=(
  '.claude/settings.json'
  '.claude/settings.local.json'
  '.husky/'
  '.rea/policy.yaml'
  '.rea/HALT'
  # 0.19.0 security review C1: the verdict cache is a security boundary
  # since 0.18.1. A forged entry would skip codex on next push of that
  # SHA. Protect it like the kill-switch.
  '.rea/last-review.cache.json'
  # 0.20.1 round-N P1: last-review.json is the operator's only forensic
  # snapshot of the most recent codex review. A forged entry presents
  # a fake "PASS" verdict to operators reading the file directly, and
  # to any future tooling that consults it. Protect alongside the cache.
  '.rea/last-review.json'
)

# Kill-switch invariants — never relaxable. Subset of FULL.
REA_KILL_SWITCH_INVARIANTS=(
  '.claude/settings.json'
  '.rea/policy.yaml'
  '.rea/HALT'
  '.rea/last-review.cache.json'
  '.rea/last-review.json'
)

# Effective patterns after applying the relax list. Computed lazily on
# first call to `rea_path_is_protected`; stays the same for the lifetime
# of the hook process.
REA_PROTECTED_PATTERNS=()
# 0.18.0 helix-020 G2 fix: track which patterns came from the consumer's
# explicit `protected_writes` override (vs. the hardcoded default). The
# override-first ordering in `rea_path_is_protected` checks ONLY this
# subset before consulting the extension-surface allow-list, so an
# explicit `protected_writes: [.husky/pre-push.d/]` can re-protect a
# path that the allow-list would otherwise let through.
REA_PROTECTED_OVERRIDE_PATTERNS=()
_REA_PROTECTED_PATTERNS_LOADED=0

# True if $1 is a kill-switch invariant (case-insensitive exact or
# prefix match per the same rules as the protected list itself).
_rea_is_kill_switch() {
  local p="$1"
  local p_lc inv inv_lc
  p_lc=$(printf '%s' "$p" | tr '[:upper:]' '[:lower:]')
  for inv in "${REA_KILL_SWITCH_INVARIANTS[@]}"; do
    inv_lc=$(printf '%s' "$inv" | tr '[:upper:]' '[:lower:]')
    if [[ "$p_lc" == "$inv_lc" ]]; then
      return 0
    fi
  done
  return 1
}

# Load the effective list, applying `protected_writes` (full override
# from policy) and `protected_paths_relax` (subtractor) from policy.
# Sources policy-read.sh on demand so this lib stays self-contained.
#
# 0.17.0 helix-018 Option A: `protected_writes` lets consumers fully
# define the protected list. When set, replaces the hardcoded default;
# kill-switch invariants are always added back regardless. When unset,
# defaults to REA_PROTECTED_PATTERNS_FULL (the historical 5 patterns).
# `protected_paths_relax` then subtracts from whatever the effective
# set is (kill-switch invariants are non-relaxable).
_rea_load_protected_patterns() {
  if [ "$_REA_PROTECTED_PATTERNS_LOADED" = "1" ]; then
    return 0
  fi
  # Source policy-read if not already sourced. The caller may have
  # already done so; checking for a known function avoids double-source.
  if ! command -v policy_list >/dev/null 2>&1; then
    # Resolve relative to THIS file's dir, not the caller's.
    # shellcheck source=policy-read.sh
    source "${BASH_SOURCE[0]%/*}/policy-read.sh" 2>/dev/null || true
  fi

  # Read both policy keys.
  local writes_list=()
  local relax_list=()
  local protected_writes_set=0
  if command -v policy_list >/dev/null 2>&1; then
    # `protected_writes`: detect "set but empty" vs "unset" via a probe.
    # policy_list returns nothing for both cases, so we use a sentinel
    # check on the YAML key existence via a separate probe.
    local pw_present
    pw_present=$(policy_scalar "protected_writes" 2>/dev/null || true)
    # If the key is a list (yq returns "null" or empty for scalar reads
    # of a list), policy_list reads it. We detect "key exists" by
    # checking either policy_scalar's return OR policy_list's output.
    while IFS= read -r entry; do
      [ -z "$entry" ] && continue
      writes_list+=("$entry")
      protected_writes_set=1
    done < <(policy_list "protected_writes" 2>/dev/null || true)
    # If pw_present is "[]" (empty array) — policy_list returns nothing
    # but the key IS set. policy_scalar of a list returns "null" or
    # the literal `[]`. Treat any of those as "set".
    case "$pw_present" in
      '[]'|'null') protected_writes_set=1 ;;
    esac

    while IFS= read -r entry; do
      [ -z "$entry" ] && continue
      relax_list+=("$entry")
    done < <(policy_list "protected_paths_relax" 2>/dev/null || true)
  fi

  # Compose the BASE list:
  #   - If `protected_writes` set in policy: that list, plus kill-switch
  #     invariants always added (deduped).
  #   - Else: REA_PROTECTED_PATTERNS_FULL (hardcoded historical default).
  local base_list=()
  if [ "$protected_writes_set" = "1" ]; then
    local w
    for w in "${writes_list[@]+"${writes_list[@]}"}"; do
      base_list+=("$w")
    done
    # Add kill-switch invariants if not already present.
    local inv inv_lc found
    for inv in "${REA_KILL_SWITCH_INVARIANTS[@]}"; do
      inv_lc=$(printf '%s' "$inv" | tr '[:upper:]' '[:lower:]')
      found=0
      local b b_lc
      for b in "${base_list[@]+"${base_list[@]}"}"; do
        b_lc=$(printf '%s' "$b" | tr '[:upper:]' '[:lower:]')
        if [[ "$b_lc" == "$inv_lc" ]]; then
          found=1
          break
        fi
      done
      if [ "$found" = "0" ]; then
        base_list+=("$inv")
      fi
    done
  else
    local pat
    for pat in "${REA_PROTECTED_PATTERNS_FULL[@]}"; do
      base_list+=("$pat")
    done
  fi

  # Validate relax entries: any kill-switch invariant in the list is
  # silently dropped from "permitted to relax" but emits a stderr
  # advisory so the operator can see why their relax didn't take
  # effect.
  local relaxed_set=()
  local r
  for r in "${relax_list[@]+"${relax_list[@]}"}"; do
    if _rea_is_kill_switch "$r"; then
      printf 'rea: protected_paths_relax: %s is a kill-switch invariant and cannot be relaxed; ignoring.\n' \
        "$r" >&2
    else
      relaxed_set+=("$r")
    fi
  done

  # Build the effective list: every BASE entry that is NOT in the
  # relaxed set (case-insensitive comparison).
  local pat pat_lc rentry rentry_lc relaxed
  for pat in "${base_list[@]+"${base_list[@]}"}"; do
    pat_lc=$(printf '%s' "$pat" | tr '[:upper:]' '[:lower:]')
    relaxed=0
    for rentry in "${relaxed_set[@]+"${relaxed_set[@]}"}"; do
      rentry_lc=$(printf '%s' "$rentry" | tr '[:upper:]' '[:lower:]')
      if [[ "$pat_lc" == "$rentry_lc" ]]; then
        relaxed=1
        break
      fi
    done
    if [ "$relaxed" = "0" ]; then
      REA_PROTECTED_PATTERNS+=("$pat")
    fi
  done

  # 0.18.0 helix-020 G2: also expose the EXPLICIT-OVERRIDE subset so
  # `rea_path_is_protected` can prioritize override matches over the
  # extension-surface allow-list. Only entries that came from a
  # `protected_writes:` declaration land here — kill-switch invariants
  # added defensively in step 2 above are NOT included (they get the
  # historical "extension surface relaxes them" treatment, since the
  # user did NOT explicitly opt in to protecting husky fragments).
  if [ "$protected_writes_set" = "1" ]; then
    local ow ow_lc rentry_lc2 relaxed2
    for ow in "${writes_list[@]+"${writes_list[@]}"}"; do
      ow_lc=$(printf '%s' "$ow" | tr '[:upper:]' '[:lower:]')
      relaxed2=0
      for rentry in "${relaxed_set[@]+"${relaxed_set[@]}"}"; do
        rentry_lc2=$(printf '%s' "$rentry" | tr '[:upper:]' '[:lower:]')
        if [[ "$ow_lc" == "$rentry_lc2" ]]; then
          relaxed2=1
          break
        fi
      done
      if [ "$relaxed2" = "0" ]; then
        REA_PROTECTED_OVERRIDE_PATTERNS+=("$ow")
      fi
    done
  fi

  _REA_PROTECTED_PATTERNS_LOADED=1
}

# Test whether a project-relative path is in the documented husky
# extension surface (`.husky/commit-msg.d/*`, `.husky/pre-push.d/*`).
# Returns 0 on match, 1 on no match. Case-insensitive.
#
# 0.16.4 helix-018 Option B: settings-protection.sh §5b has carved
# this surface out of write-tier protection since 0.13.2 — consumers
# write extension fragments here freely. Pre-0.16.4 the BASH-tier
# gates (`protected-paths-bash-gate.sh`, `blocked-paths-bash-gate.sh`)
# had no parity carve-out, so a `cat <<EOF > .husky/pre-push.d/X`
# redirect was refused by the bash-gate even though the equivalent
# Write-tool call would succeed. This helper bakes the carve-out
# into the shared lib so every caller inherits it uniformly.
rea_path_is_extension_surface() {
  local p_lc
  p_lc=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  case "$p_lc" in
    .husky/commit-msg.d/*|.husky/pre-push.d/*|.husky/pre-commit.d/*)
      # Refuse the bare directory itself — only fragments INSIDE
      # the surface count. `.husky/pre-push.d/` (trailing slash, no
      # fragment) and `.husky/pre-push.d` (the dir node) both fall
      # through to the protection check via the parent prefix.
      case "$p_lc" in
        .husky/commit-msg.d/|.husky/pre-push.d/|.husky/pre-commit.d/) return 1 ;;
      esac
      return 0
      ;;
  esac
  return 1
}

# Test whether a project-relative path matches any protected pattern
# (after applying `protected_paths_relax`). Returns 0 on match, 1 on
# no match.
#
# Usage: if rea_path_is_protected ".rea/HALT"; then echo "blocked"; fi
#
# 0.16.0 codex P1 fix (helix-015 #2): match case-insensitively.
# macOS APFS (default case-insensitive) lets `.ClAuDe/settings.json`
# land on the same file as `.claude/settings.json`. settings-protection.sh
# §6 has had a CI matcher since 0.10.x; this helper was missing it.
# We lowercase BOTH sides so the comparison is symmetric — callers can
# pass either case.
#
# 0.16.4 helix-018 Option B: paths inside the documented husky
# extension surface (`.husky/{commit-msg,pre-push,pre-commit}.d/*`)
# return 1 (not protected) by default so they don't get caught by
# `.husky/`'s prefix block. This mirrors the §5b allow-list that has
# been in settings-protection.sh since 0.13.2.
#
# 0.18.0 helix-020 G2 fix: ORDER MATTERS. The pre-fix function checked
# the extension-surface allow-list FIRST and short-circuited "not
# protected" unconditionally. That made the `protected_writes` /
# `protected_paths` override silently ineffective for any path inside
# the extension surface — a consumer who wanted `.husky/pre-push.d/`
# hardened could not opt in. The fix: explicit overrides win FIRST
# (the consumer asked for this), then the extension-surface
# short-circuit applies to anything else, then the default protected
# list. Pseudocode is the canonical version from helix-020 Interactive
# Finding 1.
rea_path_is_protected() {
  _rea_load_protected_patterns
  local p_lc
  p_lc=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  local pattern pattern_lc

  # 1. Explicit `protected_writes` overrides win. If the consumer
  #    listed this path (or its parent prefix) in `protected_writes`,
  #    we honor that intent even when the path is on the extension
  #    surface. This is what lets a consumer harden their managed
  #    `.husky/pre-push.d/` fragments — the carve-out for unmanaged
  #    consumer fragments is the default, but it can be undone.
  for pattern in "${REA_PROTECTED_OVERRIDE_PATTERNS[@]+"${REA_PROTECTED_OVERRIDE_PATTERNS[@]}"}"; do
    pattern_lc=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
    if [[ "$p_lc" == "$pattern_lc" ]]; then
      return 0
    fi
    if [[ "$pattern_lc" == */ ]] && [[ "$p_lc" == "$pattern_lc"* ]]; then
      return 0
    fi
  done

  # 2. Extension-surface allow-list. Paths inside the documented
  #    husky extension surface (`.husky/{commit-msg,pre-push,pre-commit}.d/*`)
  #    are NOT protected by default — the consumer manages those
  #    fragments freely; settings-protection.sh §5b has the same
  #    carve-out on the Write/Edit side. Step 1 above is what lets a
  #    consumer override that default per-path.
  if rea_path_is_extension_surface "$1"; then
    return 1
  fi

  # 3. Default protected list (kill-switch invariants + `.husky/`
  #    prefix block + `.claude/settings*` + `.rea/policy.yaml`). When
  #    `protected_writes` was set, kill-switch invariants are still
  #    enforced via this branch because they were added back into
  #    REA_PROTECTED_PATTERNS during `_rea_load_protected_patterns`.
  for pattern in "${REA_PROTECTED_PATTERNS[@]+"${REA_PROTECTED_PATTERNS[@]}"}"; do
    pattern_lc=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
    if [[ "$p_lc" == "$pattern_lc" ]]; then
      return 0
    fi
    if [[ "$pattern_lc" == */ ]] && [[ "$p_lc" == "$pattern_lc"* ]]; then
      return 0
    fi
  done
  return 1
}
