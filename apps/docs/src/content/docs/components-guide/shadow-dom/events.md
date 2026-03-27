---
title: Events and the Shadow Boundary
description: How events behave across shadow DOM boundaries — retargeting, composed events, composedPath(), and which events should stay internal.
---

Events in the web platform interact with shadow DOM in subtle ways. Understanding event retargeting, the `composed` flag, and `composedPath()` is essential for building components that integrate correctly with surrounding applications.

## Event Retargeting

When an event originating inside a shadow tree bubbles out through the shadow boundary, the browser **retargets** it. The event's `target` property is changed to the shadow host (the custom element), hiding the internal implementation detail.

```javascript
const button = document.querySelector('hx-button');
button.addEventListener('click', (event) => {
  console.log(event.target); // hx-button — NOT the internal <button>
});
```

From outside the shadow root, you only see `hx-button`. This is correct behavior — consumers should not need to know or care that there is an internal `<button>` element.

Inside the shadow tree, the `target` is the actual element:

```typescript
override render() {
  return html`
    <button @click=${this._handleInternalClick}>
      <slot></slot>
    </button>
  `;
}

private _handleInternalClick(event: MouseEvent) {
  console.log(event.target); // the internal <button> element
}
```

## The `composed` Property

An event's `composed` property controls whether it can cross shadow DOM boundaries:

- `composed: true` — the event propagates through shadow boundaries and is visible to listeners in ancestor documents.
- `composed: false` (default) — the event is contained within the shadow tree where it was dispatched.

Most native DOM events are composed:

```javascript
// Native events that are composed (cross shadow boundaries)
// click, input, change, focus, blur, keydown, keyup, pointerdown, pointerup, etc.

// Native events that are NOT composed (stay within shadow tree)
// slotchange, load, scroll (in some contexts)
```

Check `event.composed` to verify:

```javascript
document.addEventListener('click', (e) => {
  console.log(e.composed); // true — click is composed
});
```

## Custom Events: Always Use `bubbles: true, composed: true`

Custom events dispatched inside a shadow root default to `composed: false`. Without `composed: true`, listeners on the host element or its ancestors will never see the event.

```typescript
// Wrong — event stops at the shadow root, consumers never see it
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    // composed defaults to false!
    detail: { value: this.value },
  }),
);

// Correct — event crosses shadow boundary
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: { value: this.value },
  }),
);
```

Consumer listener (works correctly with `composed: true`):

```javascript
document.querySelector('hx-text-input').addEventListener('hx-change', (e) => {
  console.log(e.detail.value); // receives the event
});

// Also works on ancestor elements due to bubbling
document.querySelector('form').addEventListener('hx-change', (e) => {
  console.log(e.target); // hx-text-input (retargeted to shadow host)
});
```

## `composedPath()`

`event.composedPath()` returns the full event propagation path, including elements inside shadow trees. This is the only way to see the original target when listening from outside the shadow root.

```javascript
document.addEventListener('click', (event) => {
  const path = event.composedPath();
  console.log(path);
  // [button.btn (shadow DOM), slot (shadow DOM), hx-button, body, html, document, window]

  // The first item is the actual origin
  const origin = path[0];
  console.log(origin.tagName); // BUTTON (the internal shadow DOM button)
});
```

`composedPath()` only works while the event is actively dispatching. It returns an empty array after the event handler returns.

HELiX use case — determining if a click was on an internal close button:

```typescript
private _handleDocumentClick = (event: MouseEvent) => {
  const path = event.composedPath();
  // If the click path includes this element, it was inside our component
  if (!path.includes(this)) {
    this.open = false;
  }
};
```

## Events That Should NOT Cross the Boundary

Not all events should be composed. Internal implementation events that have no meaning to consumers should stay within the shadow tree:

```typescript
// Internal event — only relevant to sibling elements in the same shadow tree
private _notifyInternalPanel() {
  this.dispatchEvent(
    new CustomEvent('internal-panel-updated', {
      bubbles: true,
      composed: false, // explicitly stays inside shadow DOM
      detail: { panelId: this._activePanel },
    }),
  );
}
```

Guidelines for choosing `composed` value:

| Event type | `composed` | Rationale |
|---|---|---|
| User interaction result (`hx-change`, `hx-select`) | `true` | Consumers need to react to user actions |
| Component state change (`hx-open`, `hx-close`) | `true` | Consumers need to track overlay state |
| Internal coordination (panel sync, selection state) | `false` | Implementation detail, not consumer concern |
| `slotchange` (browser fires this) | `false` | Only relevant within the shadow tree |

## Focus Events and Shadow DOM

`focus` and `blur` are composed events, but they have a quirk: `focusin` and `focusout` are also composed and additionally bubble, making them more useful for delegation patterns.

```typescript
// focusin bubbles — useful for detecting focus within a container
override render() {
  return html`
    <div
      class="input-group"
      @focusin=${this._handleFocusIn}
      @focusout=${this._handleFocusOut}
    >
      <slot></slot>
    </div>
  `;
}

private _handleFocusIn(_event: FocusEvent) {
  this.toggleAttribute('focused', true);
}

private _handleFocusOut(event: FocusEvent) {
  // Check if focus moved to an element still within this component
  const path = event.composedPath();
  if (!path.includes(this)) {
    this.toggleAttribute('focused', false);
  }
}
```

## Preventing Propagation Across Boundaries

To stop a native event from bubbling beyond a component (uncommon but occasionally needed):

```typescript
private _handleInternalClick(event: MouseEvent) {
  // Stop the click from propagating further — callers won't see it
  event.stopPropagation();

  // Handle the interaction and dispatch a semantic custom event instead
  this.dispatchEvent(
    new CustomEvent('hx-activate', { bubbles: true, composed: true }),
  );
}
```

`stopPropagation()` prevents further bubbling. `stopImmediatePropagation()` also prevents other listeners on the same element from running.

## Event Delegation Across Shadow DOM

Traditional event delegation (`parentElement.addEventListener('click', ...)`) works across shadow boundaries for composed events, but `event.target` is retargeted. Use `composedPath()` to identify the actual origin:

```typescript
override connectedCallback() {
  super.connectedCallback();
  this.addEventListener('click', this._handleDelegatedClick);
}

private _handleDelegatedClick(event: MouseEvent) {
  const path = event.composedPath();
  // Find if a specific internal element was clicked
  const item = path.find(
    (el) => el instanceof HTMLElement && el.matches('[data-item-id]'),
  ) as HTMLElement | undefined;

  if (item) {
    this._selectItem(item.dataset.itemId!);
  }
}
```

## Next Steps

- [Shadow DOM Architecture](/components-guide/shadow-dom/architecture/) — encapsulation fundamentals
- [Events Overview](/components-guide/fundamentals/events-overview/) — dispatching events from components
- [The Host Element](/components-guide/shadow-dom/host-element/) — `:host` and host-based event patterns
