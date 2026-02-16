---
title: Form Participation Fundamentals
description: Master form-associated custom elements with the ElementInternals API. Learn how to build web components that participate in native forms, manage form state, handle validation, and integrate seamlessly with browser form APIs.
sidebar:
  order: 1
---

# Form Participation Fundamentals

Form-associated custom elements are first-class citizens in the web platform. With the ElementInternals API, your web components can participate in native HTML forms just like built-in `<input>`, `<select>`, and `<textarea>` elements. This means automatic form submission, constraint validation, accessibility integration, and seamless interoperability with frameworks and server-side rendering.

This guide covers everything you need to build production-grade form components: the ElementInternals API, form association lifecycle, value management, validation patterns, and integration with native form features. By the end, you'll understand how to build form controls that feel native to the platform.

## Why Form Association Matters

Built-in form controls (`<input>`, `<select>`, etc.) have deep integration with the browser:

- **Automatic form submission** — Values are serialized and submitted with the form
- **Validation API** — Constraint validation with native browser UI
- **Accessibility** — Screen readers announce validation states, required fields, etc.
- **Form reset/restore** — Browser handles reset and state restoration (back/forward navigation)
- **Label association** — Click a `<label>` to focus the control
- **FormData integration** — Values appear in `FormData` and `URLSearchParams`

Without form association, custom elements are **invisible** to these APIs. A custom `<my-input>` won't submit with the form, won't validate, and won't work with assistive technologies.

The ElementInternals API solves this by giving custom elements the same capabilities as built-in controls.

## Form Association Overview

At a high level, making a custom element form-associated involves:

1. **Declare** `static formAssociated = true` on your class
2. **Attach** `ElementInternals` in the constructor via `this.attachInternals()`
3. **Set form value** via `this._internals.setFormValue()`
4. **Implement validation** via `this._internals.setValidity()`
5. **Implement lifecycle callbacks** (`formResetCallback`, `formStateRestoreCallback`)

Here's a minimal example:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-simple-input')
export class HelixSimpleInput extends LitElement {
  // Step 1: Declare form association
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    // Step 2: Attach ElementInternals
    this._internals = this.attachInternals();
  }

  @property({ type: String })
  value = '';

  @property({ type: String })
  name = '';

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      // Step 3: Set form value
      this._internals.setFormValue(this.value);
    }
  }

  // Step 5: Implement reset callback
  formResetCallback() {
    this.value = '';
    this._internals.setFormValue('');
  }

  render() {
    return html`
      <input
        type="text"
        .value=${this.value}
        @input=${(e: Event) => {
          this.value = (e.target as HTMLInputElement).value;
        }}
      />
    `;
  }
}
```

Now this component works in a form:

```html
<form>
  <hx-simple-input name="username"></hx-simple-input>
  <button type="submit">Submit</button>
</form>
```

When the form submits, the browser includes `username=<value>` in the submission.

## The ElementInternals API

`ElementInternals` is the bridge between your custom element and the browser's form APIs. It provides methods for:

- **Form value management** — `setFormValue()`
- **Validation** — `setValidity()`, `checkValidity()`, `reportValidity()`
- **Form access** — `form` property
- **Accessibility** — ARIA role and state management (covered in accessibility docs)

### Creating ElementInternals

`ElementInternals` is created once in the constructor via `attachInternals()`:

```typescript
export class HelixInput extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }
}
```

**Key constraints:**

- **Call in constructor only** — `attachInternals()` throws if called outside the constructor
- **Call once** — Calling `attachInternals()` multiple times throws
- **Requires `formAssociated = true`** — Calling without this flag throws

### TypeScript Typing

The `ElementInternals` interface is built into TypeScript's DOM types (lib.dom.d.ts). No additional imports needed:

```typescript
private _internals: ElementInternals;
```

For stricter typing, you can validate that form-associated methods exist:

```typescript
constructor() {
  super();
  this._internals = this.attachInternals();

  // TypeScript knows these properties exist
  this._internals.setFormValue('');
  this._internals.setValidity({});
  console.log(this._internals.form); // HTMLFormElement | null
}
```

## The formAssociated Static Property

The `static formAssociated = true` declaration tells the browser that your custom element should participate in forms. This is a **static** property on the class, not an instance property.

```typescript
export class HelixInput extends LitElement {
  // Static property: set once on the class
  static formAssociated = true;

