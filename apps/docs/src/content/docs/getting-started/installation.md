---
title: Installation
description: How to install and set up the HELIX enterprise web component library
---

## Prerequisites

- **Node.js** 20.x or later (LTS recommended)
- **npm** 10.x or later
- **Git** 2.x or later

## Quick Install

```bash
# Clone the repository
git clone https://github.com/bookedsolidtech/helix.git
cd helix

# Use the correct Node version
nvm use

# Install all dependencies (workspace-aware)
npm install

# Start the documentation dev server
turbo run dev --filter=docs
```

## Monorepo Structure

HELIX uses **Turborepo** with **npm workspaces** for build orchestration:

| Package               | Description                       | Status |
| --------------------- | --------------------------------- | ------ |
| `apps/docs`           | Astro/Starlight documentation hub | Active |
| `apps/storybook`      | Storybook component playground    | Active |
| `packages/hx-library` | Lit 3.x component library         | Active |

## Next Steps

- [Quick Start](/getting-started/quick-start/) - Build your first component
- [Project Structure](/getting-started/project-structure/) - Understand the monorepo layout
- [Architecture Overview](/architecture/overview/) - System design decisions
