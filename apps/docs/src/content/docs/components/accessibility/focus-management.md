---
title: Focus Management
description: Complete guide to focus management in web components, covering focus delegation, programmatic focus, focus traps, and focus restoration patterns in the Helix component library.
sidebar:
  order: 4
---

Focus management is a critical aspect of web accessibility that ensures keyboard and assistive technology users can navigate interfaces predictably and efficiently. For healthcare applications where every interaction matters, proper focus management can mean the difference between seamless workflow and dangerous confusion.

This guide covers focus management patterns specific to web components built with Shadow DOM, including focus delegation, programmatic focus control, focus trapping for modal interfaces, and focus restoration strategies implemented across the Helix component library.

## Prerequisites

Before diving into focus management, ensure you understand:

- [Keyboard Navigation](/components/accessibility/keyboard/) patterns and tab order fundamentals
- Shadow DOM encapsulation boundaries and how they affect focus
- WCAG 2.1 Success Criteria related to focus (2.4.3 Focus Order, 2.4.7 Focus Visible, 3.2.1 On Focus)

## Why Focus Management Matters

Focus management serves multiple critical functions in accessible applications:

- **Orientation** — Users always know where they are in the interface
- **Efficiency** — Users can complete tasks without unnecessary navigation
- **Predictability** — Focus moves in logical, expected patterns
- **Recoverability** — After actions or interruptions, users return to a meaningful location
- **Compliance** — WCAG 2.1 AA requires proper focus management for modal dialogs, dynamic content, and complex widgets

In healthcare environments, poor focus management can:

- **Disrupt clinical workflows** when focus moves unpredictably
- **Cause data entry errors** when focus lands on wrong fields
- **Block emergency actions** when modal focus traps fail
- **Violate compliance** requirements under Section 508 and WCAG 2.1 AA

### WCAG Requirements

The Joint Commission and CMS require healthcare applications to meet WCAG 2.1 AA standards. Focus management is explicitly covered by multiple success criteria:

| Criterion                                                                                   | Level | Requirement                                      |
| ------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------ |
| [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)                 | A     | All functionality available via keyboard         |
| [2.1.2 No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html) | A     | Focus can always move away from components       |
| [2.4.3 Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html)           | A     | Focus order preserves meaning and operability    |
| [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html)       | AA    | Keyboard focus indicator is visible              |
| [3.2.1 On Focus](https://www.w3.org/WAI/WCAG21/Understanding/on-focus.html)                 | A     | Focus doesn't trigger unexpected context changes |

**Zero accessibility regressions is the standard.** Focus management bugs are not tech debt — they are compliance violations that can block product releases in regulated healthcare environments.

## Shadow DOM Focus Challenges

Shadow DOM provides style encapsulation and DOM isolation, but it introduces unique focus management challenges that don't exist in traditional web development.

### Challenge 1: Focus Delegation

By default, when a shadow host element receives focus, focus **does not** automatically move to focusable elements inside the shadow DOM:

```html
<hx-text-input label="Email">
  #shadow-root (open)
  <label>Email</label>
  <input type="email" />
  <!-- This won't receive focus by default -->
</hx-text-input>
```

If you tab to `<hx-text-input>` or call `element.focus()`, focus stops at the host element unless you implement focus delegation.

**Problems this creates:**

- Users can't type because the actual input element isn't focused
- Focus indicators appear on the wrong element
- Screen readers announce the component incorrectly
- Browser autocomplete and form features don't work

### Challenge 2: Label Association Across Boundaries

Native `<label>` elements cannot associate with form controls inside shadow DOM using the `for` attribute:

```html
<!-- This does NOT work -->
<label for="my-input">Email</label>
<hx-text-input>
  #shadow-root (open)
  <input id="my-input" />
  <!-- Label won't associate -->
</hx-text-input>
```

**Solution:** Keep labels and inputs in the same shadow root, or use `aria-label` for cross-boundary labeling.

### Challenge 3: Focus Indicators

The `:focus-visible` pseudo-class determines whether focus indicators should display (keyboard vs. mouse focus). Shadow DOM components must implement their own focus indicators since page-level styles can't penetrate the shadow boundary:

```css
/* Page-level styles DON'T work */
button:focus-visible {
  outline: 2px solid blue;
}

/* Must be defined inside shadow DOM */
:host {
  /* Component styles */
}

button:focus-visible {
  outline: 2px solid var(--hx-focus-ring-color);
  outline-offset: 2px;
}
```

### Challenge 4: Querying Focused Elements

`document.activeElement` returns the shadow host when focus is inside shadow DOM, not the actual focused element:

```javascript
// When focus is inside <hx-text-input>
const active = document.activeElement;
console.log(active); // <hx-text-input> (not the internal <input>)

// Must traverse into shadow root
const shadowActive = active.shadowRoot?.activeElement;
console.log(shadowActive); // <input>
```

## Focus Delegation with `delegatesFocus`

The [`delegatesFocus`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/delegatesFocus) property automatically forwards focus from the shadow host to the first focusable element inside the shadow root.

### How It Works

[When `delegatesFocus` is enabled](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/ShadowRoot-delegatesFocus-Proposal.md):

1. **Clicking the host** — Focus moves to the first focusable element in the shadow root
2. **Calling `.focus()`** — Focus moves to the first focusable element in the shadow root
3. **Tab navigation** — If `tabindex="0"` or positive, forward tab skips the host and goes directly to the first focusable element
4. **Host styling** — The shadow host receives `:focus` styling when internal elements are focused

### Setting `delegatesFocus`

In Lit:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // Enable focus delegation
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  override render() {
    return html`
      <label for="input">Name</label>
      <input id="input" type="text" />
    `;
  }
}
```

In vanilla JavaScript:

```javascript
// When creating a shadow root
element.attachShadow({ mode: 'open', delegatesFocus: true });
```

Declaratively via `<template>`:

```html
<template shadowrootmode="open" shadowrootdelegatesfocus>
  <input type="text" />
