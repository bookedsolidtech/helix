---
title: Monorepo Structure
description: Turborepo monorepo architecture with pnpm workspaces for HELIX
---

HELIX uses **Turborepo** with **pnpm workspaces** for monorepo management. This provides intelligent build caching, dependency-aware task execution, and shared configuration.

## Why Turborepo + pnpm

| Feature               | Benefit                                              |
| --------------------- | ---------------------------------------------------- |
| **Remote caching**    | CI builds reuse cached outputs across machines       |
| **Task dependencies** | `build` waits for upstream `^build` to complete      |
| **Filtering**         | Run commands for specific packages: `--filter=docs`  |
| **pnpm workspaces**   | Fast installs with content-addressable store         |

## Workspace Topology

```
helix (root)                        ← pnpm-workspace.yaml
├── apps/
│   ├── docs                        # Astro/Starlight documentation site
│   ├── storybook                   # Storybook 10.x component playground
│   ├── admin                       # Internal admin application
│   └── mcp-servers/
│       ├── cem-analyzer            # Custom Elements Manifest analysis MCP
│       ├── health-scorer           # Component health scoring MCP
│       ├── shared                  # Shared MCP server utilities
│       └── typescript-diagnostics  # TypeScript diagnostics MCP
└── packages/
    ├── hx-library                  # Core Lit 3.x web components
    ├── hx-tokens                   # Design token definitions (W3C DTCG)
    ├── hx-react                    # Auto-generated React wrappers
    ├── drupal-starter              # Drupal SDC scaffold + Twig templates
    ├── drupal-behaviors            # Drupal JS behaviors
    └── helixui-mcp                 # MCP server for AI-assisted development
```

## Task Pipeline

The `turbo.json` at the repo root defines all task dependencies. Key tasks:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".astro/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": [".cache/test-results.json"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "cem": {
      "dependsOn": ["^build"],
      "outputs": ["custom-elements.json"]
    },
    "generate": {
      "dependsOn": ["^cem"],
      "outputs": ["packages/hx-react/src/components/**"]
    },
    "generate:drupal-libraries": {
      "dependsOn": ["cem"],
      "outputs": ["packages/drupal-starter/helixui.libraries.yml"]
    }
  }
}
```

## Build Order

Turborepo automatically resolves dependency order. For a full build:

1. `packages/hx-tokens` — design token compilation
2. `packages/hx-library` — component build + CEM generation
3. `packages/hx-react` — React wrapper generation (depends on CEM)
4. `packages/drupal-starter` — Drupal library YAML generation (depends on CEM)
5. `apps/storybook`, `apps/docs`, `apps/admin` — consume built packages

## Common Commands

```bash
# Install dependencies
pnpm install

# Build everything
pnpm run build

# Start all dev servers
pnpm run dev

# Type-check all packages
pnpm run type-check

# Run lint across all packages
pnpm run lint

# Format all files
pnpm run format

# Run smart tests (only changed components)
pnpm run test:smart
```

To target a specific package, use Turborepo's `--filter` flag:

```bash
pnpm turbo build --filter=@helixui/library
pnpm turbo dev --filter=docs
pnpm turbo type-check --filter=@helixui/react
```
