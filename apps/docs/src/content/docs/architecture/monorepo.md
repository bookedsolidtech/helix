---
title: Monorepo Structure
description: Turborepo monorepo architecture with npm workspaces for HELIX
---

HELIX uses **Turborepo** with **npm workspaces** for monorepo management. This provides intelligent build caching, dependency-aware task execution, and shared configuration.

## Why Turborepo + npm

| Feature               | Benefit                                             |
| --------------------- | --------------------------------------------------- |
| **Remote caching**    | CI builds reuse cached outputs across machines      |
| **Task dependencies** | `build` waits for upstream `^build` to complete     |
| **Filtering**         | Run commands for specific packages: `--filter=docs` |
| **npm native**        | No additional package manager complexity            |

## Workspace Topology

```
helix (root)
├── apps/docs          # Documentation site
├── apps/storybook     # Component playground
└── packages/hx-library # Component source code
```

## Task Pipeline

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
    }
  }
}
```

## Detailed Architecture

See the [Pre-Planning Architecture document](/pre-planning/architecture/) for the full monorepo design specification.
