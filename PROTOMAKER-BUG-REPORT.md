# ProtoMaker Bug Report: Worktree Rebase Leaves Detached HEAD

**Date:** 2026-03-04
**Reporter:** AVA (autonomous operator)
**Severity:** High — blocks PR pipeline recovery after crashes
**Affected Version:** protoLabs Studio 0.33.1

## Summary

When a system crash interrupts auto-mode mid-remediation, worktrees are left in a broken state where rebasing onto `origin/dev` results in a **detached HEAD**. The branch ref is not updated, making `git push` report "Everything up-to-date" even though the local HEAD diverges from the remote branch.

## Steps to Reproduce

1. Auto-mode is running, processing multiple features concurrently
2. System crashes mid-remediation cycle (multiple features in `review` status with active PR remediation)
3. After restart, worktrees show merge conflicts with `origin/dev` (because other PRs merged into dev while they were in-flight)
4. Attempt to rebase worktree onto `origin/dev`:
   ```bash
   git -C <worktree-path> fetch origin
   git -C <worktree-path> rebase origin/dev
   ```
5. Resolve conflicts (cache files, index.ts re-exports)
6. `git rebase --continue`
7. Rebase completes, but worktree is now in **detached HEAD state**
8. `git branch -vv` shows: `* (no branch, rebasing feature/xxx) <commit>`
9. The original branch ref still points to the pre-rebase commit
10. `git push origin <branch> --force` reports "Everything up-to-date" because git pushes the stale branch ref, not the detached HEAD

## Expected Behavior

After rebase completes in a worktree, the branch ref should be updated to point to the new HEAD, and `git push --force-with-lease` should push the rebased history.

## Actual Behavior

- Rebase completes but leaves worktree in detached HEAD
- Branch ref is stale (points to pre-rebase commit)
- `git push` does nothing because it sees the stale ref matches remote
- `git branch -f <branch> HEAD` fails with "cannot force update the branch used by worktree"
- No clean way to recover without deleting the worktree

## Affected Features (this session)

- `feature/t1-16-hx-tabs-tabbed-content-panels` (PR #41) — detached HEAD after rebase
- `feature/t1-17-hx-accordion-expandable-sections` (PR #40) — detached HEAD after rebase, also had stashed uncommitted changes

## Root Cause Hypothesis

The git rebase in a worktree context may not properly update the branch ref when:

1. The worktree was created by protoLabs Studio's worktree manager
2. Multiple conflict resolution steps occur during rebase
3. The rebase drops commits that become empty after conflict resolution (e.g., cache-only commits)

It's also possible that the `--theirs` conflict resolution for cache files causes git to complete the rebase in an intermediate state, where `git rebase --continue` reports "no rebase in progress" but the branch metadata wasn't cleaned up.

## Workaround

Instead of rebasing worktrees after a crash:

1. Reset the feature to `backlog` with `failureCount: 0`
2. Let auto-mode re-process the feature fresh (creates a new worktree)
3. The existing PR on GitHub will receive new pushes from the fresh worktree

## Recommendation for ProtoMaker

1. **Post-crash recovery**: Add a `recover_worktrees` tool or crew job that detects worktrees in detached HEAD state and either:
   - Deletes the worktree and resets the feature to backlog
   - Uses `git worktree repair` + merge (not rebase) to fix the branch ref
2. **Prefer merge over rebase**: For worktrees, `git merge origin/dev` is safer than `git rebase origin/dev` because merge doesn't rewrite history and avoids the detached HEAD issue
3. **Crash recovery hook**: On server restart, scan all worktrees for inconsistent state (detached HEAD, stale rebase-in-progress metadata) and auto-reset affected features
4. **Cache files**: Add `packages/hx-library/.cache/` to `.gitignore` — these generated files are the #1 source of merge conflicts and provide no value in version control

## Additional Context

The crash left 17 features in `review` status. Of those:

- 6 had passing CI and were waiting on auto-merge (healthy)
- 2 were already merged but board wasn't updated (board janitor should catch)
- 3 had merge conflicts preventing CI from running
- 4 had CI failures (lint/format/test) from interrupted remediation
- 2 were explicitly `blocked` due to git workflow failures

Total recovery time: ~30 minutes of manual triage before switching to the correct approach (reset to backlog, let auto-mode retry).
