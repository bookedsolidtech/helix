---
title: Styling Shadow DOM
description: Comprehensive guide to styling shadow DOM components — CSS custom properties, ::slotted(), ::part(), and what external styles can and cannot reach.
---

Shadow DOM's style encapsulation is one of its primary benefits — and one of its most misunderstood aspects. This page explains exactly what can style shadow DOM elements, what cannot, and the HELiX patterns for each.

## The Core Rule

**Regular CSS selectors from outside a shadow root cannot style elements inside it.**

This includes:

- Class selectors: `.my-class { ... }` — does not affect shadow DOM internals
- Element selectors: `button { ... }`, `p { color: red; }` — do not reach inside
- ID selectors: `#my-id { ... }` — do not reach inside
- Descendant combinators: `hx-button button { ... }` — the `button` part does not match

```css
/* This does NOT style the internal <button> inside hx-button */
hx-button button {
  background: red; /* has no effect */
}
```

What CAN cross the boundary — detailed below.

## CSS Custom Properties Pierce Shadow DOM

CSS custom properties (variables) inherit through shadow boundaries by design. They are the primary mechanism for consumer theming.

### Design Tokens

HELiX design tokens are all CSS custom properties. Because they are set on `:root` (or `<html>`), they are available inside every shadow root:

```css
/* Set globally on :root */
:root {
  --hx-color-primary-500: #2563eb;
  --hx-spacing-md: 1rem;
  --hx-font-family-base: 'Inter', sans-serif;
}
```

Inside the shadow root, these resolve correctly. As of `@helixui/library@2.1.0`, tokens are adopted at the document level automatically — no per-component token import is needed:

```typescript
static override styles = css`
  .button {
    background: var(--hx-color-primary-500); /* resolves to #2563eb */
    padding: var(--hx-spacing-md);           /* resolves to 1rem */
    font-family: var(--hx-font-family-base); /* resolves to 'Inter', sans-serif */
  }
`;
```

### Component-Level Token Overrides

Consumers can override component-scoped custom properties by setting them on the host element or a containing selector:

```css
/* Override for a specific instance */
hx-button.cta-button {
  --hx-button-bg: var(--hx-color-brand-accent);
  --hx-button-bg-hover: var(--hx-color-brand-accent-dark);
}

/* Override for an entire section */
.admin-sidebar {
  --hx-button-font-size: var(--hx-font-size-sm);
  --hx-text-input-border-radius: 0;
}
```

These override values are picked up by the shadow DOM because custom properties cascade and inherit normally:

```typescript
static override styles = css`
  :host {
    /* Define with token fallback */
    --hx-button-bg: var(--hx-color-primary-500);
    --hx-button-bg-hover: var(--hx-color-primary-600);
  }

  .button {
    background: var(--hx-button-bg);
  }
  .button:hover {
    background: var(--hx-button-bg-hover);
  }
`;
```

## Inherited CSS Properties

Certain CSS properties inherit by default through shadow boundaries. Consumers can influence shadow DOM typography and color by setting these on ancestor elements:

**Inherited by default:**
- `color`
- `font-family`
- `font-size`
- `font-weight`
- `font-style`
- `font-variant`
- `line-height`
- `letter-spacing`
- `text-transform`
- `direction`
- `visibility`
- `cursor`

```css
/* Setting on the host affects inherited properties inside shadow DOM */
hx-text-input {
  font-family: 'Inter', sans-serif; /* inherits into shadow DOM */
  color: var(--hx-color-text-primary); /* inherits into shadow DOM */
}
```

Non-inherited properties (background, border, padding, margin, etc.) do **not** cross the boundary.

## `::slotted()` — Styling Slotted Content

`::slotted(selector)` applies styles to light DOM elements that have been slotted into the component. It is written inside the component's shadow styles and targets slotted children.

```typescript
@customElement('hx-list')
export class HelixList extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    /* Style direct slotted children */
    ::slotted(li) {
      padding: var(--hx-spacing-xs) var(--hx-spacing-sm);
      border-bottom: 1px solid var(--hx-color-neutral-100);
    }

    /* Style a specific type of slotted element */
    ::slotted(hx-list-item) {
      display: flex;
      align-items: center;
    }

    /* Style slotted elements with an attribute */
    ::slotted([selected]) {
      background: var(--hx-color-primary-50);
      color: var(--hx-color-primary-700);
    }
  `;

  override render() {
    return html`<ul><slot></slot></ul>`;
  }
}
```

### `::slotted()` Limitations

- Only matches **direct** slotted children, not their descendants.
- Cannot use descendant combinators: `::slotted(li) span { ... }` does not work.
- Specificity is low — inline styles and host-document styles can override `::slotted()` rules.

```css
/* Works — targets direct slotted child */
::slotted(li) { color: red; }

