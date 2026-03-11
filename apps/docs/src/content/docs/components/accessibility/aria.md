---
title: ARIA Patterns for Components
description: Comprehensive guide to ARIA roles, attributes, state management, and labeling strategies for accessible web components in the HELiX component library
sidebar:
  order: 2
---

# ARIA Patterns for Components

Accessible Rich Internet Applications (ARIA) is a W3C specification that defines how to make web content and applications more accessible to people with disabilities. In the context of web components, ARIA bridges the gap between custom UI patterns and assistive technology expectations. This guide provides a comprehensive reference for implementing ARIA patterns in HELiX components, with real-world examples from the hx-library.

## ARIA Overview

ARIA was created to solve a fundamental problem: native HTML elements have built-in semantics that assistive technologies understand, but custom JavaScript widgets often don't. When you build an interactive UI element using `<div>` and `<span>` tags, screen readers have no way to know what that element represents or how to interact with it.

### When to Use ARIA

The first rule of ARIA is: **don't use ARIA**. Native HTML elements should always be your first choice because they have built-in keyboard support, focus management, and semantics. Use ARIA only when:

1. **No native HTML element exists** — e.g., tabs, accordions, comboboxes
2. **You need to augment native semantics** — e.g., adding `aria-invalid` to an `<input>` during validation
3. **You're building complex interactions** — e.g., drag-and-drop interfaces, tree views
4. **You need to provide additional context** — e.g., `aria-describedby` linking to help text

### Native HTML First

In `hx-button`, we use a native `<button>` element inside the shadow DOM:

```typescript
// ✅ Good: Native element with ARIA augmentation
render() {
  return html`
    <button
      part="button"
      ?disabled=${this.disabled}
      aria-disabled=${this.disabled ? 'true' : nothing}
    >
      <slot></slot>
    </button>
  `;
}

// ❌ Bad: Recreating a button from scratch
render() {
  return html`
    <div
      role="button"
      tabindex="0"
      aria-disabled=${this.disabled ? 'true' : nothing}
      @click=${this._handleClick}
      @keydown=${this._handleKeydown}
    >
      <slot></slot>
    </div>
  `;
}
```

The native `<button>` gives you keyboard support (Enter/Space), focus management, and form integration for free. The ARIA attribute `aria-disabled` augments this by ensuring screen readers announce the disabled state even when CSS hides visual indicators.

## ARIA Roles Catalog

ARIA roles define what an element represents in the accessibility tree. Roles are divided into several categories.

### Widget Roles

Widget roles represent interactive UI elements.

#### button

A clickable element that triggers an action. Always prefer native `<button>` elements.

```html
<!-- Native button (preferred) -->
<button>Submit</button>

<!-- Custom button (only when necessary) -->
<div role="button" tabindex="0">Submit</div>
```

**HELiX usage**: `hx-button` uses a native `<button>` element and does not apply `role="button"` because it's redundant.

#### checkbox

A checkable input in one of two states: checked or unchecked.

```html
<div role="checkbox" aria-checked="false" tabindex="0">Accept terms</div>
```

**HELiX usage**: `hx-checkbox` uses a native `<input type="checkbox">` and manages `aria-invalid`, `aria-describedby`, and `aria-labelledby`:

```typescript
<input
  class="checkbox__input"
  type="checkbox"
  .checked=${live(this.checked)}
  aria-invalid=${hasError ? 'true' : nothing}
  aria-describedby=${ifDefined(describedBy)}
  aria-labelledby=${this._labelId}
/>
```

#### radio

A checkable input in a group of radio buttons where only one can be checked at a time.

```html
<div role="radio" aria-checked="true" tabindex="0">Option 1</div>
<div role="radio" aria-checked="false" tabindex="-1">Option 2</div>
```

**HELiX usage**: `hx-radio` uses a native `<input type="radio">` and is managed by `hx-radio-group`, which implements roving tabindex.

#### radiogroup

A group of radio buttons.

```html
<div role="radiogroup" aria-labelledby="group-label">
  <div id="group-label">Choose one:</div>
  <div role="radio" aria-checked="true">Option 1</div>
  <div role="radio" aria-checked="false">Option 2</div>
</div>
```

