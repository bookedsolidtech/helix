---
title: Type-Safe Event Handling
description: Master type-safe event handling in HELIX components using TypeScript generics, CustomEvent typing, event maps, and listener type inference.
sidebar:
  order: 30
---

Custom events are the primary communication mechanism between HELIX components and their consumers. Type-safe event handling transforms events from runtime stringly-typed messages into compile-time validated contracts. This guide demonstrates how to leverage TypeScript's type system to make every event dispatch, listener, and detail payload fully typed and self-documenting.

## Why Type-Safe Events Matter

In enterprise healthcare applications, event handling errors can cascade into runtime failures that impact patient-facing software. Type-safe events provide:

- **Compile-time validation**: Catch event name typos and incorrect detail payloads before they reach the browser
- **IDE autocomplete**: IntelliSense for event names and detail properties
- **Refactoring safety**: Rename events or change detail structures across the codebase with confidence
- **Self-documenting APIs**: Event interfaces serve as living documentation
- **Consumer ergonomics**: Consumers get full type inference when listening to your events

Without type safety, this code compiles but fails at runtime:

```typescript
// Compiles but fails at runtime: wrong event name
button.addEventListener('click', (e) => {
  console.log(e.detail.value); // Runtime error: undefined
});

// Compiles but fails at runtime: wrong detail property
button.addEventListener('hx-click', (e) => {
  console.log(e.detail.value); // Runtime error: undefined (should be originalEvent)
});
```

With type safety, both errors are caught at compile time.

## The CustomEvent Generic

JavaScript's `CustomEvent` constructor is generic over the detail payload type. TypeScript's `lib.dom.d.ts` defines it as:

```typescript
interface CustomEvent<T = any> extends Event {
  readonly detail: T;
}

declare var CustomEvent: {
  prototype: CustomEvent;
  new <T>(typeArg: string, eventInitDict?: CustomEventInit<T>): CustomEvent<T>;
};
```

The generic parameter `T` types the `detail` property. By default, it is `any`, which bypasses type safety. To make events type-safe, you must explicitly provide the detail type.

## Defining Event Detail Interfaces

Every custom event should have a corresponding TypeScript interface that describes its detail payload. This interface serves as the single source of truth for what data the event carries.

### Basic Event Detail Types

```typescript
// Simple detail with one property
interface HxClickDetail {
  originalEvent: MouseEvent;
}

// Detail with multiple properties
interface HxChangeDetail {
  checked: boolean;
  value: string;
}

// Detail with optional properties
interface HxInputDetail {
  value: string;
  isValid?: boolean;
}

// Detail with no properties (marker event)
interface HxReadyDetail {}
// Or use `Record<string, never>` to enforce empty detail
```

**Naming convention**: Use `Hx<EventName>Detail` to avoid name collisions and make the purpose obvious.

### Real-World Example: hx-checkbox

From the `hx-checkbox` component source:

```typescript
// Component property types
@property({ type: Boolean, reflect: true })
checked = false;

@property({ type: String })
value = 'on';

// Event handler
private _handleChange(): void {
  if (this.disabled) return;

  this.checked = !this.checked;

  /**
   * Dispatched when the checkbox is toggled.
   * @event hx-change
   */
  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true,
      detail: { checked: this.checked, value: this.value },
    })
  );
}
```

The corresponding detail interface should match the dispatched detail object:

```typescript
interface HxChangeDetail {
  checked: boolean;
  value: string;
}
```

**Rule**: The detail interface must exactly match the object passed to `detail` in the event constructor.

## Dispatching Typed Events

Use `CustomEvent<T>` to type the event when dispatching. This ensures the detail object matches the interface at compile time.

### Basic Typed Dispatch

```typescript
interface HxClickDetail {
  originalEvent: MouseEvent;
}

private _handleClick(e: MouseEvent): void {
  if (this.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // Type-safe dispatch: TypeScript validates that detail matches HxClickDetail
  this.dispatchEvent(
    new CustomEvent<HxClickDetail>('hx-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e },
    })
  );
}
```

**Key points:**

- `bubbles: true` — Event propagates up the DOM tree (crosses component boundaries)
- `composed: true` — Event crosses shadow DOM boundaries (escapes shadow roots)
- `detail` — Typed payload matching `HxClickDetail`

