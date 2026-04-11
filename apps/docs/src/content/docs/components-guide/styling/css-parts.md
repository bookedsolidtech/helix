---
title: CSS Parts API
description: Use the part attribute and ::part() pseudo-element to give consumers direct styling access to specific elements inside a component's shadow DOM.
---

Shadow DOM prevents external stylesheets from reaching inside a component's shadow root. CSS Parts provide a deliberate escape hatch: the component author marks specific elements with `part="name"`, and consumers target them with `host-element::part(name)` without needing to know anything about the component's internal structure.

## Defining Parts

Add the `part` attribute to any element in the shadow template that consumers may need to style:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-input')
export class HelixInput extends LitElement {
  static override styles = [
    css`
      :host {
        display: block;
      }

      label {
        display: block;
        font-size: var(--hx-font-size-sm);
        font-weight: var(--hx-font-weight-medium);
        color: var(--hx-color-neutral-700);
        margin-bottom: var(--hx-spacing-xs);
      }

      input {
        display: block;
        width: 100%;
        padding: var(--hx-spacing-sm) var(--hx-spacing-md);
        border: 1px solid var(--hx-color-neutral-300);
        border-radius: var(--hx-border-radius-sm);
        font-size: var(--hx-font-size-base);
        background: var(--hx-color-neutral-0);
        color: var(--hx-color-neutral-900);
      }

      .hint {
        margin-top: var(--hx-spacing-xs);
        font-size: var(--hx-font-size-xs);
        color: var(--hx-color-neutral-500);
      }
    `,
  ];

  override render() {
    return html`
      <label part="label"><slot name="label"></slot></label>
      <input part="input" type="text" />
      <div part="hint"><slot name="hint"></slot></div>
    `;
  }
}
```

## Selecting Parts from Outside

A consumer stylesheet targets named parts with `::part()`:

```css
/* Target the input element specifically */
hx-input::part(input) {
  border-color: var(--hx-color-primary-500);
  border-radius: var(--hx-border-radius-md);
  font-family: 'Courier New', monospace;
}

/* Target the label */
hx-input::part(label) {
  font-size: var(--hx-font-size-base);
  color: var(--hx-color-primary-700);
}

/* State-based part styling */
hx-input:focus-within::part(input) {
  outline: 2px solid var(--hx-color-primary-500);
  outline-offset: 1px;
}
```

## `exportparts` — Forwarding Parts Through Layers

When a component composes another component in its shadow template, the inner component's parts are not exposed by default. Use `exportparts` to forward them:

```typescript
// hx-field composes hx-input internally
@customElement('hx-field')
export class HelixField extends LitElement {
  override render() {
    return html`
      <div class="field-wrapper">
        <!-- Forward hx-input's parts through hx-field -->
        <hx-input
          exportparts="input: field-input, label: field-label, hint: field-hint"
        ></hx-input>
      </div>
    `;
  }
}
```

Now a consumer of `hx-field` can target:

```css
hx-field::part(field-input) {
  border-color: red;
}
```

The `exportparts` value is a comma-separated list of `inner-part: exported-name` mappings. Use a clear namespace prefix to avoid collisions when multiple inner components export parts.

## `@csspart` JSDoc Documentation

Document every exported part with the `@csspart` JSDoc tag. This surfaces the part API in documentation and IDE tooling:

```typescript
/**
 * @csspart label - The `<label>` element above the input.
 * @csspart input - The `<input>` element itself.
 * @csspart hint  - The hint text container below the input.
 */
@customElement('hx-input')
export class HelixInput extends LitElement { ... }
```

All parts must be documented — undocumented parts are considered private implementation details and may be removed without a semver bump.

## HELiX Part Naming Conventions

Parts follow the same principle as CSS custom properties: names should be descriptive and role-based, not structural.

```html
<!-- Good: describes the role -->
<button part="trigger">...</button>
<div part="panel">...</div>
<span part="icon">...</span>
<div part="header">...</div>

<!-- Avoid: describes the structure -->
<button part="button">...</button>  <!-- redundant for a button element -->
<div part="div-wrapper">...</div>   <!-- element name leak -->
```

## Multiple Parts on One Element

An element can carry multiple part names, separated by spaces:

```html
<button part="trigger control" class="btn">...</button>
```

This lets consumers target the element under different semantic names, which is useful when a component exports a combined API alongside a fine-grained one.

## Parts vs CSS Custom Properties

Use parts and custom properties together, but understand the difference:

| Tool | What it exposes | Consumer writes |
|---|---|---|
| CSS custom property | A single style value | `hx-input { --hx-input-border-color: red; }` |
| CSS part | Full CSS access to an element | `hx-input::part(input) { border: 2px dashed red; }` |

CSS custom properties are narrower and more controlled — they expose exactly what the author intended. CSS parts are broader — they expose the element to nearly any CSS the consumer wants to apply. Prefer custom properties for common customizations; use parts as the escape hatch for everything else.

## Next Steps

- [CSS Custom Properties API](/components-guide/styling/css-custom-properties/) — the more controlled styling API
- [Theming](/components-guide/styling/theming/) — global token overrides
- [Constructable Stylesheets](/components-guide/styling/constructable-stylesheets/) — how Lit applies styles efficiently