**HELiX usage**: `hx-radio-group` sets `role="radiogroup"` on the host element:

```typescript
override connectedCallback(): void {
  super.connectedCallback();
  this.setAttribute('role', 'radiogroup');
}
```

#### switch

A type of checkbox representing on/off values.

```html
<button role="switch" aria-checked="false">
  <span>Notifications</span>
</button>
```

**HELiX usage**: `hx-switch` uses a native `<button>` with `role="switch"` and manages `aria-checked`:

```typescript
<button
  part="track"
  class="switch__track"
  type="button"
  role="switch"
  aria-checked=${this.checked ? 'true' : 'false'}
  aria-labelledby=${ifDefined(hasLabel ? this._labelId : undefined)}
  ?disabled=${this.disabled}
>
  <span part="thumb" class="switch__thumb"></span>
</button>
```

#### combobox

A composite widget containing a single-line textbox and a listbox popup.

```html
<input
  type="text"
  role="combobox"
  aria-expanded="false"
  aria-autocomplete="list"
  aria-controls="listbox-id"
/>
<ul id="listbox-id" role="listbox">
  <li role="option">Option 1</li>
</ul>
```

**HELiX usage**: Not yet implemented. Planned for `hx-combobox`.

#### textbox

A single-line text input (implicit role for `<input type="text">`).

```html
<input type="text" aria-label="Search" />
```

**HELiX usage**: `hx-text-input` uses a native `<input>` element and augments it with validation attributes:

```typescript
<input
  part="input"
  type=${this.type}
  .value=${live(this.value)}
  ?required=${this.required}
  aria-invalid=${hasError ? 'true' : nothing}
  aria-describedby=${ifDefined(describedBy)}
  aria-required=${this.required ? 'true' : nothing}
/>
```

### Document Structure Roles

#### alert

An important, usually time-sensitive message. Screen readers announce alerts immediately.

```html
<div role="alert">Your session will expire in 5 minutes.</div>
```

**HELiX usage**: `hx-alert` dynamically determines whether to use `role="alert"` or `role="status"` based on the variant:

```typescript
private get _role(): string {
  return this._isAssertive ? 'alert' : 'status';
}

render() {
  return html`
    <div role=${this._role} aria-live=${this._ariaLive}>
      <!-- Alert content -->
    </div>
  `;
}
```

Error and warning variants use `role="alert"` with `aria-live="assertive"`, while info and success variants use `role="status"` with `aria-live="polite"`.

#### status

An advisory message that is not urgent.

```html
<div role="status" aria-live="polite">File saved successfully.</div>
```

**HELiX usage**: Used in `hx-alert` for non-critical messages (info, success).

#### dialog

A modal window that requires user interaction.

```html
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Confirm Action</h2>
  <p>Are you sure?</p>
</div>
```

**HELiX usage**: Not yet implemented. Planned for `hx-modal`.

### Landmark Roles

#### form

A region containing form controls.

```html
<form role="form" aria-labelledby="form-title">
  <h2 id="form-title">Contact Us</h2>
  <!-- Form fields -->
</form>
```

**HELiX usage**: `hx-form` uses a native `<form>` element. The `role="form"` is implicit but can be added for clarity.

## ARIA Attributes Reference

ARIA attributes fall into several categories: states, properties, relationships, and live region attributes.

### State Attributes

State attributes describe the current state of an element and are expected to change during the element's lifetime.

#### aria-checked

Indicates the checked state of checkboxes, radio buttons, and switches.

**Values**: `"true"`, `"false"`, `"mixed"` (for indeterminate checkboxes)

```html
<input type="checkbox" aria-checked="true" />
<div role="checkbox" aria-checked="mixed">Select all</div>
```

**HELiX usage**: In `hx-checkbox`, we use the native `checked` property and add `aria-checked` indirectly through the native input. In `hx-switch`, we explicitly manage it:

```typescript
<button role="switch" aria-checked=${this.checked ? 'true' : 'false'}>
```

#### aria-disabled

