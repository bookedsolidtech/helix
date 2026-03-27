---
title: Constructable Stylesheets
description: Understand how Lit uses constructable stylesheets to share styles efficiently across all instances of a component.
---

Constructable stylesheets are a browser API that allows a single parsed stylesheet to be shared across multiple shadow roots. Lit uses this API internally to avoid re-parsing component styles for every element instance on the page.

## The Browser API

A constructable stylesheet is created with `new CSSStyleSheet()` and populated with `replaceSync()` or the async `replace()`:

```javascript
const sheet = new CSSStyleSheet();
sheet.replaceSync(':host { display: block; color: red; }');

// Apply to a shadow root
element.shadowRoot.adoptedStyleSheets = [sheet];
```

The key property is sharing: the same `CSSStyleSheet` object can be set on many shadow roots simultaneously. The browser parses the CSS once and reuses the result everywhere.

```javascript
const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync('p { margin: 0; }');

// Both shadow roots share the same parsed sheet — zero extra parsing
shadowRootA.adoptedStyleSheets = [sharedSheet];
shadowRootB.adoptedStyleSheets = [sharedSheet];
```

## How Lit Uses Constructable Stylesheets

When Lit processes `static override styles`, it converts each `CSSResult` (produced by the `css` tagged template literal) into a constructable `CSSStyleSheet` the first time the component class is initialized. Every subsequent instance of that component reuses the same sheet object.

```typescript
import { LitElement, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-badge')
export class HelixBadge extends LitElement {
  // This css`` block is parsed ONCE, converted to a CSSStyleSheet,
  // and shared across every <hx-badge> on the page.
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `;
}
```

With 50 `<hx-badge>` elements on the page, there is still only one parsed stylesheet — not 50.

## `CSSResult` and Deduplication

The `css` tagged template literal returns a `CSSResult` object. Lit tracks these objects by identity. If the same `CSSResult` instance appears in multiple components' `styles` arrays (which happens when you import a shared style), Lit deduplicates it automatically — the browser only adopts one copy of that sheet.

```typescript
// shared-styles.ts
import { css } from 'lit';

export const focusRingStyles = css`
  :host(:focus-visible) {
    outline: 2px solid var(--hx-color-primary-500);
    outline-offset: 2px;
  }
`;
```

```typescript
// hx-button.ts
import { tokenStyles } from '@helixui/tokens/lit';
import { focusRingStyles } from './shared-styles.js';

@customElement('hx-button')
export class HelixButton extends LitElement {
  static override styles = [tokenStyles, focusRingStyles, css`...`];
}
```

```typescript
// hx-input.ts
import { tokenStyles } from '@helixui/tokens/lit';
import { focusRingStyles } from './shared-styles.js';

@customElement('hx-input')
export class HelixInput extends LitElement {
  // focusRingStyles is the same CSSResult object — Lit uses one sheet
  static override styles = [tokenStyles, focusRingStyles, css`...`];
}
```

## The `adoptedStyleSheets` Property

`adoptedStyleSheets` is the standard DOM property that connects a constructable stylesheet to a shadow root (or the main document). Lit manages this property for you — you should not need to set it directly in component code.

```javascript
// What Lit does internally when an element connects:
element.shadowRoot.adoptedStyleSheets = [
  tokenStylesSheet,       // CSSResult from @helixui/tokens/lit
  focusRingStylesSheet,   // CSSResult from shared-styles.ts
  componentStylesSheet,   // CSSResult from this component's css``
];
```

## Browser Support

Constructable stylesheets are supported in all modern browsers. Lit includes a fallback for older environments that injects `<style>` elements instead, so you do not need to handle compatibility yourself.

| Browser | Constructable Stylesheets |
|---|---|
| Chrome 73+ | Native |
| Firefox 101+ | Native |
| Safari 16.4+ | Native |
| Older browsers | Lit `<style>` fallback |

## Practical Implications

Understanding constructable stylesheets explains several HELiX conventions:

**Why `tokenStyles` must be first** — `tokenStyles` is a single `CSSResult` from `@helixui/tokens/lit`. When it's listed first, all subsequent rules in the array can reliably reference token custom properties because they're defined on `:root` by that sheet.

**Why `css` strings should not be dynamic** — `CSSResult` deduplication works by object identity. If you construct a new `css` result on every render, Lit cannot deduplicate it. Keep `static override styles` truly static.

**Why shared style modules scale well** — Extracting common patterns (focus rings, visually-hidden utility, etc.) into shared `CSSResult` constants means every component that imports them shares one parsed sheet across the entire page, regardless of how many instances exist.

## Next Steps

- [Adopted Stylesheets in HELiX](/components-guide/styling/adopted-stylesheets/) — the `@helixui/adopted-stylesheets` package for global styles
- [Design Tokens](/components-guide/styling/tokens/) — how `tokenStyles` fits into the styles array
- [CSS Parts API](/components-guide/styling/css-parts/) — exposing style hooks to consumers
