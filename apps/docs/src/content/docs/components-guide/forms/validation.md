---
title: Form Validation
description: Implement native constraint validation in HELiX form controls using ElementInternals.setValidity() and validity flags.
---

HELiX form controls use the native HTML Constraint Validation API through `ElementInternals`. This gives custom elements the same validation behavior as built-in inputs: `:valid` / `:invalid` CSS pseudo-classes, `checkValidity()`, `reportValidity()`, browser tooltip messages, and participation in `<form>` submit validation.

## Validity Flags

The browser tracks validation state through a set of boolean flags in `ValidityState`. Each flag corresponds to a built-in constraint type:

| Flag | Condition |
|---|---|
| `valueMissing` | `required` attribute set and value is empty |
| `typeMismatch` | Value doesn't match the expected format (e.g., email format) |
| `patternMismatch` | Value doesn't match a `pattern` attribute regex |
| `tooLong` | Value exceeds `maxlength` |
| `tooShort` | Value is shorter than `minlength` |
| `rangeUnderflow` | Value is below `min` |
| `rangeOverflow` | Value is above `max` |
| `stepMismatch` | Value doesn't conform to `step` |
| `badInput` | Browser can't convert the input to a value |
| `customError` | Custom validation via `setCustomValidity()` or `setValidity({ customError: true }, ...)` |

## `setValidity()` Usage

```typescript
private _validate() {
  const value = this.value;

  // Reset — mark valid (clears all flags)
  if (value.length > 0 && value.includes('@')) {
    this._internals.setValidity({});
    return;
  }

  // Required and empty
  if (this.required && !value) {
    this._internals.setValidity(
      { valueMissing: true },
      'This field is required.',
      this._input // optional anchor element for tooltip positioning
    );
    return;
  }

  // Value present but invalid format
  if (value && !value.includes('@')) {
    this._internals.setValidity(
      { typeMismatch: true },
      'Please enter a valid email address.',
      this._input
    );
    return;
  }
}
```

The third argument to `setValidity()` is the **anchor element** — typically the native input inside the shadow root. The browser uses it to position its native validation tooltip.

## Custom Validation

For validation logic that doesn't map to a built-in flag, use `customError`:

```typescript
private async _validateUsername(username: string) {
  if (!username) {
    this._internals.setValidity({ valueMissing: true }, 'Username is required.');
    return;
  }

  if (username.length < 3) {
    this._internals.setValidity(
      { tooShort: true },
      'Username must be at least 3 characters.',
      this._input
    );
    return;
  }

  // Custom async check — flag it as customError while checking
  const taken = await checkUsernameAvailability(username);
  if (taken) {
    this._internals.setValidity(
      { customError: true },
      'This username is already taken.',
      this._input
    );
  } else {
    this._internals.setValidity({});
  }
}
```

## `checkValidity()` and `reportValidity()`

Both methods trigger validation. `reportValidity()` additionally shows the browser's built-in error tooltip:

```typescript
// Returns true/false, fires 'invalid' event if invalid
const isValid = this._internals.checkValidity();

// Returns true/false, fires 'invalid' event, AND shows browser tooltip
const isValid = this._internals.reportValidity();
```

Calling these from outside the component also works:

```javascript
const input = document.querySelector('hx-text-input');
input.checkValidity();  // true or false
input.reportValidity(); // true or false + shows browser tooltip
```

For `checkValidity()` and `reportValidity()` to be callable on the custom element from outside, the component must expose these methods on its public interface:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // ...

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }
}
```

## `:invalid` and `:valid` CSS Pseudo-Classes

Once `setValidity()` is wired up, the browser automatically applies `:valid` and `:invalid` to the host element. Use `:host(:invalid)` and `:host(:valid)` in the component stylesheet:

```typescript
static override styles = [
  css`
    :host {
      display: block;
    }

    input {
      border: 1px solid var(--hx-color-neutral-300);
      border-radius: var(--hx-border-radius-sm);
      padding: var(--hx-spacing-sm) var(--hx-spacing-md);
      font-size: var(--hx-font-size-base);
      transition: border-color var(--hx-motion-duration-fast);
    }

    /* Applied by browser when validity is invalid */
    :host(:invalid) input {
      border-color: var(--hx-color-error-500);
      box-shadow: 0 0 0 2px var(--hx-color-error-100);
    }

    /* Applied by browser when validity is valid and value is non-empty */
    :host(:valid:not(:placeholder-shown)) input {
      border-color: var(--hx-color-success-500);
    }
  `,
];
```

## Integration with `<form novalidate>`

Some applications manage validation entirely in JavaScript and suppress the browser's native UI with `novalidate` on the form:

```html
<form id="my-form" novalidate>
  <hx-text-input name="email" required></hx-text-input>
  <button type="submit">Submit</button>
</form>
```

```javascript
document.getElementById('my-form').addEventListener('submit', (e) => {
  e.preventDefault();

  // Manually check all form controls
  let valid = true;
  for (const el of e.target.elements) {
    if (!el.checkValidity?.()) {
      valid = false;
      // Handle UI error display yourself
    }
  }

  if (valid) {
    // Submit
  }
});
```

With `novalidate`, the browser still tracks validity state via `ElementInternals` — it just doesn't show tooltips or block submission automatically. Your custom validation UI can read `element.validity` and `element.validationMessage` at any time.

## Full Validation Lifecycle

```
User types  →  _handleInput()  →  setFormValue()  →  _validate()  →  setValidity()
                                                                         ↓
Form submit  →  browser checks each form control  →  :valid/:invalid CSS updated
                                                      checkValidity() / reportValidity() available
```

## Next Steps

- [Custom Validity](/components-guide/forms/custom-validity/) — custom error messages and async validation
- [Element Internals and Form Association](/components-guide/forms/element-internals/) — `setFormValue()` and form lifecycle
- [Form Accessibility](/components-guide/forms/accessibility/) — `aria-invalid` alongside `:invalid`
