# Graphite Workflow

This document describes how to use [Graphite CLI](https://graphite.dev) for stack-aware PR management in the helix monorepo.

## Overview

Helix uses a three-branch promotion model:

```
feature/* → dev → staging → main
```

Graphite makes it easy to manage chains of dependent branches — for example, when a component feature depends on a token migration that hasn't landed yet. Instead of waiting, you stack your branch on top of the in-progress work and submit both as a linked PR stack.

**Trunk**: `main` (configured in `.graphite_config`)

---

## Installation

```bash
npm install -g @withgraphite/graphite-cli
gt auth          # authenticate with your GitHub account
```

Verify the install:

```bash
gt --version
gt log short     # should show your current branch relative to main
```

---

## Daily Workflow

### 1. Start a Feature Branch

Always branch off `dev` for new feature work:

```bash
git checkout dev
git pull origin dev
gt branch create feat/my-feature
```

This creates `feat/my-feature` stacked on `dev` and registers it in your local Graphite stack.

### 2. Make Changes and Commit

Work normally. Graphite is stack-aware but does not change your commit workflow:

```bash
# ... make changes ...
git add .
git commit -m "feat(button): add loading state"
```

### 3. Submit a PR

```bash
# Submit all branches in your stack as PRs against their parents
gt submit
```

Graphite will:
- Create a PR for `feat/my-feature` targeting `dev`
- Show you a link to each PR

If you have a stack of multiple branches (e.g., `feat/token-fix` → `feat/button-loading`), both PRs are submitted at once, with the correct base branches set automatically.

### 4. Respond to Review Feedback

After changes are requested:

```bash
# ... make fixes ...
git add .
git commit -m "fix: address review feedback"

# Resubmit — updates all open PRs in the stack
gt submit
```

### 5. Keep Your Stack in Sync

When `dev` or other branches in your stack receive new commits:

```bash
gt sync          # pulls latest from remote, rebases your stack
```

---

## Promotion Flow (Maintainers)

The `dev → staging → main` promotion does not use stacking — these are long-lived integration branches. Maintainers open standard PRs for promotions:

| Promotion        | Source    | Target    | Who         |
|------------------|-----------|-----------|-------------|
| QA integration   | `dev`     | `staging` | Maintainers |
| Production release | `staging` | `main`  | Maintainers |

```bash
# Check what's in dev vs staging
gt log short

# Open a promotion PR via GitHub
gh pr create --base staging --head dev --title "chore: promote dev → staging"
```

---

## Stacking Across Blocked Features

When a feature depends on another in-progress feature (e.g., a component needs tokens that are being migrated):

```bash
# Check out the in-progress dependency branch
git checkout feat/token-migration

# Stack your work on top of it
gt branch create feat/button-tokens

# Submit — creates two PRs: token-migration (base: dev), button-tokens (base: token-migration)
gt submit
```

When `feat/token-migration` merges, Graphite automatically retargets `feat/button-tokens` to `dev`.

---

## Common Commands

| Command | Description |
|---------|-------------|
| `gt log short` | Show stack with PR status |
| `gt log` | Show full stack details |
| `gt branch create <name>` | Create a new branch stacked on current |
| `gt submit` | Submit (or update) all PRs in the stack |
| `gt sync` | Pull latest and rebase the stack |
| `gt branch checkout <name>` | Switch to a branch by name or number |
| `gt up` / `gt down` | Move up or down the stack |

---

## Configuration

The repo's Graphite configuration lives in `.graphite_config` at the root:

```json
{
  "trunk": "main",
  "ignoreBranches": []
}
```

- **`trunk`**: The stable base branch. Graphite uses this to determine where stacks end.
- **`ignoreBranches`**: Branches Graphite should not track (empty by default — `dev` and `staging` are visible in stacks).

---

## Troubleshooting

**`gt log short` shows unexpected branches**

Graphite tracks any branch that is reachable from your current branch and not yet merged into trunk. If you see noise, check that old local branches have been deleted.

**Stack rebase conflicts**

```bash
# During a conflicted sync
git mergetool      # resolve conflicts
git rebase --continue
gt sync --continue
```

**PR base branch is wrong**

```bash
# Force-correct the base on GitHub
gt submit --force
```

---

For more information, see the [Graphite documentation](https://docs.graphite.dev).
