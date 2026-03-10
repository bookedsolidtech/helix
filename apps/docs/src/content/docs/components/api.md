---
title: Component API
description: API conventions and patterns for HELIX web components
---

All HELIX components follow consistent API conventions for predictable usage and Drupal integration.

## Naming Conventions

| Type                  | Convention                  | Example                    |
| --------------------- | --------------------------- | -------------------------- |
| Tag name              | `hx-` prefix, kebab-case    | `hx-card`, `hx-button`     |
| Properties            | camelCase                   | `variant`, `disabled`      |
| Attributes            | kebab-case (auto-reflected) | `variant`, `disabled`      |
| Events                | `hx-` prefix                | `hx-click`, `hx-change`    |
| CSS Parts             | kebab-case                  | `container`, `header-text` |
| CSS Custom Properties | `--hx-` prefix              | `--hx-card-padding`        |
| Slots                 | kebab-case                  | `header`, `actions`        |

## Property Types

Components accept these standard property types:

```typescript
// String enum (reflected as attribute)
@property({ type: String, reflect: true })
variant: 'default' | 'primary' | 'secondary' = 'default';

// Boolean (reflected as attribute)
@property({ type: Boolean, reflect: true })
disabled = false;

// Number
@property({ type: Number })
count = 0;

// Complex objects (NOT reflected)
@property({ attribute: false })
items: ItemData[] = [];
```

## Event API

All custom events follow this pattern:

```typescript
this.dispatchEvent(
  new CustomEvent('hx-change', {
    detail: { value: this.value },
    bubbles: true,
    composed: true,
  }),
);
```

The `bubbles: true, composed: true` combination is required so events cross the Shadow DOM boundary and reach Drupal Behaviors attached to the document or a host element.

## Custom Elements Manifest

The API is documented via **Custom Elements Manifest** (CEM), which serves as the single source of truth for Storybook args, IDE autocomplete, and documentation.

```bash
# Regenerate CEM from JSDoc annotations
npm run cem
```

See the [Pre-Planning: Component Architecture](/pre-planning/components/) for the complete API specification.
