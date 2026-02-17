---
title: ElementInternals & Form Participation
description: Using the ElementInternals API to build form-associated custom elements that work natively with HTML forms.
sidebar:
  order: 10
---

# ElementInternals & Form Participation

The `ElementInternals` API is what separates a custom element that _looks_ like a form control from one that _is_ a form control. Before this API existed, custom input components were invisible to the browser's form machinery: they didn't submit with the form, couldn't be validated by the browser, weren't announced correctly by screen readers, and were ignored by every form-aware framework.

`ElementInternals` closes that gap. It gives your components the same internal capabilities as `<input>`, `<select>`, and `<textarea>`. This guide covers the API in depth — what every method does, when to call it, and the patterns that HELiX components follow throughout the library.

For a higher-level overview of the form participation lifecycle, see [Form Participation Fundamentals](/components/forms/fundamentals). For a focused look at `setValidity()` and the constraint validation flags, see [Form Validation Patterns](/components/forms/validation).

---

## What ElementInternals Is

`ElementInternals` is a browser-native object attached to a custom element that grants access to:

- **Form value submission** — the value the browser includes in `FormData` when the form is submitted
- **Constraint validation** — the `ValidityState` object, the `validationMessage`, and the ability to block form submission
- **Form lifecycle callbacks** — reset, state restore, disabled propagation
- **Form reference** — a pointer to the `<form>` element the component belongs to
- **ARIA reflection** — managed ARIA state (covered in the accessibility docs)

The API was designed so that a properly built custom element is indistinguishable from a native form control at the platform level. Form libraries, browser autofill, screen readers, and server-side form handlers all interact with your component through the same interfaces they use with native inputs.

---

## static formAssociated = true

The single prerequisite for using `ElementInternals` in a form context is the `static formAssociated = true` declaration.

```typescript
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // Required. Without this, attachInternals() throws a DOMException.
  static formAssociated = true;
}
```

This static property tells the browser three things:

1. This element participates in form submission (its value appears in `FormData`)
2. It participates in constraint validation (the form checks its validity before submitting)
3. It receives form lifecycle callbacks (`formResetCallback`, `formStateRestoreCallback`, `formDisabledCallback`)

**Without `formAssociated = true`:**

```typescript
export class BrokenInput extends LitElement {
  constructor() {
    super();
    // Throws: "Failed to execute 'attachInternals' on 'HTMLElement':
    // Unable to attach ElementInternals to a non-form-associated custom element."
    this._internals = this.attachInternals();
  }
}
```

The flag is a static property, not an instance property. You set it once on the class. Every instance of that class inherits form association.

### Checking form association programmatically

Rarely needed, but available for diagnostic utilities:

```typescript
const el = document.querySelector('hx-text-input');
console.log((el.constructor as typeof HTMLElement & { formAssociated?: boolean }).formAssociated);
// true
```

---

## attachInternals() in the Constructor

`attachInternals()` must be called in the constructor. Calling it at any other lifecycle point throws a `DOMException`.

```typescript
export class HelixTextInput extends LitElement {
  static formAssociated = true;

  // Declare as a non-optional private field — it is always set in the constructor.
  private _internals: ElementInternals;

  constructor() {
    super(); // Must come first in Lit components
    this._internals = this.attachInternals();
  }
}
```

**Rules:**

- Call `super()` before `attachInternals()` — Lit requires it
- Call it exactly once — calling it again throws
- Call it in the constructor only — lifecycle methods (`connectedCallback`, `updated`, etc.) are too late
- Assign it to a private field so all lifecycle methods can reference it

`ElementInternals` is defined in TypeScript's built-in DOM types (`lib.dom.d.ts`). No additional imports or `@types` packages are required as long as your `tsconfig.json` includes `"lib": ["ESNext", "DOM"]`.

---

## setFormValue() — Submittable Values

`setFormValue()` is how you tell the browser what value to include in `FormData` when the form is submitted. Call it every time your component's value changes.

### Signature

```typescript
setFormValue(
  value: File | string | FormData | null,
  state?: File | string | FormData | null
): void;
```

