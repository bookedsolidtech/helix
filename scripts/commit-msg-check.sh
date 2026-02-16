#!/usr/bin/env bash
# ==============================================================================
# Commit Message Validator
# ==============================================================================
# Enforces conventional commit format and best practices.
# ==============================================================================

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Skip merge commits
if echo "$COMMIT_MSG" | grep -qE "^Merge (branch|remote)"; then
  exit 0
fi

# Skip revert commits
if echo "$COMMIT_MSG" | grep -qE "^Revert "; then
  exit 0
fi

# Conventional commit pattern
# Format: type(scope?): subject
# Types: feat, fix, chore, docs, test, refactor, style, perf, ci, build
PATTERN='^(feat|fix|chore|docs|test|refactor|style|perf|ci|build)(\(.+\))?: .{1,100}'

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "❌ Invalid commit message format"
  echo ""
  echo "Commit message must follow conventional commits:"
  echo "  type(scope?): subject"
  echo ""
  echo "Types:"
  echo "  feat     - New feature"
  echo "  fix      - Bug fix"
  echo "  chore    - Maintenance (deps, config, etc.)"
  echo "  docs     - Documentation changes"
  echo "  test     - Test changes"
  echo "  refactor - Code refactoring"
  echo "  style    - Code style/formatting"
  echo "  perf     - Performance improvements"
  echo "  ci       - CI/CD changes"
  echo "  build    - Build system changes"
  echo ""
  echo "Examples:"
  echo "  feat(button): add disabled state"
  echo "  fix(card): correct elevation shadow"
  echo "  chore: update dependencies"
  echo "  docs: add accessibility guide"
  echo ""
  echo "Your message:"
  echo "  $COMMIT_MSG"
  echo ""
  exit 1
fi

# Check subject length (after type and scope)
SUBJECT=$(echo "$COMMIT_MSG" | head -n 1 | sed -E 's/^[a-z]+(\([^)]+\))?: //')
SUBJECT_LENGTH=${#SUBJECT}

if [ $SUBJECT_LENGTH -lt 10 ]; then
  echo ""
  echo "⚠️  Commit subject is very short ($SUBJECT_LENGTH characters)"
  echo "Consider adding more context (minimum 10 characters recommended)"
  echo ""
fi

if [ $SUBJECT_LENGTH -gt 72 ]; then
  echo ""
  echo "❌ Commit subject is too long ($SUBJECT_LENGTH characters)"
  echo "Keep subject under 72 characters for better readability"
  echo ""
  exit 1
fi

# Check for issue references (optional for non-chore commits)
TYPE=$(echo "$COMMIT_MSG" | sed -E 's/^([a-z]+).*/\1/')
if [ "$TYPE" != "chore" ] && [ "$TYPE" != "docs" ] && [ "$TYPE" != "style" ]; then
  if ! echo "$COMMIT_MSG" | grep -qE "#[0-9]+|refs #[0-9]+|closes #[0-9]+|fixes #[0-9]+"; then
    echo ""
    echo "⚠️  No issue reference found in commit message"
    echo "Consider adding a reference like '#123' or 'fixes #123'"
    echo "(This is a warning only, commit will proceed)"
    echo ""
  fi
fi

exit 0
