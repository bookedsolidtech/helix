#!/usr/bin/env bash
# PreToolUse hook: blocked-paths-bash-gate.sh
#
# 0.23.0+ — thin shim. Forwards stdin to `rea hook scan-bash --mode blocked`.
# See protected-paths-bash-gate.sh for the architectural rationale + CLI
# resolution strategy + verdict-verification model; this shim differs
# only in the --mode flag.
#
# Codex round 4 Finding 2: 2-tier sandboxed resolver (drops PATH lookup
# and node_modules/.bin/rea symlink). See protected-paths-bash-gate.sh
# for rationale.
#
# Codex round 2 R2-3: REA_NODE_CLI env-var honoring REMOVED.
#
# Exit codes:
#   0 = allow
#   2 = block (verdict, missing CLI, malformed payload, verdict mismatch)

set -uo pipefail

proj="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# 2-tier sandboxed CLI resolver. NO PATH lookup, NO env-var override.
REA_ARGV=()
RESOLVED_CLI_PATH=""
if [ -f "$proj/node_modules/@bookedsolid/rea/dist/cli/index.js" ]; then
  REA_ARGV=(node "$proj/node_modules/@bookedsolid/rea/dist/cli/index.js")
  RESOLVED_CLI_PATH="$proj/node_modules/@bookedsolid/rea/dist/cli/index.js"
elif [ -f "$proj/dist/cli/index.js" ]; then
  REA_ARGV=(node "$proj/dist/cli/index.js")
  RESOLVED_CLI_PATH="$proj/dist/cli/index.js"
fi

if [ "${#REA_ARGV[@]}" -eq 0 ]; then
  printf 'rea: CLI not found at sandboxed tiers (node_modules/@bookedsolid/rea/dist or dist/).\n' >&2
  printf 'Install @bookedsolid/rea via npm/pnpm and run `rea doctor`.\n' >&2
  printf 'Refusing the Bash command on uncertainty.\n' >&2
  exit 2
fi

# Codex round 4 Finding 2 + round 5 F2 tier defense: realpath the
# resolved CLI; PRIMARY check is project-root containment, SECONDARY
# is ancestor `package.json` with the protected name. See
# protected-paths-bash-gate.sh for the full rationale.
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
  // PRIMARY (round 5 F2): realCli must live INSIDE realProj. Catches
  // node_modules/@bookedsolid/rea -> /tmp/sym-attacker symlink-out.
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
  // SECONDARY (round 4 #2): shape + ancestor `package.json` with
  // `@bookedsolid/rea`. Guards against intra-project hijack.
  const expectedEnd = path.join("dist", "cli", "index.js");
  if (!real.endsWith(path.sep + expectedEnd) && real !== "/" + expectedEnd) {
    process.stdout.write("bad:cli-shape:" + real);
    process.exit(1);
  }
  let cur = path.dirname(path.dirname(path.dirname(real)));
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
        // Continue.
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

payload=$(cat)
if [ -z "$payload" ]; then
  exit 0
fi

verdict=$(printf '%s' "$payload" | "${REA_ARGV[@]}" hook scan-bash --mode blocked)
status=$?

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
    if [ "$verdict_check_status" -ne 0 ]; then
      exit 2
    fi
    if [ "$verdict_check" != "ok:block" ]; then
      printf 'rea: scan-bash exit 2 but verdict says %s. Refusing on uncertainty.\n' "$verdict_check" >&2
      exit 2
    fi
    exit 2
    ;;
  *)
    printf 'rea: scan-bash exited %d (expected 0/2). Refusing on uncertainty.\n' "$status" >&2
    if [ -n "$verdict" ]; then
      printf 'rea: scan-bash stdout was: %s\n' "$verdict" >&2
    fi
    exit 2
    ;;
esac