Indicates that the element is perceivable but not interactive.

**Values**: `"true"`, `"false"`

**Why use it?** The native `disabled` attribute is sufficient for `<button>` and form elements, but `aria-disabled` ensures screen readers announce the disabled state even when the element is styled to be partially visible or when using custom interactions.

```html
<button disabled aria-disabled="true">Submit</button>
```

**HELiX usage**: In `hx-button`:

```typescript
<button
  ?disabled=${this.disabled}
  aria-disabled=${this.disabled ? 'true' : nothing}
>
  <slot></slot>
</button>
```

The `nothing` sentinel from Lit removes the attribute entirely when `disabled` is false, rather than setting it to an empty string.

#### aria-expanded

Indicates whether a collapsible element is expanded or collapsed.

**Values**: `"true"`, `"false"`, `undefined` (when not applicable)

```html
<button aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" hidden>
  <li>Item 1</li>
</ul>
```

**HELiX usage**: Not yet implemented. Planned for `hx-accordion`, `hx-select` (dropdown state), and `hx-disclosure`.

#### aria-invalid

Indicates that the value entered does not conform to the expected format.

**Values**: `"true"`, `"false"`, `"grammar"`, `"spelling"`

```html
<input type="email" aria-invalid="true" aria-describedby="email-error" />
<div id="email-error" role="alert">Please enter a valid email.</div>
```

**HELiX usage**: In all form components (`hx-text-input`, `hx-select`, `hx-checkbox`, etc.):

```typescript
<input
  aria-invalid=${hasError ? 'true' : nothing}
  aria-describedby=${ifDefined(describedBy)}
/>
```

When `error` is set, the input gets `aria-invalid="true"` and `aria-describedby` points to the error message, which has `role="alert"`.

#### aria-pressed

Indicates the pressed state of toggle buttons.

**Values**: `"true"`, `"false"`, `"mixed"`

```html
<button aria-pressed="false">Bold</button>
```

**HELiX usage**: Not yet implemented. Planned for `hx-toggle-button`.

#### aria-selected

Indicates the selected state of options in a listbox, tab, or tree.

**Values**: `"true"`, `"false"`

```html
<div role="tab" aria-selected="true">Tab 1</div>
<div role="tab" aria-selected="false">Tab 2</div>
```

**HELiX usage**: Not yet implemented. Planned for `hx-tabs`.

### Property Attributes

Property attributes describe characteristics of an element that are unlikely to change.

#### aria-label

Provides a text label for an element when no visible label exists.

**Values**: String

```html
<button aria-label="Close dialog">
  <svg><!-- X icon --></svg>
</button>
```

**HELiX usage**: In `hx-alert`, the close button uses `aria-label`:

```typescript
<button
  part="close-button"
  class="alert__close-button"
  aria-label="Close"
  @click=${this._handleClose}
>
  ${this._renderCloseIcon()}
</button>
```

In `hx-text-input` and `hx-select`, consumers can provide `aria-label` when a visible label isn't appropriate:

```typescript
@property({ type: String, attribute: 'aria-label' })
override ariaLabel: string | null = null;
```

```html
<hx-text-input aria-label="Search" placeholder="Search..."></hx-text-input>
```

#### aria-labelledby

References one or more elements that label the current element.

**Values**: Space-separated list of IDs

```html
<h2 id="dialog-title">Confirm Action</h2>
<div role="dialog" aria-labelledby="dialog-title">
  <!-- Dialog content -->
</div>
```

**HELiX usage**: In `hx-checkbox`, the label is associated with the input via `aria-labelledby`:

```typescript
<input
  aria-labelledby=${this._labelId}
/>
<span part="label" id=${this._labelId}>
  <slot>${this.label}</slot>
</span>
```

This pattern is necessary in shadow DOM because the native `for` attribute doesn't work across shadow boundaries.

In `hx-switch`:

```typescript
<button
  role="switch"
  aria-labelledby=${ifDefined(hasLabel ? this._labelId : undefined)}
>
  <span class="switch__thumb"></span>
</button>
<span id=${this._labelId}>
  <slot>${this.label}</slot>
</span>
```

