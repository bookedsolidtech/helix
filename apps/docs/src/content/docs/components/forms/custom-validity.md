---
title: Custom Validation & Validity Messages
description: Implementing custom validation logic and user-facing error messages using the Constraint Validation API.
sidebar:
  order: 20
---

# Custom Validation & Validity Messages

The browser's Constraint Validation API gives every form control — including form-associated custom elements — a standard interface for declaring validity state and communicating error messages to users. HELiX components use this API exclusively. There are no proprietary error-display mechanisms.

This guide covers the complete `customError` pattern for custom validation rules that go beyond the standard HTML constraints, asynchronous validators, integrating with Drupal Form API validation, and the accessibility requirements for surfacing error messages to all users.

For the foundational concepts — how `setValidity()` works, what each `ValidityState` flag means, and when to use `checkValidity()` vs `reportValidity()` — see [Form Validation Patterns](/components/forms/validation). For how `ElementInternals` is attached and initialized, see [ElementInternals & Form Participation](/components/forms/element-internals).

---

## The Constraint Validation API at a Glance

Every form-associated custom element in HELiX exposes this public interface, which mirrors the API of native form controls:

```typescript
// Properties
el.validity; // ValidityState — all constraint flags
el.validationMessage; // string — current error text, '' when valid
el.willValidate; // boolean — false when disabled or has no name

// Methods
el.checkValidity(); // boolean — silent check, dispatches 'invalid' if false
el.reportValidity(); // boolean — same but also shows browser UI
```

These properties delegate directly to `ElementInternals`:

```typescript
export class HelixTextInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }
  get validationMessage(): string {
    return this._internals.validationMessage;
  }
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }
}
```

The `willValidate` property is managed entirely by the browser. You do not set it — the browser sets it to `false` automatically when the element is disabled, has no `name`, or is otherwise excluded from constraint validation.

---

## The ValidityState Object and Its Flags

`ValidityState` is a read-only snapshot of the element's constraint state. Each property is a boolean. The `valid` property is `true` only when every other property is `false`.

### Flag reference

| Flag              | Triggered when                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `valueMissing`    | `required` is set and the value is empty                                                    |
| `typeMismatch`    | Value doesn't conform to the declared `type` (e.g., `type="email"` with a non-email string) |
| `patternMismatch` | Value doesn't match the `pattern` regex                                                     |
| `tooShort`        | Value length is less than `minlength`                                                       |
| `tooLong`         | Value length exceeds `maxlength`                                                            |
| `rangeUnderflow`  | Numeric or date value is less than `min`                                                    |
| `rangeOverflow`   | Numeric or date value exceeds `max`                                                         |
| `stepMismatch`    | Numeric value doesn't conform to `step`                                                     |
| `badInput`        | Browser cannot parse the raw input into a valid value                                       |
| `customError`     | A custom validation rule you set using `setValidity({ customError: true }, ...)`            |
| `valid`           | All other flags are `false` — the element is fully valid                                    |

### Reading flags in consumer code

```javascript
const input = document.querySelector('hx-text-input');

// Check a specific flag
if (input.validity.valueMissing) {
  console.log('The field is empty but required');
}

// Check overall validity
if (!input.validity.valid) {
  console.log('Error:', input.validationMessage);
}

// Read the full state at once
const { valueMissing, tooShort, tooLong, customError, valid } = input.validity;
```

### Reading flags inside the component

Components use their own `_internals.validity` to decide what to render:

```typescript
private _renderErrorMessage(): string {
  const { valueMissing, tooShort, patternMismatch, customError } = this._internals.validity;

  if (valueMissing) return 'This field is required.';
  if (tooShort)     return `Please enter at least ${this.minlength} characters.`;
  if (patternMismatch) return this._patternError ?? 'Value does not match the required format.';
  if (customError)  return this._internals.validationMessage;

  return '';
}
```

---

## setValidity() vs setCustomValidity() on Native Elements

Native elements (`<input>`, `<textarea>`, etc.) have a `setCustomValidity()` method that accepts a string. Passing a non-empty string marks the element invalid with `customError: true`. Passing an empty string clears the custom error.

```javascript
// Native input — setCustomValidity()
const nativeInput = document.querySelector('input');
nativeInput.setCustomValidity('Username already taken.');
// nativeInput.validity.customError === true
// nativeInput.validationMessage === 'Username already taken.'

nativeInput.setCustomValidity(''); // Clears the custom error
```

