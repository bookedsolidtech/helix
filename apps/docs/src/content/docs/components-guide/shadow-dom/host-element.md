---
title: The Host Element
description: Style and interact with the shadow host using :host, :host([attr]), :host-context(), and reflect patterns.
---

The shadow host is the custom element itself — `<hx-button>`, `<hx-card>`, etc. From inside a shadow root, you interact with the host using the `:host` CSS selector and `this` in JavaScript. Understanding how to work with the host is essential for building components that integrate naturally into layouts.

## The `:host` CSS Selector

`:host` targets the custom element itself from within its own shadow styles. Use it to set the element's default display, sizing, and layout behavior:

```typescript
static override styles = [
  tokenStyles,
  css`
    /* Every custom element is display:inline by default */
    /* Most HELiX block components override to display:block */
    :host {
      display: block;
      box-sizing: border-box;
    }
  `,
];
```

### Common `:host` Patterns

```typescript
static override styles = [
  tokenStyles,
  css`
    /* Block-level component */
    :host {
      display: block;
    }

    /* Inline component */
    :host {
      display: inline-flex;
      align-items: center;
    }

    /* Host as a flex container */
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--hx-spacing-sm);
    }

    /* Host with full-width default */
    :host {
      display: block;
      width: 100%;
    }

    /* Hidden state — completely remove from layout */
    :host([hidden]) {
      display: none !important;
    }
  `,
];
```

## `:host([attr])` — Attribute-Based Host Styling

Pass an attribute selector to `:host()` to apply styles conditionally based on the element's attributes. This is the primary mechanism for variant and state styling.

```typescript
@customElement('hx-alert')
export class HelixAlert extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host {
        display: flex;
        gap: var(--hx-spacing-sm);
        padding: var(--hx-spacing-md);
        border-radius: var(--hx-radius-md);
        border: 1px solid transparent;
      }

      :host([variant='info']) {
        background: var(--hx-color-info-50);
        border-color: var(--hx-color-info-200);
        color: var(--hx-color-info-800);
      }

      :host([variant='success']) {
        background: var(--hx-color-success-50);
        border-color: var(--hx-color-success-200);
        color: var(--hx-color-success-800);
      }

      :host([variant='warning']) {
        background: var(--hx-color-warning-50);
        border-color: var(--hx-color-warning-200);
        color: var(--hx-color-warning-800);
      }

      :host([variant='error']) {
        background: var(--hx-color-error-50);
        border-color: var(--hx-color-error-200);
        color: var(--hx-color-error-800);
      }

      :host([dismissible]) {
        padding-right: var(--hx-spacing-xl);
      }
    `,
  ];

  @property({ type: String, reflect: true })
  variant: 'info' | 'success' | 'warning' | 'error' = 'info';

  @property({ type: Boolean, reflect: true })
  dismissible = false;

  override render() {
    return html`
      <hx-icon name="info" part="icon"></hx-icon>
      <div part="content"><slot></slot></div>
      ${this.dismissible
        ? html`<button part="close" @click=${this._dismiss}>×</button>`
        : nothing}
    `;
  }

  private _dismiss() {
    this.dispatchEvent(
      new CustomEvent('hx-dismiss', { bubbles: true, composed: true }),
    );
  }
}
```

**Key pattern:** The `variant` property has `reflect: true`, which means setting `element.variant = 'success'` from JavaScript also sets the `variant="success"` attribute on the element. This makes the `:host([variant='success'])` CSS rule activate for both HTML-initialized and JavaScript-set values.

## `reflect: true` — The Bridge to `:host([attr])`

For `:host([attr])` CSS rules to work when a property is set from JavaScript, the property must have `reflect: true`:

```typescript
// Without reflect: true
@property({ type: Boolean })
disabled = false;

// element.disabled = true;
// → property changes, re-render, but NO 'disabled' attribute on element
// → :host([disabled]) CSS rule does NOT activate

// With reflect: true
@property({ type: Boolean, reflect: true })
disabled = false;

