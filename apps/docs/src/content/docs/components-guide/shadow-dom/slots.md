---
title: Slots and Content Projection
description: Deep dive into shadow DOM slots — named slots, fallback content, slotchange events, flattened element trees, and @queryAssignedElements.
---

Slots are the bridge between a component's shadow DOM and the consumer's light DOM content. This page covers slots in depth, including advanced patterns used in HELiX components.

## How Slot Projection Works

When a browser renders a component with slots, it builds a **flattened tree** — a composite view that places the light DOM children of the host element into the positions defined by `<slot>` elements in the shadow tree.

```
Light DOM:
  hx-card
  ├── h2[slot="header"] "Title"
  ├── p "Body text"
  └── button[slot="footer"] "Save"

Shadow tree:
  div.card
  ├── div.card__header → slot[name="header"]
  ├── div.card__body   → slot (default)
  └── div.card__footer → slot[name="footer"]

Flattened tree (what the browser renders):
  div.card
  ├── div.card__header
  │   └── h2 "Title"        (from light DOM)
  ├── div.card__body
  │   └── p "Body text"     (from light DOM)
  └── div.card__footer
      └── button "Save"     (from light DOM)
```

The light DOM nodes are not moved — they remain children of `hx-card` in the DOM. The shadow tree's `<slot>` elements act as rendering viewports into those children.

## Default Slot

A `<slot>` element without a `name` attribute accepts all unassigned light DOM children:

```typescript
@customElement('hx-callout')
export class HelixCallout extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: block; }
      .callout {
        border-left: 4px solid var(--hx-color-primary-500);
        padding: var(--hx-spacing-md);
        background: var(--hx-color-primary-50);
      }
    `,
  ];

  override render() {
    return html`
      <div class="callout" role="note">
        <slot></slot>
      </div>
    `;
  }
}
```

## Named Slots

Named slots accept only children that specify `slot="name"` on a direct child of the host:

```typescript
@customElement('hx-media-card')
export class HelixMediaCard extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: block; }
      .card { display: grid; grid-template-rows: auto 1fr auto; }
      .card__media { aspect-ratio: 16/9; overflow: hidden; }
      .card__body { padding: var(--hx-spacing-md); }
      .card__actions {
        padding: var(--hx-spacing-sm) var(--hx-spacing-md);
        display: flex;
        gap: var(--hx-spacing-xs);
        justify-content: flex-end;
      }
    `,
  ];

  override render() {
    return html`
      <article class="card">
        <div class="card__media">
          <slot name="media"></slot>
        </div>
        <div class="card__body">
          <slot></slot>
        </div>
        <div class="card__actions">
          <slot name="actions"></slot>
        </div>
      </article>
    `;
  }
}
```

Consumer:

```html
<hx-media-card>
  <img slot="media" src="/patient-photo.jpg" alt="Patient photo" />

  <!-- No slot attr — default slot -->
  <h3>John Doe</h3>
  <p>Room 214 · Admitted Jan 15</p>

  <hx-button slot="actions" variant="secondary">View Records</hx-button>
  <hx-button slot="actions" variant="primary">Update</hx-button>
</hx-media-card>
```

## Fallback Content

Content placed between `<slot>` tags renders when the consumer provides no matching content:

```typescript
override render() {
  return html`
    <header class="card__header">
      <slot name="header">
        <span class="placeholder-title">Untitled</span>
      </slot>
    </header>
    <div class="card__body">
      <slot>
        <p class="empty-message">No content provided.</p>
      </slot>
    </div>
    <footer class="card__footer">
      <slot name="actions">
        <!-- No fallback — footer is hidden when empty via CSS -->
      </slot>
    </footer>
  `;
}
```

Hide empty fallback containers using `::slotted()` and `:has()`:

```typescript
css`
  /* Hide footer when no actions slot content */
  .card__footer:not(:has(slot[name="actions"] ~ *)) {
    display: none;
  }
`
```

Or use the `slotchange` event to track slot occupancy (see below).

## The `slotchange` Event

`slotchange` fires on a `<slot>` element when its assigned nodes change. Use it to react when consumers add, remove, or replace slotted content:

```typescript
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-accordion')
export class HelixAccordion extends LitElement {
  static override styles = [tokenStyles];

  @state()
  private _itemCount = 0;

  @query('slot')
  private _slot!: HTMLSlotElement;

  private _handleSlotChange() {
    const items = this._slot.assignedElements({
      flatten: true,
    });
    this._itemCount = items.length;
    // Assign indices to items for accessibility
    items.forEach((item, index) => {
      item.setAttribute('data-index', String(index));
      item.setAttribute('data-total', String(items.length));
    });
  }

  override render() {
    return html`
      <div class="accordion" role="list" aria-label="${this._itemCount} items">
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}
```

## `@queryAssignedElements` Decorator

The `@queryAssignedElements` decorator queries assigned slot elements declaratively:

```typescript
import { queryAssignedElements } from 'lit/decorators.js';

@customElement('hx-toolbar')
export class HelixToolbar extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: flex; align-items: center; gap: var(--hx-spacing-xs); }
    `,
  ];

  // All elements in the default slot
  @queryAssignedElements()
  private _items!: Array<HTMLElement>;

  // Only hx-button elements in the "overflow" named slot
  @queryAssignedElements({ slot: 'overflow', selector: 'hx-button' })
  private _overflowButtons!: Array<HTMLElement>;

  // Elements in default slot including from nested slots (flatten: true)
  @queryAssignedElements({ flatten: true })
  private _allItems!: Array<HTMLElement>;

  override render() {
    return html`
      <div class="toolbar" role="toolbar" @slotchange=${() => this.requestUpdate()}>
        <slot></slot>
        <div class="overflow-menu">
          <slot name="overflow"></slot>
        </div>
      </div>
    `;
  }
}
```

`@queryAssignedElements` options:

| Option | Type | Description |
|---|---|---|
| `slot` | `string` | Named slot to query (omit for default slot) |
| `selector` | `string` | Filter by CSS selector |
| `flatten` | `boolean` | Include elements distributed from nested slots |

## The `flatten` Option

`flatten: true` resolves nested slot assignments. When a slot in a parent component is filled by content from a grandparent that goes through a child component's slot, `flatten` ensures you see all the actual elements:

```html
<!-- hx-list contains an hx-list-item that has its own slot -->
<hx-list>
  <hx-list-item>Item A</hx-list-item>
  <hx-list-item>Item B</hx-list-item>
</hx-list>
```

Without `flatten`, the assigned elements are the `hx-list-item` elements. With `flatten: true`, the result would include all text nodes and elements assigned through nested slots.

Use `flatten: true` cautiously — it traverses the full slot chain and may include unexpected elements.

## Checking Slot Occupancy

To show or hide layout sections based on whether a slot has content:

```typescript
@customElement('hx-split-layout')
export class HelixSplitLayout extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: grid; grid-template-columns: 1fr; }
      :host([has-aside]) { grid-template-columns: 1fr 280px; }
    `,
  ];

  @queryAssignedElements({ slot: 'aside' })
  private _asideItems!: Array<HTMLElement>;

  private _handleAsideSlotChange() {
    const hasAside = this._asideItems.length > 0;
    this.toggleAttribute('has-aside', hasAside);
  }

  override render() {
    return html`
      <main class="main"><slot></slot></main>
      <aside class="aside">
        <slot name="aside" @slotchange=${this._handleAsideSlotChange}></slot>
      </aside>
    `;
  }
}
```

Because `has-aside` is reflected as an attribute, the `:host([has-aside])` CSS rule activates to switch to a two-column grid.

## Slots and Accessibility

Slots preserve semantics. When a consumer slots in a `<h2>`, it remains an `<h2>` in the accessibility tree — the shadow DOM wrapper does not change its role or heading level.

Best practices for slot accessibility:

- Use `aria-labelledby` pointing to a slotted heading's ID to associate labels.
- Use `role="group"` or `role="region"` on wrapper elements with appropriate labels.
- Avoid nesting interactive elements inside `<button>` or `<a>` in the shadow tree when consumers might slot interactive content.

```typescript
override render() {
  return html`
    <section
      class="card"
      aria-labelledby="card-header"
    >
      <div class="card__header" id="card-header">
        <slot name="header"></slot>
      </div>
      <div class="card__body">
        <slot></slot>
      </div>
    </section>
  `;
}
```

## Next Steps

- [CSS Parts](/components-guide/shadow-dom/parts/) — `::part()` for styling internal shadow elements
- [Shadow DOM Styling](/components-guide/shadow-dom/styling/) — `::slotted()` for styling slotted content
- [Shadow DOM Events](/components-guide/shadow-dom/events/) — how events cross slot projections
- [Introduction to Slots](/components-guide/fundamentals/slots-intro/) — beginner-level slot reference
