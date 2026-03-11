---
title: Template Syntax Guide
description: Comprehensive guide to Lit's template syntax system, including html tagged template literals, expressions, property binding, attribute binding, event binding, and template composition.
sidebar:
  order: 5
---

Lit components render their UI using JavaScript template literals tagged with the `html` function. This approach leverages the browser's native template literal feature to create efficient, declarative templates that only re-render changed content. Understanding Lit's template syntax is essential for building components in the HELiX library.

## HTML Tagged Template Literals

At the core of Lit's templating system is the `html` tagged template literal. This syntax allows you to write HTML-like markup directly in JavaScript, with dynamic values interpolated through expressions.

```typescript
import { html } from 'lit';

const name = 'World';
const template = html`<h1>Hello, ${name}!</h1>`;
```

The `html` tag function parses the template literal and creates an efficient representation of your template. Lit separates the static parts (the HTML structure) from the dynamic parts (the expressions), enabling it to re-render only the portions that change between updates.

### Why Tagged Template Literals?

Tagged template literals provide several key advantages:

1. **Efficient updates**: Lit parses templates once and only updates changed expressions
2. **Native syntax**: No compilation step required; templates are valid JavaScript
3. **Type safety**: TypeScript can type-check expressions within templates
4. **Security**: Automatic escaping of text content prevents XSS attacks
5. **Composition**: Templates can contain other templates for modularity

### Template Structure

A basic Lit component's `render()` method returns an `html` template:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-greeting')
export class HelixGreeting extends LitElement {
  @property({ type: String })
  name = '';

  override render() {
    return html`
      <div class="greeting">
        <h1>Hello, ${this.name}!</h1>
      </div>
    `;
  }
}
```

## Expression Types and Contexts

Expressions are dynamic values evaluated when the template renders. They appear as `${...}` placeholders within template literals and can contain any valid JavaScript expression.

### Where Expressions Can Appear

Expressions are valid in specific contexts within templates:

1. **Child expressions** (between element tags)
2. **Attribute expressions** (in attribute values)
3. **Property expressions** (with `.` prefix)
4. **Boolean attribute expressions** (with `?` prefix)
5. **Event listener expressions** (with `@` prefix)
6. **Element expressions** (for directives in opening tags)

### Valid Expression Values

Different expression contexts accept different value types:

**Child expressions** can render:

- Primitives: `string`, `number`, `boolean`
- Template results: nested `html` templates
- DOM nodes: actual DOM elements
- Arrays or iterables: multiple values
- Sentinel values: `nothing`, `noChange`

**Note**: The values `''` (empty string), `null`, and `undefined` render nothing and are treated specially.

```typescript
override render() {
  return html`
    <!-- Primitive values -->
    <p>Count: ${this.count}</p>

    <!-- Nested templates -->
    ${this.showDetails ? html`<div>Details here</div>` : nothing}

    <!-- Arrays -->
    <ul>
      ${this.items.map(item => html`<li>${item}</li>`)}
    </ul>
  `;
}
```

### Expression Evaluation Timing

Expressions evaluate when the `render()` method executes, not when the template is defined. This enables reactive updates based on component state changes. When a reactive property changes, Lit automatically calls `render()`, re-evaluating all expressions.

### Invalid Expression Locations

Expressions **cannot** appear in:

- Tag names: `html`<${this.tagName}>`</${this.tagName}>\``
- Attribute names: `html`<div ${this.attrName}="value">\``
- Template element content
- HTML comments
- Style element content (with ShadyCSS polyfill)

For these use cases, use the `unsafeStatic()` function from `lit/static-html.js`, but beware of performance costs and XSS vulnerabilities.

## Text Content Binding

The simplest expression type is text content binding, where expressions appear between element tags.

```typescript
override render() {
  return html`
    <h1>${this.title}</h1>
    <p>${this.description}</p>
  `;
}
```

### Automatic Escaping

Lit automatically escapes text content expressions to prevent XSS attacks. HTML special characters are converted to their entity equivalents:

```typescript
// Safe: HTML is escaped automatically
this.userInput = '<script>alert("xss")</script>';

return html`<div>${this.userInput}</div>`;
// Renders: <div>&lt;script&gt;alert("xss")&lt;/script&gt;</div>
```

### Multiple Values

Child expressions can render arrays or iterables, rendering each item in sequence:

```typescript
override render() {
  const items = ['Apple', 'Banana', 'Cherry'];

  return html`
    <ul>
      ${items.map(item => html`<li>${item}</li>`)}
    </ul>
  `;
}
```

### Conditional Content

Use JavaScript conditionals to show or hide content:

```typescript
override render() {
  return html`
    ${this.isLoggedIn
      ? html`<button>Logout</button>`
      : html`<button>Login</button>`
    }
  `;
}
```

The `nothing` sentinel value from `lit` renders nothing, useful for truly conditional rendering:

```typescript
import { html, nothing } from 'lit';

override render() {
  return html`
    <div>
      ${this.showWarning ? html`<p class="warning">Warning!</p>` : nothing}
    </div>
  `;
}
```

## Attribute Binding

Attribute binding sets HTML attributes on elements. The expression must be the entire attribute value (no string concatenation).

### Standard Attributes

```typescript
override render() {
  return html`
    <img src=${this.imageUrl} alt=${this.altText}>
    <a href=${this.linkUrl}>Link</a>
  `;
}
```

**Important**: Don't quote attribute expressions. This is valid:

```typescript
html`<div class=${this.className}></div>`;
```

This is **invalid** (treated as a literal string):

```typescript
html`<div class="${this.className}"></div>`;
```

### Removing Attributes

Use the `nothing` sentinel to remove attributes entirely:

```typescript
import { html, nothing } from 'lit';

override render() {
  return html`
    <img src="/images/${this.imagePath ?? nothing}/">
  `;
}
```

If `imagePath` is null or undefined, the `src` attribute is removed, not set to an empty string.

### The ifDefined Directive

The `ifDefined` directive from `lit/directives/if-defined.js` provides a cleaner way to conditionally set attributes:

```typescript
import { ifDefined } from 'lit/directives/if-defined.js';

override render() {
  return html`
    <input
      type="text"
      placeholder=${ifDefined(this.placeholder || undefined)}
      name=${ifDefined(this.name || undefined)}
    >
  `;
}
```

### Multi-Value Attributes

For attributes that accept multiple values (like `class`), use directives or build strings:

```typescript
import { classMap } from 'lit/directives/class-map.js';

override render() {
  const classes = {
    button: true,
    'button--primary': this.variant === 'primary',
    'button--disabled': this.disabled,
  };

  return html`<button class=${classMap(classes)}>Click</button>`;
}
```

## Boolean Attribute Binding

Boolean attributes (like `disabled`, `required`, `hidden`) are present or absent, not true/false. Use the `?` prefix for boolean attribute binding.

### Syntax

```typescript
override render() {
  return html`
    <button ?disabled=${this.disabled}>Click</button>
    <input ?required=${this.required}>
    <div ?hidden=${!this.visible}></div>
  `;
}
```

When the expression is truthy, the attribute is added. When falsy, it's removed entirely.

### Example from hx-button

```typescript
// packages/hx-library/src/components/hx-button/hx-button.ts
override render() {
  return html`
    <button
      part="button"
      class=${classMap(classes)}
      ?disabled=${this.disabled}
      type=${this.type}
      @click=${this._handleClick}
    >
      <slot></slot>
    </button>
  `;
}
```

### Common Boolean Attributes

- `?disabled` - Form controls
- `?required` - Form validation
- `?readonly` - Form controls
- `?checked` - Checkboxes/radios
- `?hidden` - Visibility
- `?selected` - Options
- `?multiple` - Select elements

### Boolean vs. Property Binding

Don't confuse boolean attributes with boolean properties. Use `?attr` for attributes and `.prop` for properties:

```typescript
// Boolean attribute (adds/removes attribute)
html`<input ?required=${this.required} />`;

// Boolean property (sets .checked property)
html`<input .checked=${this.checked} />`;
```

## Property Binding

Property binding sets JavaScript properties on elements using the `.` prefix. This is essential for passing complex data structures and preserving type information.