- `value` — The submission value. `null` means "don't submit this control" (correct for unchecked checkboxes).
- `state` — Optional internal restoration state. Defaults to `value` if omitted.

### String values (most common)

```typescript
// In hx-text-input: called whenever the input's value changes
private _handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);

  this.dispatchEvent(new CustomEvent('hx-input', {
    bubbles: true,
    composed: true,
    detail: { value: this.value },
  }));
}
```

When the form submits:

```html
<form>
  <hx-text-input name="patient-id" value="P-00441"></hx-text-input>
  <!-- Submits: patient-id=P-00441 -->
</form>
```

### Null values (checkboxes, unchecked controls)

Passing `null` removes the control from the `FormData` entirely, which matches how native unchecked checkboxes behave:

```typescript
// In hx-checkbox
updated(changedProperties: Map<string, unknown>): void {
  super.updated(changedProperties);
  if (changedProperties.has('checked') || changedProperties.has('value')) {
    // null when unchecked — the field does not appear in FormData
    this._internals.setFormValue(this.checked ? this.value : null);
  }
}
```

Do not use an empty string as a substitute for `null`. An empty string is a value and will appear in `FormData`. `null` is the correct signal for "this control has nothing to submit."

### FormData values (composite controls)

A single custom element can submit multiple named fields by passing a `FormData` object:

```typescript
// A date range picker that submits two fields
export class HelixDateRangePicker extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  @property({ type: String })
  name = '';

  private _startDate = '';
  private _endDate = '';

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _updateFormValue(): void {
    const fd = new FormData();
    fd.append(`${this.name}-start`, this._startDate);
    fd.append(`${this.name}-end`, this._endDate);
    this._internals.setFormValue(fd);
  }
}
```

Result in `FormData`:

```
admission-start=2026-02-10
admission-end=2026-02-17
```

### File values

```typescript
private _handleFileChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  this._internals.setFormValue(file);
}
```

### The state parameter

The optional second argument is used by `formStateRestoreCallback`. Use it when your component's internal state is richer than the submitted value:

```typescript
// A multi-select that submits comma-separated strings
// but internally tracks an array for easier restoration
private _updateFormValue(): void {
  const submittedValue = this._selected.join(',');
  const restorationState = JSON.stringify(this._selected);

  this._internals.setFormValue(submittedValue, restorationState);
}

formStateRestoreCallback(state: string): void {
  try {
    this._selected = JSON.parse(state) as string[];
  } catch {
    this._selected = [];
  }
}
```

When no state argument is provided, the browser saves `value` as the state automatically. For most components — text inputs, selects, checkboxes — this default is correct.

---

## setValidity() — Constraint Validation

`setValidity()` is how your component participates in the browser's constraint validation system. Calling it with an empty object marks the element as valid. Calling it with one or more flags set marks it as invalid.

Full coverage of this method, all validity flags, and real-world patterns is in [Form Validation Patterns](/components/forms/validation). What follows here is the structural overview needed to understand how the API fits into the ElementInternals lifecycle.

### Marking valid

```typescript
this._internals.setValidity({});
// validity.valid === true
// validationMessage === ''
// checkValidity() returns true
// Form submission is not blocked
```

### Marking invalid

```typescript
this._internals.setValidity(
  { valueMissing: true }, // Flag describing the constraint that failed
  'This field is required.', // User-facing message (becomes validationMessage)
  this._input, // Anchor element for browser validation tooltip
);
// validity.valid === false
// validity.valueMissing === true
// validationMessage === 'This field is required.'
// checkValidity() returns false
// Form submission is blocked
```

The anchor element is critical. It tells the browser where to visually anchor the validation tooltip when `reportValidity()` is called. Always anchor to the internal focusable element — the native `<input>`, `<select>`, or `<textarea>` inside shadow DOM.

### When to call setValidity()

Call it any time a property that affects validity changes:

```typescript
override updated(changedProperties: Map<string, unknown>): void {
  super.updated(changedProperties);
  if (
    changedProperties.has('value') ||
    changedProperties.has('required') ||
    changedProperties.has('minlength') ||
    changedProperties.has('maxlength')
  ) {
    // Form value and validity stay in sync
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
    }
    this._updateValidity();
  }
}
```

