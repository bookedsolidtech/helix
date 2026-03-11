---
title: Generic Components
description: Master TypeScript generics for web components - generic type parameters, constraints, events, type inference, variance, mapped types, and real-world patterns from hx-library.
sidebar:
  order: 21
---

Generics in TypeScript enable you to write reusable, type-safe components that work with a variety of data types while maintaining strict compile-time checking. For enterprise healthcare web components, generics provide the flexibility to handle different data structures without sacrificing type safety.

This guide explores how generics apply to web component development, covering generic type parameters, constraints, custom events, type inference, variance, mapped types, conditional types, and practical patterns from the hx-library codebase.

## Why Generics Matter for Web Components

Web components frequently need to handle different data types while maintaining type safety:

- **Event payloads** with varying detail types (`CustomEvent<T>`)
- **Form components** that work with different value types (string, number, arrays)
- **List and table components** that render items of any type
- **Utility functions** that query and manipulate elements
- **Test utilities** that work with any component class
- **Controllers** that manage component-specific state

Without generics, you would need to:

- Duplicate code for each type (violates DRY principle)
- Use `any` (loses type safety and strict mode compliance)
- Create complex union types (poor scalability)
- Resort to type assertions everywhere (bypasses type checking)

Generics solve this by allowing you to **parameterize types** while preserving strict mode compliance. They transform TypeScript from a static type checker into a **design tool** that expresses relationships between types.

## Generic Type Parameters

Generic type parameters are placeholders for types that are specified when the generic function, class, or interface is used. They're written in angle brackets `<T>` and conventionally use:

- Single uppercase letters: `T`, `U`, `V`, `K` (for single or simple cases)
- Descriptive names with `T` prefix: `TItem`, `TResult`, `TEvent` (for complex scenarios)

### Basic Generic Function

```typescript
/**
 * Identity function that returns its input unchanged.
 * Works with any type while preserving type information.
 */
function identity<T>(value: T): T {
  return value;
}

// Type inference: T is inferred as number
const num = identity(42); // Type: number

// Explicit type parameter: T is explicitly string
const str = identity<string>('hello'); // Type: string

// Type inference: T is inferred as the specific element type
const button = identity(document.createElement('button')); // Type: HTMLButtonElement
```

The generic parameter `T` acts as a placeholder that TypeScript fills in based on how you use the function. This is called **type inference**.

### Generic Interfaces

Interfaces can be generic, allowing you to define flexible contracts:

```typescript
/**
 * Generic event detail interface.
 * Allows typed event payloads for custom events.
 */
interface CustomEventDetail<T> {
  value: T;
  timestamp: number;
}

// Usage with different value types
const stringDetail: CustomEventDetail<string> = {
  value: 'hello',
  timestamp: Date.now(),
};

const numberDetail: CustomEventDetail<number> = {
  value: 42,
  timestamp: Date.now(),
};

// Type error: value must be boolean
// const invalidDetail: CustomEventDetail<boolean> = {
//   value: 'not a boolean', // ❌ Error
//   timestamp: Date.now(),
// };
```

### Generic Classes

Classes can have generic parameters, allowing instances to work with specific types:

```typescript
/**
 * Generic container for storing and retrieving values.
 */
class ValueStore<T> {
  private _value: T;

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
  }

  /**
   * Transform the stored value using a callback.
   * Introduces a second generic type U for the mapped result.
   */
  map<U>(fn: (value: T) => U): ValueStore<U> {
    return new ValueStore(fn(this._value));
  }
}

// Type inference: T is number
const numberStore = new ValueStore(10);
numberStore.value = 20; // ✅ Type-safe
// numberStore.value = 'string'; // ❌ Error: Type 'string' is not assignable to type 'number'

// Map to a different type
const stringStore = numberStore.map((n) => `Number: ${n}`);
// Type: ValueStore<string>
```

### Multiple Type Parameters

Functions and classes can accept multiple generic parameters:

```typescript
/**
 * Generic key-value pair structure.
 */
interface Pair<K, V> {
  key: K;
  value: V;
}

/**
 * Generic map function that transforms key-value pairs.
 */
function mapPair<K, V, U>(pair: Pair<K, V>, fn: (value: V) => U): Pair<K, U> {
  return {
    key: pair.key,
    value: fn(pair.value),
  };
}

const numberPair: Pair<string, number> = { key: 'age', value: 30 };
const stringPair = mapPair(numberPair, (n) => `${n} years`);
// Type: Pair<string, string>
```

## Generic Constraints

Generic constraints use the `extends` keyword to restrict what types can be passed as type parameters. This allows you to access specific properties or methods on the generic type.

### Basic Constraint