Custom elements use `ElementInternals.setValidity()` instead. It is more powerful because it lets you set any combination of `ValidityStateFlags`, not just `customError`:

```typescript
// Custom element — ElementInternals.setValidity()
this._internals.setValidity(
  { customError: true },
  'Username already taken.',
  this._input, // Anchor for browser tooltip
);

// Clear it
this._internals.setValidity({});
```

You can also set native constraint flags that native inputs set automatically — `valueMissing`, `tooShort`, etc. — and provide your own error message for them:

```typescript
// Use valueMissing (not customError) so aria-required and :invalid match
this._internals.setValidity(
  { valueMissing: true },
  'Please enter the patient's date of birth.',
  this._input,
);
```

### When to use customError vs a native flag

Use a **native flag** (`valueMissing`, `tooShort`, `patternMismatch`, etc.) when:

- Your validation logic maps directly to an HTML constraint
- You want CSS selectors like `:invalid:required` to match correctly
- You want framework integrations (React Hook Form, etc.) to read the right flag

Use **`customError`** when:

- Your validation rule has no native equivalent
- Validation is asynchronous (server-side checks)
- Validation is cross-field (comparing two inputs)
- The error is context-dependent and cannot be expressed as a constraint attribute

---

## Implementing Custom Validation

### Synchronous custom rules

Use `customError` for any rule that goes beyond the standard HTML constraints:

```typescript
export class HelixPatientIdInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @query('input')
  private _input!: HTMLInputElement;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _updateValidity(): void {
    // 1. Required check first — valueMissing takes priority
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'Patient ID is required.', this._input);
      return;
    }

    // 2. Custom: MRN must match the P-NNNNN format
    if (this.value && !/^P-\d{5}$/.test(this.value)) {
      this._internals.setValidity(
        { customError: true },
        'Patient ID must be in the format P-12345.',
        this._input,
      );
      return;
    }

    // 3. Valid — always clear explicitly
    this._internals.setValidity({});
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('required')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }
  get validationMessage(): string {
    return this._internals.validationMessage;
  }
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }
  reportValidity(): boolean {
    return this._internals.reportValidity();
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
}
```

### Multiple custom rules

Check rules in priority order and return after the first match. The browser displays one error at a time — `ValidityState` is designed around showing the single most relevant constraint:

```typescript
private _updateValidity(): void {
  // Priority 1: required
  if (this.required && !this.value) {
    this._internals.setValidity(
      { valueMissing: true },
      'Password is required.',
      this._input,
    );
    return;
  }

  if (!this.value) {
    this._internals.setValidity({});
    return;
  }

  // Priority 2: minimum length
  if (this.value.length < 12) {
    this._internals.setValidity(
      { tooShort: true },
      `Password must be at least 12 characters (currently ${this.value.length}).`,
      this._input,
    );
    return;
  }

  // Priority 3: custom — must contain uppercase
  if (!/[A-Z]/.test(this.value)) {
    this._internals.setValidity(
      { customError: true },
      'Password must contain at least one uppercase letter.',
      this._input,
    );
    return;
  }

  // Priority 4: custom — must contain a digit
  if (!/\d/.test(this.value)) {
    this._internals.setValidity(
      { customError: true },
      'Password must contain at least one number.',
      this._input,
    );
    return;
  }

  // Priority 5: custom — must contain a special character
  if (!/[^A-Za-z0-9]/.test(this.value)) {
    this._internals.setValidity(
      { customError: true },
      'Password must contain at least one special character.',
      this._input,
    );
    return;
  }

  this._internals.setValidity({});
}
```

---

## Writing Async Validators

Some validation rules require a round-trip to the server: checking username uniqueness, verifying NPI numbers, validating insurance policy IDs. The pattern is the same as synchronous validation — you call `setValidity()` — but you call it asynchronously after an `await`.

### Basic async validator

