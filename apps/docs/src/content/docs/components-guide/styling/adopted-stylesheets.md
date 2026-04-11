---
title: Adopted Stylesheets in HELiX
description: Design tokens are adopted at the document level automatically in @helixui/library@2.1.0+. This page explains how the architecture works and how to use @helixui/adopted-stylesheets for application-wide global styles.
---

As of `@helixui/library@2.1.0`, the adopted stylesheets pattern is not just recommended — it is the **default architecture**. When you import `@helixui/library`, the full `--hx-*` design token set is added to `document.adoptedStyleSheets` automatically. CSS custom properties inherit through Shadow DOM boundaries, so every component has immediate access to all tokens with no per-component wiring.

`@helixui/adopted-stylesheets` is the **default** mechanism for applying global styles — resets, typography base, focus ring utility, and any application-wide rules — to HELiX component shadow roots. It is not optional: every HELiX application should use it.

## Why This Is the Default

CSS custom properties inherit across shadow DOM boundaries, but regular CSS rules do not. If your application has a global `body { font-family: ... }` reset or a utility class system, those rules are invisible inside shadow roots. The trip-planner team learned this the hard way — they spent a week debugging style inconsistencies before discovering that their global font and box-sizing resets never reached any component's shadow DOM.

`@helixui/adopted-stylesheets` solves this by providing a controlled, deduplicated mechanism to push a shared `CSSStyleSheet` into every HELiX component that opts in.

## Installation

```bash
npm install @helixui/adopted-stylesheets
```

## Basic Usage

### 1. Define the global sheet (once, at application entry)

```typescript
// src/styles/global.ts
import { defineAdoptedStylesheet } from '@helixui/adopted-stylesheets';
import { css } from 'lit';

export const globalStyles = defineAdoptedStylesheet(css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-font-size-base);
    line-height: var(--hx-line-height-normal);
    color: var(--hx-color-neutral-900);
    -webkit-font-smoothing: antialiased;
  }
`);
```

### 2. Register it before any components render

```typescript
// src/main.ts
import { registerAdoptedStylesheet } from '@helixui/adopted-stylesheets';
import { globalStyles } from './styles/global.js';

registerAdoptedStylesheet(globalStyles);

// Now import and use your components
import '@helixui/library/hx-button';
import '@helixui/library/hx-card';
```

### 3. Components automatically receive the sheet

Components that extend `HelixLitElement` (the HELiX base class) automatically adopt any registered sheets when they connect to the DOM. No per-component wiring is needed.

## Component-Level Opt-In

If you are building a component that does not extend `HelixLitElement`, you can opt in manually by calling `adoptRegisteredStylesheets(this)` in `connectedCallback`:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { adoptRegisteredStylesheets } from '@helixui/adopted-stylesheets';

@customElement('hx-custom')
export class HelixCustom extends LitElement {
  override connectedCallback() {
    super.connectedCallback();
    adoptRegisteredStylesheets(this);
  }

  override render() {
    return html`<slot></slot>`;
  }
}
```

## When to Use Adopted Stylesheets vs Component-Scoped Styles

| Use case | Approach |
|---|---|
| Global reset (`box-sizing`, `font-family`) | `@helixui/adopted-stylesheets` |
| Global typography base styles | `@helixui/adopted-stylesheets` |
| Application-wide focus ring utility | `@helixui/adopted-stylesheets` |
| Component-specific layout and colors | `static override styles` with `css\`\`` |
| One-off component style override | CSS custom property override on host |

The rule of thumb: if a style rule would have gone in your `globals.css` in a non-web-component application, it belongs in an adopted stylesheet. If it is specific to one component's internal structure, it belongs in `static override styles`.

## Integration with HELiX Tokens

`@helixui/library@2.1.0` adopts the full `--hx-*` token set at the document level via `document.adoptedStyleSheets`. You do not need to do anything for tokens to be available — they cascade through Shadow DOM automatically from the moment the library is imported.

The adopted stylesheet is an ideal place to set brand-specific **token overrides** that should apply globally on top of the library defaults:

```typescript
import { defineAdoptedStylesheet } from '@helixui/adopted-stylesheets';
import { css } from 'lit';

export const brandOverrides = defineAdoptedStylesheet(css`
  :host {
    /* Brand-specific token overrides applied globally to all shadow roots */
    --hx-font-family-sans: 'Inter', system-ui, sans-serif;
    --hx-color-primary-500: #7c3aed;
    --hx-color-primary-600: #6d28d9;
  }
`);
```

Because the adopted stylesheet runs inside each shadow root, CSS custom property overrides here correctly override the library defaults without needing `:root` or `:host` specificity tricks.

## Deduplication Guarantee

`@helixui/adopted-stylesheets` tracks registered sheets by identity. Calling `registerAdoptedStylesheet` with the same sheet object more than once is a no-op — the sheet is only added to each shadow root's `adoptedStyleSheets` array once.

## Next Steps

- [Constructable Stylesheets](/components-guide/styling/constructable-stylesheets/) — the browser API powering adopted stylesheets
- [Design Tokens](/components-guide/styling/tokens/) — how tokens are adopted automatically and how to use `--hx-*` properties
- [Theming](/components-guide/styling/theming/) — scoping token overrides to a subtree