```typescript
/**
 * Generic function that only accepts objects with a 'length' property.
 */
function logLength<T extends { length: number }>(value: T): void {
  console.log(`Length: ${value.length}`);
}

logLength('hello'); // ✅ Strings have a length property
logLength([1, 2, 3]); // ✅ Arrays have a length property
logLength({ length: 10 }); // ✅ Object has a length property
// logLength(42); // ❌ Error: number doesn't have a length property
```

### Constraining to Specific Types

```typescript
/**
 * Generic function that only accepts HTMLElement subtypes.
 */
function getElementTag<T extends HTMLElement>(element: T): string {
  return element.tagName.toLowerCase();
}

const button = document.createElement('button');
const div = document.createElement('div');

getElementTag(button); // ✅ Returns 'button'
getElementTag(div); // ✅ Returns 'div'
// getElementTag(document.createTextNode('text')); // ❌ Error: Text is not an HTMLElement
```

### Constraining to Web Component Classes

```typescript
/**
 * Generic function that only accepts LitElement subclasses.
 */
import { LitElement } from 'lit';

function waitForUpdate<T extends LitElement>(element: T): Promise<boolean> {
  return element.updateComplete;
}

// Usage with any Lit component
import type { HelixButton } from '@hx-library/components';

const button = document.querySelector<HelixButton>('hx-button');
if (button) {
  await waitForUpdate(button); // ✅ Type-safe
}
```

### Multiple Constraints with Intersection Types

You can constrain a generic to multiple interfaces using intersection types:

```typescript
/**
 * Constraint requiring both name and id properties.
 */
interface Named {
  name: string;
}

interface Identified {
  id: string;
}

function logEntity<T extends Named & Identified>(entity: T): void {
  console.log(`Entity ${entity.id}: ${entity.name}`);
}

// ✅ Satisfies both constraints
logEntity({ id: '123', name: 'Component' });

// ❌ Error: missing 'name' property
// logEntity({ id: '123' });
```

### Keyof Constraints

The `keyof` operator creates a union type of an object's keys, enabling powerful generic patterns:

```typescript
/**
 * Generic function that extracts a property value from an object.
 * K is constrained to be a key of T.
 */
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: 'Alice', age: 30 };

// Type inference: T is { name: string; age: number }, K is 'name'
const name = getProperty(person, 'name'); // Type: string

// Type inference: K is 'age'
const age = getProperty(person, 'age'); // Type: number

// ❌ Error: 'address' is not a key of person
// const address = getProperty(person, 'address');
```

### Indexed Access Types

You can use indexed access types to reference property types:

```typescript
/**
 * Extract the type of a specific property from an object.
 */
type PropertyType<T, K extends keyof T> = T[K];

interface User {
  id: string;
  name: string;
  age: number;
}

type UserId = PropertyType<User, 'id'>; // Type: string
type UserAge = PropertyType<User, 'age'>; // Type: number
```

## Generic Events

Custom events in web components benefit significantly from generics. TypeScript's `CustomEvent<T>` allows you to type the event detail payload.

### Defining Generic Event Details

```typescript
/**
 * Event detail for hx-input component.
 */
interface HxInputDetail {
  value: string;
  originalEvent: InputEvent;
}

/**
 * Event detail for hx-change component.
 */
interface HxChangeDetail {
  value: string;
  previousValue: string;
}

/**
 * Event detail for hx-select component.
 */
interface HxSelectDetail {
  value: string;
}
```

### Dispatching Typed Events

From `packages/hx-library/src/components/hx-select/hx-select.ts`:

```typescript
private _handleChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);
  this._updateValidity();

  /**
   * Dispatched when the selected option changes.
   * @event hx-change
   */
  this.dispatchEvent(
    new CustomEvent<{ value: string }>('hx-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
}
```

The `CustomEvent<{ value: string }>` generic parameter ensures that `detail` is typed correctly. TypeScript will error if you try to access a property that doesn't exist on the detail object.

### Type-Safe Event Listeners

```typescript
/**
 * Type-safe event listener for hx-change events.
 */
function handleSelectChange(e: CustomEvent<HxChangeDetail>): void {
  console.log(`Selected: ${e.detail.value}`);
  // ✅ TypeScript knows the shape of e.detail
}

const select = document.querySelector<HelixSelect>('hx-select');
select?.addEventListener('hx-change', handleSelectChange as EventListener);
```

**Note:** The `as EventListener` cast is required because TypeScript's built-in `addEventListener` types don't support generic `CustomEvent` types. This is a safe cast because we control the event type.

### Generic Event Map Pattern

For components that dispatch multiple events, define an event map interface:

