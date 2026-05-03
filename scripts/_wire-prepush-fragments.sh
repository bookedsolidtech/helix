#!/usr/bin/env bash
# One-shot: restore .husky/pre-push and inject a clean pre-push.d fragment runner.
# Settings-protection blocks the agent from editing .husky/* directly, so this
# script exists for Jake to run by hand. Idempotent: re-running is a no-op.
set -euo pipefail

PRE_PUSH=".husky/pre-push"
[ -f "$PRE_PUSH" ] || { echo "missing $PRE_PUSH"; exit 1; }

# Strip any prior insertion (broken or otherwise) between the markers.
awk '
  /^# >>> pre-push\.d fragments >>>/ { skip = 1; next }
  /^# <<< pre-push\.d fragments <<</ { skip = 0; next }
  !skip { print }
' "$PRE_PUSH" > "${PRE_PUSH}.tmp"

# Also strip the broken hand-rolled block from the prior printf|ed attempt.
awk '
  /^# pre-push\.d fragments$/ { in_bad = 1; next }
  in_bad && /^fi$/ { in_bad = 0; next }
  in_bad { next }
  { print }
' "${PRE_PUSH}.tmp" > "${PRE_PUSH}.tmp2"
mv "${PRE_PUSH}.tmp2" "${PRE_PUSH}.tmp"

# Inject clean block before the Report header. Fail fast if the anchor is missing
# rather than silently producing an unwired script.
awk '
  /^# ── Report/ && !done {
    print "# >>> pre-push.d fragments >>>"
    print "if [ -d \".husky/pre-push.d\" ]; then"
    print "  for FRAGMENT in .husky/pre-push.d/*; do"
    print "    [ -f \"$FRAGMENT\" ] && [ -x \"$FRAGMENT\" ] || continue"
    print "    NAME=$(basename \"$FRAGMENT\")"
    print "    echo \"pre-push: running fragment ${NAME}...\""
    print "    if ! \"$FRAGMENT\" > \"$OUT\" 2>&1; then"
    print "      echo \"\""
    print "      echo \"GATE FAILED: ${NAME}\""
    print "      cat \"$OUT\""
    print "      echo \"\""
    print "      FAILED=\"${FAILED} ${NAME}\""
    print "    fi"
    print "  done"
    print "fi"
    print "# <<< pre-push.d fragments <<<"
    done = 1
  }
  { print }
  END { exit done ? 0 : 1 }
' "${PRE_PUSH}.tmp" > "${PRE_PUSH}.tmp2" || {
  echo "wire: anchor '# ── Report' not found in $PRE_PUSH -- refusing to overwrite." >&2
  rm -f "${PRE_PUSH}.tmp" "${PRE_PUSH}.tmp2"
  exit 1
}

mv "${PRE_PUSH}.tmp2" "$PRE_PUSH"
rm -f "${PRE_PUSH}.tmp"
chmod +x "$PRE_PUSH"

echo "wired. inspect with: sed -n '125,150p' $PRE_PUSH"
