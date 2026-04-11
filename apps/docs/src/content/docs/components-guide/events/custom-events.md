---
title: Custom Events
description: Dispatch typed CustomEvents from HELiX components with the correct bubbles and composed flags for cross-shadow-DOM communication.
---

HELiX components communicate outward through custom DOM events. Custom events integrate naturally with every framework and with plain HTML — consumers attach event listeners the same way they would for any built-in DOM event.

## Dispatching a Custom Event

Use the `CustomEvent` constructor and dispatch it with `this.dispatchEvent()`:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-counter')
export class HelixCounter extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property({ type: Number }) value = 0;

  private _increment() {
    this.value += 1;
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <button @click=${this._increment}>Count: ${this.value}</button>
    `;
  }
}
```

## `bubbles: true, composed: true`

Both flags are **required** for events that need to cross shadow DOM boundaries.

- `bubbles: true` — the event propagates up the DOM tree. Without this the event stops at the shadow root and the host element never sees it.
- `composed: true` — the event crosses shadow DOM boundaries. Without this, the event is retargeted and stops at the shadow root when it reaches the light DOM.

```typescript
// Will NOT reach consumers in light DOM — missing composed: true
new CustomEvent('hx-change', { bubbles: true })

// Will NOT bubble to ancestors — missing bubbles: true
new CustomEvent('hx-change', { composed: true })

// Correct — crosses shadow boundary AND bubbles up the tree
new CustomEvent('hx-change', { bubbles: true, composed: true })
```

## Event Naming Convention

HELiX event names follow the `hx-{action}` pattern for general-purpose events and `hx-{component}-{action}` when the event is specific to one component type:

| Pattern | Example | When to use |
|---|---|---|
| `hx-{action}` | `hx-change`, `hx-select`, `hx-close` | Reusable semantic events |
| `hx-{component}-{action}` | `hx-dialog-open`, `hx-tab-change` | Component-specific events |

Use lowercase with hyphens. Never use camelCase in event names (`hxChange` would require `addEventListener('hxChange', ...)` rather than `@hxChange` in most frameworks).

## TypeScript: Typed `CustomEvent<T>`

Define a `detail` interface for every event your component dispatches. This enables type-safe event listener code:

```typescript
// Type the detail payload
interface HxChangeDetail {
  value: number;
  previousValue: number;
}

// Use the typed constructor
this.dispatchEvent(
  new CustomEvent<HxChangeDetail>('hx-change', {
    detail: { value: this.value, previousValue: prev },
    bubbles: true,
    composed: true,
  })
);
```

Augment the global event map to provide IDE completion when consumers call `addEventListener`:

```typescript
declare global {
  interface HTMLElementEventMap {
    'hx-change': CustomEvent<HxChangeDetail>;
  }
}
```

## `@fires` JSDoc Documentation

Document every event with the `@fires` JSDoc tag:

```typescript
/**
 * Fired when the counter value changes.
 *
 * @fires {CustomEvent<{ value: number; previousValue: number }>} hx-change
 */
@customElement('hx-counter')
export class HelixCounter extends LitElement { ... }
```

## Consumer Usage

### Plain JavaScript

```javascript
const counter = document.querySelector('hx-counter');
counter.addEventListener('hx-change', (e) => {
  console.log('New value:', e.detail.value);
});
```

### TypeScript with typed detail

```typescript
const counter = document.querySelector('hx-counter')!;
counter.addEventListener('hx-change', (e: CustomEvent<HxChangeDetail>) => {
  console.log('New value:', e.detail.value);
  console.log('Previous:', e.detail.previousValue);
});
```

### Lit template binding

```typescript
html`
  <hx-counter
    .value=${this.count}
    @hx-change=${(e: CustomEvent<HxChangeDetail>) => {
      this.count = e.detail.value;
    }}
  ></hx-counter>
`
```

### React (via event delegation)

```jsx
<hx-counter
  ref={counterRef}
  onHxChange={(e) => setCount(e.detail.value)}
/>
// Or use an effect to add the listener imperatively
```

## Event Cancellation

If your event represents a cancellable action (like a "before close" event), set `cancelable: true` and check `defaultPrevented` before proceeding:

```typescript
private _requestClose() {
  const event = new CustomEvent('hx-before-close', {
    detail: {},
    bubbles: true,
    composed: true,
    cancelable: true,
  });

  this.dispatchEvent(event);

  if (!event.defaultPrevented) {
    this.open = false;
  }
}
```

The consumer can then cancel the close:

```javascript
dialog.addEventListener('hx-before-close', (e) => {
  if (formIsDirty) {
    e.preventDefault(); // dialog stays open
  }
});
```

## Next Steps

- [Event Patterns and Best Practices](/components-guide/events/event-patterns/) — cleanup, passive listeners, once
- [Event Delegation](/components-guide/events/delegation/) — handling events at the shadow root
- [Event Bus Pattern](/components-guide/events/event-bus/) — cross-component communication