```typescript
export class HelixNpiInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String })
  value = '';

  @state()
  private _isValidating = false;

  @query('input')
  private _input!: HTMLInputElement;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private async _validateNpi(npi: string): Promise<void> {
    // Basic format check first (synchronous — no network call needed)
    if (!/^\d{10}$/.test(npi)) {
      this._internals.setValidity(
        { patternMismatch: true },
        'NPI must be exactly 10 digits.',
        this._input,
      );
      return;
    }

    this._isValidating = true;
    this.requestUpdate();

    try {
      const response = await fetch(`/api/validate-npi?npi=${encodeURIComponent(npi)}`);

      if (!response.ok) {
        // Network error — fail open (do not block submission)
        this._internals.setValidity({});
        return;
      }

      const { valid, message } = (await response.json()) as {
        valid: boolean;
        message?: string;
      };

      if (!valid) {
        this._internals.setValidity(
          { customError: true },
          message ?? 'This NPI number is not registered.',
          this._input,
        );
      } else {
        this._internals.setValidity({});
      }
    } catch {
      // Network failure — fail open
      this._internals.setValidity({});
    } finally {
      this._isValidating = false;
      this.requestUpdate();
    }
  }

  private _handleBlur(): void {
    if (this.value) {
      void this._validateNpi(this.value);
    }
  }
}
```

### Cancelling in-flight requests

When the user types quickly, multiple validation requests can be in-flight simultaneously. The last to resolve wins, which can show stale results. Use `AbortController` to cancel superseded requests:

```typescript
export class HelixUsernameInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String })
  value = '';

  @state()
  private _isValidating = false;

  @query('input')
  private _input!: HTMLInputElement;

  private _abortController: AbortController | null = null;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private async _validateUsername(username: string): Promise<void> {
    // Cancel any in-flight request from a previous call
    this._abortController?.abort();
    this._abortController = new AbortController();

    // Synchronous checks first
    if (username.length < 3) {
      this._internals.setValidity(
        { tooShort: true },
        'Username must be at least 3 characters.',
        this._input,
      );
      return;
    }

    if (!/^[a-z0-9_-]+$/i.test(username)) {
      this._internals.setValidity(
        { patternMismatch: true },
        'Username may only contain letters, numbers, hyphens, and underscores.',
        this._input,
      );
      return;
    }

    this._isValidating = true;

    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`, {
        signal: this._abortController.signal,
      });

      const { available } = (await response.json()) as { available: boolean };

      if (!available) {
        this._internals.setValidity(
          { customError: true },
          'This username is already taken.',
          this._input,
        );
      } else {
        this._internals.setValidity({});
      }
    } catch (err) {
      // Swallow AbortError — it's intentional
      if (err instanceof DOMException && err.name === 'AbortError') return;

      // Other errors: fail open (do not block submission)
      console.error('Username validation failed:', err);
      this._internals.setValidity({});
    } finally {
      this._isValidating = false;
    }
  }

  // Debounced handler — validate 400ms after the user stops typing
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private _handleInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this._internals.setFormValue(this.value);

    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      void this._validateUsername(this.value);
    }, 400);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up on removal
    this._abortController?.abort();
    if (this._debounceTimer !== null) clearTimeout(this._debounceTimer);
  }
}
```

### Optimistic validation for async rules

A useful pattern for async validators: mark the field as invalid with a "pending" message while validation is in-flight. This prevents form submission while the check is running:

```typescript
private async _validateNpi(npi: string): Promise<void> {
  // Mark as "pending" — this blocks form submission during the request
  this._internals.setValidity(
    { customError: true },
    'Validating NPI…',
    this._input,
  );
  this._isValidating = true;

  try {
    const response = await fetch(`/api/validate-npi?npi=${npi}`);
    const { valid, message } = await response.json();

    if (!valid) {
      this._internals.setValidity(
        { customError: true },
        message ?? 'NPI not found in registry.',
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
  } catch {
    // On error: clear the pending state to allow submission
    this._internals.setValidity({});
  } finally {
    this._isValidating = false;
    this.requestUpdate();
  }
}
```

---

## Integrating with Drupal Form API Validation Messages

Drupal's Form API validates form submissions server-side and returns structured error messages. In a Drupal-rendered page, these errors may arrive as:

1. **Inline HTML** rendered into the DOM by Drupal (most common)
2. **AJAX JSON responses** containing error lists
3. **Twig-rendered attributes** like `data-drupal-error`

HELiX components provide an `error` attribute and an `error` slot to accommodate all three patterns.

### Pattern 1: Drupal renders the error inline (recommended)

In Drupal's Twig template, use the `error` slot to pass Drupal-rendered markup directly into the component:

```twig
{# In your Twig template #}
<hx-text-input
  name="{{ element['#name'] }}"
  label="{{ element['#title'] }}"
  {% if element['#required'] %}required{% endif %}
>
  {% if errors %}
    <div slot="error">{{ errors }}</div>
  {% endif %}
</hx-text-input>
```

The `error` slot accepts arbitrary HTML, including Drupal's translated, formatted error strings. The component detects slotted error content and applies the error state visually and via ARIA automatically.

### Pattern 2: The error attribute (string values)

For errors delivered as plain strings — from AJAX responses, JavaScript validation, or simple Twig conditions — use the `error` attribute:

```twig
<hx-text-input
  name="{{ element['#name'] }}"
  label="{{ element['#title'] }}"
  {% if element['#errors'] %}
    error="{{ element['#errors']|render|striptags|trim }}"
  {% endif %}
></hx-text-input>
```

From JavaScript after an AJAX form validation response:

```javascript
// Drupal AJAX commands often return error messages as strings
Drupal.behaviors.formValidation = {
  attach(context) {
    const form = context.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      const data = await response.json();

      if (data.errors) {
        for (const [fieldName, message] of Object.entries(data.errors)) {
          const el = form.querySelector(`[name="${fieldName}"]`);
          if (el && 'error' in el) {
            (el as HelixTextInput).error = String(message);
          }
        }
      }
    });
  },
};
```

### Pattern 3: Synchronizing ElementInternals with server errors

When server-side errors arrive, synchronize them with the component's `ElementInternals` so that `checkValidity()` and `reportValidity()` reflect the server's response:

```typescript
// A utility function for applying Drupal AJAX validation errors to HELiX controls
function applyServerErrors(form: HTMLFormElement, errors: Record<string, string>): void {
  for (const [fieldName, message] of Object.entries(errors)) {
    const el = form.querySelector<HTMLElement>(`[name="${CSS.escape(fieldName)}"]`);
    if (!el) continue;

    // Set the error attribute so the component displays the message
    el.setAttribute('error', message);

    // If the element has the standard validation API, also mark it invalid
    // so form.checkValidity() returns false
    if ('checkValidity' in el && '_internals' in el) {
      // Prefer the public error attribute — the component's _updateValidity()
      // will call setValidity() internally when the attribute changes.
      // For components without that wiring, use reportValidity() to surface it:
      if (!el.checkValidity()) {
        el.reportValidity();
      }
    }
  }
}
```

### Pattern 4: Drupal field states (field_ui dependent)

Drupal's field states API (`data-drupal-states`) can show/hide or require fields dynamically. HELiX components respond to `required` and `disabled` attribute changes, so Drupal's states JS works without modification:

```html
<!-- Drupal States: make this field required if another field has a value -->
<hx-text-input
  name="referring-physician"
  label="Referring Physician"
  data-drupal-states='{"required": {":input[name=\"referral-type\"]": {"value": "external"}}}'
></hx-text-input>
```

When Drupal States adds `required="required"` to the element, the HELiX component's `required` property is updated by its attribute observer (`@property({ type: Boolean, reflect: true })`), and `_updateValidity()` runs on the next Lit update cycle.

---

## Displaying Errors Accessibly

An error message that only changes a red border is useless for users who cannot see. Every validation error must be communicated through accessible markup.

### aria-invalid

Set `aria-invalid="true"` on the focusable input when the control has an error. Remove it (do not set it to `"false"`) when the control is valid:

```typescript
import { nothing } from 'lit';

// In render():
html` <input aria-invalid=${this.error ? 'true' : nothing} ... /> `;
```

Using `nothing` from Lit is important. Setting `aria-invalid="false"` is technically valid, but some screen readers announce "invalid: false" on every focus, which is noisy. Omitting the attribute entirely is cleaner for valid fields.

### aria-describedby

Point the input to the error container using `aria-describedby`. Screen readers read the description when the user focuses the field:

```typescript
private _errorId = `${this._inputId}-error`;

// In render():
html`
  <input
    aria-describedby=${ifDefined(this.error ? this._errorId : undefined)}
    ...
  />

  ${this.error
    ? html`<div id=${this._errorId} class="field__error" ...>${this.error}</div>`
    : nothing}
`
```

If the field also has help text, include both IDs in `aria-describedby`:

```typescript
const describedBy =
  [this.error ? this._errorId : null, this.helpText ? this._helpTextId : null]
    .filter(Boolean)
    .join(' ') || undefined;

// In render():
html`<input aria-describedby=${ifDefined(describedBy)} ... />`;
```

The order matters: put the error ID first. Screen readers read `aria-describedby` items in order, and the error is more urgent than help text.

### role="alert" and aria-live

When an error message appears or changes dynamically, screen readers must announce it without requiring the user to navigate to it:

```typescript
html`
  ${this.error
    ? html`
        <div class="field__error" id=${this._errorId} role="alert" aria-live="polite">
          ${this.error}
        </div>
      `
    : nothing}
`;
```

`role="alert"` combined with `aria-live="polite"` causes the screen reader to announce the message after the current speech finishes. Use `aria-live="assertive"` only for truly critical errors — it interrupts the user immediately.

**Important:** The element with `role="alert"` must exist in the DOM before content is injected into it. If you add and remove the entire element, screen readers may not announce it reliably in all browsers. The safer pattern is to keep an always-present container and set its content:

```typescript
// Less reliable: element is conditionally added and removed
${this.error ? html`<div role="alert">${this.error}</div>` : nothing}

// More reliable: container always present, content changes
render() {
  return html`
    <div
      class="field__error"
      id=${this._errorId}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      ${this.error}
    </div>
  `;
}
```

`aria-atomic="true"` tells screen readers to read the entire container content as a unit when any part changes, rather than announcing only the changed text.

### aria-required

Mark required fields so screen readers announce them without relying on visual cues:

```typescript
html` <input aria-required=${this.required ? 'true' : nothing} ... /> `;
```

The visual asterisk should be `aria-hidden="true"` to prevent double-announcement:

```typescript
html`
  <label class="field__label" for=${this._inputId}>
    ${this.label}
    ${this.required
      ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
      : nothing}
  </label>
`;
```

### Complete accessible error pattern

This is the pattern used in `hx-text-input`:

```typescript
override render() {
  const hasError = !!this.error;
  const describedBy = [
    hasError ? this._errorId : null,
    this.helpText && !hasError ? this._helpTextId : null,
  ].filter(Boolean).join(' ') || undefined;

  return html`
    <div class="field ${hasError ? 'field--error' : ''}">
      <label class="field__label" for=${this._inputId}>
        ${this.label}
        ${this.required
          ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
          : nothing}
      </label>

      <input
        class="field__input"
        id=${this._inputId}
        .value=${live(this.value)}
        ?required=${this.required}
        ?disabled=${this.disabled}
        aria-required=${this.required ? 'true' : nothing}
        aria-invalid=${hasError ? 'true' : nothing}
        aria-describedby=${ifDefined(describedBy)}
        @input=${this._handleInput}
      />

      <div
        class="field__error"
        id=${this._errorId}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        ${this.error}
      </div>

      ${this.helpText && !hasError
        ? html`<div class="field__help-text" id=${this._helpTextId}>${this.helpText}</div>`
        : nothing}
    </div>
  `;
}
```

---

## Live Validation vs On-Submit Validation

When validation runs determines how intrusive the experience is. There is no universally correct answer — different inputs and healthcare workflows call for different strategies.

### Strategy 1: Validate on blur (preferred for most fields)

The field validates after the user leaves it. Until then, no errors are shown.

```typescript
export class HelixTextInput extends LitElement {
  @state()
  private _hasBlurred = false;

  private _handleBlur(): void {
    this._hasBlurred = true;
    this._updateValidity();
    this._showError = !this._internals.validity.valid;
    this.requestUpdate();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();

      // Only update displayed error if the user has already blurred once
      if (this._hasBlurred) {
        this._showError = !this._internals.validity.valid;
        this.requestUpdate();
      }
    }
  }
}
```

**Appropriate for:** Most text inputs, date fields, selects. Non-intrusive — doesn't startle users mid-entry.

### Strategy 2: Validate on change (after first blur)

After the user has left the field once, validate on every keystroke so errors clear as soon as the constraint is satisfied:

```typescript
export class HelixTextInput extends LitElement {
  @state()
  private _touched = false;

