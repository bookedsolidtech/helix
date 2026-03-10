---
title: API Reference
description: Complete API reference for HELIX web components
---

The HELIX API reference is auto-generated from the **Custom Elements Manifest** (CEM), which serves as the single source of truth for all component APIs.

## Custom Elements Manifest

The CEM is generated from JSDoc comments in component source code using the `@custom-elements-manifest/analyzer`. Documentation stays in sync with implementation automatically — no manual updates required.

## Reference Format

Each component's API reference includes:

| Section            | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| **Properties**     | All `@property()` decorated fields with types and defaults |
| **Attributes**     | HTML attributes with reflection behavior                   |
| **Methods**        | Public methods available on the element                    |
| **Events**         | Custom events dispatched by the component                  |
| **Slots**          | Named and default slots for content projection             |
| **CSS Parts**      | Shadow DOM parts exposed for external styling              |
| **CSS Properties** | CSS custom properties for theming                          |

## Example Entry

```
hx-button
=========

Properties:
  variant: 'primary' | 'secondary' | 'ghost'  (default: 'primary')
  size: 'sm' | 'md' | 'lg'                    (default: 'md')
  disabled: boolean                             (default: false)

Events:
  hx-click: { originalEvent: MouseEvent }

Slots:
  (default): Button label content

CSS Parts:
  button: The inner <button> element

CSS Properties:
  --hx-button-bg: Background color
  --hx-button-color: Text color
  --hx-button-border-radius: Border radius
```

## Generating the Reference

```bash
# Regenerate CEM from source JSDoc annotations
npm run cem
```

The pipeline:

1. Component source code JSDoc comments
2. CEM Analyzer extracts metadata → `custom-elements.json`
3. Custom Astro plugin renders reference pages
4. Storybook ArgsTable uses the same CEM data

## Component Catalog

For the complete component list and API documentation, see the [Component Library](/component-library/overview/).
