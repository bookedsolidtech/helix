---
title: Your First Web Component
description: Build a complete Lit 3.x web component from scratch using HELiX conventions.
---

This guide walks through building a working web component from the ground up using Lit 3.x and HELiX conventions. By the end you'll have a functional `hx-greeting` component and understand how every part fits together.

## Prerequisites

Install the required package:

```bash
npm install @helixui/library
```

## The Complete Component

Here is a full, working `hx-greeting` component. The sections below break down each part.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-greeting')
export class HelixGreeting extends LitElement {
  // Design tokens are adopted at the document level by @helixui/library.
  // var(--hx-*) works here without any tokenStyles import.
  static override styles = css`
    :host {
      display: block;
      padding: var(--hx-spacing-md);
      font-family: var(--hx-font-family-base);
    }

    .greeting {
      color: var(--hx-color-primary-500);
      font-size: var(--hx-font-size-lg);
      font-weight: var(--hx-font-weight-semibold);
    }
  `;

  @property({ type: String })
  name = 'World';

  override render() {
    return html`
      <p class="greeting">Hello, ${this.name}!</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-greeting': HelixGreeting;
  }
}
```

## Breaking It Down

### Imports

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
```

- `LitElement` is the base class all HELiX components extend.
- `html` is a tagged template literal that produces Lit's efficient template result.
- `css` is a tagged template literal for component-scoped styles.
- `customElement` and `property` are decorators that handle registration and reactivity.

HELiX design tokens (`--hx-*`) are adopted at the document level when `@helixui/library` is imported. No per-component token import is needed — `var(--hx-*)` works in any HELiX shadow root automatically.

### The `@customElement` Decorator

```typescript
@customElement('hx-greeting')
export class HelixGreeting extends LitElement {
```

`@customElement('hx-greeting')` calls `customElements.define('hx-greeting', HelixGreeting)` for you. This is what makes `<hx-greeting>` a valid HTML element in the browser.

HELiX naming conventions:
- Tag names use the `hx-` prefix: `hx-greeting`, `hx-button`, `hx-card`
- Class names use the `Helix` prefix: `HelixGreeting`, `HelixButton`, `HelixCard`

### Static Styles

```typescript
static override styles = css`
  :host {
    display: block;
  }
`;
```

`static override styles` accepts a `CSSResult` or an array of `CSSResult` values. The `override` keyword is required because `LitElement` declares this property on the base class.

Styles are scoped to the component's shadow DOM — they do not leak out or in. Token values (`--hx-*`) are always available because `@helixui/library` adopts them at the document level; CSS custom properties cascade through Shadow DOM boundaries automatically.

### Reactive Properties

```typescript
@property({ type: String })
name = 'World';
```

`@property()` marks a class field as a reactive property. When `name` changes — either from JavaScript or via the `name` HTML attribute — Lit schedules a re-render automatically.

### The `render()` Method

```typescript
override render() {
  return html`
    <p class="greeting">Hello, ${this.name}!</p>
  `;
}
```

`render()` returns the component's template. Lit calls this method whenever reactive properties change. The `override` keyword is required because `LitElement` declares `render()` on the base class.

### Global Type Declaration

```typescript
declare global {
  interface HTMLElementTagNameMap {
    'hx-greeting': HelixGreeting;
  }
}
```

This TypeScript module augmentation tells the compiler that `document.querySelector('hx-greeting')` returns a `HelixGreeting` instance. Always include this at the bottom of every component file.

## Using the Component in HTML

Once the component is imported, use it like any other HTML element:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Greeting Demo</title>
  </head>
  <body>
    <!-- Default: renders "Hello, World!" -->
    <hx-greeting></hx-greeting>

    <!-- With attribute: renders "Hello, HELiX!" -->
    <hx-greeting name="HELiX"></hx-greeting>

    <script type="module" src="./hx-greeting.js"></script>
  </body>
</html>
```

Setting the property from JavaScript:

```javascript
const greeting = document.querySelector('hx-greeting');
greeting.name = 'Developer'; // triggers re-render automatically
```

## Shadow DOM Basics

Every `LitElement` renders into a shadow root — an isolated DOM subtree attached to the custom element. This means:

- Styles defined inside the component do not affect the rest of the page.
- External CSS selectors (other than CSS custom properties and `::part()`) cannot style the component's internals.
- The component's internal structure is hidden from `querySelector` calls outside the shadow root.

You can inspect the shadow root in DevTools by enabling "Show user agent shadow DOM" in settings. In JavaScript, access it via `element.shadowRoot`.

```javascript
const greeting = document.querySelector('hx-greeting');
const para = greeting.shadowRoot.querySelector('p');
console.log(para.textContent); // "Hello, World!"
```

Shadow DOM encapsulation is what makes component-based design systems reliable — each component is self-contained regardless of what surrounds it.

## Next Steps

- [Reactive Properties](/components-guide/fundamentals/reactive-properties/) — deep dive on `@property` and `@state`
- [Template Syntax](/components-guide/fundamentals/template-syntax/) — all expression types in `html\`\``
- [Styles and CSS](/components-guide/fundamentals/styles-and-css/) — `:host`, tokens, and `css\`\``
- [Component Lifecycle](/components-guide/fundamentals/lifecycle/) — `connectedCallback`, `updated`, and more
