---
title: Build Pipeline
description: Turborepo build orchestration and CI/CD pipeline for HELIX
---

The HELIX build pipeline uses **Turborepo** for local development and CI/CD, ensuring fast, reproducible builds.

## Local Development

```bash
# Start all apps
turbo run dev

# Start only docs
turbo run dev --filter=docs

# Build everything
turbo run build

# Type-check all packages
turbo run type-check
```

## Build Order

Turborepo automatically resolves the build order based on `dependsOn` relationships:

1. `packages/hx-library` builds first (upstream dependency)
2. `apps/storybook` builds after library (depends on `^build`)
3. `apps/docs` builds after library (depends on `^build`)

## Output Caching

Turborepo caches build outputs by default:

- **Local cache**: `.turbo/` directory (gitignored)
- **Remote cache**: Available via Vercel or self-hosted (CI/CD)
- **Cache keys**: Hashed from source files, config, and environment

## CI/CD Pipeline

The CI/CD pipeline runs on every PR and merge to `dev`:

- TypeScript strict type checking
- Unit tests (Vitest 3.x browser mode)
- Visual regression tests (Playwright VRT)
- Accessibility audits (axe-core)
- Documentation build verification
- npm pack dry-run (verifies publishable output)

See the [Pre-Planning Architecture document](/pre-planning/architecture/) for the complete pipeline design.
