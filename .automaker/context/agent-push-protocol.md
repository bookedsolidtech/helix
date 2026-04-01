# Agent Push Protocol — ZERO TOLERANCE

Every agent push MUST follow this exact sequence. No shortcuts. No exceptions.
Pushing code that fails CI is a wasted cycle and an unacceptable failure.

**CODE DOES NOT LEAVE THIS MACHINE UNTIL IT PASSES THE LOCAL DOCKER CI GATE.**

---

## The Push Sequence

### Step 1: Format

```bash
pnpm run format
git add -u
```

### Step 2: Preflight (8 gates including Docker CI)

```bash
pnpm run preflight
```

If this fails: **FIX THE ERRORS.** Do not proceed to Step 3.

`preflight` runs ALL CI-equivalent gates in order:
1. Lint
2. Format check
3. Type check
4. Build (excludes docs)
5. Smart tests + coverage (changed components only)
6. CEM (if library source changed)
7. Changeset check (if component source changed)
8. Full test suite (all components — catches CI Matrix failures locally)
9. Docker CI via act (full GitHub Actions parity)

Gate 8 runs the FULL test suite (not just changed components). This is the
critical gate that catches cross-component regressions that CI Matrix (Node
20/22/24) would catch. The vitest hang watchdog from test-batch.sh is
integrated to prevent timeouts.

Gate 9 runs the quality gates inside Docker containers — the exact same
environment as GitHub Actions CI. If it passes here, it WILL pass on GitHub.

If Docker is not running, start it. If `act` is not installed, use `SKIP_ACT=1 pnpm run preflight`
to skip Gate 9 only (all other gates still run). This should be rare — Docker CI is the final guarantee.

**`pnpm run test:smart` is for development iteration ONLY.** It tests only changed
components and does NOT provide CI Matrix parity. Preflight Gate 8 runs the full
suite to close this gap. Never rely on `test:smart` alone before pushing.

### Step 3: Commit

```bash
HUSKY=0 git commit -m "type(scope): lowercase message"
```

Subject must be ALL LOWERCASE. Max 120 chars. See commit-quality-gates.md.

### Step 4: Push ONCE

```bash
HUSKY=0 git push origin <branch>
```

ONE push. ONE CodeRabbit review cycle. Never push twice.

### Step 5: Create PR + Auto-Merge

```bash
PR_URL=$(gh pr create \
  --repo bookedsolidtech/helix \
  --base dev \
  --title "type(scope): lowercase description" \
  --body "Description of changes")

PR_NUMBER=$(echo $PR_URL | grep -oE '[0-9]+$')

gh pr merge $PR_NUMBER --auto --merge --repo bookedsolidtech/helix
```

If test-only PR (only `*.test.ts` files changed), add the skip-changeset label:

```bash
gh pr edit $PR_NUMBER --add-label "skip-changeset" --repo bookedsolidtech/helix
```

---

## What Happens If You Skip Steps

- **Skip format** -- CI format check fails -- wasted cycle
- **Skip preflight** -- CI lint/type-check/build/tests/coverage/Docker CI fail -- wasted cycle
- **Push twice** -- CodeRabbit reviews twice -- stale CHANGES_REQUESTED blocks merge
- **Skip changeset** -- Changeset Required check fails -- wasted cycle

---

## Changeset Requirement

`pnpm run preflight` checks for changesets automatically. If component source was
modified and no changeset exists, preflight will fail with instructions.

To manually create a changeset:

```bash
pnpm exec changeset
```

Select the package, bump type, and write a description.
Commit the `.changeset/*.md` file WITH your code changes (same commit).

**Exception:** Test-only changes (only `*.test.ts` modified) -- add `skip-changeset` label to PR instead.
To bypass preflight's changeset check: `SKIP_CHANGESET=1 pnpm run preflight`

**CRITICAL:** Use a unique changeset filename. Parallel features with the same changeset filename cause cascading merge conflicts.

---

## Remediation Pushes (Fixing CodeRabbit Feedback)

The same sequence applies when fixing CodeRabbit feedback:

1. Fix ALL feedback in one pass
2. `pnpm run format && git add -u`
3. `pnpm run preflight` -- must pass
4. `HUSKY=0 git commit -m "fix(scope): address coderabbit feedback"`
5. `HUSKY=0 git push origin <branch>` -- ONE push

Do NOT push partial fixes then format separately. That triggers extra review cycles.

---

## CI Matrix Parity (Node 20/22/24)

CI runs the full test suite on Node 20, 22, and 24. Preflight Gate 8 runs
the full suite on your current Node version. For complete CI Matrix parity
(all three Node versions), use the act-ci matrix flag:

```bash
./scripts/act-ci.sh --matrix
```

This runs the full test suite in Docker on Node 20, 22, and 24 — exactly
what CI Matrix does. Use this when:
- Debugging CI Matrix failures that pass locally
- Before pushing changes to Node-version-sensitive code (e.g., API changes)
- When preflight passes but CI Matrix fails

---

## The One Rule

If `pnpm run preflight` fails, you do NOT push. Period.
Fix the errors first. Then push. This is non-negotiable.

---

## Workspace and Dependency Changes

If your changes include:
- **New packages** (new `package.json` file anywhere in the monorepo)
- **Dependency changes** (added/removed/updated in any `package.json`)
- **Lockfile modifications** (any change to `pnpm-lock.yaml`)

You MUST run before pushing:
```bash
pnpm install              # Regenerates pnpm-lock.yaml
pnpm run verify           # Ensure everything still passes (lint + format:check + type-check + build)
git add pnpm-lock.yaml    # Stage the updated lockfile
```

Failure to do this will cause CI to fail at `pnpm install --frozen-lockfile`.

## sideEffects Configuration — CRITICAL

NEVER change `sideEffects` in `packages/hx-library/package.json` to `true`.
Always use a granular array. `sideEffects: true` breaks coverage detection and tree-shaking.

Correct:
```json
"sideEffects": ["./dist/components/*/index.js", "./src/components/*/index.ts", "**/*.css"]
```

Wrong:
```json
"sideEffects": true
```