  constructor() {
    super();
    this._internals = this.attachInternals(); // Now allowed
  }
}
```

Without this flag:

```typescript
export class BrokenInput extends LitElement {
  // Missing: static formAssociated = true

  constructor() {
    super();
    this._internals = this.attachInternals(); // Throws DOMException!
  }
}
```

**Error:** `DOMException: Failed to execute 'attachInternals' on 'HTMLElement': Unable to attach ElementInternals to a non-form-associated custom element.`

### Checking Form Association at Runtime

You can check if an element is form-associated via the constructor:

```typescript
const input = document.createElement('hx-input');
console.log(input.constructor.formAssociated); // true

const div = document.createElement('div');
console.log(div.constructor.formAssociated); // undefined
```

This is rarely needed, but useful for debugging or generic form utilities.

## Accessing the Associated Form

The `form` property (read-only) returns the `<form>` element that contains the custom element, or `null` if it's not inside a form.

```typescript
export class HelixInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }
}
```

### Usage Examples

#### Accessing the form

```typescript
connectedCallback() {
  super.connectedCallback();

  if (this._internals.form) {
    console.log('Part of form:', this._internals.form.id);
  } else {
    console.log('Standalone (not in a form)');
  }
}
```

#### Adding form event listeners

```typescript
connectedCallback() {
  super.connectedCallback();

  if (this._internals.form) {
    this._internals.form.addEventListener('submit', this._handleFormSubmit);
  }
}

disconnectedCallback() {
  super.disconnectedCallback();

  if (this._internals.form) {
    this._internals.form.removeEventListener('submit', this._handleFormSubmit);
  }
}

private _handleFormSubmit = (e: Event) => {
  console.log('Form is submitting');
};
```

#### Validating all controls in the form

```typescript
validateAllControls() {
  if (!this._internals.form) return true;

  const controls = this._internals.form.elements;
  let allValid = true;

  for (const control of Array.from(controls)) {
    if ('checkValidity' in control && typeof control.checkValidity === 'function') {
      if (!control.checkValidity()) {
        allValid = false;
      }
    }
  }

  return allValid;
}
```

### Form Attribute (form="...")

Like built-in inputs, form-associated custom elements support the `form` attribute to associate with a form outside their DOM tree:

```html
<form id="my-form">
  <button type="submit">Submit</button>
</form>

<!-- This input is associated with the form via the form attribute -->
<hx-input name="username" form="my-form"></hx-input>
```

The browser handles this automatically. Your component's `this._internals.form` will point to the `<form id="my-form">` element.

**Note:** This works without any additional code in your component. The platform handles it.

## Setting the Form Value

The `setFormValue()` method tells the browser what value to submit when the form is submitted. This is the most important method in the ElementInternals API.

### Signature

```typescript
setFormValue(value: File | string | FormData | null, state?: File | string | FormData | null): void;
```

- **`value`** — The value to submit (string, File, FormData, or null)
- **`state`** (optional) — Internal state for restoration (defaults to `value`)

### Simple Value (String)

Most form controls submit a single string value:

```typescript
export class HelixInput extends LitElement {
  @property({ type: String })
  value = '';

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
    }
  }
}
```

**Form submission:**

```html
<form>
  <hx-input name="username" value="alice"></hx-input>
  <!-- Submits: username=alice -->
</form>
```

### Null Value (Unchecked Controls)

For checkboxes, radio buttons, or optional fields, use `null` when the control has no value:

```typescript
export class HelixCheckbox extends LitElement {
  @property({ type: Boolean })
  checked = false;

  @property({ type: String })
  value = 'on';

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      // Only submit value if checked
      this._internals.setFormValue(this.checked ? this.value : null);
    }
  }
}
```

**Form submission:**

```html
<form>
  <hx-checkbox name="agree" checked></hx-checkbox>
  <!-- Submits: agree=on -->

  <hx-checkbox name="subscribe"></hx-checkbox>
  <!-- Submits: (nothing) -->
