---
title: Component Lifecycle
description: Understand every lifecycle hook in a LitElement component, from construction through updates to removal.
---

Lit components go through a predictable lifecycle from creation to removal. Understanding each phase helps you safely access the DOM, manage event listeners, and perform side effects at the right time. All lifecycle methods use the `override` keyword in HELiX components because they are declared on the `LitElement` base class.

## Lifecycle Overview

| Method | Phase | When it runs |
|---|---|---|
| `constructor()` | Construction | Element is created (class instantiation) |
| `connectedCallback()` | Connection | Element is inserted into the document |
| `disconnectedCallback()` | Disconnection | Element is removed from the document |
| `adoptedCallback()` | Adoption | Element is moved to a new document |
| `attributeChangedCallback()` | Attribute change | An observed attribute changes |
| `willUpdate(changed)` | Pre-render | Before each update; use to compute derived state |
| `update(changed)` | Render | Lit calls `render()` and writes to DOM |
| `firstUpdated(changed)` | Post-first-render | After the very first render; access DOM elements |
| `updated(changed)` | Post-render | After every render; side effects based on new state |

## Standard Web Component Callbacks

### `constructor()`

The constructor runs when the element class is instantiated. Lit uses it to set up reactive properties and the shadow root. You should generally not override the constructor; use `connectedCallback()` for initialization that requires DOM access.

```typescript
@customElement('hx-tooltip')
export class HelixTooltip extends LitElement {
  static override styles = [tokenStyles];

  // Initialize properties with defaults here (TypeScript field initializers)
  @property({ type: String })
  content = '';

  @state()
  private _visible = false;
}
```

If you must override the constructor, always call `super()` first:

```typescript
constructor() {
  super();
  // Safe: no DOM access, no property reads that depend on attributes
  this._id = `hx-tooltip-${Math.random().toString(36).slice(2)}`;
}
```

### `connectedCallback()`

Called when the element is inserted into a document. Use this for:

- Adding event listeners to `window`, `document`, or external elements
- Starting observers (ResizeObserver, IntersectionObserver, MutationObserver)
- Fetching initial data

Always call `super.connectedCallback()` first — Lit needs it to schedule the first update.

```typescript
override connectedCallback() {
  super.connectedCallback();
  window.addEventListener('keydown', this._handleKeyDown);
  this._resizeObserver.observe(this);
}
```

### `disconnectedCallback()`

Called when the element is removed from a document. Use this to clean up everything added in `connectedCallback()`.

Always call `super.disconnectedCallback()` — Lit uses it to pause update scheduling.

```typescript
override disconnectedCallback() {
  super.disconnectedCallback();
  window.removeEventListener('keydown', this._handleKeyDown);
  this._resizeObserver.unobserve(this);
}
```

### `adoptedCallback()`

Called when the element is moved to a new document (e.g., via `document.adoptNode()`). Rare in practice but useful for components embedded in iframes.

```typescript
override adoptedCallback() {
  super.adoptedCallback();
  // Re-initialize any document-level bindings
}
```

### `attributeChangedCallback()`

Called when an observed attribute changes. Lit handles this automatically for `@property()` fields — you rarely need to override it directly. When you do, always call `super.attributeChangedCallback()`:

```typescript
override attributeChangedCallback(
  name: string,
  oldValue: string | null,
  newValue: string | null,
) {
  super.attributeChangedCallback(name, oldValue, newValue);
  // Custom handling if needed
}
```

## Lit Update Lifecycle

These methods are called during Lit's asynchronous update cycle.

### `willUpdate(changed: PropertyValues)`

Called before `render()` on every update. Use it to compute derived state that depends on other properties — this avoids recomputing in `render()` on every call.

`willUpdate()` runs before the DOM is updated, so avoid accessing `this.shadowRoot` here.

```typescript
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-progress')
export class HelixProgress extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 100;

  @state()
  private _percentage = 0;

  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('value') || changed.has('max')) {
      this._percentage = Math.round((this.value / this.max) * 100);
    }
  }

  override render() {
    return html`
      <div
        role="progressbar"
        aria-valuenow=${this.value}
        aria-valuemax=${this.max}
        aria-valuetext="${this._percentage}%"
      >
        <div class="bar" style="width: ${this._percentage}%"></div>
      </div>
    `;
  }
}
```

