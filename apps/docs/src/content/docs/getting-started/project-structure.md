---
title: Project Structure
description: Understanding the WC-2026 monorepo structure and organization
---

WC-2026 is organized as a **Turborepo monorepo** with npm workspaces. This structure enables independent versioning, shared tooling, and efficient builds.

## Directory Layout

```
wc-2026/
├── package.json              # Root: Turborepo + npm workspaces
├── turbo.json                # Turborepo task configuration
├── tsconfig.base.json        # Shared TypeScript config
├── .nvmrc                    # Node.js version (20.x)
│
├── apps/
│   ├── docs/                 # Astro/Starlight documentation
│   │   ├── astro.config.mjs  # Starlight configuration
│   │   └── src/
│   │       ├── content/docs/ # Documentation pages (Markdown/MDX)
│   │       ├── components/   # Custom Astro components
│   │       └── styles/       # Custom CSS
│   │
│   └── storybook/            # Component playground (Phase 3)
│
├── packages/
│   └── wc-library/           # Lit 3.x components (Phase 2)
│
└── build-plan/               # Original planning documents
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Defines build tasks, dependencies, and caching |
| `tsconfig.base.json` | Shared TypeScript strict mode settings |
| `.nvmrc` | Pins Node.js to version 20.x |
| `apps/docs/astro.config.mjs` | Starlight sidebar, theme, and plugins |

## Turborepo Commands

```bash
turbo run dev            # Start all apps in dev mode
turbo run dev --filter=docs  # Start only the docs site
turbo run build          # Build all packages and apps
turbo run type-check     # Run TypeScript checking across all packages
turbo run clean          # Remove all build artifacts
```

## Next Steps

- [Monorepo Architecture](/architecture/monorepo/) - Deep dive into the monorepo design
- [Build Pipeline](/architecture/build-pipeline/) - How Turborepo orchestrates builds