</form>
```

### File Value

For file inputs, pass a `File` or `FileList`:

```typescript
export class HelixFileInput extends LitElement {
  private _file: File | null = null;

  private _handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this._file = input.files?.[0] || null;
    this._internals.setFormValue(this._file);
  }

  render() {
    return html` <input type="file" @change=${this._handleFileChange} /> `;
  }
}
```

### FormData Value (Multiple Fields)

For complex controls that submit multiple fields (e.g., a date picker that submits `year`, `month`, `day`):

```typescript
export class HelixDatePicker extends LitElement {
  @property({ type: String })
  name = '';

  private _year = 2026;
  private _month = 2;
  private _day = 16;

  private _updateFormValue() {
    const formData = new FormData();
    formData.append(`${this.name}-year`, String(this._year));
    formData.append(`${this.name}-month`, String(this._month));
    formData.append(`${this.name}-day`, String(this._day));

    this._internals.setFormValue(formData);
  }

  // Call _updateFormValue() whenever year/month/day changes
}
```

**Form submission:**

```html
<form>
  <hx-date-picker name="birthdate"></hx-date-picker>
  <!-- Submits: birthdate-year=2026&birthdate-month=2&birthdate-day=16 -->
</form>
```

### State Parameter (Advanced)

The second parameter to `setFormValue()` is the **state**, used for form restoration (browser back/forward, session restore):

```typescript
setFormValue(value: string, state?: string): void;
```

- **`value`** — What the form submits
- **`state`** — What the browser saves for restoration (defaults to `value`)

#### When to Use State

Use state when your control has **internal state that differs from the submitted value**. For example:

- A rich text editor that submits HTML but internally tracks a JSON structure
- A multi-select that submits comma-separated values but internally tracks an array
- A date picker that submits ISO 8601 but internally tracks separate year/month/day

**Example: Multi-Select**

```typescript
export class HelixMultiSelect extends LitElement {
  @property({ type: Array })
  selectedValues: string[] = [];

  private _updateFormValue() {
    // Submit: Comma-separated string
    const submissionValue = this.selectedValues.join(',');

    // State: JSON array (for restoration)
    const state = JSON.stringify(this.selectedValues);

    this._internals.setFormValue(submissionValue, state);
  }

  formStateRestoreCallback(state: string) {
    // Restore from JSON
    this.selectedValues = JSON.parse(state);
  }
}
```

For most components, you don't need the state parameter. The default (state = value) is sufficient.

## Form State Management

Form-associated custom elements participate in the browser's form state lifecycle. This includes:

1. **Form reset** — User clicks `<button type="reset">` or calls `form.reset()`
2. **Form state restoration** — Browser back/forward navigation or session restore

### formResetCallback()

Called when the form is reset. Your component should restore its default state.

```typescript
formResetCallback(): void {
  this.value = '';
  this._internals.setFormValue('');
}
```

#### Example: Text Input

```typescript
export class HelixTextInput extends LitElement {
  @property({ type: String })
  value = '';

  formResetCallback() {
    this.value = ''; // Reset to default
    this._internals.setFormValue('');
  }
}
```

#### Example: Checkbox

```typescript
export class HelixCheckbox extends LitElement {
  @property({ type: Boolean })
  checked = false;

  @property({ type: Boolean })
  indeterminate = false;

  formResetCallback() {
    this.checked = false;
    this.indeterminate = false;
    this._internals.setFormValue(null);
  }
}
```

#### Example: Select with Default

```typescript
export class HelixSelect extends LitElement {
  @property({ type: String })
  value = '';

  private _defaultValue = ''; // Track initial value

  connectedCallback() {
    super.connectedCallback();
    // Capture default value when first connected
    this._defaultValue = this.value;
  }

  formResetCallback() {
    // Reset to initial value, not empty string
    this.value = this._defaultValue;
    this._internals.setFormValue(this._defaultValue);
  }
}
```

**Key constraints:**

- **Always update both the property and form value** — `this.value = ''; this._internals.setFormValue('');`
- **Reset to the default, not always empty** — Check the HTML spec for your control type
- **No return value** — This is a void method

### formStateRestoreCallback()

Called when the browser restores form state (browser back/forward, session restore). The browser passes the **state** that was saved via `setFormValue(value, state)`.

```typescript
formStateRestoreCallback(state: string, mode: 'restore' | 'autocomplete'): void;
```

- **`state`** — The state value passed to `setFormValue()` (or the value if no state was provided)
- **`mode`** — Either `'restore'` (back/forward) or `'autocomplete'` (autocomplete feature)

#### Example: Text Input

```typescript
export class HelixTextInput extends LitElement {
  @property({ type: String })
  value = '';

