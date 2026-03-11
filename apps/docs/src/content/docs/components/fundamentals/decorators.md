---
title: Decorators Reference
description: Comprehensive guide to Lit decorators including @property, @state, @query, @queryAll, @queryAsync, @customElement, and @eventOptions — declarative tools for building reactive web components.
sidebar:
  order: 4
---

# Decorators Reference

Decorators provide a declarative syntax for defining component metadata, reactive properties, internal state, and DOM queries in Lit components. Rather than writing verbose manual configuration, decorators let you annotate class members with compact, readable syntax that integrates directly with Lit's reactive update cycle.

This guide covers all eight Lit decorators, their configuration options, best practices, and when to use each one. Decorators are not required—you can achieve the same functionality using static properties and manual configuration—but they significantly improve code readability and maintainability in TypeScript projects.

## Why Decorators?

Decorators solve a fundamental problem in component development: how to declare metadata about class members without writing boilerplate. Compare these two approaches:

**Without decorators:**

```typescript
class HxButton extends LitElement {
  static properties = {
    label: { type: String, attribute: 'label' },
    disabled: { type: Boolean, reflect: true },
    variant: { type: String },
  };

  constructor() {
    super();
    this.label = 'Click me';
    this.disabled = false;
    this.variant = 'primary';
  }
}
```

**With decorators:**

```typescript
class HxButton extends LitElement {
  @property({ type: String })
  label = 'Click me';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  variant: 'primary' | 'secondary' = 'primary';
}
```

The decorator approach reduces boilerplate, co-locates metadata with the property declaration, and leverages TypeScript's type inference to catch errors at compile time.

## TypeScript Configuration

Decorators are a stage 3 proposal in the ECMAScript specification. Lit uses "experimental decorators" which have better compiler output and wider tooling support than the newer standard decorators proposal.

To enable decorators in TypeScript, configure `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

### Why `useDefineForClassFields: false`?

TypeScript's default class field behavior (when set to `true`) shadows prototype accessors that Lit creates for reactive properties. Setting this to `false` ensures that class field initializers work correctly with Lit's reactive property system.

If you're using TypeScript 4.9 or later, you can use the `accessor` keyword to gradually migrate toward standard decorators while maintaining compatibility:

```typescript
class MyElement extends LitElement {
  @property({ type: String })
  accessor name = 'Default';
}
```

## Importing Decorators

Lit provides two import strategies:

**Bulk import** (convenient for multiple decorators):

```typescript
import { customElement, property, state, query } from 'lit/decorators.js';
```

**Individual imports** (reduces bundle size):

```typescript
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { query } from 'lit/decorators/query.js';
```

For production builds, individual imports can reduce bundle size by eliminating unused decorators. Most projects use bulk imports during development for convenience.

## @property

The `@property()` decorator defines a reactive public property that triggers the component's update cycle when changed. It creates a property/attribute pair by default, allowing declarative configuration in HTML.

### Basic Usage

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-button')
class HxButton extends LitElement {
  @property({ type: String })
  label = 'Click me';

  render() {
    return html`<button>${this.label}</button>`;
  }
}
```

Now consumers can set the property declaratively:

```html
<hx-button label="Save"></hx-button>
```

Or programmatically:

```javascript
const button = document.querySelector('hx-button');
button.label = 'Cancel';
```

### Property Options

The `@property()` decorator accepts a configuration object with the following options:

#### type

Specifies the type hint for attribute conversion. Lit supports five built-in types:

| Type      | Attribute Conversion | Example                   |
| --------- | -------------------- | ------------------------- |
| `String`  | Direct string value  | `'foo'` → `'foo'`         |
| `Number`  | Parsed as float      | `'42'` → `42`             |
| `Boolean` | Presence-based       | `disabled` → `true`       |
| `Array`   | JSON parsed          | `'[1,2,3]'` → `[1, 2, 3]` |
| `Object`  | JSON parsed          | `'{"a":1}'` → `{a: 1}`    |

```typescript
@property({ type: Number })
count = 0;

@property({ type: Boolean })
disabled = false;

@property({ type: Array })
items: string[] = [];
```

**Important:** Boolean properties must default to `false` for proper attribute serialization. If a boolean defaults to `true`, Lit cannot correctly reflect it to an attribute.

#### attribute

Controls attribute name and whether an attribute is created at all:

