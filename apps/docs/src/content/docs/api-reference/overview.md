---
title: API Reference
description: Complete API reference for HELIX web components
---

The HELiX component API reference is rendered from the **Custom Elements Manifest** (CEM). The CEM is the single source of truth — every component page in Storybook reads from it.

## Custom Elements Manifest

The CEM is generated from JSDoc comments in component source code by `@custom-elements-manifest/analyzer`. The analyzer reads `packages/hx-library/src/components/**/*.ts` and emits `packages/hx-library/custom-elements.json`. Whenever a component's JSDoc, decorators, or events change, regenerate the CEM:

```bash
pnpm cem
```

Per Phase D of the docs cleanup epic, the canonical per-component reference is the live **Storybook autodocs** page; the previously-shipped Astro per-component pages were deleted to avoid duplicating the CEM.

## What the reference includes per component

Drawn directly from the CEM `declaration` block:

| Section                    | CEM source field           |
| -------------------------- | -------------------------- |
| **Properties**             | `members` where `kind: 'field'` |
| **Events**                 | `events`                   |
| **Slots**                  | `slots`                    |
| **CSS Parts**              | `cssParts`                 |
| **CSS Custom Properties**  | `cssProperties`            |

Public methods (`members` where `kind: 'method'`) are documented in JSDoc but Storybook autodocs surfaces them via inline narrative rather than a dedicated table.

## Example: hx-button (excerpt)

```
hx-button
=========

Properties (selected):
  variant:  'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'  (default: 'primary')
  tone:     'neutral' | 'success' | 'warning' | 'danger' | 'info'                   (default: 'neutral')
  size:     'sm' | 'md' | 'lg'                                                       (default: 'md')
  loading:  boolean                                                                  (default: false)
  disabled: boolean                                                                  (default: false)
  href:     string                                                                   (renders as <a> when set)

Events:
  hx-click: { originalEvent: PointerEvent | KeyboardEvent }

Slots:
  (default): Button label content
  prefix:    Icon or content placed before the label
  suffix:    Icon or content placed after the label

CSS Parts:
  base:  The host-rendered interactive element (<button> or <a> depending on href)
  label: The wrapper around the default slot
  prefix, suffix: The named-slot wrappers
```

The full, current API for every component (44 P0 + ancillary) is rendered live in [Storybook](https://storybook.helix.bookedsolid.tech/) under each component's "Docs" tab.

## Regenerating + consuming

```bash
# Regenerate CEM from source JSDoc annotations
pnpm cem
```

Pipeline:

1. JSDoc comments + decorators in `packages/hx-library/src/components/**/*.ts`
2. `@custom-elements-manifest/analyzer` produces `packages/hx-library/custom-elements.json`
3. `scripts/generate-react-wrappers.ts` emits framework wrappers (typed React props/events for `@helixui/react`)
4. Storybook autodocs reads the CEM directly via the addon-docs CEM integration
5. The committed `packages/hx-library/aaa-verdicts.json` snapshot feeds the per-page `<AAAConformanceCard>`

## Component Catalog

For the complete component list and live API documentation, see [Storybook](https://storybook.helix.bookedsolid.tech/).
