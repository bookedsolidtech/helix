---
title: Advanced Slot Patterns
description: Master imperative slot assignment, dynamic slot patterns, portal implementations, and slot forwarding techniques for building sophisticated web component compositions in HELiX.
sidebar:
  order: 3
---

# Advanced Slot Patterns

Building on foundational slot knowledge, this guide explores advanced techniques for dynamic slot management, imperative slot assignment, portal-style patterns, and complex slot forwarding scenarios. These patterns are essential for building data-driven components, compound component systems, and sophisticated composition architectures in enterprise healthcare applications.

**Prerequisites:** This guide assumes you understand basic slot usage, named slots, and slotchange events. Review [Slots and Composition](/components/shadow-dom/slots) first if needed.

## Understanding Manual Slot Assignment

The platform provides two slot assignment modes: **named (automatic)** and **manual (imperative)**. The default named assignment is declarative—elements with `slot="name"` attributes automatically assign to matching slots. Manual assignment gives components programmatic control over which elements go into which slots.

### The slotAssignment Property

When creating a shadow root, you specify the assignment mode:

```typescript
// Declarative (default): automatic assignment based on slot attributes
class AutomaticComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // slotAssignment: 'named' (default)
  }
}

// Imperative: manual assignment via JavaScript
class ManualComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open',
      slotAssignment: 'manual', // Enable manual slot assignment
    });
  }
}
```

**Critical constraint:** You **cannot mix** manual and named assignment in the same shadow root. Once you set `slotAssignment: 'manual'`, the `slot` attribute on light DOM elements is ignored. All assignment must happen via the `assign()` method.

### The assign() Method

The `HTMLSlotElement.assign()` method sets a slot's assigned nodes imperatively:

```typescript
import { LitElement, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

@customElement('manual-tabs')
export class ManualTabs extends LitElement {
  @query('slot[name="active-panel"]')
  private _activeSlot!: HTMLSlotElement;

  @query('slot[name="inactive-panels"]')
  private _inactiveSlot!: HTMLSlotElement;

  private _activeIndex = 0;

  constructor() {
    super();
    this.attachShadow({
      mode: 'open',
      slotAssignment: 'manual', // Required for assign()
    });
  }

  createRenderRoot() {
    // Override Lit's default (Lit uses named assignment by default)
    // For manual assignment, create shadow root ourselves
    return this.attachShadow({
      mode: 'open',
      slotAssignment: 'manual',
    });
  }

  override firstUpdated() {
    this._assignPanels();
  }

  private _assignPanels() {
    const panels = Array.from(this.querySelectorAll('[role="tabpanel"]'));

    // Assign active panel to active slot
    const activePanel = panels[this._activeIndex];
    if (activePanel) {
      this._activeSlot.assign([activePanel]);
    }

    // Assign all other panels to inactive slot (hidden)
    const inactivePanels = panels.filter((_, i) => i !== this._activeIndex);
    this._inactiveSlot.assign(inactivePanels);
  }

  selectTab(index: number) {
    this._activeIndex = index;
    this._assignPanels(); // Re-assign on state change
  }

  override render() {
    return html`
      <div class="tabs">
        <div class="tabs__active">
          <slot name="active-panel"></slot>
        </div>
        <div class="tabs__inactive" hidden>
          <slot name="inactive-panels"></slot>
        </div>
      </div>
    `;
  }
}
```

**Key behaviors:**

- `assign([el1, el2, el3])` — assigns exactly these elements in this order
- `assign([])` — clears all assignments (slot shows fallback)
- `assign()` without arguments — same as `assign([])`
- Only accepts **direct children** of the host element (not grandchildren)

### When to Use Manual Assignment

Manual slot assignment is powerful but complex. Use it when:

1. **Slot assignment depends on component state** (e.g., tab panels, carousels)
2. **Dynamic content ordering** without changing light DOM order
3. **Filtering** which light DOM elements are visible
4. **Virtual scrolling** or other performance optimizations
5. **Conditional rendering** based on runtime logic

**Avoid manual assignment when:**

- Simple named slots suffice
- Light DOM can use `slot` attributes (easier for consumers)
- You need to support SSR (manual assignment requires JavaScript)

## Dynamic Slot Patterns

Dynamic slots are slots created at runtime based on component state or data. This pattern is common in data grids, tree views, and other data-driven components.

### Pattern: Positional Slots

Generate slots for array-based data:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

interface DataItem {
  id: string;
  label: string;
}

/**
 * Data grid with column slots.
 * Consumers can provide custom renderers for specific columns.
 */
@customElement('data-grid')
export class DataGrid extends LitElement {
  @property({ type: Array })
  items: DataItem[] = [];

