#!/usr/bin/env bash
# PreToolUse hook: protected-paths-bash-gate.sh
#
# 0.23.0+ — thin shim. Forwards stdin (Claude Code's tool_input JSON)
# to `rea hook scan-bash --mode protected`, parses the verdict, exits
# 0/2 accordingly.
#
# Pre-0.23.0 this hook was a 536-line bash regex pipeline. The rewrite
# moved every detection rule into a parser-backed AST walker at
# `src/hooks/bash-scanner/`. helix-023 and discord-ops Round 13 closed
# 9 bypass classes that lived in the old segmenter; the new scanner
# closes them definitionally — there is no segmenter to bypass.
#
# Failure mode: if the rea CLI cannot be located in a SANDBOXED tier
# (consumer's `node_modules/@bookedsolid/rea/dist/cli/index.js` or the
# rea repo's own `dist/cli/index.js`), we REFUSE the command. NEVER
# ALLOW on uncertainty. Operators need `@bookedsolid/rea` installed for
# the gate to work; `rea doctor` flags missing CLI as a P0.
#
# Defense in depth: the shim does NOT trust the CLI exit code alone.
# After capturing stdout we re-parse the verdict with `node -e` to
# confirm:
#   1. it is valid JSON,
#   2. the top-level shape has `.verdict == "allow"|"block"`,
#   3. the verdict matches the exit code (allow→0, block→2).
# Any disagreement → exit 2.
#
# Codex round 4 Finding 2: dropped tier 1 (PATH `command -v rea`) and
# tier 2 (`node_modules/.bin/rea` symlink). Both are workspace-attacker
# controllable: an attacker who can write a file at
# `node_modules/.bin/rea` (or set PATH to a directory they own) can
# stage a fake `rea` binary that exits 0 with `{"verdict":"allow"}` and
# subvert the gate.
#
# Trust-boundary HONESTY (codex round 5 F5): the shim's structural
# defense is the realpath sandbox (round 4 #2 + round 5 F2). It defeats:
#   - PATH-attacker hijack via fake `rea` binary
#   - node_modules/.bin/rea symlink-bin hijack
#   - node_modules/@bookedsolid/rea -> /tmp/sym-attacker symlink-out
#   - intra-project hijack without a matching package.json
# It does NOT defeat an attacker who writes a forged dist/cli/index.js
# AND a matching package.json directly into node_modules/. At that level
# the attacker has already compromised the package install pipeline (npm
# registry, lockfile, dependency confusion) and any dependency the agent
# imports is also forgeable — hook-tier defense is past. The trust
# boundary is package-tier integrity (npm provenance + manifest
# verification), not the bash gate. See THREAT_MODEL §8.3 + docs/
# architecture/bash-scanner.md for the full rationale.
#
# Tier defense: realpath the resolved CLI before exec. Two complementary
# checks:
#   PRIMARY (codex round 5 F2): realpath(cli) MUST live INSIDE
#   realpath(CLAUDE_PROJECT_DIR). Catches symlink-out-of-project attacks
#   where the attacker writes `node_modules/@bookedsolid/rea` as a
#   symlink to a tree under `/tmp/sym-attacker` containing a forged
#   `package.json` with name `@bookedsolid/rea` and a forged
#   `dist/cli/index.js` that exits 0 with `{"verdict":"allow"}`. Pre-fix
#   the secondary check (package.json walk-up) was the ONLY guard, and
#   the attacker satisfies it by placing a forged package.json in their
#   own tree.
#   SECONDARY: walk up from the resolved CLI looking for an ancestor
#   `package.json` whose `name` is `@bookedsolid/rea`. This guards
#   against intra-project symlinks where the realpath stays inside
#   the project (e.g. accidentally pointing dist/ at node_modules/).
#
# Codex round 2 R2-3 (preserved): REA_NODE_CLI env-var honoring REMOVED.
# Test harnesses must set CLAUDE_PROJECT_DIR to a directory whose
# `dist/cli/index.js` (or `node_modules/@bookedsolid/rea/...`) holds
# the trusted CLI build. The shim NEVER reads REA_NODE_CLI.
#
# Exit codes:
#   0 = allow (verdict.verdict == "allow")
#   2 = block (verdict.verdict == "block", or any failure path)