```typescript
// Default: creates lowercase attribute "firstname"
@property({ type: String })
firstName = '';

// Custom attribute name
@property({ type: String, attribute: 'first-name' })
firstName = '';

// No attribute (property-only)
@property({ type: String, attribute: false })
firstName = '';
```

By default, Lit converts camelCase properties to lowercase attributes. Use `attribute: 'custom-name'` to specify hyphenated names that match HTML conventions.

#### reflect

When `true`, property changes write back to the attribute. This is useful for CSS selectors and accessibility:

```typescript
@property({ type: Boolean, reflect: true })
disabled = false;
```

Now when `disabled` changes, the attribute updates automatically:

```javascript
button.disabled = true;
// <hx-button disabled></hx-button>

button.disabled = false;
// <hx-button></hx-button>
```

**Performance note:** Reflection has a small performance cost because it writes to the DOM on every property change. Only use it when necessary (typically for styling or ARIA attributes).

#### converter

Custom converter for complex attribute/property transformations:

```typescript
@property({
  converter: {
    fromAttribute: (value: string | null): Date | null => {
      return value ? new Date(value) : null;
    },
    toAttribute: (value: Date | null): string | null => {
      return value ? value.toISOString() : null;
    }
  }
})
date: Date | null = null;
```

Now you can use ISO date strings in HTML:

```html
<hx-datepicker date="2024-03-15T10:00:00Z"></hx-datepicker>
```

#### hasChanged

Custom comparison function for change detection. By default, Lit uses strict inequality (`newVal !== oldVal`):

```typescript
@property({
  hasChanged(newVal: string, oldVal: string) {
    // Case-insensitive comparison
    return newVal?.toLowerCase() !== oldVal?.toLowerCase();
  }
})
email = '';
```

This is useful for deep equality checks on objects or custom comparison logic.

#### noAccessor

Prevents Lit from generating property accessors. Use this when you need custom getter/setter logic:

```typescript
@property({ type: String, noAccessor: true })
get value(): string {
  return this._value;
}
set value(val: string) {
  const oldVal = this._value;
  this._value = val.trim(); // Custom logic
  this.requestUpdate('value', oldVal);
}
private _value = '';
```

When using `noAccessor`, you must manually call `requestUpdate()` to trigger the update cycle.

### Property vs. Attribute Behavior

Properties and attributes are synchronized but not identical:

- **Properties** are JavaScript values (any type)
- **Attributes** are always strings in HTML
- Lit converts between them based on the `type` option
- Attribute changes trigger property setters
- Property changes optionally write back to attributes (if `reflect: true`)

```typescript
@property({ type: Number, reflect: true })
count = 0;
```

```javascript
// Property set → attribute reflects
button.count = 42;
console.log(button.getAttribute('count')); // '42'

// Attribute set → property updates
button.setAttribute('count', '100');
console.log(button.count); // 100 (number)
```

## @state

The `@state()` decorator defines internal reactive state that triggers updates but has no corresponding attribute. Use it for private component state that consumers should not access directly.

### When to Use @state

Use `@state()` when:

- The property is internal implementation detail
- No attribute should exist for this property
- The property should remain private or protected
- The property should trigger re-renders when changed

```typescript
@customElement('hx-accordion')
class HxAccordion extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  private _animating = false;

  async toggle() {
    this._animating = true; // Triggers re-render
    this.open = !this.open;
    await this._animate();
    this._animating = false; // Triggers re-render
  }

  render() {
    return html`
      <div class="${this._animating ? 'animating' : ''}">
        <slot></slot>
      </div>
    `;
  }
}
```

### @state vs. @property

| Feature           | @property             | @state            |
| ----------------- | --------------------- | ----------------- |
| Triggers updates  | Yes                   | Yes               |
| Creates attribute | Yes (default)         | No                |
| Public API        | Yes                   | No                |
| Visibility        | Public                | Private/Protected |
| Use case          | Consumer-facing props | Internal state    |

**Best practice:** Mark `@state()` properties as `private` or `protected` to enforce encapsulation:

```typescript
@state()
private _selectedIndex = 0;

@state()
protected _items: Item[] = [];
```

## @query

The `@query()` decorator returns a single element from the component's shadow DOM. It's equivalent to calling `this.renderRoot.querySelector()` but with automatic caching and type inference.

### Basic Usage

```typescript
@customElement('hx-text-input')
class HxTextInput extends LitElement {
  @query('input')
  private _input!: HTMLInputElement;

  focus() {
    this._input.focus();
  }

  render() {
    return html`<input type="text" />`;
  }
}
```