</template>
```

### Controlling Which Element Receives Focus

`delegatesFocus` always focuses the **first focusable element** in DOM order. [If this isn't what you want](https://www.matuzo.at/blog/2023/web-components-accessibility-faq/can-I-focus-an-element), use the `autofocus` attribute:

```typescript
override render() {
  return html`
    <!-- Hidden clear button comes first in DOM -->
    <button tabindex="-1" aria-hidden="true">Clear</button>

    <!-- But we want this input focused -->
    <input id="input" type="text" autofocus />
  `;
}
```

With `autofocus`, the input receives focus instead of the button, even though the button appears first in DOM order.

### When to Use `delegatesFocus`

**Use `delegatesFocus: true` for:**

- Form components (inputs, selects, textareas)
- Components with a single primary interactive element
- Components where the host element should never be in the tab order
- Components that wrap native form controls

**Examples:** `hx-text-input`, `hx-select`, `hx-textarea`, `hx-switch`, `hx-checkbox`

**Don't use `delegatesFocus` for:**

- Composite components (radio groups, tabs, accordions) where you manually manage focus
- Components with multiple focusable elements where you need fine-grained control
- Non-interactive components (badges, cards, alerts)
- Components where you implement roving tabindex

### Manual Focus Delegation in Helix

Helix form components use **manual focus delegation** instead of `delegatesFocus: true` to maintain full control over focus behavior:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  @query('.field__input')
  private _input!: HTMLInputElement;

  /** Moves focus to the input element. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  /** Selects all text in the input. */
  select(): void {
    this._input?.select();
  }

  override render() {
    return html`
      <label for="input">${this.label}</label>
      <input
        id="input"
        class="field__input"
        type="text"
        .value=${this.value}
        @input=${this._handleInput}
      />
    `;
  }
}
```

**Benefits of manual delegation:**

- Explicit control over focus behavior
- Additional methods like `select()` that operate on the internal element
- Consistent API across all form components
- No surprises from `delegatesFocus` focusing the "wrong" element

## Focusable Elements in Web Components

