---
title: Introduction to Slots
description: Learn how slots enable content projection in web components — default slots, named slots, fallback content, and slotchange events.
---

Slots are the mechanism by which a web component accepts and renders external content. Instead of requiring consumers to pass all data as properties, slots let consumers write natural HTML markup that the component projects into its shadow tree.

## What Are Slots?

A `<slot>` element inside a shadow DOM template acts as a placeholder. Content that consumers place inside the custom element tag is "projected" into the matching slot — it appears in the rendered output without being copied into the shadow DOM.

```html
<!-- Consumer markup -->
<hx-card>
  <h2>Patient Overview</h2>
  <p>Last updated January 15, 2026.</p>
</hx-card>
```

```typescript
// Component template
override render() {
  return html`
    <div class="card">
      <slot></slot>  <!-- h2 and p appear here -->
    </div>
  `;
}
```

The projected content stays in the **light DOM** — it is part of the `hx-card` element's children, not the shadow tree. The slot is a rendering viewport, not a move operation.

## Default (Unnamed) Slots

A `<slot>` without a `name` attribute is the default slot. All slotted content that does not specify a `slot` attribute goes into the default slot.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-section')
export class HelixSection extends LitElement {
  static override styles = [
    css`
      :host { display: block; }
      .section {
        padding: var(--hx-spacing-lg);
        border: 1px solid var(--hx-color-neutral-200);
        border-radius: var(--hx-radius-md);
      }
    `,
  ];

  override render() {
    return html`
      <section class="section">
        <slot></slot>
      </section>
    `;
  }
}
```

Usage:

```html
<hx-section>
  <p>Any content here flows into the default slot.</p>
  <hx-button>Action</hx-button>
</hx-section>
```

## Named Slots

Named slots let a component define multiple content regions. Consumers assign content to a slot by adding the `slot` attribute to a direct child of the component:

```typescript
@customElement('hx-panel')
export class HelixPanel extends LitElement {
  static override styles = [
    css`
      :host { display: flex; flex-direction: column; }
      .header {
        padding: var(--hx-spacing-md);
        border-bottom: 1px solid var(--hx-color-neutral-200);
        font-weight: var(--hx-font-weight-semibold);
      }
      .body {
        padding: var(--hx-spacing-md);
        flex: 1;
      }
      .footer {
        padding: var(--hx-spacing-sm) var(--hx-spacing-md);
        border-top: 1px solid var(--hx-color-neutral-200);
        display: flex;
        gap: var(--hx-spacing-sm);
        justify-content: flex-end;
      }
    `,
  ];

  override render() {
    return html`
      <div class="header">
        <slot name="header"></slot>
      </div>
      <div class="body">
        <slot></slot>
      </div>
      <div class="footer">
        <slot name="footer"></slot>
      </div>
    `;
  }
}
```

Consumer usage:

```html
<hx-panel>
  <h2 slot="header">Edit Patient Record</h2>

  <!-- No slot attribute — goes to default slot -->
  <hx-text-input label="First name" name="firstName"></hx-text-input>
  <hx-text-input label="Last name" name="lastName"></hx-text-input>

  <hx-button slot="footer" variant="secondary">Cancel</hx-button>
  <hx-button slot="footer" variant="primary" type="submit">Save</hx-button>
</hx-panel>
```

Only **direct children** of the component with a matching `slot` attribute are projected. Deeper descendants must use the `slot` attribute on an intermediate element.

## Fallback Content

Provide fallback content between the slot tags. It renders when no slotted content is provided:

```typescript
override render() {
  return html`
    <div class="card">
      <div class="header">
        <slot name="header">
          <!-- Fallback: shown when no "header" slot content provided -->
          <span class="default-header">Untitled</span>
        </slot>
      </div>
      <div class="body">
        <slot>
          <!-- Fallback: shown when no default slot content provided -->
          <p class="empty-state">No content provided.</p>
        </slot>
      </div>
    </div>
  `;
}
```

## The `slotchange` Event

The `slotchange` event fires on a `<slot>` element when its assigned nodes change — when slotted content is added, removed, or replaced. Use this to react to content changes:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';

@customElement('hx-nav')
export class HelixNav extends LitElement {

  @query('slot')
  private _slot!: HTMLSlotElement;

  private _handleSlotChange(_event: Event) {
    const items = this._slot.assignedElements();
    // Update aria roles or count based on slotted items
    this.setAttribute('aria-label', `Navigation with ${items.length} items`);
  }

  override render() {
    return html`
      <nav>
        <slot @slotchange=${this._handleSlotChange}></slot>
      </nav>
    `;
  }
}
```

`slotchange` fires asynchronously after the DOM settles — it does not fire during the initial render.

## `@queryAssignedElements` Decorator

The `@queryAssignedElements` decorator is a convenient way to access slotted elements without manually querying the slot:

```typescript
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, queryAssignedElements } from 'lit/decorators.js';

@customElement('hx-button-group')
export class HelixButtonGroup extends LitElement {
  static override styles = [
    css`
      :host { display: inline-flex; gap: var(--hx-spacing-xs); }
    `,
  ];

  @queryAssignedElements({ selector: 'hx-button, button' })
  private _buttons!: Array<HTMLElement>;

  override updated(_changed: PropertyValues<this>) {
    // Apply group context to each button
    this._buttons.forEach((btn, index) => {
      btn.setAttribute('data-group-index', String(index));
      btn.setAttribute('data-group-size', String(this._buttons.length));
    });
  }

  override render() {
    return html`
      <div class="group" role="group">
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </div>
    `;
  }
}
```

Usage:

```html
<hx-button-group aria-label="Text formatting">
  <hx-button variant="ghost">Bold</hx-button>
  <hx-button variant="ghost">Italic</hx-button>
  <hx-button variant="ghost">Underline</hx-button>
</hx-button-group>
```

See the [Decorators](/components-guide/fundamentals/decorators/) page for full `@queryAssignedElements` options.

## Checking for Slotted Content

To conditionally render layout based on whether a slot has content:

```typescript
@customElement('hx-card')
export class HelixCard extends LitElement {

  @queryAssignedElements({ slot: 'footer' })
  private _footerItems!: Array<HTMLElement>;

  @state()
  private _hasFooter = false;

  private _handleSlotChange() {
    this._hasFooter = this._footerItems.length > 0;
  }

  override render() {
    return html`
      <div class="card__body">
        <slot></slot>
      </div>
      <div class="card__footer" ?hidden=${!this._hasFooter}>
        <slot name="footer" @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}
```

## Next Steps

- [Shadow DOM Slots](/components-guide/shadow-dom/slots/) — deeper dive with `flatten`, `exportparts`, and advanced patterns
- [Decorators](/components-guide/fundamentals/decorators/) — `@queryAssignedElements` options
- [Template Syntax](/components-guide/fundamentals/template-syntax/) — `nothing` and conditional rendering
