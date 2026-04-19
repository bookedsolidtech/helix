---
title: Form Accessibility
description: Build accessible form controls in HELiX using ARIA roles, ElementInternals ARIA reflection, and accessible-label forwarding to shadow-DOM targets.
---

Form controls must be accessible to users of assistive technologies. Shadow DOM creates unique challenges: ARIA relationships that reference element IDs (like `aria-labelledby`) and focus management both need special handling when elements live in different shadow roots.

## ARIA Roles for Form Controls

Assign the correct ARIA role to the shadow root's interactive element. Roles describe the control's semantic meaning to assistive technologies:

| Control type | ARIA role | Example tag |
|---|---|---|
| Text input | `textbox` | `<input type="text">` (native, no role needed) |
| Checkbox | `checkbox` | Custom element needs `role="checkbox"` |
| Radio button | `radio` | Custom element needs `role="radio"` |
| Combobox / select | `combobox` | Custom element needs `role="combobox"` |
| Switch | `switch` | Custom element needs `role="switch"` |
| Slider | `slider` | Custom element needs `role="slider"` |

When you render a native `<input>`, `<select>`, or `<textarea>` inside the shadow root, the native element already carries the correct implicit role — no additional `role` attribute is needed.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Native input — implicit textbox role, no extra role needed
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override styles = css`:host { display: block; }`;

  override render() {
    return html`<input type="text" />`;
  }
}

// Custom checkbox — must explicitly set role
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property({ type: Boolean }) checked = false;

  override render() {
    return html`
      <div
        role="checkbox"
        aria-checked=${this.checked}
        tabindex="0"
        @click=${this._toggle}
        @keydown=${this._handleKeydown}
      >
        <slot></slot>
      </div>
    `;
  }

  private _toggle() {
    this.checked = !this.checked;
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._toggle();
    }
  }
}
```

## `aria-label`, `aria-labelledby`, `aria-describedby`

These attributes connect controls to their accessible names and descriptions.

**`aria-label`** — sets an accessible name directly as a string:
```html
<hx-text-input accessible-label="Search products"></hx-text-input>
```

**`aria-labelledby`** — points to the ID of a visible label element. Works for elements in the same DOM scope; cross-shadow-DOM references need either `aria-labelledby` on an element that shares a DOM scope with the label, or forwarding via `ElementInternals.ariaLabelledByElements` on the custom element (see [Forwarding Host ARIA](#forwarding-host-aria-to-shadow-elements) below):
```html
<label id="city-label">City</label>
<hx-text-input aria-labelledby="city-label"></hx-text-input>
```

**`aria-describedby`** — points to supporting description text (hint, character count, error):
```html
<hx-text-input aria-describedby="username-hint"></hx-text-input>
<div id="username-hint">Must be 3–20 characters. Letters and numbers only.</div>
```

## State Attributes

Update ARIA state attributes when the control's state changes:

```typescript
override render() {
  return html`
    <input
      type="text"
      ?required=${this.required}
      aria-required=${this.required ? 'true' : 'false'}
      aria-invalid=${this._hasError ? 'true' : 'false'}
      aria-disabled=${this.disabled ? 'true' : 'false'}
      ?disabled=${this.disabled}
    />
  `;
}
```

| State | ARIA attribute | Values |
|---|---|---|
| Required | `aria-required` | `"true"` / `"false"` |
| Invalid | `aria-invalid` | `"true"` / `"false"` / `"grammar"` / `"spelling"` |
| Disabled | `aria-disabled` | `"true"` / `"false"` (also use the `disabled` property) |
| Expanded (combobox) | `aria-expanded` | `"true"` / `"false"` |
| Checked | `aria-checked` | `"true"` / `"false"` / `"mixed"` |

## `ElementInternals.ariaLabel` vs Attribute

`ElementInternals` exposes ARIA reflection properties that set ARIA semantics on the element's internal accessibility object directly, bypassing the attribute-to-shadow-root forwarding problem:

```typescript
private _internals: ElementInternals;

constructor() {
  super();
  this._internals = this.attachInternals();
}

// Set ARIA properties via internals — they apply to the host element
// in the accessibility tree without needing to forward attributes
override connectedCallback() {
  super.connectedCallback();
  this._internals.role = 'textbox';
  this._internals.ariaLabel = this.label;
  this._internals.ariaRequired = this.required ? 'true' : 'false';
}
```

Using `ElementInternals` ARIA properties is preferable to adding ARIA attributes to the shadow root's container element because it attaches semantics at the correct level of the accessibility tree.

## Forwarding Host ARIA to Shadow Elements

The standard challenge: a consumer writes `<hx-text-input accessible-label="Patient last name">`, but an attribute placed on the host custom element does not automatically reach the `<input>` inside the shadow root — assistive technology would see it on the wrong element.

HELiX handles this in one of two ways, depending on the component:

1. **Components that document `accessible-label`.** Form controls and composite widgets — `hx-text-input`, `hx-textarea`, `hx-select`, `hx-combobox`, `hx-split-button`, `hx-steps`, `hx-action-bar` — expose a public `accessible-label` attribute (property: `accessibleLabel`) and forward it to the inner interactive element via `ElementInternals.ariaLabel` or a template binding. Every component page lists its public attributes; use `accessible-label` only on components that document it.
2. **Components that accept native `aria-label`.** Most other HELiX components (including `hx-button`) read `this.ariaLabel` / `this.ariaLabelledBy` from the standard HTML attributes and forward those to the inner element. For these, use the native attribute:

   ```html
   <hx-button aria-label="Close dialog">X</hx-button>
   ```

The following LitElement pattern illustrates the `accessible-label` forwarding approach used in category (1):

```typescript
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-custom-input')
export class MyCustomInput extends LitElement {
  static override styles = css`:host { display: inline-flex; }`;

  @property({ attribute: 'accessible-label' }) accessibleLabel = '';

  override render() {
    return html`
      <input aria-label=${this.accessibleLabel || nothing} />
    `;
  }
}
```

Consumer usage:

```html
<!-- accessible-label is a public host attribute on components that document it. -->
<hx-text-input accessible-label="Patient last name" placeholder="Last name"></hx-text-input>
```

For built-in HELiX components that accept additional ARIA state (`aria-expanded`, `aria-controls`), the component documents the specific attributes it forwards. When building your own custom elements, prefer `ElementInternals.ariaExpanded` / `ariaControls` or explicit template bindings — the internal attribute-level forwarding helper used by HELiX components is not part of the public API.

## Connecting Visible Labels to Custom Controls

When a visible `<label>` element is in the light DOM and the control is a custom element, use `ElementInternals.labels` to read associated labels, or use `aria-labelledby` with the label's ID:

```html
<label for="my-input">Email address</label>
<hx-text-input id="my-input" name="email"></hx-text-input>
```

The browser connects the label to the custom element via the `for` / `id` association. Inside the component, `this._internals.labels` returns a `NodeList` containing that label element. This works without any special forwarding.

## Next Steps

- [Element Internals and Form Association](/components-guide/forms/element-internals/) — `attachInternals()` and `setFormValue()`
- [Form Validation](/components-guide/forms/validation/) — `setValidity()` and constraint validation
- [Event Delegation](/components-guide/events/delegation/) — `delegatesFocus` and ARIA forwarding patterns
