---
title: Reactive Properties Deep Dive
description: Comprehensive guide to Lit's reactive property system, @property decorator, change detection, type conversion, and advanced reactivity patterns
sidebar:
  order: 2
---

Reactive properties are the foundation of Lit's component state management and rendering system. They serve as the bridge between component data and template updates, automatically triggering re-renders when values change. This deep dive explores the complete reactive property system, from basic @property decorator usage to advanced patterns and performance optimization.

## What Are Reactive Properties?

Reactive properties are class fields that trigger re-renders when their values change. Unlike ordinary class properties, reactive properties are managed by Lit's update system through automatically generated getters and setters. When you assign a new value to a reactive property, Lit detects the change, schedules an update cycle, and re-renders the component's template.

This automatic reactivity eliminates the need for manual DOM manipulation while providing fine-grained control over the update process. Every reactive property can optionally sync with HTML attributes, enabling declarative configuration from markup or frameworks.

### The Reactive Update Contract

When you declare a reactive property, Lit establishes a contract:

1. **Observation**: Property changes are automatically detected
2. **Batching**: Multiple property changes result in a single update
3. **Scheduling**: Updates occur asynchronously at microtask timing
4. **Attribute Binding**: Properties can optionally sync with HTML attributes
5. **Type Safety**: TypeScript strict mode ensures compile-time correctness

This contract is what makes Lit components predictable and performant in enterprise environments.

## Declaration Patterns

Lit provides two approaches for declaring reactive properties: decorators (TypeScript/Babel) and static configuration (vanilla JavaScript).

### Using the @property Decorator

The `@property()` decorator is the recommended approach for TypeScript projects. It provides concise syntax, excellent IDE support, and automatic type inference:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-button')
export class HelixButton extends LitElement {
  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  render() {
    return html`
      <button
        class="button button--${this.variant} button--${this.size}"
        ?disabled=${this.disabled}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

The decorator approach offers several advantages:

- **Type inference**: TypeScript infers the property type from the field declaration
- **Inline documentation**: JSDoc comments appear in IDE autocomplete and Custom Elements Manifest
- **Declarative defaults**: Default values are immediately visible
- **Minimal boilerplate**: No need to declare properties in multiple places

### Static Properties Configuration

For vanilla JavaScript or when decorators aren't available, use the static `properties` field:

```javascript
export class HelixButton extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true, attribute: 'hx-size' },
    disabled: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.variant = 'primary';
    this.size = 'md';
    this.disabled = false;
  }

  render() {
    return html`
      <button
        class="button button--${this.variant} button--${this.size}"
        ?disabled=${this.disabled}
      >
        <slot></slot>
      </button>
    `;
  }
}
```

**Critical JavaScript Warning**: When using static properties configuration, always initialize property values in the constructor, never as class fields. Class fields in JavaScript shadow the prototype accessors that Lit generates, breaking reactivity.

```javascript
// WRONG - breaks reactivity
static properties = {
  count: { type: Number },
};
count = 0; // Shadows Lit's accessor

// CORRECT - preserves reactivity
static properties = {
  count: { type: Number },
};
constructor() {
  super();
  this.count = 0; // Uses Lit's accessor
}
```

TypeScript users can safely use field initializers because the `@property()` decorator sets `accessor: true` on the field, preventing shadowing.

## Property Options Reference

The `@property()` decorator and static properties configuration accept an options object that controls reactivity behavior, attribute binding, and type conversion.

### attribute

**Type**: `string | boolean`
**Default**: `true`

Controls whether the property syncs with an HTML attribute. When `true`, Lit uses the lowercase property name as the attribute name. Provide a custom string to use a different attribute name. Set to `false` to disable attribute binding entirely.

```typescript
// Default: property name → attribute name
@property({ type: String })
variant: string; // Syncs with <hx-button variant="...">

// Custom attribute name
@property({ type: String, attribute: 'hx-size' })
size: string; // Syncs with <hx-button hx-size="...">

// No attribute binding (property-only)
@property({ type: Object, attribute: false })
data: Record<string, unknown> = {}; // Only accessible via JS
```

**When to disable attribute binding:**

- Complex types (Object, Array) that shouldn't be serialized to attributes
- Internal state that should never be set from markup
- Properties that exist solely for JavaScript API consumption
- Performance-sensitive properties that change frequently

### type

**Type**: `StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor`
**Default**: `String`

Specifies the conversion function for deserializing attribute values to property values. Lit provides built-in converters for common types:

```typescript
@property({ type: String })
label: string = ''; // String (default)

