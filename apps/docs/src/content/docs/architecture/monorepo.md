---
title: Monorepo Structure
description: Turborepo monorepo architecture with pnpm workspaces for HELIX
---

HELIX uses **Turborepo** with **pnpm workspaces** for monorepo management. This provides intelligent build caching, dependency-aware task execution, and shared configuration.

## Why Turborepo + pnpm

| Feature               | Benefit                                              |
| --------------------- | ---------------------------------------------------- |
| **Local build cache** | Turbo skips work whose inputs are unchanged          |
| **Task dependencies** | `build` waits for upstream `^build` to complete      |
| **Filtering**         | Run commands for specific packages: `--filter=docs`  |
| **pnpm workspaces**   | Fast installs with content-addressable store         |

A Turborepo remote cache is not currently configured; CI uses pnpm's dependency cache and Turbo's local cache only.

## Workspace Topology

Selected packages (full list lives in `pnpm-workspace.yaml`):

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
    ├── hx-icons                    # Icon registry (FA Free + helix glyph set)
    ├── hx-tokens                   # Design token definitions
    ├── hx-react                    # Auto-generated React wrappers
    ├── react-starter               # Reference React-app scaffold consuming the wrappers
    ├── drupal-starter              # Drupal SDC scaffold + Twig templates
    ├── drupal-behaviors            # Drupal JS behaviors
    └── helixui-mcp                 # MCP server for AI-assisted development
```

The `create-helix` CLI lives in a sibling repo (`bookedsolidtech/create-helix-app`) and is published as `create-helix` on npm.

## Task Pipeline

The `turbo.json` at the repo root defines all task dependencies. Key tasks (abbreviated — see `turbo.json` for the full canonical config):

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        "build/**",
        ".astro/**",
        ".next/**",
        "custom-elements.json",
        "aaa-verdicts.json",
        "figma-inventory.json"
      ]
    },
    "dev": {
      "dependsOn": ["^build"],
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