```typescript
/**
 * Event map for hx-button component.
 */
interface HxButtonEventMap {
  'hx-click': CustomEvent<{ originalEvent: MouseEvent }>;
  'hx-focus': CustomEvent<{ focused: boolean }>;
  'hx-blur': CustomEvent<{ focused: boolean }>;
}

/**
 * Type-safe addEventListener wrapper.
 */
function addButtonListener<K extends keyof HxButtonEventMap>(
  button: HelixButton,
  eventName: K,
  handler: (event: HxButtonEventMap[K]) => void,
): void {
  button.addEventListener(eventName, handler as EventListener);
}

// Usage
const button = document.querySelector<HelixButton>('hx-button');
if (button) {
  addButtonListener(button, 'hx-click', (e) => {
    console.log(e.detail.originalEvent.clientX); // ✅ Type-safe access
  });
}
```

### Extending EventTarget with Generic Events

You can extend `EventTarget` to provide type-safe event dispatching:

```typescript
/**
 * Type-safe event target with generic event map.
 */
class TypedEventTarget<TEventMap extends Record<string, Event>> extends EventTarget {
  addEventListener<K extends keyof TEventMap>(
    type: K,
    listener: (event: TEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type as string, listener as EventListener, options);
  }

  removeEventListener<K extends keyof TEventMap>(
    type: K,
    listener: (event: TEventMap[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type as string, listener as EventListener, options);
  }

  dispatchEvent<K extends keyof TEventMap>(event: TEventMap[K]): boolean {
    return super.dispatchEvent(event);
  }
}

// Usage
interface ButtonEventMap {
  click: CustomEvent<{ x: number; y: number }>;
}

class TypedButton extends TypedEventTarget<ButtonEventMap> {
  handleClick(x: number, y: number): void {
    this.dispatchEvent(
      new CustomEvent('click', {
        detail: { x, y },
      }),
    );
  }
}
```

## Type Inference

TypeScript can infer generic type parameters from usage, reducing the need for explicit type annotations.

### Function Argument Inference

```typescript
/**
 * Generic function with type inference from arguments.
 */
function toArray<T>(value: T): T[] {
  return [value];
}

// Type inference: T is inferred as number
const numbers = toArray(42); // Type: number[]

// Type inference: T is inferred as string
const strings = toArray('hello'); // Type: string[]

// Type inference: T is inferred as HTMLButtonElement
const button = document.createElement('button');
const buttons = toArray(button); // Type: HTMLButtonElement[]
```

### Return Type Inference

TypeScript infers the return type based on the generic parameter:

```typescript
/**
 * Generic function that returns the first element of an array.
 */
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const numbers = [1, 2, 3];
const firstNum = first(numbers); // Type: number | undefined

const strings = ['a', 'b', 'c'];
const firstStr = first(strings); // Type: string | undefined
```

### Inference with Constraints

```typescript
/**
 * Generic function with constraint and type inference.
 */
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: 'Alice', age: 30 };

// Type inference: T is { name: string; age: number }, K is 'name'
const name = getProperty(person, 'name'); // Type: string

// Type inference: K is 'age'
const age = getProperty(person, 'age'); // Type: number

// ❌ Error: 'address' is not a key of person
// const address = getProperty(person, 'address');
```

### Contextual Type Inference

TypeScript uses context to infer types in callbacks:

```typescript
/**
 * Generic map function with contextual inference.
 */
function mapArray<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

const numbers = [1, 2, 3];

// TypeScript infers item: number, return type: string
const strings = mapArray(numbers, (item) => item.toString());
// Type: string[]
```

### Type Parameter Defaults

You can provide default type parameters for generics:

```typescript
/**
 * Generic response wrapper with default error type.
 */
interface ApiResponse<T, E = Error> {
  data: T | null;
  error: E | null;
}

// Uses default error type (Error)
const response1: ApiResponse<User> = {
  data: { id: '1', name: 'Alice', age: 30 },
  error: null,
};

// Explicit error type
interface ValidationError {
  field: string;
  message: string;
}

const response2: ApiResponse<User, ValidationError> = {
  data: null,
  error: { field: 'email', message: 'Invalid email' },
};
```

## Generic Property Types

Lit components can use generics in property types to create flexible, reusable components.

### Generic Data Property

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Generic list item component that renders items of any type.
 */
@customElement('hx-list')
export class HelixList<T> extends LitElement {
  @property({ type: Array })
  items: T[] = [];

  @property({ attribute: false })
  renderItem?: (item: T) => unknown;