Now the `_input` property automatically references the `<input>` element after the component renders.

### Caching Behavior

By default, `@query()` caches the element reference after the first access. This improves performance but means the reference won't update if the element is removed or replaced.

To disable caching (when queried elements change frequently):

```typescript
@query('button', true) // Second arg enables caching (default behavior)
private _button!: HTMLButtonElement;

@query('.dynamic', false) // Disable caching
private _dynamicEl?: HTMLElement;
```

**When to disable caching:**

- Element appears/disappears conditionally in template
- Multiple elements share the same selector and you need the current one
- Performance impact of re-querying is acceptable

### Type Safety

TypeScript infers the element type from the generic parameter or variable type:

```typescript
// Inferred as HTMLElement
@query('.container')
private _container!: HTMLElement;

// Inferred as HTMLButtonElement
@query('button')
private _button!: HTMLButtonElement;

// Inferred as HxCard (custom element)
@query('hx-card')
private _card!: HxCard;
```

Use the non-null assertion operator (`!`) when you know the element exists after render, or make it optional (`?`) if it's conditional.

### When Elements Are Available

Elements queried with `@query()` are available in lifecycle methods after the first render:

```typescript
firstUpdated() {
  // Elements are available here
  console.log(this._input.value);
}

connectedCallback() {
  super.connectedCallback();
  // Elements NOT available here (render hasn't happened yet)
  // console.log(this._input); // undefined!
}
```

## @queryAll

The `@queryAll()` decorator returns all elements matching a selector, equivalent to `querySelectorAll()`. It returns a `NodeList` that updates on each access if caching is disabled.

### Basic Usage

```typescript
@customElement('hx-tabs')
class HxTabs extends LitElement {
  @queryAll('.tab')
  private _tabs!: NodeListOf<HTMLElement>;

  highlightAll() {
    this._tabs.forEach((tab) => {
      tab.classList.add('highlighted');
    });
  }

  render() {
    return html`
      <div class="tab">Tab 1</div>
      <div class="tab">Tab 2</div>
      <div class="tab">Tab 3</div>
    `;
  }
}
```

### Converting NodeList to Array

`NodeList` doesn't have array methods like `.map()` or `.filter()`. Convert it to an array when needed:

```typescript
@queryAll('input')
private _inputs!: NodeListOf<HTMLInputElement>;

getAllValues(): string[] {
  return Array.from(this._inputs).map(input => input.value);
}
```

Or use the spread operator:

```typescript
const values = [...this._inputs].map((input) => input.value);
```

### Caching Behavior

Like `@query()`, `@queryAll()` caches results by default. To re-query on each access:

```typescript
@queryAll('.item', false) // Disable caching
private _items!: NodeListOf<HTMLElement>;
```

## @queryAsync

The `@queryAsync()` decorator returns a `Promise` that resolves to an element after any pending component updates complete. This is useful when the queried element might not exist immediately due to property changes or conditional rendering.

### Basic Usage

```typescript
@customElement('hx-dialog')
class HxDialog extends LitElement {
  @property({ type: Boolean })
  open = false;

  @queryAsync('#content')
  private _content!: Promise<HTMLElement>;

  async show() {
    this.open = true;
    const content = await this._content;
    content.focus(); // Safe: content exists after update
  }

  render() {
    return html` ${this.open ? html`<div id="content" tabindex="-1">...</div>` : ''} `;
  }
}
```

### When to Use @queryAsync

Use `@queryAsync()` when:

- Elements render conditionally based on reactive properties
- You need to access elements immediately after property changes
- You're performing async operations that depend on updated DOM

```typescript
@property({ type: String })
activeTab = 'tab1';

@queryAsync('#panel')
private _panel!: Promise<HTMLElement>;

async switchTab(tabId: string) {
  this.activeTab = tabId; // Triggers update
  const panel = await this._panel; // Waits for re-render
  panel.scrollTop = 0; // Safe: panel exists
}
```

### Performance Considerations

`@queryAsync()` calls `updateComplete` internally, which waits for the component's entire update cycle. Use `@query()` when elements are guaranteed to exist—reserve `@queryAsync()` for truly dynamic scenarios.

## @customElement

The `@customElement()` decorator registers a custom element with the browser's custom element registry. It's a shorthand for calling `customElements.define()`.

### Basic Usage

