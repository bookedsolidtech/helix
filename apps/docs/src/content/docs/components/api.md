---
title: Component API
description: API conventions and patterns for HELIX web components
---

All HELIX components follow consistent API conventions for predictable usage and Drupal integration.

## Naming Conventions

| Type                  | Convention                                | Example                      |
| --------------------- | ----------------------------------------- | ---------------------------- |
| Tag name              | `hx-` prefix, kebab-case                  | `hx-card`, `hx-button`       |
| Properties            | camelCase                                 | `variant`, `disabled`        |
| Attributes            | kebab-case / lowercase, opt-in reflection | `variant`, `disabled`        |
| Events                | `hx-` prefix                              | `hx-click`, `hx-change`      |
| CSS Parts             | kebab-case                                | `card`, `heading`, `actions` |
| CSS Custom Properties | `--hx-` prefix                            | `--hx-card-padding`          |
| Slots                 | kebab-case                                | `heading`, `actions`         |

Attribute reflection is opt-in: a property only reflects back to its attribute when the component declares `reflect: true` (or sets the attribute imperatively). Many public properties on HELiX components are intentionally non-reflecting — check each component's CEM entry for the canonical attribute list.

## Property Types

The examples below illustrate the **patterns** used by HELiX components — each component's CEM entry defines its actual property names, types, and defaults. Use the [component reference](/components/forms/text-input/) or `packages/hx-library/custom-elements.json` as the source of truth for any specific component.

```typescript
// String enum, reflected to attribute (e.g. hx-button `variant`)
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline' = 'primary';

// Boolean, reflected to attribute (e.g. `disabled`)
@property({ type: Boolean, reflect: true })
disabled = false;

// Number (illustrative — actual numeric props like hx-badge `count` use number | undefined)
@property({ type: Number })
count: number | undefined = undefined;

// Complex object — not exposed as an attribute (illustrative; e.g. hx-nav uses `items: NavItem[]`)
@property({ attribute: false })
items: unknown[] = [];
```

## Event API

`hx-change`-style value-change events follow this pattern:

```typescript
this.dispatchEvent(
  new CustomEvent('hx-change', {
    detail: { value: this.value },
    bubbles: true,
    composed: true,
  }),
);
```

Other components emit differently-named events with their own `detail` shapes — `hx-click` (with `originalEvent`), `hx-after-close`, `hx-toggle`, `hx-input`, etc. Each component's CEM entry defines the exact event name and detail payload.

The `bubbles: true, composed: true` combination is required so events cross the Shadow DOM boundary and reach Drupal Behaviors attached to the document or a host element.

## Custom Elements Manifest

The API is documented via **Custom Elements Manifest** (CEM), which serves as the single source of truth for Storybook args, IDE autocomplete, and documentation.

```bash
# Regenerate CEM from JSDoc annotations
npm run cem
```
