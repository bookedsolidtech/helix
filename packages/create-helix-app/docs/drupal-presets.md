# Drupal Preset Guide

`create-helix-app` supports Drupal theme scaffolding through presets. A preset selects a curated set of Single Directory Components (SDCs) appropriate for a given site architecture and generates a fully-structured Drupal theme directory.

## Usage

```bash
# Interactive — prompts for theme name and preset selection
npx @helixui/create --drupal

# Non-interactive — pass preset via flag
npx @helixui/create --drupal --preset healthcare
```

## Available Presets

| Preset | Description | SDC Count |
|--------|-------------|-----------|
| `standard` | Core Drupal SDCs for general-purpose themes | 7 |
| `blog` | Standard + blog-specific content components | 12 |
| `healthcare` | Blog + healthcare-specific components | 16 |
| `intranet` | Standard + employee portal components | 11 |

## Generated Structure

```
my-drupal-theme/
  my-drupal-theme.info.yml       # Drupal theme metadata
  my-drupal-theme.libraries.yml  # Theme-level CSS/JS library
  helixui.libraries.yml          # HELiX component CDN libraries
  package.json                   # npm dependencies
  composer.json                  # Drupal/Composer metadata
  src/
    components/                  # One directory per SDC
      node-teaser/
        node-teaser.component.yml
        node-teaser.twig
      hero-banner/
        ...
    behaviors/
      {preset}-behaviors.js      # Drupal.behaviors using once()
```

## Library Architecture

`helixui.libraries.yml` defines a CDN-backed library structure:

- `helixui.base` — loads `@helixui/tokens` CSS and `@helixui/library` JS via unpkg CDN
- `helixui.{sdc-name}` — per-component library entry that depends on `helixui.base`

Each SDC's `component.yml` declares a `libraryOverrides.dependencies` pointing to its library entry, ensuring the correct JS/CSS is loaded on demand.

## Preset Details

- [Standard](./presets/standard.md) — baseline for any Drupal site
- [Blog](./presets/blog.md) — content-heavy editorial sites
- [Healthcare](./presets/healthcare.md) — patient-facing healthcare portals
- [Intranet](./presets/intranet.md) — internal employee portals and dashboards

## Next Steps After Scaffolding

1. `cd my-drupal-theme && npm install`
2. Copy the theme directory to `web/themes/custom/` in your Drupal project
3. Enable the theme at `/admin/appearance`
4. Override design tokens via CSS custom properties on `:root` or `body`
