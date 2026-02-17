---
title: Properties vs Attributes
description: Understanding the difference between JavaScript properties and HTML attributes in web components.
---

# Properties vs Attributes

One of the most common sources of confusion when building web components is the distinction between **HTML attributes** and **JavaScript properties**. They look similar but behave differently, and understanding the difference is required to use Lit's `@property` decorator correctly and to design a clean public API for your components.

---

## The Fundamental Difference

**Attributes** exist in HTML markup. They are always strings (or absent). They live on the element's opening tag and are accessible via `getAttribute()` / `setAttribute()` / `removeAttribute()`.

**Properties** exist on the JavaScript object. They can be any type — string, number, boolean, object, array, function, or even `null`. They are accessed directly on the element reference.

```html
<!-- Attribute: written in HTML, always a string -->
<hx-button variant="primary" disabled></hx-button>
```

```javascript
const btn = document.querySelector('hx-button');

// Property access (JavaScript object)
btn.variant; // 'primary' (string)
btn.disabled; // true (boolean — NOT the string "disabled")
btn.size; // 'md' (default, even though no attribute was set)

// Attribute access
btn.getAttribute('variant'); // 'primary'
btn.getAttribute('disabled'); // '' (empty string — presence means true)
btn.getAttribute('size'); // null (attribute not present)
```

The key point: **an attribute is a string serialization of a property**. They are two representations of the same information, kept in sync by the component through explicit code — either yours or Lit's.

---

## How Lit Maps Between Them

Lit's `@property()` decorator establishes the relationship between a JavaScript property and its corresponding HTML attribute. It does three things:

1. Generates a getter/setter pair that makes the property reactive.
2. Configures which attribute name should be observed for changes.
3. Configures how to convert between the attribute string and the property value.

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-badge')
export class HxBadge extends LitElement {
  // Property: this.count (Number)
  // Attribute: count="5"
  // Conversion: Number(attributeValue)
  @property({ type: Number })
  count = 0;

  render() {
    return html`<span class="badge">${this.count}</span>`;
  }
}
```

When the browser parses `<hx-badge count="5">`, Lit calls `Number("5")` and sets `this.count = 5`. The property is a native JavaScript number — not the string `"5"`.

### The `attribute` Option

By default, Lit uses the lowercased property name as the attribute name. You can override this with the `attribute` option:

```typescript
// Default: property 'maxLength' → attribute 'maxlength'
@property({ type: Number })
maxLength = 100;

// Custom: property 'size' → attribute 'hx-size'
@property({ type: String, attribute: 'hx-size' })
size: 'sm' | 'md' | 'lg' = 'md';

// No attribute at all: only accessible as a JavaScript property
@property({ type: Object, attribute: false })
config: Record<string, unknown> = {};
```

Custom attribute names are useful when you need a namespaced attribute to avoid collisions, or when you are integrating with systems that prefer a specific naming convention.

---

## Type Converters for Common Types

Attributes are always strings in HTML. Lit provides built-in converters that run on every attribute-to-property assignment.

### String (default)

No conversion. The attribute value is used directly.

```typescript
@property({ type: String })
label = '';

// <hx-card label="Patient Summary">
// → this.label === 'Patient Summary'

// <hx-card label="">
// → this.label === ''

// <hx-card> (no attribute)
// → this.label === '' (default value, attribute not observed)
```

### Number

Converts using `Number(value)`. Invalid values produce `NaN`.

```typescript
@property({ type: Number })
count = 0;

// <hx-badge count="42">    → this.count === 42
// <hx-badge count="3.14">  → this.count === 3.14
// <hx-badge count="abc">   → this.count === NaN
// <hx-badge count="">      → this.count === 0 (Number('') === 0)
```

Validate NaN in `willUpdate()` when you cannot guarantee attribute values:

```typescript
import { PropertyValues } from 'lit';

