---
title: Testing Form Components
description: Testing form-associated web components, validation logic, and ElementInternals integration.
---

HELIX form components use the Form Association API (`ElementInternals`) to participate natively in HTML forms. This means they appear in `FormData`, respond to form reset, and integrate with the browser's constraint validation system — exactly like `<input>` and `<select>`. Testing this integration requires specific patterns that differ from testing ordinary components.

## The Form Association Contract

Every form-associated HELIX component must satisfy these contracts:

1. `static formAssociated = true` — declares the element as form-associated
2. `attachInternals()` — returns an `ElementInternals` instance in the constructor
3. `setFormValue()` — keeps the form data updated as the user interacts
4. `setValidity()` — reports constraint violations to the browser
5. `formResetCallback()` — called by the form element when it is reset
6. `formStateRestoreCallback()` — called on back/forward navigation state restoration

Testing each of these points validates the component's integration with the browser's form infrastructure.

## Verifying Form Association Declaration

The `formAssociated` static property is the entry point. Without it, none of the other form integration APIs work. Access it through the custom elements registry:

```typescript
import { describe, it, expect } from 'vitest';
import type { HelixTextInput } from './hx-text-input.js';
import './index.js';

it('has formAssociated = true', () => {
  const ctor = customElements.get('hx-text-input') as unknown as {
    formAssociated: boolean;
  };
  expect(ctor.formAssociated).toBe(true);
});
```

This does not require `fixture()` — it queries the registry directly and works synchronously.

## Testing ElementInternals Attachment

`attachInternals()` is called in the constructor. The `form` getter on the component delegates to `this._internals.form`. When a component is not inside a `<form>`, `form` returns `null`:

```typescript
import { fixture, cleanup } from '../../test-utils.js';
import type { HelixTextInput } from './hx-text-input.js';
import './index.js';

afterEach(cleanup);

it('form getter returns null when not inside a form', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input></hx-text-input>');
  expect(el.form).toBe(null);
});
```

When the component is placed inside a `<form>`, `form` returns the associated form element:

```typescript
it('form getter returns the containing form', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<hx-text-input name="test"></hx-text-input>';
  document.getElementById('test-fixture-container')!.appendChild(form);

  const el = form.querySelector('hx-text-input') as HelixTextInput;
  await el.updateComplete;

  expect(el.form).toBe(form);
});
```

Note that `fixture()` appends to the fixture container, not to a form. For form association tests, build the form manually and append to `test-fixture-container` so `cleanup()` can remove it.

## Testing Form Value Submission via FormData

The most important form association test: does the component's value appear in `FormData` when the form is submitted?

```typescript
it('value appears in FormData on form submission', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<hx-text-input name="patientName"></hx-text-input>';
  document.getElementById('test-fixture-container')!.appendChild(form);

  const el = form.querySelector('hx-text-input') as HelixTextInput;
  await el.updateComplete;

  // Set the component's value programmatically
  el.value = 'Jane Doe';
  await el.updateComplete;

  // Capture FormData directly — no need to submit
  const data = new FormData(form);
  expect(data.get('patientName')).toBe('Jane Doe');
});
```

### Full Submission Cycle Test

For a complete end-to-end form test, listen for the `submit` event and extract `FormData` from it:

```typescript
it('participates in form submission with correct value', async () => {
  const form = document.createElement('form');
  form.innerHTML = `
    <hx-text-input name="mrn" value="PAT-2026-00482"></hx-text-input>
    <hx-text-input name="email" value="jane@hospital.org"></hx-text-input>
    <button type="submit">Submit</button>
  `;
  document.getElementById('test-fixture-container')!.appendChild(form);

  // Wait for both components to render
  const inputs = form.querySelectorAll('hx-text-input');
  await Promise.all(Array.from(inputs).map((el) => (el as HelixTextInput).updateComplete));

  let submittedData: Record<string, FormDataEntryValue> = {};
  form.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();
    const fd = new FormData(form);
    submittedData = Object.fromEntries(fd.entries());
  });

  form.querySelector('button')!.click();
  await new Promise((r) => setTimeout(r, 50));

  expect(submittedData['mrn']).toBe('PAT-2026-00482');
  expect(submittedData['email']).toBe('jane@hospital.org');
});
```

## Testing setValidity and Validity State

`hx-text-input` calls `this._internals.setValidity()` to register constraint violations. Test validity through the public `validity`, `checkValidity()`, and `reportValidity()` APIs — not by reaching into `_internals`.