@property({ type: Number })
count: number = 0; // Number(attributeValue)

@property({ type: Boolean })
disabled: boolean = false; // Presence = true, absence = false

@property({ type: Array })
items: string[] = []; // JSON.parse(attributeValue)

@property({ type: Object })
config: Record<string, unknown> = {}; // JSON.parse(attributeValue)
```

The `type` option affects both attribute deserialization (HTML → property) and serialization (property → attribute when `reflect: true`).

### converter

**Type**: `AttributeConverter | ((value: string, type?: unknown) => unknown)`
**Default**: Default Lit converter

Provides custom logic for converting between attribute values (strings) and property values (any type). Use this for specialized parsing, validation, or format conversion.

```typescript
interface AttributeConverter<Type = unknown> {
  fromAttribute?: (value: string | null, type?: unknown) => Type;
  toAttribute?: (value: Type, type?: unknown) => string | null;
}
```

**Example: Date string converter**

```typescript
const dateConverter: AttributeConverter<Date | null> = {
  fromAttribute: (value: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },
  toAttribute: (value: Date | null) => {
    return value ? value.toISOString() : null;
  },
};

@property({ converter: dateConverter, reflect: true })
startDate: Date | null = null;
```

**Example: Case-insensitive enum converter**

```typescript
type Variant = 'primary' | 'secondary' | 'ghost';

const variantConverter: AttributeConverter<Variant> = {
  fromAttribute: (value: string | null): Variant => {
    const normalized = (value || 'primary').toLowerCase() as Variant;
    return ['primary', 'secondary', 'ghost'].includes(normalized)
      ? normalized
      : 'primary';
  },
  toAttribute: (value: Variant) => value,
};

@property({ converter: variantConverter, reflect: true })
variant: Variant = 'primary';
```

**Shorthand**: If your converter only needs `fromAttribute`, pass a function directly:

```typescript
@property({
  converter: (value) => value?.toLowerCase() || 'default'
})
mode: string;
```

### reflect

**Type**: `boolean`
**Default**: `false`

When `true`, Lit writes property values back to the corresponding HTML attribute during the update cycle. This enables CSS attribute selectors, external JavaScript access, and visual debugging in DevTools.

```typescript
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' = 'primary';

// In markup:
// <hx-button variant="secondary">
// When property changes to 'primary', attribute updates to:
// <hx-button variant="primary">
```

**Reflection timing**: Properties reflect to attributes in the `update()` lifecycle method, before `render()` is called. This ensures attribute selectors in CSS work correctly.

**When to reflect:**

- Properties that affect component styling via CSS attribute selectors
- Properties that external scripts need to observe (e.g., mutation observers)
- Properties that should be visible in DevTools for debugging
- Boolean states that should be visually inspectable in markup

**When NOT to reflect:**

- Complex types (Object, Array) — serialization overhead
- Properties that change frequently (performance impact)
- Internal state that shouldn't be exposed publicly
- Default values that are truthy (creates spontaneous attributes)

### useDefault

**Type**: `boolean`
**Default**: `false`

When combined with `reflect: true`, prevents the default property value from being reflected on initial render. The attribute only appears when the property is explicitly set to a non-default value. If the attribute is removed, the property resets to its default.

```typescript
@property({ type: String, reflect: true, useDefault: true })
variant: 'primary' | 'secondary' = 'primary';

// On initial render with default 'primary':
// <hx-button></hx-button> (no variant attribute)

// After setting to 'secondary':
// <hx-button variant="secondary"></hx-button>

// After removing attribute:
// element.removeAttribute('variant');
// this.variant === 'primary' (resets to default)
```

This option prevents "spontaneous attributes" from appearing in markup, keeping the DOM clean when properties use their defaults.

### hasChanged

**Type**: `(newVal: T, oldVal: T) => boolean`
**Default**: `(newVal, oldVal) => newVal !== oldVal`

Determines whether a property change should trigger an update. The default implementation uses strict inequality (`!==`), which works for primitive types but requires custom logic for objects, arrays, or specialized comparison.

```typescript
// Default: strict inequality
@property({ type: String })
label: string = ''; // Updates when label !== oldLabel