override willUpdate(changed: PropertyValues) {
  if (changed.has('count') && isNaN(this.count)) {
    this.count = 0; // Fall back to default
    console.warn('hx-badge: count attribute must be a number');
  }
}
```

### Boolean

Boolean attribute semantics follow the HTML specification: **the presence of the attribute is `true`, the absence is `false`**. The value of the attribute is irrelevant.

```typescript
@property({ type: Boolean })
disabled = false;

// <hx-button disabled>         → this.disabled === true
// <hx-button disabled="">      → this.disabled === true  (presence)
// <hx-button disabled="false"> → this.disabled === true  (still present!)
// <hx-button>                  → this.disabled === false (absent)
```

This is the same behavior as native HTML attributes like `disabled`, `checked`, and `readonly`. To programmatically clear a boolean attribute, set the property to `false` (or call `removeAttribute()` directly).

### Array and Object

These types use `JSON.parse()` for deserialization and `JSON.stringify()` for serialization.

```typescript
@property({ type: Array })
items: string[] = [];

// <hx-list items='["a","b","c"]'>
// → this.items === ['a', 'b', 'c']

@property({ type: Object })
config: { theme: string } = { theme: 'light' };

// <hx-widget config='{"theme":"dark"}'>
// → this.config === { theme: 'dark' }
```

In practice, passing complex types as attributes is awkward in HTML and expensive to serialize/deserialize. The better pattern is to use `attribute: false` and assign the property directly in JavaScript:

```javascript
const widget = document.querySelector('hx-widget');
widget.config = { theme: 'dark', locale: 'en-US', features: ['alerts'] };
```

---

## `reflect: true` — Writing Properties Back to Attributes

By default, attribute changes flow into properties (attribute → property), but not the other way. Setting `reflect: true` makes the flow bidirectional: when the property changes, Lit writes the updated value back to the attribute.

```typescript
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';
```

```javascript
const btn = document.querySelector('hx-button');

// Property change → attribute updates automatically
btn.variant = 'secondary';
// DOM: <hx-button variant="secondary">

btn.variant = 'primary';
// DOM: <hx-button variant="primary">
```

### Why Use `reflect: true`?

Reflection enables three important patterns:

**1. CSS attribute selectors for styling**

Reflected attributes let you (and consumers) style the host from outside the shadow DOM:

```css
/* Consumer stylesheet */
hx-button[variant='secondary'] {
  /* Custom overrides for secondary buttons */
}

hx-button[disabled] {
  cursor: not-allowed;
}
```

**2. Visibility in browser DevTools**

When you inspect a component in the Elements panel, reflected attributes are visible on the element. This makes debugging significantly easier when you can see `<hx-button variant="secondary" disabled="">` instead of `<hx-button>`.

**3. External JavaScript observation**

Code using `MutationObserver` or checking `element.getAttribute()` can observe reflected properties without accessing internal component state.

### When NOT to Use `reflect: true`

Reflection has a cost. Every time the property changes, Lit calls `setAttribute()`, which is a DOM write. For properties that change frequently or hold complex data, reflection is counterproductive.

**Do not reflect:**

```typescript
// WRONG — object serialization on every change is expensive
@property({ type: Object, reflect: true })
patientRecord: PatientRecord = {};

// WRONG — frequent internal state changes should not pollute the DOM
@state()  // Use @state, not @property, for internal state
private _activeIndex = 0;

// WRONG — default true creates a spurious attribute on every element
@property({ type: Boolean, reflect: true })
expanded = true;
// This renders <hx-accordion expanded=""> even when using defaults

// BETTER — default false, attribute only present when true
@property({ type: Boolean, reflect: true })
expanded = false;
```

As a general rule: reflect only `String` and `Boolean` properties that drive visual state. Never reflect `Object` or `Array` properties.

---

## Attribute Naming Conventions

HTML attributes are case-insensitive. Browsers normalize them to lowercase. Lit handles this mapping automatically for camelCase property names.

```typescript
// Property: camelCase
@property({ type: Number })
maxItems = 10;