```typescript
@customElement('hx-button')
class HxButton extends LitElement {
  render() {
    return html`<button><slot></slot></button>`;
  }
}
```

This is equivalent to:

```typescript
class HxButton extends LitElement {
  render() {
    return html`<button><slot></slot></button>`;
  }
}

customElements.define('hx-button', HxButton);
```

### Tag Name Conventions

The HTML specification requires custom element names to:

- Contain at least one hyphen (`-`)
- Start with a lowercase letter
- Not include uppercase letters

```typescript
// ✓ Valid
@customElement('hx-button')
@customElement('my-awesome-component')
@customElement('x-card')

// ✗ Invalid
@customElement('button')        // No hyphen
@customElement('HxButton')      // Uppercase
@customElement('1-button')      // Starts with number
```

### When to Use @customElement

Always use `@customElement()` in library components. It ensures the element is registered automatically when the module is imported, eliminating manual registration steps for consumers.

**Exception:** Skip `@customElement()` in unit tests when you need to register elements with different names or control registration timing.

## @eventOptions

The `@eventOptions()` decorator configures event listener options for methods decorated with Lit's `@event` binding or used as event handlers. It accepts standard `addEventListener()` options: `capture`, `once`, and `passive`.

### Basic Usage

```typescript
@customElement('hx-scroll-tracker')
class HxScrollTracker extends LitElement {
  @eventOptions({ passive: true })
  private _handleScroll(e: Event) {
    // Passive listener: improves scroll performance
    console.log('Scroll position:', (e.target as Element).scrollTop);
  }

  render() {
    return html`
      <div @scroll="${this._handleScroll}">
        <slot></slot>
      </div>
    `;
  }
}
```

### Options

#### passive

When `true`, indicates the listener will never call `preventDefault()`, allowing the browser to optimize scroll and touch performance:

```typescript
@eventOptions({ passive: true })
private _handleTouchMove(e: TouchEvent) {
  // Cannot call e.preventDefault()
  this._trackPosition(e);
}
```

Use `passive: true` for scroll, touch, and wheel events when you don't need to prevent default behavior.

#### capture

When `true`, the event listener uses capture phase instead of bubbling phase:

```typescript
@eventOptions({ capture: true })
private _handleClickCapture(e: MouseEvent) {
  // Fires during capture phase (before target)
  console.log('Capture phase');
}
```

This is useful for intercepting events before they reach child elements.

#### once

When `true`, the listener automatically removes itself after firing once:

```typescript
@eventOptions({ once: true })
private _handleFirstClick(e: MouseEvent) {
  // Only fires on first click
  console.log('First click detected');
}
```

### Multiple Options

Combine options as needed:

```typescript
@eventOptions({ passive: true, capture: true })
private _handleEvent(e: Event) {
  // Passive + capture phase
}
```

## Decorator Comparison Table

| Decorator                  | Purpose                  | Creates Attribute? | Triggers Updates? | Use Case                 |
| -------------------------- | ------------------------ | ------------------ | ----------------- | ------------------------ |
| `@property()`              | Public reactive property | Yes (default)      | Yes               | Consumer-facing props    |
| `@state()`                 | Private reactive state   | No                 | Yes               | Internal component state |
| `@query()`                 | Query single element     | No                 | No                | Access shadow DOM nodes  |
| `@queryAll()`              | Query multiple elements  | No                 | No                | Access node lists        |
| `@queryAsync()`            | Async element query      | No                 | No                | Conditional DOM access   |
| `@customElement()`         | Register custom element  | N/A                | N/A               | Component registration   |
| `@eventOptions()`          | Configure event listener | No                 | No                | Event handler options    |
| `@queryAssignedElements()` | Query slotted elements   | No                 | No                | Access slot content      |

## When to Use Which Decorator

### Choose @property when:

- The property should be settable via HTML attribute
- The property is part of the public API
- Consumers need declarative configuration
- You want automatic attribute/property sync

### Choose @state when:

- The property is internal implementation detail
- No attribute should exist
- The property should remain private
- You need reactive updates without exposing state

### Choose @query when:

- You need a reference to a single shadow DOM element
- The element exists after first render and doesn't change
- Performance is important (caching enabled by default)

### Choose @queryAll when:

- You need references to multiple elements
- You're iterating over a collection of nodes
- You need a NodeList of matching elements

### Choose @queryAsync when:

- The queried element renders conditionally
- You need to access elements immediately after property updates
- The element might not exist synchronously

### Choose @customElement when:

- You're defining a reusable component for a library
- You want automatic registration on module import
- You're following HELiX conventions

### Choose @eventOptions when:

- You need passive event listeners for performance
- You need capture phase event handling
- You need one-time event listeners

## Common Patterns

### Computed Properties with @state

Use `@state()` for cached computed values:

```typescript
@property({ type: Array })
items: Item[] = [];

@state()
private _filteredItems: Item[] = [];

@property({ type: String })
set filter(value: string) {
  this._filter = value;
  this._filteredItems = this.items.filter(item =>
    item.name.includes(value)
  );
}
get filter(): string {
  return this._filter;
}
private _filter = '';
```

### Form Value Access with @query

Access form controls to read/write values:

```typescript
@query('input[name="email"]')
private _emailInput!: HTMLInputElement;

@query('input[name="password"]')
private _passwordInput!: HTMLInputElement;

getFormData() {
  return {
    email: this._emailInput.value,
    password: this._passwordInput.value
  };
}
```

### Dynamic Styling with @queryAll

Apply styles to multiple elements:

```typescript
@queryAll('.item')
private _items!: NodeListOf<HTMLElement>;

highlightIndex(index: number) {
  this._items.forEach((item, i) => {
    item.classList.toggle('highlighted', i === index);
  });
}
```

### Conditional Rendering with @queryAsync

Handle elements that appear/disappear:

```typescript
@property({ type: Boolean })
showPanel = false;

@queryAsync('#panel')
private _panel!: Promise<HTMLElement>;

async togglePanel() {
  this.showPanel = !this.showPanel;
  if (this.showPanel) {
    const panel = await this._panel;
    panel.focus();
  }
}
```

## Babel Configuration

If you're using Babel instead of TypeScript, configure the decorator plugin with the correct version:

```json
{
  "plugins": [["@babel/plugin-proposal-decorators", { "version": "2023-05" }]]
}
```

Only the `"2023-05"` version is compatible with Lit decorators. Older versions (`"legacy"`, `"2018-09"`) will not work.

## Migration from Static Properties

If you're converting an existing component from static properties to decorators:

**Before:**

```typescript
class HxButton extends LitElement {
  static properties = {
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
    variant: { type: String },
  };

  constructor() {
    super();
    this.label = 'Click me';
    this.disabled = false;
    this.variant = 'primary';
  }
}
```

**After:**

```typescript
class HxButton extends LitElement {
  @property({ type: String })
  label = 'Click me';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  variant: 'primary' | 'secondary' = 'primary';
}
```

## Troubleshooting

### Decorator Property Is Undefined

**Problem:** Property decorated with `@query()` is undefined.

**Solution:** Ensure you access it after `firstUpdated()` or in methods called after render:

```typescript
// ✗ Wrong
connectedCallback() {
  super.connectedCallback();
  console.log(this._input); // undefined
}

// ✓ Correct
firstUpdated() {
  console.log(this._input); // defined
}
```

### Property Changes Don't Trigger Updates

**Problem:** Changing a property doesn't re-render the component.

**Solution:** Ensure `useDefineForClassFields: false` in `tsconfig.json` or use the `accessor` keyword:

```typescript
// Option 1: tsconfig fix
{
  "compilerOptions": {
    "useDefineForClassFields": false
  }
}

// Option 2: accessor keyword
@property({ type: String })
accessor name = 'Default';
```

### Boolean Attribute Doesn't Reflect

**Problem:** Boolean property doesn't write to attribute when `reflect: true`.

**Solution:** Boolean properties must default to `false`:

```typescript
// ✗ Wrong
@property({ type: Boolean, reflect: true })
disabled = true;

// ✓ Correct
@property({ type: Boolean, reflect: true })
disabled = false;
```

## Next Steps

Now that you understand Lit decorators, explore related documentation:

- **[Reactive Properties](/components/fundamentals/reactive-properties/)** — Deep dive into Lit's reactive property system
- **[Component Lifecycle](/components/fundamentals/lifecycle/)** — Learn when properties update and how lifecycle hooks work
- **[Querying Shadow DOM](/components/fundamentals/querying/)** — Advanced DOM querying patterns and best practices

## References

- [Lit Decorators Documentation](https://lit.dev/docs/components/decorators/)
- [Lit Reactive Properties](https://lit.dev/docs/components/properties/)
- [Lit Shadow DOM Guide](https://lit.dev/docs/components/shadow-dom/)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators)
