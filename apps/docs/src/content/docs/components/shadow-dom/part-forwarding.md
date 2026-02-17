---
title: CSS Part Forwarding
description: How to expose and forward CSS parts through component composition layers.
---

When components are composed inside other components, their CSS parts become invisible to the outside world. The `::part()` selector can only reach one shadow boundary deep. Composing `hx-text-input` inside `hx-form` means the consumer can style `hx-form`'s own parts, but `hx-text-input`'s `input`, `label`, and `error` parts are hidden behind a second shadow boundary — unless `hx-form` explicitly forwards them.

The `exportparts` attribute is the mechanism for forwarding parts upward through the component tree. This guide covers the syntax, patterns, naming strategies, and practical examples used in the HELiX library.

## Why Parts Stop at Shadow Boundaries

To understand why `exportparts` is necessary, consider what happens when components nest.

```
Page (light DOM)
  └─ hx-form
       └─ #shadow-root (hx-form's shadow tree)
            └─ hx-text-input
                 └─ #shadow-root (hx-text-input's shadow tree)
                      ├─ div[part="field"]
                      ├─ label[part="label"]
                      ├─ div[part="input-wrapper"]
                      ├─ input[part="input"]
                      └─ div[part="error"]
```

The page can see `hx-form`'s shadow root directly — `hx-form::part(form)` would work if `hx-form` exposes a `form` part. But `hx-text-input` lives inside `hx-form`'s shadow root, so its parts are behind two shadow boundaries from the page's perspective.

```css
/* Works — reaches hx-form's own shadow root */
hx-form::part(form) { ... }

/* Does NOT work — hx-text-input is nested, its parts are hidden */
hx-form::part(input) { ... }
hx-form::part(label) { ... }
```

The browser enforces this intentionally. Without opt-in forwarding, consumers cannot accidentally depend on the internal structure of nested components. If `hx-form` changes which input component it uses internally, no consumer CSS would break.

## The `exportparts` Attribute

The `exportparts` attribute, placed on a child element in a shadow tree, tells the browser to re-export that child's parts to the host element's own part namespace.

### Basic Syntax

```html
<!-- Forward the "button" part from hx-button up to hx-card -->
<hx-button exportparts="button"></hx-button>
```

After this, consumers can write:

```css
/* Now reaches hx-button's internal <button> through hx-card */
hx-card::part(button) { ... }
```

### Renaming During Forwarding

Parts can be renamed as they are forwarded. The syntax is `original-name: new-name`:

```html
<hx-button exportparts="button: card-action"></hx-button>
```

```css
/* Consumer uses the new name */
hx-card::part(card-action) { ... }
```

Renaming is important when a composite component contains multiple children of the same type. Without renaming, both would export a part named `button` and they would collide.

### Forwarding Multiple Parts

Separate multiple part mappings with commas:

```html
<hx-text-input exportparts="input, label, error, help-text, field, input-wrapper"></hx-text-input>
```

With renaming applied to each:

```html
<hx-text-input
  exportparts="
    input: field-input,
    label: field-label,
    error: field-error,
    help-text: field-help,
    field: field-container,
    input-wrapper: field-input-wrapper
  "
></hx-text-input>
```

## Using `exportparts` in Lit Templates

In a Lit component, `exportparts` is a static attribute on the child element in the `render()` method. It does not need to be reactive because part names do not change at runtime.

```typescript
// hx-form.ts (simplified composition example)
@customElement('hx-form')
export class HelixForm extends LitElement {
  override render() {
    return html`
      <form part="form" class="form" @submit=${this._handleSubmit}>
        <!--
          Forward hx-text-input's parts into hx-form's part namespace,
          prefixed with "field-" to avoid collisions.
        -->
        <hx-text-input
          exportparts="
            field: field-container,
            label: field-label,
            input-wrapper: field-input-wrapper,
            input: field-input,
            help-text: field-help-text,
            error: field-error
          "
          label=${ifDefined(this.label || undefined)}
          .value=${this.value}
        ></hx-text-input>

        <div part="actions" class="form__actions">
          <hx-button exportparts="button: submit-button" type="submit">
            <slot name="submit-label">Submit</slot>
          </hx-button>
        </div>
      </form>
    `;
  }
}
```

After this, consumers can reach into both the form and the nested input:

```css
/* hx-form's own parts */
hx-form::part(form) {
  padding: 2rem;
}
hx-form::part(actions) {
  border-top: 1px solid var(--hx-color-border);
}

/* hx-text-input's parts, forwarded through hx-form */
hx-form::part(field-input) {
  border-radius: 0;
  font-size: 1.125rem;
}

hx-form::part(field-label) {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

hx-form::part(field-error) {
  font-style: italic;
}

/* hx-button's part, forwarded through hx-form */
hx-form::part(submit-button) {
  min-width: 160px;
}
```

## Practical Example: hx-form Forwarding hx-text-input Parts

The HELiX text input exposes six named parts as documented in its JSDoc:

```typescript
/**
 * @csspart field        - The outer field container.
 * @csspart label        - The label element.
 * @csspart input-wrapper - The wrapper around prefix, input, and suffix.
 * @csspart input        - The native input element.
 * @csspart help-text    - The help text container.
 * @csspart error        - The error message container.
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  override render() {
    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label
              ? html`<label part="label" class="field__label" for=${this._inputId}>
                  ${this.label}
                </label>`
              : nothing}
          </slot>
        </div>
        <div part="input-wrapper" class="field__input-wrapper">
          <span class="field__prefix"><slot name="prefix"></slot></span>
          <input part="input" class="field__input" id=${this._inputId} />
          <span class="field__suffix"><slot name="suffix"></slot></span>
        </div>
        <div part="error" class="field__error">${this.error}</div>
        <div part="help-text" class="field__help-text">${this.helpText}</div>
      </div>
    `;
  }
}
```

When a consumer uses `hx-text-input` directly, they get full access to all six parts:

```css
hx-text-input::part(input) {
  border: 2px solid currentColor;
}
hx-text-input::part(label) {
  font-size: 0.75rem;
}
hx-text-input::part(error) {
  color: var(--hx-color-error-700);
}
hx-text-input::part(help-text) {
  color: var(--hx-color-neutral-500);
}
```

When `hx-text-input` is nested inside `hx-form`, those parts disappear from the consumer's view unless `hx-form` forwards them. Here is the correct forwarding declaration for a form that contains a single text input:

```typescript
// hx-form render() — forwarding with descriptive prefixes
return html`
  <form part="form" class="form">
    <hx-text-input
      exportparts="
        field: input-field,
        label: input-label,
        input-wrapper: input-wrapper,
        input: input-control,
        help-text: input-help,
        error: input-error
      "
    ></hx-text-input>
  </form>
`;
```

Consumer stylesheet:

```css
/* No prefix needed for hx-form's own part */
hx-form::part(form) {
  background: var(--hx-color-neutral-50);
  border-radius: var(--hx-border-radius-lg);
  padding: var(--hx-space-6);
}

/* Forwarded from hx-text-input — uses the renamed part names */
hx-form::part(input-control) {
  border: 2px solid var(--hx-color-neutral-400);
  border-radius: var(--hx-border-radius-sm);
}

hx-form::part(input-control):focus {
  border-color: var(--hx-color-primary-500);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

hx-form::part(input-label) {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--hx-color-neutral-700);
}
```

## Naming Parts During Forwarding

Naming strategy during forwarding matters for consumers. Two rules guide good decisions.

### Rule 1: Always Prefix When Forwarding Through Composition

Without prefixes, a composite component that contains two text inputs would export two sets of parts with identical names, and they would overwrite each other in the namespace:

```html
<!-- Problematic — both export "input", which collides -->
<hx-text-input exportparts="input, label"></hx-text-input>
<hx-text-input exportparts="input, label"></hx-text-input>
```

```css
/* Which input does this target? Both. That is almost never what you want. */
hx-form::part(input) { ... }
```

With prefixes, each component gets its own namespace:

```html
<hx-text-input exportparts="input: first-name-input, label: first-name-label"></hx-text-input>
<hx-text-input exportparts="input: last-name-input, label: last-name-label"></hx-text-input>
```

```css
hx-form::part(first-name-input) {
  width: 100%;
}
hx-form::part(last-name-input) {
  width: 100%;
}
```

### Rule 2: Keep the Semantic Intent Intact

When renaming, preserve the meaning. A forwarded `input` renamed to `input-control` is clear. A forwarded `input` renamed to `field-3` is not.

```html
<!-- Good: preserves semantic meaning with context prefix -->
<hx-text-input exportparts="input: email-input, error: email-error"></hx-text-input>

<!-- Bad: loses meaning entirely -->
<hx-text-input exportparts="input: element-a, error: element-b"></hx-text-input>
```

## Building a Multi-Layer Design System

`exportparts` can chain across more than two levels. A page consuming a healthcare application might have this component tree:

```
hx-patient-form (application component)
  └─ hx-form (library component)
       └─ hx-text-input (library component)
            └─ input[part="input"]
```

For the page to reach the `input` element, each layer must forward explicitly:

**`hx-text-input`** declares the part:

```html
<input part="input" />
```

**`hx-form`** forwards it upward:

```html
<hx-text-input exportparts="input: form-input"></hx-text-input>
```

**`hx-patient-form`** forwards it again:

```html
<hx-form exportparts="form-input: patient-input"></hx-form>
```

**Page stylesheet** reaches the native input:

```css
hx-patient-form::part(patient-input) {
  font-size: 1rem;
  min-height: 44px; /* WCAG 2.1 AA minimum touch target */
}
```

Each forwarding step is deliberate. If `hx-form` does not include `form-input` in its `exportparts`, the chain breaks at that layer and the page cannot reach the input. This is encapsulation working as designed — each layer controls what it exposes.

## Documenting Forwarded Parts

Every part that a component exposes — whether native or forwarded — must be documented in JSDoc for accurate Custom Elements Manifest generation:

```typescript
/**
 * A form component that wraps hx-text-input fields.
 *
 * @csspart form           - The native form element.
 * @csspart actions        - The form actions container.
 * @csspart field-input    - Forwarded from hx-text-input: the native input element.
 * @csspart field-label    - Forwarded from hx-text-input: the label element.
 * @csspart field-error    - Forwarded from hx-text-input: the error message container.
 * @csspart field-help     - Forwarded from hx-text-input: the help text container.
 * @csspart submit-button  - Forwarded from hx-button: the native button element.
 */