/* Does NOT work — cannot target descendants of slotted elements */
::slotted(li) span { color: blue; }
::slotted(li > .icon) { display: none; }
```

## `::part()` — Styling Named Parts

`::part(name)` from outside the shadow root targets shadow DOM elements that have a `part` attribute. This is the primary consumer styling API for shadow internals.

```typescript
// Component defines parts
override render() {
  return html`
    <div part="root">
      <label part="label">Email</label>
      <input part="input" type="email" />
      <span part="error">Required</span>
    </div>
  `;
}
```

```css
/* Consumer styles the parts */
hx-text-input::part(input) {
  border-radius: 0;
  border-bottom: 2px solid var(--hx-color-primary-500);
}

hx-text-input::part(label) {
  font-weight: var(--hx-font-weight-bold);
  text-transform: uppercase;
}

/* Context-scoped part overrides */
.compact-form hx-text-input::part(root) {
  gap: var(--hx-spacing-xs);
}
```

See [CSS Parts](/components-guide/shadow-dom/parts/) for the full `::part()` and `exportparts` reference.

## What Does NOT Pierce Shadow DOM (Summary)

| External CSS | Pierces shadow DOM? | Alternative |
|---|---|---|
| Class selectors (`.foo`) | No | CSS custom properties, `::part()` |
| Element selectors (`button`) | No | CSS custom properties, `::part()` |
| ID selectors (`#foo`) | No | CSS custom properties, `::part()` |
| Descendant combinators (`hx-btn span`) | No | CSS custom properties, `::part()` |
| CSS custom properties (`--hx-color-*`) | Yes | (native) |
| `::slotted()` | Yes (direct children only) | (native) |
| `::part()` | Yes (named parts only) | (native) |
| Inherited properties (`color`, `font-*`) | Yes (inherit chain) | (native) |
| `::placeholder` on `::part(input)` | No (cannot chain) | Component-exposed token |

## The HELiX Styling Hierarchy

When customizing a HELiX component, choose the right tool:

1. **Design tokens** (`--hx-color-primary`, `--hx-spacing-md`) — global theme, all components pick up changes automatically.
2. **Component tokens** (`--hx-button-bg`, `--hx-text-input-border-radius`) — per-component exceptions without affecting global theme.
3. **`::part()` selectors** — structural or decorative changes to specific shadow elements that tokens don't cover.
4. **Slotted content styles** — style the light DOM content you own rather than shadow internals.
5. **Extend the component** — subclass and override for deep structural changes.

```css
/* Tier 1: token override (global) */
:root { --hx-color-primary-500: #7c3aed; }

/* Tier 2: component token override */
.sidebar hx-button {
  --hx-button-font-size: var(--hx-font-size-sm);
}

/* Tier 3: ::part() structural override */
.sidebar hx-button::part(button) {
  justify-content: flex-start;
  text-align: left;
}

/* Tier 4: style your own slotted content */
hx-list::slotted(li.priority) {
  font-weight: var(--hx-font-weight-bold);
}
```

## Adopted Stylesheets

As of `@helixui/library@2.1.0`, the adopted stylesheets pattern is the **default architecture**. Importing `@helixui/library` automatically adds the full `--hx-*` token set to `document.adoptedStyleSheets`. CSS custom properties cascade through Shadow DOM boundaries, so every component immediately has access to all tokens — no per-component `tokenStyles` import or `static override styles` entry is required.

```typescript
import '@helixui/library'; // tokens are adopted at document level on import
```

For application-wide global styles (resets, typography base, brand overrides), use `@helixui/adopted-stylesheets`:

```typescript
import '@helixui/adopted-stylesheets';
```

See [Adopted Stylesheets](/components-guide/styling/adopted-stylesheets/) for full setup.

## Next Steps

- [CSS Parts](/components-guide/shadow-dom/parts/) — `::part()`, `exportparts`, and documenting parts
- [The Host Element](/components-guide/shadow-dom/host-element/) — `:host`, `:host([attr])`, and `reflect`
- [Shadow DOM Architecture](/components-guide/shadow-dom/architecture/) — encapsulation fundamentals
- [Design Tokens](/design-tokens/overview/) — the full `--hx-*` token reference