// Observed attribute: lowercase (Lit converts automatically)
// <hx-select maxitems="5">
```

For multi-word properties, the attribute becomes all-lowercase (no separator by default):

```typescript
@property({ type: String })
ariaLabel = '';   // attribute: 'arialabel' (all lowercase, no separator)
```

This is rarely what you want for multi-word properties. Use explicit `attribute` values:

```typescript
@property({ type: String, attribute: 'aria-label' })
ariaLabel = '';   // attribute: 'aria-label' (correct kebab-case)

@property({ type: Number, attribute: 'max-items' })
maxItems = 10;   // attribute: 'max-items' (human-readable)
```

The HELiX convention is: **kebab-case attributes for all multi-word properties**. This matches native HTML attribute style and is easiest for Twig templates in Drupal.

---

## `hasChanged`: Custom Change Detection

Lit uses strict inequality (`!==`) by default to decide whether a property change should trigger a re-render. This is correct for primitives. For objects and arrays, it means only reference changes trigger updates — not mutations.

You can override this logic with the `hasChanged` option:

```typescript
import { PropertyDeclaration } from 'lit';

// Case-insensitive string comparison
@property({
  type: String,
  hasChanged(newVal: string, oldVal: string) {
    return newVal?.toLowerCase() !== oldVal?.toLowerCase();
  }
})
mode = 'AUTO';

// Structural equality for a simple value object
@property({
  type: Object,
  hasChanged(newVal: { x: number; y: number }, oldVal: { x: number; y: number }) {
    return newVal.x !== oldVal.x || newVal.y !== oldVal.y;
  }
})
position = { x: 0, y: 0 };
```

`hasChanged` runs on every property assignment, even when the update is ultimately skipped. Keep it fast — avoid anything that allocates memory or does string manipulation on large payloads.

The preferred alternative for complex objects is to maintain immutable data at the call site:

```typescript
// Caller creates a new object reference → Lit's default hasChanged detects it
element.position = { x: element.position.x + 1, y: element.position.y };
```

---

## A Full Working Example

The following component demonstrates attribute mapping, type conversion, reflection, custom attribute names, and the distinction between public properties (with attributes) and internal state (without attributes).

```typescript
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * An alert component demonstrating the full property/attribute surface.
 *
 * @tag hx-alert
 *
 * @attr {string} variant - Visual style: 'info' | 'success' | 'warning' | 'error'
 * @attr {string} heading - Alert heading text
 * @attr {boolean} dismissible - Render dismiss button
 * @attr {number} auto-dismiss - Seconds before auto-dismissal (0 = never)
 * @attr {boolean} [reflected] variant, dismissible — CSS-selectable from outside
 */
@customElement('hx-alert')
export class HxAlert extends LitElement {
  /**
   * Visual variant. Reflected so CSS attribute selectors work.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'info' | 'success' | 'warning' | 'error' = 'info';

  /**
   * Heading text. NOT reflected — strings change too often to warrant DOM writes.
   * @attr heading
   */
  @property({ type: String })
  heading = '';

  /**
   * Enables the dismiss button. Reflected for CSS `:host([dismissible])` selector.
   * @attr dismissible
   */
  @property({ type: Boolean, reflect: true })
  dismissible = false;

  /**
   * Seconds until auto-dismissal. 0 disables auto-dismiss.
   * Multi-word property → explicit kebab-case attribute name.
   * @attr auto-dismiss
   */
  @property({ type: Number, attribute: 'auto-dismiss' })
  autoDismiss = 0;

  /**
   * Complex config object. NO attribute — always set via JavaScript property.
   * Exposing large objects as attributes is an anti-pattern.
   */
  @property({ type: Object, attribute: false })
  metadata: Record<string, unknown> = {};