#### aria-describedby

References one or more elements that describe the current element.

**Values**: Space-separated list of IDs

```html
<input type="email" aria-describedby="email-help email-error" />
<div id="email-help">We'll never share your email.</div>
<div id="email-error" role="alert">Invalid email format.</div>
```

**HELiX usage**: All form components use `aria-describedby` to link to help text and error messages:

```typescript
const describedBy =
  [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
    .filter(Boolean)
    .join(' ') || undefined;

return html`
  <input aria-describedby=${ifDefined(describedBy)} />

  ${hasError ? html`<div id=${this._errorId} role="alert">${this.error}</div>` : nothing}
  ${this.helpText ? html`<div id=${this._helpTextId}>${this.helpText}</div>` : nothing}
`;
```

The `.filter(Boolean)` removes null values, and `|| undefined` ensures we pass `undefined` (not an empty string) when there's no description, allowing Lit's `ifDefined` to omit the attribute entirely.

#### aria-required

Indicates that user input is required before form submission.

**Values**: `"true"`, `"false"`

```html
<input type="text" required aria-required="true" />
```

**HELiX usage**: All form components augment the native `required` attribute with `aria-required`:

```typescript
<input
  ?required=${this.required}
  aria-required=${this.required ? 'true' : nothing}
/>
```

This ensures screen readers announce the required state even when the native attribute isn't supported (e.g., in custom elements before form association was widely supported).

#### aria-hidden

Removes an element from the accessibility tree.

**Values**: `"true"`, `"false"`

**Use cases**:

- Decorative icons that are redundant with adjacent text
- Duplicate content rendered for visual layout
- Content hidden with CSS that should remain hidden to screen readers

```html
<button>
  <svg aria-hidden="true"><!-- Icon --></svg>
  Save
</button>
```

**HELiX usage**: In `hx-checkbox`, the visual checkmark SVG is marked as `aria-hidden`:

```typescript
<svg
  class="checkbox__icon checkbox__icon--check"
  viewBox="0 0 16 16"
  aria-hidden="true"
>
  <polyline points="3.5 8 6.5 11 12.5 5"></polyline>
</svg>
```

In `hx-alert`, the required marker asterisk is decorative:

```html
<span class="field__required-marker" aria-hidden="true">*</span>
```

Screen readers already announce "required" via `aria-required`, so the visual asterisk is redundant.

### Live Region Attributes

Live regions announce dynamic content changes to screen readers.

#### aria-live

Indicates that an element will be updated and describes the urgency of updates.

**Values**:

- `"off"` — Updates are not announced (default)
- `"polite"` — Announce when the user is idle
- `"assertive"` — Announce immediately, interrupting the user

```html
<div aria-live="polite" role="status">Loading...</div>
```

**HELiX usage**: In `hx-alert`:

```typescript
private get _ariaLive(): string {
  return this._isAssertive ? 'assertive' : 'polite';
}

render() {
  return html`
    <div role=${this._role} aria-live=${this._ariaLive}>
      <!-- Alert content -->
    </div>
  `;
}
```

Error and warning alerts use `aria-live="assertive"` to interrupt the user immediately, while info and success alerts use `aria-live="polite"` to wait until the user is idle.

In form components, error messages use `aria-live="polite"`:

```typescript
${hasError
  ? html`<div
      id=${this._errorId}
      role="alert"
      aria-live="polite"
    >
      ${this.error}
    </div>`
  : nothing}
```

The `role="alert"` is equivalent to `aria-live="assertive"`, but we explicitly set `aria-live="polite"` to make validation errors less intrusive.

#### aria-atomic

Indicates whether assistive technologies should present all or part of the changed region.

**Values**: `"true"`, `"false"`

```html
<div aria-live="polite" aria-atomic="true"><span>Items: </span><span>5</span></div>
```

When `aria-atomic="true"`, screen readers announce "Items: 5" instead of just "5" when the count changes.

**HELiX usage**: Not explicitly used. The default behavior (atomic by role) is sufficient for our components.

## State Management

Managing ARIA states correctly is critical for accessibility. States must stay in sync with the component's internal state.