  private _handleBlur(): void {
    this._touched = true;
    this._updateAndShowValidity();
  }

  private _handleInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this._internals.setFormValue(this.value);
    this._updateValidity();

    // Show errors immediately only after first blur
    if (this._touched) {
      this._updateAndShowValidity();
    }
  }

  private _updateAndShowValidity(): void {
    this._updateValidity();
    this.error = this._internals.validationMessage;
  }
}
```

**Appropriate for:** Password inputs (where the requirement is complex and the user needs real-time feedback), MRN fields with specific formats.

### Strategy 3: Validate on submit only

Errors appear only when the user attempts to submit the form. The simplest strategy — the browser handles everything:

```html
<form>
  <hx-text-input name="mrn" required></hx-text-input>
  <button type="submit">Register</button>
</form>
<!-- Clicking Submit: browser calls checkValidity() on hx-text-input.
     If false, browser shows validation UI via reportValidity(). -->
```

No additional code is needed for this to work. Because `hx-text-input` is properly form-associated and calls `setValidity()`, the browser's built-in form submission validation handles it.

**Appropriate for:** Short forms, administrative workflows, situations where you want to replicate the native form feel exactly.

### Strategy 4: Validate on submit, then on change

Combines strategies 2 and 3: no errors shown until submission is attempted, then errors clear as the user types:

```typescript
export class HelixForm extends LitElement {
  @state()
  private _submitted = false;