// Custom: case-insensitive comparison
@property({
  type: String,
  hasChanged(newVal: string, oldVal: string) {
    return newVal?.toLowerCase() !== oldVal?.toLowerCase();
  }
})
mode: string = 'auto';

// Custom: deep equality for objects
import { isEqual } from 'lodash-es';

@property({
  type: Object,
  hasChanged(newVal: Record<string, unknown>, oldVal: Record<string, unknown>) {
    return !isEqual(newVal, oldVal);
  }
})
config: Record<string, unknown> = {};
```

**Performance considerations**: The `hasChanged` function runs on every property assignment, even if the update is ultimately skipped. Keep the logic simple and avoid expensive computations.

### state

**Type**: `boolean`
**Default**: `false`

Marks the property as internal reactive state. State properties trigger updates identically to public properties but never sync with HTML attributes. This is equivalent to `@property({ attribute: false })` with clearer semantic intent.

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('hx-dropdown')
export class HelixDropdown extends LitElement {
  @property({ type: Boolean, reflect: true })
  open: boolean = false; // Public, syncs with attribute

  @state()
  protected activeIndex: number = -1; // Internal, no attribute

  render() {
    return html`
      <div class="dropdown ${this.open ? 'dropdown--open' : ''}">
        <!-- Use activeIndex for keyboard navigation -->
      </div>
    `;
  }
}
```

**When to use @state:**

- Internal UI state (hover, focus, active index)
- Derived values computed from public properties
- Temporary state that should never be set from markup
- Implementation details that aren't part of the public API

**Naming convention**: Prefix state properties with an underscore (`_`) to indicate they're protected or private.

### noAccessor

**Type**: `boolean`
**Default**: `false`

Prevents Lit from generating accessor methods for the property. Use this when defining custom getters/setters or when extending a superclass that already provides accessors.

```typescript
@customElement('hx-input')
export class HelixInput extends LitElement {
  private _value: string = '';

  @property({ noAccessor: true })
  get value(): string {
    return this._value;
  }
  set value(val: string) {
    const oldValue = this._value;
    // Custom validation
    this._value = val.trim();
    // Manually request update
    this.requestUpdate('value', oldValue);
  }
}
```

**Warning**: When using custom accessors, you're responsible for calling `requestUpdate()` to notify Lit of changes. Forgetting this call breaks reactivity.

## Reactivity System Internals

Understanding how Lit's reactivity system works under the hood helps you write more efficient components and debug issues when they arise.

### Accessor Generation

When you declare a reactive property, Lit generates getter and setter methods on the component's prototype. These accessors intercept property assignments and trigger the update cycle.

**Before Lit processing:**

```typescript
@property({ type: String })
variant: string = 'primary';
```

**After Lit processing (conceptual):**

```javascript
// Backing field (private)
__variant = 'primary';

// Generated getter
get variant() {
  return this.__variant;
}

// Generated setter
set variant(value) {
  const oldValue = this.__variant;
  this.__variant = value;
  this.requestUpdate('variant', oldValue);
}
```

The setter calls `requestUpdate()`, passing the property name and old value. This schedules an update and records the change in the `changedProperties` map.

### Update Scheduling

Lit uses **asynchronous microtask scheduling** for updates. When a reactive property changes:

1. The setter calls `requestUpdate()`
2. `requestUpdate()` checks if an update is already scheduled
3. If not, it schedules `performUpdate()` as a microtask
4. Multiple property changes before the microtask executes are batched into a single update

This batching is critical for performance. Without it, changing five properties would trigger five separate renders.

```typescript
// All three changes are batched into a single update
element.variant = 'secondary';
element.size = 'lg';
element.disabled = true;
// Update occurs after current JavaScript task completes
```

Microtask timing means updates occur:

- After all synchronous code in the current task completes
- Before the browser paints the next frame
- Before Promise `.then()` callbacks
- After `queueMicrotask()` callbacks

This guarantees that components render before the browser updates the screen, preventing visual flicker.

### The Update Lifecycle

When an update executes, Lit invokes a series of lifecycle methods in a specific order:

1. **shouldUpdate(changedProperties)**: Returns `true` to proceed or `false` to skip
2. **willUpdate(changedProperties)**: Compute derived values before render
3. **update(changedProperties)**: Reflect properties to attributes, call `render()`
4. **render()**: Return the template result
5. **updated(changedProperties)**: Perform side effects after DOM update
6. **firstUpdated(changedProperties)**: Runs once after the initial render

The `changedProperties` map tracks all properties that changed since the last update:

```typescript
override updated(changedProperties: Map<string, unknown>): void {
  super.updated(changedProperties);

  if (changedProperties.has('value')) {
    const oldValue = changedProperties.get('value');
    console.log(`Value changed from ${oldValue} to ${this.value}`);
    this._internals.setFormValue(this.value);
  }

  if (changedProperties.has('disabled') || changedProperties.has('required')) {
    this._updateValidity();
  }
}
```

**Key insight**: Property changes made during the update cycle (in `willUpdate`, `render`, or `updated`) don't trigger an immediate re-render. If you change a property in `updated()`, it schedules a new update for the next microtask.

## Type Conversion System

Attributes are always strings in HTML, but component properties can be any JavaScript type. Lit's type conversion system bridges this gap, deserializing attribute strings to typed property values and optionally serializing property values back to attribute strings.

### Default Converters

Lit provides built-in converters for common types:

#### String (default)

Direct assignment with no transformation.

```typescript
@property({ type: String })
label: string = '';

// Attribute → Property
// <hx-button label="Click me"> → this.label === "Click me"

// Property → Attribute (with reflect: true)
// this.label = "Submit" → <hx-button label="Submit">
```

#### Number

Converts attribute string to number using `Number(value)`.

```typescript
@property({ type: Number })
count: number = 0;

// Attribute → Property
// <hx-badge count="5"> → this.count === 5
// <hx-badge count="abc"> → this.count === NaN

// Property → Attribute (with reflect: true)
// this.count = 42 → <hx-badge count="42">
```

**Note**: Invalid numbers convert to `NaN`. Implement custom validation in `willUpdate()` or a custom converter if you need to handle invalid input gracefully.

#### Boolean

Presence of the attribute means `true`, absence means `false`. The attribute value is irrelevant.

```typescript
@property({ type: Boolean })
disabled: boolean = false;

// Attribute → Property
// <hx-button disabled> → this.disabled === true
// <hx-button disabled="false"> → this.disabled === true (presence!)
// <hx-button> → this.disabled === false

// Property → Attribute (with reflect: true)
// this.disabled = true → <hx-button disabled="">
// this.disabled = false → <hx-button> (attribute removed)
```

This follows standard HTML boolean attribute semantics (`disabled`, `checked`, `readonly`, etc.).

#### Array

Deserializes JSON string to array, serializes array to JSON string.

```typescript
@property({ type: Array })
items: string[] = [];

// Attribute → Property
// <hx-list items='["a","b","c"]'> → this.items === ["a", "b", "c"]

// Property → Attribute (with reflect: true)
// this.items = ["x", "y"] → <hx-list items='["x","y"]'>
```

**Warning**: JSON serialization in attributes creates large attribute values and can impact performance. For complex arrays, consider property-only binding (`attribute: false`) or use light DOM slots.

#### Object

Deserializes JSON string to object, serializes object to JSON string.

```typescript
@property({ type: Object })
config: { theme: string; locale: string } = { theme: 'light', locale: 'en' };

// Attribute → Property
// <hx-widget config='{"theme":"dark","locale":"fr"}'>
// → this.config === { theme: "dark", locale: "fr" }

// Property → Attribute (with reflect: true)
// this.config = { theme: 'blue', locale: 'es' }
// → <hx-widget config='{"theme":"blue","locale":"es"}'>
```

**Best practice**: Use `attribute: false` for object properties. Serialize complex data structures in attributes only when absolutely necessary.

### Custom Converters

Custom converters give you complete control over attribute serialization and deserialization. Implement an `AttributeConverter` interface or provide a function for `fromAttribute` only.

#### Date Converter Example

```typescript
const dateConverter: AttributeConverter<Date | null> = {
  fromAttribute: (value: string | null): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },
  toAttribute: (value: Date | null): string | null => {
    return value ? value.toISOString() : null;
  },
};

@property({ converter: dateConverter, reflect: true })
appointmentDate: Date | null = null;

// <hx-calendar appointment-date="2026-02-16T10:30:00.000Z">
// → this.appointmentDate === Date object
```

