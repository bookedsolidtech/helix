---
title: Form Association Patterns
description: Patterns for form-associated HELiX components including name/value properties, complex FormData contributions, and state restoration.
---

Form association is more than setting a value. A well-built form control manages its `name` and `value` properties, contributes correctly to `FormData`, supports complex multi-value controls, restores state from autofill, and participates in form reset. This page covers each pattern in depth.

## The `formAssociated` Property

```typescript
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  static override formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }
}
```

`formAssociated = true` is all the browser needs to include the element in form submission, expose `this._internals.form`, and call the form lifecycle callbacks.

## `name` and `value` Properties

Every form control needs `name` and `value`. The `name` property determines the key in `FormData`; `value` is what gets submitted.

```typescript
@property({ type: String }) name = '';
@property({ type: String }) value = '';

override updated(changed: PropertyValues) {
  super.updated(changed);
  if (changed.has('value')) {
    this._internals.setFormValue(this.value);
  }
}
```

Keep `name` as a reflected attribute — HTML authors set it as an attribute, JavaScript consumers read it as a property:

```typescript
@property({ type: String, reflect: true }) name = '';
```

## `setFormValue(value, state?)` for Complex Controls

`setFormValue` accepts a `string`, `File`, `FormData`, or `null`. For complex controls, `FormData` lets you submit multiple key/value pairs under different names:

```typescript
// Simple string value — most controls
this._internals.setFormValue(this.value);

// Null — opt out of submission (e.g., unchecked checkbox)
this._internals.setFormValue(null);

// FormData — submit multiple values
const data = new FormData();
data.append('start', this._startDate);
data.append('end', this._endDate);
this._internals.setFormValue(data);
```

The optional second `state` argument is a serialized representation of the internal state used by `formStateRestoreCallback`. It can differ from the submission value when the control's internal representation differs from what gets submitted:

```typescript
// Submit only the ID, but restore the full object
this._internals.setFormValue(
  selectedItem.id,           // form submission value
  JSON.stringify(selectedItem) // state for restore
);
```

## Multiple Values with `FormData`

A date-range picker that needs to submit both a start and end date:

```typescript
@customElement('hx-date-range')
export class HelixDateRange extends LitElement {
  static override formAssociated = true;

  @property({ type: String }) name = '';
  @property({ type: String }) startDate = '';
  @property({ type: String }) endDate = '';

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has('startDate') || changed.has('endDate')) {
      this._updateFormValue();
    }
  }

  private _updateFormValue() {
    if (!this.startDate && !this.endDate) {
      this._internals.setFormValue(null);
      return;
    }

    const data = new FormData();
    if (this.startDate) data.append(`${this.name}[start]`, this.startDate);
    if (this.endDate)   data.append(`${this.name}[end]`, this.endDate);
    this._internals.setFormValue(data);
  }

  formResetCallback() {
    this.startDate = '';
    this.endDate = '';
    this._updateFormValue();
  }

  override render() {
    return html`
      <input
        type="date"
        .value=${this.startDate}
        @input=${(e: InputEvent) => {
          this.startDate = (e.target as HTMLInputElement).value;
        }}
      />
      <span> to </span>
      <input
        type="date"
        .value=${this.endDate}
        @input=${(e: InputEvent) => {
          this.endDate = (e.target as HTMLInputElement).value;
        }}
      />
    `;
  }
}
```

## Restore Callback for Autofill

The browser calls `formStateRestoreCallback` when it wants to restore the control's state — after a back/forward navigation, after an autofill, or when the browser re-renders a cached page.

```typescript
formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete') {
  if (typeof state === 'string') {
    this.value = state;
    this._internals.setFormValue(state);
  }
}
```

The `mode` argument tells you why the restore is happening:
- `'restore'` — browser is restoring saved state (back navigation, bfcache)
- `'autocomplete'` — browser's autofill is setting the value

## HELiX Example: `hx-checkbox` Form Association

```typescript
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  static override formAssociated = true;

  static override styles = [
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--hx-spacing-sm);
        cursor: pointer;
        user-select: none;
      }
    `,
  ];

  @property({ type: String, reflect: true }) name = '';
  @property({ type: String }) value = 'on';
  @property({ type: Boolean, reflect: true }) checked = false;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._updateFormValue();
  }

  formResetCallback() {
    this.checked = false;
    this._updateFormValue();
  }

  private _updateFormValue() {
    this._internals.setFormValue(this.checked ? this.value : null);
  }

  private _handleChange(e: Event) {
    this.checked = (e.target as HTMLInputElement).checked;
    this._updateFormValue();
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        detail: { checked: this.checked, value: this.checked ? this.value : null },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <input
        type="checkbox"
        .checked=${this.checked}
        @change=${this._handleChange}
      />
      <slot></slot>
    `;
  }
}
```

## Next Steps

- [Element Internals and Form Association](/components-guide/forms/element-internals/) — `attachInternals()` setup
- [Form Validation](/components-guide/forms/validation/) — constraint validation with `setValidity()`
- [Submit Handling](/components-guide/forms/submit-handling/) — reading values at submit time
