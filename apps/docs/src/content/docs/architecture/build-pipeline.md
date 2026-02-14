---
title: Build Pipeline
description: Turborepo build orchestration and CI/CD pipeline for WC-2026
---

The WC-2026 build pipeline uses **Turborepo** for local development and CI/CD, ensuring fast, reproducible builds.

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

1. `packages/wc-library` builds first (upstream dependency)
2. `apps/storybook` builds after library (depends on `^build`)
3. `apps/docs` builds after library (depends on `^build`)

## Output Caching

Turborepo caches build outputs by default:

- **Local cache**: `.turbo/` directory (gitignored)
- **Remote cache**: Available via Vercel or self-hosted (CI/CD)
- **Cache keys**: Hashed from source files, config, and environment

## CI/CD Pipeline (Planned)

The CI/CD pipeline will include:

- TypeScript type checking
- Unit tests (Vitest)
- Visual regression tests (Chromatic)
- Accessibility audits (axe-core)
- Documentation build verification
- Deployment to CDN

See the [Pre-Planning Architecture document](/pre-planning/architecture/) for the complete pipeline design.
