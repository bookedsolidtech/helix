---
title: Styles and CSS
description: Write scoped component styles using css``, static styles arrays, :host selectors, and HELiX design tokens.
---

Lit provides a `css` tagged template literal for writing component-scoped styles. All styles in a `LitElement` are encapsulated in the shadow DOM — they do not leak out to the page and external styles do not leak in. As of `@helixui/library@2.1.0`, HELiX design tokens are adopted at the document level and cascade through Shadow DOM boundaries automatically — no per-component token import is required.

## The `css` Tagged Template Literal

```typescript
import { LitElement, html, css } from 'lit';
```

The `css` tag processes the template at class definition time (not per-instance), making it efficient for shared styles. You cannot embed arbitrary JavaScript expressions in `css` — only values wrapped in `css` itself or `unsafeCSS()`.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

// Design tokens are adopted at the document level by @helixui/library —
// no tokenStyles import needed. var(--hx-*) works directly.
@customElement('hx-chip')
export class HelixChip extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      border-radius: var(--hx-radius-full);
      padding: var(--hx-spacing-xs) var(--hx-spacing-sm);
      font-size: var(--hx-font-size-sm);
      font-family: var(--hx-font-family-base);
      background: var(--hx-color-neutral-100);
      color: var(--hx-color-neutral-800);
    }
  `;
}
```

## The `static override styles` Array

`static override styles` is a `CSSResultGroup` — it accepts a single `CSSResult` or an array of `CSSResult` values. The `override` keyword is required because `LitElement` declares `styles` on the base class.

```typescript
static override styles = [
  sharedButtonStyles,  // 1. Shared style modules (optional)
  css`                 // 2. Component-specific styles
    :host { display: inline-flex; }
  `,
];
```

`--hx-*` tokens are available in all component styles without any explicit import. The library adopts them at the document level, and CSS custom properties cascade through Shadow DOM boundaries automatically.

> **Deprecated:** The old `[tokenStyles, ...]` pattern — where `tokenStyles` from `@helixui/tokens/lit` was required as the first array entry — is no longer needed. `tokenStyles` and `mergeTokenStyles()` are still exported for backwards compatibility but should not appear in new code.

## Shared Style Modules

Create reusable style fragments with `css` and share them across components:

```typescript
// src/shared/focus-styles.ts
import { css } from 'lit';

export const focusStyles = css`
  :host(:focus-visible) {
    outline: 2px solid var(--hx-color-focus);
    outline-offset: 2px;
  }
`;

// src/shared/sr-only-styles.ts
import { css } from 'lit';

export const srOnlyStyles = css`
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
```

Usage:

```typescript
import { focusStyles } from '../shared/focus-styles.js';
import { srOnlyStyles } from '../shared/sr-only-styles.js';

@customElement('hx-button')
export class HelixButton extends LitElement {
  static override styles = [focusStyles, srOnlyStyles, css`...`];
}
```

## The `:host` Selector

`:host` targets the custom element itself — the shadow host. This is the correct way to set `display`, `position`, sizing, and host-level layout properties.

```typescript
static override styles = css`
  /* Default host layout */
  :host {
    display: block;
    box-sizing: border-box;
  }

  /* Inline variant */
  :host([inline]) {
    display: inline-block;
  }

  /* Disabled state via reflected attribute */
  :host([disabled]) {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }

  /* Variant-based host styling */
  :host([variant='primary']) {
    --_bg: var(--hx-color-primary-500);
    --_color: var(--hx-color-white);
  }

  :host([variant='secondary']) {
    --_bg: transparent;
    --_color: var(--hx-color-primary-500);
  }
`;
```

`:host([attr])` rules activate when the attribute is present on the element — which is why `reflect: true` on boolean properties like `disabled` is important.

## CSS Custom Properties

CSS custom properties (variables) pierce the shadow boundary. They are the primary mechanism for external theming of shadow DOM components.

### Using Token Variables Inside Components

Reference `--hx-*` token variables in your component styles. Tokens are available automatically — no import needed:

```typescript
static override styles = css`
  .button {
    background: var(--hx-color-primary-500);
    color: var(--hx-color-white);
    border-radius: var(--hx-radius-md);
    padding: var(--hx-spacing-sm) var(--hx-spacing-md);
    font-family: var(--hx-font-family-base);
    font-size: var(--hx-font-size-base);
    font-weight: var(--hx-font-weight-medium);
    transition: background var(--hx-duration-fast) var(--hx-easing-standard);
  }

  .button:hover:not(:disabled) {
    background: var(--hx-color-primary-600);
  }
`;
```

### Exposing Component-Level Custom Properties

Define component-specific custom properties that consumers can override:

```typescript
static override styles = css`
  :host {
    /* Component-level custom properties with token fallbacks */
    --hx-chip-bg: var(--hx-color-neutral-100);
    --hx-chip-color: var(--hx-color-neutral-800);
    --hx-chip-border: var(--hx-color-neutral-300);
    --hx-chip-radius: var(--hx-radius-full);
  }

  .chip {
    background: var(--hx-chip-bg);
    color: var(--hx-chip-color);
    border: 1px solid var(--hx-chip-border);
    border-radius: var(--hx-chip-radius);
  }
`;
```

Consumers can then override these on the element or a containing selector:

```css
/* Override for a specific instance */
hx-chip.selected {
  --hx-chip-bg: var(--hx-color-primary-100);
  --hx-chip-color: var(--hx-color-primary-700);
  --hx-chip-border: var(--hx-color-primary-400);
}
```

### Private Custom Properties

Use a `_` prefix convention for internal custom properties to signal they are not part of the public API:

```typescript
css`
  :host([variant='primary']) {
    --_btn-bg: var(--hx-color-primary-500);
    --_btn-bg-hover: var(--hx-color-primary-600);
    --_btn-color: var(--hx-color-white);
  }

  .button {
    background: var(--_btn-bg);
    color: var(--_btn-color);
  }

  .button:hover {
    background: var(--_btn-bg-hover);
  }
`
```

## What You Cannot Do in `css`

The `css` tag does not allow arbitrary JavaScript expressions for security and performance reasons. These patterns will throw an error:

```typescript
// Error: cannot embed a dynamic JS value
const size = '1rem';
css`.foo { font-size: ${size}; }` // throws

// Correct: use unsafeCSS() for dynamic values (use sparingly)
import { unsafeCSS } from 'lit';
const size = unsafeCSS('1rem');
css`.foo { font-size: ${size}; }` // works
```

For dynamic per-instance styles, use inline style bindings in the template or CSS custom properties instead:

```typescript
// Dynamic inline styles (per instance, not per class)
override render() {
  return html`
    <div style="height: ${this.height}px; width: ${this.width}px;">
      <slot></slot>
    </div>
  `;
}
```

Or use `styleMap` for multiple dynamic properties:

```typescript
import { styleMap } from 'lit/directives/style-map.js';

override render() {
  return html`
    <div ${styleMap({ height: `${this.height}px`, width: `${this.width}px` })}>
      <slot></slot>
    </div>
  `;
}
```

## Next Steps

- [Built-in Directives](/components-guide/fundamentals/directives/) — `classMap`, `styleMap`, and more
- [Shadow DOM Styling](/components-guide/shadow-dom/styling/) — `::slotted()`, `::part()`, and what pierces the boundary
- [CSS Parts](/components-guide/shadow-dom/parts/) — exposing shadow elements for external styling
- [Design Tokens](/design-tokens/overview/) — the full `--hx-*` token reference
