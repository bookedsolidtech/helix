# Agent Push Protocol — ZERO TOLERANCE

Every agent push MUST follow this exact sequence. No shortcuts. No exceptions.
Pushing code that fails CI is a wasted cycle and an unacceptable failure.

---

## The Push Sequence

### Step 1: Format

```bash
pnpm run format
git add -u
```

### Step 2: Preflight (ALL CI gates locally)

```bash
pnpm run preflight
```

If this fails: **FIX THE ERRORS.** Do not push. Do not skip.

`preflight` runs ALL CI-equivalent gates in order:
1. Lint
2. Format check
3. Type check
4. Build (excludes docs)
5. Smart tests + coverage (changed components only)
6. CEM (if library source changed)
7. Changeset check (if component source changed)

**This replaces the old separate `verify` + `test:smart` steps.**

**NEVER run `pnpm run test` or `pnpm run test:library` — these run the full suite and are forbidden.**

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
- **Skip preflight** -- CI lint/type-check/build/tests/coverage fail -- wasted cycle
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
pnpm run verify           # Ensure everything still passes
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