### Syntax

```typescript
override render() {
  return html`
    <input .value=${this.inputValue}>
    <my-component .data=${this.complexObject}></my-component>
  `;
}
```

### Why Property Binding?

Attributes are always strings in HTML. Property binding allows you to:

1. **Pass complex data**: Objects, arrays, functions
2. **Preserve types**: Numbers remain numbers, not strings
3. **Set case-sensitive properties**: Properties like `readOnly` preserve casing
4. **Improve performance**: No serialization/deserialization overhead

### Attribute vs. Property

```typescript
// Attribute binding (stringifies value)
html`<input value=${123} />`; // Sets attribute value="123"

// Property binding (sets .value property directly)
html`<input .value=${123} />`; // Sets .value = 123 (number)
```

### Example from hx-text-input

The `live` directive ensures the property binding updates even when the DOM value differs from the property value (important for inputs):

```typescript
// packages/hx-library/src/components/hx-text-input/hx-text-input.ts
import { live } from 'lit/directives/live.js';

override render() {
  return html`
    <input
      part="input"
      class="field__input"
      type=${this.type}
      .value=${live(this.value)}
      @input=${this._handleInput}
    />
  `;
}
```

### Passing Complex Data

```typescript
@customElement('parent-component')
export class ParentComponent extends LitElement {
  @state()
  private _userData = {
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['admin', 'editor'],
  };

  override render() {
    return html` <child-component .user=${this._userData}></child-component> `;
  }
}

@customElement('child-component')
export class ChildComponent extends LitElement {
  @property({ type: Object })
  user?: { name: string; email: string; roles: string[] };

  override render() {
    return html`<div>Hello, ${this.user?.name}</div>`;
  }
}
```

## Event Binding

Event binding attaches event listeners to elements using the `@` prefix followed by the event name.

### Syntax

```typescript
override render() {
  return html`
    <button @click=${this._handleClick}>Click me</button>
    <input @input=${this._handleInput} @change=${this._handleChange}>
  `;
}

private _handleClick(e: MouseEvent): void {
  console.log('Button clicked', e);
}

private _handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  console.log('Input value:', target.value);
}
```

### Automatic Context Binding

Event listeners in Lit components automatically have `this` bound to the component instance, unlike vanilla JavaScript event listeners.

```typescript
// In Lit, this works without explicit binding
@click=${this._handleClick}

// In vanilla JS, you'd need:
element.addEventListener('click', this._handleClick.bind(this));
```

### Event Options

For advanced event listener options, use an object with `handleEvent`:

```typescript
private _listener = {
  handleEvent(e: Event) {
    console.log('Event:', e);
  },
  capture: true,
  passive: true,
};

override render() {
  return html`<button @click=${this._listener}>Click</button>`;
}
```

### Custom Events

Dispatch custom events from components:

```typescript
// packages/hx-library/src/components/hx-button/hx-button.ts
private _handleClick(e: MouseEvent): void {
  if (this.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  this.dispatchEvent(
    new CustomEvent('hx-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e },
    })
  );
}
```

Listen to custom events in parent templates:

```typescript
override render() {
  return html`
    <hx-button @hx-click=${this._handleButtonClick}>
      Submit
    </hx-button>
  `;
}

private _handleButtonClick(e: CustomEvent): void {
  console.log('Button clicked:', e.detail);
}
```

### Common Event Patterns

```typescript
override render() {
  return html`
    <!-- Click events -->
    <button @click=${this._handleClick}>Click</button>

    <!-- Input events -->
    <input @input=${this._handleInput} @change=${this._handleChange}>

    <!-- Focus events -->
    <input @focus=${this._handleFocus} @blur=${this._handleBlur}>

    <!-- Keyboard events -->
    <div @keydown=${this._handleKeyDown} @keyup=${this._handleKeyUp}>

    <!-- Mouse events -->
    <div
      @mouseenter=${this._handleMouseEnter}
      @mouseleave=${this._handleMouseLeave}
    >

    <!-- Form events -->
    <form @submit=${this._handleSubmit}>
  `;
}
```

## Template Composition

