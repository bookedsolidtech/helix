---
title: Component API
description: API conventions and patterns for WC-2026 web components
---

All WC-2026 components follow consistent API conventions for predictable usage and Drupal integration.

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Tag name | `wc-` prefix, kebab-case | `wc-card`, `wc-button` |
| Properties | camelCase | `variant`, `disabled` |
| Attributes | kebab-case (auto-reflected) | `variant`, `disabled` |
| Events | `wc-` prefix | `wc-click`, `wc-change` |
| CSS Parts | kebab-case | `container`, `header-text` |
| CSS Custom Properties | `--wc-` prefix | `--wc-card-padding` |
| Slots | kebab-case | `header`, `actions` |

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
this.dispatchEvent(new CustomEvent('wc-change', {
  detail: { value: this.value },
  bubbles: true,
  composed: true,
}));
```

## Custom Elements Manifest

The API is documented via **Custom Elements Manifest** (CEM), which serves as the single source of truth for Storybook args, IDE autocomplete, and documentation.

See the [Pre-Planning: Component Architecture](/pre-planning/components/) for the complete API specification.
