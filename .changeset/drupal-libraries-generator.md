---
"@helixui/library": minor
---

Add CLI script to generate Drupal libraries.yml from Custom Elements Manifest

Adds `scripts/generate-drupal-libraries.js` and a `generate:drupal-libraries` npm script to `@helixui/library`. The script reads `custom-elements.json` (CEM) and `package.json` and writes `drupal/helix.libraries.yml` — a valid Drupal asset library definition file containing:

- `helix/hx-tokens` — standalone design token CSS library
- One entry per component directory (77 components), each with `type: module` JS and a `helix/hx-tokens` dependency
- Six category bundles: `core`, `forms`, `navigation`, `data-display`, `feedback`, `layout`
- `helix/all` — full library bundle that includes every component

The base asset path defaults to `/libraries/helix` and is configurable via `--base-path`. The output path defaults to `drupal/helix.libraries.yml` and is configurable via `--output`.