### `update(changed: PropertyValues)`

Called to perform the actual DOM update. Lit's implementation calls `render()` and writes the result to the shadow DOM. You rarely need to override this. If you do, call `super.update(changed)` to ensure `render()` runs.

### `firstUpdated(changed: PropertyValues)`

Called once after the first render. The shadow DOM is available here, so you can safely query elements with `this.shadowRoot` or `@query` properties.

Common uses:

- Set initial focus
- Measure element dimensions
- Initialize third-party libraries that need a DOM node

```typescript
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-autofocus-input')
export class HelixAutofocusInput extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Boolean })
  autofocus = false;

  @query('input')
  private _input!: HTMLInputElement;

  override firstUpdated(_changed: PropertyValues<this>) {
    if (this.autofocus) {
      this._input.focus();
    }
  }

  override render() {
    return html`<input type="text" />`;
  }
}
```

### `updated(changed: PropertyValues)`

Called after every render (including the first). The shadow DOM reflects the latest state. Use this for side effects that depend on the new DOM state — for example, scrolling, animations, or notifying parent components.

```typescript
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-dialog')
export class HelixDialog extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Boolean, reflect: true })
  open = false;

  override updated(changed: PropertyValues<this>) {
    if (changed.has('open')) {
      if (this.open) {
        this.dispatchEvent(
          new CustomEvent('hx-open', { bubbles: true, composed: true }),
        );
        // Focus the first focusable element inside the dialog
        this.shadowRoot?.querySelector<HTMLElement>('[autofocus]')?.focus();
      } else {
        this.dispatchEvent(
          new CustomEvent('hx-close', { bubbles: true, composed: true }),
        );
      }
    }
  }

  override render() {
    return html`
      <div role="dialog" aria-modal="true" ?hidden=${!this.open}>
        <slot></slot>
      </div>
    `;
  }
}
```

## The `PropertyValues` Map

Both `willUpdate`, `firstUpdated`, and `updated` receive a `PropertyValues` map. This is a `Map<string | number | symbol, unknown>` where the keys are property names and the values are the **previous** values before the update.

```typescript
override updated(changed: PropertyValues<this>) {
  // Check if a specific property changed
  if (changed.has('open')) {
    const previousValue = changed.get('open'); // the old value
    console.log(`open changed from ${previousValue} to ${this.open}`);
  }

  // Run logic only when certain props change
  if (changed.has('value') || changed.has('min') || changed.has('max')) {
    this._validateRange();
  }
}
```

Typing it as `PropertyValues<this>` gives TypeScript correct key inference for your component's properties.

## Complete Lifecycle Example

```typescript
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-timer')
export class HelixTimer extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: inline-block; }
    `,
  ];

  @property({ type: Number })
  duration = 60;

  @state()
  private _remaining = 60;

  @state()
  private _running = false;

  private _intervalId: ReturnType<typeof setInterval> | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this._remaining = this.duration;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._intervalId);
  }

  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('duration')) {
      this._remaining = this.duration;
    }
  }

  override updated(changed: PropertyValues<this>) {
    if (changed.has('_running')) {
      if (this._running) {
        this._intervalId = setInterval(() => {
          this._remaining -= 1;
          if (this._remaining <= 0) {
            this._running = false;
            this.dispatchEvent(new CustomEvent('hx-complete', { bubbles: true, composed: true }));
          }
        }, 1000);
      } else {
        clearInterval(this._intervalId);
      }
    }
  }

  override render() {
    return html`
      <span>${this._remaining}s</span>
      <button @click=${() => (this._running = !this._running)}>
        ${this._running ? 'Pause' : 'Start'}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-timer': HelixTimer;
  }
}
```

## Next Steps

- [Rendering and Updates](/components-guide/fundamentals/rendering/) — async update cycle and `updateComplete`
- [Reactive Properties](/components-guide/fundamentals/reactive-properties/) — `@property` and `@state` details
- [Events Overview](/components-guide/fundamentals/events-overview/) — dispatching and handling events