Templates can be composed from other templates, enabling modular, reusable rendering logic.

### Nested Templates

Return templates from methods or functions:

```typescript
override render() {
  return html`
    <div class="container">
      ${this._renderHeader()}
      ${this._renderContent()}
      ${this._renderFooter()}
    </div>
  `;
}

private _renderHeader() {
  return html`
    <header>
      <h1>${this.title}</h1>
    </header>
  `;
}

private _renderContent() {
  return html`
    <main>
      <slot></slot>
    </main>
  `;
}

private _renderFooter() {
  return html`
    <footer>
      <p>&copy; 2026 Example Corp</p>
    </footer>
  `;
}
```

### Conditional Rendering

Use ternaries or helper functions for conditional content:

```typescript
override render() {
  return html`
    <div>
      ${this._renderConditionalContent()}
    </div>
  `;
}

private _renderConditionalContent() {
  if (this.loading) {
    return html`<div class="spinner">Loading...</div>`;
  }

  if (this.error) {
    return html`<div class="error">${this.error}</div>`;
  }

  return html`<div class="content">${this.data}</div>`;
}
```

### List Rendering

Transform arrays into template arrays using `map()`:

```typescript
override render() {
  return html`
    <ul>
      ${this.items.map(item => this._renderItem(item))}
    </ul>
  `;
}

private _renderItem(item: { id: string; name: string }) {
  return html`
    <li data-id=${item.id}>
      <span>${item.name}</span>
    </li>
  `;
}
```

For efficient list updates, use the `repeat` directive with keys:

```typescript
import { repeat } from 'lit/directives/repeat.js';

override render() {
  return html`
    <ul>
      ${repeat(
        this.items,
        item => item.id, // Key function
        item => html`<li>${item.name}</li>` // Template function
      )}
    </ul>
  `;
}
```

### Shared Template Utilities

Extract common patterns into utility functions:

```typescript
// utils/templates.ts
import { html, TemplateResult } from 'lit';

export function renderIcon(name: string, size = 16): TemplateResult {
  return html`
    <svg width=${size} height=${size} class="icon icon--${name}">
      <use href="/icons.svg#${name}"></use>
    </svg>
  `;
}

export function renderErrorMessage(message: string): TemplateResult {
  return html`
    <div class="error" role="alert">
      ${renderIcon('error')}
      <span>${message}</span>
    </div>
  `;
}
```

Use in components:

```typescript
import { renderIcon, renderErrorMessage } from './utils/templates.js';

override render() {
  return html`
    <div>
      ${renderIcon('home', 24)}
      ${this.error ? renderErrorMessage(this.error) : nothing}
    </div>
  `;
}
```

## Real-World Examples from HELiX

### Example 1: hx-card Component

The `hx-card` component demonstrates multiple binding types and template composition:

```typescript
// packages/hx-library/src/components/hx-card/hx-card.ts
override render() {
  const isInteractive = !!this.wcHref;

  const classes = {
    card: true,
    [`card--${this.variant}`]: true,
    [`card--${this.elevation}`]: true,
    'card--interactive': isInteractive,
  };

  return html`
    <div
      part="card"
      class=${classMap(classes)}
      role=${isInteractive ? 'link' : nothing}
      tabindex=${isInteractive ? '0' : nothing}
      aria-label=${isInteractive ? `Navigate to ${this.wcHref}` : nothing}
      @click=${this._handleClick}
      @keydown=${this._handleKeyDown}
    >
      <div class="card__image" part="image" ?hidden=${!this._hasSlotContent['image']}>
        <slot name="image" @slotchange=${this._handleSlotChange('image')}></slot>
      </div>

      <div class="card__heading" part="heading" ?hidden=${!this._hasSlotContent['heading']}>
        <slot name="heading" @slotchange=${this._handleSlotChange('heading')}></slot>
      </div>

      <div class="card__body" part="body">
        <slot></slot>
      </div>

      <div class="card__footer" part="footer" ?hidden=${!this._hasSlotContent['footer']}>
        <slot name="footer" @slotchange=${this._handleSlotChange('footer')}></slot>
      </div>

      <div class="card__actions" part="actions" ?hidden=${!this._hasSlotContent['actions']}>
        <slot name="actions" @slotchange=${this._handleSlotChange('actions')}></slot>
      </div>
    </div>
  `;
}
```

