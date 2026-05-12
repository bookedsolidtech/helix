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
├── .nvmrc                    # Node.js version (22.x)
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
│   ├── hx-icons/             # @helixui/icons — icon registry (required peer of @helixui/library)
│   ├── hx-tokens/            # @helixui/tokens — design token system
│   ├── hx-react/             # @helixui/react — auto-generated React wrappers
│   ├── drupal-behaviors/     # @helixui/drupal-behaviors — Drupal JS behaviors
│   ├── drupal-starter/       # @helixui/drupal-starter — Drupal integration starter
│   ├── react-starter/        # @helixui/react-starter — reference React-app scaffold consuming the wrappers
│   └── helixui-mcp/          # @helixui/mcp — MCP server for design system tooling
│
└── .claude/agents/           # Specialized engineering agents
```

> `create-helix` is the consumer scaffolding CLI published on npm as
> `create-helix` (no `-app` suffix). The source lives **inside this monorepo**
> at [`packages/create-helix-app/`](https://github.com/bookedsolidtech/helix/tree/main/packages/create-helix-app)
> — contributors update it from the same checkout as the rest of the
> workspace.

## Key Configuration Files

| File                         | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `pnpm-workspace.yaml`        | Declares workspace package globs for pnpm      |
| `turbo.json`                 | Defines build tasks, dependencies, and caching |
| `tsconfig.base.json`         | Shared TypeScript strict mode settings         |
| `.nvmrc`                     | Pins Node.js to version 22.x                   |
| `apps/docs/astro.config.mjs` | Starlight sidebar, theme, and plugins          |

## Build Pipeline

Turborepo orchestrates builds with task dependency awareness:

| Task         | Depends On | Description                                                                                                                |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `build`      | `^build`   | Build all packages and apps in dependency order                                                                            |
| `type-check` | `^build`   | TypeScript checking (requires build artifacts)                                                                             |
| `cem`        | `^build`   | Generate Custom Elements Manifest                                                                                          |
| `generate`   | `^cem`     | Generate React wrappers from CEM                                                                                           |
| `lint`       | `^build`   | ESLint across all packages                                                                                                 |
| `test`       | `^build`   | Workspace test scripts via Turbo (mix of Vitest browser-mode for library/storybook + Node for token, drupal, MCP packages) |
| `test:smart` | —          | Tests for changed components only (no cache)                                                                               |

## pnpm Scripts

```bash
pnpm run dev              # Start workspace dev tasks (excludes @helixui/react-starter)
pnpm run dev:docs         # Start only the docs site
pnpm run dev:storybook    # Start Storybook
pnpm run build            # Build all packages and apps
pnpm run type-check       # Run TypeScript checking across all packages
pnpm run test             # Run workspace test scripts via Turbo
pnpm run test:smart       # Run tests for changed components only
pnpm run verify           # lint + format:check + type-check + build (~60s rapid iteration)
pnpm run preflight        # Full local CI equivalent — see scripts/preflight.sh for the
                          # current gate list (lint, format, type-check, build, smart tests,
                          # CEM drift, changeset check, full test matrix, Docker CI parity,
                          # AAA verdict integrity, docs version drift)
```

## Next Steps

- [Monorepo Architecture](/architecture/monorepo/) - Deep dive into the monorepo design
- [Build Pipeline](/architecture/build-pipeline/) - How Turborepo orchestrates builds
