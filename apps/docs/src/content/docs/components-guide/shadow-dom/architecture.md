---
title: Shadow DOM Architecture
description: Understand shadow DOM encapsulation — shadow host, shadow root, shadow tree, and why it matters for design systems.
---

Shadow DOM is the browser feature that makes web component encapsulation possible. Understanding its architecture explains why HELiX components are immune to style conflicts and why CSS custom properties are the designated extension point for theming.

## What Is Shadow DOM?

Every HTML element on a page has a "light DOM" — the regular, visible DOM tree that stylesheets and JavaScript selectors target by default. Shadow DOM attaches a second, encapsulated DOM tree to an element. This second tree is the **shadow tree**, and it is invisible to most outside selectors.

```
document
└── body
    └── hx-button (shadow host)
        ├── [light DOM children — slotted content]
        └── #shadow-root (shadow root)
            └── button.button (shadow tree)
                ├── span.button__icon
                └── slot
```

The page's CSS and JavaScript see `hx-button` as a single opaque element. The internal `button`, `span`, and `slot` are in the shadow tree and are not reachable by default.

## Key Terminology

### Shadow Host

The regular DOM element that a shadow root is attached to. In HELiX, the custom element itself is always the shadow host.

```javascript
const button = document.querySelector('hx-button'); // this is the shadow host
```

### Shadow Root

The root node of the shadow tree. LitElement creates and manages the shadow root automatically. You can access it via `element.shadowRoot` (for `mode: 'open'`).

```javascript
const shadowRoot = button.shadowRoot;
const internalButton = shadowRoot.querySelector('button');
```

### Shadow Tree

All the DOM nodes inside the shadow root — the component's private internal structure that Lit renders via `render()`.

### Flattened Tree

The document as seen by the browser's rendering engine after compositing light DOM and shadow DOM together, taking slot projections into account. CSS cascade and layout operate on the flattened tree.

## Lit and Shadow DOM

`LitElement` calls `attachShadow({ mode: 'open' })` automatically during construction. You never need to call it manually. Lit then renders the result of `render()` into that shadow root.

```typescript
// Lit does this for you — no manual setup needed
constructor() {
  super();
  this.attachShadow({ mode: 'open' }); // done by LitElement
}
```

To inspect the shadow root in a custom way, override `createRenderRoot()`:

```typescript
// Default behavior (rarely need to change)
override createRenderRoot(): HTMLElement | ShadowRoot {
  return this.attachShadow({ mode: 'open', delegatesFocus: true });
}
```

`delegatesFocus: true` causes focus to be delegated to the first focusable element inside the shadow root when the host receives focus. HELiX uses this on interactive components like `hx-button` and `hx-text-input`.

## Open vs Closed Mode

Shadow roots have two modes:

| Mode | `element.shadowRoot` | Use in HELiX |
|---|---|---|
| `open` | Returns the shadow root | Default — used by all HELiX components |
| `closed` | Returns `null` | Not used |

HELiX uses `open` mode because:

- Testing frameworks need to query the shadow DOM.
- Accessibility tools (ARIA, screen readers) need access to the shadow tree.
- `closed` mode does not provide meaningful security and complicates debugging.

## Why Encapsulation Matters for Design Systems

Without shadow DOM, CSS classes collide across components. A `.button` class in one team's CSS can unintentionally restyle another team's button. This is why every major CSS methodology (BEM, OOCSS, SMACSS, CSS Modules) attempts to solve the same naming collision problem.

Shadow DOM solves it architecturally:

```html
<!-- Global stylesheet can define .button without affecting hx-button internals -->
<style>.button { background: red; }</style>

<!-- hx-button's internal .button is unaffected — it lives in shadow DOM -->
<hx-button>Save</hx-button>
```

The reverse is also true: styles inside a shadow root do not leak out and affect the host document.

```typescript
static override styles = [
  tokenStyles,
  css`
    /* This rule CANNOT affect anything outside hx-button */
    p { color: var(--hx-color-text-primary); }
  `,
];
```

## What Does and Does Not Pierce Shadow DOM

### Does NOT pierce (by design)

- CSS class selectors: `.my-class { ... }` from outside
- CSS ID selectors: `#my-id { ... }` from outside
- CSS element selectors: `p { ... }`, `button { ... }` from outside
- JavaScript `document.querySelector()` — does not reach into shadow DOM
- `innerHTML` — does not serialize shadow DOM

### Does pierce shadow DOM

- **CSS custom properties** (`--hx-color-primary`, `--hx-spacing-md`) — they inherit through shadow boundaries
- **`::part()` pseudo-element** — targets elements with `part` attributes: `hx-button::part(button)`
- **`::slotted()` pseudo-element** — targets slotted light DOM content
- **Inherited CSS properties** — `color`, `font-family`, `font-size`, `line-height` inherit into shadow DOM from the document by default
- **`element.shadowRoot`** — direct JS access in open mode

## Accessing Shadow DOM in JavaScript

For testing and direct integrations:

```javascript
// Access the shadow root
const shadowRoot = document.querySelector('hx-button').shadowRoot;

// Query inside the shadow tree
const button = shadowRoot.querySelector('button');
const slots = shadowRoot.querySelectorAll('slot');

// Watch for shadow DOM changes
const observer = new MutationObserver((mutations) => {
  // mutations inside the shadow tree
});
observer.observe(shadowRoot, { childList: true, subtree: true });
```

## Next Steps

- [Slots and Content Projection](/components-guide/shadow-dom/slots/) — how light DOM content flows into shadow DOM via slots
- [CSS Parts](/components-guide/shadow-dom/parts/) — `::part()` and `exportparts`
- [Styling Shadow DOM](/components-guide/shadow-dom/styling/) — what pierces the boundary and what doesn't
- [The Host Element](/components-guide/shadow-dom/host-element/) — `:host` selector and host-based styling