**Template techniques used**:

- **Attribute binding**: `class`, `role`, `tabindex`, `aria-label`, `part`
- **Boolean attribute binding**: `?hidden` for conditional visibility
- **Event binding**: `@click`, `@keydown`, `@slotchange`
- **Conditional values**: `nothing` sentinel for optional attributes
- **classMap directive**: Dynamic class computation

### Example 2: hx-text-input Component

The `hx-text-input` component shows advanced form input patterns:

```typescript
// packages/hx-library/src/components/hx-text-input/hx-text-input.ts
override render() {
  const hasError = !!this.error || this._hasErrorSlot;

  const fieldClasses = {
    field: true,
    'field--error': hasError,
    'field--disabled': this.disabled,
    'field--required': this.required,
  };

  const describedBy = [
    hasError ? this._errorId : null,
    this.helpText ? this._helpTextId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return html`
    <div part="field" class=${classMap(fieldClasses)}>
      <div class="field__label-wrapper">
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label
            ? html`
                <label part="label" class="field__label" for=${this._inputId}>
                  ${this.label}
                  ${this.required
                    ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                    : nothing}
                </label>
              `
            : nothing}
        </slot>
      </div>

      <div part="input-wrapper" class="field__input-wrapper">
        <span class="field__prefix">
          <slot name="prefix"></slot>
        </span>

        <input
          part="input"
          class="field__input"
          id=${this._inputId}
          type=${this.type}
          .value=${live(this.value)}
          placeholder=${ifDefined(this.placeholder || undefined)}
          ?required=${this.required}
          ?disabled=${this.disabled}
          name=${ifDefined(this.name || undefined)}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          aria-labelledby=${ifDefined(this._hasLabelSlot ? `${this._inputId}-slotted-label` : undefined)}
          aria-invalid=${hasError ? 'true' : nothing}
          aria-describedby=${ifDefined(describedBy)}
          aria-required=${this.required ? 'true' : nothing}
          @input=${this._handleInput}
          @change=${this._handleChange}
        />

        <span class="field__suffix">
          <slot name="suffix"></slot>
        </span>
      </div>

      <slot name="error" @slotchange=${this._handleErrorSlotChange}>
        ${this.error
          ? html`
              <div part="error" class="field__error" id=${this._errorId} role="alert" aria-live="polite">
                ${this.error}
              </div>
            `
          : nothing}
      </slot>

      ${this.helpText && !hasError
        ? html`
            <div part="help-text" class="field__help-text" id=${this._helpTextId}>
              <slot name="help-text">${this.helpText}</slot>
            </div>
          `
        : nothing}
    </div>
  `;
}
```

**Template techniques used**:

- **Nested conditionals**: Multiple levels of `? :` ternaries
- **Template composition**: Nested `html` template literals
- **Property binding**: `.value=${live(this.value)}`
- **Boolean attributes**: `?required`, `?disabled`
- **Attribute binding**: `id`, `type`, `name`, ARIA attributes
- **Event binding**: `@input`, `@change`, `@slotchange`
- **Directives**: `ifDefined`, `live`, `classMap`
- **Computed values**: `describedBy` array filtering and joining

### Example 3: hx-checkbox Component

The `hx-checkbox` component demonstrates property binding with the `live` directive:

```typescript
// packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts
override render() {
  const hasError = !!this.error;

  const containerClasses = {
    checkbox: true,
    'checkbox--checked': this.checked,
    'checkbox--indeterminate': this.indeterminate,
    'checkbox--error': hasError,
    'checkbox--disabled': this.disabled,
    'checkbox--required': this.required,
  };

  const describedBy =
    [
      hasError || this._hasErrorSlot ? this._errorId : null,
      this.helpText && !hasError ? this._helpTextId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return html`
    <div class=${classMap(containerClasses)}>
      <label
        part="control"
        class="checkbox__control"
        @click=${this._handleChange}
        @keydown=${this._handleKeyDown}
      >
        <input
          class="checkbox__input"
          type="checkbox"
          id=${this._id}
          .checked=${live(this.checked)}
          .indeterminate=${live(this.indeterminate)}
          ?disabled=${this.disabled}
          ?required=${this.required}
          name=${ifDefined(this.name || undefined)}
          .value=${this.value}
          aria-invalid=${hasError ? 'true' : nothing}
          aria-describedby=${ifDefined(describedBy)}
          aria-labelledby=${this._labelId}
          tabindex="-1"
          @change=${(e: Event) => e.stopPropagation()}
          @click=${(e: Event) => e.preventDefault()}
        />

        <span part="checkbox" class="checkbox__box">
          <svg
            class="checkbox__icon checkbox__icon--check"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <polyline points="3.5 8 6.5 11 12.5 5"></polyline>
          </svg>
          <svg
            class="checkbox__icon checkbox__icon--indeterminate"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <line x1="4" y1="8" x2="12" y2="8"></line>
          </svg>
        </span>

        <span part="label" class="checkbox__label" id=${this._labelId}>
          <slot>${this.label}</slot>
          ${this.required
            ? html`<span class="checkbox__required-marker" aria-hidden="true">*</span>`
            : nothing}
        </span>
      </label>

      <slot name="error" @slotchange=${this._handleErrorSlotChange}>
        ${hasError
          ? html`<div
              part="error"
              class="checkbox__error"
              id=${this._errorId}
              role="alert"
              aria-live="polite"
            >
              ${this.error}
            </div>`
          : nothing}
      </slot>

      ${this.helpText && !hasError
        ? html`
            <div part="help-text" class="checkbox__help-text" id=${this._helpTextId}>
              <slot name="help-text">${this.helpText}</slot>
            </div>
          `
        : nothing}
    </div>
  `;
}
```

**Template techniques used**:

- **Property binding with live**: `.checked=${live(this.checked)}`
- **Inline event handlers**: `@change=${(e: Event) => e.stopPropagation()}`
- **SVG rendering**: Inline SVG in template
- **Nested slots**: Default slot with fallback content
- **Complex conditionals**: Multiple `? :` operators

## Best Practices

### 1. Keep Expressions Simple

Expressions should be simple and readable. Extract complex logic into methods:

```typescript
// Bad: Complex logic in template
html`
  <div class=${this.items.filter(i => i.active).length > 5 ? 'large' : 'small'}>
`

// Good: Extract to method
private get _sizeClass() {
  const activeCount = this.items.filter(i => i.active).length;
  return activeCount > 5 ? 'large' : 'small';
}

html`<div class=${this._sizeClass}>`
```

### 2. Use Directives for Common Patterns

Lit provides directives for common scenarios:

- `classMap`: Dynamic classes
- `styleMap`: Dynamic styles
- `ifDefined`: Optional attributes
- `repeat`: Efficient list rendering with keys
- `live`: Two-way binding for inputs
- `when`: Lazy conditional rendering
- `cache`: Cache template instances

### 3. Prefer Property Binding for Complex Data

Use property binding (`.prop`) rather than attribute binding for objects, arrays, and functions:

```typescript
// Bad: Stringifies object
html`<my-component data=${JSON.stringify(this.data)}></my-component>`;

// Good: Passes reference directly
html`<my-component .data=${this.data}></my-component>`;
```

### 4. Use Boolean Attributes Correctly

Boolean attributes should use the `?` prefix:

```typescript
// Correct
html`<button ?disabled=${this.disabled}>Click</button>`;

// Wrong: Sets attribute to "false" string (still truthy!)
html`<button disabled=${this.disabled}>Click</button>`;
```

### 5. Handle Events Properly

Always type event handlers and access typed targets:

```typescript
private _handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;
}
```

### 6. Use nothing for Truly Conditional Content

Use `nothing` from `lit` instead of empty strings for conditional content:

```typescript
import { nothing } from 'lit';

// Good: Removes element from DOM
html`${this.show ? html`<div>Content</div>` : nothing}`;

// Less ideal: Empty string still takes space in template
html`${this.show ? html`<div>Content</div>` : ''}`;
```

