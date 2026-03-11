---
title: Slots and Composition
description: Master content projection in Shadow DOM with comprehensive coverage of slots, named slots, fallback content, slotchange events, slot assignment, styling slotted content, and real-world composition patterns used in HELiX.
sidebar:
  order: 2
---

# Slots and Composition

Content projection is the mechanism that makes web components truly composable. While Shadow DOM provides style and DOM encapsulation, slots create controlled openings in that boundary—allowing consumers to inject their own content while maintaining the component's internal structure and styling. This guide covers everything from basic slot usage to advanced composition patterns, with real examples from the HELiX library.

## What Are Slots?

A **slot** is a placeholder inside a web component's shadow tree that gets filled with content from the light DOM (the consumer's markup). Think of slots as "windows" into the shadow DOM where external content can be displayed without breaking encapsulation.

### The Content Projection Problem

Without slots, shadow DOM content is completely isolated:

```html
<!-- Component definition -->
<template id="broken-card">
  <style>
    .card {
      border: 1px solid var(--hx-color-border);
    }
  </style>
  <div class="card">
    <!-- User's content? No way to get it here! -->
  </div>
</template>

<!-- Usage -->
<broken-card>
  <h2>This content is ignored!</h2>
  <p>It never renders because shadow DOM blocks it.</p>
</broken-card>
```

Children placed inside a custom element don't render by default when a shadow root exists. They exist in the light DOM but have nowhere to project into the shadow tree.

### The Slot Solution

```html
<!-- Component definition with slot -->
<template id="working-card">
  <style>
    .card {
      border: 1px solid var(--hx-color-border);
    }
  </style>
  <div class="card">
    <slot></slot>
    <!-- Projection point! -->
  </div>
</template>

<!-- Usage -->
<working-card>
  <h2>This content renders!</h2>
  <p>It projects through the slot into the shadow tree.</p>
</working-card>
```

Now the children are **distributed** into the shadow tree at the slot location. The light DOM content remains in the light DOM (for accessibility and DOM APIs), but it **visually renders** where the slot appears in the shadow tree.

### Key Terminology

| Term                 | Definition                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| **Light DOM**        | The regular DOM tree where consumers write markup (outside shadow boundary)  |
| **Shadow DOM**       | The encapsulated DOM tree inside the component (behind shadow boundary)      |
| **Slot**             | A `<slot>` element in the shadow tree that serves as a projection point      |
| **Slotted content**  | Light DOM elements assigned to a slot (also called "distributed nodes")      |
| **Fallback content** | Default content inside a `<slot>` element, shown when no content is assigned |
| **Named slot**       | A slot with a `name` attribute for selective projection                      |
| **Default slot**     | An unnamed `<slot>` that receives all unassigned light DOM children          |

## Basic Slot Usage

The simplest slot pattern is a single unnamed slot that accepts all children.

### Default (Unnamed) Slot

```typescript
// HELiX style component
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-panel')
export class HelixPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .panel {
      padding: var(--hx-space-4);
      background: var(--hx-color-neutral-0);
      border: 1px solid var(--hx-color-neutral-200);
      border-radius: var(--hx-border-radius-md);
    }
  `;

  override render() {
    return html`
      <div class="panel">
        <slot></slot>
        <!-- Default slot receives ALL children -->
      </div>
    `;
  }
}
```

**Usage:**

```html
<hx-panel>
  <h2>Panel Title</h2>
  <p>Any content works here.</p>
  <button>Action</button>
</hx-panel>
```

All three elements (`<h2>`, `<p>`, `<button>`) are assigned to the default slot and render inside the `.panel` wrapper. The component controls the container styling, while the consumer controls the content.

### Rendered Output (Conceptual)

```
Shadow DOM:
  <div class="panel">
    <slot>
      ↓ (projects light DOM here)
    </slot>
  </div>

Light DOM (unchanged):
  <h2>Panel Title</h2>
  <p>Any content works here.</p>
  <button>Action</button>

