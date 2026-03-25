# Contributing to @helixui/drupal-starter

## SDC Development Guidelines

### Creating a New SDC

1. Create a directory under `components/{sdc-name}/`
2. Add three files:
   - `{sdc-name}.component.yml` — metadata and typed props
   - `{sdc-name}.twig` — Twig template composing HELiX components
   - `{sdc-name}.css` — layout-only plain CSS

### Rules

- **Plain CSS only** — no `:host`, no Shadow DOM selectors, no adopted stylesheets
- **Layout CSS only** — components handle their own visual styling via Shadow DOM
- **Use `--hx-*` tokens** — reference HELiX design tokens for spacing and colors
- **Drupal field props** — props should match Drupal field data types, not HELiX component APIs
- **`attach_library()`** — every HELiX component used must be loaded via `attach_library('helixui/hx-*')`
- **`attributes.addClass()`** — the root element must support Drupal attribute injection
- **No client-specific patterns** — keep SDCs generic and reusable across all Drupal projects

### Naming Conventions

- SDC directory: lowercase, hyphenated (e.g., `article-teaser`)
- CSS classes: match the SDC name (e.g., `.article-teaser`, `.article-teaser__meta`)
- Behaviors: `helixui{PascalCaseName}` (e.g., `helixuiCarousel`)

### Testing

SDCs are tested via Drupal integration tests that verify:
- Twig templates render correctly with various field data
- Layout Builder compatibility
- Drupal behaviors attach and detach properly
- Accessibility compliance

### Updating the Manifest

When adding or modifying an SDC, update `helix-sdc.manifest.yml` to reflect the current HELiX component dependencies.
