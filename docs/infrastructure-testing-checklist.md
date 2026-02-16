# Infrastructure Testing Checklist

**Phase 0: Quality Gate Infrastructure - Verification**

Use this checklist to verify that all Phase 0 infrastructure is working correctly.

## ✅ Pre-Implementation Verification

- [x] Repository cloned
- [x] Dependencies installed (`npm install`)
- [x] Dev servers can start (`npm run dev`)
- [x] Build succeeds (`npm run build`)
- [x] Tests pass (`npm run test`)

## ✅ Git Hooks Installation

### Verify Hooks Exist

```bash
ls -la .husky/
```

Expected files:

- [x] `.husky/pre-commit`
- [x] `.husky/pre-push`
- [x] `.husky/commit-msg`

### Verify Scripts Exist

```bash
ls -la scripts/
```

Expected files:

- [x] `scripts/pre-commit-check.sh`
- [x] `scripts/pre-push-check.sh`
- [x] `scripts/commit-msg-check.sh`
- [x] `scripts/kill-ports.sh`

### Verify Executable Permissions

```bash
ls -la scripts/*.sh
ls -la .husky/*
```

All should be executable (`-rwxr-xr-x`).

## ✅ Commit Message Hook Testing

### Test Valid Commit Message

```bash
# Create test file
echo "test" > test-commit-msg.txt

# Test valid message
bash scripts/commit-msg-check.sh <(echo "feat(test): testing commit message validation")
echo "Exit code: $?"  # Should be 0
```

Expected: ✅ Passes (exit code 0)

### Test Invalid Commit Message

```bash
bash scripts/commit-msg-check.sh <(echo "invalid commit message")
echo "Exit code: $?"  # Should be 1
```

Expected: ❌ Fails with helpful error message (exit code 1)

### Test Edge Cases

```bash
# Too short subject
bash scripts/commit-msg-check.sh <(echo "feat: test")
# Should pass with warning

# Too long subject
bash scripts/commit-msg-check.sh <(echo "feat: this is a very long commit message that exceeds the seventy two character limit and should be rejected")
# Should fail

# Valid with scope
bash scripts/commit-msg-check.sh <(echo "feat(button): add disabled state")
# Should pass

# Valid types
bash scripts/commit-msg-check.sh <(echo "fix(card): correct shadow")
bash scripts/commit-msg-check.sh <(echo "chore: update dependencies")
bash scripts/commit-msg-check.sh <(echo "docs: add guide")
bash scripts/commit-msg-check.sh <(echo "test: add tests")
bash scripts/commit-msg-check.sh <(echo "refactor: improve code")
# All should pass
```

## ✅ Pre-Commit Hook Testing

### Setup Test Commit

```bash
# Make a small change
echo "// Test comment" >> packages/hx-library/src/index.ts

# Stage the file
git add packages/hx-library/src/index.ts
```

### Test Pre-Commit Hook

```bash
# This will trigger the pre-commit hook
git commit -m "test: validate pre-commit hook"
```

Expected behavior:

- [x] Lint-staged runs (formats and lints)
- [x] Type check runs on staged files
- [x] Tests run for modified components
- [x] Hook completes in < 30 seconds
- [x] Commit succeeds if all checks pass

### Test Pre-Commit Bypass

```bash
# Bypass hook (emergency only)
git commit --no-verify -m "test: bypass pre-commit hook"
```

Expected: ✅ Commit succeeds without running hooks

### Cleanup Test Commit

```bash
# Reset the test changes
git reset HEAD~1
git checkout -- packages/hx-library/src/index.ts
```

## ✅ Pre-Push Hook Testing

### Test Pre-Push Hook

```bash
# Create test branch
git checkout -b test/pre-push-hook

# Make and commit a small change
echo "// Test" >> packages/hx-library/src/index.ts
git add packages/hx-library/src/index.ts
git commit -m "test: validate pre-push hook"

# Push (triggers pre-push hook)
git push origin test/pre-push-hook
```

Expected behavior:

- [x] Full type check runs
- [x] Full test suite runs
- [x] Lint runs
- [x] Format check runs
- [x] Build runs
- [x] Bundle size check runs
- [x] CEM generation runs
- [x] Code quality checks run
- [x] Hook completes in 2-5 minutes
- [x] Push succeeds if all checks pass

