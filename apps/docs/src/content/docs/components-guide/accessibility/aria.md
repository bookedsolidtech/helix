---
title: ARIA in Web Components
description: Apply ARIA roles, states, and properties correctly inside shadow DOM, including the mixinDelegatesAria pattern used by HELiX.
---

Accessible Rich Internet Applications (ARIA) attributes provide semantic information to assistive technology. Web components present unique challenges because shadow DOM boundaries can block AT from reading attributes on the host element. This page explains HELiX's approach.

## ARIA Roles

Assign a role to the inner interactive element inside the shadow root, not to the host:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-switch')
export class HelixSwitch extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false;

  override render() {
    return html`
      <button
        role="switch"
        aria-checked=${this.checked ? 'true' : 'false'}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  private _handleClick() {
    this.checked = !this.checked;
    this.dispatchEvent(new CustomEvent('hx-change', {
      detail: { checked: this.checked },
      bubbles: true,
      composed: true,
    }));
  }
}
```

Common ARIA roles used in HELiX components:

| Role | Component | Notes |
|---|---|---|
| `button` | `hx-button` (anchor mode), `hx-toggle-button` | Redundant when `<button>` is used, necessary on `<a>` acting as button |
| `switch` | `hx-switch` | Boolean state; use `aria-checked` |
| `dialog` | `hx-dialog`, `hx-drawer` | Requires `aria-modal="true"` and accessible name |
| `alertdialog` | `hx-dialog` (destructive) | Announces immediately; use for confirmations |
| `listbox` | `hx-select`, `hx-combobox` | Contains `option` elements |
| `combobox` | `hx-combobox` input | Associates with listbox via `aria-controls` |
| `progressbar` | `hx-progress-bar` | Use `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| `tab`, `tablist`, `tabpanel` | `hx-tabs` | Full tab pattern with keyboard navigation |

## `aria-label`, `aria-labelledby`, `aria-describedby`

Provide an accessible name for unlabeled interactive elements:

```typescript
// aria-label on the host — delegate to the inner button
html`
  <button aria-label=${ifDefined(this.ariaLabel ?? undefined)}>
    <slot></slot>
  </button>
`
```

`aria-labelledby` references another element by ID:

```typescript
html`
  <div id="dialog-title">Confirm Delete</div>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    ...
  </div>
`
```

`aria-describedby` connects additional context (error messages, help text):

```typescript
html`
  <input
    aria-describedby=${this._errorId || nothing}
    aria-invalid=${this.invalid ? 'true' : nothing}
  />
  ${this.errorMessage
    ? html`<span id=${this._errorId}>${this.errorMessage}</span>`
    : nothing}
`
```

## State Attributes

| Attribute | Type | Usage |
|---|---|---|
| `aria-expanded` | `'true' \| 'false'` | Disclosure widgets: dropdowns, accordions, menus |
| `aria-controls` | element ID | Links trigger to controlled region |
| `aria-haspopup` | `'true' \| 'listbox' \| 'menu' \| 'dialog'` | Announces popup type to AT |
| `aria-checked` | `'true' \| 'false' \| 'mixed'` | Checkboxes, switches, radio buttons |
| `aria-disabled` | `'true'` | Use on `<a>` elements; native `disabled` is sufficient on `<button>` |
| `aria-busy` | `'true'` | Loading state; screen reader waits for update |
| `aria-live` | `'polite' \| 'assertive'` | Dynamic content announcements |

## `aria-expanded` Pattern

```typescript
@property({ type: Boolean, reflect: true })
open = false;

override render() {
  return html`
    <button
      aria-expanded=${this.open ? 'true' : 'false'}
      aria-controls="panel"
      @click=${() => { this.open = !this.open; }}
    >
      Toggle
    </button>
    <div id="panel" ?hidden=${!this.open}>
      <slot></slot>
    </div>
  `;
}
```

## Accessibility Object Model and `ElementInternals`

`ElementInternals` allows a custom element to participate in the accessibility tree using the Accessibility Object Model (AOM). This is the correct way to set ARIA properties on form-associated and fully encapsulated components:

```typescript
export class HelixCheckbox extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: Boolean, reflect: true })
  checked = false;

  protected override updated() {
    // AOM: set ARIA state via ElementInternals
    this._internals.ariaChecked = String(this.checked);
    this._internals.setFormValue(this.checked ? 'on' : null);
  }
}
```

## `mixinDelegatesAria` Pattern

HELiX components use the `mixinDelegatesAria` mixin to forward `aria-*` attributes set on the host element down to the inner interactive element. This solves the shadow-boundary problem where AT cannot read host attributes if the element's accessible name comes from inside the shadow root:

```typescript
import { mixinDelegatesAria } from '../../mixins/index.js';

@customElement('hx-button')
export class HelixButton extends mixinDelegatesAria(LitElement) {
  override render() {
    return html`
      <button
        aria-label=${ifDefined(this.ariaLabel ?? undefined)}
        aria-describedby=${ifDefined(this.ariaDescribedby ?? undefined)}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

With this pattern, consumers can write:

```html
<hx-button aria-label="Close dialog">X</hx-button>
```

And the `aria-label` will be reflected onto the inner `<button>`.

## `aria-live` for Dynamic Content

Live regions announce content changes to screen readers without moving focus:

```typescript
html`
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    ${this.statusMessage}
  </div>
`
```

- `aria-live="polite"` — waits for the user to finish what they are doing before announcing
- `aria-live="assertive"` — interrupts immediately; use only for critical errors
- `aria-atomic="true"` — reads the entire region contents on any change

## Next Steps

- [Keyboard Navigation](/components-guide/accessibility/keyboard/) — focus and key handling
- [Focus Management](/components-guide/accessibility/focus-management/) — `delegatesFocus` and focus traps
- [Screen Reader Support](/components-guide/accessibility/screen-readers/) — live regions and AT testing