#### Enum with Validation

```typescript
type Status = 'pending' | 'active' | 'completed' | 'error';

const statusConverter: AttributeConverter<Status> = {
  fromAttribute: (value: string | null): Status => {
    const normalized = (value || 'pending').toLowerCase();
    const validStatuses: Status[] = ['pending', 'active', 'completed', 'error'];
    return validStatuses.includes(normalized as Status)
      ? (normalized as Status)
      : 'pending';
  },
  toAttribute: (value: Status) => value,
};

@property({ converter: statusConverter, reflect: true })
status: Status = 'pending';
```

#### CSV String to Array

```typescript
const csvConverter: AttributeConverter<string[]> = {
  fromAttribute: (value: string | null): string[] => {
    if (!value) return [];
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  },
  toAttribute: (value: string[]): string => {
    return value.join(', ');
  },
};

@property({ converter: csvConverter })
tags: string[] = [];

// <hx-card tags="healthcare, emergency, critical">
// → this.tags === ["healthcare", "emergency", "critical"]
```

### Converter Null Handling

When `toAttribute` returns `null`, Lit removes the attribute entirely:

```typescript
const nullableConverter: AttributeConverter<number | null> = {
  fromAttribute: (value) => {
    if (!value) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  },
  toAttribute: (value) => {
    return value === null ? null : String(value);
  },
};

@property({ converter: nullableConverter, reflect: true })
maxAge: number | null = null;

// this.maxAge = null → <hx-filter> (attribute removed)
// this.maxAge = 65 → <hx-filter max-age="65">
```

This pattern keeps the DOM clean by removing attributes for absent optional values.

## Change Detection and Manual Updates

By default, Lit uses strict inequality (`!==`) to detect property changes. This works perfectly for primitive types (strings, numbers, booleans) but requires special handling for objects, arrays, and custom equality logic.

### Default Change Detection

```typescript
@property({ type: String })
mode: string = 'auto';

// Triggers update:
this.mode = 'manual'; // 'auto' !== 'manual'

// Skips update:
this.mode = 'auto'; // 'auto' !== 'auto' is false
```

### Object and Array Mutation

Mutating objects or arrays doesn't trigger updates because the reference stays the same:

```typescript
@property({ type: Array })
items: string[] = [];

// DOES NOT trigger update (same array reference):
this.items.push('new-item');

// DOES trigger update (new array reference):
this.items = [...this.items, 'new-item'];
```

**Solution 1: Immutable updates** (recommended)

```typescript
// Arrays
this.items = [...this.items, newItem]; // Add
this.items = this.items.filter((item) => item !== removed); // Remove
this.items = this.items.map((item) => transform(item)); // Transform

// Objects
this.config = { ...this.config, theme: 'dark' }; // Update
```

**Solution 2: Manual requestUpdate()**

```typescript
this.items.push(newItem);
this.requestUpdate('items', oldItemsArray); // Manually notify Lit
```

**Solution 3: Custom hasChanged**

```typescript
import { isEqual } from 'lodash-es';

@property({
  type: Array,
  hasChanged(newVal: unknown[], oldVal: unknown[]) {
    return !isEqual(newVal, oldVal); // Deep equality
  }
})
items: string[] = [];

// Now mutation triggers update:
this.items.push('new-item'); // Lit calls hasChanged, detects difference
```

**Performance warning**: Deep equality checks are expensive. For large arrays or objects, prefer immutable updates over custom `hasChanged`.

### Manual requestUpdate()

Call `requestUpdate()` explicitly when you need to trigger an update outside the normal property change flow:

```typescript
@customElement('hx-clock')
export class HelixClock extends LitElement {
  @state()
  private _time: Date = new Date();

  override connectedCallback(): void {
    super.connectedCallback();
    // Update every second
    this._interval = setInterval(() => {
      this._time = new Date();
      this.requestUpdate(); // Manual update for timer
    }, 1000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._interval);
  }

  private _interval?: number;

  render() {
    return html`<time>${this._time.toLocaleTimeString()}</time>`;
  }
}
```

**requestUpdate() signature:**

```typescript
requestUpdate(name?: PropertyKey, oldValue?: unknown, options?: PropertyDeclaration): void;
```