  @property({ type: Array })
  columns: string[] = ['id', 'label'];

  private _renderCell(item: DataItem, column: string, index: number) {
    // Slot name uses colon delimiter: column:rowIndex
    const slotName = `${column}:${index}`;

    return html`
      <td class="grid__cell">
        <slot name=${slotName}> ${item[column as keyof DataItem] ?? '—'} </slot>
      </td>
    `;
  }

  override render() {
    return html`
      <table class="grid">
        <thead>
          <tr>
            ${this.columns.map((col) => html`<th>${col}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${repeat(
            this.items,
            (item) => item.id,
            (item, index) => html`
              <tr>
                ${this.columns.map((col) => this._renderCell(item, col, index))}
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }
}
```

**Usage:**

```html
<data-grid .items=${myData} .columns=${['id', 'name', 'status']}>
  <!-- Custom renderer for specific cells -->
  <strong slot="name:0">First Row Custom Name</strong>
  <hx-badge slot="status:2" variant="success">Active</hx-badge>
</data-grid>
```

**Naming convention:** Use colon (`:`) to delimit primary name from positional index. This creates a clear hierarchy and makes slot names parseable.

**Performance consideration:** Dynamic slots increase DOM footprint. A 100-row × 5-column grid generates 500 slots. For large datasets:

- Provide fallback rendering (don't require slots for every cell)
- Use virtual scrolling to limit rendered rows
- Consider render props or event-based customization as alternatives

### Pattern: Conditional Slot Creation

Generate slots only when needed:

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

type NotificationVariant = 'info' | 'warning' | 'error' | 'success';

@customElement('notification-stack')
export class NotificationStack extends LitElement {
  @property({ type: String })
  variant: NotificationVariant = 'info';

  @state()
  private _hasActions = false;

  private _handleActionsSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasActions = slot.assignedNodes({ flatten: true }).length > 0;
  }

  override render() {
    const showActionsSlot = this.variant === 'error' || this._hasActions;

    return html`
      <div class="notification notification--${this.variant}">
        <slot name="icon"></slot>
        <div class="notification__content">
          <slot></slot>
        </div>

        ${showActionsSlot
          ? html`
              <div class="notification__actions">
                <slot name="actions" @slotchange=${this._handleActionsSlotChange}></slot>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
```

**Why this works:**

- Slot created conditionally based on state
- `slotchange` listener attached when slot exists
- Re-renders update slot presence without breaking assignments

**Caveat:** Conditional slot creation can cause slotted content to disappear if the condition toggles. Use `?hidden` instead when you want to preserve slot assignments:

```typescript
// Better: slot always exists, visibility controlled by CSS
override render() {
  return html`
    <div class="notification__actions" ?hidden=${!this._hasActions}>
      <slot name="actions" @slotchange=${this._handleActionsSlotChange}></slot>
    </div>
  `;
}
```

## Slot API Deep Dive

Understanding the full `HTMLSlotElement` API unlocks advanced patterns.

### Reading Slot Assignments

```typescript
const slot = this.shadowRoot.querySelector('slot[name="header"]') as HTMLSlotElement;

// Get assigned elements (excludes text nodes, comments)
const elements = slot.assignedElements();
console.log(elements); // [<h2>, <button>]

// Get assigned nodes (includes text nodes, comments)
const nodes = slot.assignedNodes();
console.log(nodes); // [<h2>, '\n  ', <button>, '\n']

// Get with fallback content
const withFallback = slot.assignedElements({ flatten: true });
// If no assignment: returns slot's children (fallback)
// If assigned: same as assignedElements()

// Check if slot has any assignment
const hasContent = slot.assignedNodes().length > 0;
```

**flatten option:**

- `{ flatten: false }` (default) — returns empty array if no assignment
- `{ flatten: true }` — returns fallback content if no assignment

### Pattern: Slot Content Analysis

```typescript
import { LitElement, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

@customElement('smart-list')
export class SmartList extends LitElement {
  @query('slot')
  private _defaultSlot!: HTMLSlotElement;

  @state()
  private _itemCount = 0;

  @state()
  private _hasInvalidItems = false;

  private _handleSlotChange() {
    const items = this._defaultSlot.assignedElements();

    this._itemCount = items.length;

    // Validate: all items must be <li> elements
    this._hasInvalidItems = items.some((el) => el.tagName.toLowerCase() !== 'li');

    if (this._hasInvalidItems) {
      console.warn(
        'smart-list expects <li> children, found:',
        items.filter((el) => el.tagName.toLowerCase() !== 'li'),
      );
    }

    // Add ARIA attributes to valid items
    items.forEach((item, index) => {
      if (item.tagName.toLowerCase() === 'li') {
        item.setAttribute('role', 'listitem');
        item.setAttribute('aria-posinset', String(index + 1));
        item.setAttribute('aria-setsize', String(this._itemCount));
      }
    });
  }

  override render() {
    return html`
      <div class="list" role="list">
        ${this._itemCount === 0 ? html` <div class="list__empty">No items</div> ` : nothing}
        ${this._hasInvalidItems
          ? html`
              <div class="list__warning" role="alert">
                Warning: This list contains non-li elements
              </div>
            `
          : nothing}

        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}
```

**Pattern benefits:**

- Dynamic empty state
- Runtime validation with helpful warnings
- Automatic ARIA management
- Reactive UI based on slotted content

### Slot Event Properties

The `slotchange` event provides access to the slot:

```typescript
private _handleSlotChange(e: Event) {
  const slot = e.target as HTMLSlotElement;

  // Get slot name (empty string for default slot)
  console.log('Slot name:', slot.name || '(default)');

  // Get slot's parent node (shadow root element)
  console.log('Parent:', slot.parentElement);

  // Get assigned elements
  const elements = slot.assignedElements();
  console.log('Assigned:', elements);

  // Event properties
  console.log('Bubbles:', e.bubbles);        // true
  console.log('Composed:', e.composed);      // false (doesn't cross shadow boundary)
  console.log('Cancelable:', e.cancelable);  // false
}
```

**Key insight:** `slotchange` does **not** compose. It fires only within the shadow root where the slot lives. If you need parent components to know about slot changes, dispatch a custom composed event:

```typescript
private _handleSlotChange(e: Event) {
  const slot = e.target as HTMLSlotElement;

  // Emit composed event for parent components
  this.dispatchEvent(new CustomEvent('content-changed', {
    bubbles: true,
    composed: true,  // Crosses shadow boundaries
    detail: {
      slotName: slot.name,
      itemCount: slot.assignedElements().length
    }
  }));
}
```

## Portal Patterns

Portals allow content to render in a different location in the DOM tree from where it's logically defined. While React Portals use a dedicated API, web components achieve similar patterns with slots and manual assignment.

### Pattern: Modal Portal

Render modal content in a top-level container while keeping it logically nested in the component tree:

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

/**
 * Modal component that portals content to document.body.
 * Uses manual slot assignment to control rendering location.
 */
@customElement('portal-modal')
export class PortalModal extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @query('slot')
  private _slot!: HTMLSlotElement;

  @state()
  private _portalRoot: HTMLElement | null = null;

  // Don't use shadow DOM for portal
  createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._createPortalRoot();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._destroyPortalRoot();
  }

  private _createPortalRoot() {
    // Create portal container at document.body
    this._portalRoot = document.createElement('div');
    this._portalRoot.className = 'portal-modal__backdrop';
    this._portalRoot.setAttribute('role', 'dialog');
    this._portalRoot.setAttribute('aria-modal', 'true');
    this._portalRoot.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: var(--hx-z-index-modal, 1000);
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
    `;

    document.body.appendChild(this._portalRoot);
  }

  private _destroyPortalRoot() {
    if (this._portalRoot) {
      this._portalRoot.remove();
      this._portalRoot = null;
    }
  }

  override updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('open')) {
      this._updatePortalVisibility();
      this._updatePortalContent();
    }
  }

  private _updatePortalVisibility() {
    if (this._portalRoot) {
      this._portalRoot.style.display = this.open ? 'flex' : 'none';
    }

    // Manage body scroll lock
    if (this.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  private _updatePortalContent() {
    if (!this._portalRoot) return;

    if (this.open) {
      // Move slotted content to portal
      const content = this._slot?.assignedElements() ?? [];
      content.forEach((el) => {
        this._portalRoot!.appendChild(el);
      });
    } else {
      // Move content back to original location
      const content = Array.from(this._portalRoot.children);
      content.forEach((el) => {
        this.appendChild(el);
      });
    }
  }

  private _handleBackdropClick(e: MouseEvent) {
    if (e.target === this._portalRoot) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent('hx-close', {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  override render() {
    // Portal root handles rendering, this component just manages state
    if (this._portalRoot) {
      this._portalRoot.onclick = (e) => this._handleBackdropClick(e);
    }

    return html` <slot></slot> `;
  }
}
```

**Usage:**

```html
<portal-modal id="confirmModal">
  <div class="modal__content">
    <h2>Confirm Action</h2>
    <p>Are you sure you want to delete this patient record?</p>
    <hx-button @click="${()" =""> this._handleConfirm()}>Confirm</hx-button>
    <hx-button variant="secondary" @click="${()" =""> this._handleCancel()}> Cancel </hx-button>
  </div>
</portal-modal>

<script>
  const modal = document.getElementById('confirmModal');
  modal.open = true; // Content renders at document.body, not inline
</script>
```

**Pattern benefits:**

- Content renders at correct stacking context (avoids z-index issues)
- Logically nested in component tree (maintains event delegation)
- Accessible (manages focus trap, ARIA attributes)
- Clean API (just toggle `open` property)

### Pattern: Notification Toast Portal

Similar pattern for toast notifications:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('toast-container')
export class ToastContainer extends LitElement {
  @property({ type: String })
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';

  private _toastRoot: HTMLElement | null = null;

  createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._createToastRoot();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._destroyToastRoot();
  }

  private _createToastRoot() {
    this._toastRoot = document.createElement('div');
    this._toastRoot.className = `toast-container toast-container--${this.position}`;
    this._toastRoot.setAttribute('role', 'status');
    this._toastRoot.setAttribute('aria-live', 'polite');

    const positions = {
      'top-right': 'top: 1rem; right: 1rem;',
      'top-left': 'top: 1rem; left: 1rem;',
      'bottom-right': 'bottom: 1rem; right: 1rem;',
      'bottom-left': 'bottom: 1rem; left: 1rem;',
    };

    this._toastRoot.style.cssText = `
      position: fixed;
      ${positions[this.position]}
      z-index: var(--hx-z-index-toast, 9999);
      display: flex;
      flex-direction: column;
      gap: var(--hx-space-2, 0.5rem);
      pointer-events: none;
    `;

    document.body.appendChild(this._toastRoot);
  }

  private _destroyToastRoot() {
    if (this._toastRoot) {
      this._toastRoot.remove();
      this._toastRoot = null;
    }
  }

  addToast(content: HTMLElement, duration = 5000) {
    if (!this._toastRoot) return;

    content.style.pointerEvents = 'auto';
    this._toastRoot.appendChild(content);

    if (duration > 0) {
      setTimeout(() => {
        content.remove();
      }, duration);
    }

    return content;
  }

  override render() {
    return html`<slot></slot>`;
  }
}
```

**Usage:**

```typescript
// Add toast container to app root
const toaster = document.createElement('toast-container');
document.body.appendChild(toaster);

// Add notifications dynamically
function showToast(message: string, variant = 'info') {
  const toast = document.createElement('hx-alert');
  toast.variant = variant;
  toast.innerHTML = message;

  toaster.addToast(toast, 5000);
}

showToast('Patient record saved successfully', 'success');
```

## Slot Forwarding in Nested Components

Slot forwarding allows content to project through multiple shadow DOM boundaries. This is essential for compound component systems.

### Basic Forwarding Pattern

```typescript
// Inner component (leaf)
@customElement('inner-panel')
export class InnerPanel extends LitElement {
  override render() {
    return html`
      <div class="panel">
        <div class="panel__header">
          <slot name="title"></slot>
        </div>
        <div class="panel__body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// Outer component (wrapper)
@customElement('outer-card')
export class OuterCard extends LitElement {
  override render() {
    return html`
      <div class="card">
        <inner-panel>
          <!-- Forward "heading" slot to inner component's "title" slot -->
          <slot name="heading" slot="title"></slot>

          <!-- Forward default slot to inner component's default slot -->
          <slot></slot>
        </inner-panel>
      </div>
    `;
  }
}
```

**Usage:**

```html
<outer-card>
  <h2 slot="heading">Card Title</h2>
  <p>This content projects through two shadow boundaries!</p>
</outer-card>
```

**Flow:**

1. `<h2 slot="heading">` assigns to `outer-card`'s `<slot name="heading">`
2. That slot has `slot="title"`, making it light DOM for `<inner-panel>`
3. `<inner-panel>`'s `<slot name="title">` receives it

### Real-World Pattern: Form Field Composition

```typescript
// Base field wrapper
@customElement('field-wrapper')
export class FieldWrapper extends LitElement {
  @property({ type: String })
  label = '';

  @property({ type: String })
  error = '';

  override render() {
    return html`
      <div class="field">
        <label class="field__label">
          <slot name="label">${this.label}</slot>
        </label>
        <div class="field__control">
          <slot></slot>
        </div>
        ${this.error
          ? html`
              <div class="field__error" role="alert">
                <slot name="error">${this.error}</slot>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

// Composite select component
@customElement('enhanced-select')
export class EnhancedSelect extends LitElement {
  @property({ type: String })
  label = '';

  @property({ type: String })
  error = '';

  override render() {
    return html`
      <field-wrapper .label=${this.label} .error=${this.error}>
        <!-- Forward label slot -->
        <slot name="label" slot="label"></slot>

        <!-- Native select in default slot -->
        <select class="select">
          <slot></slot>
        </select>

        <!-- Forward error slot -->
        <slot name="error" slot="error"></slot>
      </field-wrapper>
    `;
  }
}
```

**Usage:**

```html
<enhanced-select label="Country" error="Required field">
  <!-- Custom label overrides property -->
  <strong slot="label">Country *</strong>

  <!-- Options go to select -->
  <option value="">Select...</option>
  <option value="us">United States</option>
  <option value="ca">Canada</option>

  <!-- Custom error overrides property -->
  <span slot="error">
    <hx-icon name="alert"></hx-icon>
    Please select your country
  </span>
</enhanced-select>
```

**Benefits:**

- Reusable field layout logic
- Flexible: properties for simple cases, slots for rich customization
- Consistent styling across form components
- Easy to extend with new field types

### Pattern: Multi-Level Slot Forwarding

```typescript
// Level 3: Base input
@customElement('base-input')
export class BaseInput extends LitElement {
  override render() {
    return html`
      <input class="input" part="input" />
      <slot name="suffix"></slot>
    `;
  }
}

// Level 2: Validated input
@customElement('validated-input')
export class ValidatedInput extends LitElement {
  @property({ type: String })
  error = '';

  override render() {
    return html`
      <div class="validated-input">
        <base-input>
          <!-- Forward suffix slot -->
          <slot name="suffix" slot="suffix"></slot>
        </base-input>

        ${this.error
          ? html` <div class="error"><slot name="error">${this.error}</slot></div> `
          : nothing}
      </div>
    `;
  }
}

// Level 1: Labeled field
@customElement('labeled-field')
export class LabeledField extends LitElement {
  @property({ type: String })
  label = '';

  override render() {
    return html`
      <label class="field">
        <span class="field__label"><slot name="label">${this.label}</slot></span>
        <validated-input>
          <!-- Forward suffix through two levels -->
          <slot name="suffix" slot="suffix"></slot>

          <!-- Forward error slot -->
          <slot name="error" slot="error"></slot>
        </validated-input>
      </label>
    `;
  }
}
```

**Usage:**

```html
<labeled-field label="Password">
  <span slot="label">Password <small>(min 8 chars)</small></span>
  <hx-icon slot="suffix" name="eye"></hx-icon>
  <span slot="error">Password too short</span>
</labeled-field>
```

Content flows through **three shadow boundaries**:

1. `labeled-field` shadow
2. `validated-input` shadow
3. `base-input` shadow

Each layer forwards relevant slots to the next level.

### Slot Forwarding Best Practices

**1. Document the forwarding chain:**

```typescript
/**
 * @slot suffix - Icon or button rendered after the input.
 *   Forwarded to: validated-input > base-input
 */
```

**2. Use consistent slot names across layers:**

```typescript
// ✅ GOOD: Same slot name throughout
<slot name="icon" slot="icon"></slot>

// ❌ BAD: Renaming creates confusion
<slot name="badge" slot="icon"></slot>
```

**3. Provide escape hatches:**

```typescript
// Allow consumers to bypass forwarding for custom layouts
override render() {
  return html`
    <div class="wrapper">
      ${this.customLayout ? html`
        <slot></slot>  <!-- Consumer controls entire layout -->
      ` : html`
        <inner-component>
          <slot name="title" slot="title"></slot>
          <slot></slot>
        </inner-component>
      `}
    </div>
  `;
}
```

**4. Limit forwarding depth:**

Three levels is usually the maximum before the mental model breaks. If you need deeper nesting, consider:

- Flattening the component hierarchy
- Using CSS parts instead of slots
- Providing render functions/callbacks

## Advanced Composition Patterns

### Pattern: Hybrid Slot + Render Prop

Combine slots (for static content) with render props (for dynamic content):

```typescript
import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface ListItem {
  id: string;
  data: unknown;
}

@customElement('virtual-list')
export class VirtualList extends LitElement {
  @property({ type: Array })
  items: ListItem[] = [];

  // Render prop for custom item rendering
  @property({ attribute: false })
  renderItem?: (item: ListItem, index: number) => TemplateResult;

  private _defaultRenderItem(item: ListItem, index: number) {
    // Check if consumer provided a slot for this item
    const slotName = `item:${index}`;
    const hasSlot = this.querySelector(`[slot="${slotName}"]`) !== null;

    if (hasSlot) {
      // Use slot if provided
      return html`<slot name=${slotName}></slot>`;
    } else if (this.renderItem) {
      // Use render prop if provided
      return this.renderItem(item, index);
    } else {
      // Fallback rendering
      return html`<div>${JSON.stringify(item.data)}</div>`;
    }
  }

  override render() {
    return html`
      <div class="list" role="list">
        ${this.items.map(
          (item, index) => html`
            <div class="list__item" role="listitem">${this._defaultRenderItem(item, index)}</div>
          `,
        )}
      </div>
    `;
  }
}
```

**Usage (slot-based):**

```html
<virtual-list .items="${data}">
  <strong slot="item:0">Custom rendering for first item</strong>
  <em slot="item:5">Custom rendering for 6th item</em>
</virtual-list>
```

**Usage (render prop):**

```typescript
const list = document.querySelector('virtual-list');
list.renderItem = (item, index) => html`
  <div class="custom-item">
    <span class="index">${index}</span>
    <span class="data">${item.data}</span>
  </div>
`;
```

**Benefits:**

- Slots for occasional customization (a few items)
- Render props for systematic customization (all items)
- Fallback rendering when neither is provided

### Pattern: Controlled vs. Uncontrolled Slots

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('controlled-tabs')
export class ControlledTabs extends LitElement {
  // External state control (controlled mode)
  @property({ type: Number, attribute: 'active-index' })
  activeIndex?: number;

  // Internal state (uncontrolled mode)
  @state()
  private _internalActiveIndex = 0;

  private get _effectiveActiveIndex() {
    return this.activeIndex ?? this._internalActiveIndex;
  }

  private _handleTabClick(index: number) {
    if (this.activeIndex === undefined) {
      // Uncontrolled: update internal state
      this._internalActiveIndex = index;
    }

    // Emit event for controlled mode
    this.dispatchEvent(
      new CustomEvent('tab-change', {
        bubbles: true,
        composed: true,
        detail: { index },
      }),
    );
  }

  override render() {
    const tabs = this.querySelectorAll('[slot^="tab-"]');

    return html`
      <div class="tabs">
        <div class="tabs__list" role="tablist">
          ${Array.from(tabs).map(
            (tab, index) => html`
              <button
                role="tab"
                aria-selected=${index === this._effectiveActiveIndex}
                @click=${() => this._handleTabClick(index)}
              >
                <slot name="tab-${index}"></slot>
              </button>
            `,
          )}
        </div>

        <div class="tabs__panel" role="tabpanel">
          <slot name="panel-${this._effectiveActiveIndex}"></slot>
        </div>
      </div>
    `;
  }
}
```

**Usage (uncontrolled):**

```html
<controlled-tabs>
  <span slot="tab-0">Overview</span>
  <span slot="tab-1">Details</span>

  <div slot="panel-0">Overview content...</div>
  <div slot="panel-1">Details content...</div>
</controlled-tabs>
```

**Usage (controlled):**

```html
<controlled-tabs active-index="${this.currentTab}" @tab-change="${(e)" ="">
  this.currentTab = e.detail.index} >
  <span slot="tab-0">Overview</span>
  <span slot="tab-1">Details</span>

  <div slot="panel-0">Overview content...</div>
  <div slot="panel-1">Details content...</div>
</controlled-tabs>
```

## HELiX Examples

### Example 1: hx-select (Option Cloning)

The `hx-select` component demonstrates slot-based option management:

```typescript
// Simplified from packages/hx-library/src/components/hx-select/hx-select.ts
@customElement('hx-select')
export class HelixSelect extends LitElement {
  @query('.field__select')
  private _select!: HTMLSelectElement;

  private _handleSlotChange(): void {
    this._syncOptions();
  }

  private _syncOptions(): void {
    if (!this._select) return;

    // Get <option> elements from light DOM slot
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    const slottedOptions =
      slot
        ?.assignedElements({ flatten: true })
        .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement) ?? [];

    // Remove previously cloned options
    const existingCloned = this._select.querySelectorAll('option[data-cloned]');
    existingCloned.forEach((opt) => opt.remove());

    // Clone light DOM options into shadow DOM select
    slottedOptions.forEach((option) => {
      const clone = option.cloneNode(true) as HTMLOptionElement;
      clone.setAttribute('data-cloned', '');
      this._select.appendChild(clone);
    });

    // Sync value after cloning
    if (this.value) {
      this._select.value = this.value;
    }
  }

  override render() {
    return html`
      <select class="field__select" @change=${this._handleChange}>
        ${this.placeholder
          ? html` <option value="" disabled selected>${this.placeholder}</option> `
          : nothing}
      </select>

      <!-- Hidden slot: captures options from light DOM -->
      <slot @slotchange=${this._handleSlotChange} style="display: none;"></slot>
    `;
  }
}
```

**Why clone options?**

- Native `<select>` must have `<option>` children in same DOM tree
- Shadow DOM slots don't satisfy this requirement
- Cloning bridges light DOM (consumer's options) and shadow DOM (styled select)

### Example 2: hx-radio-group (Slot-Based Validation)

```typescript
// Simplified from packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts
@customElement('hx-radio-group')
export class HelixRadioGroup extends LitElement {
  private _getRadios(): HelixRadio[] {
    return Array.from(this.querySelectorAll('hx-radio')) as HelixRadio[];
  }

  private _handleSlotChange(): void {
    this._syncRadios();
  }

  private _syncRadios(): void {
    const radios = this._getRadios();

    radios.forEach((radio) => {
      const isChecked = radio.value === this.value && this.value !== '';
      radio.checked = isChecked;

      if (this.disabled) {
        radio.disabled = true;
      }
    });

    // Roving tabindex management
    const enabledRadios = radios.filter((r) => !r.disabled);
    const checkedRadio = enabledRadios.find((r) => r.checked);

    radios.forEach((radio) => {
      radio.tabIndex = -1;
    });

    if (checkedRadio) {
      checkedRadio.tabIndex = 0;
    } else if (enabledRadios.length > 0) {
      enabledRadios[0].tabIndex = 0;
    }
  }

  override render() {
    return html`
      <fieldset part="fieldset">
        <legend part="legend">${this.label}</legend>
        <div part="group" role="none">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
      </fieldset>
    `;
  }
}
```

**Pattern highlights:**

- Queries slotted `<hx-radio>` elements
- Manages checked state across all radios
- Implements roving tabindex for keyboard navigation
- No manual slot assignment needed (declarative slot attributes)

### Example 3: hx-card (Conditional Sections)

```typescript
// Simplified from packages/hx-library/src/components/hx-card/hx-card.ts
@customElement('hx-card')
export class HelixCard extends LitElement {
  private _hasSlotContent: Record<string, boolean> = {
    image: false,
    heading: false,
    footer: false,
    actions: false,
  };

  private _handleSlotChange(slotName: string) {
    return (e: Event) => {
      const slot = e.target as HTMLSlotElement;
      this._hasSlotContent[slotName] = slot.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
  }

  override render() {
    return html`
      <div part="card" class="card">
        <div class="card__image" part="image" ?hidden=${!this._hasSlotContent['image']}>
          <slot name="image" @slotchange=${this._handleSlotChange('image')}></slot>
        </div>

        <div class="card__heading" part="heading" ?hidden=${!this._hasSlotContent['heading']}>
          <slot name="heading" @slotchange=${this._handleSlotChange('heading')}></slot>
        </div>

        <div class="card__body" part="body">
          <slot></slot>
        </div>

        <div class="card__footer" part="footer" ?hidden=${!this._hasSlotContent['footer']}>
          <slot name="footer" @slotchange=${this._handleSlotChange('footer')}></slot>
        </div>

        <div class="card__actions" part="actions" ?hidden=${!this._hasSlotContent['actions']}>
          <slot name="actions" @slotchange=${this._handleSlotChange('actions')}></slot>
        </div>
      </div>
    `;
  }
}
```

**Pattern highlights:**

- Tracks slot content state in reactive property
- Uses `?hidden` attribute instead of conditional rendering (preserves slots)
- Provides graceful degradation (empty sections don't render)
- No wasted padding/borders for unused sections

## Performance Considerations

### Slot Assignment Cost

Each slot assignment triggers style recalculation and layout:

```typescript
// ❌ EXPENSIVE: Reassigning 100 times in a loop
for (let i = 0; i < 100; i++) {
  slot.assign([items[i]]);
}

// ✅ BETTER: Batch assignment
slot.assign(items.slice(0, 100));
```

**Best practice:** Minimize `assign()` calls. Batch updates when possible.

### Slotchange Event Throttling

For frequently changing content, throttle slot change handlers:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('throttled-list')
export class ThrottledList extends LitElement {
  private _slotChangeTimer: number | null = null;

  private _handleSlotChange() {
    // Cancel pending update
    if (this._slotChangeTimer !== null) {
      clearTimeout(this._slotChangeTimer);
    }

    // Schedule update after 100ms of inactivity
    this._slotChangeTimer = window.setTimeout(() => {
      this._processSlotContent();
      this._slotChangeTimer = null;
    }, 100);
  }

  private _processSlotContent() {
    // Expensive operation: only runs after content settles
    const slot = this.shadowRoot?.querySelector('slot');
    const items = slot?.assignedElements() ?? [];
    console.log('Processing', items.length, 'items');
  }

  override render() {
    return html` <slot @slotchange=${this._handleSlotChange}></slot> `;
  }
}
```

### Virtual Scrolling with Slots

For large lists, use dynamic slot assignment to limit rendered items:

```typescript
@customElement('virtual-list')
export class VirtualList extends LitElement {
  @property({ type: Array })
  items: unknown[] = [];

  @state()
  private _visibleRange = { start: 0, end: 50 };

  private _updateVisibleRange(scrollTop: number) {
    const itemHeight = 40;
    const start = Math.floor(scrollTop / itemHeight);
    const end = start + 50;

    this._visibleRange = { start, end };
  }

  override render() {
    const visibleItems = this.items.slice(this._visibleRange.start, this._visibleRange.end);

    return html`
      <div class="list" @scroll=${(e) => this._updateVisibleRange(e.target.scrollTop)}>
        ${visibleItems.map(
          (item, index) => html`
            <div class="item">
              <slot name="item:${this._visibleRange.start + index}"> ${JSON.stringify(item)} </slot>
            </div>
          `,
        )}
      </div>
    `;
  }
}
```

**Benefits:**

- Only renders 50 items regardless of total count
- Slots created/destroyed as user scrolls
- Maintains acceptable performance with 10,000+ items

## Common Pitfalls

### Pitfall 1: Forgetting slotAssignment Mode

```typescript
// ❌ FAILS: assign() requires manual assignment mode
class BrokenComponent extends LitElement {
  override firstUpdated() {
    const slot = this.shadowRoot.querySelector('slot');
    slot.assign([...]);  // Error: slot assignment mode is not "manual"
  }
}

// ✅ CORRECT: Enable manual assignment
class WorkingComponent extends LitElement {
  createRenderRoot() {
    return this.attachShadow({
      mode: 'open',
      slotAssignment: 'manual'
    });
  }
}
```

### Pitfall 2: Assigning Non-Children

```typescript
const slot = this.shadowRoot.querySelector('slot');
const externalElement = document.querySelector('#external');

// ❌ FAILS: Element must be direct child of host
slot.assign([externalElement]);

// ✅ CORRECT: Only assign host's children
const children = Array.from(this.children);
slot.assign(children);
```

### Pitfall 3: Mixing Assignment Modes

```typescript
// ❌ FAILS: Can't mix manual assign() with slot attributes
<my-component>
  <div slot="header">Title</div>  <!-- Ignored! -->
</my-component>

// Component uses slotAssignment: 'manual', so slot attributes don't work

// ✅ SOLUTION: Pick one mode and stick with it
// Either use manual assignment exclusively, or use named assignment exclusively
```

### Pitfall 4: Losing Slot References

```typescript
// ❌ BAD: Slot recreated on every render
override render() {
  return this.showHeader ? html`
    <slot name="header"></slot>
  ` : nothing;
}

// Toggling showHeader destroys and recreates slot → loses slotchange listener

// ✅ BETTER: Use ?hidden to preserve slot
override render() {
  return html`
    <div ?hidden=${!this.showHeader}>
      <slot name="header"></slot>
    </div>
  `;
}
```

## Summary

Advanced slot patterns unlock sophisticated composition architectures:

1. **Manual slot assignment** (`slotAssignment: 'manual'`, `assign()`) enables imperative slot control
2. **Dynamic slots** create slots at runtime based on data (positional slots, conditional slots)
3. **Slot API** (`assignedElements()`, `assignedNodes()`, `slotchange`) provides programmatic access
4. **Portal patterns** render content outside normal flow (modals, toasts) while preserving logical hierarchy
5. **Slot forwarding** projects content through multiple shadow boundaries for compound components
6. **Hybrid patterns** combine slots with render props, controlled/uncontrolled modes, validation

**When to use advanced patterns:**

- Data-driven components (grids, lists, trees)
- Compound component systems (forms, tabs, accordions)
- Portal requirements (modals, tooltips, notifications)
- Complex composition hierarchies (3+ shadow boundaries)

**When to avoid:**

- Simple content projection (basic slots suffice)
- Performance-critical paths (manual assignment is slower)
- SSR requirements (imperative patterns require JavaScript)

Master these patterns to build enterprise-grade component libraries that scale from simple UI primitives to complex application architectures.

## References

- [MDN: ShadowRoot.slotAssignment](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/slotAssignment)
- [MDN: HTMLSlotElement.assign()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assign)
- [MDN: HTMLSlotElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement)
- [MDN: Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
- [Lit: Working with Shadow DOM](https://lit.dev/docs/components/shadow-dom/)
- [Dynamic Slots Pattern](https://www.abeautifulsite.net/posts/dynamic-slots/)
- [Shadow DOM v1 Specification](https://dom.spec.whatwg.org/#shadow-tree-slots)
- [Slot forwarding patterns](https://javascript.info/slots-composition)
