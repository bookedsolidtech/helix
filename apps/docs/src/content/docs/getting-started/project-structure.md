---
title: Project Structure
description: Understanding the HELIX monorepo structure and organization
---

HELIX is organized as a **Turborepo monorepo** with npm workspaces. This structure enables independent versioning, shared tooling, and efficient builds.

## Directory Layout

```
helix/
├── package.json              # Root: Turborepo + npm workspaces
├── turbo.json                # Turborepo task configuration
├── tsconfig.base.json        # Shared TypeScript config
├── .nvmrc                    # Node.js version (20.x)
│
├── apps/
│   ├── docs/                 # Astro/Starlight documentation (port 3150)
│   │   ├── astro.config.mjs  # Starlight configuration
│   │   └── src/
│   │       ├── content/docs/ # Documentation pages (Markdown/MDX)
│   │       ├── components/   # Custom Astro components
│   │       └── styles/       # Custom CSS
│   │
│   ├── storybook/            # Storybook component playground (port 3151)
│   │
│   └── admin/                # Admin Dashboard — health scoring (port 3159)
│
├── packages/
│   ├── hx-library/           # @helixui/library — Lit 3.x components
│   └── hx-tokens/            # @helixui/tokens — design token system
│
└── .claude/agents/           # Specialized engineering agents
```

## Key Configuration Files

| File                         | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `turbo.json`                 | Defines build tasks, dependencies, and caching |
| `tsconfig.base.json`         | Shared TypeScript strict mode settings         |
| `.nvmrc`                     | Pins Node.js to version 20.x                   |
| `apps/docs/astro.config.mjs` | Starlight sidebar, theme, and plugins          |

## npm Scripts

```bash
npm run dev              # Start all apps in dev mode
npm run dev:docs         # Start only the docs site
npm run dev:storybook    # Start Storybook
npm run build            # Build all packages and apps
npm run type-check       # Run TypeScript checking across all packages
npm run test             # Run Vitest browser tests
npm run verify           # lint + format:check + type-check (pre-push gate)
```

## Next Steps

- [Monorepo Architecture](/architecture/monorepo/) - Deep dive into the monorepo design
- [Build Pipeline](/architecture/build-pipeline/) - How Turborepo orchestrates builds