### Type Errors at Compile Time

```typescript
interface HxChangeDetail {
  checked: boolean;
  value: string;
}

// Error: Type '{ cheked: boolean; value: string; }' is not assignable to type 'HxChangeDetail'
this.dispatchEvent(
  new CustomEvent<HxChangeDetail>('hx-change', {
    bubbles: true,
    composed: true,
    detail: { cheked: this.checked, value: this.value }, // Typo: 'cheked'
  }),
);

// Error: Property 'value' is missing in type '{ checked: boolean; }'
this.dispatchEvent(
  new CustomEvent<HxChangeDetail>('hx-change', {
    bubbles: true,
    composed: true,
    detail: { checked: this.checked }, // Missing 'value'
  }),
);
```

TypeScript catches these errors before they reach the browser.

### Optional Detail Properties

```typescript
interface HxInputDetail {
  value: string;
  isValid?: boolean; // Optional
}

// Valid: isValid is optional
this.dispatchEvent(
  new CustomEvent<HxInputDetail>('hx-input', {
    bubbles: true,
    composed: true,
    detail: { value: this.value },
  }),
);

// Also valid: isValid can be provided
this.dispatchEvent(
  new CustomEvent<HxInputDetail>('hx-input', {
    bubbles: true,
    composed: true,
    detail: { value: this.value, isValid: this.checkValidity() },
  }),
);
```

### Events with No Detail

Some events are markers that carry no data. Use an empty interface or `Record<string, never>`:

```typescript
interface HxReadyDetail {}

this.dispatchEvent(
  new CustomEvent<HxReadyDetail>('hx-ready', {
    bubbles: true,
    composed: true,
    detail: {},
  }),
);

// Or use Record<string, never> to enforce truly empty detail
type EmptyDetail = Record<string, never>;

this.dispatchEvent(
  new CustomEvent<EmptyDetail>('hx-ready', {
    bubbles: true,
    composed: true,
    detail: {},
  }),
);
```

**Best practice**: Use `detail: {}` for consistency, even if the event carries no data. This avoids confusion about whether `detail` is `undefined`.

## Type-Safe Event Listeners

Consumers of your components need type-safe event listeners. There are multiple approaches, each with trade-offs.

### Approach 1: Manual Type Annotation

The simplest approach is to manually annotate the event parameter:

```typescript
const button = document.querySelector('hx-button')!;

button.addEventListener('hx-click', (e: CustomEvent<HxClickDetail>) => {
  // TypeScript knows e.detail is HxClickDetail
  console.log(e.detail.originalEvent.clientX); // ✅ Type-safe
});
```

**Pros**: Simple, explicit, works everywhere.

**Cons**: Consumers must import the detail interface and manually annotate every listener.

### Approach 2: Event Maps with addEventListener Overload

Define an event map interface that maps event names to their `CustomEvent<T>` types, then overload `addEventListener` to provide type inference.

#### Step 1: Define the Event Map

```typescript
interface HxButtonEventMap {
  'hx-click': CustomEvent<HxClickDetail>;
}
```

#### Step 2: Overload addEventListener

```typescript
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

interface HxClickDetail {
  originalEvent: MouseEvent;
}

interface HxButtonEventMap {
  'hx-click': CustomEvent<HxClickDetail>;
}

@customElement('hx-button')
export class HelixButton extends LitElement {
  // ... component properties and logic ...

  // Overload addEventListener for type-safe event names and listeners
  addEventListener<K extends keyof HxButtonEventMap>(
    type: K,
    listener: (this: HelixButton, ev: HxButtonEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }

  // Also overload removeEventListener for symmetry
  removeEventListener<K extends keyof HxButtonEventMap>(
    type: K,
    listener: (this: HelixButton, ev: HxButtonEventMap[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener as EventListener, options);
  }
}
```

#### Step 3: Consumer Gets Type Inference

```typescript
const button = document.querySelector('hx-button')!;

// TypeScript infers event type from event name
button.addEventListener('hx-click', (e) => {
  // e is inferred as CustomEvent<HxClickDetail>
  console.log(e.detail.originalEvent.clientX); // ✅ Type-safe, no manual annotation
});

// Error: Argument of type '"hx-invalid"' is not assignable to parameter of type '"hx-click"'
button.addEventListener('hx-invalid', (e) => {
  // TypeScript error: 'hx-invalid' is not a valid event name
});
```