  private _handleSubmit(e: Event): void {
    e.preventDefault();
    this._submitted = true;

    // Show errors on all controls by reading validity and setting the error attribute
    const controls = this.querySelectorAll<HelixTextInput>('hx-text-input');
    let firstInvalid: HelixTextInput | null = null;

    for (const control of controls) {
      if (!control.checkValidity()) {
        control.error = control.validationMessage;
        firstInvalid ??= control;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    void this._submit();
  }
}
```

**Appropriate for:** Long wizard-style forms, multi-step intake forms, anywhere that showing errors eagerly would overwhelm the user.

---

## Testing Custom Validation

Vitest browser mode tests should cover the full range of validity states for every constraint your component implements.

### Test structure

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, html, cleanup } from '@open-wc/testing';
import type { HelixPatientIdInput } from './hx-patient-id-input.js';

describe('hx-patient-id-input validation', () => {
  afterEach(cleanup);

  // Required constraint
  it('is invalid when required and empty', async () => {
    const el = await fixture<HelixPatientIdInput>(
      html`<hx-patient-id-input required></hx-patient-id-input>`,
    );

    expect(el.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage).toBe('Patient ID is required.');
  });

  // Custom format constraint
  it('is invalid when value does not match the P-NNNNN format', async () => {
    const el = await fixture<HelixPatientIdInput>(
      html`<hx-patient-id-input value="12345"></hx-patient-id-input>`,
    );

    expect(el.checkValidity()).toBe(false);
    expect(el.validity.customError).toBe(true);
    expect(el.validationMessage).toBe('Patient ID must be in the format P-12345.');
  });

  it('is valid when value matches the P-NNNNN format', async () => {
    const el = await fixture<HelixPatientIdInput>(
      html`<hx-patient-id-input value="P-00441"></hx-patient-id-input>`,
    );

    expect(el.checkValidity()).toBe(true);
    expect(el.validity.valid).toBe(true);
    expect(el.validationMessage).toBe('');
  });

  // Validity clearing
  it('clears validity when value becomes valid', async () => {
    const el = await fixture<HelixPatientIdInput>(
      html`<hx-patient-id-input required value="bad"></hx-patient-id-input>`,
    );

    expect(el.checkValidity()).toBe(false);

    el.value = 'P-00441';
    await el.updateComplete;

    expect(el.checkValidity()).toBe(true);
  });

  // Form integration
  it('blocks form submission when invalid', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <hx-patient-id-input name="pid" required></hx-patient-id-input>
      </form>
    `);

