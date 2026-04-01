---
title: Custom Elements Manifest
description: Understand and generate the Custom Elements Manifest (CEM) that powers Storybook autodocs, IDE support, and design tools for HELiX components.
---

The Custom Elements Manifest (CEM) is a machine-readable JSON file that describes the API surface of every custom element in a package: its properties, attributes, events, slots, CSS parts, and CSS custom properties. It is the contract between HELiX and the tools that consume it.

## What the CEM Enables

| Tool | What it reads from CEM |
|---|---|
| Storybook `autodocs` | Properties, events, slots, CSS parts → controls and docs table |
| VS Code (and other IDEs) | Element names, attributes, types → HTML autocomplete |
| Web component design plugins | Properties and slots → design tool component linking |
| HELiX docs site | Full API reference tables |
| `@helixui/library` consumers | Type-safe component usage without reading source |

## The `custom-elements.json` File

Running the analyzer produces `custom-elements.json` at the package root. Here is an abbreviated example for `hx-badge`:

```json
{
  "schemaVersion": "2.1.0",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/components/hx-badge/hx-badge.ts",
      "declarations": [
        {
          "kind": "class",
          "name": "HelixBadge",
          "customElement": true,
          "tagName": "hx-badge",
          "summary": "A small status indicator for labeling counts, categories, or states.",
          "members": [
            {
              "kind": "field",
              "name": "variant",
              "type": { "text": "'default' | 'success' | 'error' | 'warning' | 'info'" },
              "default": "'default'",
              "description": "Visual color variant.",
              "attribute": "variant",
              "reflects": true
            }
          ],
          "events": [
            {
              "name": "hx-dismiss",
              "type": { "text": "CustomEvent<void>" },
              "description": "Fired when the dismiss button is clicked."
            }
          ],
          "slots": [
            {
              "name": "",
              "description": "Badge label text or content."
            }
          ],
          "cssParts": [
            {
              "name": "base",
              "description": "The wrapper element."
            }
          ]
        }
      ],
      "exports": [
        {
          "kind": "custom-element-definition",
          "name": "hx-badge",
          "declaration": { "name": "HelixBadge" }
        }
      ]
    }
  ]
}
```

## Generating the CEM

HELiX uses `@custom-elements-manifest/analyzer` with the `--litelement` flag for Lit-specific decorator support:

```bash
pnpm run cem
```

This runs:

```bash
custom-elements-manifest analyze \
  --litelement \
  --globs "src/components/**/*.ts" \
  --exclude "**/*.stories.ts" \
  --exclude "**/*.styles.ts" \
  && node ../../scripts/validate-cem.mjs
```

The analyzer reads JSDoc comments and Lit decorators to populate the manifest. After generation, `validate-cem.mjs` asserts that every exported component has the required fields.

### Watching for Changes

During development, run the analyzer in watch mode alongside `vite build --watch`:

```bash
pnpm run cem:watch
```

## How Decorators Map to CEM Fields

| Lit source | CEM field |
|---|---|
| `@customElement('hx-button')` | `tagName`, `exports[].name` |
| `@property({ type: String, reflect: true })` | `members[].attribute`, `members[].reflects` |
| `@property({ type: Boolean })` | `members[]` with `type.text: "boolean"` |
| `@state()` | Not exported to CEM (private state) |
| JSDoc `@slot` | `slots[]` |
| JSDoc `@fires` | `events[]` |
| JSDoc `@csspart` | `cssParts[]` |
| JSDoc `@cssprop` | `cssProperties[]` |
| JSDoc `@summary` | `summary` |

## CEM Plugins

The `@custom-elements-manifest/analyzer` supports plugins for extended analysis. HELiX uses:

- **`--litelement`** — built-in Lit plugin; handles `@property`, `@state`, `@customElement`
- **Custom validation plugin** — enforces HELiX conventions (all events must have `hx-` prefix, all components must have `@summary`, etc.)

Add a plugin in `custom-elements-manifest.config.mjs`:

```javascript
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.stories.ts', '**/*.styles.ts'],
  litelement: true,
  plugins: [
    {
      name: 'helix-conventions',
      analyzePhase({ ts, node, moduleDoc }) {
        // Custom validation logic
      },
    },
  ],
};
```

## Using `custom-elements.json` in Storybook

Storybook reads the CEM automatically when `customElements` is set in `package.json`:

```json
{
  "customElements": "custom-elements.json"
}
```

With `tags: ['autodocs']` on a story's meta, Storybook generates a full documentation page from the CEM — properties table, events table, slots, CSS parts — without any manual documentation writing.

## The `customElements` Export in `package.json`

The CEM path is also registered in the `exports` map for programmatic consumption:

```json
{
  "exports": {
    "./custom-elements.json": "./custom-elements.json"
  }
}
```

This lets tools resolve the CEM relative to `@helixui/library`:

```javascript
import cem from '@helixui/library/custom-elements.json' assert { type: 'json' };
```

## Next Steps

- [JSDoc for Components](/components-guide/documentation/jsdoc/) — the source annotations that feed the CEM
- [Storybook for Web Components](/components-guide/documentation/storybook/) — autodocs powered by CEM
- [API Documentation](/components-guide/documentation/api-docs/) — publishing the generated docs