Visual Result:
  <div class="panel" (styled by shadow CSS)>
    <h2>Panel Title</h2> (light DOM, user's styles apply)
    <p>Any content works here.</p>
    <button>Action</button>
  </div>
```

The critical insight: **slotted content remains in the light DOM.** Slots don't move elements—they create a rendering portal.

## Named Slots

Named slots enable **selective projection**—different parts of the light DOM can be assigned to specific locations in the shadow tree.

### Defining Named Slots

```typescript
@customElement('hx-card')
export class HelixCard extends LitElement {
  static override styles = css`
    .card {
      /* card container styles */
    }
    .card__header {
      /* header section styles */
    }
    .card__body {
      /* body section styles */
    }
    .card__footer {
      /* footer section styles */
    }
  `;

  override render() {
    return html`
      <div class="card">
        <div class="card__header">
          <slot name="header"></slot>
          <!-- Named slot -->
        </div>
        <div class="card__body">
          <slot></slot>
          <!-- Default slot -->
        </div>
        <div class="card__footer">
          <slot name="footer"></slot>
          <!-- Named slot -->
        </div>
      </div>
    `;
  }
}
```

### Assigning Content to Named Slots

Consumers use the global `slot` attribute to target specific slots:

```html
<hx-card>
  <h2 slot="header">Card Title</h2>
  <!-- Goes to slot[name="header"] -->
  <p>This is the body content.</p>
  <!-- Goes to default slot (no slot attr) -->
  <span slot="footer">Last updated: Today</span>
  <!-- Goes to slot[name="footer"] -->
</hx-card>
```

**Key rules:**

- Elements with `slot="header"` → assigned to `<slot name="header">`
- Elements with `slot="footer"` → assigned to `<slot name="footer">`
- Elements **without** a `slot` attribute → assigned to default `<slot>` (unnamed)
- If no matching slot exists, the element doesn't render

### Multiple Elements Per Slot

```html
<hx-card>
  <h2 slot="header">Title</h2>
  <button slot="header">Close</button>
  <!-- Both go to "header" slot -->

  <p>First paragraph</p>
  <p>Second paragraph</p>
  <!-- Both go to default slot -->

  <a slot="footer" href="/more">Read more</a>
  <span slot="footer">5 min read</span>
  <!-- Both go to "footer" slot -->
</hx-card>
```

Slots accept **any number** of assigned elements. They render in source order (the order they appear in the light DOM).

## Fallback Content

Slots can contain **fallback content**—default markup that renders only when no content is assigned.

### Basic Fallback Pattern

```typescript
@customElement('hx-alert')
export class HelixAlert extends LitElement {
  override render() {
    return html`
      <div class="alert">
        <slot name="icon">
          <!-- Fallback: default icon if user doesn't provide one -->
          <svg class="default-icon"><!-- ... --></svg>
        </slot>
        <div class="message">
          <slot></slot>
          <!-- No fallback: message is required -->
        </div>
      </div>
    `;
  }
}
```

**Usage without icon:**

```html
<hx-alert>
  <p>This is an alert message.</p>
  <!-- No icon provided, fallback SVG renders -->
</hx-alert>
```

**Usage with custom icon:**

```html
<hx-alert>
  <img slot="icon" src="/warning.svg" alt="" />
  <!-- Replaces fallback -->
  <p>This is an alert message.</p>
</hx-alert>
```

### Fallback Behavior

Fallback content is **completely replaced** when any content is assigned:

```html
<slot name="username">
  <span class="placeholder">Anonymous User</span>
</slot>
```

- **No `slot="username"` elements:** Renders `<span class="placeholder">Anonymous User</span>`
- **One or more `slot="username"` elements:** Fallback is completely replaced, doesn't render at all

**Important:** If **any** element assigns to the slot, the entire fallback is hidden—even if the assigned content is empty:

```html
<!-- This STILL hides fallback, even though span is empty -->
<my-component>
  <span slot="username"></span>
  <!-- Empty but assigned! -->
</my-component>
```

## The slotchange Event

The `slotchange` event fires when a slot's assigned content changes. This is essential for dynamic components that need to react to content updates.

### Basic Event Handling

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-tabs')
export class HelixTabs extends LitElement {
  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assignedElements = slot.assignedElements();

    console.log(`Slot now has ${assignedElements.length} elements`);

    // React to content changes
    this.updateTabIndicator();
  }

  override render() {
    return html`
      <div class="tabs">
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}
```

### Real-World Pattern: Conditional Layout

The `hx-card` component in HELiX uses `slotchange` to conditionally show/hide sections:

```typescript
@customElement('hx-card')
export class HelixCard extends LitElement {
  // Track which slots have content
  private _hasSlotContent: Record<string, boolean> = {
    image: false,
    heading: false,
    footer: false,
    actions: false,
  };