  formStateRestoreCallback(state: string) {
    this.value = state;
  }
}
```

#### Example: Checkbox

```typescript
export class HelixCheckbox extends LitElement {
  @property({ type: Boolean })
  checked = false;

  @property({ type: String })
  value = 'on';

  formStateRestoreCallback(state: string) {
    // State is the value string if checked, or null if unchecked
    this.checked = state === this.value;
  }
}
```

#### Example: Multi-Select (JSON State)

```typescript
export class HelixMultiSelect extends LitElement {
  @property({ type: Array })
  selectedValues: string[] = [];

  formStateRestoreCallback(state: string) {
    // Restore from JSON state
    try {
      this.selectedValues = JSON.parse(state);
    } catch {
      this.selectedValues = [];
    }
  }
}
```

**Key constraints:**

- **Always restore the component state** — Update properties to match the state
- **Handle invalid state gracefully** — Wrap in try/catch if parsing
- **Don't call `setFormValue()`** — The browser already has the value; you're just syncing

### formDisabledCallback() (Optional)

Called when the element's disabled state changes due to a containing `<fieldset>` being disabled. This is **optional** and rarely needed.

```typescript
formDisabledCallback(disabled: boolean): void {
  this.disabled = disabled;
}
```

Most components don't implement this. The browser handles disabled state automatically via CSS (`:disabled` selector) and ARIA.

## Form Validation

The ElementInternals API provides full integration with the browser's constraint validation API. Your custom element can participate in form validation just like `<input required>` or `<input type="email">`.

### Validation Methods

ElementInternals exposes three validation methods:

```typescript
// Set the validity state
setValidity(
  flags: ValidityStateFlags,
  message?: string,
  anchor?: HTMLElement
): void;

// Check if valid (without showing UI)
checkValidity(): boolean;

// Check if valid (with browser validation UI)
reportValidity(): boolean;
```

### ValidityStateFlags

The `ValidityStateFlags` object defines which validation constraints are violated:

```typescript
interface ValidityStateFlags {
  valueMissing?: boolean; // Required field is empty
  typeMismatch?: boolean; // Value doesn't match type (e.g., invalid email)
  patternMismatch?: boolean; // Value doesn't match pattern attribute
  tooLong?: boolean; // Value exceeds maxlength
  tooShort?: boolean; // Value is shorter than minlength
  rangeUnderflow?: boolean; // Value < min
  rangeOverflow?: boolean; // Value > max
  stepMismatch?: boolean; // Value doesn't match step
  badInput?: boolean; // Browser can't parse input
  customError?: boolean; // Custom validation failed
}
```

### Setting Validity

Use `setValidity()` to mark the element as valid or invalid:

#### Valid

```typescript
this._internals.setValidity({}); // Empty object = valid
```

#### Invalid: Required Field

```typescript
if (this.required && !this.value) {
  this._internals.setValidity(
    { valueMissing: true },
    'This field is required.',
    this._inputElement,
  );
}
```

#### Invalid: Custom Validation

```typescript
if (this.value.length > 0 && this.value.length < 3) {
  this._internals.setValidity(
    { customError: true },
    'Must be at least 3 characters.',
    this._inputElement,
  );
}
```

#### Invalid: Multiple Constraints

```typescript
if (this.required && !this.value) {
  this._internals.setValidity({ valueMissing: true }, 'This field is required.');
} else if (this.value && !this._isValidEmail(this.value)) {
  this._internals.setValidity({ typeMismatch: true }, 'Please enter a valid email address.');
} else {
  this._internals.setValidity({});
}
```

### Validation Parameters

```typescript
setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
```

- **`flags`** — Which validation constraints are violated
- **`message`** — Error message for `validationMessage` property
- **`anchor`** — Element to anchor browser validation UI to (e.g., the native input)

The **anchor** parameter is critical for browser validation UI (the tooltip that appears when you call `reportValidity()`):

```typescript
// Good: Anchor to the native input
this._internals.setValidity(
  { valueMissing: true },
  'This field is required.',
  this._input, // Points to the <input> in the shadow DOM
);

