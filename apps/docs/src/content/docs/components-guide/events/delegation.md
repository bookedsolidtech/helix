---
title: Event Delegation
description: Delegate event handling at the shadow root level in HELiX components, and understand how event targets behave across shadow DOM boundaries.
---

Event delegation is the pattern of attaching a single event listener to a parent element and using the event target to determine what action to take, rather than attaching individual listeners to each child element. In shadow DOM, delegation works slightly differently from the light DOM — the `composed` flag, retargeting, and the composed path all affect how you identify what was clicked.

## Basic Delegation in Shadow DOM

Attach the listener to the shadow root's container element rather than each individual child:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-nav')
export class HelixNav extends LitElement {
  static override styles = css`:host { display: block; }`;

  // Single handler on the container — not on each <button>
  private _handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-action]');

    if (!button) return;

    const action = (button as HTMLElement).dataset.action;
    this.dispatchEvent(
      new CustomEvent('hx-nav-action', {
        detail: { action },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <div class="nav" @click=${this._handleClick}>
        <button data-action="home">Home</button>
        <button data-action="about">About</button>
        <button data-action="contact">Contact</button>
      </div>
    `;
  }
}
```

The `@click=${this._handleClick}` binding on `.nav` catches clicks on any descendant through event bubbling. `e.target.closest('[data-action]')` safely walks up from the actual clicked element to find the relevant button.

## `e.target` vs `e.composedPath()`

When an event crosses shadow DOM boundaries, the browser **retargets** `e.target` to the host element. This means that from outside the shadow root, `event.target` on a click inside `hx-nav` will always be the `hx-nav` element itself — you cannot see the individual buttons.

Inside the shadow root's own event handler, `e.target` correctly reflects the actual element clicked.

```typescript
// Inside hx-nav's shadow DOM handler — target is accurate
private _handleClick(e: MouseEvent) {
  console.log(e.target); // <button data-action="home"> ← correct
}

// Outside, in a consumer
document.addEventListener('click', (e) => {
  console.log(e.target); // <hx-nav> ← retargeted by browser
});
```

To inspect the full path regardless of retargeting, use `e.composedPath()`:

```typescript
document.addEventListener('click', (e) => {
  const path = e.composedPath();
  // path[0] = <button data-action="home"> (if composed: true traversal is allowed)
  // For non-composed events, path stops at the shadow root boundary
});
```

Note: `composedPath()` entries inside a closed shadow root are not visible from outside. Open shadow roots (the Lit default) do expose the full path.

## Delegating at the Shadow Root Level

For very broad delegation, attach the listener directly to `this.shadowRoot`. This is rarely needed but useful when you want to catch events from all shadow DOM descendants regardless of structure:

```typescript
override connectedCallback() {
  super.connectedCallback();
  this.shadowRoot?.addEventListener('click', this._handleShadowClick);
}

override disconnectedCallback() {
  super.disconnectedCallback();
  this.shadowRoot?.removeEventListener('click', this._handleShadowClick);
}

private _handleShadowClick = (e: Event) => {
  const target = e.target as HTMLElement;
  // Handle any click inside the shadow root
};
```

Arrow function property syntax (`private _handleShadowClick = ...`) preserves `this` binding when the function is used as a callback directly. When using Lit template bindings (`@click=${...}`), Lit handles binding automatically.

## ARIA Delegation with `mixinDelegatesAria`

A common challenge in shadow DOM is connecting ARIA attributes on the host element to the interactive element inside the shadow root. For example, `aria-label` on `<hx-button>` should reach the `<button>` inside. HELiX provides `mixinDelegatesAria` for this:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { mixinDelegatesAria } from '@helixui/library/mixins';

const Base = mixinDelegatesAria(LitElement);

@customElement('hx-button')
export class HelixButton extends Base {
  override render() {
    return html`
      <!--
        The mixin forwards aria-label, aria-expanded, aria-controls, etc.
        from the host to this button element automatically.
      -->
      <button>
        <slot></slot>
      </button>
    `;
  }
}
```

With `mixinDelegatesAria`, a consumer can write:

```html
<hx-button accessible-label="Close dialog">X</hx-button>
```

And the `aria-label` correctly targets the inner `<button>` — not the `<hx-button>` host element that assistive technologies would otherwise see as a generic `div`.

## `delegatesFocus`

Lit components can opt in to native focus delegation by setting `delegatesFocus: true` on the shadow root. When the host element receives focus (e.g., from a `tabindex`), focus is automatically forwarded to the first focusable element inside the shadow root:

```typescript
override createRenderRoot() {
  return this.attachShadow({ mode: 'open', delegatesFocus: true });
}
```

This removes the need to manually call `this.shadowRoot.querySelector('button')?.focus()` when the host is focused.

## Next Steps

- [Custom Events](/components-guide/events/custom-events/) — dispatching events that cross shadow boundaries
- [Event Patterns and Best Practices](/components-guide/events/event-patterns/) — cleanup and listener options
- [Form Accessibility](/components-guide/forms/accessibility/) — ARIA delegation for form controls