### Required + Empty: valueMissing

```typescript
it('validity.valueMissing is true when required and empty', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
  expect(el.validity.valueMissing).toBe(true);
});

it('checkValidity returns false when required and empty', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
  expect(el.checkValidity()).toBe(false);
});

it('checkValidity returns true when required and filled', async () => {
  const el = await fixture<HelixTextInput>(
    '<hx-text-input required value="filled"></hx-text-input>',
  );
  expect(el.checkValidity()).toBe(true);
});
```

### Validation Message

When a component is invalid, `validationMessage` must be a non-empty string:

```typescript
it('validationMessage is set when required and empty', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
  await el.updateComplete;
  expect(el.validationMessage).toBeTruthy();
  expect(el.validationMessage.length).toBeGreaterThan(0);
});

it('custom error message appears in validationMessage', async () => {
  const el = await fixture<HelixTextInput>(
    '<hx-text-input required error="MRN is required."></hx-text-input>',
  );
  await el.updateComplete;
  expect(el.validationMessage).toBe('MRN is required.');
});
```

### reportValidity

`reportValidity()` returns a boolean and triggers browser constraint validation UI:

```typescript
it('reportValidity returns false when required and empty', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
  expect(el.reportValidity()).toBe(false);
});

it('reportValidity returns true when required and filled', async () => {
  const el = await fixture<HelixTextInput>(
    '<hx-text-input required value="has-a-value"></hx-text-input>',
  );
  expect(el.reportValidity()).toBe(true);
});
```

### Validity Clears on Fill

After a required field receives a value, the `valueMissing` flag must clear:

```typescript
it('validity clears when required field receives a value', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
  expect(el.validity.valueMissing).toBe(true);

  el.value = 'now filled';
  await el.updateComplete;

  expect(el.validity.valueMissing).toBe(false);
  expect(el.checkValidity()).toBe(true);
});
```

## Testing formResetCallback

`formResetCallback()` is called by the browser when the owning form is reset. The component must clear its value and sync form data:

```typescript
it('formResetCallback resets value to empty string', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input value="hello"></hx-text-input>');
  expect(el.value).toBe('hello');

  el.formResetCallback();
  await el.updateComplete;

  expect(el.value).toBe('');
});
```

### Full Form Reset via the Form Element

More realistic: test that a native form reset triggers `formResetCallback`:

```typescript
it('value resets when the parent form is reset', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<hx-text-input name="firstName" value="Jane"></hx-text-input>';
  document.getElementById('test-fixture-container')!.appendChild(form);

  const el = form.querySelector('hx-text-input') as HelixTextInput;
  await el.updateComplete;

  expect(el.value).toBe('Jane');

  form.reset();
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 50));

  expect(el.value).toBe('');

  // Also verify FormData is cleared
  const data = new FormData(form);
  expect(data.get('firstName')).toBe('');
});
```

### Multiple Field Reset

When a form with multiple HELIX components is reset, all of them must clear:

```typescript
it('all hx-text-input fields reset on form.reset()', async () => {
  const form = document.createElement('form');
  form.innerHTML = `
    <hx-text-input name="a" value="Alice"></hx-text-input>
    <hx-text-input name="b" value="Bob"></hx-text-input>
  `;
  document.getElementById('test-fixture-container')!.appendChild(form);

  const [a, b] = Array.from(form.querySelectorAll('hx-text-input')) as HelixTextInput[];

  await a.updateComplete;
  await b.updateComplete;

  form.reset();
  await a.updateComplete;
  await b.updateComplete;
  await new Promise((r) => setTimeout(r, 50));

  expect(a.value).toBe('');
  expect(b.value).toBe('');
});
```

## Testing Disabled State Propagation

When a form is disabled (via `<fieldset disabled>`), all form-associated elements inside it should be disabled. The browser handles this for native elements; HELIX components that use `ElementInternals` also receive this automatically.

```typescript
it('component is disabled inside a disabled fieldset', async () => {
  const form = document.createElement('form');
  form.innerHTML = `
    <fieldset disabled>
      <hx-text-input name="field"></hx-text-input>
    </fieldset>
  `;
  document.getElementById('test-fixture-container')!.appendChild(form);

  const el = form.querySelector('hx-text-input') as HelixTextInput;
  await el.updateComplete;

  // ElementInternals-associated elements respond to fieldset[disabled]
  // Verify the native input inside the shadow DOM is disabled
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  expect(input.disabled).toBe(true);
});
```