// Less ideal: No anchor (UI appears on the custom element itself)
this._internals.setValidity({ valueMissing: true }, 'This field is required.');
```

### Exposing Validation Properties

Form controls expose these standard properties (mirroring `<input>`):

```typescript
export class HelixInput extends LitElement {
  /** Returns the associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /** Returns the validation message. */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Returns the ValidityState object. */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Checks whether the input satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }
}
```

These getters delegate to `ElementInternals`, giving your component the same API as `<input>`.

### Validation Lifecycle

Validation should run at these key points:

1. **On value change** — Update validity when the value changes
2. **On property change** — Update validity when `required`, `minlength`, etc. change
3. **On blur** — Optionally show validation errors only after the user leaves the field

#### Example: Text Input

```typescript
export class HelixTextInput extends LitElement {
  @property({ type: String })
  value = '';

  @property({ type: Boolean })
  required = false;

  @property({ type: Number })
  minlength?: number;

  @query('.field__input')
  private _input!: HTMLInputElement;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Validate when value or validation properties change
    if (
      changedProperties.has('value') ||
      changedProperties.has('required') ||
      changedProperties.has('minlength')
    ) {
      this._updateValidity();
    }
  }

  private _updateValidity(): void {
    // Required validation
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    // Minlength validation
    if (this.minlength && this.value.length < this.minlength) {
      this._internals.setValidity(
        { tooShort: true },
        `Please enter at least ${this.minlength} characters.`,
        this._input,
      );
      return;
    }

    // Valid
    this._internals.setValidity({});
  }
}
```

### Form Submission Validation

When a form is submitted, the browser automatically calls `checkValidity()` on all form controls. If any return `false`, submission is blocked.

```html
<form>
  <hx-text-input name="username" required></hx-text-input>
  <button type="submit">Submit</button>
</form>

<script>
  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted!'); // Only logs if all controls are valid
  });
</script>
```

If the user tries to submit an empty required field, the browser:

1. Calls `checkValidity()` on the `<hx-text-input>`
2. `checkValidity()` returns `false`
3. Browser blocks submission and focuses the invalid field
4. Browser shows validation UI (if `reportValidity()` was called)

### Manual Validation Trigger

You can manually trigger validation UI:

```typescript
const input = document.querySelector('hx-text-input');

// Check validity (no UI)
if (!input.checkValidity()) {
  console.log('Invalid:', input.validationMessage);
}

// Check validity and show browser UI
if (!input.reportValidity()) {
  console.log('Invalid and UI shown');
}
```

### Custom Validation Logic

For complex validation (e.g., async server-side checks), use the `customError` flag:

```typescript
export class HelixUsernameInput extends LitElement {
  @property({ type: String })
  value = '';

  private _isValidating = false;

  async validateUsername() {
    this._isValidating = true;

    try {
      const response = await fetch(`/api/check-username?username=${this.value}`);
      const { available } = await response.json();

      if (!available) {
        this._internals.setValidity(
          { customError: true },
          'This username is already taken.',
          this._input,
        );
      } else {
        this._internals.setValidity({});
      }
    } finally {
      this._isValidating = false;
    }
  }

  private _handleBlur() {
    if (this.value) {
      this.validateUsername();
    }
  }
}
```

## Form Data Serialization

When a form is submitted, the browser serializes all form-associated elements into a `FormData` object or URL-encoded string.

### FormData API

```html
<form id="my-form">
  <hx-text-input name="username" value="alice"></hx-text-input>
  <hx-checkbox name="subscribe" checked></hx-checkbox>
  <button type="submit">Submit</button>
</form>

<script>
  const form = document.querySelector('#my-form');
  const formData = new FormData(form);

  console.log(formData.get('username')); // "alice"
  console.log(formData.get('subscribe')); // "on"

  // Iterate all fields
  for (const [name, value] of formData) {
    console.log(name, value);
  }