Not all HTML elements are focusable by default. Understanding which elements can receive focus and how to control focusability is essential for accessible components.

### Natively Focusable Elements

These elements are focusable without any additional attributes:

- `<a>` with `href` attribute
- `<button>`
- `<input>` (except `type="hidden"`)
- `<select>`
- `<textarea>`
- `<audio>` and `<video>` with `controls` attribute
- `<details>`
- `<iframe>`
- Elements with `contenteditable` attribute

### Using `tabindex`

The `tabindex` attribute controls whether an element can receive focus and its position in the tab order:

| Value           | Behavior                                                                |
| --------------- | ----------------------------------------------------------------------- |
| `tabindex="-1"` | Focusable via JavaScript (`.focus()`), not in tab order                 |
| `tabindex="0"`  | Focusable via keyboard, in natural tab order                            |
| `tabindex="1+"` | Focusable via keyboard, in explicit order (avoid — breaks natural flow) |

#### `tabindex="-1"` — Programmatic Focus Only

Use `tabindex="-1"` for elements that should receive focus programmatically but not via keyboard navigation:

```html
<!-- Focus restored to this heading after modal closes -->
<h1 tabindex="-1" id="page-title">Patient Dashboard</h1>

<!-- Focus moved here after form submission -->
<div tabindex="-1" role="alert">Form submitted successfully</div>

<!-- Focus moved here after deletion -->
<div tabindex="-1" class="list-container">
  <!-- List items -->
</div>
```

[This is the most common use case for `tabindex="-1"` in accessible applications](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html).

#### `tabindex="0"` — Natural Tab Order

Use `tabindex="0"` to make non-interactive elements focusable in the natural tab order:

```html
<!-- Custom interactive card -->
<div role="button" tabindex="0" @click="${this._handleClick}" @keydown="${this._handleKeyDown}">
  <slot></slot>
</div>
```

**Warning:** Only use `tabindex="0"` on elements with appropriate ARIA roles. Adding `tabindex="0"` to a `<div>` without a role creates a focusable element with no semantic meaning, confusing screen reader users.

#### `tabindex="1+"` — Explicit Order (Anti-Pattern)

Positive `tabindex` values create an explicit focus order that overrides natural DOM order:

```html
<!-- Anti-pattern: breaks natural flow -->
<input tabindex="2" />
<input tabindex="1" />
<input tabindex="3" />

<!-- Tab order: 1 → 2 → 3 (not visual order!) -->
```

**Never use positive `tabindex` values.** They break natural reading order, confuse users, and make components impossible to maintain as the page structure evolves.

### Making Custom Elements Focusable

When building custom interactive elements, follow this pattern:

1. Use a native focusable element internally (e.g., `<button>`, `<input>`)
2. Add appropriate ARIA role and attributes
3. Implement keyboard event handlers
4. Provide a `focus()` method that delegates to the internal element

```typescript
// Good: Uses native button
@customElement('hx-button')
export class HelixButton extends LitElement {
  override render() {
    return html`
      <button part="button" @click=${this._handleClick}>
        <slot></slot>
      </button>
    `;
  }
}

// Avoid: Custom focusable div
@customElement('bad-button')
export class BadButton extends LitElement {
  override render() {
    return html`
      <div role="button" tabindex="0" @click=${this._handleClick} @keydown=${this._handleKeyDown}>
        <slot></slot>
      </div>
    `;
  }
}
```

**Always prefer native elements over custom focusable divs.** Native elements provide built-in keyboard handling, focus management, and screen reader support.

## Programmatic Focus Patterns

Programmatically moving focus is necessary for several accessibility patterns: form validation, modal dialogs, navigation changes, and focus restoration.

### Forwarding Focus to Internal Elements

