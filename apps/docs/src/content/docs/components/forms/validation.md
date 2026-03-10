---
title: Form Validation Patterns
description: Master constraint validation for custom elements. Learn the setValidity API, ValidityState properties, validation methods, custom validation patterns, real-time validation strategies, and how to build accessible, user-friendly form validation experiences.
sidebar:
  order: 30
---

# Form Validation Patterns

Validation is the bridge between user input and data integrity. With the ElementInternals API, custom elements gain first-class access to the browser's constraint validation system—the same validation engine that powers `<input required>`, `<input type="email">`, and `<input pattern="...">`.

This guide covers everything you need to build production-grade validation: the `setValidity()` API, `ValidityState` flags, validation methods (`checkValidity()` vs `reportValidity()`), custom validation patterns, real-time validation strategies, validation message design, and accessibility considerations. By the end, you'll understand how to build validation experiences that are robust, accessible, and feel native to the platform.

## Why Constraint Validation Matters

The browser's constraint validation API provides:

- **Standard validation states** — `valueMissing`, `typeMismatch`, `patternMismatch`, etc.
- **Built-in UI** — Browser-native validation tooltips that match the OS/browser theme
- **Automatic form blocking** — Invalid controls prevent form submission
- **Accessibility integration** — Screen readers announce validation states and error messages
- **Framework compatibility** — Works with React Hook Form, Formik, native forms, etc.
- **Zero JavaScript required** — Basic constraints (required, min, max) work with HTML attributes alone

Without validation integration, custom elements are invisible to:

- Form validation APIs (`form.checkValidity()`)
- Browser validation UI (the tooltip that appears on invalid inputs)
- Assistive technologies (screen readers won't announce errors)
- Form libraries that rely on constraint validation

The ElementInternals API solves this by giving custom elements the same validation capabilities as built-in controls.

## The setValidity() API

The `setValidity()` method is the core of constraint validation. It marks an element as valid or invalid and sets the error message shown to users.

### Signature

```typescript
setValidity(
  flags: ValidityStateFlags,
  message?: string,
  anchor?: HTMLElement
): void;
```

### Parameters

- **`flags`** — Object describing which validation constraints are violated (empty object = valid)
- **`message`** (optional) — Error message shown to users via `validationMessage` property
- **`anchor`** (optional) — Element to anchor browser validation UI to (e.g., the native `<input>` in shadow DOM)

### Marking Valid

An empty flags object marks the element as valid:

```typescript
this._internals.setValidity({}); // Element is now valid
```

After calling this:

- `validity.valid` returns `true`
- `validationMessage` returns `''` (empty string)
- `checkValidity()` returns `true`
- Form submission is not blocked

### Marking Invalid

Set one or more flags to `true` to mark invalid:

```typescript
this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
```

After calling this:

- `validity.valid` returns `false`
- `validity.valueMissing` returns `true`
- `validationMessage` returns `'This field is required.'`
- `checkValidity()` returns `false`
- Form submission is blocked

### The Anchor Parameter

The third parameter (`anchor`) tells the browser where to show the validation tooltip:

```typescript
// ✅ GOOD: Anchor to the native input
this._internals.setValidity(
  { valueMissing: true },
  'This field is required.',
  this._input, // Browser shows tooltip on the <input>
);

// ⚠️ OK but less ideal: No anchor
this._internals.setValidity(
  { valueMissing: true },
  'This field is required.',
  // Browser shows tooltip on the custom element's host
);
```

**Best practice:** Always anchor to the internal focusable element (input, select, textarea, etc.) for the best user experience.

### Updating Validation State

You can call `setValidity()` as often as needed. The latest call wins:

```typescript
// Initially invalid
this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);

// User types something
this.value = 'hello';

// Now valid
this._internals.setValidity({});
```

**Important:** Validation state is **not** automatically cleared. You must explicitly call `setValidity({})` to mark valid.

## ValidityState Properties

The `ValidityState` object (accessed via `this._internals.validity`) contains boolean flags for each validation constraint.

### Standard Constraint Flags

| Flag              | Meaning                           | Example                                                       |
| ----------------- | --------------------------------- | ------------------------------------------------------------- |
| `valueMissing`    | Required field is empty           | `<input required>` with no value                              |
| `typeMismatch`    | Value doesn't match type          | `<input type="email">` with `"not-an-email"`                  |
| `patternMismatch` | Value doesn't match pattern       | `<input pattern="[0-9]{5}">` with `"abc"`                     |
| `tooLong`         | Value exceeds `maxlength`         | `<input maxlength="10">` with 11 characters                   |
| `tooShort`        | Value is shorter than `minlength` | `<input minlength="3">` with 2 characters                     |
| `rangeUnderflow`  | Value is less than `min`          | `<input type="number" min="10">` with value `5`               |
| `rangeOverflow`   | Value exceeds `max`               | `<input type="number" max="100">` with value `200`            |
| `stepMismatch`    | Value doesn't match `step`        | `<input type="number" step="5">` with value `3`               |
| `badInput`        | Browser cannot parse input        | `<input type="number">` with value `"abc"` (browser-specific) |
| `customError`     | Custom validation failed          | Any validation logic you implement                            |

### The valid Flag

The `valid` flag is a computed property:

```typescript
// valid is true only if ALL other flags are false
if (this._internals.validity.valid) {
  console.log('Element is valid');
}
```

You cannot set `valid` directly. It's computed by the browser:

```typescript
// ❌ BAD: This doesn't work
this._internals.setValidity({ valid: true }); // Type error!

// ✅ GOOD: Clear all flags to mark valid
this._internals.setValidity({});
```

### Checking Specific Constraints

You can check which constraints are violated:

```typescript
const validity = this._internals.validity;

if (validity.valueMissing) {
  console.log('Required field is empty');
}

if (validity.tooShort) {
  console.log('Value is shorter than minlength');
}

if (validity.customError) {
  console.log('Custom validation failed');
}
```

### Reading the ValidityState

Expose the `validity` getter to match the standard API:

```typescript
export class HelixInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  /** Returns the ValidityState object. */
  get validity(): ValidityState {
    return this._internals.validity;
  }
}
```

Now consumers can inspect validity:

```html
<hx-text-input id="username" required></hx-text-input>

<script>
  const input = document.getElementById('username');
  console.log(input.validity.valid); // false (required but empty)
  console.log(input.validity.valueMissing); // true
</script>
```

## Validation Methods

The ElementInternals API provides two methods for triggering validation checks: `checkValidity()` and `reportValidity()`. They differ in whether they show browser UI.

### checkValidity()

Checks if the element is valid, **without showing browser UI**.

```typescript
checkValidity(): boolean;
```

**Returns:**

- `true` if the element is valid (all constraint flags are `false`)
- `false` if the element is invalid (one or more constraint flags are `true`)

**Side effects:**

- Dispatches an `invalid` event if the element is invalid (bubbles, cancelable)
- Does **not** show browser validation UI (no tooltip)

**Example:**

```typescript
export class HelixInput extends LitElement {
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }
}
```

**Usage:**

```html
<hx-text-input id="username" required></hx-text-input>

<script>
  const input = document.getElementById('username');

  if (!input.checkValidity()) {
    console.log('Invalid:', input.validationMessage);
    // Logs: "Invalid: This field is required."
    // No browser tooltip shown
  }
</script>
```

**When to use `checkValidity()`:**

- Programmatic validation checks (no user-facing UI)
- Collecting validation state without disrupting the user
- Checking validity before custom error display

### reportValidity()

Checks if the element is valid, **and shows browser validation UI**.

```typescript
reportValidity(): boolean;
```

**Returns:**

- `true` if the element is valid
- `false` if the element is invalid

**Side effects:**

- Dispatches an `invalid` event if the element is invalid
- **Shows browser validation UI** (tooltip with `validationMessage`)
- Focuses the invalid element
- Scrolls the element into view (if needed)

**Example:**

```typescript
export class HelixInput extends LitElement {
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }
}
```

**Usage:**

```html
<hx-text-input id="username" required></hx-text-input>
<button id="submit">Submit</button>

<script>
  document.getElementById('submit').addEventListener('click', () => {
    const input = document.getElementById('username');
    if (!input.reportValidity()) {
      console.log('Validation failed, browser tooltip shown');
    }
  });
</script>
```

**When to use `reportValidity()`:**

- Manual form submission (e.g., AJAX forms)
- Custom "Validate Now" buttons
- Forcing validation UI before form submission

### checkValidity() vs reportValidity()

| Feature                    | checkValidity() | reportValidity()       |
| -------------------------- | --------------- | ---------------------- |
| Returns validity state     | ✅ Yes          | ✅ Yes                 |
| Dispatches `invalid` event | ✅ Yes          | ✅ Yes                 |
| Shows browser tooltip      | ❌ No           | ✅ Yes                 |
| Focuses element            | ❌ No           | ✅ Yes (if invalid)    |
| Scrolls to element         | ❌ No           | ✅ Yes (if invalid)    |
| Use case                   | Silent checks   | User-facing validation |

**Example: Combining Both**

```typescript
private async _handleSubmit(e: Event): Promise<void> {
  e.preventDefault();

  // Silent check (no UI)
  const allValid = Array.from(this._formControls).every(control =>
    'checkValidity' in control && control.checkValidity()
  );

  if (!allValid) {
    // Show UI for first invalid control
    for (const control of this._formControls) {
      if ('reportValidity' in control && !control.reportValidity()) {
        break; // Stop at first invalid control
      }
    }
    return;
  }

  // All valid, proceed with submission
  await this._submitForm();
}
```

### Automatic Validation on Form Submit

When a native `<form>` is submitted, the browser automatically:

1. Calls `checkValidity()` on all form controls
2. If any return `false`, blocks submission
3. Shows validation UI for the first invalid control (via `reportValidity()`)
4. Focuses the first invalid control

**You don't need to write any code for this.** It works automatically for form-associated custom elements.

```html
<form>
  <hx-text-input name="username" required></hx-text-input>
  <hx-text-input name="email" type="email" required></hx-text-input>
  <button type="submit">Submit</button>
</form>

<!-- Clicking "Submit" with empty fields:
     1. Browser calls checkValidity() on both inputs
     2. Both return false
     3. Browser shows tooltip on first invalid input
     4. Form submission is blocked -->
```

## Standard Validation Patterns

These patterns implement the standard HTML constraint validation attributes (`required`, `minlength`, `maxlength`, `min`, `max`, `pattern`).

### Required Field Validation

Use `valueMissing` for required fields:

```typescript
export class HelixTextInput extends LitElement {
  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = '';

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
    } else {
      this._internals.setValidity({});
    }
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('required')) {
      this._updateValidity();
    }
  }
}
```

**Checkbox required validation:**

```typescript
export class HelixCheckbox extends LitElement {
  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  checked = false;

  private _updateValidity(): void {
    if (this.required && !this.checked) {
      this._internals.setValidity(
        { valueMissing: true },
        'You must check this box to continue.',
        this._inputEl,
      );
    } else {
      this._internals.setValidity({});
    }
  }
}
```

### Length Constraints (minlength, maxlength)

Use `tooShort` and `tooLong`:

```typescript
export class HelixTextInput extends LitElement {
  @property({ type: Number })
  minlength?: number;

  @property({ type: Number })
  maxlength?: number;

  @property({ type: String })
  value = '';

  private _updateValidity(): void {
    // Required check first
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    // Minlength check (only if value exists)
    if (this.minlength && this.value.length < this.minlength) {
      this._internals.setValidity(
        { tooShort: true },
        `Please enter at least ${this.minlength} characters (you entered ${this.value.length}).`,
        this._input,
      );
      return;
    }

    // Maxlength check
    if (this.maxlength && this.value.length > this.maxlength) {
      this._internals.setValidity(
        { tooLong: true },
        `Please shorten this text to ${this.maxlength} characters or less (you entered ${this.value.length}).`,
        this._input,
      );
      return;
    }

    // Valid
    this._internals.setValidity({});
  }
}
```

**Note:** The native `<input maxlength>` attribute **prevents** typing beyond the limit. Custom elements can choose to either:

1. Prevent input beyond `maxlength` (like native inputs)
2. Allow input but mark invalid (more flexible for copy/paste)

### Pattern Matching

Use `patternMismatch` for regex validation:

```typescript
export class HelixTextInput extends LitElement {
  @property({ type: String })
  pattern?: string;

  @property({ type: String })
  value = '';

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    if (this.pattern && this.value) {
      const regex = new RegExp(this.pattern);
      if (!regex.test(this.value)) {
        this._internals.setValidity(
          { patternMismatch: true },
          'Please match the requested format.',
          this._input,
        );
        return;
      }
    }

    this._internals.setValidity({});
  }
}
```

**Example: US ZIP code validation**

```html
<hx-text-input
  label="ZIP Code"
  name="zip"
  pattern="[0-9]{5}"
  placeholder="12345"
  required
></hx-text-input>
```

### Type-Based Validation (typeMismatch)

Use `typeMismatch` for type-specific validation (email, URL, etc.):

```typescript
export class HelixTextInput extends LitElement {
  @property({ type: String })
  type: 'text' | 'email' | 'url' | 'tel' = 'text';

  @property({ type: String })
  value = '';

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    // Email validation
    if (this.type === 'email' && this.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.value)) {
        this._internals.setValidity(
          { typeMismatch: true },
          'Please enter a valid email address.',
          this._input,
        );
        return;
      }
    }

    // URL validation
    if (this.type === 'url' && this.value) {
      try {
        new URL(this.value);
      } catch {
        this._internals.setValidity(
          { typeMismatch: true },
          'Please enter a valid URL.',
          this._input,
        );
        return;
      }
    }

    this._internals.setValidity({});
  }
}
```

**Note:** For `type="email"` and `type="url"`, you can delegate validation to the native `<input>` element:

```typescript
// Simpler: Let the native input handle validation
private _updateValidity(): void {
  if (this.required && !this.value) {
    this._internals.setValidity(
      { valueMissing: true },
      'This field is required.',
      this._input
    );
    return;
  }

  // Check native input's validity
  if (this._input && !this._input.checkValidity()) {
    this._internals.setValidity(
      { typeMismatch: true },
      this._input.validationMessage || 'Invalid value.',
      this._input
    );
    return;
  }

  this._internals.setValidity({});
}
```

### Range Constraints (min, max)

Use `rangeUnderflow` and `rangeOverflow` for numeric ranges:

```typescript
export class HelixNumberInput extends LitElement {
  @property({ type: Number })
  min?: number;

  @property({ type: Number })
  max?: number;

  @property({ type: Number })
  value?: number;

  private _updateValidity(): void {
    if (this.required && this.value == null) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    if (this.value != null && this.min != null && this.value < this.min) {
      this._internals.setValidity(
        { rangeUnderflow: true },
        `Value must be greater than or equal to ${this.min}.`,
        this._input,
      );
      return;
    }

    if (this.value != null && this.max != null && this.value > this.max) {
      this._internals.setValidity(
        { rangeOverflow: true },
        `Value must be less than or equal to ${this.max}.`,
        this._input,
      );
      return;
    }

    this._internals.setValidity({});
  }
}
```

**Date range validation:**

```typescript
export class HelixDateInput extends LitElement {
  @property({ type: String })
  min?: string; // ISO 8601 date string

  @property({ type: String })
  max?: string;

  @property({ type: String })
  value = '';

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    if (this.value && this.min && this.value < this.min) {
      this._internals.setValidity(
        { rangeUnderflow: true },
        `Date must be ${this.min} or later.`,
        this._input,
      );
      return;
    }

    if (this.value && this.max && this.value > this.max) {
      this._internals.setValidity(
        { rangeOverflow: true },
        `Date must be ${this.max} or earlier.`,
        this._input,
      );
      return;
    }

    this._internals.setValidity({});
  }
}
```

## Custom Validation Patterns

For validation logic beyond standard constraints, use the `customError` flag.

### Custom Validation (customError)

The `customError` flag is a catch-all for any validation logic you implement:

```typescript
export class HelixPasswordInput extends LitElement {
  @property({ type: String })
  value = '';

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    // Custom validation: password strength
    if (this.value && this.value.length < 8) {
      this._internals.setValidity(
        { customError: true },
        'Password must be at least 8 characters.',
        this._input,
      );
      return;
    }

    if (this.value && !/[A-Z]/.test(this.value)) {
      this._internals.setValidity(
        { customError: true },
        'Password must contain at least one uppercase letter.',
        this._input,
      );
      return;
    }

    if (this.value && !/[0-9]/.test(this.value)) {
      this._internals.setValidity(
        { customError: true },
        'Password must contain at least one number.',
        this._input,
      );
      return;
    }

    this._internals.setValidity({});
  }
}
```

### Cross-Field Validation

Validate one field based on another field's value:

```typescript
export class HelixPasswordConfirmInput extends LitElement {
  @property({ type: String })
  value = '';

  @property({ type: String })
  passwordValue = ''; // Value from the password field

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        'Please confirm your password.',
        this._input,
      );
      return;
    }

    if (this.value && this.value !== this.passwordValue) {
      this._internals.setValidity({ customError: true }, 'Passwords do not match.', this._input);
      return;
    }

    this._internals.setValidity({});
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('passwordValue')) {
      this._updateValidity();
    }
  }
}
```

**Usage:**

```html
<form>
  <hx-text-input
    id="password"
    type="password"
    name="password"
    label="Password"
    required
  ></hx-text-input>

  <hx-password-confirm-input
    id="confirm"
    name="password-confirm"
    label="Confirm Password"
    required
  ></hx-password-confirm-input>

  <button type="submit">Submit</button>
</form>

<script>
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm');

  // Update confirm input when password changes
  passwordInput.addEventListener('hx-input', (e) => {
    confirmInput.passwordValue = e.detail.value;
  });
</script>
```

### Asynchronous Validation

For validation that requires server-side checks (e.g., username availability):

```typescript
export class HelixUsernameInput extends LitElement {
  @property({ type: String })
  value = '';

  @state()
  private _isValidating = false;

  private _validationController = new AbortController();

  async validateUsername(): Promise<void> {
    // Cancel any in-flight validation
    this._validationController.abort();
    this._validationController = new AbortController();

    // Basic validation first
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
      return;
    }

    if (!this.value) {
      this._internals.setValidity({});
      return;
    }

    // Async validation
    this._isValidating = true;

    try {
      const response = await fetch(
        `/api/check-username?username=${encodeURIComponent(this.value)}`,
        { signal: this._validationController.signal },
      );
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
    } catch (error) {
      // Ignore aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Validation error:', error);
    } finally {
      this._isValidating = false;
    }
  }

  private _handleBlur(): void {
    if (this.value) {
      this.validateUsername();
    }
  }

  render() {
    return html`
      <input class="field__input" .value=${this.value} @blur=${this._handleBlur} />
      ${this._isValidating
        ? html`<span class="field__spinner">Checking availability...</span>`
        : nothing}
    `;
  }
}
```

**Best practices for async validation:**

1. **Debounce validation** — Don't validate on every keystroke
2. **Cancel in-flight requests** — Use `AbortController` to cancel when input changes
3. **Show loading state** — Display a spinner or "Checking..." message
4. **Fail gracefully** — Network errors shouldn't block submission
5. **Validate on blur** — Avoid interrupting the user mid-typing

## Real-Time Validation Strategies

When should validation run? Different strategies suit different UX goals.

### Strategy 1: Validate on Blur

**Best for:** Most form fields. Non-intrusive, lets users finish typing before showing errors.

```typescript
export class HelixTextInput extends LitElement {
  @state()
  private _hasBlurred = false;

  private _handleBlur(): void {
    this._hasBlurred = true;
    this._updateValidity();
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    // Only validate if user has left the field at least once
    if (this._hasBlurred && changedProperties.has('value')) {
      this._updateValidity();
    }
  }
}
```

**Pros:**

- Non-intrusive (doesn't interrupt typing)
- Feels natural (user finishes, then sees feedback)
- Reduces noise (no errors while user is still typing)

**Cons:**

- Delayed feedback (user doesn't see errors until they leave the field)
- Doesn't guide users in real-time

### Strategy 2: Validate on Change

**Best for:** Fields where immediate feedback helps (e.g., password strength, character count).

```typescript
export class HelixTextInput extends LitElement {
  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._updateValidity();
    }
  }
}
```

**Pros:**

- Immediate feedback
- Guides users in real-time (e.g., "8 more characters needed")
- Clear when field becomes valid

**Cons:**

- Noisy (shows errors while user is still typing)
- Can feel aggressive

### Strategy 3: Hybrid (Blur, then Change)

**Best for:** Most use cases. Combines the benefits of both strategies.

```typescript
export class HelixTextInput extends LitElement {
  @state()
  private _hasBlurred = false;

  private _handleBlur(): void {
    this._hasBlurred = true;
    this._updateValidity();
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    // First blur: start validating
    // After blur: validate on every change
    if (changedProperties.has('value') && this._hasBlurred) {
      this._updateValidity();
    }
  }
}
```

**Flow:**

1. User types → no validation (non-intrusive)
2. User leaves field → validate and show errors (if any)
3. User returns and types → validate on every keystroke (clear errors immediately)

**Pros:**

- Best of both worlds
- Non-intrusive initially, helpful after first blur
- Errors clear immediately when fixed

**Cons:**

- Slightly more complex to implement

### Strategy 4: Validate on Submit Only

**Best for:** Long forms where real-time validation would be overwhelming.

```typescript
export class HelixForm extends LitElement {
  private _handleSubmit(e: Event): void {
    e.preventDefault();

    // Validate all controls
    const controls = Array.from(this.querySelectorAll<FormControl>('[name]'));
    const firstInvalid = controls.find((control) => !control.checkValidity());

    if (firstInvalid) {
      firstInvalid.reportValidity(); // Show error on first invalid field
      return;
    }

    // All valid, submit
    this._submitForm();
  }
}
```

**Pros:**

- Non-intrusive (user doesn't see errors until they try to submit)
- Works well for long forms

**Cons:**

- Delayed feedback (user only sees errors at the end)
- Can be frustrating if many fields are invalid

### Recommendation: Hybrid Strategy

For most form controls, use the **hybrid strategy** (validate on blur, then on change). This balances user experience and developer ergonomics.

## Validation Message Patterns

Validation messages should be clear, actionable, and accessible.

### Writing Good Validation Messages

**❌ BAD: Vague**

- "Invalid."
- "Error."
- "Please fix this field."

**✅ GOOD: Specific and actionable**

- "This field is required."
- "Please enter a valid email address."
- "Password must be at least 8 characters."
- "Please enter a value between 1 and 100."

**❌ BAD: Technical jargon**

- "valueMissing constraint violated."
- "Pattern regex failed."

**✅ GOOD: Plain language**

- "This field is required."
- "Please match the format: XXX-XXX-XXXX"

**❌ BAD: Blaming the user**

- "You didn't fill this out."
- "You entered an invalid email."

**✅ GOOD: Neutral, helpful**

- "This field is required."
- "Please enter a valid email address."

### Dynamic Validation Messages

Include context in error messages:

```typescript
// ❌ BAD: Generic
this._internals.setValidity({ tooShort: true }, 'Value is too short.', this._input);

// ✅ GOOD: Specific
this._internals.setValidity(
  { tooShort: true },
  `Please enter at least ${this.minlength} characters (you entered ${this.value.length}).`,
  this._input,
);
```

### Combining Constraints

When multiple constraints can fail, check in order of importance:

```typescript
private _updateValidity(): void {
  // 1. Required (highest priority)
  if (this.required && !this.value) {
    this._internals.setValidity(
      { valueMissing: true },
      'This field is required.',
      this._input
    );
    return;
  }

  // 2. Type mismatch
  if (this.type === 'email' && this.value && !this._isValidEmail(this.value)) {
    this._internals.setValidity(
      { typeMismatch: true },
      'Please enter a valid email address.',
      this._input
    );
    return;
  }

  // 3. Length constraints
  if (this.minlength && this.value.length < this.minlength) {
    this._internals.setValidity(
      { tooShort: true },
      `Please enter at least ${this.minlength} characters.`,
      this._input
    );
    return;
  }

  // 4. Valid
  this._internals.setValidity({});
}
```

**Key principle:** Show **one error at a time**, in order of importance. Don't overwhelm users with multiple error messages.

### Exposing validationMessage

Expose the validation message via a getter:

```typescript
export class HelixInput extends LitElement {
  get validationMessage(): string {
    return this._internals.validationMessage;
  }
}
```

Consumers can read the current error:

```html
<hx-text-input id="username" required></hx-text-input>

<script>
  const input = document.getElementById('username');
  console.log(input.validationMessage); // "This field is required."
</script>
```

## HELiX Validation Examples

The HELiX library (using `hx-` prefix) implements validation consistently across all form components.

### Example: hx-text-input

From `packages/hx-library/src/components/hx-text-input/hx-text-input.ts`:

```typescript
export class HelixTextInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  error = ''; // Custom error message (overrides default)

  @query('.field__input')
  private _input!: HTMLInputElement;

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.', // Use custom error if provided
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  // Expose standard validation API
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
}
```

**Usage:**

```html
<!-- Default validation message -->
<hx-text-input label="Username" name="username" required></hx-text-input>
<!-- Error: "This field is required." -->

<!-- Custom validation message -->
<hx-text-input
  label="Username"
  name="username"
  required
  error="Please enter a username."
></hx-text-input>
<!-- Error: "Please enter a username." -->
```

### Example: hx-checkbox

From `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts`:

```typescript
export class HelixCheckbox extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = 'on';

  @query('.checkbox__input')
  private _inputEl!: HTMLInputElement;

  private _updateValidity(): void {
    if (this.required && !this.checked) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._inputEl ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this._internals.setFormValue(this.checked ? this.value : null);
      this._updateValidity();
    }
    if (changedProperties.has('required')) {
      this._updateValidity();
    }
  }
}
```

**Usage:**

```html
<hx-checkbox label="I agree to the terms" name="agree" required></hx-checkbox>
<!-- Must be checked to submit the form -->
```

### Example: hx-select

From `packages/hx-library/src/components/hx-select/hx-select.ts`:

```typescript
export class HelixSelect extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @query('.field__select')
  private _select!: HTMLSelectElement;

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select an option.',
        this._select,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }
}
```

**Usage:**

```html
<hx-select label="Country" name="country" required>
  <option value="">Select a country</option>
  <option value="us">United States</option>
  <option value="ca">Canada</option>
  <option value="mx">Mexico</option>
</hx-select>
<!-- Must select a non-empty option -->
```

## Accessibility Considerations

Validation must be accessible to assistive technologies.

### ARIA Attributes

Set `aria-invalid` when the field is invalid:

```typescript
render() {
  const hasError = !!this.error;

  return html`
    <input
      aria-invalid=${hasError ? 'true' : nothing}
      aria-describedby=${ifDefined(hasError ? this._errorId : undefined)}
    />
    ${hasError
      ? html`
          <div id=${this._errorId} role="alert" aria-live="polite">
            ${this.error}
          </div>
        `
      : nothing}
  `;
}
```

**Key attributes:**

- `aria-invalid="true"` — Marks the field as invalid
- `aria-describedby` — Points to the error message ID
- `role="alert"` — Announces error when it appears
- `aria-live="polite"` — Announces error changes (not interrupting)

### Error Message Announcements

Use `role="alert"` and `aria-live="polite"` for error messages:

```html
<!-- ❌ BAD: Error not announced -->
<div class="error">${this.error}</div>

<!-- ✅ GOOD: Error announced to screen readers -->
<div role="alert" aria-live="polite">${this.error}</div>
```

**When to use `aria-live`:**

- **`aria-live="polite"`** — Announces after current speech finishes (most errors)
- **`aria-live="assertive"`** — Interrupts current speech (critical errors only)

### Required Field Indication

Mark required fields with `aria-required`:

```typescript
render() {
  return html`
    <label>
      Username
      ${this.required
        ? html`<span class="required" aria-hidden="true">*</span>`
        : nothing}
    </label>
    <input
      aria-required=${this.required ? 'true' : nothing}
    />
  `;
}
```

**Notes:**

- Visual `*` marker is `aria-hidden="true"` (decorative)
- `aria-required="true"` announces to screen readers

### Focus Management

When validation fails, focus the first invalid control:

```typescript
private _handleSubmit(e: Event): void {
  e.preventDefault();

  const controls = Array.from(this.querySelectorAll<FormControl>('[name]'));

  for (const control of controls) {
    if (!control.checkValidity()) {
      control.reportValidity(); // Shows error and focuses
      return; // Stop at first invalid control
    }
  }

  // All valid, submit
  this._submitForm();
}
```

The browser's `reportValidity()` automatically:

1. Focuses the invalid element
2. Scrolls it into view
3. Shows the validation tooltip

### Validation Message Contrast

Ensure error messages meet WCAG 2.1 AA contrast requirements:

```css
.field__error {
  color: var(--hx-color-error-700); /* Ensure 4.5:1 contrast on white */
}
```

## Best Practices

### 1. Validate on Every Relevant Change

Don't just validate on `value` changes. Also validate when constraints change:

```typescript
// ✅ GOOD
updated(changedProperties: Map<string, unknown>): void {
  super.updated(changedProperties);
  if (
    changedProperties.has('value') ||
    changedProperties.has('required') ||
    changedProperties.has('minlength') ||
    changedProperties.has('maxlength')
  ) {
    this._updateValidity();
  }
}

// ❌ BAD: Misses constraint changes
updated(changedProperties: Map<string, unknown>): void {
  if (changedProperties.has('value')) {
    this._updateValidity();
  }
}
```

### 2. Always Clear Validity Explicitly

Validation state doesn't auto-clear. You must call `setValidity({})`:

```typescript
// ✅ GOOD
if (this.required && !this.value) {
  this._internals.setValidity({ valueMissing: true }, 'Required.');
} else {
  this._internals.setValidity({}); // Explicitly clear
}

// ❌ BAD: Validity never clears
if (this.required && !this.value) {
  this._internals.setValidity({ valueMissing: true }, 'Required.');
}
// Missing else branch — element stays invalid forever
```

### 3. Use the Anchor Parameter

Always anchor validation UI to the internal input:

```typescript
// ✅ GOOD
this._internals.setValidity({ valueMissing: true }, 'Required.', this._input);

// ⚠️ Less ideal
this._internals.setValidity({ valueMissing: true }, 'Required.');
```

### 4. Expose the Standard Validation API

Always expose these getters and methods:

```typescript
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
```

### 5. Use One Error at a Time

Don't overwhelm users with multiple errors. Check constraints in priority order and return early:

```typescript
// ✅ GOOD: One error at a time
if (this.required && !this.value) {
  this._internals.setValidity({ valueMissing: true }, 'Required.');
  return; // Stop here
}
if (this.minlength && this.value.length < this.minlength) {
  this._internals.setValidity({ tooShort: true }, 'Too short.');
  return;
}
this._internals.setValidity({});

// ❌ BAD: Multiple errors compound
const errors: string[] = [];
if (this.required && !this.value) {
  errors.push('Required.');
}
if (this.minlength && this.value.length < this.minlength) {
  errors.push('Too short.');
}
// Now what? ValidityState only supports one flag at a time.
```

### 6. Support Custom Error Messages

Allow consumers to override default error messages:

```typescript
@property({ type: String })
error = '';

private _updateValidity(): void {
  if (this.required && !this.value) {
    this._internals.setValidity(
      { valueMissing: true },
      this.error || 'This field is required.', // Use custom or default
      this._input
    );
  } else {
    this._internals.setValidity({});
  }
}
```

**Usage:**

```html
<hx-text-input label="Username" required error="Please enter your username."></hx-text-input>
```

### 7. Set ARIA Attributes Correctly

Always set `aria-invalid`, `aria-describedby`, and `aria-required`:

```typescript
render() {
  const hasError = !!this.error;

  return html`
    <input
      aria-invalid=${hasError ? 'true' : nothing}
      aria-describedby=${ifDefined(hasError ? this._errorId : undefined)}
      aria-required=${this.required ? 'true' : nothing}
    />
  `;
}
```

### 8. Test Validation Thoroughly

Test all validation paths:

```typescript
describe('hx-text-input validation', () => {
  it('marks required empty field as invalid', async () => {
    const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');

    expect(el.checkValidity()).toBe(false);
    expect(el.validity.valueMissing).toBe(true);
    expect(el.validationMessage).toBe('This field is required.');
  });

  it('marks filled required field as valid', async () => {
    const el = await fixture<HelixTextInput>(
      '<hx-text-input required value="test"></hx-text-input>',
    );

    expect(el.checkValidity()).toBe(true);
    expect(el.validity.valid).toBe(true);
    expect(el.validationMessage).toBe('');
  });

  it('validates minlength', async () => {
    const el = await fixture<HelixTextInput>(
      '<hx-text-input minlength="5" value="hi"></hx-text-input>',
    );

    expect(el.checkValidity()).toBe(false);
    expect(el.validity.tooShort).toBe(true);
  });
});
```

## Summary

The ElementInternals validation API gives custom elements the same validation capabilities as native form controls:

- **`setValidity(flags, message, anchor)`** — Mark valid/invalid and set error message
- **`ValidityState`** — Standard constraint flags (`valueMissing`, `typeMismatch`, etc.)
- **`checkValidity()`** — Validate without showing UI
- **`reportValidity()`** — Validate and show browser UI
- **Custom validation** — Use `customError` flag for any validation logic
- **Real-time strategies** — Validate on blur, change, or hybrid (blur → change)
- **Accessibility** — `aria-invalid`, `aria-describedby`, `role="alert"`, `aria-live`

**Core pattern:**

```typescript
export class HelixInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = '';

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.', this._input);
    } else {
      this._internals.setValidity({});
    }
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('required')) {
      this._updateValidity();
    }
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
}
```

With these patterns, your form components will validate seamlessly, integrate with browser APIs, and provide accessible, user-friendly validation experiences.

## References

- [ElementInternals: setValidity() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/setValidity)
- [ValidityState - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
- [ElementInternals: checkValidity() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/checkValidity)
- [ElementInternals: reportValidity() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/reportValidity)
- [ElementInternals - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [MDN: Constraint Validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [Form Participation Fundamentals](/components/forms/fundamentals)
