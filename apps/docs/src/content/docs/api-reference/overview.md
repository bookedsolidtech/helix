---
title: API Reference
description: Complete API reference for HELIX web components
---

The HELIX API reference is auto-generated from the **Custom Elements Manifest** (CEM), which serves as the single source of truth for all component APIs.

## Custom Elements Manifest

The CEM is generated from JSDoc comments in component source code using the `@custom-elements-manifest/analyzer`. This ensures documentation is always in sync with implementation.

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
wc-button
=========

Properties:
  variant: 'primary' | 'secondary' | 'ghost'  (default: 'primary')
  size: 'sm' | 'md' | 'lg'                    (default: 'md')
  disabled: boolean                             (default: false)

Events:
  wc-click: { originalEvent: MouseEvent }

Slots:
  (default): Button label content

CSS Parts:
  button: The inner <button> element

CSS Properties:
  --wc-button-bg: Background color
  --wc-button-color: Text color
  --wc-button-border-radius: Border radius
```

## Generating the Reference

The API reference will be auto-generated when the component library is implemented in Phase 2. The generation pipeline:

1. Source code JSDoc comments
2. CEM Analyzer extracts metadata
3. Custom Astro plugin renders reference pages
4. Storybook ArgsTable uses same CEM data

## Component Catalog

For the planned component list and specifications, see [Components Overview](/components/overview/).
