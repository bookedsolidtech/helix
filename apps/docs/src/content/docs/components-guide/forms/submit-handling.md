---
title: Form Submit Handling
description: Read form-associated component values at submit time, handle the formdata event, manage reset and restore, and validate before submission.
---

Form-associated custom elements contribute to `FormData` just like native inputs. This page covers how to read those values at submit time, respond to the `formdata` event, handle form reset and restore, and validate all controls before allowing submission.

## How Form-Associated Elements Contribute to `FormData`

When a form is submitted (or when `new FormData(form)` is called), the browser calls `setFormValue()` on each form-associated element to collect its current value. The element's `name` property determines the key in the resulting `FormData` object.

```html
<form id="profile-form">
  <hx-text-input name="firstName" label="First name" required></hx-text-input>
  <hx-text-input name="lastName"  label="Last name"  required></hx-text-input>
  <hx-checkbox  name="newsletter" value="yes">Subscribe to newsletter</hx-checkbox>
  <button type="submit">Save</button>
</form>
```

```typescript
const form = document.getElementById('profile-form') as HTMLFormElement;

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);

  console.log(data.get('firstName'));  // 'Alice'
  console.log(data.get('lastName'));   // 'Smith'
  console.log(data.get('newsletter')); // 'yes' or null (if unchecked)
});
```

Unchecked checkboxes contribute `null` — calling `setFormValue(null)` when unchecked omits the field from `FormData`, matching native `<input type="checkbox">` behavior.

## The `formdata` Event

The `formdata` event fires on the `<form>` element immediately before `FormData` is populated. It gives you a final opportunity to add or modify values:

```typescript
form.addEventListener('formdata', (e: FormDataEvent) => {
  const { formData } = e;

  // Augment with computed values
  formData.set('submittedAt', new Date().toISOString());
  formData.set('clientVersion', APP_VERSION);

  // Remove a field you don't want submitted
  formData.delete('_csrf_hidden');
});
```

This is also how you can read all values in one place without a submit event:

```typescript
function collectFormData(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const result: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}
```

## Validation Before Submit

### Native validation (default)

By default the browser validates all form-associated elements when the form is submitted. If any are invalid, submission is blocked and the browser shows error tooltips. Custom elements participate automatically through `ElementInternals.setValidity()`.

### Manual validation with `requestSubmit()`

Use `form.requestSubmit()` instead of `form.submit()` when triggering programmatic submission. `requestSubmit()` runs constraint validation; `submit()` bypasses it entirely.

```typescript
function submitProgrammatically(form: HTMLFormElement) {
  // Runs validation — blocked if any control is invalid
  form.requestSubmit();
}

function submitProgrammaticallyWithButton(form: HTMLFormElement) {
  // requestSubmit(submitter) uses the submitter button's
  // formnovalidate, formaction, etc. attributes
  const submitBtn = form.querySelector('[type="submit"]') as HTMLButtonElement;
  form.requestSubmit(submitBtn);
}
```

### Custom pre-submit validation

For complex cross-field validation or async checks before submission:

```typescript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 1. Run all component validations
  const controls = Array.from(form.elements) as HTMLElement[];
  let allValid = true;

  for (const control of controls) {
    // Call checkValidity if the component exposes it
    if ('checkValidity' in control && typeof control.checkValidity === 'function') {
      if (!control.checkValidity()) {
        allValid = false;
        // Optionally call reportValidity to show error
        (control as any).reportValidity?.();
      }
    }
  }

  if (!allValid) return;

  // 2. Collect FormData
  const data = new FormData(form);

  // 3. Submit
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      body: data,
    });
    if (response.ok) {
      // Handle success
    }
  } catch (error) {
    // Handle network error
  }
});
```

## Reset and Restore Lifecycle

### `formResetCallback`

Called on the component when `form.reset()` is called. Return the component to its default state:

```typescript
formResetCallback() {
  this.value = this.getAttribute('value') ?? '';
  this._errorMessage = '';
  this._internals.setFormValue(this.value);
  this._internals.setValidity({});
}
```

### `formStateRestoreCallback`

Called when the browser restores a saved state — after back/forward navigation or on autofill:

```typescript
formStateRestoreCallback(state: string | null, mode: 'restore' | 'autocomplete') {
  if (state !== null) {
    this.value = state;
    this._internals.setFormValue(state);
  }
}
```

### Triggering reset from JavaScript

```typescript
// Reset the entire form
form.reset(); // calls formResetCallback on all form-associated elements

// Programmatically reset a single HELiX input
const input = document.querySelector('hx-text-input') as HelixTextInput;
input.value = '';
// or trigger the whole form reset:
input.closest('form')?.reset();
```

## Reading Individual Component Values

For quick reads without a full submit, access the component's `value` property directly or through `FormData`:

```typescript
// Direct property access
const input = document.querySelector('hx-text-input[name="email"]') as HelixTextInput;
console.log(input.value);

// Via FormData snapshot
const data = new FormData(form);
console.log(data.get('email'));

// All values as an object
const values = Object.fromEntries(
  Array.from(new FormData(form).entries())
    .filter(([, v]) => typeof v === 'string')
);
```

## Complete Submit Handler Example

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('hx-profile-form')
export class HelixProfileForm extends LitElement {
  static override styles = css`:host { display: block; }`;

  @state() private _submitting = false;
  @state() private _submitError = '';

  private async _handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    // Let the browser run constraint validation first
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this._submitting = true;
    this._submitError = '';

    try {
      const data = new FormData(form);
      const response = await fetch('/api/profile', { method: 'POST', body: data });

      if (!response.ok) {
        this._submitError = `Server error: ${response.statusText}`;
        return;
      }

      this.dispatchEvent(
        new CustomEvent('hx-profile-saved', { bubbles: true, composed: true })
      );
    } catch {
      this._submitError = 'Network error. Please try again.';
    } finally {
      this._submitting = false;
    }
  }

  override render() {
    return html`
      <form @submit=${this._handleSubmit}>
        <hx-text-input name="firstName" label="First name" required></hx-text-input>
        <hx-text-input name="email"     label="Email"      required></hx-text-input>

        ${this._submitError
          ? html`<div role="alert" class="error">${this._submitError}</div>`
          : nothing}

        <button type="submit" ?disabled=${this._submitting}>
          ${this._submitting ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    `;
  }
}
```

## Next Steps

- [Element Internals and Form Association](/components-guide/forms/element-internals/) — `setFormValue()` and lifecycle callbacks
- [Form Validation](/components-guide/forms/validation/) — `checkValidity()` and `reportValidity()`
- [Custom Validity](/components-guide/forms/custom-validity/) — custom error messages and async validation
