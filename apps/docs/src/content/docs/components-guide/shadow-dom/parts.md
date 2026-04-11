---
title: CSS Parts
description: Expose shadow DOM internals for external styling using the part attribute, ::part() pseudo-element, and exportparts.
---

CSS parts are the designated mechanism for consumers to style specific elements inside a shadow DOM without breaking encapsulation. They create a deliberate, versioned API surface for styling.

## What Are CSS Parts?

A CSS part is an element inside a shadow tree that the component author has explicitly exposed for external styling. The element is marked with a `part` attribute:

```typescript
override render() {
  return html`
    <button part="button" class="btn">
      <span part="label" class="btn__label">
        <slot></slot>
      </span>
    </button>
  `;
}
```

Consumers target it with the `::part()` pseudo-element:

```css
/* Style the internal button element of any hx-button */
hx-button::part(button) {
  border-radius: 0;
  text-transform: uppercase;
}

/* Style the label span */
hx-button::part(label) {
  letter-spacing: 0.05em;
}
```

## HELiX Convention: Every Interactive Element Has a Named Part

Every interactive or visually significant shadow DOM element in HELiX has a `part` attribute. This makes all components styleable without modifying source code:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  invalid = false;

  @property({ type: String })
  error = '';

  override render() {
    return html`
      <div part="root" class="root">
        <label part="label" class="label" for="input">
          ${this.label}
        </label>
        <div part="control" class="control">
          <input
            part="input"
            id="input"
            class="input"
            .value=${this.value}
            aria-invalid=${this.invalid}
          />
        </div>
        ${this.error
          ? html`<span part="error" class="error">${this.error}</span>`
          : nothing}
      </div>
    `;
  }
}
```

Available parts become a versioned API. Document them with `@csspart` JSDoc tags.

## `@csspart` JSDoc Tag

Document exposed parts with `@csspart` in JSDoc comments above the class:

```typescript
/**
 * A text input field with label and error state.
 *
 * @csspart root - The outer wrapper div
 * @csspart label - The label element
 * @csspart control - The input wrapper (for prefix/suffix icons)
 * @csspart input - The native input element
 * @csspart error - The error message span (only present when invalid)
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // ...
}
```

Tools like Custom Elements Manifest (CEM) analyzer pick up `@csspart` tags and generate documentation automatically.

## Multiple Parts on One Element

An element can have multiple parts:

```html
<button part="button interactive focusable">
```

This lets consumers target the element with different selectors depending on context:

```css
/* Target all interactive parts */
hx-button::part(interactive) { cursor: pointer; }

/* Target specifically the button */
hx-button::part(button) { border: none; }
```

## Part States with Data Attributes

Since `::part()` selectors cannot target pseudo-classes like `:hover` or `:disabled` on the part itself (this is a browser limitation), HELiX components use data attributes on parts to expose state:

```typescript
override render() {
  return html`
    <button
      part="button"
      ?disabled=${this.disabled}
      aria-busy=${this.loading}
    >
      <slot></slot>
    </button>
  `;
}
```

```css
/* Cannot do this — ::part() with pseudo-class not supported */
hx-button::part(button):disabled { ... }  /* doesn't work */

/* Instead, target via attribute selectors on the host */
hx-button[disabled]::part(button) { opacity: 0.5; }
hx-button[loading]::part(button) { cursor: wait; }
```

## `exportparts` — Forwarding Parts Through Composition

When a component contains another shadow DOM component internally, its sub-component's parts are not accessible from outside by default. Use `exportparts` to forward them:

```typescript
@customElement('hx-combobox')
export class HelixCombobox extends LitElement {

  override render() {
    return html`
      <div class="combobox-wrapper">
        <!-- Forward hx-text-input's parts under new names -->
        <hx-text-input
          exportparts="input: combobox-input, label: combobox-label"
          .value=${this.value}
        ></hx-text-input>

        <!-- Also expose the dropdown list -->
        <hx-listbox
          part="listbox"
          exportparts="option: combobox-option"
          .items=${this._filteredItems}
        ></hx-listbox>
      </div>
    `;
  }
}
```

The `exportparts` attribute value is a comma-separated list of `inner-name: outer-name` pairs:

```
exportparts="input: combobox-input, label: combobox-label"
```

This makes `hx-combobox::part(combobox-input)` and `hx-combobox::part(combobox-label)` available to consumers, forwarded from `hx-text-input`'s own `input` and `label` parts.

## Practical Theming with `::part()`

### Scoped overrides

Apply part overrides within a scoped context to avoid affecting all instances:

```css
/* Only applies inside the patient form section */
.patient-form hx-text-input::part(input) {
  border-radius: 0;
  border-bottom-width: 2px;
}

/* Brand-specific button style for a marketing section */
.marketing-hero hx-button::part(button) {
  background: var(--hx-color-brand-accent);
  font-size: var(--hx-font-size-lg);
  padding: var(--hx-spacing-md) var(--hx-spacing-xl);
}
```

### Combining with host selectors

You can combine element selector, attribute selectors, and `::part()`:

```css
/* Only icon-only buttons */
hx-button[icon-only]::part(button) {
  padding: var(--hx-spacing-sm);
  border-radius: var(--hx-radius-full);
}

/* Buttons inside a card footer */
hx-card::part(footer) hx-button::part(button) {
  flex: 1;
}
```

## What `::part()` Cannot Do

The `::part()` pseudo-element has some limitations:

- Cannot chain pseudo-classes: `hx-button::part(button):focus-visible { ... }` is **not supported**.
- Cannot chain pseudo-elements: `hx-button::part(input)::placeholder { ... }` is **not supported**.
- Cannot target children of a part: `hx-button::part(button) span { ... }` is **not supported**.

Workarounds:
- Use CSS custom properties for interactive state styles (hover, focus) that need to be customizable.
- Add additional `part` attributes to child elements that need individual styling.
- Use `exportparts` to forward nested shadow elements.

## Documenting Parts in the API Reference

When writing a HELiX component, list all exposed parts in the JSDoc and in the component's API documentation page:

| Part name | Element | Description |
|---|---|---|
| `root` | `div` | Outer wrapper |
| `label` | `label` | The label element |
| `control` | `div` | Wrapper around the input (includes affixes) |
| `input` | `input` | The native input |
| `prefix` | `span` | Prefix icon/text container |
| `suffix` | `span` | Suffix icon/text container |
| `error` | `span` | Error message (present only when invalid) |
| `hint` | `span` | Hint/help text |

## Next Steps

- [Shadow DOM Styling](/components-guide/shadow-dom/styling/) — `::slotted()`, custom properties, and inheritance
- [Styling Shadow DOM](/components-guide/shadow-dom/styling/) — the full picture of what pierces the boundary
- [Shadow DOM Architecture](/components-guide/shadow-dom/architecture/) — encapsulation fundamentals