### Checkbox State

`hx-checkbox` manages three states: checked, unchecked, and indeterminate.

```typescript
@property({ type: Boolean, reflect: true })
checked = false;

@property({ type: Boolean })
indeterminate = false;

render() {
  return html`
    <input
      type="checkbox"
      .checked=${live(this.checked)}
      .indeterminate=${live(this.indeterminate)}
      aria-invalid=${hasError ? 'true' : nothing}
    />
  `;
}
```

The `live()` directive ensures that Lit updates the property even if the value hasn't changed, which is necessary for `indeterminate` because it's a property-only state (no HTML attribute exists for it).

### Radio Group State

`hx-radio-group` manages selection state and roving tabindex.

```typescript
private _syncRadios(): void {
  const radios = this._getRadios();
  const enabledRadios = this._getEnabledRadios();

  radios.forEach((radio) => {
    radio.checked = radio.value === this.value && this.value !== '';
    radio.tabIndex = -1; // Remove from tab order
  });

  // Apply roving tabindex
  const checkedRadio = enabledRadios.find((r) => r.checked);
  if (checkedRadio) {
    checkedRadio.tabIndex = 0;
  } else if (enabledRadios.length > 0) {
    enabledRadios[0].tabIndex = 0;
  }
}
```

This implements the roving tabindex pattern: only one radio button is in the tab order at a time, and arrow keys move focus between radios.

### Switch State

`hx-switch` uses `aria-checked` to reflect the toggle state:

```typescript
<button
  role="switch"
  aria-checked=${this.checked ? 'true' : 'false'}
  @click=${this._handleClick}
>
```

The `aria-checked` attribute must always be present and must always be `"true"` or `"false"` (not omitted when false).

### Error State

All form components manage error state consistently:

```typescript
@property({ type: String })
error = '';

render() {
  const hasError = !!this.error;

  return html`
    <input
      aria-invalid=${hasError ? 'true' : nothing}
      aria-describedby=${ifDefined(hasError ? this._errorId : undefined)}
    />

    ${hasError
      ? html`<div
          id=${this._errorId}
          role="alert"
          aria-live="polite"
        >
          ${this.error}
        </div>`
      : nothing}
  `;
}
```

When `error` is set:

1. `aria-invalid="true"` is added to the input
2. `aria-describedby` points to the error message
3. The error message has `role="alert"` and `aria-live="polite"`
4. Screen readers announce the error immediately when it appears

## Live Regions

Live regions announce dynamic content changes without moving focus.

### Alert vs. Status

Use `role="alert"` (implicit `aria-live="assertive"`) for critical messages that require immediate attention:

```html
<div role="alert">Your session has expired. Please log in again.</div>
```

Use `role="status"` (implicit `aria-live="polite"`) for non-critical status updates:

```html
<div role="status">Draft saved at 3:42 PM.</div>
```

**HELiX usage**: `hx-alert` dynamically selects the appropriate role:

```typescript
private get _isAssertive(): boolean {
  return this.variant === 'error' || this.variant === 'warning';
}

private get _role(): string {
  return this._isAssertive ? 'alert' : 'status';
}
```

### Form Validation Messages

Form validation messages should use `role="alert"` with `aria-live="polite"`:

```typescript
${hasError
  ? html`<div
      id=${this._errorId}
      role="alert"
      aria-live="polite"
    >
      ${this.error}
    </div>`
  : nothing}
```

The `polite` setting prevents validation errors from interrupting screen reader announcements of the current field.

### Loading States

For loading indicators, use `role="status"` with `aria-live="polite"`:

```html
<div role="status" aria-live="polite" aria-busy="true">Loading results...</div>
```

When loading completes, update the region:

```html
<div role="status" aria-live="polite" aria-busy="false">Loaded 42 results.</div>
```

**HELiX usage**: Not yet implemented. Planned for `hx-spinner` and async data components.

## Descriptions

`aria-describedby` links an element to descriptive text. Use it for:

- Help text explaining how to use a field
- Error messages describing validation failures
- Additional context that's not part of the label

### Help Text