- **name**: Property name to record in `changedProperties` map
- **oldValue**: Previous value (for comparison in lifecycle methods)
- **options**: Property options (rarely needed)

Calling without arguments schedules an update without recording a specific property change:

```typescript
// Generic update (no property change tracked)
this.requestUpdate();

// Update with property tracking
this.requestUpdate('status', oldStatus);
```

### Skipping Updates with shouldUpdate

Override `shouldUpdate()` to prevent updates based on custom logic:

```typescript
@customElement('hx-throttled')
export class HelixThrottled extends LitElement {
  @property({ type: Number })
  value: number = 0;

  private _lastUpdate: number = Date.now();

  override shouldUpdate(changedProperties: PropertyValues): boolean {
    // Only update if at least 100ms have passed
    const now = Date.now();
    if (now - this._lastUpdate < 100) {
      return false; // Skip this update
    }
    this._lastUpdate = now;
    return true; // Proceed with update
  }

  render() {
    return html`<div>Value: ${this.value}</div>`;
  }
}
```

Returning `false` from `shouldUpdate()` prevents the entire update cycle from running. No re-render occurs, `updated()` doesn't run, and properties don't reflect to attributes.

## Performance Optimization

Reactive properties are efficient by default, but certain patterns can impact performance in enterprise applications with hundreds of components or frequent updates.

### Attribute Reflection Cost

Reflecting properties to attributes has measurable overhead:

1. Serialize property value to string
2. Call `setAttribute()` (expensive DOM operation)
3. Trigger mutation observers and attribute change callbacks

**Guideline**: Reflect only properties that need to be observed externally or used in CSS selectors.

```typescript
// Good: Reflect for CSS styling
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' = 'primary';

// Bad: No need to reflect internal state
@property({ type: Boolean, reflect: true }) // Unnecessary
private _isAnimating: boolean = false;

// Better:
@state()
private _isAnimating: boolean = false;
```

### Type Conversion Cost

JSON serialization for complex types is expensive:

```typescript
// Expensive: Large object serialized to attribute on every change
@property({ type: Object, reflect: true })
dataSet: Record<string, unknown> = {};

// Better: No attribute binding
@property({ type: Object, attribute: false })
dataSet: Record<string, unknown> = {};

// Best: Pass via property, not attribute
element.dataSet = largeDataObject; // Direct property assignment
```

### Change Detection Cost

Custom `hasChanged` functions run on every property assignment, even when no update occurs:

```typescript
// Expensive: Deep equality check on every assignment
@property({
  type: Array,
  hasChanged(newVal, oldVal) {
    return !isEqual(newVal, oldVal); // Runs every time
  }
})
items: Item[] = [];

// Better: Immutable updates, rely on reference equality
@property({ type: Array })
items: Item[] = [];
// this.items = [...this.items]; // New reference = update
```

**Benchmark**: For a component with 10 properties updating 1000 times per second, custom `hasChanged` adds approximately 5-10ms per second of overhead.

### Update Batching

Leverage Lit's automatic batching by making multiple property changes before awaiting `updateComplete`:

```typescript
// Good: All changes batched into single update
updateUserProfile(profile: UserProfile) {
  this.name = profile.name;
  this.email = profile.email;
  this.role = profile.role;
  this.avatarUrl = profile.avatarUrl;
  // Single render occurs after this function completes
}

// Bad: Awaiting between changes forces separate updates
async updateUserProfileBad(profile: UserProfile) {
  this.name = profile.name;
  await this.updateComplete; // Unnecessary await
  this.email = profile.email;
  await this.updateComplete; // Forces second render
}
```

### Computed Properties Pattern

Avoid reactive properties for derived values that can be computed in `render()`:

```typescript
// Inefficient: Two reactive properties for derived value
@property({ type: String })
firstName: string = '';

@property({ type: String })
lastName: string = '';

@property({ type: String })
fullName: string = ''; // Redundant reactive property

override updated(changedProperties: Map<string, unknown>) {
  if (changedProperties.has('firstName') || changedProperties.has('lastName')) {
    this.fullName = `${this.firstName} ${this.lastName}`; // Triggers extra update
  }
}

// Efficient: Compute in render
@property({ type: String })
firstName: string = '';

@property({ type: String })
lastName: string = '';

render() {
  const fullName = `${this.firstName} ${this.lastName}`;
  return html`<span>${fullName}</span>`;
}
```