**Pros**: Full type inference, catches event name typos.

**Cons**: Requires consumers to have access to `.d.ts` files (works automatically with npm packages).

### Approach 3: Inline Event Listeners in Lit Templates

For internal event handling within Lit templates, use `@event` bindings with typed handler methods:

```typescript
@customElement('hx-form')
export class HelixForm extends LitElement {
  private _handleCheckboxChange(e: CustomEvent<HxChangeDetail>): void {
    console.log(e.detail.checked, e.detail.value); // ✅ Type-safe
  }

  override render() {
    return html`
      <hx-checkbox label="Accept terms" @hx-change=${this._handleCheckboxChange}></hx-checkbox>
    `;
  }
}
```

**Key**: The handler method is explicitly typed with `CustomEvent<T>`. Lit's `@event` binding passes the event to the handler, and TypeScript validates the parameter type.

### Approach 4: oneEvent Helper for Tests

For testing, use a typed `oneEvent` helper that returns a promise:

```typescript
// Test utility (from hx-library/src/test-utils.ts)
export function oneEvent<T extends Event = Event>(
  target: EventTarget,
  eventName: string,
): Promise<T> {
  return new Promise<T>((resolve) => {
    const handler = (e: Event) => {
      target.removeEventListener(eventName, handler);
      resolve(e as T);
    };
    target.addEventListener(eventName, handler);
  });
}

// Usage in tests
it('dispatches hx-change on toggle', async () => {
  const el = await fixture<HelixCheckbox>('<hx-checkbox></hx-checkbox>');
  const eventPromise = oneEvent<CustomEvent<HxChangeDetail>>(el, 'hx-change');

  const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
  control.click();

  const event = await eventPromise;
  expect(event.detail.checked).toBe(true); // ✅ Type-safe
  expect(event.detail.value).toBe('on'); // ✅ Type-safe
});
```

**Benefit**: Test code is fully typed, catches detail payload errors in tests.

## Event Map Patterns

Event maps centralize event type definitions and enable type-safe listener registration. Here are best practices for defining event maps.

### Single-Event Components

For components with one custom event:

```typescript
interface HxClickDetail {
  originalEvent: MouseEvent;
}

interface HxButtonEventMap {
  'hx-click': CustomEvent<HxClickDetail>;
}

@customElement('hx-button')
export class HelixButton extends LitElement {
  addEventListener<K extends keyof HxButtonEventMap>(
    type: K,
    listener: (this: HelixButton, ev: HxButtonEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }
}
```

### Multi-Event Components

For components with multiple custom events:

```typescript
interface HxInputDetail {
  value: string;
}

interface HxChangeDetail {
  value: string;
}

interface HxBlurDetail {
  value: string;
}

interface HxTextInputEventMap {
  'hx-input': CustomEvent<HxInputDetail>;
  'hx-change': CustomEvent<HxChangeDetail>;
  'hx-blur': CustomEvent<HxBlurDetail>;
}

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  addEventListener<K extends keyof HxTextInputEventMap>(
    type: K,
    listener: (this: HelixTextInput, ev: HxTextInputEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }
}
```

Consumers get autocomplete for all three event names:

```typescript
const input = document.querySelector('hx-text-input')!;

input.addEventListener('hx-input', (e) => {
  // e is CustomEvent<HxInputDetail>
});

input.addEventListener('hx-change', (e) => {
  // e is CustomEvent<HxChangeDetail>
});

input.addEventListener('hx-blur', (e) => {
  // e is CustomEvent<HxBlurDetail>
});
```

### Extending Native Event Maps

Components that emit both custom and native events (e.g., `click`, `focus`) can extend the event map to include both:

```typescript
interface HxButtonEventMap extends HTMLElementEventMap {
  'hx-click': CustomEvent<HxClickDetail>;
}

@customElement('hx-button')
export class HelixButton extends LitElement {
  addEventListener<K extends keyof HxButtonEventMap>(
    type: K,
    listener: (this: HelixButton, ev: HxButtonEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }
}
```

Now consumers can listen to both native and custom events with type inference:

```typescript
button.addEventListener('hx-click', (e) => {
  // CustomEvent<HxClickDetail>
});

button.addEventListener('focus', (e) => {
  // FocusEvent (from HTMLElementEventMap)
});
```

## EventTarget Typing

TypeScript's DOM types include `EventTarget`, which is the base interface for all event-dispatching objects. Understanding `EventTarget` typing helps when working with event delegation or dynamically dispatched events.

### The EventTarget Interface

```typescript
interface EventTarget {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;

  dispatchEvent(event: Event): boolean;
}
```

By default, `EventTarget` is untyped: `type` is `string`, `listener` receives `Event`, and `dispatchEvent` accepts any `Event`.

### Narrowing EventTarget with Type Guards

When handling events via delegation, use type guards to narrow `EventTarget`:

```typescript
private _handleSlotChange(e: Event): void {
  const target = e.target;

  // Type guard: narrow EventTarget to HTMLSlotElement
  if (target instanceof HTMLSlotElement) {
    const assigned = target.assignedNodes({ flatten: true });
    console.log(assigned.length); // ✅ Type-safe
  }
}
```

### Casting Event Targets

For internal event handlers where you control the markup, casting is safe:

```typescript
private _handleChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  this.value = target.value; // ✅ Safe: we know it's a select
  this._internals.setFormValue(this.value);
}
```

**Rule**: Use type guards (`instanceof`) for external/unknown targets. Use casts (`as`) for internal/known targets.

## Event Typing in Tests

Type-safe events make tests more maintainable. Every event listener and detail assertion is validated at compile time.

### Typed Event Assertions

From `hx-button.test.ts`:

```typescript
it('hx-click detail contains originalEvent', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent<HxClickDetail>>(el, 'hx-click');

  btn.click();

  const event = await eventPromise;

  // TypeScript validates that detail.originalEvent exists and is a MouseEvent
  expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
});
```

From `hx-checkbox.test.ts`:

```typescript
it('hx-change detail has checked and value', async () => {
  const el = await fixture<HelixCheckbox>('<hx-checkbox value="agree"></hx-checkbox>');
  const eventPromise = oneEvent<CustomEvent<HxChangeDetail>>(el, 'hx-change');

  const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
  control.click();

  const event = await eventPromise;

  // TypeScript validates that detail.checked and detail.value exist
  expect(event.detail.checked).toBe(true);
  expect(event.detail.value).toBe('agree');
});
```

**Benefit**: If you refactor the event detail structure (e.g., rename `checked` to `isChecked`), TypeScript will flag every test that references the old property.

### Testing Event Bubbling and Composition

```typescript
it('hx-click bubbles and is composed', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent<HxClickDetail>>(el, 'hx-click');

  btn.click();

  const event = await eventPromise;

  // Validate event options
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
});
```

**Rule**: Always test that `bubbles: true` and `composed: true` are set for custom events. Without `composed: true`, events do not escape shadow DOM and cannot be caught by parent components.

## JSDoc Annotations for CEM

Custom Elements Manifest (CEM) generates API documentation from JSDoc comments. Use `@event` and `@fires` annotations to document events in a CEM-compatible format.

### @event Annotation

```typescript
/**
 * Dispatched when the button is clicked.
 * @event hx-click
 */
this.dispatchEvent(
  new CustomEvent<HxClickDetail>('hx-click', {
    bubbles: true,
    composed: true,
    detail: { originalEvent: e },
  }),
);
```

### @fires Annotation (Component-Level)

At the component class level, use `@fires` to declare all events the component emits:

```typescript
/**
 * A text input component with label, validation, and form association.
 *
 * @summary Form-associated text input with built-in label, error, and help text.
 *
 * @tag hx-text-input
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the input loses focus after its value changed.
 *
 * @csspart input - The native input element.
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // ...
}
```

**CEM output** (from `custom-elements.json`):

```json
{
  "kind": "class",
  "tagName": "hx-text-input",
  "events": [
    {
      "name": "hx-input",
      "type": {
        "text": "CustomEvent<{value: string}>"
      },
      "description": "Dispatched on every keystroke as the user types."
    },
    {
      "name": "hx-change",
      "type": {
        "text": "CustomEvent<{value: string}>"
      },
      "description": "Dispatched when the input loses focus after its value changed."
    }
  ]
}
```