set -uo pipefail

proj="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Resolve the rea CLI through a fixed 2-tier sandboxed order.
#   1. node_modules/@bookedsolid/rea/dist/cli/index.js (consumer-side
#      direct dist execution — the published artifact)
#   2. dist/cli/index.js under CLAUDE_PROJECT_DIR (the rea repo's own
#      dogfood install, where `rea` is the package itself)
#
# We build an `argv` array rather than a string so paths containing
# whitespace round-trip safely.
REA_ARGV=()
RESOLVED_CLI_PATH=""
if [ -f "$proj/node_modules/@bookedsolid/rea/dist/cli/index.js" ]; then
  REA_ARGV=(node "$proj/node_modules/@bookedsolid/rea/dist/cli/index.js")
  RESOLVED_CLI_PATH="$proj/node_modules/@bookedsolid/rea/dist/cli/index.js"
elif [ -f "$proj/dist/cli/index.js" ]; then
  # rea repo dogfood: the project IS @bookedsolid/rea.
  REA_ARGV=(node "$proj/dist/cli/index.js")
  RESOLVED_CLI_PATH="$proj/dist/cli/index.js"
fi

if [ "${#REA_ARGV[@]}" -eq 0 ]; then
  printf 'rea: CLI not found at sandboxed tiers (node_modules/@bookedsolid/rea/dist or dist/).\n' >&2
  printf 'Install @bookedsolid/rea via npm/pnpm and run `rea doctor`.\n' >&2
  printf 'Refusing the Bash command on uncertainty.\n' >&2
  exit 2
fi

# Codex round 4 Finding 2 tier defense: realpath the resolved CLI and
# verify it lives inside the sandboxed dirs. Catches symlink games.
# We require Node for the verifier anyway (below) — use it here too.
if ! command -v node >/dev/null 2>&1; then
  printf 'rea: node not on PATH (required to realpath verify scan-bash CLI). Refusing.\n' >&2
  exit 2
