---
title: Build Pipeline
description: Turborepo build orchestration and CI/CD pipeline for HELIX
---

The HELIX build pipeline uses **Turborepo** for local development and CI/CD, ensuring fast, reproducible builds.

## Local Development

The preferred way to invoke build tasks is through the npm scripts defined at the repo root — they delegate to Turborepo:

```bash
# Start all apps
npm run dev

# Start only docs
npm run dev:docs

# Build everything
npm run build

# Type-check all packages
npm run type-check
```

Direct `turbo run` invocations also work:

```bash
turbo run dev --filter=docs
turbo run build
turbo run type-check
```

## Build Order

Turborepo automatically resolves the build order based on `dependsOn` relationships defined in `turbo.json`:

1. `packages/hx-library` builds first (upstream dependency — all apps depend on it)
2. `apps/storybook` builds after library (depends on `^build`)
3. `apps/docs` builds after library (depends on `^build`)
4. `apps/admin` builds after library (depends on `^build`)

## Output Caching

Turborepo caches build outputs by default:

- **Local cache**: `.turbo/` directory (gitignored)
- **Remote cache**: Available via Vercel or self-hosted (CI/CD)
- **Cache keys**: Hashed from source files, config, and environment

Caching means a `turbo run build` with no changes resolves in under a second. The CI pipeline benefits from this on every PR — unchanged packages are skipped entirely.

## CI/CD Pipeline

The CI pipeline runs on every PR and push to protected branches:

- TypeScript type checking (`npm run type-check`)
- Full test suite — Vitest browser mode against real Chromium (`npm run test`)
- Accessibility audits via axe-core (integrated in Vitest tests)
- Visual regression tests — Playwright against Storybook (`npm run test:vrt`)
- Documentation build verification (`npm run build:docs`)
- Pre-push quality gate: lint + format:check + type-check (`npm run verify`)

## Quality Gate

Before any push, `npm run verify` must pass:

```bash
npm run verify   # runs: lint + format:check + type-check
```

This is the last line of defense before CI. It catches the fast failures (type errors, lint violations, formatting drift) locally rather than burning CI minutes.

See the [Pre-Planning Architecture document](/pre-planning/architecture/) for the complete pipeline design.