  private _handleSlotChange(slotName: string) {
    return (e: Event) => {
      const slot = e.target as HTMLSlotElement;
      // Check if slot has any assigned nodes (flatten: true includes fallback)
      this._hasSlotContent[slotName] = slot.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate(); // Trigger re-render
    };
  }

  override render() {
    return html`
      <div class="card">
        <!-- Only render image section if content exists -->
        <div class="card__image" ?hidden=${!this._hasSlotContent['image']}>
          <slot name="image" @slotchange=${this._handleSlotChange('image')}></slot>
        </div>

        <!-- Only render heading section if content exists -->
        <div class="card__heading" ?hidden=${!this._hasSlotContent['heading']}>
          <slot name="heading" @slotchange=${this._handleSlotChange('heading')}></slot>
        </div>

        <!-- Body: always visible (default slot) -->
        <div class="card__body">
          <slot></slot>
        </div>

        <!-- Optional footer and actions -->
        <div class="card__footer" ?hidden=${!this._hasSlotContent['footer']}>
          <slot name="footer" @slotchange=${this._handleSlotChange('footer')}></slot>
        </div>

        <div class="card__actions" ?hidden=${!this._hasSlotContent['actions']}>
          <slot name="actions" @slotchange=${this._handleSlotChange('actions')}></slot>
        </div>
      </div>
    `;
  }
}
```

**Benefits:**

- No empty sections with borders/padding when content isn't provided
- Dynamic: works even if content is added/removed after initial render
- Graceful degradation: only shows what's actually provided

### When slotchange Fires

```typescript
const card = document.querySelector('hx-card');

// ✅ Fires slotchange:
card.innerHTML = '<h2 slot="heading">New Title</h2>';

// ✅ Fires slotchange:
const heading = document.createElement('h2');
heading.setAttribute('slot', 'heading');
heading.textContent = 'Another Title';
card.appendChild(heading);

// ✅ Fires slotchange:
card.querySelector('[slot="heading"]').remove();

// ❌ Does NOT fire slotchange (text node changes don't trigger it):
card.querySelector('[slot="heading"]').textContent = 'Updated Title';
```

**Key constraint:** `slotchange` fires when the **assignment changes** (elements added/removed/reassigned), not when assigned elements' **content** changes.

## Accessing Slotted Content

Components often need to query or interact with slotted content programmatically.

### assignedElements() and assignedNodes()

```typescript
const slot = this.shadowRoot.querySelector('slot[name="header"]');

// Get assigned elements (excludes text nodes)
const elements = slot.assignedElements();
console.log(elements); // [<h2>, <button>]

// Get assigned nodes (includes text nodes)
const nodes = slot.assignedNodes();
console.log(nodes); // [<h2>, '\n  ', <button>, '\n']

// Get with fallback (if no assignment, returns slot children)
const withFallback = slot.assignedElements({ flatten: true });
```

**Options:**

- `{ flatten: true }` — If no content is assigned, returns fallback content instead of empty array
- `{ flatten: false }` (default) — Returns empty array if no content assigned

### Lit Decorators: @queryAssignedElements

Lit provides convenient decorators for accessing slotted content:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { queryAssignedElements } from 'lit/decorators.js';

@customElement('hx-list')
export class HelixList extends LitElement {
  // Query all assigned elements in default slot
  @queryAssignedElements()
  private _allItems!: HTMLElement[];

  // Query specific slot by name
  @queryAssignedElements({ slot: 'header' })
  private _headerElements!: HTMLElement[];

  // Filter by selector (only get buttons)
  @queryAssignedElements({ selector: 'button' })
  private _buttons!: HTMLButtonElement[];

  // Access in lifecycle methods
  override updated() {
    console.log(`List has ${this._allItems.length} items`);
    console.log(`Found ${this._buttons.length} buttons`);
  }

  override render() {
    return html`
      <div class="list-header">
        <slot name="header"></slot>
      </div>
      <div class="list-body">
        <slot></slot>
      </div>
    `;
  }
}
```

