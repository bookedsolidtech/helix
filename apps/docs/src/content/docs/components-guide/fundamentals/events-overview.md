---
title: Events Overview
description: Bind event handlers in templates, dispatch custom events across shadow boundaries, and use @eventOptions for listener configuration.
---

Events are how components communicate changes to their host environment. Lit makes event binding concise with `@` syntax in templates. HELiX components use `CustomEvent` with `bubbles: true, composed: true` for events that need to cross shadow DOM boundaries.

## Binding Events in Templates

Use the `@` prefix in a Lit template to attach an event listener:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-counter')
export class HelixCounter extends LitElement {

  @property({ type: Number })
  value = 0;

  private _increment() {
    this.value += 1;
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _decrement() {
    this.value -= 1;
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  override render() {
    return html`
      <button @click=${this._decrement} aria-label="Decrease">−</button>
      <span>${this.value}</span>
      <button @click=${this._increment} aria-label="Increase">+</button>
    `;
  }
}
```

Lit's `@event` binding calls `addEventListener` on the element with the bound method. Lit manages listener removal automatically when the template re-renders or the component disconnects.

## Event Handler Methods

By HELiX convention, private event handlers are named with a `_` prefix:

```typescript
// Private handler — internal event, not part of public API
private _handleClick(event: MouseEvent) {
  event.preventDefault();
  this._toggle();
}

// Private handler for a specific element
private _handleInputChange(event: InputEvent) {
  const input = event.target as HTMLInputElement;
  this._value = input.value;
}
```

Always type event parameters specifically rather than using generic `Event`:

```typescript
private _handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    this._activate();
  }
}

private _handlePointerDown(event: PointerEvent) {
  this._startX = event.clientX;
}
```

## Method References vs Arrow Functions

Prefer method references over inline arrow functions for anything beyond a trivial toggle:

```typescript
// Preferred — stable reference, not recreated on every render
@click=${this._handleClick}

// OK for simple one-liners
@click=${() => (this._open = !this._open)}

// Avoid for multi-statement handlers — new function per render
@click=${() => { this._validate(); this._submit(); this._close(); }}
```

Method references are stable across renders, which matters if you later use `@eventOptions` or need to remove the listener manually.

## Dispatching Custom Events

Use `this.dispatchEvent()` to send events to consumers. Follow these rules for custom events in HELiX:

### Naming Convention

Custom event names use the `hx-` prefix and lowercase kebab-case:

```
hx-change, hx-close, hx-open, hx-select, hx-submit, hx-input
```

### `bubbles: true, composed: true`

Events that consumers need to observe must set both flags:

- `bubbles: true` — the event propagates up the DOM tree.
- `composed: true` — the event crosses shadow DOM boundaries.

Without `composed: true`, an event fired inside a shadow root stops at the shadow root and is never seen by listeners on the host element or above.

```typescript
private _handleChange(event: Event) {
  const input = event.target as HTMLInputElement;

  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true,
      detail: {
        value: input.value,
        checked: input.checked,
      },
    }),
  );
}
```

Consumer usage:

```javascript
document.querySelector('hx-checkbox').addEventListener('hx-change', (e) => {
  console.log(e.detail.checked); // true or false
});
```

### Events That Should NOT Cross the Boundary

Some events are truly internal — they communicate between elements within the same shadow tree. Omit `composed: true` for these:

```typescript
// Internal event — only seen within this component's shadow DOM
this.dispatchEvent(
  new CustomEvent('internal-state-change', {
    bubbles: true,
    composed: false, // stays inside shadow DOM
    detail: { phase: 'closing' },
  }),
);
```

## Listening to Events from Child Components

When listening to events fired by child components inside your template, use the same `@` binding syntax:

```typescript
@customElement('hx-form')
export class HelixForm extends LitElement {

  private _handleInputChange(event: CustomEvent<{ value: string; name: string }>) {
    this._formData[event.detail.name] = event.detail.value;
  }

  override render() {
    return html`
      <form @submit=${this._handleSubmit}>
        <slot @hx-change=${this._handleInputChange}></slot>
        <hx-button type="submit">Submit</hx-button>
      </form>
    `;
  }
}
```

Events that bubble and are composed will propagate up through slot projections, making this pattern work even when the form inputs are slotted from outside the shadow root.

## `@eventOptions` Decorator

The `@eventOptions` decorator sets `addEventListener` options for a method used in a template binding:

```typescript
import { eventOptions } from 'lit/decorators.js';

@customElement('hx-scroll-area')
export class HelixScrollArea extends LitElement {

  // passive: true — cannot call preventDefault(), improves scroll performance
  @eventOptions({ passive: true })
  private _handleScroll(_event: Event) {
    this._updateShadowIndicator();
  }

  // capture: true — fires on capture phase before bubbling
  @eventOptions({ capture: true })
  private _handleFocusCapture(_event: FocusEvent) {
    this._lastFocusedElement = document.activeElement as HTMLElement;
  }

  // once: true — listener automatically removed after first call
  @eventOptions({ once: true })
  private _handleFirstInteraction() {
    this._initAnalytics();
  }

  override render() {
    return html`
      <div
        class="scroll-area"
        @scroll=${this._handleScroll}
        @focusin=${this._handleFocusCapture}
        @pointerdown=${this._handleFirstInteraction}
      >
        <slot></slot>
      </div>
    `;
  }
}
```

Always use `passive: true` for scroll and touch event handlers to avoid blocking the browser's scroll thread.

## Listening to Window and Document Events

For events on `window` or `document`, add and remove listeners in `connectedCallback`/`disconnectedCallback`:

```typescript
@customElement('hx-hotkeys')
export class HelixHotkeys extends LitElement {

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._handleGlobalKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._handleGlobalKeyDown);
  }

  // Arrow function to preserve `this` context when used as a callback
  private _handleGlobalKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.dispatchEvent(
        new CustomEvent('hx-dismiss', { bubbles: true, composed: true }),
      );
    }
  };

  override render() {
    return html`<slot></slot>`;
  }
}
```

Use an arrow function (class field) rather than a regular method when passing to `addEventListener`, so `this` is correctly bound.

## Event Typing Reference

| Event name pattern | Use case |
|---|---|
| `hx-change` | Value changed by user interaction |
| `hx-input` | Value changing (before change is committed) |
| `hx-open` | Component opened / expanded |
| `hx-close` | Component closed / collapsed |
| `hx-select` | An item was selected |
| `hx-submit` | A form-like component submitted |
| `hx-dismiss` | User dismissed a notification or overlay |

## Next Steps

- [Shadow DOM Events](/components-guide/shadow-dom/events/) — event retargeting and `composedPath()`
- [Decorators](/components-guide/fundamentals/decorators/) — `@eventOptions` reference
- [Template Syntax](/components-guide/fundamentals/template-syntax/) — `@event` binding details
- [Component Lifecycle](/components-guide/fundamentals/lifecycle/) — `connectedCallback` for external listeners
