---
title: Custom Validity
description: Show custom validation error messages, implement async validation, and style invalid states in HELiX form controls.
---

The native Constraint Validation API covers most common validation scenarios through built-in validity flags. When your requirements go beyond the built-in flags — uniqueness checks, cross-field validation, server-side rules — `customError` lets you integrate any validation logic into the same native system.

## Setting a Custom Error Message

Use `setValidity({ customError: true }, message, anchor)` to put the element into an invalid state with a message of your choosing:

```typescript
private _validate() {
  const value = this.value.trim();

  // Clear any previous custom error
  if (this._internals.validity.customError) {
    this._internals.setValidity({});
  }

  if (!value) {
    this._internals.setValidity(
      { valueMissing: true },
      'This field is required.',
      this._input
    );
    return;
  }

  if (value.length < 8) {
    this._internals.setValidity(
      { tooShort: true },
      'Password must be at least 8 characters.',
      this._input
    );
    return;
  }

  if (!/[A-Z]/.test(value)) {
    this._internals.setValidity(
      { customError: true },
      'Password must contain at least one uppercase letter.',
      this._input
    );
    return;
  }

  // All valid — clear the validity state
  this._internals.setValidity({});
}
```

Calling `setValidity({})` (empty object) marks the element as valid and clears the validation message.

## `reportValidity()` — Showing the Browser Tooltip

`checkValidity()` checks validity silently. `reportValidity()` additionally triggers the browser's native validation UI, which displays a tooltip anchored to the element you passed as the third argument to `setValidity()`:

```typescript
// User clicks Submit — show all errors
private _handleSubmit(e: Event) {
  e.preventDefault();
  this._validate();

  if (!this._internals.reportValidity()) {
    // reportValidity() returned false — browser showed the error tooltip
    return;
  }

  // Valid — proceed
  this._submitData();
}
```

## Styling Invalid State with `:host(:invalid)`

The `:invalid` CSS pseudo-class is applied to the host element automatically when `setValidity` has any flag set to `true`. Style both the control and any error display:

```typescript
static override styles = [
  css`
    :host {
      display: block;
    }

    .input-wrapper {
      position: relative;
    }

    input {
      width: 100%;
      padding: var(--hx-spacing-sm) var(--hx-spacing-md);
      border: 1px solid var(--hx-color-neutral-300);
      border-radius: var(--hx-border-radius-sm);
      font-size: var(--hx-font-size-base);
      background: var(--hx-color-neutral-0);
      transition: border-color var(--hx-motion-duration-fast),
                  box-shadow var(--hx-motion-duration-fast);
    }

    input:focus {
      outline: none;
      border-color: var(--hx-color-primary-500);
      box-shadow: 0 0 0 2px var(--hx-color-primary-100);
    }

    /* Invalid state — applied by the browser via ElementInternals */
    :host(:invalid) input {
      border-color: var(--hx-color-error-500);
      background: var(--hx-color-error-50);
    }

    :host(:invalid) input:focus {
      box-shadow: 0 0 0 2px var(--hx-color-error-100);
    }

    .error-message {
      display: none;
      margin-top: var(--hx-spacing-xs);
      font-size: var(--hx-font-size-xs);
      color: var(--hx-color-error-600);
    }

    :host(:invalid) .error-message {
      display: block;
    }
  `,
];
```

## Showing a Custom Error Message in the Template

Rather than relying solely on the browser tooltip, render the error message in your own template. Read `this._internals.validationMessage` to get the current message:

```typescript
@state() private _errorMessage = '';

private _validate() {
  // ... validity logic ...

  // Keep a local copy for the template
  this._errorMessage = this._internals.validationMessage;
}

override render() {
  return html`
    <label>${this.label}</label>
    <input
      .value=${this.value}
      aria-invalid=${this._internals.validity.valid ? 'false' : 'true'}
      aria-describedby=${this._errorMessage ? 'error-msg' : nothing}
      @input=${this._handleInput}
    />
    ${this._errorMessage
      ? html`
          <div id="error-msg" role="alert" class="error-message">
            ${this._errorMessage}
          </div>
        `
      : nothing}
  `;
}
```

The `role="alert"` on the error container causes screen readers to announce the message as soon as it appears.

## Async Validation Pattern

For server-side checks (username uniqueness, coupon code validation), run async validation after a debounce:

```typescript
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-username-input')
export class HelixUsernameInput extends LitElement {
  static override formAssociated = true;

  // ... styles, internals setup ...

  @property({ type: String }) value = '';
  @state() private _checking = false;
  @state() private _errorMessage = '';

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private _handleInput(e: InputEvent) {
    this.value = (e.target as HTMLInputElement).value;
    this._internals.setFormValue(this.value);
    this._scheduleValidation();
  }

  private _scheduleValidation() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this._validateAsync(), 400);
  }

  private async _validateAsync() {
    if (!this.value) {
      this._internals.setValidity({ valueMissing: true }, 'Username is required.');
      this._errorMessage = 'Username is required.';
      return;
    }

    this._checking = true;

    try {
      const response = await fetch(`/api/check-username?value=${encodeURIComponent(this.value)}`);
      const { available } = await response.json();

      if (!available) {
        this._internals.setValidity(
          { customError: true },
          'This username is already taken.',
          this._input
        );
        this._errorMessage = 'This username is already taken.';
      } else {
        this._internals.setValidity({});
        this._errorMessage = '';
      }
    } finally {
      this._checking = false;
    }
  }

  // ...render with loading indicator and error display...
}
```

## Integration with Design System Error States

When the design system has a formal error state (color, icon, border), tie it to the `_internals.validity.valid` state rather than a separate `error` property:

```typescript
override render() {
  const isInvalid = !this._internals.validity.valid;

  return html`
    <div class="field ${isInvalid ? 'field--error' : ''}">
      <label>${this.label}</label>
      <input .value=${this.value} @input=${this._handleInput} />
      ${isInvalid
        ? html`<span class="field__error-icon" aria-hidden="true">⚠</span>`
        : nothing}
      ${this._errorMessage
        ? html`<div class="field__error" role="alert">${this._errorMessage}</div>`
        : nothing}
    </div>
  `;
}
```

## Next Steps

- [Form Validation](/components-guide/forms/validation/) — built-in validity flags and `setValidity()`
- [Form Accessibility](/components-guide/forms/accessibility/) — `aria-invalid` and live region announcements
- [Submit Handling](/components-guide/forms/submit-handling/) — validating all controls before submit