**Benefits:**

- Automatically updates when content changes
- Type-safe with TypeScript
- Cleaner than manual `querySelector` calls

### Pattern: Validating Slotted Content

```typescript
@customElement('hx-radio-group')
export class HelixRadioGroup extends LitElement {
  @queryAssignedElements({ selector: 'hx-radio' })
  private _radios!: HelixRadio[];

  override updated() {
    // Ensure only hx-radio elements are slotted
    const allElements = this.querySelectorAll('*');
    const validElements = Array.from(allElements).every((el) => el.tagName === 'HX-RADIO');

    if (!validElements) {
      console.warn('hx-radio-group should only contain hx-radio elements');
    }

    // Setup radio button group behavior
    this._radios.forEach((radio, index) => {
      radio.setAttribute('name', this.name);
      radio.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
  }

  override render() {
    return html`
      <div role="radiogroup" aria-labelledby="label">
        <slot></slot>
      </div>
    `;
  }
}
```

## Slot Assignment and Reassignment

Understanding how the browser assigns elements to slots is critical for dynamic content scenarios.

### Assignment Algorithm

When the browser encounters slotted content:

1. **Find all slots** in the shadow tree
2. For each light DOM child:
   - If it has `slot="name"`, assign to `<slot name="name">` (if it exists)
   - If it has no `slot` attribute, assign to default `<slot>` (if it exists)
   - If no matching slot exists, element doesn't render
3. Assignment happens in **source order** (document order in light DOM)

### Dynamic Reassignment

```typescript
// Initial markup
const card = document.querySelector('hx-card');
card.innerHTML = `
  <h2 slot="header">Title</h2>
  <p>Body content</p>
`;

// Reassign heading from header slot to footer slot
const heading = card.querySelector('[slot="header"]');
heading.setAttribute('slot', 'footer'); // Triggers slotchange on both slots

// Remove slot assignment (goes to default slot)
heading.removeAttribute('slot'); // Triggers slotchange

// Programmatically set slot via property (same effect)
heading.slot = 'header'; // Triggers slotchange
```

**Important:** Changing the `slot` attribute fires `slotchange` on **both** the old slot (if any) and the new slot.

### Multiple Slots with Same Name

If you accidentally define multiple slots with the same name:

```html
<slot name="duplicate"></slot> <slot name="duplicate"></slot>
<!-- Same name! -->
```

**Behavior:** All matching elements assign to the **first** slot only. The second slot never receives content. This is almost always a bug—ensure slot names are unique.

## Multi-Level Slots (Slot Forwarding)

Slots can project through multiple levels of shadow DOM. This enables composition of composite components.

### The Problem: Nested Components

```html
<!-- Component A -->
<template id="outer-card">
  <div class="card">
    <inner-header></inner-header>
    <!-- Another component -->
    <slot></slot>
  </div>
</template>

<!-- Component B -->
<template id="inner-header">
  <div class="header">
    <!-- How do we get content here from outer-card's consumer? -->
  </div>
</template>
```

**Issue:** Content can't project through multiple shadow boundaries automatically.

### The Solution: Explicit Slot Forwarding

```html
<!-- Component A -->
<template id="outer-card">
  <div class="card">
    <inner-header>
      <slot name="title" slot="content"></slot>
      <!-- Forward slot -->
    </inner-header>
    <slot></slot>
  </div>
</template>

<!-- Component B -->
<template id="inner-header">
  <div class="header">
    <slot name="content"></slot>
    <!-- Receives forwarded content -->
  </div>
</template>
```

**Usage:**

```html
<outer-card>
  <h1 slot="title">This Projects Through!</h1>
  <p>Body content</p>
</outer-card>
```