@customElement('hx-form')
export class HelixForm extends LitElement { ... }
```

This documentation tells CEM what to include in the `cssparts` array in `custom-elements.json`, which in turn powers Storybook's autodocs panel and IDE autocompletion.

## When to Use Parts vs CSS Custom Properties

Both parts and CSS custom properties are styling contracts, but they solve different problems.

**CSS custom properties** are the right choice when:

- You want a value to apply globally across all component instances — set `--hx-color-primary-500` once on `:root` and every component picks it up.
- The customization is a scalar value: a color, a size, a radius, a font stack.
- The change needs to cascade through multiple levels without explicit forwarding.

**CSS parts** are the right choice when:

- You need to change structural or layout properties of a specific internal element.
- The consumer needs pseudo-class styling (`:focus`, `:hover`, `:disabled`) on an internal element.
- The change is per-instance or context-specific, not global.
- CSS custom properties cannot express the needed override (e.g., changing `display` from `block` to `grid`).

**The layered approach** for a production design system:

```css
/* Layer 1: Global values via custom properties — affects everything */
:root {
  --hx-color-primary-500: #006d7a; /* Brand teal */
  --hx-border-radius-md: 4px;
  --hx-font-family-sans: 'Inter', system-ui, sans-serif;
}

/* Layer 2: Component-scoped custom properties — affects all instances of one component */
hx-text-input {
  --hx-input-border-color: var(--hx-color-neutral-400);
  --hx-input-focus-ring-color: var(--hx-color-primary-500);
}

/* Layer 3: Parts — affects specific elements in specific contexts */
.patient-registration-form hx-text-input::part(input) {
  min-height: 48px; /* Larger touch targets for clinical tablet use */
  font-size: 1.125rem;
}

.patient-registration-form hx-text-input::part(label) {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

Custom properties handle the token layer. Parts handle the structural layer. Using them together gives you a complete theming system without breaking encapsulation.

## Browser Support

The `exportparts` attribute is supported in all modern browsers with the same baseline as the CSS Parts API itself:

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 73+             |
| Edge    | 79+             |
| Safari  | 13.1+           |
| Firefox | 72+             |

As of February 2026, this covers 96%+ of global browser usage. No polyfill is needed. In unsupported browsers, `exportparts` is ignored silently — components continue to function, but forwarded parts cannot be styled.

The wildcard syntax (`exportparts="*"` to forward all parts) is not supported in any browser. Always enumerate parts explicitly or use prefixed renaming for each part you forward.

## Summary

CSS part forwarding allows composite components to expose their children's internal elements as first-class styling hooks. The mechanism is the `exportparts` attribute, placed on child elements inside a shadow tree. Key rules:

- Parts stop at shadow boundaries by default. External consumers can only reach one level deep.
- `exportparts` on a child element re-exports named parts into the host component's part namespace.
- Parts can be renamed during forwarding using the `original: renamed` syntax.
- Always prefix forwarded parts when a component contains multiple children of the same type.
- Document forwarded parts with `@csspart` JSDoc comments for CEM accuracy.
- Use CSS custom properties for scalar values that need to cascade globally. Use parts for structural or pseudo-class overrides on specific elements.
- Forwarding chains across multiple levels require explicit `exportparts` declarations at each layer.

For HELiX components consumed through Drupal Twig templates, `exportparts` declarations must be set as static attributes in the component's `render()` method — they are not reactive and do not change at runtime. Consumers can then apply `::part()` selectors in their theme CSS without any JavaScript involvement.

## Next Steps

- [CSS Parts API](/components/shadow-dom/parts) — The full `part` attribute and `::part()` selector reference
- [Open vs Closed Shadow Roots](/components/shadow-dom/open-closed) — Why open mode is required for part forwarding to work
- [Shadow DOM Architecture](/components/shadow-dom/architecture) — Shadow boundary fundamentals
- [Advanced Slots](/components/shadow-dom/advanced-slots) — Composition patterns that work alongside part forwarding

## Sources

- [::part() - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)
- [CSS Shadow Parts Module Level 1 - W3C](https://drafts.csswg.org/css-shadow-parts/)
- [exportparts attribute - HTML | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts)
- [CSS shadow parts | web.dev](https://web.dev/articles/css-shadow-parts)