### 7. Compose Templates for Maintainability

Break large templates into smaller, focused methods:

```typescript
override render() {
  return html`
    <div class="component">
      ${this._renderHeader()}
      ${this._renderContent()}
      ${this._renderFooter()}
    </div>
  `;
}

private _renderHeader() {
  return html`<header>...</header>`;
}

private _renderContent() {
  return html`<main>...</main>`;
}

private _renderFooter() {
  return html`<footer>...</footer>`;
}
```

### 8. Avoid Side Effects in render()

The `render()` method should be pure and deterministic:

```typescript
// Bad: Side effects in render
override render() {
  this.count++; // Don't mutate state in render!
  fetch('/api/data'); // Don't trigger side effects!

  return html`<div>${this.count}</div>`;
}

// Good: Pure render, side effects elsewhere
override render() {
  return html`<div>${this.count}</div>`;
}

private _handleClick() {
  this.count++; // Mutate state in event handlers
}
```

## Security Considerations

### Automatic Escaping

Lit automatically escapes text content to prevent XSS attacks. HTML special characters are converted to entities:

```typescript
// Safe: Escaped automatically
const userInput = '<script>alert("xss")</script>';
html`<div>${userInput}</div>`;
// Renders: <div>&lt;script&gt;alert("xss")&lt;/script&gt;</div>
```

### Unsafe HTML

If you need to render trusted HTML, use the `unsafeHTML` directive cautiously:

```typescript
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// WARNING: Only use with trusted, sanitized content
html`<div>${unsafeHTML(this.trustedHTML)}</div>`;
```

Never use `unsafeHTML` with user-provided content unless it has been sanitized through a trusted library like DOMPurify.

### Static Expressions

The `unsafeStatic()` function from `lit/static-html.js` allows dynamic tag names and attribute names, but has performance and security implications:

```typescript
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';

// Use sparingly: Expensive and potentially unsafe
const tagName = unsafeStatic('h1');
staticHtml`<${tagName}>Title</${tagName}>`;
```

Only use `unsafeStatic()` when absolutely necessary, and never with untrusted input.

## Performance Considerations

### Template Caching

Lit caches templates based on their static structure. Changing template structure frequently can impact performance:

```typescript
// Good: Consistent template structure
override render() {
  return html`
    <div>
      ${this.items.map(item => html`<div>${item}</div>`)}
    </div>
  `;
}

// Less efficient: Different templates per condition
override render() {
  if (this.viewMode === 'grid') {
    return html`<div class="grid">...</div>`;
  } else if (this.viewMode === 'list') {
    return html`<div class="list">...</div>`;
  }
  return html`<div class="default">...</div>`;
}
```

### Efficient List Updates

Use the `repeat` directive with stable keys for efficient list updates:

```typescript
import { repeat } from 'lit/directives/repeat.js';

override render() {
  return html`
    <ul>
      ${repeat(
        this.items,
        item => item.id, // Stable key
        item => html`<li>${item.name}</li>`
      )}
    </ul>
  `;
}
```

### Avoid Inline Functions

Define event handlers as methods instead of inline arrow functions to avoid creating new function instances on every render:

```typescript
// Less efficient: New function every render
html`<button @click=${() => this.count++}>Increment</button>`

// More efficient: Reuse method reference
html`<button @click=${this._handleClick}>Increment</button>`

private _handleClick() {
  this.count++;
}
```

## References

- [Lit Templates Overview](https://lit.dev/docs/templates/overview/)
- [Lit Template Expressions](https://lit.dev/docs/templates/expressions/)
- [Lit Component Rendering](https://lit.dev/docs/components/rendering/)
- [Lit Directives](https://lit.dev/docs/templates/directives/)
- [Web Components Best Practices](https://web.dev/custom-elements-best-practices/)

## Related Documentation

- [Component Fundamentals Overview](/components/fundamentals/overview)
- [Lit Directives Guide](/components/directives)
- [Component Rendering Lifecycle](/components/rendering)
- [Styling Components](/components/styling)
- [Reactive Properties](/components/properties)