fi
sandbox_check=$(node -e '
  const fs = require("fs");
  const path = require("path");
  const cli = process.argv[1];
  const projDir = process.argv[2];
  let real;
  try { real = fs.realpathSync(cli); } catch (e) {
    process.stdout.write("bad:realpath:" + (e && e.message ? e.message : String(e)));
    process.exit(1);
  }
  // Codex round 5 F2 (P0) — PRIMARY check: realpath(cli) must live
  // INSIDE realpath(CLAUDE_PROJECT_DIR). Pre-fix an attacker who
  // writes a symlink at node_modules/@bookedsolid/rea pointing to
  // /tmp/sym-attacker (containing a forged package.json + dist/cli/index.js
  // that exits 0 with verdict:"allow") completely defeated the
  // sandbox — the package.json walk-up was satisfied by the forged
  // file in the attacker tree. Containing realCli to realProj closes
  // every symlink-out attack class because the attacker no longer
  // controls a path inside the project tree.
  let realProj;
  try { realProj = fs.realpathSync(projDir); } catch (e) {
    process.stdout.write("bad:realpath-proj:" + (e && e.message ? e.message : String(e)));
    process.exit(1);
  }
  const projWithSep = realProj.endsWith(path.sep) ? realProj : realProj + path.sep;
  if (!(real === realProj || real.startsWith(projWithSep))) {
    process.stdout.write("bad:cli-escapes-project:" + real + ":proj=" + realProj);
    process.exit(1);
  }
  // Codex round 4 Finding 2 (now SECONDARY) — shape + ancestor pkg.json.
  //
  // Acceptance: the resolved CLI must end in `.../dist/cli/index.js`
  // and have an ancestor `package.json` whose `name` is `@bookedsolid/rea`.
  // This guards against intra-project hijack where an attacker writes
  // a symlink at node_modules/@bookedsolid/rea pointing to a sibling
  // tree INSIDE the project (e.g. ./scratch/) — the PRIMARY check
  // accepts it (still inside project root) but the package.json walk-up
  // refuses unless that tree contains the canonical package metadata.
  const expectedEnd = path.join("dist", "cli", "index.js");
  if (!real.endsWith(path.sep + expectedEnd) && real !== "/" + expectedEnd) {
    process.stdout.write("bad:cli-shape:" + real);
    process.exit(1);
  }
  // Walk up looking for package.json with the protected name.
  let cur = path.dirname(path.dirname(path.dirname(real))); // pkg root
  let found = false;
  for (let i = 0; i < 20 && cur && cur !== path.dirname(cur); i += 1) {
    const pj = path.join(cur, "package.json");
    if (fs.existsSync(pj)) {
      try {
        const data = JSON.parse(fs.readFileSync(pj, "utf8"));
        if (data && data.name === "@bookedsolid/rea") {
          found = true;
          break;
        }
      } catch (e) {
        // Continue walking up.
      }
    }
    cur = path.dirname(cur);
  }
  if (!found) {
    process.stdout.write("bad:no-rea-pkg:" + real);
    process.exit(1);
  }
  process.stdout.write("ok");
  process.exit(0);
' "$RESOLVED_CLI_PATH" "$proj" 2>&1)
sandbox_status=$?
if [ "$sandbox_status" -ne 0 ] || [ "$sandbox_check" != "ok" ]; then
  printf 'rea: scan-bash CLI realpath escapes sandbox (%s). Refusing.\n' "$sandbox_check" >&2
  exit 2
fi

# Capture stdin once and forward it to the CLI.
payload=$(cat)
if [ -z "$payload" ]; then
  exit 0
fi

# Run the scanner.
verdict=$(printf '%s' "$payload" | "${REA_ARGV[@]}" hook scan-bash --mode protected)
status=$?

# Defense in depth — verify the verdict JSON matches the exit code.
verifier='try {
  const raw = require("fs").readFileSync(0, "utf8");
  if (raw.trim().length === 0) { process.stdout.write("bad:empty"); process.exit(1); }
  const v = JSON.parse(raw);
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    process.stdout.write("bad:non-object"); process.exit(1);
  }
  if (v.verdict !== "allow" && v.verdict !== "block") {
    process.stdout.write("bad:verdict-shape:" + String(v.verdict)); process.exit(1);
  }
  process.stdout.write("ok:" + v.verdict); process.exit(0);
} catch (e) {
  process.stdout.write("bad:" + (e && e.message ? e.message : String(e))); process.exit(1);
}'

verdict_check=$(printf '%s' "$verdict" | node -e "$verifier" 2>&1)
verdict_check_status=$?

case "$status" in
  0)
    if [ "$verdict_check_status" -ne 0 ]; then
      printf 'rea: scan-bash exited 0 but verdict JSON is malformed (%s). Refusing on uncertainty.\n' "$verdict_check" >&2
      exit 2
    fi
    if [ "$verdict_check" != "ok:allow" ]; then
      printf 'rea: scan-bash exit 0 but verdict says %s. Refusing on uncertainty.\n' "$verdict_check" >&2
      exit 2
    fi
    exit 0
    ;;
  2)
    # Block path — the CLI has already emitted the operator-facing
    # reason on stderr. We additionally verify the JSON shape so a
    # forged `/bin/true` (which would never reach here, but be defensive)
    # cannot bypass.
    if [ "$verdict_check_status" -ne 0 ]; then
      # Malformed stdout under exit 2 is unusual but harmless — the
      # block path is still honored.
      exit 2
    fi
    if [ "$verdict_check" != "ok:block" ]; then
      printf 'rea: scan-bash exit 2 but verdict says %s. Refusing on uncertainty.\n' "$verdict_check" >&2
      exit 2
    fi
    exit 2
    ;;
  *)
    # Unexpected exit code — treat as block on uncertainty. The CLI
    # writes its own diagnostic; we add an explicit refusal.
    printf 'rea: scan-bash exited %d (expected 0/2). Refusing on uncertainty.\n' "$status" >&2
    if [ -n "$verdict" ]; then
      printf 'rea: scan-bash stdout was: %s\n' "$verdict" >&2
    fi
    exit 2
    ;;
esac