**Flow:**

1. `<h1 slot="title">` assigns to `<slot name="title">` in outer-card's shadow
2. That slot has `slot="content"`, so it becomes light DOM for inner-header
3. Inner-header's `<slot name="content">` receives it

### Real-World Example: hx-button

The `hx-button` component uses a simple slot but can be composed into more complex components:

```typescript
// hx-button: Simple component with default slot
@customElement('hx-button')
export class HelixButton extends LitElement {
  override render() {
    return html`
      <button part="button">
        <slot></slot>
        <!-- Button label content -->
      </button>
    `;
  }
}

// hx-card with actions: Forwards slot to buttons
@customElement('hx-card')
export class HelixCard extends LitElement {
  override render() {
    return html`
      <div class="card">
        <slot></slot>
        <div class="card__actions">
          <slot name="actions"></slot>
          <!-- Buttons go here -->
        </div>
      </div>
    `;
  }
}
```

**Usage:**

```html
<hx-card>
  <p>Card content</p>
  <hx-button slot="actions">Save</hx-button>
  <hx-button slot="actions" variant="secondary">Cancel</hx-button>
</hx-card>
```

Each `hx-button` internally has its own slot for the label, but from the card's perspective, entire buttons are slotted.

## Styling Slotted Content

Shadow DOM encapsulation means component styles don't affect slotted content by default. Special CSS selectors bridge this gap.

### The ::slotted() Pseudo-Element

`::slotted()` targets **top-level** slotted elements from within shadow CSS:

```typescript
@customElement('hx-list')
export class HelixList extends LitElement {
  static override styles = css`
    /* Style the slot container */
    .list {
      padding: var(--hx-space-4);
    }

    /* Style DIRECT slotted elements */
    ::slotted(*) {
      margin-bottom: var(--hx-space-2);
    }

    /* Style specific slotted elements */
    ::slotted(li) {
      list-style: none;
      padding-left: var(--hx-space-3);
    }

    /* Style slotted elements with class */
    ::slotted(.highlight) {
      background: var(--hx-color-accent-100);
    }

    /* Named slot selector */
    ::slotted([slot='header']) {
      font-weight: var(--hx-font-weight-bold);
    }
  `;

  override render() {
    return html`
      <div class="list">
        <slot name="header"></slot>
        <slot></slot>
      </div>
    `;
  }
}
```

### ::slotted() Limitations

**Only targets direct children:**

```html
<hx-list>
  <li>Item 1</li>
  <!-- ✅ ::slotted(li) applies -->
  <div>
    <li>Nested</li>
    <!-- ❌ ::slotted(li) does NOT apply (not direct child) -->
  </div>
</hx-list>
```

**Cannot use complex selectors:**

```css
/* ❌ INVALID: Can't use descendant selectors */
::slotted(li span) {
}

/* ❌ INVALID: Can't use pseudo-classes (except :host-context) */
::slotted(li:first-child) {
}

/* ✅ VALID: Simple selectors only */
::slotted(li) {
}
::slotted(.className) {
}
::slotted([attribute]) {
}
```

**Specificity is low:**

```css
/* Component shadow CSS */
::slotted(p) {
  color: blue;
}

/* Light DOM CSS (consumer's stylesheet) */
p {
  color: red; /* ✅ WINS (light DOM styles beat ::slotted) */
}
```

### Styling Strategy

```typescript
static override styles = css`
  /* 1. Style the slot container (full control) */
  .card__body {
    padding: var(--hx-space-4);
    background: var(--hx-color-neutral-0);
  }

  /* 2. Style slotted elements with low specificity (suggestions) */
  ::slotted(*) {
    margin-bottom: var(--hx-space-2);  /* Default spacing */
  }

  /* 3. Provide CSS custom properties for consumer overrides */
  ::slotted(p) {
    color: var(--hx-card-text-color, var(--hx-color-neutral-800));
  }
`;
```

**Consumer can override:**

```css
hx-card {
  --hx-card-text-color: #333; /* Override via custom property */
}

hx-card p {
  color: red; /* Direct override (higher specificity) */
}
```

