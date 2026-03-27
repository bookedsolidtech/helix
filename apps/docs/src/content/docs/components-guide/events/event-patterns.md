---
title: Event Patterns and Best Practices
description: Patterns for preventing duplicate handlers, using listener options, re-dispatching events, and cleaning up properly in HELiX components.
---

Correct event handling in web components requires more discipline than in framework components. Shadow DOM encapsulation, component lifecycle, and the composed event path all create opportunities for subtle bugs. This page collects the patterns that prevent the most common issues.

## Preventing Duplicate Event Handlers

The most common event bug in Lit components is attaching a new imperative listener every time a property updates or the component reconnects. Use one of these approaches to guarantee a single listener registration.

### Declarative Lit template bindings (preferred)

Lit template bindings (`@event=${handler}`) are managed by Lit — they are attached once and updated if the handler reference changes. This is the safest approach and requires no manual cleanup:

```typescript
override render() {
  return html`
    <button @click=${this._handleClick}>Click me</button>
  `;
}

private _handleClick(e: MouseEvent) {
  // Lit handles attachment and cleanup automatically
}
```

### Imperative listeners in `connectedCallback`

When you must add listeners imperatively (to `window`, `document`, or external elements), add them in `connectedCallback` and remove them in `disconnectedCallback`:

```typescript
override connectedCallback() {
  super.connectedCallback();
  window.addEventListener('resize', this._handleResize);
  document.addEventListener('keydown', this._handleKeydown);
}

override disconnectedCallback() {
  super.disconnectedCallback();
  window.removeEventListener('resize', this._handleResize);
  document.removeEventListener('keydown', this._handleKeydown);
}

// Arrow property — fixed reference, works with add/removeEventListener
private _handleResize = () => { ... };
private _handleKeydown = (e: KeyboardEvent) => { ... };
```

Never register imperative listeners in `updated()` or `render()` — those methods run on every update and would add a new listener each time.

## `@eventOptions` Decorator

The `@eventOptions` decorator (from `lit/decorators.js`) sets `AddEventListenerOptions` on a Lit template binding:

```typescript
import { eventOptions } from 'lit/decorators.js';

@customElement('hx-scroll-area')
export class HelixScrollArea extends LitElement {
  // passive: true — cannot call preventDefault(), allows browser scroll optimization
  @eventOptions({ passive: true })
  private _handleScroll(e: Event) {
    // Handle scroll without blocking the browser's scroll thread
  }

  // capture: true — fires during capture phase, before bubbling
  @eventOptions({ capture: true })
  private _handleFocusin(e: FocusEvent) {
    // Focusin during capture to catch focus entering any descendant
  }

  override render() {
    return html`
      <div
        class="scroll-container"
        @scroll=${this._handleScroll}
        @focusin=${this._handleFocusin}
      >
        <slot></slot>
      </div>
    `;
  }
}
```

### `once: true` for one-time listeners

```typescript
// Using eventOptions decorator
@eventOptions({ once: true })
private _handleFirstInteraction(e: Event) {
  // Fires exactly once, then the listener is automatically removed
  this._trackFirstInteraction();
}

// Or with addEventListener directly
this.shadowRoot?.querySelector('button')?.addEventListener(
  'click',
  this._handleFirstInteraction,
  { once: true }
);
```

## Re-Dispatching Events with `composed: true`

When a component wraps a native element or child component, you may need to forward its events to the host element. Re-dispatch with `composed: true` so the event crosses the shadow boundary:

```typescript
private _handleNativeChange(e: Event) {
  // Stop the original event — it won't cross the shadow boundary anyway
  e.stopPropagation();

  const input = e.target as HTMLInputElement;

  // Re-dispatch from the host element so consumers can hear it
  this.dispatchEvent(
    new CustomEvent('hx-change', {
      detail: { value: input.value },
      bubbles: true,
      composed: true,
    })
  );
}

override render() {
  return html`
    <input type="text" @change=${this._handleNativeChange} />
  `;
}
```

Note: `e.stopPropagation()` on the native `change` event is optional but prevents the raw event from leaking out alongside the re-dispatched `hx-change`. In most cases this is the right choice for a clean component API.

## Event Cancellation with `preventDefault()`

For cancellable events, always check `cancelable` before acting on `defaultPrevented`:

```typescript
private async _handleSubmit() {
  const event = new CustomEvent('hx-submit', {
    detail: { value: this._value },
    bubbles: true,
    composed: true,
    cancelable: true,
  });

  this.dispatchEvent(event);

  // Only proceed if the consumer didn't cancel
  if (event.defaultPrevented) return;

  await this._submitForm();
}
```

Consumer cancels:
```javascript
form.addEventListener('hx-submit', (e) => {
  if (!isValid(e.detail.value)) {
    e.preventDefault();
  }
});
```

## Cleanup in `disconnectedCallback`

Always mirror every `addEventListener` call in `connectedCallback` with a `removeEventListener` call in `disconnectedCallback`. Missing cleanup causes memory leaks and unexpected behavior when the component is removed and re-added to the DOM.

```typescript
override connectedCallback() {
  super.connectedCallback();
  window.addEventListener('scroll', this._handleWindowScroll, { passive: true });
  this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  this._mediaQuery.addEventListener('change', this._handleThemeChange);
}

override disconnectedCallback() {
  super.disconnectedCallback();
  window.removeEventListener('scroll', this._handleWindowScroll);
  this._mediaQuery?.removeEventListener('change', this._handleThemeChange);
  this._mediaQuery = null;
}
```

## Passive Listeners for Scroll Performance

Mark scroll and touch listeners as `passive: true` whenever you do not call `preventDefault()`. This tells the browser the listener will not block scrolling and allows hardware-accelerated scroll to proceed immediately:

```typescript
// In connectedCallback:
window.addEventListener('scroll', this._handleScroll, { passive: true });

// Or with @eventOptions in a template:
@eventOptions({ passive: true })
private _handleScroll(e: Event) { ... }
```

The browser will throw a warning if you try to call `preventDefault()` on a passive listener — use non-passive listeners only when you genuinely need to block the default action.

## Summary

| Scenario | Recommended pattern |
|---|---|
| Handler on shadow DOM element | Lit template `@event=${handler}` |
| Handler on `window` / `document` | `connectedCallback` + `disconnectedCallback` |
| One-time handler | `{ once: true }` option |
| Scroll / touch listener | `{ passive: true }` option |
| Re-dispatching an inner event | New `CustomEvent` with `bubbles: true, composed: true` |
| Cancellable action | `cancelable: true` + check `defaultPrevented` |

## Next Steps

- [Custom Events](/components-guide/events/custom-events/) — dispatching typed events
- [Event Delegation](/components-guide/events/delegation/) — single handler for multiple children
- [Event Bus Pattern](/components-guide/events/event-bus/) — cross-component communication
