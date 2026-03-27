---
title: Project Structure
description: Understanding the HELIX monorepo structure and organization
---

HELIX is organized as a **Turborepo monorepo** with pnpm workspaces. This structure enables independent versioning, shared tooling, and efficient builds.

## Directory Layout

```
helix/
├── package.json              # Root: Turborepo + pnpm workspaces
├── pnpm-workspace.yaml       # pnpm workspace package globs
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
│   ├── admin/                # Admin Dashboard — health scoring (port 3159)
│   │
│   └── mcp-servers/          # MCP server apps (CEM analyzer, health scorer, etc.)
│
├── packages/
│   ├── hx-library/           # @helixui/library — Lit 3.x components
│   ├── hx-tokens/            # @helixui/tokens — design token system
│   ├── hx-react/             # @helixui/react — auto-generated React wrappers
│   ├── drupal-behaviors/     # @helixui/drupal-behaviors — Drupal JS behaviors
│   ├── drupal-starter/       # @helixui/drupal-starter — Drupal integration starter
│   ├── react-starter/        # React starter template
│   └── helixui-mcp/          # @helixui/mcp — MCP server for design system tooling
│
└── .claude/agents/           # Specialized engineering agents
```

## Key Configuration Files

| File                         | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `pnpm-workspace.yaml`        | Declares workspace package globs for pnpm      |
| `turbo.json`                 | Defines build tasks, dependencies, and caching |
| `tsconfig.base.json`         | Shared TypeScript strict mode settings         |
| `.nvmrc`                     | Pins Node.js to version 20.x                   |
| `apps/docs/astro.config.mjs` | Starlight sidebar, theme, and plugins          |

## Build Pipeline

Turborepo orchestrates builds with task dependency awareness:

| Task             | Depends On       | Description                                    |
| ---------------- | ---------------- | ---------------------------------------------- |
| `build`          | `^build`         | Build all packages and apps in dependency order |
| `type-check`     | `^build`         | TypeScript checking (requires build artifacts) |
| `cem`            | `^build`         | Generate Custom Elements Manifest              |
| `generate`       | `^cem`           | Generate React wrappers from CEM               |
| `lint`           | `^build`         | ESLint across all packages                     |
| `test`           | `^build`         | Vitest browser tests                           |
| `test:smart`     | —                | Tests for changed components only (no cache)   |

## pnpm Scripts

```bash
pnpm run dev              # Start all apps in dev mode
pnpm run dev:docs         # Start only the docs site
pnpm run dev:storybook    # Start Storybook
pnpm run build            # Build all packages and apps
pnpm run type-check       # Run TypeScript checking across all packages
pnpm run test             # Run Vitest browser tests
pnpm run test:smart       # Run tests for changed components only
pnpm run verify           # lint + format:check + type-check (pre-push gate)
pnpm run preflight        # Full CI equivalent: verify + smart tests + CEM + changeset check
```

## Next Steps

- [Monorepo Architecture](/architecture/monorepo/) - Deep dive into the monorepo design
- [Build Pipeline](/architecture/build-pipeline/) - How Turborepo orchestrates builds
