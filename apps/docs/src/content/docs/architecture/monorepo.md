---
title: Monorepo Structure
description: Turborepo monorepo with npm workspaces — workspace topology, task pipeline, and configuration
---

HELIX uses **Turborepo** with **npm workspaces** for monorepo management. Turborepo handles intelligent build caching and dependency-aware task ordering. npm workspaces handle package linking and hoisting.

## Why Turborepo + npm

We chose Turborepo over Nx and Lerna for three reasons:

1. **Zero config for the common case** — `turbo.json` with `dependsOn: ["^build"]` is all it takes to get correct build ordering across packages
2. **Remote caching that works** — CI builds reuse cached outputs from identical inputs, making PRs fast even as the component count grows
3. **npm workspaces native** — No additional package manager complexity or lock file format changes

| Feature               | Benefit                                             |
| --------------------- | --------------------------------------------------- |
| **Remote caching**    | CI builds reuse cached outputs across machines      |
| **Task dependencies** | `build` waits for upstream `^build` to complete     |
| **Filtering**         | Run commands for specific packages: `--filter=docs` |
| **npm native**        | No additional package manager complexity            |

## Workspace Topology

```
helix (root)
├── apps/docs          # Documentation site (Astro/Starlight, port 3150)
├── apps/storybook     # Component playground (Storybook 10.x, port 3151)
├── apps/admin         # Admin Dashboard — health scoring (Next.js 15, port 3159)
├── packages/hx-library # Component source code (@helix/library)
└── packages/hx-tokens  # Design token system (@helix/tokens)
```

The `apps/mcp-servers/` directory contains the MCP (Model Context Protocol) servers used by engineering agents — these are infrastructure, not part of the component library itself.

## Task Pipeline

The `turbo.json` at the repo root defines task ordering:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".astro/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Build order** is resolved automatically from `^build` dependencies:

1. `packages/hx-tokens` builds first (no dependencies)
2. `packages/hx-library` builds next (depends on `hx-tokens`)
3. `apps/storybook`, `apps/docs`, `apps/admin` build in parallel (all depend on `hx-library`)

## Shared Configuration

| File                         | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `turbo.json`                 | Task definitions, dependencies, and caching |
| `tsconfig.base.json`         | Shared TypeScript strict mode settings      |
| `.nvmrc`                     | Pins Node.js to 20.x                        |
| `apps/docs/astro.config.mjs` | Starlight sidebar, theme, and plugins       |

Each package extends `tsconfig.base.json` for consistent TypeScript configuration across the monorepo. Strict mode is non-negotiable — `noImplicitAny`, `strictNullChecks`, and `strictPropertyInitialization` are all enabled.

## npm Scripts

All npm scripts at the root delegate to Turborepo:

```bash
npm run dev              # All apps in watch mode
npm run dev:docs         # Docs site only (port 3150)
npm run dev:storybook    # Storybook only (port 3151)
npm run dev:admin        # Admin Dashboard only (port 3159)
npm run dev:library      # Library watch mode

npm run build            # Build all packages and apps
npm run type-check       # TypeScript strict check across all packages
npm run test             # Vitest browser-mode tests
npm run cem              # Generate Custom Elements Manifest
npm run verify           # lint + format:check + type-check (pre-push gate)
```

## Package Naming Conventions

| Package               | npm name         | Description                      |
| --------------------- | ---------------- | -------------------------------- |
| `packages/hx-library` | `@helix/library` | Lit 3.x web components           |
| `packages/hx-tokens`  | `@helix/tokens`  | CSS custom property token system |

Internal cross-references use the workspace protocol: `"@helix/library": "*"` in `package.json`. This resolves to the local package rather than a published npm version during development.

## Detailed Architecture

See the [Pre-Planning Architecture document](/pre-planning/architecture/) for the full monorepo design specification with alternatives considered.