  /**
   * Internal dismissed state. @state means no attribute binding at all.
   * Changing this triggers a re-render without touching the DOM.
   */
  @state()
  private _dismissed = false;

  /**
   * Timer ID for auto-dismiss. Not reactive — does not trigger renders.
   * Plain private field, not decorated.
   */
  private _timer: ReturnType<typeof setTimeout> | undefined;

  override connectedCallback() {
    super.connectedCallback();

    if (this.autoDismiss > 0) {
      this._timer = setTimeout(() => {
        this._dismissed = true;
      }, this.autoDismiss * 1000);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._timer);
  }

  private _handleDismiss() {
    clearTimeout(this._timer);
    this._dismissed = true;
    this.dispatchEvent(
      new CustomEvent('hx-dismiss', {
        bubbles: true,
        composed: true,
        detail: { variant: this.variant },
      }),
    );
  }

  override render() {
    if (this._dismissed) {
      return nothing;
    }

    return html`
      <div
        class=${classMap({
          alert: true,
          [`alert--${this.variant}`]: true,
        })}
        role="alert"
        aria-live=${this.variant === 'error' ? 'assertive' : 'polite'}
      >
        ${this.heading ? html`<strong class="alert__heading">${this.heading}</strong>` : nothing}

        <div class="alert__body">
          <slot></slot>
        </div>

        ${this.dismissible
          ? html`
              <button
                class="alert__dismiss"
                aria-label=${ifDefined(this.heading ? `Dismiss ${this.heading} alert` : undefined)}
                @click=${this._handleDismiss}
              >
                ×
              </button>
            `
          : nothing}
      </div>
    `;
  }
}
```

**Usage examples showing both attribute and property access patterns:**

```html
<!-- Setting via attributes (Twig, static HTML) -->
<hx-alert variant="warning" heading="Lab Results Pending" dismissible auto-dismiss="10">
  Review results before proceeding with treatment.
</hx-alert>
```

```javascript
// Setting via properties (JavaScript, frameworks)
const alert = document.querySelector('hx-alert');

// Primitives: fine via attribute or property
alert.variant = 'error';
alert.heading = 'Critical Value Detected';
alert.autoDismiss = 30;

// Complex types: always use property, never attribute
alert.metadata = {
  patientId: 'P-00123',
  labOrderId: 'LAB-9981',
  flaggedAt: new Date().toISOString(),
};
```

---

## Quick Reference

| Option       | Type               | Default                  | Purpose                                      |
| ------------ | ------------------ | ------------------------ | -------------------------------------------- |
| `type`       | Constructor        | `String`                 | Attribute-to-property converter              |
| `attribute`  | `string \| false`  | `true` (lowercased name) | Attribute name, or disable attribute binding |
| `reflect`    | `boolean`          | `false`                  | Mirror property changes back to attribute    |
| `hasChanged` | Function           | `(a, b) => a !== b`      | Custom change detection                      |
| `converter`  | Object or Function | Built-in                 | Custom serialization/deserialization         |

| Scenario                              | Recommendation                                        |
| ------------------------------------- | ----------------------------------------------------- |
| Primitive values that drive CSS state | `@property({ type: String/Boolean, reflect: true })`  |
| Primitive values that don't drive CSS | `@property({ type: String/Number })` (no reflect)     |
| Boolean flags                         | `@property({ type: Boolean })`, default `false`       |
| Complex objects / arrays              | `@property({ type: Object/Array, attribute: false })` |
| Internal UI state                     | `@state()`                                            |
| Multi-word property names             | Explicit `attribute: 'kebab-case-name'`               |
| Frequently changing values            | No `reflect`, consider `@state` if not public         |

---

## References

- [Lit Reactive Properties](https://lit.dev/docs/components/properties/)
- [MDN: Element.getAttribute()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute)
- [MDN: Reflecting content attributes to IDL attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes#content_versus_idl_attributes)
- [WHATWG HTML: Boolean attributes](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)
