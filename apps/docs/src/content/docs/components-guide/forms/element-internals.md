---
title: Element Internals and Form Association
description: Build form-associated custom elements in HELiX using ElementInternals to participate in native HTML form submission and validation.
---

Web components can participate in native HTML forms just like built-in inputs — they contribute values to `FormData`, respond to `reset()`, support constraint validation, and integrate with `:invalid` / `:valid` CSS pseudo-classes. This is achieved through the `ElementInternals` API and the `formAssociated` static property.

## `static formAssociated = true`

Setting this static property on a class tells the browser that the element should be treated as a form-associated element:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override formAssociated = true;
  // ...
}
```

Without this, `attachInternals()` returns an object without the form-associated properties and the element is invisible to any surrounding `<form>`.

## `this.attachInternals()`

Call `this.attachInternals()` in the constructor to get the `ElementInternals` object. This object is the bridge between your component and the form it is associated with:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }
}
```

## Full Form-Associated Component Example

```typescript
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override formAssociated = true;

  static override styles = [
    css`
      :host {
        display: block;
      }

      label {
        display: block;
        font-size: var(--hx-font-size-sm);
        font-weight: var(--hx-font-weight-medium);
        color: var(--hx-color-neutral-700);
        margin-bottom: var(--hx-spacing-xs);
      }

      input {
        display: block;
        width: 100%;
        padding: var(--hx-spacing-sm) var(--hx-spacing-md);
        border: 1px solid var(--hx-color-neutral-300);
        border-radius: var(--hx-border-radius-sm);
        font-size: var(--hx-font-size-base);
        background: var(--hx-color-neutral-0);
        color: var(--hx-color-neutral-900);
      }

      :host(:invalid) input {
        border-color: var(--hx-color-error-500);
      }

      .error {
        margin-top: var(--hx-spacing-xs);
        font-size: var(--hx-font-size-xs);
        color: var(--hx-color-error-600);
      }
    `,
  ];

  @property({ type: String }) name = '';
  @property({ type: String }) value = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) required = false;

  @state() private _errorMessage = '';

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // Called when the element's value should be reset (form.reset())
  formResetCallback() {
    this.value = '';
    this._errorMessage = '';
    this._updateFormValue();
  }

  // Called when the browser wants to restore a previously saved state
  // (e.g., bfcache, autofill)
  formStateRestoreCallback(state: string, _mode: 'restore' | 'autocomplete') {
    this.value = state;
    this._updateFormValue();
  }

  private _updateFormValue() {
    this._internals.setFormValue(this.value);
    this._validate();
  }

  private _validate() {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        'This field is required.',
        this.shadowRoot?.querySelector('input') ?? undefined
      );
      this._errorMessage = 'This field is required.';
    } else {
      this._internals.setValidity({});
      this._errorMessage = '';
    }
  }

  private _handleInput(e: InputEvent) {
    this.value = (e.target as HTMLInputElement).value;
    this._updateFormValue();
  }

  override render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : nothing}
      <input
        .value=${this.value}
        ?required=${this.required}
        @input=${this._handleInput}
      />
      ${this._errorMessage
        ? html`<div class="error" role="alert">${this._errorMessage}</div>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-text-input': HelixTextInput;
  }
}
```

## `ElementInternals` API Reference

| Method / property | Purpose |
|---|---|
| `setFormValue(value, state?)` | Sets the element's contribution to `FormData`. `state` is an optional serialized state for `formStateRestoreCallback`. |
| `setValidity(flags, message?, anchor?)` | Sets the validity state. Pass `{}` to mark valid. Pass `{ valueMissing: true }` etc. with a message to mark invalid. |
| `checkValidity()` | Returns `true` if valid; fires `invalid` event and returns `false` if not. |
| `reportValidity()` | Like `checkValidity()` but also shows the browser's validation UI tooltip. |
| `validity` | Read-only `ValidityState` object. |
| `validationMessage` | The current validation message string. |
| `form` | The associated `<form>` element, or `null`. |
| `labels` | A `NodeList` of `<label>` elements that reference this element. |

## How the Component Participates in Form Submission

When the user submits a form, the browser iterates over all form-associated elements and calls their contribution to `FormData`. A `hx-text-input` with `name="username"` and a value set via `setFormValue('alice')` results in `username=alice` in the submitted data — exactly like a native `<input name="username" value="alice">`.

```html
<form id="signup-form" method="post" action="/signup">
  <hx-text-input name="username" label="Username" required></hx-text-input>
  <hx-text-input name="email" label="Email" required></hx-text-input>
  <button type="submit">Sign Up</button>
</form>
```

```javascript
document.getElementById('signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  console.log(data.get('username')); // 'alice'
  console.log(data.get('email'));    // 'alice@example.com'
});
```

## Next Steps

- [Form Validation](/components-guide/forms/validation/) — constraint validation flags in detail
- [Form Association Patterns](/components-guide/forms/form-association/) — `name`, `value`, and complex controls
- [Form Accessibility](/components-guide/forms/accessibility/) — connecting ARIA roles and labels
