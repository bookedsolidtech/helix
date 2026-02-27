# Branch Protection Rules

This document describes the branch protection rules in place for the `clarity-house-press/helix` repository and the rationale behind each rule.

## Branch Overview

The repository uses a three-branch promotion model:

```
feature/* → dev → staging → main
```

| Branch    | Purpose                          | Audience              |
| --------- | -------------------------------- | --------------------- |
| `main`    | Stable, production-ready code    | Consumers / releases  |
| `staging` | Integration QA before production | QA / pre-release      |
| `dev`     | Active development integration   | Engineers / CI        |

---

## Protection Rules by Branch

### `main` — Production

| Rule                       | Setting                                    | Rationale                                                                                         |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Require pull request       | Yes — 1 approving review                   | No direct pushes. Every change is reviewed before reaching consumers.                             |
| Dismiss stale reviews      | Yes                                        | New commits after approval require a fresh review sign-off.                                       |
| Required CI checks         | `Quality Gates`, `Matrix Test Summary`     | Both the full quality gate suite and multi-platform matrix must pass before merge.                |
| Up-to-date branch required | Yes (strict)                               | PRs must be rebased on latest `main` before merging — prevents integration surprises.             |
| Allow force pushes         | No                                         | Protects published history. Force-pushing `main` can corrupt consumer git histories.              |
| Allow branch deletions     | No                                         | `main` must always exist as the stable reference.                                                 |
| Require linear history     | Yes                                        | Squash-merge only. Keeps git log clean and blame accurate — critical for auditing in healthcare.  |

### `staging` — Pre-release QA

| Rule                       | Setting                                | Rationale                                                                                   |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Require pull request       | Yes — 1 approving review               | Integration changes need a review gate before entering staging.                             |
| Dismiss stale reviews      | Yes                                    | Any new push to the PR invalidates the previous approval.                                   |
| Required CI checks         | `Quality Gates`, `Matrix Test Summary` | Same checks as `main` — staging must be production-equivalent.                              |
| Up-to-date branch required | Yes (strict)                           | PRs must be rebased on `staging` before merging.                                            |
| Allow force pushes         | No                                     | Preserves the audit trail for QA sign-off.                                                  |
| Allow branch deletions     | No                                     | `staging` must persist as the QA gate.                                                      |
| Require linear history     | No                                     | Merge commits are acceptable here — full context helps QA trace integration work.           |

### `dev` — Active Development

| Rule                       | Setting          | Rationale                                                                                      |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| Require pull request       | Yes — 1 approval | Feature branches must go through a PR. Prevents broken work landing silently in dev.           |
| Dismiss stale reviews      | No               | Iteration speed matters on dev; frequent small amendments don't require re-review.             |
| Required CI checks         | `Quality Gates`  | Core quality gate must pass. Matrix tests are not required — dev is not multi-platform stable. |
| Up-to-date branch required | Yes (strict)     | Feature branches must be current with `dev` to catch conflicts early.                          |
| Allow force pushes         | No               | Protects collaborative work on shared dev branch.                                              |
| Allow branch deletions     | No               | `dev` must persist as the integration target.                                                  |
| Require linear history     | No               | Not enforced on dev — allows flexibility in local workflow.                                    |

---

## Required CI Checks

Protection rules reference the following check names from `.github/workflows/`:

| Check Name             | Workflow File      | What It Runs                                              |
| ---------------------- | ------------------ | --------------------------------------------------------- |
| `Quality Gates`        | `ci.yml`           | TypeScript, lint, format, tests, Storybook VRT, build, CEM, bundle size |
| `Matrix Test Summary`  | `ci-matrix.yml`    | Tests across Node 18/20/22 on Ubuntu, macOS, Windows      |

Both checks must pass before a PR can merge into `main` or `staging`. Only `Quality Gates` is required for `dev`.

---

## Modifying Protection Rules

Branch protection is configured via the GitHub API. To update rules:

```bash
# View current protection for a branch
gh api repos/clarity-house-press/helix/branches/main/protection

# Update protection (see GitHub REST API docs for the full schema)
gh api -X PUT repos/clarity-house-press/helix/branches/main/protection \
  --input protection.json
```

Any changes to protection rules must be documented in this file and committed to `main`.

---

## Why These Rules Exist

This is an enterprise healthcare component library. The components built here are deployed in clinical environments where software failures can impact patient care. Branch protection rules enforce the following guarantees:

1. **No untested code reaches consumers** — CI must pass before merge into `main`
2. **No history rewrites on shared branches** — force push is disabled on all three branches
3. **Every change is reviewed** — PRs are required on all three branches
4. **Multi-platform stability is verified before production** — matrix tests required for `main` and `staging`
5. **Clean history for auditing** — linear history enforced on `main` for reproducible builds and clear blame

These are not optional guardrails. They exist because the quality bar for healthcare infrastructure is not "good enough" — it is "unbreakable."