### The :slotted vs. Consumer Styles Relationship

```
Specificity (low to high):
  1. Component ::slotted() styles (lowest)
  2. Consumer global styles
  3. Consumer scoped styles (highest)

Result:
  - Component can suggest styles (margins, basic layout)
  - Consumer always wins and can override
  - Best of both worlds: components look good out-of-the-box, but customizable
```

## Composition Patterns and Best Practices

### Pattern 1: Hybrid Slot/Property Strategy (ADR-001)

HELiX follows a **hybrid approach**: use properties for data, slots for rich content.

**When to use properties:**

```typescript
@customElement('hx-alert')
export class HelixAlert extends LitElement {
  @property({ type: String })
  variant: 'info' | 'warning' | 'error' = 'info'; // ✅ Property for enum

  @property({ type: Boolean })
  dismissible = false; // ✅ Property for boolean flag

  // ❌ NOT a property: message is rich content (may have formatting, links, etc.)
}
```

**When to use slots:**

```typescript
override render() {
  return html`
    <div class="alert alert--${this.variant}">
      <slot name="icon"></slot>  <!-- ✅ Slot: user may want custom SVG/image -->
      <div class="message">
        <slot></slot>  <!-- ✅ Slot: rich HTML content -->
      </div>
      ${this.dismissible ? html`<button>×</button>` : ''}
    </div>
  `;
}
```

**Usage:**

```html
<hx-alert variant="warning" dismissible>
  <strong>Warning:</strong> Your session expires in <a href="/renew">5 minutes</a>.
</hx-alert>
```

**Benefits:**

- Properties: type-safe, reactive, easy to serialize
- Slots: rich HTML, accessible, consumer controls markup

### Pattern 2: Required vs. Optional Slots

Use fallback content to differentiate:

```typescript
override render() {
  return html`
    <div class="card">
      <!-- Optional: has fallback -->
      <slot name="icon">
        <svg class="default-icon"><!-- ... --></svg>
      </slot>

      <!-- Required: no fallback, consumer must provide -->
      <slot name="title"></slot>

      <!-- Optional: can be empty -->
      <slot></slot>
    </div>
  `;
}
```

**Document requirements in JSDoc:**

```typescript
/**
 * @slot title - (Required) The card title content.
 * @slot icon - (Optional) Custom icon. Defaults to standard icon if not provided.
 * @slot - (Optional) Default slot for card body content.
 */
```

### Pattern 3: Slot Validation

Enforce content types in `updated()`:

```typescript
@customElement('hx-tab-group')
export class HelixTabGroup extends LitElement {
  @queryAssignedElements()
  private _tabs!: HTMLElement[];

  override updated() {
    // Validate: only hx-tab elements allowed
    const invalidTabs = this._tabs.filter((el) => el.tagName.toLowerCase() !== 'hx-tab');

    if (invalidTabs.length > 0) {
      console.error('hx-tab-group only accepts hx-tab elements as children', invalidTabs);
    }
  }
}
```

### Pattern 4: Conditional Wrappers

Only render wrapper elements if slot has content:

```typescript
override render() {
  return html`
    <div class="card">
      ${this._hasSlotContent['header'] ? html`
        <div class="card__header">
          <slot name="header" @slotchange=${this._handleSlotChange('header')}></slot>
        </div>
      ` : ''}

      <div class="card__body">
        <slot></slot>
      </div>
    </div>
  `;
}
```

**Problem:** Template re-renders, slot element recreated → loses event listeners

**Better pattern:** Use `?hidden` attribute:

```typescript
override render() {
  return html`
    <div class="card">
      <div class="card__header" ?hidden=${!this._hasSlotContent['header']}>
        <slot name="header" @slotchange=${this._handleSlotChange('header')}></slot>
      </div>

      <div class="card__body">
        <slot></slot>
      </div>
    </div>
  `;
}
```

**Benefits:**