Storybook's autodocs use this CEM metadata to generate event documentation automatically.

## Advanced Event Patterns

### Conditional Events

Dispatch different events based on component state:

```typescript
private _handleClick(e: MouseEvent): void {
  if (this.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (this.href) {
    // Dispatch navigation event
    this.dispatchEvent(
      new CustomEvent<HxNavigateDetail>('hx-navigate', {
        bubbles: true,
        composed: true,
        detail: { href: this.href, originalEvent: e },
      })
    );
  } else {
    // Dispatch click event
    this.dispatchEvent(
      new CustomEvent<HxClickDetail>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }
}
```

### Event Cancellation

Allow consumers to cancel events using `event.preventDefault()`:

```typescript
private _handleBeforeChange(newValue: string): boolean {
  const event = new CustomEvent<HxBeforeChangeDetail>('hx-before-change', {
    bubbles: true,
    composed: true,
    cancelable: true, // ✅ Allow preventDefault()
    detail: { oldValue: this.value, newValue },
  });

  this.dispatchEvent(event);

  // If consumer called preventDefault(), cancel the change
  if (event.defaultPrevented) {
    return false;
  }

  this.value = newValue;
  return true;
}
```

Consumers can prevent the change:

```typescript
input.addEventListener('hx-before-change', (e) => {
  if (e.detail.newValue === 'invalid') {
    e.preventDefault(); // Cancel the change
  }
});
```

### Event Composition (Retargeting)

When events cross shadow DOM boundaries with `composed: true`, the `event.target` is retargeted to the host element. Use `event.composedPath()` to get the original target:

```typescript
form.addEventListener('hx-change', (e) => {
  console.log(e.target); // hx-checkbox (retargeted to host)
  console.log(e.composedPath()[0]); // .checkbox__control (original target)
});
```

### Generic Event Utilities

Create reusable utilities for common event patterns:

```typescript
// Type-safe event dispatcher
export function dispatchCustomEvent<T>(
  target: EventTarget,
  eventName: string,
  detail: T,
  options: { bubbles?: boolean; composed?: boolean; cancelable?: boolean } = {},
): boolean {
  const event = new CustomEvent<T>(eventName, {
    bubbles: options.bubbles ?? true,
    composed: options.composed ?? true,
    cancelable: options.cancelable ?? false,
    detail,
  });
  return target.dispatchEvent(event);
}

// Usage
dispatchCustomEvent<HxClickDetail>(this, 'hx-click', {
  originalEvent: e,
});
```

## Common Type Errors and Fixes

### Error: Property does not exist on type 'Event'

```typescript
// Bad: Event is not CustomEvent
button.addEventListener('hx-click', (e: Event) => {
  console.log(e.detail.originalEvent); // Error: Property 'detail' does not exist on type 'Event'
});

// Good: Type as CustomEvent<T>
button.addEventListener('hx-click', (e: CustomEvent<HxClickDetail>) => {
  console.log(e.detail.originalEvent); // ✅ Type-safe
});
```

### Error: Type '{}' is missing the following properties

```typescript
interface HxChangeDetail {
  checked: boolean;
  value: string;
}

// Bad: Missing 'value' property
this.dispatchEvent(
  new CustomEvent<HxChangeDetail>('hx-change', {
    bubbles: true,
    composed: true,
    detail: { checked: this.checked }, // Error: Property 'value' is missing
  }),
);

// Good: All properties provided
this.dispatchEvent(
  new CustomEvent<HxChangeDetail>('hx-change', {
    bubbles: true,
    composed: true,
    detail: { checked: this.checked, value: this.value },
  }),
);
```

### Error: Argument of type 'string' is not assignable to parameter of type 'keyof EventMap'

```typescript
// Bad: Event name not in event map
button.addEventListener('hx-invalid', (e) => {
  // Error: 'hx-invalid' is not in HxButtonEventMap
});

// Good: Use valid event name
button.addEventListener('hx-click', (e) => {
  // ✅ Valid event name
});
```

### Error: Type 'EventTarget | null' is not assignable to type 'HTMLSelectElement'