    expect(form.checkValidity()).toBe(false);
  });

  it('allows form submission when valid', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <hx-patient-id-input name="pid" value="P-00441"></hx-patient-id-input>
      </form>
    `);

    expect(form.checkValidity()).toBe(true);
  });

  // FormData integration
  it('appears in FormData when valid', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <hx-patient-id-input name="pid" value="P-00441"></hx-patient-id-input>
      </form>
    `);

    const formData = new FormData(form);
    expect(formData.get('pid')).toBe('P-00441');
  });

  // ARIA integration
  it('sets aria-invalid when invalid', async () => {
    const el = await fixture<HelixPatientIdInput>(
      html`<hx-patient-id-input required></hx-patient-id-input>`,
    );

    const input = el.shadowRoot!.querySelector('input')!;
    // Trigger error display
    el.error = el.validationMessage;
    await el.updateComplete;

    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
```

### Testing async validators

Use `vi.fn()` to mock `fetch` so tests are deterministic and do not hit the network:

```typescript
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';

describe('hx-username-input async validation', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('sets customError when username is taken', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ available: false }), { status: 200 }),
    );

    const el = await fixture<HelixUsernameInput>(
      html`<hx-username-input value="alice"></hx-username-input>`,
    );

    // Trigger validation
    await el.validateUsername('alice');

    expect(el.checkValidity()).toBe(false);
    expect(el.validity.customError).toBe(true);
    expect(el.validationMessage).toBe('This username is already taken.');
  });

  it('is valid when username is available', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ available: true }), { status: 200 }),
    );

    const el = await fixture<HelixUsernameInput>(
      html`<hx-username-input value="alice"></hx-username-input>`,
    );

    await el.validateUsername('alice');

    expect(el.checkValidity()).toBe(true);
  });

  it('fails open on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network failure'));

    const el = await fixture<HelixUsernameInput>(
      html`<hx-username-input value="alice"></hx-username-input>`,
    );

    await el.validateUsername('alice');

    // Should be valid (fail open) — do not block submission on network errors
    expect(el.checkValidity()).toBe(true);
  });
});
```

---

## Validation Message Writing Guide

Error messages in healthcare applications carry significant weight. A vague or confusing error on a medication order form can cause real harm. Write messages as if the user's health depends on reading them correctly — because sometimes it does.

### Principles

**Be specific.** Tell the user exactly what is wrong and what is needed:

```
// Wrong
"Invalid."

// Correct
"Please enter a 10-digit NPI number."
```

**Include context.** Dynamic messages that include what the user entered or the exact constraint are more helpful than static strings:

```typescript
// Wrong
'Value is too short.'
// Correct
`Please enter at least ${this.minlength} characters. You entered ${this.value.length}.`;
```

**Use plain language.** No technical jargon, no constraint flag names:

```
// Wrong
"patternMismatch: /^P-\d{5}$/"

// Correct
"Patient ID must be in the format P-12345."
```

**State the solution, not the problem.** Lead with what to do, not what went wrong:

```
// Passive
"Date of birth is required."

// Actionable
"Please enter the patient's date of birth."
```

**Match the platform.** When your validation mirrors a native constraint, match the browser's message style. It reduces cognitive friction for users familiar with the browser's built-in validation:

| Constraint               | Browser message (Chromium)                                                                  | HELiX convention                                      |
| ------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `required` empty         | "Please fill out this field."                                                               | "This field is required."                             |
| `type="email"` bad value | "Please enter an email address."                                                            | "Please enter a valid email address."                 |
| `minlength`              | "Please lengthen this text to N characters or more (you are currently using N characters)." | "Please enter at least N characters (you entered N)." |

### Internationalisation

If the application supports multiple languages, validation messages must be internationalised. Do not hardcode strings in components:

```typescript
// Accept messages as properties so Drupal/Twig can supply translated strings
@property({ type: String, attribute: 'error-required' })
errorRequired = 'This field is required.';

@property({ type: String, attribute: 'error-too-short' })
errorTooShort = '';

private _updateValidity(): void {
  if (this.required && !this.value) {
    this._internals.setValidity(
      { valueMissing: true },
      this.errorRequired,
      this._input,
    );
    return;
  }

  if (this.minlength && this.value.length < this.minlength) {
    const msg = this.errorTooShort
      || `Please enter at least ${this.minlength} characters.`;

    this._internals.setValidity({ tooShort: true }, msg, this._input);
    return;
  }

  this._internals.setValidity({});
}
```

In a Twig template, these attributes carry the Drupal-translated string:

```twig
<hx-text-input
  name="{{ element['#name'] }}"
  required
  error-required="{{ 'This field is required.'|t }}"
  error-too-short="{{ 'Please enter at least @min characters.'|t({'@min': element['#minlength']}) }}"
></hx-text-input>
```

---

## References

- [MDN: Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [MDN: ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
- [MDN: ElementInternals.setValidity()](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/setValidity)
- [MDN: HTMLElement.setCustomValidity()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity)
- [MDN: aria-invalid](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid)
- [WCAG 2.1 SC 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
- [WCAG 2.1 SC 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)
- [WCAG 2.1 SC 3.3.3 Error Suggestion](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion.html)
- [ElementInternals & Form Participation](/components/forms/element-internals)
- [Form Validation Patterns](/components/forms/validation)
- [Form Accessibility](/components/forms/accessibility)