  override render() {
    return html`
      <ul>
        ${this.items.map(
          (item) => html`<li>${this.renderItem ? this.renderItem(item) : item}</li>`,
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list': HelixList<unknown>;
  }
}
```

**Important:** When registering generic components in `HTMLElementTagNameMap`, use a concrete type (often `unknown`) because the tag name is not parameterized.

### Usage with Specific Types

```typescript
interface User {
  id: string;
  name: string;
}

const users: User[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

const list = document.createElement('hx-list') as HelixList<User>;
list.items = users;
list.renderItem = (user) => `${user.name} (${user.id})`;
document.body.appendChild(list);
```

### Generic Property Constraints

```typescript
/**
 * Constraint: items must have an 'id' property.
 */
interface Identifiable {
  id: string;
}

@customElement('hx-data-table')
export class HelixDataTable<T extends Identifiable> extends LitElement {
  @property({ type: Array })
  items: T[] = [];

  private _getRowId(item: T): string {
    return item.id; // ✅ TypeScript knows 'id' exists
  }

  override render() {
    return html`
      <table>
        ${this.items.map(
          (item) =>
            html`<tr data-id=${this._getRowId(item)}>
              <td>${JSON.stringify(item)}</td>
            </tr>`,
        )}
      </table>
    `;
  }
}
```

## Generic Methods

Class methods can be generic, allowing them to work with different types on a per-call basis.

### Generic Utility Methods

```typescript
/**
 * Generic method that filters elements by type.
 */
class ComponentRegistry {
  private _components: HTMLElement[] = [];

  register(component: HTMLElement): void {
    this._components.push(component);
  }

  /**
   * Get all components of a specific type.
   */
  getByType<T extends HTMLElement>(tagName: string): T[] {
    return this._components.filter((c) => c.tagName.toLowerCase() === tagName) as T[];
  }
}

const registry = new ComponentRegistry();
registry.register(document.createElement('hx-button'));
registry.register(document.createElement('hx-card'));

// Type inference: T is HelixButton
const buttons = registry.getByType<HelixButton>('hx-button');
// Type: HelixButton[]
```

### Generic Query Methods

From the hx-library test utilities (`packages/hx-library/src/test-utils.ts`):

```typescript
/**
 * Query a single element inside a host's shadow DOM.
 * Default type parameter is Element for maximum flexibility.
 */
export function shadowQuery<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T | null {
  return host.shadowRoot?.querySelector<T>(selector) ?? null;
}

/**
 * Query all elements inside a host's shadow DOM.
 * Returns an array for easier manipulation.
 */
export function shadowQueryAll<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T[] {
  return Array.from(host.shadowRoot?.querySelectorAll<T>(selector) ?? []);
}
```

**Usage:**

```typescript
import { fixture, shadowQuery } from '@hx-library/test-utils';

const button = await fixture<HelixButton>('<hx-button>Click me</hx-button>');

// Type inference: T is HTMLButtonElement
const nativeButton = shadowQuery<HTMLButtonElement>(button, 'button');
nativeButton?.click(); // ✅ Type-safe
```

### Generic Fixture Helper

```typescript
/**
 * Creates a web component fixture, appends it to the DOM,
 * and waits for Lit's updateComplete lifecycle.
 *
 * Generic constraint ensures the element is an HTMLElement,
 * enabling access to DOM methods like appendChild.
 */
export async function fixture<T extends HTMLElement>(html: string): Promise<T> {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const el = wrapper.firstElementChild as T;
  fixtureContainer.appendChild(el);

  // Wait for Lit updateComplete if the element supports it
  if ('updateComplete' in el) {
    await (el as T & { updateComplete: Promise<boolean> }).updateComplete;
  }

  return el;
}
```

**Usage:**

```typescript
import { fixture } from '@hx-library/test-utils';

// Type inference: T is HelixButton
const button = await fixture<HelixButton>('<hx-button variant="primary">Click</hx-button>');
expect(button.variant).toBe('primary'); // ✅ Type-safe property access
```

## Advanced Generic Patterns

### Conditional Types

Conditional types enable type-level branching logic:

```typescript
/**
 * Extract the element type from an array type.
 */
type ArrayElement<T> = T extends (infer U)[] ? U : never;

type Numbers = ArrayElement<number[]>; // Type: number
type Strings = ArrayElement<string[]>; // Type: string
type NotArray = ArrayElement<number>; // Type: never

/**
 * Extract the detail type from a CustomEvent.
 */
type EventDetail<T> = T extends CustomEvent<infer D> ? D : never;

type ClickDetail = EventDetail<CustomEvent<{ x: number; y: number }>>;
// Type: { x: number; y: number }
```

### Mapped Types

Mapped types transform all properties of an object type:

```typescript
/**
 * Make all properties optional.
 */
type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Make all properties required.
 */
type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Make all properties readonly.
 */
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Pick specific properties from a type.
 */
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Usage
interface User {
  id: string;
  name: string;
  age: number;
}

type PartialUser = Partial<User>;
// Type: { id?: string; name?: string; age?: number; }

type UserName = Pick<User, 'name'>;
// Type: { name: string; }
```

### Template Literal Types

Template literal types enable string manipulation at the type level:

```typescript
/**
 * Component tag name type that enforces 'hx-' prefix.
 */
type ComponentTag = `hx-${string}`;

/**
 * CSS custom property type that enforces '--hx-' prefix.
 */
type CSSCustomProp = `--hx-${string}`;

/**
 * Kebab-case to camelCase conversion.
 */
type KebabToCamel<S extends string> = S extends `${infer T}-${infer U}`
  ? `${T}${Capitalize<KebabToCamel<U>>}`
  : S;

type ButtonTag = KebabToCamel<'hx-button'>; // Type: 'hxButton'
```

### Variadic Tuple Types

Variadic tuple types enable generic operations on tuples of varying lengths:

```typescript
/**
 * Concatenate two tuples.
 */
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];

type Result = Concat<[1, 2], [3, 4]>; // Type: [1, 2, 3, 4]

/**
 * Prepend an element to a tuple.
 */
type Prepend<T extends unknown[], U> = [U, ...T];

type WithId = Prepend<[string, number], 'id'>; // Type: ['id', string, number]
```

### Recursive Types

Recursive types enable complex data structure modeling:

```typescript
/**
 * Recursive type for nested objects.
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface Config {
  theme: {
    colors: {
      primary: string;
      secondary: string;
    };
  };
}

type PartialConfig = DeepPartial<Config>;
// Type: {
//   theme?: {
//     colors?: {
//       primary?: string;
//       secondary?: string;
//     };
//   };
// }
```

## Real-World Examples

### Example 1: Generic Event Listener Utility

```typescript
/**
 * Waits for a single event of a specific type to occur on an element.
 * Returns the event and removes the listener after the first occurrence.
 *
 * Default type parameter is Event for maximum flexibility.
 */
export function oneEvent<T extends Event = Event>(el: EventTarget, eventName: string): Promise<T> {
  return new Promise<T>((resolve) => {
    el.addEventListener(eventName, ((e: Event) => resolve(e as T)) as EventListener, {
      once: true,
    });
  });
}
```

**Usage:**

```typescript
import { oneEvent } from '@hx-library/test-utils';

// Type inference: T is CustomEvent<{ value: string }>
const changeEvent = await oneEvent<CustomEvent<{ value: string }>>(select, 'hx-change');
expect(changeEvent.detail.value).toBe('option-1'); // ✅ Type-safe
```

### Example 2: Generic Type Guard

Type guards can be generic to narrow types safely:

```typescript
/**
 * Type guard that checks if an element is a specific web component.
 * Uses the 'is' keyword to narrow the type.
 */
function isComponent<T extends HTMLElement>(element: Element, tagName: string): element is T {
  return element.tagName.toLowerCase() === tagName;
}

const elements = document.querySelectorAll('*');
Array.from(elements).forEach((el) => {
  if (isComponent<HelixButton>(el, 'hx-button')) {
    // TypeScript knows 'el' is HelixButton here
    console.log(el.variant); // ✅ Type-safe property access
  }
});
```

### Example 3: Generic Property Extraction

```typescript
/**
 * Extract property values from all elements in an array.
 * Uses keyof constraint to ensure key exists on items.
 */
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

interface User {
  id: string;
  name: string;
  age: number;
}

const users: User[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
];

// Type inference: K is 'name', return type is string[]
const names = pluck(users, 'name');
// Type: string[]

// Type inference: K is 'age', return type is number[]
const ages = pluck(users, 'age');
// Type: number[]
```

### Example 4: Generic Form Data Collector

```typescript
/**
 * Collects form data from a form element and types the result.
 * Uses Record constraint to ensure result is an object.
 */
function getFormData<T extends Record<string, FormDataEntryValue>>(form: HTMLFormElement): T {
  const formData = new FormData(form);
  const result = {} as T;

  formData.forEach((value, key) => {
    (result as Record<string, FormDataEntryValue>)[key] = value;
  });

  return result;
}

// Define expected form shape
interface ContactFormData {
  name: FormDataEntryValue;
  email: FormDataEntryValue;
  message: FormDataEntryValue;
}

const form = document.querySelector<HTMLFormElement>('form');
if (form) {
  const data = getFormData<ContactFormData>(form);
  console.log(data.name); // ✅ Type-safe access
}
```

### Example 5: Generic Component Factory

```typescript
/**
 * Factory function that creates and configures components.
 * Uses Partial<T> to allow partial property initialization.
 */
function createComponent<T extends HTMLElement>(tagName: string, props?: Partial<T>): T {
  const element = document.createElement(tagName) as T;

  if (props) {
    Object.assign(element, props);
  }

  return element;
}

// Usage with type inference
const button = createComponent<HelixButton>('hx-button', {
  variant: 'primary',
  size: 'lg',
  disabled: false,
});

document.body.appendChild(button);
```

### Example 6: Generic Reactive Controller

```typescript
import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Generic controller that manages a single value with change notifications.
 */
export class ValueController<T> implements ReactiveController {
  private readonly _host: ReactiveControllerHost;
  private _value: T;
  private readonly _onChange?: (value: T, oldValue: T) => void;

  constructor(
    host: ReactiveControllerHost,
    initialValue: T,
    onChange?: (value: T, oldValue: T) => void,
  ) {
    this._host = host;
    this._value = initialValue;
    this._onChange = onChange;
    this._host.addController(this);
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    const oldValue = this._value;
    if (oldValue !== newValue) {
      this._value = newValue;
      this._onChange?.(newValue, oldValue);
      this._host.requestUpdate();
    }
  }

  hostConnected(): void {}
  hostDisconnected(): void {}
}

// Usage in a component
@customElement('hx-counter')
export class HelixCounter extends LitElement {
  private _count = new ValueController(this, 0, (newVal, oldVal) => {
    console.log(`Count changed from ${oldVal} to ${newVal}`);
  });

  increment(): void {
    this._count.value += 1;
  }

  override render() {
    return html`<div>Count: ${this._count.value}</div>`;
  }
}
```

### Example 7: Generic Data Fetcher

```typescript
/**
 * Generic data fetcher with type-safe response handling.
 */
async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return (await response.json()) as T;
}

interface User {
  id: string;
  name: string;
  email: string;
}

// Type inference: T is User
const user = await fetchData<User>('/api/users/1');
console.log(user.name); // ✅ Type-safe
```

### Example 8: Generic Validation Function

```typescript
/**
 * Generic validation result.
 */
interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Generic validator function.
 */
type Validator<T> = (data: unknown) => ValidationResult<T>;

/**
 * Create a validator with type constraints.
 */
function createValidator<T>(validate: (data: unknown) => T | null): Validator<T> {
  return (data: unknown): ValidationResult<T> => {
    try {
      const result = validate(data);
      if (result === null) {
        return { valid: false, errors: ['Validation failed'] };
      }
      return { valid: true, data: result };
    } catch (error) {
      return { valid: false, errors: [(error as Error).message] };
    }
  };
}

// Usage
const validateUser = createValidator<User>((data) => {
  if (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  ) {
    return data as User;
  }
  return null;
});

const result = validateUser({ id: '1', name: 'Alice', email: 'alice@example.com' });
if (result.valid && result.data) {
  console.log(result.data.name); // ✅ Type-safe
}
```

## Testing Generic Components

When testing generic components, use explicit type parameters to ensure type safety:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup, oneEvent } from '@hx-library/test-utils';
import type { HelixSelect } from './hx-select.js';

describe('hx-select', () => {
  afterEach(cleanup);

  it('dispatches typed change event', async () => {
    // Explicit type parameter for fixture
    const select = await fixture<HelixSelect>(`
      <hx-select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </hx-select>
    `);

    const changePromise = oneEvent<CustomEvent<{ value: string }>>(select, 'hx-change');

    select.value = 'b';

    const event = await changePromise;
    expect(event.detail.value).toBe('b'); // ✅ Type-safe assertion
  });
});
```

### Testing Generic Utility Functions

```typescript
describe('shadowQuery', () => {
  it('returns correctly typed elements', async () => {
    const button = await fixture<HelixButton>('<hx-button>Click</hx-button>');

    // Query with explicit type parameter
    const nativeButton = shadowQuery<HTMLButtonElement>(button, 'button');

    expect(nativeButton).toBeInstanceOf(HTMLButtonElement);
    expect(nativeButton?.tagName).toBe('BUTTON');
  });

  it('returns null for non-existent elements', async () => {
    const button = await fixture<HelixButton>('<hx-button>Click</hx-button>');

    const missing = shadowQuery<HTMLDivElement>(button, '.non-existent');
    expect(missing).toBeNull();
  });
});
```

## Variance in Generics

Variance describes how subtyping relationships between types affect generic types. Understanding variance is crucial for designing safe generic APIs.

### Covariance

A generic type is **covariant** if `T<A>` is a subtype of `T<B>` when `A` is a subtype of `B`.

```typescript
/**
 * Covariant generic (read-only position).
 */
interface Producer<T> {
  produce(): T;
}

// HTMLButtonElement is a subtype of HTMLElement
const buttonProducer: Producer<HTMLButtonElement> = {
  produce: () => document.createElement('button'),
};

// ✅ Covariance: Can assign Producer<HTMLButtonElement> to Producer<HTMLElement>
const elementProducer: Producer<HTMLElement> = buttonProducer;
```

### Contravariance

A generic type is **contravariant** if `T<A>` is a subtype of `T<B>` when `B` is a subtype of `A` (opposite direction).

```typescript
/**
 * Contravariant generic (write-only position).
 */
interface Consumer<T> {
  consume(value: T): void;
}

// HTMLElement consumer accepts any HTMLElement
const elementConsumer: Consumer<HTMLElement> = {
  consume: (el) => console.log(el.tagName),
};

// ✅ Contravariance: Can assign Consumer<HTMLElement> to Consumer<HTMLButtonElement>
const buttonConsumer: Consumer<HTMLButtonElement> = elementConsumer;
```

### Invariance

A generic type is **invariant** if it's neither covariant nor contravariant. This occurs when the type parameter is used in both read and write positions.

```typescript
/**
 * Invariant generic (read-write position).
 */
interface Storage<T> {
  get(): T;
  set(value: T): void;
}

const buttonStorage: Storage<HTMLButtonElement> = {
  get: () => document.createElement('button'),
  set: (btn) => console.log(btn),
};

// ❌ Invariance: Cannot assign Storage<HTMLButtonElement> to Storage<HTMLElement>
// const elementStorage: Storage<HTMLElement> = buttonStorage;
```

## Best Practices

### 1. Use Descriptive Type Parameter Names

While `T` is conventional for single parameters, use descriptive names for multiple parameters or complex scenarios:

```typescript
// ❌ Unclear
function merge<T, U>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// ✅ Clear
function merge<TFirst, TSecond>(first: TFirst, second: TSecond): TFirst & TSecond {
  return { ...first, ...second };
}

// ✅ Even clearer for specific domains
function mapItems<TItem, TResult>(items: TItem[], mapper: (item: TItem) => TResult): TResult[] {
  return items.map(mapper);
}
```

### 2. Constrain Generics When Possible

Constraints improve type safety and enable better IDE autocomplete:

```typescript
// ❌ Too permissive
function getId<T>(entity: T): unknown {
  return (entity as { id?: unknown }).id;
}

// ✅ Constrained and type-safe
interface Identified {
  id: string;
}

function getId<T extends Identified>(entity: T): string {
  return entity.id;
}
```

### 3. Avoid Generic Overuse

Not everything needs to be generic. Use generics when you need flexibility across multiple types:

```typescript
// ❌ Unnecessary generic
function logMessage<T extends string>(message: T): void {
  console.log(message);
}

// ✅ Simple string parameter is sufficient
function logMessage(message: string): void {
  console.log(message);
}
```

### 4. Leverage Type Inference

Let TypeScript infer types when possible to reduce verbosity:

```typescript
// ❌ Redundant explicit type parameter
const buttons = shadowQueryAll<HTMLButtonElement>(component, 'button');

// ✅ Type inference works if the variable is typed
const buttons: HTMLButtonElement[] = shadowQueryAll(component, 'button');

// ✅ Or use type assertion at the call site
const buttons = shadowQueryAll(component, 'button') as HTMLButtonElement[];
```

### 5. Document Generic Parameters

Use JSDoc to document what each generic parameter represents:

```typescript
/**
 * Maps an array of items to a new array of transformed items.
 *
 * @template TItem - The type of items in the source array
 * @template TResult - The type of items in the result array
 * @param items - The source array
 * @param mapper - Function that transforms each item
 * @returns A new array of transformed items
 */
function mapItems<TItem, TResult>(items: TItem[], mapper: (item: TItem) => TResult): TResult[] {
  return items.map(mapper);
}
```

### 6. Use Default Type Parameters

For generic classes or functions that have common use cases, provide default type parameters:

```typescript
/**
 * Generic event emitter with default event type.
 */
class EventEmitter<T = unknown> {
  private _listeners: Array<(event: T) => void> = [];