// element.disabled = true;
// → property changes, re-render, AND 'disabled' attribute is set
// → :host([disabled]) CSS rule ACTIVATES
```

HELiX convention: reflect all properties that are used in `:host([attr])` CSS selectors.

## `:host-context()` — Ancestor-Based Host Styling

`:host-context(selector)` applies styles to the host when any ancestor matches the given selector. This is useful for context-sensitive styling such as dark mode or density variants.

```typescript
static override styles = [
  tokenStyles,
  css`
    :host {
      --_bg: var(--hx-color-white);
      --_color: var(--hx-color-neutral-900);
    }

    /* Dark mode from ancestor */
    :host-context(.dark) {
      --_bg: var(--hx-color-neutral-800);
      --_color: var(--hx-color-neutral-100);
    }

    /* Compact density from ancestor */
    :host-context([data-density='compact']) {
      --_padding: var(--hx-spacing-xs) var(--hx-spacing-sm);
      font-size: var(--hx-font-size-sm);
    }
  `,
];
```

Note: `:host-context()` browser support is good in Chromium but has historically been absent from Firefox and Safari (they are working on it). For production use, prefer CSS custom properties set on ancestor elements as the density/theme propagation mechanism instead:

```css
/* More compatible: parent sets a custom property */
.dark { --hx-surface: var(--hx-color-neutral-800); }

/* Component reads it */
:host { background: var(--hx-surface); }
```

## `this` in Lifecycle Methods = the Host Element

Inside lifecycle methods and event handlers, `this` refers to the component instance, which is the same as the shadow host element. All DOM element methods are available:

```typescript
override connectedCallback() {
  super.connectedCallback();
  // this === the hx-button element
  this.setAttribute('role', 'button');
  this.style.setProperty('--hx-button-width', '100%');
}

override firstUpdated() {
  // Measure the host element's dimensions
  const rect = this.getBoundingClientRect();
  this._width = rect.width;
}
```

You can also set attributes and properties directly on the host to influence external consumers:

```typescript
override updated(changed: PropertyValues<this>) {
  if (changed.has('loading')) {
    // Expose loading state on the host for external CSS
    this.toggleAttribute('loading', this.loading);
    // ARIA: announce busy state
    this.setAttribute('aria-busy', String(this.loading));
  }
}
```

## Inheriting from the Host

Some CSS properties inherit into shadow DOM by default (color, font-family, font-size, line-height). Setting these on the host propagates them into the shadow tree without any special configuration:

```css
/* External CSS on the host */
hx-button {
  color: var(--hx-color-primary-600);
  font-family: 'Inter', sans-serif;
}
```

Inside the shadow root, `color` and `font-family` inherit automatically. This is intentional and useful for typographic consistency — components pick up the page's font settings by default.

Use `all: initial` in shadow styles to reset inherited properties if a component needs full isolation:

```typescript
css`
  :host {
    all: initial; /* Resets ALL inherited properties */
    display: block; /* Must be explicitly set after all: initial */
    /* Re-apply only what we want */
    font-family: var(--hx-font-family-base);
  }
`
```

## Sizing the Host Element

Set dimensions on `:host`, not on the first internal div:

```typescript
static override styles = [
  tokenStyles,
  css`
    /* Correct: size the host */
    :host {
      display: block;
      width: 100%;
      min-height: 2.5rem;
    }

    /* Avoid: sizing an internal element for layout purposes */
    .wrapper {
      width: 100%; /* Consumer can't override this easily */
    }
  `,
];
```

External consumers control the host element directly with CSS:

```css
hx-card {
  max-width: 400px;
  height: 300px;
}
```

## Next Steps

- [Shadow DOM Architecture](/components-guide/shadow-dom/architecture/) — encapsulation and shadow root basics
- [Styling Shadow DOM](/components-guide/shadow-dom/styling/) — custom properties, `::slotted()`, `::part()`
- [Reactive Properties](/components-guide/fundamentals/reactive-properties/) — `reflect: true` details
- [CSS Parts](/components-guide/shadow-dom/parts/) — exposing internals for external styling
