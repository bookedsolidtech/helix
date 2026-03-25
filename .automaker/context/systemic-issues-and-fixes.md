# Systemic Issues & Fixes — HELiX CI Pipeline

Last updated: 2026-03-25

This document captures recurring CI failure patterns, their root causes, and applied fixes.
Agents MUST read this before pushing code to prevent repeat failures.

---

## FIXED: hx-react Generated Wrappers Dirty State

**Symptom:** Every worktree creation fails with "Your local changes would be overwritten by merge: packages/hx-react/src/index.ts"
**Root Cause:** `generate-react-wrappers.ts` wrote files without running Prettier. After every dev merge that triggers hx-react regeneration, the output diverged from Prettier-formatted state.
**Fix (PR #1241):** Chain `prettier --write src/` after generation in `packages/hx-react/package.json`:
```json
"generate": "tsx ../../scripts/generate-react-wrappers.ts && prettier --write src/"
```
**Prevention:** The generate script now produces idempotent output. Regenerating produces zero dirty files.

---

## FIXED: CI Coverage Gate False Positives on Stories-Only PRs

**Symptom:** PRs that only modify `.stories.ts` files fail the coverage gate with "0% coverage" for components.
**Root Cause:** The `git diff` component detection in `ci.yml` counted `.stories.ts`, `.test.ts`, and `index.ts` files as component source changes, triggering coverage enforcement.
**Fix (commit 9783f119):** Added `grep -v` filters in ci.yml:
```bash
grep -v '\.stories\.ts' | grep -v '\.test\.ts' | grep -v '/index\.ts'
```
**Prevention:** Only actual component source files (.ts, .styles.ts) trigger coverage enforcement.

---

## KNOWN: sideEffects Configuration Impacts Coverage Scope

**Symptom:** Changing `sideEffects` in `packages/hx-library/package.json` from a granular array to `true` causes 18+ components to show 0% coverage.
**Root Cause:** `sideEffects: true` tells bundlers (and Vitest's v8 coverage) to instrument ALL code, not just explicitly imported modules. Components not directly tested in the PR's test run show 0%.
**Fix:** Use granular sideEffects array instead of `true`:
```json
"sideEffects": ["./dist/components/*/index.js", "./src/components/*/index.ts", "**/*.css"]
```
This preserves custom element registration (the actual side effect) while maintaining tree-shaking for everything else.
**Prevention:** NEVER set `sideEffects: true` in a library package. Always use granular arrays.

---

## KNOWN: New Packages Require pnpm-lock.yaml Update

**Symptom:** CI fails at `pnpm install --frozen-lockfile` — "specifiers in the lockfile don't match specs in package.json"
**Root Cause:** When a new package is added to the monorepo (new `package.json`), the lockfile must be regenerated locally before pushing.
**Fix:** Before pushing any PR that adds a new workspace package:
```bash
pnpm install          # Regenerates pnpm-lock.yaml
git add pnpm-lock.yaml
HUSKY=0 git commit --amend --no-edit
```
**Prevention:** The preflight script should detect lockfile drift. Agents MUST run `pnpm install` when creating new packages.

---

## KNOWN: hx-react/src/index.ts Barrel File Merge Conflicts

**Symptom:** Multiple PRs touching different components all modify `packages/hx-react/src/index.ts`, causing cascade merge conflicts.
**Root Cause:** The barrel file is auto-generated and lists ALL component exports alphabetically. Any PR that adds/modifies components regenerates this file.
**Resolution:** When resolving conflicts in this file, take the UNION of all exports sorted alphabetically. Remove duplicates. The file is generated — its content is deterministic from the CEM.
**Prevention:** The hx-react fix (PR #1241) ensures this file is always Prettier-formatted, reducing diff noise.

---

## KNOWN: Pre-existing hx-data-table.mdx Parse Error

**Symptom:** Docs site build fails with "acorn parse error" on `apps/docs/src/content/docs/components/hx-data-table.mdx`
**Root Cause:** MDX file contains syntax that Astro's acorn parser cannot handle.
**Impact:** Docs builds fail in CI and locally. Does not affect library build, tests, or other CI gates.
**Workaround:** Docs-only PRs that don't touch this file are unaffected. The file needs to be fixed or converted to .md.

---

## AGENT RULES — Preventing CI Failures

### Before EVERY Push
```bash
pnpm run format          # Fix formatting
pnpm run verify          # lint + format:check + type-check
pnpm run test:smart      # Only test changed components
```

### When Creating New Packages
```bash
pnpm install             # Update lockfile
git add pnpm-lock.yaml   # Stage lockfile changes
```

### When Modifying package.json
- NEVER change `sideEffects` to `true` — use granular arrays
- NEVER remove entries from `exports` without a changeset
- Always run `pnpm install` after dependency changes

### When Modifying .styles.ts Files
```bash
pnpm run test:vrt:update  # Update visual regression baselines
git add -A
HUSKY=0 git commit -m "test: update vrt baselines"
```

### Commit Message Rules
- ALL LOWERCASE subjects (no CSS, TypeScript, HTML — use css, typescript, html)
- Max 120 characters
- Valid types: feat, fix, chore, docs, test, refactor, style, perf, ci, build
