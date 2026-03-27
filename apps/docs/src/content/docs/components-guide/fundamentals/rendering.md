---
title: Rendering and Updates
description: Understand Lit's asynchronous update mechanism, batched property changes, updateComplete, and manual update triggers.
---

Lit's rendering model is asynchronous and batched. Understanding how and when updates are scheduled prevents common bugs involving stale DOM reads and redundant renders.

## The Asynchronous Update Cycle

When a reactive property (or `@state` field) changes, Lit does **not** immediately call `render()`. Instead, it schedules an asynchronous microtask update. This means:

1. You set one or more properties synchronously.
2. Lit marks the component as "needs update" and queues a microtask.
3. The current synchronous JavaScript finishes.
4. The microtask fires: Lit runs the full update cycle.
5. The DOM reflects the new state.

This design allows multiple property changes in the same synchronous block to be batched into a single render pass.

```typescript
// Only ONE render cycle, not three
this.variant = 'primary';
this.disabled = false;
this.loading = true;

// DOM is NOT updated yet at this point
// await this.updateComplete to read updated DOM
```

## The Update Pipeline

Each update runs through this ordered sequence of methods:

```
Property change detected
        ↓
  scheduleUpdate()    — queues microtask (or custom scheduler)
        ↓
  performUpdate()     — runs the full pipeline
        ↓
  shouldUpdate()      — can abort if returns false
        ↓
  willUpdate(changed) — compute derived state, no DOM access
        ↓
  update(changed)     — call render(), write to shadow DOM
        ↓
  render()            — return TemplateResult
        ↓
  firstUpdated()      — runs only on first update
        ↓
  updated(changed)    — side effects, DOM access safe
        ↓
  updateComplete resolves
```

### `shouldUpdate(changed: PropertyValues)`

Return `false` to skip the render entirely for a given set of changes. Rarely needed, but useful for expensive renders that should be gated:

```typescript
override shouldUpdate(changed: PropertyValues<this>): boolean {
  // Only render if the visible props changed
  return changed.has('label') || changed.has('variant') || changed.has('disabled');
}
```

### `scheduleUpdate()`

Override to customize the update timing. The default implementation uses a microtask (Promise resolution). An alternative is to defer to `requestAnimationFrame`:

```typescript
override async scheduleUpdate(): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => resolve()),
  );
  super.scheduleUpdate();
}
```

This defers rendering to the next animation frame, smoothing out rapid property changes that would otherwise cause visual jank.

### `performUpdate()`

Runs the full update pipeline immediately, bypassing the scheduler. Useful for synchronous testing:

```typescript
// In tests: force a synchronous update
element.label = 'New label';
element.performUpdate();
// DOM is now updated synchronously
```

## `updateComplete`

`updateComplete` is a `Promise<boolean>` that resolves after the next update cycle completes. Use it whenever you need to read the DOM after changing a property.

```typescript
async _handleSubmit() {
  this.loading = true;
  await this.updateComplete;
  // DOM now shows the loading state
  this._submitButton.setAttribute('aria-busy', 'true');
}
```

```typescript
// In tests
element.open = true;
await element.updateComplete;
expect(element.shadowRoot!.querySelector('[role="dialog"]')).not.toBeNull();
```

`updateComplete` resolves to `true` if the update completed normally, or `false` if `shouldUpdate` returned false.

For components that trigger further updates in `updated()`, you may need to await multiple times or use a loop:

```typescript
// Await all pending updates
while (element.isUpdatePending) {
  await element.updateComplete;
}
```

## Batched Updates

Multiple property changes in the same synchronous block result in a single render:

```typescript
@customElement('hx-form-field')
export class HelixFormField extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  invalid = false;

  @property({ type: String })
  error = '';

  async applyServerError(message: string) {
    // Three property changes — one render
    this.value = '';
    this.invalid = true;
    this.error = message;

    await this.updateComplete;
    // One render has occurred, all three changes reflected
    this.shadowRoot!.querySelector('input')!.focus();
  }
}
```

This is more efficient than frameworks that trigger a render per state change and is why Lit components can handle rapid data updates without performance problems.

## `requestUpdate()`

Call `requestUpdate()` to manually schedule a re-render without changing a reactive property. This is needed when you mutate an object or array in place (which bypasses Lit's change detection):

```typescript
@customElement('hx-mutable-list')
export class HelixMutableList extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Array })
  items: string[] = [];

  addItem(item: string) {
    // Mutating in place — Lit doesn't detect this automatically
    this.items.push(item);
    // Manually trigger a re-render
    this.requestUpdate();
  }

  override render() {
    return html`
      <ul>
        ${this.items.map((item) => html`<li>${item}</li>`)}
      </ul>
    `;
  }
}
```

The recommended pattern is to avoid mutation and instead create new references:

```typescript
addItem(item: string) {
  this.items = [...this.items, item]; // Triggers re-render automatically
}
```

`requestUpdate()` also accepts a property name and old value to hint at what changed:

```typescript
this.requestUpdate('items', previousItems);
```

## `isUpdatePending`

A boolean property that is `true` if an update has been scheduled but not yet completed. Useful for conditional logic:

```typescript
if (!this.isUpdatePending) {
  // DOM is up to date — safe to read
}
```

## Complete Example: Async Data Loading

```typescript
import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-async-card')
export class HelixAsyncCard extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: block; }
      .skeleton { background: var(--hx-color-neutral-100); }
    `,
  ];

  @property({ type: String })
  endpoint = '';

  @state()
  private _data: unknown = null;

  @state()
  private _loading = false;

  @state()
  private _error = '';

  override async updated(changed: PropertyValues<this>) {
    if (changed.has('endpoint') && this.endpoint) {
      this._loading = true;
      this._error = '';
      this._data = null;

      try {
        const res = await fetch(this.endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this._data = await res.json();
      } catch (err) {
        this._error = err instanceof Error ? err.message : 'Unknown error';
      } finally {
        this._loading = false;
      }
    }
  }

  override render() {
    if (this._loading) {
      return html`<div class="skeleton">Loading...</div>`;
    }
    if (this._error) {
      return html`<hx-alert variant="error">${this._error}</hx-alert>`;
    }
    if (!this._data) {
      return nothing;
    }
    return html`<div class="content"><slot></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-async-card': HelixAsyncCard;
  }
}
```

## Next Steps

- [Component Lifecycle](/components-guide/fundamentals/lifecycle/) — `willUpdate`, `firstUpdated`, `updated`
- [Reactive Properties](/components-guide/fundamentals/reactive-properties/) — how property changes are detected
- [Template Syntax](/components-guide/fundamentals/template-syntax/) — what `render()` can return
