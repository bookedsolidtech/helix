---
title: Installation
description: How to install and set up the HELIX enterprise web component library
---

## Prerequisites

- **Node.js** 20.x or later (LTS recommended — see `.nvmrc` at repo root)
- **npm** 10.x or later
- **Git** 2.x or later

## Clone and Install

```bash
# Clone the repository
git clone https://github.com/bookedsolidtech/helix.git
cd helix

# Use the pinned Node version (requires nvm)
nvm use

# Install all workspace dependencies
npm install
```

The `npm install` at the repo root installs dependencies for all workspaces via npm workspaces — no need to `cd` into individual packages.

## Start the Dev Environment

```bash
# Start all apps (docs, Storybook, admin dashboard)
npm run dev

# Or start individual apps
npm run dev:docs         # Documentation site → http://localhost:3150
npm run dev:storybook    # Storybook → http://localhost:3151
npm run dev:admin        # Admin Dashboard → http://localhost:3159
npm run dev:library      # Library watch mode (for component development)
```

## Monorepo Structure

HELIX uses **Turborepo** with **npm workspaces** for build orchestration:

| Package               | Description                                   | npm name         |
| --------------------- | --------------------------------------------- | ---------------- |
| `packages/hx-library` | Lit 3.x component library                     | `@helix/library` |
| `packages/hx-tokens`  | Design token system (CSS custom properties)   | `@helix/tokens`  |
| `apps/docs`           | Astro/Starlight documentation hub (port 3150) | —                |
| `apps/storybook`      | Storybook 10.x component playground (3151)    | —                |
| `apps/admin`          | Admin Dashboard — health scoring (port 3159)  | —                |

## Verify the Installation

After `npm install` and `npm run dev`, visit:

- `http://localhost:3150` — Documentation site (this site)
- `http://localhost:3151` — Storybook component playground
- `http://localhost:3159` — Admin Dashboard (component health scoring)

If any port is occupied:

```bash
npm run kill-ports   # kills all three dev server ports
npm run dev          # restart
```

## Quality Gate Check

Before any code changes, verify the environment is clean:

```bash
npm run verify   # lint + format:check + type-check (must all pass)
npm run test     # Vitest browser-mode test suite
```

## Next Steps

- [Quick Start](/getting-started/quick-start/) - Use components in a page
- [Project Structure](/getting-started/project-structure/) - Understand the monorepo layout
- [Architecture Overview](/architecture/overview/) - System design decisions