---

## internals.validity and internals.validationMessage

These two read-only properties reflect the element's current validation state. Expose them as public getters so consumers can read them the same way they would on a native `<input>`:

```typescript
/** Returns the ValidityState object describing all constraint flags. */
get validity(): ValidityState {
  return this._internals.validity;
}

/** Returns the current validation message set by setValidity(). */
get validationMessage(): string {
  return this._internals.validationMessage;
}
```

**`validity`** is a `ValidityState` object with the following boolean flags:

| Flag              | Meaning                                                   |
| ----------------- | --------------------------------------------------------- |
| `valueMissing`    | `required` is set and the value is empty                  |
| `typeMismatch`    | Value doesn't conform to its `type` (e.g., invalid email) |
| `patternMismatch` | Value doesn't match the `pattern` attribute               |
| `tooShort`        | Value is shorter than `minlength`                         |
| `tooLong`         | Value exceeds `maxlength`                                 |
| `rangeUnderflow`  | Numeric value is less than `min`                          |
| `rangeOverflow`   | Numeric value exceeds `max`                               |
| `stepMismatch`    | Numeric value doesn't conform to `step`                   |
| `badInput`        | Browser cannot parse the input into a usable value        |
| `customError`     | A custom validation rule you implemented has failed       |
| `valid`           | `true` only when all other flags are `false`              |

You cannot set `valid` directly. It is computed by the browser as the logical inverse of all other flags combined.

**`validationMessage`** is the string passed as the second argument to `setValidity()`. It returns an empty string when the element is valid.

Consumer usage:

```javascript
const input = document.querySelector('hx-text-input');

// Check a specific constraint
if (input.validity.valueMissing) {
  console.log('Required field is empty');
}

// Read the current error message
if (!input.validity.valid) {
  console.log(input.validationMessage);
}
```

---

## checkValidity() and reportValidity()

Both methods delegate to `ElementInternals`. Expose them on your component as part of the standard form control interface:

```typescript
/** Returns true if the element satisfies all constraints. Dispatches 'invalid' if not. */
checkValidity(): boolean {
  return this._internals.checkValidity();
}

/** Returns true if valid. If invalid, shows browser validation UI and fires 'invalid'. */
reportValidity(): boolean {
  return this._internals.reportValidity();
}
```

The difference between them:

|                        | `checkValidity()`          | `reportValidity()`     |
| ---------------------- | -------------------------- | ---------------------- |
| Returns validity state | Yes                        | Yes                    |
| Fires `invalid` event  | Yes                        | Yes                    |
| Shows browser tooltip  | No                         | Yes                    |
| Focuses element        | No                         | Yes (if invalid)       |
| Use case               | Silent programmatic checks | User-facing validation |

When a native `<form>` is submitted, the browser calls `checkValidity()` on every form-associated element automatically. If any return `false`, submission is blocked and the browser calls `reportValidity()` on the first invalid control.

---

## The Lifecycle Callbacks

Form-associated custom elements receive four lifecycle callbacks from the browser. These are methods you implement on your class — the browser calls them when the relevant form events occur.

### formAssociatedCallback(form)

Called when the element is associated with (or disassociated from) a form. This happens when the element is connected to the DOM inside a `<form>`, or when the `form` attribute is set.

```typescript
formAssociatedCallback(form: HTMLFormElement | null): void {
  // form is the new associated form, or null if disassociated
  if (form) {
    console.log('Associated with form:', form.id);
  }
}
```

Most components don't need this callback. It is useful for components that need to observe form-level events, or that display form-scoped information.

```typescript
// Example: a submit button that disables itself while the form is submitting
formAssociatedCallback(form: HTMLFormElement | null): void {
  this._form?.removeEventListener('submit', this._onFormSubmit);
  this._form = form;
  this._form?.addEventListener('submit', this._onFormSubmit);
}

private _onFormSubmit = (): void => {
  this.disabled = true;
};
```

### formDisabledCallback(disabled)

Called when the element's disabled state changes as a result of a containing `<fieldset disabled>` being toggled. The browser propagates the disabled state to all form controls within the fieldset.

