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

### Step 2: Verify (lint + format:check + type-check)

```bash
pnpm run verify
```

If this fails: **FIX THE ERRORS.** Do not push. Do not skip.

### Step 3: Smart Tests (if component source changed)

```bash
pnpm run test:smart
```

If this fails: **FIX THE TESTS.** Do not push. Do not skip.
If no component source files changed, this step is skipped automatically by the command.

**NEVER run `pnpm run test` or `pnpm run test:library` — these run the full suite and are forbidden.**

### Step 4: Commit

```bash
HUSKY=0 git commit -m "type(scope): lowercase message"
```

Subject must be ALL LOWERCASE. Max 120 chars. See commit-quality-gates.md.

### Step 5: Push ONCE

```bash
HUSKY=0 git push origin <branch>
```

ONE push. ONE CodeRabbit review cycle. Never push twice.

### Step 6: Create PR + Auto-Merge

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
- **Skip verify** -- CI lint/type-check fails -- wasted cycle
- **Skip test:smart** -- CI tests fail -- wasted cycle
- **Push twice** -- CodeRabbit reviews twice -- stale CHANGES_REQUESTED blocks merge
- **Skip changeset** -- Changeset Required check fails -- wasted cycle

---

## Changeset Requirement

If your changes touch `packages/hx-library/src/` (anything other than test-only changes), you MUST create a changeset:

```bash
pnpm exec changeset
```

Select the package, bump type, and write a description.
Commit the `.changeset/*.md` file WITH your code changes (same commit).

**Exception:** Test-only changes (only `*.test.ts` modified) -- add `skip-changeset` label to PR instead.

**CRITICAL:** Use a unique changeset filename. Parallel features with the same changeset filename cause cascading merge conflicts.

---

## Remediation Pushes (Fixing CodeRabbit Feedback)

The same sequence applies when fixing CodeRabbit feedback:

1. Fix ALL feedback in one pass
2. `pnpm run format && git add -u`
3. `pnpm run verify` -- must pass
4. `pnpm run test:smart` -- must pass (if component source changed)
5. `HUSKY=0 git commit -m "fix(scope): address coderabbit feedback"`
6. `HUSKY=0 git push origin <branch>` -- ONE push

Do NOT push partial fixes then format separately. That triggers extra review cycles.

---

## The One Rule

If `pnpm run verify` fails, you do NOT push. Period.
If `pnpm run test:smart` fails, you do NOT push. Period.
Fix the errors first. Then push. This is non-negotiable.