### Test Pre-Push Bypass

```bash
# Bypass hook (emergency only)
git push --no-verify origin test/pre-push-hook
```

Expected: ✅ Push succeeds without running hooks

### Cleanup Test Branch

```bash
git checkout main
git branch -D test/pre-push-hook
git push origin --delete test/pre-push-hook
```

## ✅ Package.json Scripts

### Verify New Scripts

```bash
# Check if scripts exist
npm run | grep "pre-commit-check"
npm run | grep "pre-push-check"
npm run | grep "type-check:watch"
npm run | grep "lint:fix"
npm run | grep "format:all"
```

### Test Scripts

```bash
# Type check watch (run in background)
npm run type-check:watch &
TYPE_WATCH_PID=$!
sleep 5
kill $TYPE_WATCH_PID

# Lint fix
npm run lint:fix

# Format all
npm run format:all

# Pre-commit check (manual)
npm run pre-commit-check

# Pre-push check (manual)
npm run pre-push-check
```

All should complete successfully.

## ✅ EditorConfig

### Verify EditorConfig

```bash
cat .editorconfig
```

Expected:

- [x] `root = true`
- [x] `indent_style = space`
- [x] `indent_size = 2`
- [x] `end_of_line = lf`
- [x] `charset = utf-8`
- [x] `insert_final_newline = true`
- [x] `trim_trailing_whitespace = true`

### Test EditorConfig

1. Open any `.ts` file in your IDE
2. Press Tab - should insert 2 spaces (not a tab character)
3. Check line endings - should be LF (not CRLF)
4. Save file - should add final newline and trim trailing whitespace

## ✅ VSCode Configuration

### Verify VSCode Settings

```bash
cat .vscode/settings.json
```

Expected:

- [x] `"editor.formatOnSave": true`
- [x] `"editor.defaultFormatter": "esbenp.prettier-vscode"`
- [x] `"editor.codeActionsOnSave"` includes ESLint

### Verify VSCode Extensions

```bash
cat .vscode/extensions.json
```

Expected extensions:

- [x] `astro-build.astro-vscode`
- [x] `dbaeumer.vscode-eslint`
- [x] `esbenp.prettier-vscode`
- [x] `editorconfig.editorconfig`
- [x] `ms-vscode.vscode-typescript-next`

### Test VSCode Integration

In VSCode:

1. Open any `.ts` file
2. Make a formatting error (extra spaces, etc.)
3. Save file
4. Expected: File auto-formats on save
5. Make a lint error
6. Expected: ESLint error appears, auto-fixes on save

## ✅ CI/CD Workflows

### Verify Workflow Files

```bash
cat .github/workflows/ci.yml
cat .github/workflows/ci-matrix.yml
```

Expected in `ci.yml`:

- [x] Type check step
- [x] Lint step
- [x] Format check step
- [x] Test step
- [x] Build step
- [x] CEM generation step
- [x] Bundle size check step
- [x] Correct component list (13 components)
- [x] Correct package path (`packages/hx-library`)

Expected in `ci-matrix.yml`:

- [x] Node matrix: 18, 20, 22
- [x] OS matrix: ubuntu, macos, windows
- [x] 9 total combinations
- [x] Matrix summary job

### Test CI Workflows

```bash
# Create test branch
git checkout -b test/ci-workflows

# Make and commit a change
echo "// CI test" >> packages/hx-library/src/index.ts
git add packages/hx-library/src/index.ts
git commit -m "test: trigger CI workflows"

# Push to trigger CI
git push origin test/ci-workflows
```

Then on GitHub:

1. Open the repository
2. Go to Actions tab
3. Verify both workflows run:
   - [x] CI workflow runs (main checks)
   - [x] CI Matrix workflow runs (9 jobs)
4. Verify all checks pass
5. Create PR to verify PR template

### Cleanup

```bash
git checkout main
git branch -D test/ci-workflows
git push origin --delete test/ci-workflows
```

## ✅ GitHub Configuration

### Verify CODEOWNERS

```bash
cat .github/CODEOWNERS
```

Expected:

- [x] Default owner set
- [x] Component library paths protected
- [x] CI/CD workflow paths protected
- [x] Package.json paths protected
- [x] Documentation paths protected

### Verify PR Template

```bash
cat .github/pull_request_template.md
```

Expected sections:

- [x] Description
- [x] Type of change
- [x] Related issues
- [x] Quality checklist
- [x] Accessibility checklist
- [x] Testing section
- [x] Performance impact
- [x] Breaking changes
- [x] Pre-merge checklist

### Test PR Template

1. Create test PR on GitHub
2. Verify template auto-populates
3. Fill out template
4. Verify all sections present

## ✅ Documentation

### Verify Documentation Files

```bash
ls -la docs/
cat CONTRIBUTING.md
cat BADGES.md
cat README.md | head -20
```

Expected files:

- [x] `docs/quality-automation.md`
- [x] `docs/phase-0-implementation-summary.md`
- [x] `docs/QUICK-REFERENCE.md`
- [x] `docs/infrastructure-testing-checklist.md`
- [x] `CONTRIBUTING.md`
- [x] `BADGES.md`
- [x] `README.md` (with badges)

### Verify Documentation Content

Read through:

- [x] Quality automation guide is comprehensive
- [x] Contributing guide covers all workflows
- [x] Quick reference has all commands
- [x] Implementation summary is accurate
- [x] Badges file has all badges
- [x] README has badges at top

## ✅ Bundle Size Checks

### Verify Bundle Size Check Works

```bash
# Build the library
npm run build:library

# Check bundle sizes
for component in hx-button hx-card hx-text-input; do
  file="packages/hx-library/dist/components/${component}/index.js"
  if [ -f "$file" ]; then
    size=$(wc -c < "$file" | tr -d ' ')
    gzip_size=$(gzip -c "$file" | wc -c | tr -d ' ')
    echo "$component: $(echo "scale=2; $gzip_size / 1024" | bc)KB gzipped"
  fi
done

# Check full bundle
full="packages/hx-library/dist/index.js"
if [ -f "$full" ]; then
  size=$(wc -c < "$full" | tr -d ' ')
  gzip_size=$(gzip -c "$full" | wc -c | tr -d ' ')
  echo "Full bundle: $(echo "scale=2; $gzip_size / 1024" | bc)KB gzipped"
fi
```

Expected:

- [x] All component bundles < 5KB gzipped
- [x] Full bundle < 50KB gzipped

## ✅ End-to-End Workflow Test

### Complete Development Workflow

```bash
# 1. Create feature branch
git checkout -b test/e2e-workflow

# 2. Make a change to a component
echo "// E2E test" >> packages/hx-library/src/components/hx-button/hx-button.ts

# 3. Stage the change
git add packages/hx-library/src/components/hx-button/hx-button.ts

# 4. Commit (triggers pre-commit hook)
git commit -m "feat(button): test e2e workflow"
# Expected: Pre-commit hook runs and passes

# 5. Push (triggers pre-push hook)
git push origin test/e2e-workflow
# Expected: Pre-push hook runs and passes
# Expected: GitHub CI runs

# 6. Create PR
# Expected: PR template appears
# Expected: CI checks run
# Expected: All checks pass

# 7. Cleanup
git checkout main
git branch -D test/e2e-workflow
git push origin --delete test/e2e-workflow
```

## ✅ Final Verification

### All Systems Green

- [x] Git hooks installed and working
- [x] Commit message validation works
- [x] Pre-commit hook enforces quality
- [x] Pre-push hook runs full suite
- [x] Package.json scripts work
- [x] EditorConfig enforces standards
- [x] VSCode integration working
- [x] CI workflows configured correctly
- [x] CODEOWNERS in place
- [x] PR template available
- [x] Documentation complete
- [x] Bundle size checks working
- [x] End-to-end workflow successful

## 📝 Testing Notes

Record any issues or observations during testing:

```
Date: _______________
Tester: _____________

Issues found:
1.
2.
3.

Resolutions:
1.
2.
3.

Additional notes:


```

## ✅ Sign-Off

**Phase 0 Infrastructure Testing Complete**

- [ ] All checklist items verified
- [ ] All tests passed
- [ ] No blocking issues found
- [ ] Documentation reviewed
- [ ] Infrastructure production-ready

**Tested by**: **\*\***\_\_\_**\*\***
**Date**: **\*\***\_\_\_**\*\***
**Signature**: **\*\***\_\_\_**\*\***

---

**Next Steps**: Proceed to Phase 1 - Test Infrastructure Hardening