</script>
```

### URLSearchParams

```javascript
const form = document.querySelector('#my-form');
const formData = new FormData(form);
const params = new URLSearchParams(formData);

console.log(params.toString()); // "username=alice&subscribe=on"
```

### Fetch API

```javascript
const form = document.querySelector('#my-form');
const formData = new FormData(form);

fetch('/api/submit', {
  method: 'POST',
  body: formData, // Browser serializes automatically
});
```

### Name Attribute

The `name` attribute is **required** for form submission. Without it, the control's value is not submitted:

```html
<!-- This value IS submitted -->
<hx-input name="username" value="alice"></hx-input>

<!-- This value is NOT submitted (no name) -->
<hx-input value="bob"></hx-input>
```

In your component:

```typescript
@property({ type: String })
name = '';
```

The browser automatically reads the `name` attribute. You don't need to do anything special.

## Integration with Native Forms

Form-associated custom elements work seamlessly with all native form features.

### Form Submission

```html
<form action="/submit" method="POST">
  <hx-text-input name="username" required></hx-text-input>
  <hx-text-input name="email" type="email" required></hx-text-input>
  <button type="submit">Submit</button>
</form>
```

- Clicking "Submit" triggers validation
- If valid, form submits to `/submit` with `username` and `email`
- If invalid, submission is blocked and browser shows validation UI

### Form Reset

```html
<form>
  <hx-text-input name="username" value="alice"></hx-text-input>
  <button type="reset">Reset</button>
</form>
```

- Clicking "Reset" calls `formResetCallback()` on all form controls
- Each control restores its default value

### Form Validation Events

Forms dispatch validation events:

```javascript
const form = document.querySelector('form');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('Form submitted');
});

form.addEventListener(
  'invalid',
  (e) => {
    console.log('Invalid control:', e.target);
  },
  true,
); // Use capture to catch events from custom elements
```

### Label Association

Labels work with form-associated custom elements:

```html
<label for="username">Username:</label>
<hx-text-input id="username" name="username"></hx-text-input>
```

Clicking the `<label>` focuses the `<hx-text-input>`. This works automatically if your component:

1. Implements `focus()` method
2. Delegates focus to the internal input

```typescript
export class HelixTextInput extends LitElement {
  @query('.field__input')
  private _input!: HTMLInputElement;