Shadow DOM components must manually forward focus calls to internal focusable elements:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  @query('.field__input')
  private _input!: HTMLInputElement;

  /** Moves focus to the input element. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }
}
```

**Usage:**

```javascript
const input = document.querySelector('hx-text-input');
input.focus(); // Focus moves to internal <input>
```

### The `FocusOptions` API

The `focus()` method accepts an optional `FocusOptions` object:

```typescript
interface FocusOptions {
  preventScroll?: boolean; // If true, don't scroll element into view
  focusVisible?: boolean; // (Experimental) Force focus indicator to show
}
```

**When to use `preventScroll: true`:**

- You're managing scroll position manually
- Focus is moving within a scrollable container
- You don't want the viewport to jump unexpectedly

**Example: Form validation without scroll jump**

```typescript
private _validateForm(): boolean {
  const inputs = this.shadowRoot!.querySelectorAll('hx-text-input');

  for (const input of inputs) {
    if (!input.checkValidity()) {
      // Focus without scrolling
      input.focus({ preventScroll: true });

      // Smooth scroll to the invalid input
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return false;
    }
  }

  return true;
}
```

### Checking Current Focus

To determine which element currently has focus:

```javascript
// Active element in the main document
const activeElement = document.activeElement;

// Active element inside a shadow root
const shadowRoot = customElement.shadowRoot;
const activeInShadow = shadowRoot?.activeElement;
```

**Important:** `document.activeElement` returns the shadow host when focus is inside shadow DOM. To find the actual focused element, you must traverse into the shadow root:

```javascript
function getDeepActiveElement() {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}
```

### Focus After Asynchronous Operations

When focus must move after an asynchronous operation (e.g., API call, animation), wait for the target element to render before focusing:

```typescript
private async _handleSubmit(): Promise<void> {
  // Perform submission
  await this._saveData();

  // Show success message
  this.showSuccess = true;

  // Wait for render
  await this.updateComplete;

  // Allow browser paint
  await new Promise(resolve => setTimeout(resolve, 0));

  // Now focus the success message
  const message = this.shadowRoot!.querySelector('.success-message');
  if (message instanceof HTMLElement) {
    message.tabIndex = -1;
    message.focus();
  }
}
```

### When to Move Focus Programmatically

**Move focus after:**

- **Modal opens** — Focus first interactive element or modal container
- **Modal closes** — Return focus to element that opened the modal
- **Item deleted** — Move to next item, previous item, or parent container
- **Error validation** — Focus first invalid field
- **Dynamic content loaded** — Focus meaningful heading or first interactive element
- **Search results appear** — Focus results heading or first result
- **Wizard advances** — Focus first field in next step
- **Inline edit completes** — Return focus to the edited element

**Don't move focus after:**

- **Dropdown opens** — Let user continue interacting with trigger (unless via keyboard)
- **Tooltip shows** — Tooltips are supplementary, not interactive
- **Notification appears** — Use `role="alert"` and `aria-live` instead
- **Background operations** — Don't disrupt user's current focus context
- **Inline edits save** — Return focus naturally to saved element

## Focus Trap Implementation

[A focus trap restricts keyboard navigation to a specific set of elements](https://okenlabs.com/blog/accessibility-implementing-focus-traps/), commonly used in modal dialogs, dropdown menus, and overlays.

### When to Use Focus Traps

**Use focus traps for:**

- Modal dialogs that block interaction with the rest of the page
- Fullscreen overlays that obscure all underlying content
- Lightboxes and image galleries
- Cookie consent banners that block interaction until dismissed

**Don't use focus traps for:**

- Non-modal dialogs (users can interact with background)
- Dropdown menus (users can tab away to other controls)
- Tooltips and popovers (supplementary, non-blocking)
- Toasts and alerts (non-interactive notifications)

### Native `<dialog>` Element

[Modern browsers provide built-in focus trapping via the native `<dialog>` element](https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/):

```html
<dialog id="my-dialog">
  <h2>Confirm Action</h2>
  <p>Are you sure you want to delete this item?</p>
  <button id="cancel">Cancel</button>
  <button id="confirm">Confirm</button>
</dialog>

<script>
  const dialog = document.getElementById('my-dialog');
  const trigger = document.getElementById('open-button');

  // Open dialog (built-in focus trap activates)
  trigger.addEventListener('click', () => {
    dialog.showModal(); // Not just .show() — must use .showModal()
  });

  // Close dialog (built-in focus restoration)
  document.getElementById('cancel').addEventListener('click', () => {
    dialog.close();
  });
</script>
```

**Benefits of `<dialog>`:**

- Built-in focus trap (no library needed)
- Automatic focus restoration to trigger element
- Native keyboard support (Escape key closes)
- Backdrop pseudo-element (`::backdrop`) for overlay styling
- `aria-modal="true"` semantics automatically applied

**When to use `<dialog>`:**

- You're building a new modal dialog component from scratch
- You can support modern browsers (Safari 15.4+, Chrome 37+, Firefox 98+)
- You need a simple, standards-based solution

### Manual Focus Trap Implementation

For custom components or broader browser support, [implement focus trapping manually](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/):

```typescript
@customElement('hx-modal')
export class HelixModal extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  private _triggerElement: HTMLElement | null = null;
  private _previouslyFocused: Element | null = null;

  @query('.modal')
  private _modal!: HTMLElement;

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      if (this.open) {
        this._openModal();
      } else {
        this._closeModal();
      }
    }
  }

  private _openModal(): void {
    // Save currently focused element
    this._previouslyFocused = document.activeElement;

    // Save trigger element for focus restoration
    if (this._previouslyFocused instanceof HTMLElement) {
      this._triggerElement = this._previouslyFocused;
    }

    // Move focus to first focusable element in modal
    this.updateComplete.then(() => {
      const firstFocusable = this._getFirstFocusableElement();
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        // No focusable elements, focus the modal itself
        this._modal.tabIndex = -1;
        this._modal.focus();
      }
    });

    // Listen for keydown to trap focus
    document.addEventListener('keydown', this._handleKeyDown);
  }

  private _closeModal(): void {
    // Remove keydown listener
    document.removeEventListener('keydown', this._handleKeyDown);

    // Restore focus to trigger element
    if (this._triggerElement) {
      this._triggerElement.focus();
    }

    // Clear references
    this._triggerElement = null;
    this._previouslyFocused = null;
  }

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.open) return;

    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      this.open = false;
      this.dispatchEvent(new CustomEvent('hx-modal-close'));
      return;
    }

    // Trap focus on Tab
    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  };

  private _trapFocus(e: KeyboardEvent): void {
    const focusableElements = this._getFocusableElements();

    if (focusableElements.length === 0) {
      // No focusable elements, prevent tabbing
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  private _getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(this._modal.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      // Filter out hidden elements
      return el.offsetParent !== null;
    });
  }

  private _getFirstFocusableElement(): HTMLElement | null {
    const elements = this._getFocusableElements();
    return elements.length > 0 ? elements[0] : null;
  }

  override render() {
    if (!this.open) return nothing;

    return html`
      <div class="modal-backdrop" @click=${this._handleBackdropClick} role="presentation">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 id="modal-title"><slot name="title">Modal Title</slot></h2>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer">
              <hx-button @click=${this._handleClose}>Close</hx-button>
            </slot>
          </div>
        </div>
      </div>
    `;
  }

  private _handleBackdropClick(e: MouseEvent): void {
    // Close modal if backdrop (not modal content) is clicked
    if (e.target === e.currentTarget) {
      this.open = false;
    }
  }

  private _handleClose(): void {
    this.open = false;
    this.dispatchEvent(new CustomEvent('hx-modal-close'));
  }
}
```

**Key implementation details:**

1. **Save `document.activeElement` on open** — This is the trigger element
2. **Focus first interactive element** — Or modal container if no interactive elements
3. **Listen for Tab/Shift+Tab** — Intercept and wrap focus at boundaries
4. **Listen for Escape** — Close modal and dispatch event
5. **Restore focus on close** — Return to saved trigger element
6. **Remove event listeners** — Prevent memory leaks when modal closes

### Focus Trap Libraries

For complex focus trapping scenarios, consider using [a specialized library](https://github.com/focus-trap/focus-trap) that handles edge cases:

- **[focus-trap](https://github.com/focus-trap/focus-trap)** — Lightweight, framework-agnostic focus trap utility
- **[@a11y/focus-trap](https://www.webcomponents.org/element/@a11y/focus-trap)** — Web component that pierces shadow roots

## Focus Restoration After Dialogs

[Focus restoration returns focus to the previously focused element](https://accessibility.huit.harvard.edu/technique-accessible-modal-dialogs) after a modal closes, a dropdown dismisses, or navigation changes occur.

### Why Focus Restoration Matters

[Without focus restoration](https://medium.com/@alexdev82/stop-breaking-modal-accessibility-the-focus-management-mistake-90-of-devs-make-9605bad927e2):

- **Keyboard users lose their place** — Focus jumps to the top of the page or disappears entirely
- **Screen reader users are disoriented** — They must navigate back to where they were
- **Workflow is disrupted** — Users must re-find the button that opened the modal
- **Millions of users affected daily** — Including those with motor disabilities, vision impairments, or personal preference

Focus restoration maintains context and ensures a seamless user experience.

### Basic Focus Restoration Pattern

[Store the previously focused element before opening a modal, then restore focus when closing](https://adrianroselli.com/2020/10/dialog-focus-in-screen-readers.html):

```typescript
@customElement('hx-modal')
export class HelixModal extends LitElement {
  private _previousFocus?: HTMLElement;

  open() {
    // Store currently focused element
    this._previousFocus = document.activeElement as HTMLElement;

    // Open modal and move focus inside
    this.isOpen = true;
    this.updateComplete.then(() => {
      this._firstFocusable?.focus();
    });
  }

  close() {
    this.isOpen = false;

    // Restore focus to previous element
    this.updateComplete.then(() => {
      this._previousFocus?.focus();
    });
  }
}
```

### Handling Deep Shadow DOM Focus

When the previously focused element is inside shadow DOM, you must traverse the shadow tree to find the actual element:

```typescript
private _storePreviousFocus() {
  let active: Element | null = document.activeElement;

  // Traverse into shadow DOM if needed
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  this._previousFocus = active as HTMLElement;
}
```

### Focus Restoration After Deletion

[When deleting an item, move focus to the next item, previous item, or parent container](https://accessibleweb.com/question-answer/after-closing-exposed-content-should-focus-return-to-the-ui-component-that-exposed-it/):

```typescript
@customElement('hx-list')
export class HelixList extends LitElement {
  @property({ type: Array })
  items: Array<{ id: string; label: string }> = [];

  private _handleDelete(index: number): void {
    // Remove the item
    this.items.splice(index, 1);
    this.requestUpdate();

    // After render, restore focus to a logical location
    this.updateComplete.then(() => {
      // Try to focus the item that took the deleted item's place
      if (this.items[index]) {
        this._focusItem(index);
      }
      // Otherwise, focus the previous item
      else if (this.items[index - 1]) {
        this._focusItem(index - 1);
      }
      // If no items left, focus the list container
      else {
        const container = this.shadowRoot!.querySelector('.list');
        if (container instanceof HTMLElement) {
          container.tabIndex = -1;
          container.focus();
        }
      }
    });
  }

  private _focusItem(index: number): void {
    const item = this.shadowRoot!.querySelector(`[data-index="${index}"] button`);
    if (item instanceof HTMLElement) {
      item.focus();
    }
  }

  override render() {
    return html`
      <ul class="list" role="list">
        ${this.items.map(
          (item, index) => html`
            <li data-index=${index} role="listitem">
              <span>${item.label}</span>
              <button @click=${() => this._handleDelete(index)} aria-label="Delete ${item.label}">
                Delete
              </button>
            </li>
          `,
        )}
      </ul>
    `;
  }
}
```

### Scroll Position Restoration

When restoring focus, you may want to prevent the browser from scrolling:

```typescript
close() {
  const scrollY = window.scrollY;

  this.isOpen = false;
  this.updateComplete.then(() => {
    this._previousFocus?.focus({ preventScroll: true });
    window.scrollTo(0, scrollY);
  });
}
```

## Helix Focus Patterns

### hx-text-input Focus Management

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  @query('.field__input')
  private _input!: HTMLInputElement;

  /** Moves focus to the input element. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  /** Selects all text in the input. */
  select(): void {
    this._input?.select();
  }

  override render() {
    return html`
      <div part="field">
        <label part="label" for=${this._inputId}> ${this.label} </label>

        <input
          part="input"
          id=${this._inputId}
          type=${this.type}
          .value=${live(this.value)}
          ?disabled=${this.disabled}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${this._errorId}
          @input=${this._handleInput}
        />

        <div id=${this._errorId} role="alert" aria-live="polite">${this.error}</div>
      </div>
    `;
  }
}
```

**Key patterns:**

1. **Manual focus delegation** — `focus()` method forwards to internal `<input>`
2. **Label association** — Label and input are in the same shadow root with matching `for` and `id`
3. **Focus indicator** — Defined in component styles using `:focus-visible`
4. **Error announcement** — `role="alert"` announces errors to screen readers

### hx-select Focus Management

```typescript
@customElement('hx-select')
export class HelixSelect extends LitElement {
  @query('.field__select')
  private _select!: HTMLSelectElement;

