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
pnpm turbo dev --filter=docs

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
2. **`packages/hx-library`** — Lit 3.x components built with Vite; **CEM** (Custom Elements Manifest) generated
3. **`packages/hx-react`** — React wrappers auto-generated from CEM via `generate-react-wrappers.ts`
4. **`packages/drupal-starter`** — `helixui.libraries.yml` generated from CEM for Drupal asset management
5. **`apps/storybook`**, **`apps/docs`**, **`apps/admin`** — consume the built packages

## Output Caching

Turborepo caches build outputs by default:

- **Local cache**: `.turbo/` directory (gitignored)
- **Remote cache**: Available via Vercel or self-hosted (CI/CD)
- **Cache keys**: Hashed from source files, config, and environment variables

Cached outputs per task:

| Task | Cached Outputs |
| --- | --- |
| `build` | `dist/**`, `build/**`, `.astro/**`, `.next/**` |
| `cem` | `custom-elements.json` |
| `generate` | `packages/hx-react/src/components/**` |
| `generate:drupal-libraries` | `packages/drupal-starter/helixui.libraries.yml` |
| `test` | `.cache/test-results.json` |

## CI/CD Pipeline

The CI/CD pipeline (`.github/workflows/ci.yml`) runs on every PR and push to `dev`. Jobs run in parallel where possible, with `secret-scan` as a blocking prerequisite for all substantive jobs.

### Job Overview

| Job | Purpose | Blocks merge? |
| --- | --- | --- |
| `secret-scan` | Detect leaked credentials (gitleaks) | Yes |
| `lint` | ESLint 9 flat config | Yes |
| `format` | Prettier format check | Yes |
| `type-check` | TypeScript strict — zero errors | Yes |
| `build` | Vite library build + CEM + publish dry-run | Yes |
| `audit` | pnpm security audit (critical level) | Yes |
| `test` | Vitest browser mode, path-filtered to changed components | Skippable (no source changes) |
| `vrt` | Playwright visual regression (Chromium/Firefox/WebKit) | Skippable |
| `changeset` | Requires `.changeset/*.md` for component source changes | Skippable (test-only PRs) |
| `bundle-size` | Enforces per-component size budgets | Skippable |
| `a11y-audit` | axe-core WCAG 2.1 AA compliance | Informational |
| `storybook-tests` | Storybook 10 interaction tests | Informational |
| `quality-gates` | Aggregate required status check for branch protection | — |

### Aggregate Quality Gate

Branch protection points to a single `quality-gates` job rather than individual jobs. This means adding or renaming CI jobs never requires a GitHub admin to update branch protection rules.

### Smart Test Filtering

The `test` job uses `git diff` to identify which component source files changed, then runs Vitest only for those components. A single-component PR runs 20–50 tests in under a minute rather than the full suite (3,200+ tests).

```bash
# Equivalent local command
pnpm run test:smart
```

### Preflight (local equivalent of CI)

Before every push, run the full preflight check to catch CI failures locally:

```bash
pnpm run preflight
```

`preflight` runs all CI-equivalent gates in order: lint → format:check → type-check → build → smart tests + coverage → CEM → changeset check.
