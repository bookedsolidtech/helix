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

