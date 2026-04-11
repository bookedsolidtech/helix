---
title: Template Syntax
description: All expression types in Lit's html`` tagged template literal — text, attribute, boolean, property, event, and element bindings.
---

Lit templates are written with the `html` tagged template literal. JavaScript expressions embedded with `${...}` are bound to different parts of the DOM depending on where they appear. This page covers every binding type with practical HELiX examples.

## The `html` Tagged Template Literal

```typescript
import { LitElement, html, nothing } from 'lit';
```

The `html` tag parses the template once and creates an efficient update plan. On subsequent renders, Lit updates only the parts that changed — not the entire template.

```typescript
override render() {
  return html`
    <div class="container">
      <h2>${this.title}</h2>
    </div>
  `;
}
```

## Expression Types

### Text Bindings

Place an expression in text position to render a value as a text node.

```typescript
override render() {
  return html`
    <p>${this.message}</p>
    <span>${this.count} items</span>
  `;
}
```

Lit accepts strings, numbers, booleans (rendered as their string representation), and other `html` template results. Passing `null` or `undefined` renders nothing.

### Attribute Bindings

An expression in an attribute value position sets the attribute's string value.

```typescript
override render() {
  return html`
    <div class="${this.variant}" id="${this.elementId}">
      <input placeholder="${this.placeholder}" />
    </div>
  `;
}
```

The entire attribute value can be an expression, or expressions can be mixed with static strings:

```typescript
html`<div class="card card--${this.variant} ${this.active ? 'card--active' : ''}"></div>`
```

### Boolean Attribute Bindings

Prefix the attribute name with `?` to bind a boolean. When the value is truthy, the attribute is present; when falsy, it is removed.

```typescript
override render() {
  return html`
    <button ?disabled=${this.disabled} ?hidden=${!this.visible}>
      ${this.label}
    </button>

    <input
      ?required=${this.required}
      ?readonly=${this.readonly}
    />
  `;
}
```

This correctly handles HTML boolean attributes like `disabled`, `hidden`, `required`, `checked`, `readonly`, and `open`.

### Property Bindings

Prefix the attribute name with `.` to set a JavaScript property on the element instead of an HTML attribute. This is essential for non-string values like arrays, objects, and rich data.

```typescript
override render() {
  return html`
    <!-- Sets the .value property, not the value attribute -->
    <input .value=${this.inputValue} />

    <!-- Passes an object — impossible with attribute binding -->
    <hx-data-table .columns=${this._tableColumns} .rows=${this._tableData}></hx-data-table>

    <!-- Sets the checked property on a checkbox -->
    <input type="checkbox" .checked=${this.isChecked} />
  `;
}
```

Property bindings bypass attribute serialization, making them the correct choice for booleans, numbers, arrays, and objects passed to child components.

### Event Bindings

Prefix the attribute name with `@` to attach an event listener. The value should be an event handler function or method reference.

```typescript
@customElement('hx-toggle')
export class HelixToggle extends LitElement {

  @property({ type: Boolean, reflect: true })
  checked = false;

  private _handleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      }),
    );
  }

  override render() {
    return html`
      <label>
        <input
          type="checkbox"
          .checked=${this.checked}
          @change=${this._handleChange}
        />
        <slot></slot>
      </label>
    `;
  }
}
```

Use arrow functions in the template only for short expressions. For anything beyond a single statement, prefer a named method to avoid creating a new function on every render:

```typescript
// Prefer: named method — stable reference
@click=${this._handleClick}

// Avoid for complex handlers: new function on every render
@click=${() => { this._expanded = !this._expanded; this._announceChange(); }}

// OK for simple one-liners
@click=${() => (this._expanded = !this._expanded)}
```

### Element Bindings

The `ref` directive lets you get a reference to a rendered DOM element. This is useful when you need to imperatively access a node after render.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref, createRef, type Ref } from 'lit/directives/ref.js';

@customElement('hx-autoscroll')
export class HelixAutoscroll extends LitElement {

  private _listRef: Ref<HTMLUListElement> = createRef();

  scrollToBottom() {
    this._listRef.value?.scrollTo({ top: 99999, behavior: 'smooth' });
  }

  override render() {
    return html`
      <ul ${ref(this._listRef)}>
        <slot></slot>
      </ul>
    `;
  }
}
```

Prefer the `@query` decorator for static element references — `ref` is for cases where the element reference needs to be created dynamically or passed around.

## The `nothing` Sentinel

Import `nothing` from `lit` to conditionally render nothing — not even an empty text node.

```typescript
import { LitElement, html, nothing } from 'lit';
```

```typescript
override render() {
  return html`
    <button>
      ${this.icon ? html`<hx-icon name=${this.icon}></hx-icon>` : nothing}
      ${this.label}
    </button>
  `;
}
```

Use `nothing` instead of `''` (empty string) or `null` when you want to completely remove content from the template. It is more explicit and avoids empty text nodes.

## Nested Templates

Templates can be composed by returning `html` results from helper methods or by embedding them directly in expressions.

```typescript
@customElement('hx-card')
export class HelixCard extends LitElement {

  @property({ type: String })
  title = '';

  @property({ type: String })
  description = '';

  @property({ type: Array })
  actions: Array<{ label: string; href: string }> = [];

  private _renderActions() {
    if (!this.actions.length) return nothing;
    return html`
      <div class="actions">
        ${this.actions.map(
          (action) => html`
            <a href=${action.href} class="action-link">${action.label}</a>
          `,
        )}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="card">
        ${this.title ? html`<h3 class="card__title">${this.title}</h3>` : nothing}
        ${this.description ? html`<p class="card__desc">${this.description}</p>` : nothing}
        <div class="card__body">
          <slot></slot>
        </div>
        ${this._renderActions()}
      </div>
    `;
  }
}
```

## Template Result Types

`html` returns a `TemplateResult`. You can store these, return them from methods, and compose them:

```typescript
private _renderBadge(): TemplateResult | typeof nothing {
  if (!this.showBadge) return nothing;
  return html`<span class="badge">${this.badgeCount}</span>`;
}
```

Import `TemplateResult` for TypeScript typing:

```typescript
import { LitElement, html, nothing, type TemplateResult } from 'lit';
```

## Next Steps

- [Built-in Directives](/components-guide/fundamentals/directives/) — `classMap`, `ifDefined`, `repeat`, `when`, and more
- [Styles and CSS](/components-guide/fundamentals/styles-and-css/) — the `css\`\`` template literal
- [Events Overview](/components-guide/fundamentals/events-overview/) — event handler patterns in detail
- [Slots Introduction](/components-guide/fundamentals/slots-intro/) — `<slot>` and content projection