## Advanced Patterns

### Custom Accessors with Validation

Implement custom getters and setters to enforce validation or normalize input:

```typescript
@customElement('hx-slider')
export class HelixSlider extends LitElement {
  @property({ type: Number })
  min: number = 0;

  @property({ type: Number })
  max: number = 100;

  private _value: number = 50;

  @property({ type: Number, noAccessor: true })
  get value(): number {
    return this._value;
  }
  set value(val: number) {
    const oldValue = this._value;
    // Clamp value between min and max
    this._value = Math.max(this.min, Math.min(this.max, val));
    this.requestUpdate('value', oldValue);
  }

  render() {
    return html`
      <input
        type="range"
        min=${this.min}
        max=${this.max}
        .value=${String(this.value)}
        @input=${this._handleInput}
      />
    `;
  }

  private _handleInput(e: Event) {
    this.value = Number((e.target as HTMLInputElement).value);
  }
}
```

### Slot Change Triggers Manual Update

Slot changes don't automatically trigger updates. Use `requestUpdate()` in slotchange handlers:

```typescript
@customElement('hx-select')
export class HelixSelect extends LitElement {
  @state()
  private _hasLabelSlot: boolean = false;

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
    this.requestUpdate(); // Manually trigger update
  }

  render() {
    return html`
      <slot name="label" @slotchange=${this._handleLabelSlotChange}>
        ${!this._hasLabelSlot && this.label ? html`<label>${this.label}</label>` : nothing}
      </slot>
    `;
  }
}
```

### Superclass Property Inheritance

When extending a base component, Lit automatically inherits property definitions from the superclass. Only redeclare properties when you need to override options:

```typescript
// Base component
export class BaseInput extends LitElement {
  @property({ type: String })
  value: string = '';

  @property({ type: Boolean, reflect: true })
  disabled: boolean = false;
}

// Subclass: Inherits value and disabled automatically
@customElement('hx-text-input')
export class HelixTextInput extends BaseInput {
  @property({ type: String })
  type: 'text' | 'email' | 'password' = 'text'; // New property

  // No need to redeclare value or disabled
}
```

If you need to change property options in a subclass, use `noAccessor: true` to preserve the superclass accessor:

```typescript
export class BaseInput extends LitElement {
  @property({ type: String })
  value: string = '';
}

@customElement('hx-validated-input')
export class HelixValidatedInput extends BaseInput {
  // Override property options but keep superclass accessor
  static properties = {
    value: { type: String, reflect: true, noAccessor: true },
  };
}
```

## Real-World Examples from HELiX

### Form-Associated Text Input

