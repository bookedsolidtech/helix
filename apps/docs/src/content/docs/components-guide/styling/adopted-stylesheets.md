---
title: Adopted Stylesheets in HELiX
description: Use @helixui/adopted-stylesheets as the default pattern for injecting global styles into shadow DOM without duplication.
---

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

The adopted stylesheet is an ideal place to set any token overrides that should apply globally, separate from what `@helixui/tokens` provides:

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

Because the adopted stylesheet runs inside each shadow root, CSS custom property overrides here correctly override the defaults from `tokenStyles` without needing `:root` or `:host` specificity tricks.

## Deduplication Guarantee

`@helixui/adopted-stylesheets` tracks registered sheets by identity. Calling `registerAdoptedStylesheet` with the same sheet object more than once is a no-op — the sheet is only added to each shadow root's `adoptedStyleSheets` array once.

## Next Steps

- [Constructable Stylesheets](/components-guide/styling/constructable-stylesheets/) — the browser API powering adopted stylesheets
- [Design Tokens](/components-guide/styling/tokens/) — how `tokenStyles` and adopted stylesheets work together
- [Theming](/components-guide/styling/theming/) — scoping token overrides to a subtree