```typescript
<input
  aria-describedby=${this._helpTextId}
/>
<div id=${this._helpTextId}>
  Password must be at least 8 characters.
</div>
```

**HELiX usage**: All form components support help text:

```typescript
@property({ type: String, attribute: 'help-text' })
helpText = '';

render() {
  const describedBy = this.helpText ? this._helpTextId : undefined;

  return html`
    <input aria-describedby=${ifDefined(describedBy)} />

    ${this.helpText
      ? html`<div id=${this._helpTextId}>${this.helpText}</div>`
      : nothing}
  `;
}
```

### Error Messages

Error messages should be included in `aria-describedby` alongside help text:

```typescript
const describedBy =
  [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
    .filter(Boolean)
    .join(' ') || undefined;
```

This ensures screen readers announce both the help text and any errors when the field receives focus.

### Multiple Descriptions

`aria-describedby` accepts a space-separated list of IDs:

```html
<input aria-describedby="help-text error-message additional-context" />
```

Screen readers will announce all referenced descriptions in the order they appear in the DOM (not the order in the attribute).

## Labeling Strategies

Proper labeling is the foundation of accessible forms.

### aria-label vs. aria-labelledby

Use `aria-label` when:

- The label is short and doesn't need markup
- You want to override a visible label for screen readers
- No visible label exists

```html
<button aria-label="Close dialog">
  <svg><!-- X icon --></svg>
</button>
```

Use `aria-labelledby` when:

- The label contains markup (e.g., required marker, tooltips)
- The label is part of the visible UI
- You want to reference multiple elements

```html
<h2 id="section-title">Account Settings</h2>
<p id="section-description">Manage your account preferences.</p>
<div role="region" aria-labelledby="section-title" aria-describedby="section-description">
  <!-- Settings content -->
</div>
```

### Shadow DOM Labeling

In shadow DOM, the native `<label for="...">` pattern doesn't work across shadow boundaries. Use `aria-labelledby` instead:

```typescript
// ❌ Doesn't work across shadow boundary
<label for="input">Username</label>
<input id="input" />

// ✅ Works in shadow DOM
<label id="label">Username</label>
<input aria-labelledby="label" />
```

**HELiX usage**: All form components use this pattern:

```typescript
<label id=${this._labelId}>
  ${this.label}
</label>
<input aria-labelledby=${this._labelId} />
```

### Slotted Labels

When consumers provide labels via slots, we need to ensure the association still works:

```typescript
private _hasLabelSlot = false;

private _handleLabelSlotChange(e: Event): void {
  const slot = e.target as HTMLSlotElement;
  this._hasLabelSlot = slot.assignedElements().length > 0;

  if (this._hasLabelSlot) {
    const slottedLabel = slot.assignedElements()[0];
    if (slottedLabel && !slottedLabel.id) {
      slottedLabel.id = `${this._inputId}-slotted-label`;
    }
  }
  this.requestUpdate();
}

render() {
  return html`
    <slot name="label" @slotchange=${this._handleLabelSlotChange}></slot>

    <input
      aria-labelledby=${ifDefined(
        this._hasLabelSlot ? `${this._inputId}-slotted-label` : undefined
      )}
    />
  `;
}
```

This pattern:

1. Detects when a label is slotted
2. Assigns an ID to the slotted label if it doesn't have one
3. References that ID in `aria-labelledby`

### Fieldset and Legend

For groups of form controls, use `<fieldset>` and `<legend>`:

```html
<fieldset>
  <legend>Shipping Address</legend>
  <label>
    <input type="text" name="street" />
    Street
  </label>
  <label>
    <input type="text" name="city" />
    City
  </label>
</fieldset>
```

**HELiX usage**: `hx-radio-group` uses this pattern:

```typescript
<fieldset part="fieldset">
  ${this.label
    ? html`<legend part="legend">${this.label}</legend>`
    : nothing}

  <div role="none">
    <slot></slot>
  </div>
</fieldset>
```

The `role="none"` on the inner wrapper removes it from the accessibility tree, preventing confusion.

## ARIA in Shadow DOM

Shadow DOM introduces unique challenges for ARIA.

