# create-helix (workspace stub)

> **Heads up — this directory is a placeholder.** The actual
> `create-helix` CLI is published from a separate repository.
> The stub package.json in this directory is here so the monorepo
> can reserve the slot for a future consolidation; do not treat the
> contents of `packages/create-helix-app/` as the implementation
> consumers run.

## What's actually shipping today

| Concern                        | Answer                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Published npm package name** | `create-helix`                                                                                                                 |
| **Invocation**                 | `npx create-helix project-name` / `npm create helix project-name`                                                              |
| **Current published version**  | `0.8.0` (run `npm view create-helix version` to confirm)                                                                       |
| **Source repo (canonical)**    | [bookedsolidtech/create-helix-app](https://github.com/bookedsolidtech/create-helix-app)                                        |
| **Local workspace stub name**  | `@helixui/create-helix-stub` (private — intentionally scoped + bin-less so it never shadows the real `create-helix` locally)   |
| **Docs page**                  | [apps/docs/src/content/docs/getting-started/create-helix.md](../../apps/docs/src/content/docs/getting-started/create-helix.md) |

## The stub vs the real package

The published `create-helix` package ships the full scaffolder tree, including:

- **16 framework templates** (`wc-storybook`, `react-next`, `react-vite`,
  `remix`, `vue-nuxt`, `vue-vite`, `solid-vite`, `qwik-vite`, `svelte-kit`,
  `angular`, `astro`, `vanilla`, `lit-vite`, `preact-vite`, `stencil`,
  `ember` — see the docs page for the live table)
- **Dynamic version pins** for `@helixui/library`, `@helixui/tokens`,
  `@helixui/icons` (constants like `HELIX_LIBRARY_VERSION` resolved at
  publish time; the obsolete `^1.0.0` / `^0.3.0` pins below are **stub
  artefacts, NOT what the published CLI emits**)
- **A Drupal track** (`scaffoldDrupalTheme` + presets: `standard`,
  `blog`, `healthcare`, `intranet`, `ecommerce`)
- **Storybook scaffold** + accessibility/AAA story templates
- **MCP plugin loader**, validation modules, CLI banner

The stub in this directory contains only a few stale template definitions
left over from an earlier exploration. Reviewers (human or AI) reading
the docs page against the stub will see a discrepancy — the docs describe
the **published** surface, and the stub does not yet mirror it.

## When this stub will be useful

When the published `create-helix` source migrates from
[bookedsolidtech/create-helix-app](https://github.com/bookedsolidtech/create-helix-app)
into this monorepo, the import will land here and replace the stub
contents. Until then, treat this as a reserved namespace.

## Don't be fooled by the directory name

The directory is `create-helix-app/`. The package is `create-helix`. The
runnable command is `create-helix`. There is an unrelated package on npm
called `create-helix-app` (a ClojureScript / Shadow CLJS project) — that
is **not us**. Always verify with `npm view create-helix repository.url`,
which will return `bookedsolidtech/create-helix-app` for the real package.