```typescript
formDisabledCallback(disabled: boolean): void {
  this.disabled = disabled;
  // Optionally update internal state, clear validation, etc.
}
```

Without this callback, a `<fieldset disabled>` will not affect your component. The CSS `:disabled` pseudo-class will not match. Screen readers will not announce the disabled state.

```html
<!-- formDisabledCallback is called on hx-text-input with disabled=true -->
<fieldset disabled>
  <legend>Account Information</legend>
  <hx-text-input name="username" label="Username"></hx-text-input>
</fieldset>
```

### formResetCallback()

Called when the form is reset — either by clicking a `<button type="reset">` or by calling `form.reset()` programmatically. Your component must restore its value to the initial default.

```typescript
formResetCallback(): void {
  this.value = '';
  this._internals.setFormValue('');
  // If the component shows errors, clear those too
  this._hasInteracted = false;
}
```

For controls that have a meaningful default value (a pre-selected option, an initial date, etc.), reset to that default rather than to an empty state:

```typescript
// hx-select: reset to the value present in HTML when the element was connected
private _defaultValue = '';

override connectedCallback(): void {
  super.connectedCallback();
  this._defaultValue = this.value;
}

formResetCallback(): void {
  this.value = this._defaultValue;
  this._internals.setFormValue(this._defaultValue);
  this._updateValidity();
}
```

### formStateRestoreCallback(state, mode)

Called when the browser restores form state — during back/forward navigation or session restoration. The browser passes back whatever was saved as the `state` argument to `setFormValue()`.

```typescript
formStateRestoreCallback(
  state: string,
  mode: 'restore' | 'autocomplete'
): void {
  // mode is 'restore' for back/forward, 'autocomplete' for browser autofill
  this.value = state;
  // Do NOT call setFormValue() here — the browser already has the value
}
```

For components that use a JSON state (see [setFormValue state parameter](#the-state-parameter) above):

```typescript
formStateRestoreCallback(state: string, _mode: 'restore' | 'autocomplete'): void {
  try {
    const parsed = JSON.parse(state) as string[];
    this._selected = parsed;
  } catch {
    this._selected = [];
  }
  this.requestUpdate();
}
```

**Do not call `setFormValue()` inside this callback.** The browser already has the value — you are receiving it back. Calling `setFormValue()` would create a redundant write.

---

## internals.form — Form Reference

The `form` property returns the `<form>` element that the custom element is currently associated with, or `null` if it is not inside a form (or if the association is broken by mismatched `form` attribute).

```typescript
/** Returns the associated HTMLFormElement, or null. */
get form(): HTMLFormElement | null {
  return this._internals.form;
}
```

This reference is live. If the element moves into or out of a form in the DOM, `internals.form` reflects the change immediately.

### Practical uses

**Reading submission action from the form:**

```typescript
private _handleClick(): void {
  if (this._internals.form) {
    console.log('Will submit to:', this._internals.form.action);
  }
}
```

**Checking whether a component is in a form context:**

```typescript
override connectedCallback(): void {
  super.connectedCallback();
  if (!this._internals.form) {
    console.warn(
      'hx-text-input is used outside a <form>. Form submission will not work.'
    );
  }
}
```

**Listening to form-level events:**

```typescript
formAssociatedCallback(form: HTMLFormElement | null): void {
  // Clean up any previous form listeners
  if (this._currentForm) {
    this._currentForm.removeEventListener('reset', this._onReset);
  }
  this._currentForm = form;
  this._currentForm?.addEventListener('reset', this._onReset);
}

private _onReset = (): void => {
  // Additional reset logic beyond formResetCallback
};
```

---

## Working with FormData

Once your component calls `setFormValue()`, it participates in `FormData` exactly like a native control. This requires no additional work.

### Native form submission

```html
<form action="/api/patients" method="POST">
  <hx-text-input name="first-name" label="First name" required></hx-text-input>
  <hx-text-input name="last-name" label="Last name" required></hx-text-input>
  <hx-text-input name="mrn" label="Medical Record Number"></hx-text-input>
  <button type="submit">Register Patient</button>
</form>
<!-- Browser serializes: first-name=...&last-name=...&mrn=... -->
```

### Reading FormData programmatically

```javascript
const form = document.querySelector('form');
const formData = new FormData(form);

// Read individual values
const firstName = formData.get('first-name');
const lastName = formData.get('last-name');

// Iterate all fields
for (const [name, value] of formData.entries()) {
  console.log(`${name}: ${value}`);
}
```

### AJAX submission

```javascript
const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const response = await fetch('/api/patients', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  console.log('Patient registered:', result);
});
```

### JSON submission

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
});
```

### The name attribute is required for submission

Controls without a `name` attribute are excluded from `FormData` — this matches native behavior:

```html
<!-- Included in FormData -->
<hx-text-input name="mrn" value="P-00441"></hx-text-input>