- Slot element persists (event listener stays attached)
- Faster re-renders (Lit doesn't recreate DOM)
- Semantically clean (hidden attribute is semantic)

### Pattern 5: Slot Communication

Children can communicate with parent through events:

```typescript
// Child component
@customElement('hx-tab')
export class HelixTab extends LitElement {
  @property({ type: Boolean })
  active = false;

  private _handleClick() {
    this.dispatchEvent(
      new CustomEvent('hx-tab-select', {
        bubbles: true,
        composed: true, // Cross shadow boundary
        detail: { tab: this },
      }),
    );
  }

  override render() {
    return html`
      <button @click=${this._handleClick}>
        <slot></slot>
      </button>
    `;
  }
}

// Parent component
@customElement('hx-tab-group')
export class HelixTabGroup extends LitElement {
  @queryAssignedElements()
  private _tabs!: HelixTab[];

  private _handleTabSelect(e: CustomEvent) {
    const selectedTab = e.detail.tab;

    // Update all tabs
    this._tabs.forEach((tab) => {
      tab.active = tab === selectedTab;
    });
  }

  override render() {
    return html`
      <div class="tabs" @hx-tab-select=${this._handleTabSelect}>
        <slot></slot>
      </div>
    `;
  }
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Forgetting `composed: true`

```typescript
// ❌ BAD: Event doesn't cross shadow boundary
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    // Missing composed: true!
    detail: { value: this.value },
  }),
);

// ✅ GOOD: Event crosses shadow boundary
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true, // Required to bubble through shadow DOM
    detail: { value: this.value },
  }),
);
```

### Pitfall 2: Styling Deep Children

```css
/* ❌ INVALID: Can't style grandchildren */
::slotted(div span) {
  color: red;
}

/* ✅ SOLUTION 1: Style slotted div, let light DOM CSS handle children */
::slotted(div) {
  font-size: 16px;
}

/* ✅ SOLUTION 2: Use CSS custom properties */
::slotted(div) {
  --text-color: red;
}

/* Consumer provides: */
div span {
  color: var(--text-color, inherit);
}
```

### Pitfall 3: Mutating Slotted Elements

```typescript
// ⚠️ RISKY: Directly modifying slotted content
override updated() {
  const slottedDivs = this.querySelectorAll('div');
  slottedDivs.forEach((div) => {
    div.classList.add('enhanced');  // Side effect on consumer's DOM!
  });
}

// ✅ BETTER: Use CSS parts or custom properties
```

**Rule:** Prefer declarative styling over imperative DOM manipulation.

### Pitfall 4: Slot Assignment Timing

```typescript
// ❌ BAD: Querying in connectedCallback
connectedCallback() {
  super.connectedCallback();
  const items = this.querySelectorAll('li');  // May be empty! Light DOM may not be parsed yet
}

// ✅ GOOD: Query in firstUpdated or use @queryAssignedElements
@queryAssignedElements({ selector: 'li' })
private _items!: HTMLLIElement[];

override firstUpdated() {
  console.log(`Found ${this._items.length} items`);
}
```

## Summary

Slots are the composition primitive that makes web components truly reusable. Key takeaways:

1. **Default slots** accept all unassigned children; **named slots** enable selective projection
2. **Fallback content** provides defaults when consumers don't provide content
3. **slotchange events** enable dynamic components that react to content updates
4. **::slotted()** styles direct slotted elements but has low specificity (consumers can override)
5. **Hybrid strategy** (ADR-001): Properties for data, slots for rich content
6. **Slot forwarding** enables multi-level composition through shadow boundaries
7. **Always use `composed: true`** for events that should cross shadow DOM

Mastering slots unlocks the full compositional power of web components—building flexible, reusable UI primitives that work in any context.

## References

- [MDN: `<slot>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot)
- [MDN: Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
- [MDN: `::slotted()` pseudo-element](https://developer.mozilla.org/en-US/docs/Web/CSS/::slotted)
- [Lit: Shadow DOM documentation](https://lit.dev/docs/components/shadow-dom/)
- [Lit: Working with slots](https://lit.dev/docs/components/shadow-dom/#slots)
- [Web Components: Slot composition](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM#Slots)
- [WHATWG: Shadow tree slots specification](https://dom.spec.whatwg.org/#shadow-tree-slots)