```typescript
// Bad: No null check or type assertion
private _handleChange(e: Event): void {
  const target = e.target; // EventTarget | null
  this.value = target.value; // Error: Property 'value' does not exist on type 'EventTarget'
}

// Good: Type assertion (safe for internal handlers)
private _handleChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  this.value = target.value; // ✅ Type-safe
}

// Also good: Type guard (safer for external handlers)
private _handleChange(e: Event): void {
  if (e.target instanceof HTMLSelectElement) {
    this.value = e.target.value; // ✅ Type-safe
  }
}
```

## Real-World Example: hx-text-input

Here's a complete component demonstrating all event typing patterns:

```typescript
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

// Detail interfaces
interface HxInputDetail {
  value: string;
}

interface HxChangeDetail {
  value: string;
}

// Event map
interface HxTextInputEventMap {
  'hx-input': CustomEvent<HxInputDetail>;
  'hx-change': CustomEvent<HxChangeDetail>;
}

@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String })
  value = '';

  @query('.field__input')
  private _input!: HTMLInputElement;

  // Type-safe addEventListener overload
  addEventListener<K extends keyof HxTextInputEventMap>(
    type: K,
    listener: (this: HelixTextInput, ev: HxTextInputEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }

  // Type-safe removeEventListener overload
  removeEventListener<K extends keyof HxTextInputEventMap>(
    type: K,
    listener: (this: HelixTextInput, ev: HxTextInputEventMap[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener as EventListener, options);
  }

  // Event handlers
  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);

    /**
     * Dispatched on every keystroke as the user types.
     * @event hx-input
     */
    this.dispatchEvent(
      new CustomEvent<HxInputDetail>('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _handleChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);

    /**
     * Dispatched when the input loses focus after its value changed.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent<HxChangeDetail>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  override render() {
    return html`
      <input
        class="field__input"
        type="text"
        .value=${this.value}
        @input=${this._handleInput}
        @change=${this._handleChange}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-text-input': HelixTextInput;
  }
}
```

**Consumer usage**:

```typescript
const input = document.querySelector('hx-text-input')!;

// Type inference: e is CustomEvent<HxInputDetail>
input.addEventListener('hx-input', (e) => {
  console.log(e.detail.value); // ✅ Type-safe
});

// Type inference: e is CustomEvent<HxChangeDetail>
input.addEventListener('hx-change', (e) => {
  console.log(e.detail.value); // ✅ Type-safe
});

// Error: 'hx-invalid' is not a valid event name
input.addEventListener('hx-invalid', (e) => {
  // TypeScript error
});
```

## Best Practices

1. **Always type CustomEvent**: Use `CustomEvent<T>` when dispatching, never `CustomEvent` (which defaults to `any`).
2. **Define detail interfaces**: Every custom event needs a corresponding `Detail` interface.
3. **Use event maps for multi-event components**: Centralize event types in a single `EventMap` interface.
4. **Overload addEventListener**: Provide type inference for consumers by overloading `addEventListener` and `removeEventListener`.
5. **Document events with JSDoc**: Use `@fires` and `@event` annotations for CEM integration.
6. **Test event details**: Validate that detail payloads match their types in tests.
7. **Set bubbles and composed**: Always set `bubbles: true` and `composed: true` for custom events (unless you specifically need non-bubbling/non-composed behavior).
8. **Use type guards for external targets**: Use `instanceof` checks for event targets from unknown sources.
9. **Use type assertions for internal targets**: Safe to cast `e.target as T` when you control the markup.
10. **Avoid `any` in event maps**: Never use `any` for event detail types. Use `Record<string, never>` for empty details.

## Resources

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript DOM Types](https://github.com/microsoft/TypeScript/blob/main/lib/lib.dom.d.ts)
- [Lit Events Documentation](https://lit.dev/docs/components/events/)
- [MDN: CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)

---

**Related Pages:**

- [Typing Lit Components](/components/typescript/typing-components) — Property types, lifecycle methods, and template typing
- [Custom Events](/components/events/custom-events) — Event fundamentals and dispatch patterns (prerequisite)
- [TypeScript Strict Mode](/components/typescript/strict-mode) — Enforcing strict type safety across the codebase
- [Generics in TypeScript](/components/typescript/generics) — Advanced generic patterns for reusable type-safe utilities