  on(listener: (event: T) => void): void {
    this._listeners.push(listener);
  }

  emit(event: T): void {
    this._listeners.forEach((listener) => listener(event));
  }
}

// Uses default type (unknown)
const emitter1 = new EventEmitter();

// Explicit type parameter
const emitter2 = new EventEmitter<{ message: string }>();
```

### 7. Combine Generics with Union Types

For components that accept multiple types, combine generics with union constraints:

```typescript
/**
 * Component that accepts either string or number values.
 */
type PrimitiveValue = string | number | boolean;

function formatValue<T extends PrimitiveValue>(value: T): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

formatValue('hello'); // ✅ Returns 'hello'
formatValue(42); // ✅ Returns '42'
formatValue(true); // ✅ Returns 'Yes'
// formatValue({}); // ❌ Error: object is not assignable to PrimitiveValue
```

### 8. Use Conditional Types for Advanced Patterns

Conditional types enable powerful generic patterns:

```typescript
/**
 * Extract the element type from an array type.
 */
type ArrayElement<T> = T extends (infer U)[] ? U : never;

type Numbers = ArrayElement<number[]>; // Type: number
type Strings = ArrayElement<string[]>; // Type: string

/**
 * Extract the detail type from a CustomEvent.
 */
type EventDetail<T> = T extends CustomEvent<infer D> ? D : never;

type ClickDetail = EventDetail<CustomEvent<{ x: number; y: number }>>;
// Type: { x: number; y: number }
```

### 9. Prefer Composition Over Inheritance

For generic patterns, prefer function composition and utility types over class inheritance:

```typescript
// ✅ Composition with generics
function compose<T, U, V>(f: (x: U) => V, g: (x: T) => U): (x: T) => V {
  return (x) => f(g(x));
}

const toString = (n: number): string => String(n);
const double = (n: number): number => n * 2;

const doubleAndStringify = compose(toString, double);
// Type: (x: number) => string
```

### 10. Use Readonly for Immutable Generics

When generic data should not be mutated, use `readonly` modifiers:

```typescript
/**
 * Generic function that processes read-only arrays.
 */
function processItems<T>(items: readonly T[]): T[] {
  return items.slice(); // Creates a new array
}

const numbers: readonly number[] = [1, 2, 3];
const processed = processItems(numbers);
// processed[0] = 10; // ✅ Allowed on mutable copy
// numbers[0] = 10; // ❌ Error: Index signature in type 'readonly number[]' only permits reading
```

## Common Pitfalls

### Pitfall 1: Losing Type Information with `any`

```typescript
// ❌ Generic becomes any, losing type safety
function processValue<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

// ✅ Preserve type information
function processValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
```

### Pitfall 2: Over-Constraining Generics

```typescript
// ❌ Too specific constraint limits reusability
function logName<T extends { firstName: string; lastName: string }>(obj: T): void {
  console.log(`${obj.firstName} ${obj.lastName}`);
}

// ✅ Minimal constraint for flexibility
function logName<T extends { name: string }>(obj: T): void {
  console.log(obj.name);
}
```

### Pitfall 3: Forgetting Return Type Constraints

```typescript
// ❌ Return type loses generic information
function wrapInArray<T>(value: T): unknown[] {
  return [value];
}

// ✅ Return type preserves generic information
function wrapInArray<T>(value: T): T[] {
  return [value];
}
```

### Pitfall 4: Misusing Type Assertions with Generics

```typescript
// ❌ Unsafe type assertion bypasses type checking
function unsafeCast<T>(value: unknown): T {
  return value as T; // Dangerous: no runtime validation
}

// ✅ Use type guards for safe narrowing
function safeCast<T>(value: unknown, guard: (v: unknown) => v is T): T | undefined {
  return guard(value) ? value : undefined;
}
```

### Pitfall 5: Incorrect Variance Usage

```typescript
// ❌ Violates covariance (cannot write to read-only position)
interface BadProducer<T> {
  produce(): T;
  consume(value: T): void; // Makes it invariant
}

// ✅ Separate read and write interfaces
interface Producer<out T> {
  produce(): T;
}

interface Consumer<in T> {
  consume(value: T): void;
}
```

## Summary

Generics are essential for building type-safe, reusable web components in TypeScript. They enable:

- **Flexible APIs** that work with multiple types
- **Type-safe event handling** with `CustomEvent<T>`
- **Reusable test utilities** that work with any component
- **Constrained flexibility** through the `extends` keyword
- **Type inference** that reduces boilerplate
- **Strict mode compliance** without sacrificing reusability
- **Advanced patterns** with conditional types, mapped types, and template literals
- **Variance control** for safe subtyping relationships

In the hx-library, generics appear throughout the codebase—from test utilities (`fixture<T>`, `shadowQuery<T>`, `oneEvent<T>`) to event handlers (`CustomEvent<TDetail>`) to utility functions. By mastering generic patterns, you can build components that are both flexible and type-safe, meeting enterprise healthcare standards without compromising developer experience.

Generics transform TypeScript from a type checker into a **design tool**, allowing you to express constraints and relationships between types that would be impossible with static types alone. They are the foundation of reusable, composable, type-safe web component libraries.

## Resources

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript: Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript: Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [Understanding Variance in TypeScript](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [TypeScript Generics Tutorial - TutorialsTeacher](https://www.tutorialsteacher.com/typescript/typescript-generic)
- [TypeScript Generic Constraints - GeeksforGeeks](https://www.geeksforgeeks.org/typescript-generic-constraints/)
- [Understanding infer in TypeScript - LogRocket](https://blog.logrocket.com/understanding-infer-typescript/)

---

**Next Steps:**

- Read [Advanced Types](/components/typescript/advanced-types) for utility types and type manipulation
- Explore [Event Types](/components/typescript/event-types) for deep dive into typed event handling
- Review [Strict Mode](/components/typescript/strict-mode) for TypeScript compiler configuration
