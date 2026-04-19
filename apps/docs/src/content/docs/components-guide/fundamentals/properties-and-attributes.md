---
title: Properties and Attributes
description: Understand the difference between JavaScript properties and HTML attributes, and how Lit maps between them.
---

One of the most important distinctions in Web Components development is the difference between **properties** (JavaScript values on the DOM object) and **attributes** (string key-value pairs in the HTML markup). Lit bridges these two worlds, but understanding the underlying model prevents a category of subtle bugs.

## Properties vs Attributes

### Attributes

Attributes live in the HTML and are always strings. They appear in source markup and in DevTools' "Elements" panel:

```html
<hx-button variant="primary" disabled accessible-label="Submit form"></hx-button>
```

Attributes are accessible via:

```javascript
element.getAttribute('variant');       // "primary"
element.hasAttribute('disabled');      // true
element.setAttribute('variant', 'secondary');
element.removeAttribute('disabled');
```

All attribute values are strings. There is no native way to store a number, boolean, array, or object in an HTML attribute — only a serialized string representation.

### Properties

Properties are JavaScript values on the DOM object instance. They are the "real" API of a custom element:

```javascript
const button = document.querySelector('hx-button');
button.variant;   // 'primary' (string)
button.disabled;  // true (boolean)
button.items;     // [{id: 1, ...}] (array)
```

Properties can hold any JavaScript value, including objects, arrays, functions, and class instances. They are not visible in HTML source.

## How Lit Maps Between Them

Lit creates a bidirectional bridge for `@property` fields.

### Attribute → Property (on attribute change)

When an HTML attribute changes (either initially or via `setAttribute`), Lit converts the string value to the property type and triggers a re-render.

```typescript
@property({ type: Number })
count = 0;
```

With `type: Number`, Lit converts the string `"5"` to the number `5`:

```html
<hx-counter count="5"></hx-counter>
```

```javascript
element.count; // 5 (number, not string)
```

### Property → Attribute (reflect)

By default, setting a property does **not** update the attribute. Use `reflect: true` to keep the attribute in sync:

```typescript
@property({ type: String, reflect: true })
variant = 'primary';
```

```javascript
element.variant = 'secondary';
// DOM now: <hx-counter variant="secondary">
```

## Attribute Reflection

`reflect: true` is important for two use cases:

### 1. CSS Attribute Selectors

```typescript
@property({ type: Boolean, reflect: true })
disabled = false;
```

With reflection, `:host([disabled])` CSS rules activate when the property is set to `true` from JavaScript:

```typescript
static override styles = [
  css`
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
  `,
];
```

Without `reflect: true`, the CSS rule would only work if the attribute was set in HTML markup, not via JavaScript.

### 2. DevTools Visibility and Serialization

Reflected properties appear in the element's attribute list in DevTools and are accessible to external attribute observers (like `MutationObserver`).

## Custom Attribute Names

By default, the attribute name is the lowercase version of the property name. For camelCase properties, the attribute name omits uppercase:

```typescript
@property({ type: String })
firstName = '';     // attribute: "firstname" (not "first-name")
```

Use `attribute` to specify the exact attribute name:

```typescript
@property({ type: String, attribute: 'first-name' })
firstName = '';     // attribute: "first-name"

@property({ type: String, attribute: 'aria-label' })
ariaLabel = '';     // attribute: "aria-label"
```

To opt out of attribute observation entirely:

```typescript
@property({ attribute: false })
complexData: Record<string, unknown> = {};
```

## Type Converters

The built-in `type` option handles four primitive types:

| `type` | Attribute value `"true"` | Attribute value `""` (empty) | Attribute absent |
|---|---|---|---|
| `String` | `"true"` | `""` | `null` → default |
| `Number` | `NaN` | `NaN` | `null` → default |
| `Boolean` | `true` | `true` | `false` |
| `Array` | JSON.parse error | `null` | `null` → default |
| `Object` | JSON.parse error | `null` | `null` → default |

**Boolean attributes** follow the HTML convention: any non-null attribute value (including `""` and `"false"`) is truthy. Only the attribute's absence is false.

```html
<!-- All of these set disabled to true -->
<hx-button disabled></hx-button>
<hx-button disabled=""></hx-button>
<hx-button disabled="false"></hx-button>  <!-- still true! -->

<!-- This sets disabled to false -->
<hx-button></hx-button>
```

## Custom Converters

For types that don't serialize cleanly to strings, provide a `converter` with `fromAttribute` and `toAttribute`:

```typescript
// Comma-separated list converter
const csvConverter = {
  fromAttribute(value: string | null): string[] {
    if (value === null) return [];
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  },
  toAttribute(value: string[]): string | null {
    if (!value.length) return null; // removes the attribute
    return value.join(', ');
  },
};

@customElement('hx-tag-input')
export class HelixTagInput extends LitElement {

  @property({ converter: csvConverter, reflect: true })
  tags: string[] = [];

  override render() {
    return html`
      <div class="tags">
        ${this.tags.map((tag) => html`<span class="tag">${tag}</span>`)}
      </div>
    `;
  }
}
```

Usage:

```html
<hx-tag-input tags="react, typescript, web-components"></hx-tag-input>
```

```javascript
element.tags; // ['react', 'typescript', 'web-components']
element.tags = ['lit', 'helix'];
// attribute: tags="lit, helix"
```

## Passing Rich Data from JavaScript

For objects, arrays, and other non-serializable values, always set the property from JavaScript rather than using an attribute:

```javascript
// Wrong: object serialization in attribute is fragile and limited
element.setAttribute('config', JSON.stringify({ theme: 'dark' })); // not recommended

// Correct: set the property directly
element.config = { theme: 'dark', density: 'compact' };
```

In templates, use property bindings (`.prop=`) for rich values:

```html
<!-- HTML attribute (string only) -->
<hx-list items="a,b,c"></hx-list>

<!-- Lit template: property binding (any value) -->
<hx-list .items=${['a', 'b', 'c']}></hx-list>
```

## Upgrading Considerations

Custom elements may be parsed as unknown `HTMLElement` instances before their JavaScript class is loaded. Attributes set before upgrade are preserved and replayed by the browser when the class registers. Properties set before upgrade may be lost.

Lit handles this with its `_$litElement$` marker, but if you are accessing properties before the element upgrades:

```javascript
// Safe pattern
await customElements.whenDefined('hx-select');
const select = document.querySelector('hx-select');
select.value = 'option-1';
```

## Next Steps

- [Reactive Properties](/components-guide/fundamentals/reactive-properties/) — `@property` options and change detection
- [Decorators](/components-guide/fundamentals/decorators/) — full decorator reference
- [Shadow DOM Host Element](/components-guide/shadow-dom/host-element/) — `:host([attr])` CSS patterns