  /** Moves focus to the input element. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }
}
```

### Disabled State

The `disabled` attribute is honored by the browser:

```html
<hx-input name="username" disabled></hx-input>
```

- Disabled controls don't submit with the form
- The `:disabled` CSS pseudo-class matches
- Assistive technologies announce the disabled state

In your component:

```typescript
@property({ type: Boolean, reflect: true })
disabled = false;
```

The `reflect: true` option ensures the attribute updates when the property changes, keeping CSS selectors like `:disabled` working.

## Real-World Examples

### Example 1: hx-text-input

Full implementation from `packages/hx-library/src/components/hx-text-input/hx-text-input.ts`:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String })
  value = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  error = '';

  @query('.field__input')
  private _input!: HTMLInputElement;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
  }

  render() {
    return html`
      <input
        class="field__input"
        type="text"
        .value=${live(this.value)}
        ?required=${this.required}
        ?disabled=${this.disabled}
        @input=${this._handleInput}
      />
    `;
  }
}
```

### Example 2: hx-checkbox

Full implementation from `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts`:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean })
  indeterminate = false;

  @property({ type: String })
  name = '';

  @property({ type: String })
  value = 'on';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @query('.checkbox__input')
  private _inputEl!: HTMLInputElement;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      // Submit value only if checked
      this._internals.setFormValue(this.checked ? this.value : null);
      this._updateValidity();
    }
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.checked) {
      this._internals.setValidity(
        { valueMissing: true },
        'This field is required.',
        this._inputEl ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.checked = false;
    this.indeterminate = false;
    this._internals.setFormValue(null);
  }

  formStateRestoreCallback(state: string): void {
    this.checked = state === this.value;
  }

  override focus(options?: FocusOptions): void {
    this._inputEl?.focus(options);
  }

  private _handleChange(): void {
    if (this.disabled) return;

    this.indeterminate = false;
    this.checked = !this.checked;

    this._internals.setFormValue(this.checked ? this.value : null);
    this._updateValidity();

    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  }

  render() {
    return html`
      <label @click=${this._handleChange}>
        <input
          class="checkbox__input"
          type="checkbox"
          .checked=${live(this.checked)}
          .indeterminate=${live(this.indeterminate)}
          ?disabled=${this.disabled}
          ?required=${this.required}
          tabindex="-1"
        />
        <span>Checkbox Label</span>
      </label>
    `;
  }
}
```

### Example 3: hx-select

Full implementation from `packages/hx-library/src/components/hx-select/hx-select.ts`:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('hx-select')
export class HelixSelect extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @query('.field__select')
  private _select!: HTMLSelectElement;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'Please select an option.', this._select);
    } else {
      this._internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this._select?.focus(options);
  }

  private _handleChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this._updateValidity();

    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  render() {
    return html`
      <select
        class="field__select"
        ?required=${this.required}
        ?disabled=${this.disabled}
        @change=${this._handleChange}
      >
        <slot></slot>
      </select>
    `;
  }
}
```

## Best Practices

### 1. Always Declare formAssociated

```typescript
// ✅ GOOD
export class HelixInput extends LitElement {
  static formAssociated = true;
}

// ❌ BAD: Missing declaration
export class BrokenInput extends LitElement {
  // attachInternals() will throw
}
```

### 2. Attach ElementInternals in Constructor

```typescript
// ✅ GOOD
constructor() {
  super();
  this._internals = this.attachInternals();
}

// ❌ BAD: Calling outside constructor throws
connectedCallback() {
  super.connectedCallback();
  this._internals = this.attachInternals(); // DOMException!
}
```

### 3. Update Form Value When Value Changes

```typescript
// ✅ GOOD
updated(changedProperties: Map<string, unknown>) {
  super.updated(changedProperties);
  if (changedProperties.has('value')) {
    this._internals.setFormValue(this.value);
  }
}

// ❌ BAD: Form value out of sync with property
updated() {
  // Forgot to call setFormValue()
}
```

### 4. Validate on Every Relevant Change

```typescript
// ✅ GOOD
updated(changedProperties: Map<string, unknown>) {
  super.updated(changedProperties);
  if (
    changedProperties.has('value') ||
    changedProperties.has('required') ||
    changedProperties.has('minlength')
  ) {
    this._updateValidity();
  }
}

// ❌ BAD: Only validate on value change
updated(changedProperties: Map<string, unknown>) {
  if (changedProperties.has('value')) {
    this._updateValidity(); // Misses required/minlength changes
  }
}
```

### 5. Expose Standard Validation API

```typescript
// ✅ GOOD: Delegate to ElementInternals
get validity(): ValidityState {
  return this._internals.validity;
}

checkValidity(): boolean {
  return this._internals.checkValidity();
}

reportValidity(): boolean {
  return this._internals.reportValidity();
}

// ❌ BAD: Custom implementation that diverges from the platform
get validity() {
  return { valid: this.value !== '' }; // Not a ValidityState!
}
```

### 6. Implement Both Reset and Restore Callbacks

```typescript
// ✅ GOOD
formResetCallback() {
  this.value = '';
  this._internals.setFormValue('');
}

formStateRestoreCallback(state: string) {
  this.value = state;
}

// ❌ BAD: Missing callbacks breaks browser features
// (no reset button support, no back/forward restoration)
```

### 7. Use the Anchor Parameter for Validation UI

```typescript
// ✅ GOOD: Anchor to internal input
this._internals.setValidity(
  { valueMissing: true },
  'This field is required.',
  this._input, // Validation tooltip appears on the input
);

// ⚠️ OK but less ideal: No anchor (tooltip appears on custom element)
this._internals.setValidity({ valueMissing: true }, 'This field is required.');
```

### 8. Implement focus() for Label Association

```typescript
// ✅ GOOD
override focus(options?: FocusOptions): void {
  this._input?.focus(options);
}

// ❌ BAD: Labels won't focus the control
// (missing focus() method)
```

### 9. Use null for Unchecked/Empty Controls

```typescript
// ✅ GOOD: Checkbox
this._internals.setFormValue(this.checked ? this.value : null);

// ❌ BAD: Always submits a value
this._internals.setFormValue(this.checked ? this.value : '');
// Empty string is still a value!
```

### 10. Reflect disabled and required for CSS

```typescript
// ✅ GOOD
@property({ type: Boolean, reflect: true })
disabled = false;

@property({ type: Boolean, reflect: true })
required = false;

// Now :disabled and :required pseudo-classes work

// ❌ BAD: No reflection breaks CSS selectors
@property({ type: Boolean })
disabled = false;
```

## Common Pitfalls

### Pitfall 1: Forgetting formAssociated = true

```typescript
// ❌ Throws DOMException
export class BrokenInput extends LitElement {
  constructor() {
    super();
    this._internals = this.attachInternals(); // Error!
  }
}

// ✅ Fixed
export class FixedInput extends LitElement {
  static formAssociated = true;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }
}
```

### Pitfall 2: Calling attachInternals() Outside Constructor

```typescript
// ❌ Throws DOMException
connectedCallback() {
  super.connectedCallback();
  this._internals = this.attachInternals(); // Error!
}

// ✅ Fixed
constructor() {
  super();
  this._internals = this.attachInternals();
}
```

### Pitfall 3: Not Updating Form Value

```typescript
// ❌ Form submission doesn't include this value
private _handleInput(e: Event) {
  this.value = (e.target as HTMLInputElement).value;
  // Forgot to call setFormValue()
}

// ✅ Fixed
private _handleInput(e: Event) {
  this.value = (e.target as HTMLInputElement).value;
  this._internals.setFormValue(this.value);
}
```

### Pitfall 4: Calling setFormValue() in formStateRestoreCallback()

```typescript
// ❌ Don't call setFormValue() in restore callback
formStateRestoreCallback(state: string) {
  this.value = state;
  this._internals.setFormValue(state); // Unnecessary!
}

// ✅ Fixed
formStateRestoreCallback(state: string) {
  this.value = state;
  // Browser already has the value
}
```

### Pitfall 5: Using Empty String Instead of null

```typescript
// ❌ Checkbox always submits a value (even when unchecked)
this._internals.setFormValue(this.checked ? this.value : '');

// ✅ Fixed
this._internals.setFormValue(this.checked ? this.value : null);
```

### Pitfall 6: Not Anchoring Validation UI

```typescript
// ⚠️ Validation tooltip appears on custom element (not ideal)
this._internals.setValidity({ valueMissing: true }, 'This field is required.');

// ✅ Better: Tooltip appears on the internal input
this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
```

## Browser Support

The ElementInternals API is supported in:

- **Chrome/Edge:** 77+
- **Firefox:** 93+
- **Safari:** 16.4+

For older browsers, use a polyfill:

```bash
npm install element-internals-polyfill
```

```typescript
import 'element-internals-polyfill';
```

The polyfill provides the same API surface, ensuring your components work everywhere.

## Summary

Form-associated custom elements bring parity between custom components and built-in form controls. The ElementInternals API gives you:

1. **Form value management** via `setFormValue()`
2. **Constraint validation** via `setValidity()`, `checkValidity()`, `reportValidity()`
3. **Form lifecycle** via `formResetCallback()` and `formStateRestoreCallback()`
4. **Automatic serialization** in `FormData` and form submissions
5. **Accessibility integration** with browser validation UI and assistive technologies

Follow these patterns:

- Declare `static formAssociated = true`
- Attach `ElementInternals` in the constructor
- Update form value whenever the component value changes
- Validate on every relevant property change
- Implement reset and restore callbacks
- Expose the standard validation API
- Use `null` for empty/unchecked controls
- Anchor validation UI to internal inputs
- Reflect `disabled` and `required` for CSS

With these fundamentals, your form components will work seamlessly in any context: native HTML forms, React forms, server-side rendering, and accessibility tools.

## References

- [MDN: ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [MDN: Form-associated Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals#form-associated_custom_elements)
- [web.dev: More Capable Form Controls](https://web.dev/articles/more-capable-form-controls)
- [WHATWG HTML Standard: Form-associated Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements)
- [MDN: Constraint Validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [MDN: ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
