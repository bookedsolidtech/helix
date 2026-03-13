# PR Workflow — MANDATORY STEPS

## After Creating a PR, ALWAYS Enable Auto-Merge

Immediately after `gh pr create`, run:

```bash
gh pr merge <PR_NUMBER> --auto --merge --repo bookedsolidtech/helix
```

**Why:** All feature PRs target `dev`. Auto-merge queues the PR to merge automatically once CI passes and CodeRabbit approves. You MUST enable this — never leave a PR without auto-merge enabled.

## For Test-Only PRs: Add skip-changeset Label

If your PR only modifies `*.test.ts` files (no component source changes), add the `skip-changeset` label:

```bash
gh pr edit <PR_NUMBER> --add-label "skip-changeset" --repo bookedsolidtech/helix
```

**Why:** Test-only changes don't require a changeset. Without this label, the `Changeset Required` CI check will fail and block merge.

## Complete PR Creation Sequence

```bash
# 1. Create PR
PR_URL=$(gh pr create \
  --repo bookedsolidtech/helix \
  --base dev \
  --title "..." \
  --body "...")

# 2. Extract PR number
PR_NUMBER=$(echo $PR_URL | grep -oE '[0-9]+$')

# 3. Enable auto-merge (MANDATORY)
gh pr merge $PR_NUMBER --auto --merge --repo bookedsolidtech/helix

# 4. If test-only PR, add skip-changeset label
gh pr edit $PR_NUMBER --add-label "skip-changeset" --repo bookedsolidtech/helix
```

## Commit Discipline — One Push Per Review Cycle (MANDATORY)

**Do NOT create a PR or push until all work — including formatting — is complete in a single commit.**

CodeRabbit reviews on every push (`auto_incremental_review: true`). Every push triggers a new CR review cycle. Pushing intermediate commits (e.g., code change then a separate format fix) causes:
- CR to review incomplete/unformatted code
- Stale CHANGES_REQUESTED that blocks auto-merge even after subsequent fixes
- Multiple wasted review cycles

**The required sequence:**
```bash
# 1. Write all code changes
# 2. Run format immediately — include in the SAME commit
npm run format
git add -A
HUSKY=0 git commit -m "feat: ..."   # ONE commit with code + format together

# 3. Run verify before pushing
npm run verify

# 4. Push ONCE — this triggers ONE CodeRabbit review
HUSKY=0 git push origin <branch>

# 5. Create PR (triggers auto-merge + CR review)
gh pr create ...
gh pr merge <N> --auto --merge --repo bookedsolidtech/helix
```

**Remediation cycles follow the same rule:**
- Fix ALL CodeRabbit feedback in one pass
- Run `npm run format` and include in the same commit
- Push ONCE
- Do NOT push partial fixes then format separately

**Never do this:**
```bash
git commit -m "fix: address CodeRabbit feedback"
git push   # ← CR reviews incomplete state
git commit -m "fix(format): prettier"
git push   # ← CR reviews AGAIN on format-only change, confusion ensues
```

## Never Leave These for Ava to Fix

- ❌ PR without auto-merge → Ava has to run bash to fix it
- ❌ Test-only PR missing skip-changeset → CI fails, wastes a cycle
- ❌ Separate format commit after code commit → triggers extra CR reviews, causes stale CHANGES_REQUESTED
- ✅ Always enable auto-merge immediately after PR creation
- ✅ Always add skip-changeset to test-only PRs
- ✅ Always batch format into the same commit as code changes