### ID References Don't Cross Boundaries

ARIA attributes that reference IDs (`aria-labelledby`, `aria-describedby`, `aria-controls`) don't work across shadow boundaries:

```html
<!-- Light DOM -->
<label id="external-label">Username</label>
<custom-input aria-labelledby="external-label"></custom-input>

<!-- Shadow DOM inside custom-input -->
<input aria-labelledby="external-label" />
<!-- ❌ Doesn't work -->
```

**Solution**: Keep referenced elements in the same shadow root:

```typescript
// Inside custom-input shadow DOM
<label id="internal-label">Username</label>
<input aria-labelledby="internal-label" /> <!-- ✅ Works -->
```

### Slot Content Accessibility

Slotted content lives in the light DOM but renders in the shadow DOM. ARIA attributes on slotted elements remain functional:

```html
<!-- Light DOM -->
<custom-form>
  <input aria-label="Search" slot="search" />
</custom-form>

<!-- Shadow DOM -->
<slot name="search"></slot>
```

The `aria-label` on the slotted `<input>` works because the input itself is in the light DOM.

### CSS Parts and ARIA

CSS parts don't affect ARIA. The `part` attribute is purely for styling and has no semantic meaning:

```typescript
<button part="button">
  <!-- The part attribute doesn't affect accessibility -->
</button>
```

### Focus Delegation

Shadow DOM supports focus delegation, which automatically forwards focus to the first focusable element:

```typescript
static shadowRootOptions = {
  ...LitElement.shadowRootOptions,
  delegatesFocus: true
};
```

**When to use**: When the host element should receive focus but needs to forward it to an internal element (e.g., a wrapper around an `<input>`).

**HELiX usage**: Not currently used, but may be adopted for complex composite widgets.

## Common Patterns

### Button Pattern

**Requirements**:

- Activates on Enter and Space
- Disabled state announced
- Purpose clearly labeled

```typescript
<button
  ?disabled=${this.disabled}
  aria-disabled=${this.disabled ? 'true' : nothing}
  @click=${this._handleClick}
>
  <slot></slot>
</button>
```

### Checkbox Pattern

**Requirements**:

- Checked state announced
- Keyboard toggle with Space
- Label association
- Error state linked to input

```typescript
<label>
  <input
    type="checkbox"
    .checked=${live(this.checked)}
    aria-invalid=${hasError ? 'true' : nothing}
    aria-describedby=${ifDefined(describedBy)}
  />
  <span>${this.label}</span>
</label>
```

### Radio Group Pattern

**Requirements**:

- Group labeled with fieldset/legend or `role="radiogroup"` with `aria-label`
- Only one radio in tab order (roving tabindex)
- Arrow keys navigate between options
- Checked state managed at group level

```typescript
<fieldset>
  <legend>${this.label}</legend>
  <slot></slot> <!-- Radios with roving tabindex -->
</fieldset>
```

### Select Pattern

**Requirements**:

- Expanded state announced
- Keyboard navigation with Arrow keys
- Selected option announced
- Label association

```typescript
<label for="select">${this.label}</label>
<select
  id="select"
  ?required=${this.required}
  aria-invalid=${hasError ? 'true' : nothing}
  aria-describedby=${ifDefined(describedBy)}
>
  <slot></slot> <!-- Options cloned into shadow DOM -->
</select>
```

### Form Field Pattern

All form components in HELiX follow this pattern:

```typescript
<div class="field">
  <label id=${this._labelId}>${this.label}</label>

  <input
    aria-labelledby=${this._labelId}
    aria-describedby=${ifDefined(describedBy)}
    aria-invalid=${hasError ? 'true' : nothing}
    aria-required=${this.required ? 'true' : nothing}
  />

  ${hasError
    ? html`<div id=${this._errorId} role="alert" aria-live="polite">
        ${this.error}
      </div>`
    : nothing}

  ${this.helpText && !hasError
    ? html`<div id=${this._helpTextId}>${this.helpText}</div>`
    : nothing}
</div>
```

This ensures:

- Screen readers announce the label when the field receives focus
- Help text is read immediately after the label
- Error messages are announced when they appear
- The error state is conveyed via `aria-invalid`

## Testing ARIA

Testing ARIA patterns requires both automated tools and manual verification.

### Automated Testing

Use **axe-core** (integrated into Storybook via the a11y addon):

```bash
npm run storybook
# Open Accessibility panel in Storybook
```

Axe catches common issues:

- Missing labels
- Invalid ARIA attribute values
- Incorrect role usage
- Contrast violations

### Manual Screen Reader Testing

**Priority screen readers**:

- **NVDA** (Windows) — Most popular free screen reader
- **JAWS** (Windows) — Enterprise standard
- **VoiceOver** (macOS/iOS) — Built-in Apple screen reader
- **TalkBack** (Android) — Built-in Android screen reader

**Testing checklist**:

1. **Navigation** — Can you reach all interactive elements with Tab?
2. **Semantics** — Does the screen reader announce the correct role and state?
3. **Labels** — Are all form fields labeled clearly?
4. **Errors** — Are validation errors announced when they appear?
5. **Live regions** — Are dynamic updates announced appropriately?
6. **Keyboard** — Can you complete all tasks without a mouse?

### VoiceOver Quick Start

**macOS**:

1. Enable VoiceOver: Cmd+F5
2. Navigate: VO+Right Arrow (VO = Ctrl+Option)
3. Activate: VO+Space
4. Read from current position: VO+A

**Test each component**:

- Tab to the element
- Listen to the announcement (role, label, state)
- Interact with keyboard (Space, Enter, Arrows)
- Verify state changes are announced

### NVDA Quick Start

**Windows**:

1. Download NVDA from nvaccess.org
2. Navigate: Arrow keys or Tab
3. Activate: Enter or Space
4. Browse mode: Off by default (use Tab to navigate forms)
5. Forms mode: Automatically enters when focused on form field

**Test each component**:

- Tab to the element
- Listen to the announcement
- Interact with keyboard
- Verify dynamic updates are announced

### Testing Focus Management

Verify focus is visible and logical:

```bash
# Navigate with Tab key
# Verify focus order matches visual layout
# Confirm focus is visible (outline or ring)
# Check that focus isn't trapped accidentally
```

### Testing Keyboard Interactions

Each component type has expected keyboard behavior:

| Component   | Enter    | Space    | Escape | Arrow Keys       |
| ----------- | -------- | -------- | ------ | ---------------- |
| Button      | Activate | Activate | —      | —                |
| Checkbox    | —        | Toggle   | —      | —                |
| Radio Group | —        | Select   | —      | Navigate options |
| Select      | Open     | Open     | Close  | Navigate options |
| Switch      | Toggle   | Toggle   | —      | —                |

## References

### W3C ARIA Authoring Practices Guide (APG)

The definitive reference for ARIA patterns:

- [APG Home](https://www.w3.org/WAI/ARIA/apg/)
- [Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [Checkbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
- [Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- [Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

### MDN ARIA Documentation

Technical reference for ARIA attributes and roles:

- [ARIA Overview](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [ARIA States and Properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes)
- [Using ARIA: Roles, States, and Properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques)

### WCAG 2.1 Guidelines

Accessibility guidelines that ARIA helps satisfy:

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) — Browser extension for accessibility testing
- [NVDA](https://www.nvaccess.org/) — Free Windows screen reader
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) — Built-in macOS/iOS screen reader
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) — Automated accessibility audit

---

## Summary

ARIA is a powerful tool for building accessible web components, but it requires careful implementation. Key principles:

1. **Prefer native HTML** — Use semantic HTML elements before reaching for ARIA
2. **Augment, don't replace** — Use ARIA to enhance native semantics, not recreate them
3. **Keep ARIA in sync** — State attributes must reflect the actual component state
4. **Test with real tools** — Screen readers reveal issues automated tests miss
5. **Follow established patterns** — The W3C APG provides battle-tested solutions

By following the patterns demonstrated in HELiX components and referring to the W3C ARIA Authoring Practices Guide, you can build accessible components that work seamlessly with assistive technology.