  /** Moves focus to the select element. */
  override focus(options?: FocusOptions): void {
    this._select?.focus(options);
  }

  override render() {
    return html`
      <div part="field">
        <label part="label" for=${this._selectId}> ${this.label} </label>

        <select
          part="select"
          id=${this._selectId}
          ?disabled=${this.disabled}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${this._errorId}
          @change=${this._handleChange}
        >
          ${this.placeholder
            ? html`<option value="" disabled selected>${this.placeholder}</option>`
            : nothing}
          <!-- Options cloned from light DOM -->
        </select>
      </div>
    `;
  }
}
```

### hx-button Focus Management

```typescript
@customElement('hx-button')
export class HelixButton extends LitElement {
  // No explicit focus() method needed — native button handles focus

  override render() {
    return html`
      <button
        part="button"
        ?disabled=${this.disabled}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

**Note:** `hx-button` doesn't need a custom `focus()` method because the native `<button>` is the only element in the shadow DOM and handles focus automatically.

## Best Practices

### Do

- **Always provide a `focus()` method** for form components that forwards focus to the internal control
- **Use native focusable elements** (`<button>`, `<input>`, `<select>`) instead of `<div role="button">`
- **Test keyboard navigation** — Tab through all interactive elements in natural order
- **Implement `:focus-visible`** for all interactive elements inside shadow DOM
- **Restore focus** after modals close or navigation occurs
- **Use `tabindex="-1"`** for programmatic focus on non-interactive elements (headings, alerts)
- **Keep labels and form controls in the same shadow root** to ensure proper association
- **Use `aria-describedby`** to link error messages to form controls
- **Test with screen readers** (VoiceOver, NVDA, JAWS) to verify focus announcements
- **Wait for `this.updateComplete`** before moving focus after state changes

### Don't

- **Don't use positive `tabindex` values** (e.g., `tabindex="1"`) — they break natural focus order
- **Don't make non-interactive elements focusable** without adding appropriate ARIA roles
- **Don't remove focus indicators** — they're required for WCAG 2.1 AA compliance
- **Don't trap focus indefinitely** — always provide an Escape key handler to exit focus traps
- **Don't assume `delegatesFocus` solves all focus problems** — manual delegation provides more control
- **Don't forget to test across shadow boundaries** — focus behavior changes when shadow DOM is involved
- **Don't use `outline: none`** without providing an alternative focus indicator
- **Don't move focus unexpectedly** — focus changes should be intentional and announced to screen readers
- **Don't restore focus to disabled elements** — they can't receive focus

## Testing Focus Management

### Manual Testing

1. **Keyboard-only navigation** — Disconnect your mouse and navigate using only the keyboard:
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Ensure focus order matches visual layout
   - Test Escape key to close modals and dismiss dropdowns

2. **Screen reader testing**:
   - **macOS:** VoiceOver (Cmd+F5 to toggle)
   - **Windows:** NVDA (free, open source)
   - **Windows:** JAWS (paid, enterprise standard)
   - Verify focus announcements include element type, label, and state

3. **Browser DevTools**:
   - Inspect shadow DOM to verify focus indicators are applied
   - Use "Inspect Accessibility Properties" to see computed ARIA attributes
   - Check contrast ratios for focus indicators (minimum 3:1)

### Automated Testing

Helix uses Vitest browser mode for automated focus management testing:

```typescript
import { expect, test } from 'vitest';
import { fixture } from '../../test-utils.js';
import './hx-text-input.js';

test('focus() moves focus to internal input', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input label="Email"></hx-text-input>');

  const internalInput = el.shadowRoot!.querySelector('input')!;

  // Focus the custom element
  el.focus();

  // Verify internal input received focus
  expect(document.activeElement).toBe(el);
  expect(el.shadowRoot!.activeElement).toBe(internalInput);
});

test('restores focus after modal closes', async () => {
  const trigger = await fixture<HTMLButtonElement>('<button id="trigger">Open Modal</button>');

  const modal = await fixture<HelixModal>(
    '<hx-modal><button slot="footer" id="close">Close</button></hx-modal>',
  );

  // Focus trigger and open modal
  trigger.focus();
  modal.open = true;
  await modal.updateComplete;

  // Verify focus moved into modal
  expect(document.activeElement).not.toBe(trigger);

  // Close modal
  modal.open = false;
  await modal.updateComplete;

  // Verify focus returned to trigger
  expect(document.activeElement).toBe(trigger);
});
```

## Summary

Focus management is essential for accessible web components. Key patterns in Helix:

- **Focus delegation** — Manual `.focus()` methods forward focus to internal elements
- **Programmatic focus** — Move focus after validation, modals, deletion, and navigation
- **Focus traps** — Confine focus within modal dialogs (prefer native `<dialog>`)
- **Focus restoration** — Save and restore focus when closing overlays
- **Focus indicators** — Use `:focus-visible` with high-contrast design tokens
- **Testing** — Manual keyboard testing, automated tests, screen reader validation

By implementing these patterns consistently, Helix components ensure keyboard and assistive technology users can navigate healthcare applications efficiently and predictably.

## Sources

### Web Standards

- [ShadowRoot: delegatesFocus property - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/delegatesFocus)
- [WICG: delegatesFocus Proposal](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/ShadowRoot-delegatesFocus-Proposal.md)
- [Can I focus an element in shadow DOM programmatically? - Manuel Matuzovic](https://www.matuzo.at/blog/2023/web-components-accessibility-faq/can-I-focus-an-element)

### WCAG Success Criteria

- [WCAG 2.1 SC 2.4.3: Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html)
- [WCAG 2.1 SC 2.4.7: Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html)
- [WCAG 2.1 SC 3.2.1: On Focus](https://www.w3.org/WAI/WCAG21/Understanding/on-focus.html)

### Focus Traps

- [Accessibility: Implementing Focus Traps - Oken Labs](https://okenlabs.com/blog/accessibility-implementing-focus-traps/)
- [How to Build Accessible Modals with Focus Traps | UXPin](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/)
- [GitHub - focus-trap/focus-trap](https://github.com/focus-trap/focus-trap)
- [There is No Need to Trap Focus on a Dialog Element | CSS-Tricks](https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/)

### Focus Restoration

- [Harvard: Accessible Modal Dialogs](https://accessibility.huit.harvard.edu/technique-accessible-modal-dialogs)
- [Adrian Roselli: Dialog Focus in Screen Readers](https://adrianroselli.com/2020/10/dialog-focus-in-screen-readers.html)
- [Medium: Stop Breaking Modal Accessibility](https://medium.com/@alexdev82/stop-breaking-modal-accessibility-the-focus-management-mistake-90-of-devs-make-9605bad927e2)
- [After Closing Exposed Content, Where Should Focus Return?](https://accessibleweb.com/question-answer/after-closing-exposed-content-should-focus-return-to-the-ui-component-that-exposed-it/)
