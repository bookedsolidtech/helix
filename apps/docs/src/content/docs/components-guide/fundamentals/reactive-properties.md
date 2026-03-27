---
title: Reactive Properties
description: Understand @property and @state decorators, property options, and how Lit schedules re-renders.
---

Reactive properties are the foundation of Lit's rendering model. When a reactive property changes, Lit schedules an asynchronous re-render of the component. This page covers both public properties (`@property`) and private state (`@state`), along with the full set of configuration options.

## `@property` vs `@state`

### `@property` — Public API

`@property()` declares a reactive property that is part of the component's public API. It can be set from outside via JavaScript or HTML attributes.

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-badge')
export class HelixBadge extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  variant: 'default' | 'success' | 'warning' | 'error' = 'default';

  @property({ type: Boolean, reflect: true })
  pill = false;

  @property({ type: Number })
  count = 0;

  override render() {
    return html`
      <span class="badge badge--${this.variant}">
        ${this.count > 0 ? this.count : nothing}
      </span>
    `;
  }
}
```

Usage:

```html
<!-- Via attributes -->
<hx-badge variant="success" count="5" pill></hx-badge>

<!-- Via JavaScript properties -->
<script>
  const badge = document.querySelector('hx-badge');
  badge.count = 12;
  badge.variant = 'warning';
</script>
```

### `@state` — Private Internal State

`@state()` declares reactive state that is internal to the component. It triggers re-renders on change but is not exposed as an attribute and is not part of the public API.

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-disclosure')
export class HelixDisclosure extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: String })
  label = '';

  // Private — not accessible from outside
  @state()
  private _expanded = false;

  private _toggle() {
    this._expanded = !this._expanded;
  }

  override render() {
    return html`
      <button @click=${this._toggle} aria-expanded=${this._expanded}>
        ${this.label}
      </button>
      ${this._expanded
        ? html`<div class="content"><slot></slot></div>`
        : nothing}
    `;
  }
}
```

Convention: prefix private `@state` fields with `_` to signal they are internal.

## Property Options

The `@property()` decorator accepts an options object with the following keys.

### `type`

Controls how Lit converts between the HTML attribute (always a string) and the JavaScript property value.

```typescript
@property({ type: String })  // default — no conversion
label = '';

@property({ type: Number })
count = 0;

@property({ type: Boolean })
disabled = false;

@property({ type: Array })
items: string[] = [];

@property({ type: Object })
config: Record<string, unknown> = {};
```

For `Boolean`, Lit follows the HTML boolean attribute convention: the attribute's presence means `true`, its absence means `false`. Any string value (including `"false"`) is truthy.

### `reflect`

When `reflect: true`, writing to the JavaScript property also updates the HTML attribute. This is important for CSS attribute selectors like `:host([disabled])`.

```typescript
@property({ type: Boolean, reflect: true })
disabled = false;

@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' = 'primary';
```

With `reflect: true`:

```javascript
const button = document.querySelector('hx-button');
button.disabled = true;
// The DOM now shows: <hx-button disabled></hx-button>
// :host([disabled]) CSS rules activate
```

Only reflect properties that are useful to CSS selectors or external attribute observers. Reflecting complex objects (Array, Object) is expensive and usually unnecessary.

### `attribute`

By default, the attribute name is the lowercase version of the property name. Use `attribute` to specify a different name, or `false` to opt out of attribute observation entirely.

```typescript
// Property: `labelText`, attribute: `label-text`
@property({ type: String, attribute: 'label-text' })
labelText = '';

// Property: `ariaLabel`, attribute: `aria-label`
@property({ type: String, attribute: 'aria-label' })
ariaLabel = '';

// No attribute observation — JS property only
@property({ attribute: false })
data: Record<string, unknown> = {};
```

### `converter`

For custom attribute-to-property conversions, provide a `converter` object with `fromAttribute` and optionally `toAttribute` methods.

```typescript
import { complexAttributeConverter } from 'lit';

// Built-in converter for comma-separated string → string array
@property({
  converter: {
    fromAttribute(value: string | null): string[] {
      if (!value) return [];
      return value.split(',').map((s) => s.trim());
    },
    toAttribute(value: string[]): string {
      return value.join(',');
    },
  },
  reflect: true,
})
tags: string[] = [];
```

Usage: `<hx-tag-list tags="react, typescript, web-components"></hx-tag-list>`

### `hasChanged`

By default, Lit uses strict equality (`!==`) to detect changes. For objects and arrays that are mutated in place, provide a custom `hasChanged` function:

```typescript
@property({
  hasChanged(newVal: string[], oldVal: string[]) {
    return JSON.stringify(newVal) !== JSON.stringify(oldVal);
  },
})
items: string[] = [];
```

Note: Mutating arrays or objects in place without reassignment will not trigger re-renders even with `hasChanged`, because the reference stays the same. The safest pattern is always to create new values:

```typescript
// Does NOT trigger re-render — same reference
this.items.push('new item');

// Triggers re-render — new array reference
this.items = [...this.items, 'new item'];
```

## Primitive vs Object Properties

Primitive values (string, number, boolean) are compared by value. Two renders with `count = 5` will not re-render between them.

Object and array properties are compared by reference. Lit has no way to deep-compare them, so two renders with the same data object will not re-render if it is the same reference:

```typescript
@customElement('hx-list')
export class HelixList extends LitElement {
  static override styles = [tokenStyles];

  @property({ type: Array })
  items: string[] = [];

  override render() {
    return html`
      <ul>
        ${this.items.map((item) => html`<li>${item}</li>`)}
      </ul>
    `;
  }
}
```

```javascript
const list = document.querySelector('hx-list');

// No re-render — same array reference after mutation
list.items.push('new item');

// Re-render — new array reference
list.items = [...list.items, 'new item'];
```

## When Properties Trigger Re-Renders

Lit's update cycle is asynchronous and batched:

1. A property changes (either `@property` or `@state`).
2. Lit schedules a microtask update (if not already scheduled).
3. Any further property changes during the same synchronous block are batched into the same update.
4. The microtask fires: `willUpdate()` → `update()` → `render()` → `updated()`.

```typescript
// Only ONE render, not three
this.variant = 'primary';
this.disabled = false;
this.label = 'Save';
// ^ all three changes batched into a single render cycle
```

To wait for the DOM to reflect a property change:

```typescript
this.variant = 'primary';
await this.updateComplete; // DOM is now updated
const button = this.shadowRoot!.querySelector('button');
```

See [Rendering and Updates](/components-guide/fundamentals/rendering/) for the full update lifecycle.
