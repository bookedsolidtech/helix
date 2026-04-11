---
title: Design Tokens
description: Use HELiX design tokens as CSS custom properties to keep visual values consistent across every component.
---

Design tokens are the single source of truth for all visual values in HELiX. Instead of hard-coding colors, spacing, or font sizes, components reference named tokens. When a token value changes, every component that uses it updates automatically.

## Token Categories

HELiX tokens are organized into six categories.

| Category | Example token | Purpose |
|---|---|---|
| Color | `--hx-color-primary-500` | Brand, semantic, and neutral colors |
| Spacing | `--hx-spacing-md` | Padding, margin, gap |
| Typography | `--hx-font-family-sans`, `--hx-font-size-lg` | Font families, sizes, weights, line-heights |
| Border | `--hx-border-radius-md`, `--hx-border-width-sm` | Radius and stroke width |
| Shadow | `--hx-shadow-sm`, `--hx-shadow-lg` | Elevation levels |
| Motion | `--hx-motion-duration-fast`, `--hx-motion-easing-standard` | Transition and animation timing |

## Token Naming Convention

All tokens follow the pattern `--hx-{category}-{scale}`:

```
--hx-color-primary-500
--hx-color-neutral-100
--hx-spacing-xs
--hx-spacing-2xl
--hx-font-size-sm
--hx-border-radius-lg
--hx-shadow-md
--hx-motion-duration-fast
```

Scale values use t-shirt sizes (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`) or numeric steps (`100`–`900`) depending on the category. Color palettes use numeric steps; spacing, typography, border, shadow, and motion use t-shirt sizes.

## How Tokens Are Made Available

As of `@helixui/library@2.1.0`, design tokens are adopted at the **document level** automatically. When you import anything from `@helixui/library`, the full `--hx-*` token set is added to `document.adoptedStyleSheets` on `:root`. CSS custom properties inherit through Shadow DOM boundaries, so every component can use `var(--hx-*)` without any per-component setup.

```typescript
// Tokens cascade automatically — no import needed in your component
import '@helixui/library'; // or any individual component import

// Your component just uses the tokens
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-card')
export class HelixCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: var(--hx-spacing-lg);
      border-radius: var(--hx-border-radius-md);
      box-shadow: var(--hx-shadow-sm);
      font-family: var(--hx-font-family-sans);
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}
```

### Deprecated: `tokenStyles` from `@helixui/tokens/lit`

Prior to `@helixui/library@2.1.0`, components were required to import `tokenStyles` and include it as the first entry in `static override styles`:

```typescript
// Deprecated — do not use in new components
import { tokenStyles } from '@helixui/tokens/lit';

static override styles = [tokenStyles, css`...`];
```

`tokenStyles` and `mergeTokenStyles()` are still exported for backwards compatibility but should not appear in new component code. Remove them when you audit existing components — they are dead weight now that tokens are adopted at the document level.

## Using Tokens in Component CSS

Reference tokens with `var(--hx-{token})` anywhere in your component stylesheet:

```typescript
static override styles = css`
  :host {
    display: block;
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-font-size-base);
    line-height: var(--hx-line-height-normal);
  }

  .title {
    font-size: var(--hx-font-size-xl);
    font-weight: var(--hx-font-weight-semibold);
    color: var(--hx-color-neutral-900);
  }

  .badge {
    background: var(--hx-color-primary-500);
    color: var(--hx-color-primary-50);
    padding: var(--hx-spacing-xs) var(--hx-spacing-sm);
    border-radius: var(--hx-border-radius-full);
  }

  .divider {
    border-top: var(--hx-border-width-sm) solid var(--hx-color-neutral-200);
    margin: var(--hx-spacing-md) 0;
  }
`;
```

## Tokens vs Hard-Coded Values

Never hard-code visual values that exist as tokens:

```typescript
// Wrong
css`
  :host {
    color: #0f62fe;
    padding: 16px;
    border-radius: 4px;
    font-size: 14px;
  }
`

// Correct
css`
  :host {
    color: var(--hx-color-primary-500);
    padding: var(--hx-spacing-md);
    border-radius: var(--hx-border-radius-sm);
    font-size: var(--hx-font-size-sm);
  }
`
```

Using tokens instead of hard-coded values means every component stays in sync when the design language evolves.

## Fallback Values

CSS `var()` accepts a fallback as a second argument. Use this when layering component-specific properties on top of tokens:

```typescript
css`
  :host {
    /* Consumer can override --hx-card-bg; falls back to the neutral token */
    background: var(--hx-card-bg, var(--hx-color-neutral-0));
    border: var(--hx-border-width-sm) solid var(--hx-card-border-color, var(--hx-color-neutral-200));
  }
`
```

This pattern is the foundation of [CSS custom property theming](/components-guide/styling/css-custom-properties/).

## Next Steps

- [Theming](/components-guide/styling/theming/) — override tokens at `:root` or per-component
- [CSS Custom Properties API](/components-guide/styling/css-custom-properties/) — expose public style API on your components
- [Dark Mode](/components-guide/styling/dark-mode/) — define light and dark token variants