The `hx-text-input` component demonstrates reactive properties with form integration, validation, and slot tracking:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static formAssociated = true;

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  type: 'text' | 'email' | 'password' | 'tel' = 'text';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  error = '';

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    // React to value changes
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value; // Triggers reactive update
    this._internals.setFormValue(this.value);
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  render() {
    return html`
      <div class="field">
        <label>${this.label}</label>
        <input
          type=${this.type}
          .value=${live(this.value)}
          ?required=${this.required}
          ?disabled=${this.disabled}
          @input=${this._handleInput}
        />
        ${this.error ? html`<span class="error">${this.error}</span>` : nothing}
      </div>
    `;
  }
}
```

**Key techniques:**

- Reactive `value` property syncs with internal input via `live()` directive
- `updated()` lifecycle method reacts to property changes for form integration
- Boolean properties (`required`, `disabled`) use `reflect: true` for CSS styling
- Manual update in `_handleInput` ensures two-way data binding

### Checkbox with Indeterminate State

The `hx-checkbox` component uses both reactive properties and internal state:

```typescript
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean })
  indeterminate = false; // No reflection needed

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  value = 'on';

  @state()
  private _hasErrorSlot = false; // Internal state

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this._internals.setFormValue(this.checked ? this.value : null);
    }
  }

  private _handleChange(): void {
    if (this.disabled) return;

    this.indeterminate = false; // Clear indeterminate
    this.checked = !this.checked; // Toggle checked

    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  }

  render() {
    return html`
      <label>
        <input
          type="checkbox"
          .checked=${live(this.checked)}
          .indeterminate=${live(this.indeterminate)}
          ?disabled=${this.disabled}
        />
        <slot></slot>
      </label>
    `;
  }
}
```

**Key techniques:**

- `@state()` for internal UI state that doesn't need attributes
- Multiple property changes in `_handleChange()` batched into single update
- `updated()` tracks multiple properties for form value synchronization

### Select with Option Syncing

The `hx-select` component demonstrates reactive properties with complex slot observation:

```typescript
@customElement('hx-select')
export class HelixSelect extends LitElement {
  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  @state()
  private _hasLabelSlot = false;

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
      // Sync native select after options render
      if (this._select && this._select.value !== this.value) {
        this._select.value = this.value;
      }
    }
  }

  private _handleSlotChange(): void {
    this._syncOptions(); // Clone options from light DOM
    this.requestUpdate(); // Manual update for slot changes
  }

  private _syncOptions(): void {
    const slot = this.shadowRoot?.querySelector('slot:not([name])');
    const slottedOptions = slot?.assignedElements().filter((el) => el instanceof HTMLOptionElement);

    slottedOptions?.forEach((option) => {
      const clone = option.cloneNode(true);
      this._select.appendChild(clone);
    });
  }

  render() {
    return html`
      <select @change=${this._handleChange}>
        <!-- Options cloned here -->
      </select>
      <slot @slotchange=${this._handleSlotChange} style="display: none;"></slot>
    `;
  }
}
```

**Key techniques:**

- Custom attribute name (`hx-size`) via `attribute` option
- `@state()` for slot tracking (no attribute needed)
- Manual `requestUpdate()` in slot handler
- Post-render synchronization in `updated()`

## Common Pitfalls

### 1. JavaScript Class Field Shadowing

Class fields in JavaScript shadow Lit's prototype accessors, breaking reactivity:

```javascript
// WRONG (JavaScript)
export class MyElement extends LitElement {
  static properties = { count: { type: Number } };
  count = 0; // Shadows accessor - no reactivity
}

// CORRECT (JavaScript)
export class MyElement extends LitElement {
  static properties = { count: { type: Number } };
  constructor() {
    super();
    this.count = 0; // Uses accessor - reactive
  }
}
```

TypeScript users with `@property()` decorator don't face this issue.

### 2. Mutating Objects/Arrays

Reference equality doesn't detect mutation:

```typescript
// WRONG - no update triggered
this.items.push(newItem);

// CORRECT - new reference triggers update
this.items = [...this.items, newItem];
```

### 3. Reflecting Complex Types

Avoid reflecting objects and arrays to attributes:

```typescript
// WRONG - expensive serialization
@property({ type: Object, reflect: true })
data: LargeDataObject = {};

// CORRECT - property-only
@property({ type: Object, attribute: false })
data: LargeDataObject = {};
```

### 4. Forgetting requestUpdate with Custom Accessors

Custom setters must call `requestUpdate()`:

```typescript
// WRONG - no update triggered
@property({ noAccessor: true })
set value(val: string) {
  this._value = val.trim(); // No requestUpdate!
}

// CORRECT
@property({ noAccessor: true })
set value(val: string) {
  const oldValue = this._value;
  this._value = val.trim();
  this.requestUpdate('value', oldValue); // Essential
}
```

### 5. Reflecting Boolean Defaults That Are True

Boolean properties with default `true` create empty attributes:

```typescript
// WRONG - creates <hx-panel expanded="">
@property({ type: Boolean, reflect: true })
expanded = true;

// BETTER - default false, set true from markup
@property({ type: Boolean, reflect: true })
expanded = false;

// BEST - use useDefault
@property({ type: Boolean, reflect: true, useDefault: true })
expanded = true;
```

## References

- [Lit Reactive Properties Documentation](https://lit.dev/docs/components/properties/)
- [Lit Lifecycle Documentation](https://lit.dev/docs/components/lifecycle/)
- [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)
- [Web Components Best Practices (Google)](https://web.dev/articles/custom-elements-best-practices)
- [ElementInternals and Form Participation](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)

---

**Next Steps:**

- Explore [Component Lifecycle](/components/lifecycle) for detailed lifecycle method documentation
- Learn about [Decorators Reference](/components/decorators) for all available decorators
- Study [Styling Deep Dive](/components/fundamentals/styling) for CSS custom properties patterns
- Read [Form-Associated Components](/patterns/forms) for form integration patterns