## Testing Required Attribute and aria-required

The `required` property must propagate to both the native input and the ARIA attribute:

```typescript
it('required propagates to native input', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  expect(input.required).toBe(true);
});

it('required sets aria-required="true" on native input', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  expect(input.getAttribute('aria-required')).toBe('true');
});

it('required adds asterisk marker to label', async () => {
  const el = await fixture<HelixTextInput>(
    '<hx-text-input label="Email" required></hx-text-input>',
  );
  const marker = el.shadowRoot!.querySelector('.field__required-marker');
  expect(marker).toBeTruthy();
  expect(marker?.textContent).toBe('*');
});
```

## Testing Custom Validation Messages

Components can accept a custom `error` prop that overrides the default browser validation message:

```typescript
it('custom error message is displayed in the error div', async () => {
  const el = await fixture<HelixTextInput>(
    '<hx-text-input error="MRN format must be PAT-YYYY-NNNNN."></hx-text-input>',
  );
  const errorDiv = el.shadowRoot!.querySelector('[role="alert"]');
  expect(errorDiv).toBeTruthy();
  expect(errorDiv?.textContent?.trim()).toBe('MRN format must be PAT-YYYY-NNNNN.');
});

it('custom error sets aria-invalid="true" on native input', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input error="Invalid input"></hx-text-input>');
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  expect(input.getAttribute('aria-invalid')).toBe('true');
});
```

## Testing aria-invalid and aria-describedby Updates

Validation state changes must update ARIA attributes so screen readers can announce errors.

### aria-invalid on Validation State Change

```typescript
it('aria-invalid is not set when input is valid', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input label="Name"></hx-text-input>');
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  expect(input.hasAttribute('aria-invalid')).toBe(false);
});

it('aria-invalid="true" is set when error prop is provided', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input error="Required"></hx-text-input>');
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  expect(input.getAttribute('aria-invalid')).toBe('true');
});
```

### aria-describedby Links Input to Error

When there is an error, `aria-describedby` on the native input must reference the error element's `id`:

```typescript
it('aria-describedby references the error element ID', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input error="Bad input"></hx-text-input>');
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  const errorDiv = el.shadowRoot!.querySelector('.field__error')!;

  const describedBy = input.getAttribute('aria-describedby');
  expect(describedBy).toContain(errorDiv.id);
});
```

### aria-describedby References Help Text

When there is no error but help text is present, `aria-describedby` must reference the help text element:

```typescript
it('aria-describedby references the help text element ID', async () => {
  const el = await fixture<HelixTextInput>(
    '<hx-text-input help-text="Enter your MRN"></hx-text-input>',
  );
  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  const helpDiv = el.shadowRoot!.querySelector('.field__help-text')!;

  const describedBy = input.getAttribute('aria-describedby');
  expect(describedBy).toContain(helpDiv.id);
});
```

### Error Takes Priority Over Help Text

When both `error` and `help-text` are set, only the error is shown and only the error ID is referenced:

```typescript
it('error hides help text and references only the error ID', async () => {
  const el = await fixture<HelixTextInput>(
    '<hx-text-input error="Bad" help-text="Some guidance"></hx-text-input>',
  );

  const input = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
  const errorDiv = el.shadowRoot!.querySelector('.field__error');
  const helpDiv = el.shadowRoot!.querySelector('.field__help-text');

  expect(errorDiv).toBeTruthy();
  expect(helpDiv).toBeNull(); // Hidden when error is present

  const describedBy = input.getAttribute('aria-describedby');
  expect(describedBy).toContain(errorDiv!.id);
});
```

## Testing the Constraint Validation API

The constraint validation API (`checkValidity`, `reportValidity`, `validity`, `validationMessage`) is the standard interface for form validation. Test it as a complete contract:

```typescript
describe('Constraint Validation API', () => {
  it('checkValidity returns true for valid required input', async () => {
    const el = await fixture<HelixTextInput>(
      '<hx-text-input required value="valid"></hx-text-input>',
    );
    expect(el.checkValidity()).toBe(true);
  });

  it('checkValidity returns false for invalid required input', async () => {
    const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
    expect(el.checkValidity()).toBe(false);
  });

  it('reportValidity returns true for valid required input', async () => {
    const el = await fixture<HelixTextInput>(
      '<hx-text-input required value="valid"></hx-text-input>',
    );
    expect(el.reportValidity()).toBe(true);
  });

  it('reportValidity returns false for invalid required input', async () => {
    const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
    expect(el.reportValidity()).toBe(false);
  });

  it('validity.valueMissing is true for empty required input', async () => {
    const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
    expect(el.validity.valueMissing).toBe(true);
  });

  it('validity is valid when optional input is empty', async () => {
    const el = await fixture<HelixTextInput>('<hx-text-input></hx-text-input>');
    expect(el.validity.valid).toBe(true);
  });

  it('validationMessage is non-empty when invalid', async () => {
    const el = await fixture<HelixTextInput>('<hx-text-input required></hx-text-input>');
    await el.updateComplete;
    expect(el.validationMessage.length).toBeGreaterThan(0);
  });

  it('validationMessage is empty when valid', async () => {
    const el = await fixture<HelixTextInput>(
      '<hx-text-input required value="filled"></hx-text-input>',
    );
    await el.updateComplete;
    expect(el.validationMessage).toBe('');
  });
});
```

## Integration Test: Full Form Lifecycle

This test exercises the complete form lifecycle: render, fill, validate, submit, and reset.

```typescript
it('complete form lifecycle — fill, validate, submit, reset', async () => {
  const form = document.createElement('form');
  form.innerHTML = `
    <hx-text-input
      name="patientName"
      label="Patient Name"
      required
    ></hx-text-input>
    <hx-text-input
      name="mrn"
      label="MRN"
      required
      value="PAT-2026-00482"
    ></hx-text-input>
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  `;
  document.getElementById('test-fixture-container')!.appendChild(form);

  const [nameInput, mrnInput] = Array.from(
    form.querySelectorAll('hx-text-input'),
  ) as HelixTextInput[];

  await nameInput.updateComplete;
  await mrnInput.updateComplete;

  // 1. Empty required field is invalid
  expect(nameInput.checkValidity()).toBe(false);

  // 2. Pre-filled required field is valid
  expect(mrnInput.checkValidity()).toBe(true);

  // 3. Fill in the empty field
  nameInput.value = 'Jane Doe';
  await nameInput.updateComplete;
  expect(nameInput.checkValidity()).toBe(true);

  // 4. Submit — collect FormData
  let submittedData: Record<string, FormDataEntryValue> = {};
  form.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();
    submittedData = Object.fromEntries(new FormData(form).entries());
  });

  form.querySelector<HTMLButtonElement>('[type="submit"]')!.click();
  await new Promise((r) => setTimeout(r, 50));

  expect(submittedData['patientName']).toBe('Jane Doe');
  expect(submittedData['mrn']).toBe('PAT-2026-00482');

  // 5. Reset — all values cleared
  form.querySelector<HTMLButtonElement>('[type="reset"]')!.click();
  await nameInput.updateComplete;
  await mrnInput.updateComplete;
  await new Promise((r) => setTimeout(r, 50));

  expect(nameInput.value).toBe('');
  expect(mrnInput.value).toBe('');
});
```

## Summary

| Contract               | What to Test             | Key Assertion                                   |
| ---------------------- | ------------------------ | ----------------------------------------------- |
| `formAssociated`       | Static property exists   | `ctor.formAssociated === true`                  |
| `form` getter          | Returns form or null     | `el.form === form` / `null`                     |
| FormData participation | Value in FormData        | `new FormData(form).get(name) === value`        |
| `setValidity`          | validity flags           | `el.validity.valueMissing === true`             |
| `checkValidity()`      | Returns boolean          | `true` / `false` per state                      |
| `reportValidity()`     | Returns boolean          | `true` / `false` per state                      |
| `validationMessage`    | Non-empty when invalid   | `.length > 0`                                   |
| `formResetCallback()`  | Value clears             | `el.value === ''` after reset                   |
| Form reset propagation | Browser triggers reset   | `form.reset()` clears all fields                |
| `aria-invalid`         | Set when error           | `input.getAttribute('aria-invalid') === 'true'` |
| `aria-describedby`     | References error/help ID | `describedBy.includes(errorDiv.id)`             |
| Required asterisk      | Marker in label          | `.field__required-marker` exists                |

---

**Related:**

- [Testing Events](/components/testing/event-testing) — `hx-input`, `hx-change`, event payloads
- [Testing Shadow DOM](/components/testing/shadow-dom) — `shadowQuery`, fixture, cleanup
- [Accessibility Engineer](/components/accessibility/) — ARIA requirements for form components
