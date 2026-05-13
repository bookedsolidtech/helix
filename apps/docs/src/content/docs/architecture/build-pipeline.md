---
title: Build Pipeline
description: Turborepo build orchestration and CI/CD pipeline for HELIX
---

The HELIX build pipeline uses **Turborepo** for local development and CI/CD, ensuring fast, reproducible builds.

## Local Development

Use `pnpm run` scripts (defined in the root `package.json`) rather than invoking `turbo` directly:

```bash
# Start all dev servers
pnpm run dev

# Start only docs
pnpm run dev:docs

# Build everything
pnpm run build

# Build only the component library
pnpm run build:library

# Build only docs
pnpm run build:docs

# Type-check all packages
pnpm run type-check
```

## Build Order

Turborepo automatically resolves build order from `dependsOn` relationships in `turbo.json`:

1. **`packages/hx-tokens`** — design token source compiled to CSS custom properties
2. **`packages/hx-library`** — Lit 3.x components built with Vite; **CEM** (Custom Elements Manifest) generated inline by the `build` script
3. **`packages/hx-react`** — React wrappers auto-generated from CEM via `scripts/generate-react-wrappers.ts`
4. **`apps/storybook`**, **`apps/docs`**, **`apps/admin`** — consume the built packages

The `packages/drupal-starter` `helixui.libraries.yml` is generated on-demand by `pnpm run generate:drupal-libraries`; it is not part of the automatic build order.

## Output Caching

Turborepo caches build outputs by default:

- **Local cache**: `.turbo/` directory (gitignored)
- **Remote cache**: not configured; CI uses pnpm dependency cache + Turbo local cache only
- **Cache keys**: Hashed from source files, config, and environment variables

Cached outputs per task (from `turbo.json`):

| Task | Cached Outputs |
| --- | --- |
| `build` | `dist/**`, `build/**`, `.astro/**`, `.next/**`, `custom-elements.json`, `aaa-verdicts.json`, `figma-inventory.json` |
| `cem` | `custom-elements.json` |
| `generate` | `packages/hx-react/src/components/**` |
| `generate:drupal-libraries` | `packages/drupal-starter/helixui.libraries.yml` |
| `test` | `.cache/test-results.json` |

## CI/CD Pipeline

The CI/CD pipeline (`.github/workflows/ci.yml`) runs on PRs to `dev`, `staging`, and `main`, and on pushes to those branches. Audit batch branches and non-source PRs skip most jobs via the `detect-changes` filter.

### Job Overview

| Job | Purpose | Blocks merge? |
| --- | --- | --- |
| `secret-scan` | Detect leaked credentials (gitleaks) | Yes |
| `lint` | ESLint 9 flat config | Yes |
| `format` | Prettier format check | Yes |
| `type-check` | TypeScript strict — zero errors | Yes |
| `build` | Vite library build + CEM + publish dry-run | Yes |
| `audit` | pnpm security audit | Informational (network failures + retired audit endpoint don't fail quality-gates) |
| `test` | Vitest browser mode, path-filtered to changed components | Skippable (no source changes) |
| `vrt` | Playwright visual regression (Chromium only) | Skippable |
| `changeset` | Requires `.changeset/*.md` for source changes | Skippable via `skip-changeset` label / audit branches / non-source PRs |
| `bundle-size` | Enforces per-component size budgets | Skippable |
| `a11y-audit` | axe-core AA regression guard against static Storybook build | Yes |
| `storybook-tests` | Storybook 10 interaction tests | Yes |
| `quality-gates` | Aggregate required status check for branch protection | — |

The canonical accessibility cert posture is **WCAG 2.2 AAA on the P0 surface**, asserted by `pnpm aaa:audit` and gated locally by preflight (`check-aaa-verdicts.mjs`). The CI `a11y-audit` is an additional AA regression sweep, not the cert authority.

### Aggregate Quality Gate

Branch protection points to a single `quality-gates` job rather than individual jobs. This means adding or renaming CI jobs never requires a GitHub admin to update branch protection rules.

### Smart Test Filtering

The `test` job uses `git diff` to identify which component source files changed, then runs Vitest only for those components — typically just the changed components' test files rather than the full suite (3,200+ tests).

```bash
# Equivalent local command
pnpm run test:smart
```

### Preflight (local equivalent of CI)

Before every push, run the full preflight check to catch CI failures locally:

```bash
pnpm run preflight
```

`preflight` runs 11 gates in order (per `scripts/preflight.sh`): lint → format:check → type-check → build → smart tests → CEM regen drift → changeset check → full test matrix (conditional) → Docker CI parity (conditional) → AAA verdicts (refuses regression to Partial/Fail) → docs version drift (refuses stale `@helixui/*` pins).