<!-- NOT included in FormData (no name) -->
<hx-text-input value="display-only"></hx-text-input>
```

---

## How hx-text-input Uses ElementInternals

The following is the complete form participation implementation from `packages/hx-library/src/components/hx-text-input/hx-text-input.ts`. This is the canonical pattern for all HELiX form controls.

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { ifDefined } from 'lit/directives/if-defined.js';

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // ─── Form Association ───────────────────────────────────────────────────

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ─────────────────────────────────────────────────────────

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

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      // Keep form value in sync whenever the property changes
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  // ─── Form Integration ────────────────────────────────────────────────────

  /** The associated HTMLFormElement, or null if not inside a form. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /** The current validation message, or an empty string if valid. */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** The ValidityState object with all constraint flags. */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Returns true if the control satisfies all constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Returns true if valid. Shows browser validation UI if invalid. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._input, // Anchor the tooltip to the native <input>
      );
    } else {
      this._internals.setValidity({});
    }
  }

  // ─── Form Lifecycle Callbacks ────────────────────────────────────────────

  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
    // No setFormValue() needed — browser already has the state
  }

  // ─── Public Methods ───────────────────────────────────────────────────────

  /** Moves focus to the internal input element. Required for label association. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  // ─── Event Handling ───────────────────────────────────────────────────────

  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);

    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _handleChange(e: Event): void {
    const target = e.target as HTMLInputElement;
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

  // ─── Render ───────────────────────────────────────────────────────────────

  private _inputId = `hx-text-input-${Math.random().toString(36).slice(2, 9)}`;
  private _errorId = `${this._inputId}-error`;

  override render() {
    const hasError = !!this.error;

    return html`
      <div class="field">
        <label class="field__label" for=${this._inputId}>
          <!-- label slot / label property -->
        </label>

        <input
          class="field__input"
          id=${this._inputId}
          type=${this.type}
          .value=${live(this.value)}
          ?required=${this.required}
          ?disabled=${this.disabled}
          name=${ifDefined(this.name || undefined)}
          aria-invalid=${hasError ? 'true' : nothing}
          aria-describedby=${ifDefined(hasError ? this._errorId : undefined)}
          aria-required=${this.required ? 'true' : nothing}
          @input=${this._handleInput}
          @change=${this._handleChange}
        />

        ${hasError
          ? html`
              <div class="field__error" id=${this._errorId} role="alert" aria-live="polite">
                ${this.error}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
```

---

## TypeScript Types for ElementInternals

`ElementInternals` is defined in TypeScript's built-in `lib.dom.d.ts`. The types are available as long as `"DOM"` is included in your `tsconfig.json` `lib` array. No `@types` package is required.

### Core type: ElementInternals

```typescript
interface ElementInternals {
  // Form value
  setFormValue(
    value: File | string | FormData | null,
    state?: File | string | FormData | null,
  ): void;

  // Validation
  setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;

  // Form reference
  readonly form: HTMLFormElement | null;

  // Labels (read-only)
  readonly labels: NodeList;

  // ARIA
  role: string | null;
  ariaLabel: string | null;
  // ... and all other ARIA properties
}
```

### Core type: ValidityStateFlags

```typescript
interface ValidityStateFlags {
  badInput?: boolean;
  customError?: boolean;
  patternMismatch?: boolean;
  rangeOverflow?: boolean;
  rangeUnderflow?: boolean;
  stepMismatch?: boolean;
  tooLong?: boolean;
  tooShort?: boolean;
  typeMismatch?: boolean;
  valueMissing?: boolean;
  // Note: 'valid' is NOT a flag you can set — it is computed
}
```

### Core type: ValidityState (read-only)

```typescript
interface ValidityState {
  readonly badInput: boolean;
  readonly customError: boolean;
  readonly patternMismatch: boolean;
  readonly rangeOverflow: boolean;
  readonly rangeUnderflow: boolean;
  readonly stepMismatch: boolean;
  readonly tooLong: boolean;
  readonly tooShort: boolean;
  readonly typeMismatch: boolean;
  readonly valid: boolean; // true only when all other flags are false
  readonly valueMissing: boolean;
}
```

### Lifecycle callback types

TypeScript knows about the form participation callbacks because they are part of the `HTMLElement` interface definition when `formAssociated = true` is used. You do not need to declare them with special types — just implement the methods with the correct signatures:

```typescript
// All return void — return values are ignored by the browser
formAssociatedCallback(form: HTMLFormElement | null): void { /* ... */ }
formDisabledCallback(disabled: boolean): void { /* ... */ }
formResetCallback(): void { /* ... */ }
formStateRestoreCallback(
  state: File | string | FormData,
  mode: 'restore' | 'autocomplete'
): void { /* ... */ }
```

### Strict typing for the internals field

Since `attachInternals()` always returns a non-null `ElementInternals` when called correctly, declare the field without `| null` and without `!` assertion:

```typescript
// Preferred: field is always initialized in the constructor
private _internals: ElementInternals;

constructor() {
  super();
  this._internals = this.attachInternals(); // Returns ElementInternals, never throws after formAssociated = true
}

// Avoid: non-null assertion suggests the field might be null
private _internals!: ElementInternals;

// Avoid: union with null adds unnecessary null checks everywhere
private _internals: ElementInternals | null = null;
```

---

## Browser Support

`ElementInternals` for form-associated custom elements is supported in:

| Browser       | Minimum version |
| ------------- | --------------- |
| Chrome / Edge | 77              |
| Firefox       | 93              |
| Safari        | 16.4            |

These versions cover all browsers in active support. For organizations that must support Safari 15 or earlier, install the polyfill:

```bash
npm install element-internals-polyfill
```

Import it once at your application entry point:

```typescript
import 'element-internals-polyfill';
```

The polyfill is transparent — it provides identical API surface and behavior in all browsers including IE11. In HELiX, the polyfill is included in the library's own entry point so consumers do not need to install it separately.

---

## Quick Reference

### The minimal form-associated component

```typescript
@customElement('hx-custom-input')
export class HelixCustomInput extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @query('input')
  private _input!: HTMLInputElement;

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('required')) {
      this._internals.setFormValue(this.value);
      this._internals.setValidity(
        this.required && !this.value ? { valueMissing: true } : {},
        this.required && !this.value ? 'This field is required.' : undefined,
        this._input,
      );
    }
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
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

  override render() {
    return html`<input
      .value=${live(this.value)}
      @input=${(e: Event) => {
        this.value = (e.target as HTMLInputElement).value;
      }}
    />`;
  }
}
```

### Checklist

- `static formAssociated = true` declared
- `attachInternals()` called in constructor
- `setFormValue()` called on every value change
- `setValidity()` called whenever value or constraint properties change
- `formResetCallback()` implemented (resets value and form value)
- `formStateRestoreCallback()` implemented (restores value, does not call setFormValue)
- `form`, `validity`, `validationMessage`, `checkValidity()`, `reportValidity()` exposed as public API
- `focus()` delegated to the internal focusable element
- `disabled` and `required` reflected (`reflect: true`) so CSS pseudo-classes work

---

## References

- [MDN: ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [MDN: HTMLElement: attachInternals()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals)
- [WHATWG: Form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements)
- [web.dev: More capable form controls](https://web.dev/articles/more-capable-form-controls)
- [Form Participation Fundamentals](/components/forms/fundamentals)
- [Form Validation Patterns](/components/forms/validation)
- [Custom Validation & Validity Messages](/components/forms/custom-validity)
