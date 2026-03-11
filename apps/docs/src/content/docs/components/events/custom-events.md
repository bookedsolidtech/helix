---
title: Custom Events Best Practices
description: Comprehensive guide to dispatching, documenting, and testing custom events in web components with TypeScript type safety, Shadow DOM integration, and real-world patterns from hx-library.
sidebar:
  order: 1
prev:
  link: /components/fundamentals/overview/
  label: Component Fundamentals Overview
---

Custom events are the primary mechanism for web components to communicate with the outside world. They enable loose coupling, framework agnosticism, and standard DOM event patterns. This guide covers everything you need to master custom events in enterprise web components: from the CustomEvent constructor to TypeScript type safety, Shadow DOM integration, documentation patterns, and real-world examples from hx-library.

## Why Custom Events?

Web components exist in a shadow DOM, which isolates their internals from the rest of the page. Custom events are the standard, framework-agnostic way to communicate state changes from inside the component to the outside world.

### Benefits of Custom Events

1. **Framework agnostic** — Works with React, Vue, Svelte, vanilla JavaScript, or any framework
2. **Standard DOM API** — Uses the same event model as native elements (`click`, `change`, etc.)
3. **Decoupled** — Component doesn't know or care who is listening
4. **Composable** — Events bubble through shadow boundaries with `composed: true`
5. **Type-safe** — TypeScript can infer `detail` payload types
6. **Testable** — Easy to assert event dispatch in tests
7. **Debuggable** — Events appear in browser DevTools and can be logged

### When to Dispatch Custom Events

Dispatch a custom event when:

- A form control's value changes (`hx-input`, `hx-change`)
- A user interaction completes (`hx-click`, `hx-submit`)
- An animation or transition finishes (`hx-after-show`, `hx-after-hide`)
- An error occurs that consumers should handle (`hx-error`, `hx-invalid`)
- A significant state change happens (`hx-open`, `hx-close`)

**Don't dispatch events for:**

- Internal state changes that aren't part of the public API
- Property changes that can be observed via property watchers
- Changes that should be handled via callbacks (use methods for imperative APIs)

## The CustomEvent Constructor

The `CustomEvent` constructor creates events with a strongly-typed `detail` payload.

### Basic Syntax

```typescript
new CustomEvent(type, options);
```

| Parameter | Type              | Description                                  |
| --------- | ----------------- | -------------------------------------------- |
| `type`    | `string`          | Event name (use `hx-` prefix for hx-library) |
| `options` | `CustomEventInit` | Event configuration object                   |

### CustomEventInit Options

```typescript
interface CustomEventInit<T = any> {
  bubbles?: boolean; // Does event propagate up the DOM? (default: false)
  composed?: boolean; // Does event cross shadow boundaries? (default: false)
  cancelable?: boolean; // Can event.preventDefault() be called? (default: false)
  detail?: T; // Payload data (default: null)
}
```

### Minimal Example

```typescript
// Simple event with no payload
this.dispatchEvent(new CustomEvent('hx-ready'));
```

### Full Example with All Options

```typescript
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true, // ✓ Propagates up the DOM tree
    composed: true, // ✓ Crosses shadow boundaries
    cancelable: false, // Cannot be cancelled (default for state changes)
    detail: {
      // Payload with strongly-typed data
      value: this.value,
      checked: this.checked,
    },
  }),
);
```

## The `bubbles` and `composed` Flags

These two flags control how events propagate through the DOM and across shadow boundaries. Understanding them is critical for web component events.

### `bubbles: true` — Event Propagation

When `bubbles: true`, the event propagates **up** the DOM tree during the bubble phase.

```
DOM Tree:
  window
    ↑
  document
    ↑
  <body>
    ↑
  <hx-form>
    ↑
  <hx-text-input>  ← event dispatched here
```

With `bubbles: true`, listeners on any ancestor can receive the event.

```typescript
// Component dispatches bubbling event
class HelixTextInput extends LitElement {
  private _handleInput(): void {
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true, // ← Event bubbles up
        detail: { value: this.value },
      }),
    );
  }
}

// Parent can listen via event delegation
document.addEventListener('hx-input', (event) => {
  console.log('Any hx-input fired:', event.detail.value);
});
```

**Rule of thumb**: Almost always set `bubbles: true` for custom events. The only exception is events that should only be received by listeners directly on the element.

### `composed: true` — Shadow DOM Crossing

When `composed: true`, the event can cross shadow boundaries and propagate through the light DOM.

```
Light DOM:
  <hx-form>
    <hx-text-input>  ← shadow host

Shadow DOM (inside hx-text-input):
  <input>  ← event originates here
```

Without `composed: true`, the event is **trapped inside the shadow tree**:

```typescript
// ✗ WRONG: Event trapped inside shadow tree
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: false, // ← Default! Event cannot escape shadow DOM
    detail: { value: this.value },
  }),
);

// Listener in light DOM will NEVER receive this event
document.addEventListener('hx-change', (event) => {
  console.log('This will never log');
});
```

With `composed: true`, the event crosses shadow boundaries:

```typescript
// ✓ CORRECT: Event crosses shadow boundaries
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true, // ← Event escapes shadow DOM
    detail: { value: this.value },
  }),
);

// Now this works!
document.addEventListener('hx-change', (event) => {
  console.log('Component changed:', event.detail.value);
});
```

### Why Both Matter

You almost always want **both** `bubbles: true` and `composed: true` for web component events:

| Configuration                     | Result                                            | Use Case                                                     |
| --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `bubbles: true, composed: true`   | Event propagates up AND crosses shadow boundaries | **Default for all public events**                            |
| `bubbles: true, composed: false`  | Event propagates within same shadow tree only     | Internal coordination between components in same shadow root |
| `bubbles: false, composed: true`  | Event crosses boundaries but doesn't bubble       | Rare; component-to-host communication                        |
| `bubbles: false, composed: false` | Event only fires on exact target                  | Very rare; mostly internal events                            |

**hx-library standard**:

```typescript
// Every public event in hx-library follows this pattern
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: {
      /* payload */
    },
  }),
);
```

## Event Naming Conventions

Event names must be unique, descriptive, and follow component library conventions to avoid collisions with native events and other libraries.

### The `hx-` Prefix Rule

**All custom events in hx-library use the `hx-` prefix.**

```typescript
// ✓ CORRECT: hx- prefix
new CustomEvent('hx-change', {
  /* ... */
});
new CustomEvent('hx-input', {
  /* ... */
});
new CustomEvent('hx-click', {
  /* ... */
});
new CustomEvent('hx-close', {
  /* ... */
});

// ✗ WRONG: No prefix (collides with native events)
new CustomEvent('change', {
  /* ... */
}); // Conflicts with native change
new CustomEvent('input', {
  /* ... */
}); // Conflicts with native input
new CustomEvent('click', {
  /* ... */
}); // Conflicts with native click
```

### Why Prefixing Matters

1. **Avoids native event collisions** — `hx-change` won't collide with native `change`
2. **Library identification** — Developers instantly know this is an hx-library event
3. **Event delegation** — Listen for all `hx-*` events at document level
4. **TypeScript autocomplete** — IDEs can suggest all `hx-*` events

### Naming Patterns

Event names follow these patterns:

| Pattern              | Example                              | Description                          |
| -------------------- | ------------------------------------ | ------------------------------------ |
| `hx-<action>`        | `hx-click`, `hx-submit`, `hx-close`  | User-initiated action                |
| `hx-<state>`         | `hx-change`, `hx-input`, `hx-select` | State change                         |
| `hx-before-<action>` | `hx-before-show`, `hx-before-close`  | Before an action occurs (cancelable) |
| `hx-after-<action>`  | `hx-after-show`, `hx-after-close`    | After an action completes            |
| `hx-<error>`         | `hx-error`, `hx-invalid`             | Error or validation failure          |

### Real-World Examples from hx-library

```typescript
// hx-text-input: Two events for different use cases
'hx-input'; // Fires on every keystroke
'hx-change'; // Fires on blur after value changed

// hx-checkbox: State change
'hx-change'; // Fires when checked state toggles

// hx-button: User interaction
'hx-click'; // Fires on click (not disabled)

// hx-alert: Lifecycle events
'hx-close'; // Fires when user dismisses
'hx-after-close'; // Fires after close animation completes

// hx-form: Validation and submission
'hx-submit'; // Fires on valid form submission
'hx-invalid'; // Fires when validation fails
'hx-reset'; // Fires when form is reset
```

### Verb Tense Guidelines

- **Present tense** for state changes: `hx-change`, `hx-input`, `hx-open`
- **Past tense** for completed actions: `hx-after-close`, `hx-loaded`
- **Infinitive** for actions: `hx-click`, `hx-submit`, `hx-close`

## Detail Payload Design

The `detail` property carries the event payload. Design it carefully to provide all context consumers need without forcing them to query the component.

### What to Include in `detail`

Include data that answers these questions:

1. **What changed?** — The new value, state, or status
2. **What was it before?** — Previous value (if relevant for validation/undo)
3. **Why did it change?** — User action, programmatic change, external trigger
4. **What else is relevant?** — Associated metadata, validation state, etc.

### Basic Pattern: Value-Only

For simple value changes:

```typescript
// hx-text-input: Just the new value
this.dispatchEvent(
  new CustomEvent('hx-input', {
    bubbles: true,
    composed: true,
    detail: { value: this.value },
  }),
);

// Consumer usage
input.addEventListener('hx-input', (event) => {
  console.log(event.detail.value); // "user@example.com"
});
```

### Intermediate Pattern: Multiple Properties

For components with multiple related states:

```typescript
// hx-checkbox: Both checked state and value
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    composed: true,
    detail: {
      checked: this.checked, // boolean
      value: this.value, // string
    },
  }),
);

// Consumer usage
checkbox.addEventListener('hx-change', (event) => {
  const { checked, value } = event.detail;
  console.log(`Checkbox ${checked ? 'checked' : 'unchecked'}, value: ${value}`);
});
```

### Advanced Pattern: Context and Metadata

For complex interactions:

```typescript
// hx-button: Include original native event for advanced use cases
this.dispatchEvent(
  new CustomEvent('hx-click', {
    bubbles: true,
    composed: true,
    detail: {
      originalEvent: event, // Native MouseEvent
    },
  }),
);

// Consumer can access native event properties
button.addEventListener('hx-click', (event) => {
  const { originalEvent } = event.detail;
  if (originalEvent.shiftKey) {
    console.log('Shift+click detected');
  }
});
```

### Don't Include Redundant Data

**Avoid** including data that's already accessible on the component:

```typescript
// ✗ WRONG: Redundant data (already available as properties)
this.dispatchEvent(
  new CustomEvent('hx-change', {
    detail: {
      value: this.value,
      label: this.label, // ← Redundant (public property)
      disabled: this.disabled, // ← Redundant (public property)
      required: this.required, // ← Redundant (public property)
    },
  }),
);

// ✓ CORRECT: Only include what changed
this.dispatchEvent(
  new CustomEvent('hx-change', {
    detail: {
      value: this.value, // Only the changed value
    },
  }),
);

// Consumers can access other properties directly
input.addEventListener('hx-change', (event) => {
  const value = event.detail.value;
  const label = event.target.label; // Access via component reference
  const required = event.target.required;
});
```

### Real-World Examples from hx-library

```typescript
// hx-text-input (simple value change)
detail: { value: string }

// hx-checkbox (state + value)
detail: { checked: boolean, value: string }

// hx-button (access to native event)
detail: { originalEvent: MouseEvent }

// hx-alert (reason for close)
detail: { reason: 'user' | 'timeout' | 'programmatic' }

// hx-form (validation errors)
detail: {
  errors: Array<{ name: string, message: string }>
}

// hx-form (submit with values)
detail: {
  valid: boolean,
  values: Record<string, FormDataEntryValue>
}
```

## Type-Safe Events with TypeScript

TypeScript can enforce type safety for event detail payloads, making events as type-safe as function calls.

### Basic Type Declaration

Define event detail types alongside your component:

```typescript
// Event detail type
interface HxChangeEventDetail {
  checked: boolean;
  value: string;
}

// Component class
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  private _handleChange(): void {
    this.dispatchEvent(
      new CustomEvent<HxChangeEventDetail>('hx-change', {
        bubbles: true,
        composed: true,
        detail: {
          checked: this.checked,
          value: this.value,
        },
      }),
    );
  }
}
```

### Consuming Type-Safe Events

Consumers can import the detail type for type safety:

```typescript
import type { HxChangeEventDetail } from '@helixui/library';

const checkbox = document.querySelector('hx-checkbox');

checkbox?.addEventListener('hx-change', (event: Event) => {
  // Type assertion for full type safety
  const detail = (event as CustomEvent<HxChangeEventDetail>).detail;
  console.log(detail.checked); // ✓ TypeScript knows this is boolean
  console.log(detail.value); // ✓ TypeScript knows this is string
});
```

### Event Map Pattern

For libraries with many events, define a global event map:

```typescript
// types/events.ts
export interface HelixEventMap {
  'hx-change': CustomEvent<{ checked: boolean; value: string }>;
  'hx-input': CustomEvent<{ value: string }>;
  'hx-click': CustomEvent<{ originalEvent: MouseEvent }>;
  'hx-close': CustomEvent<{ reason: string }>;
  'hx-submit': CustomEvent<{ valid: boolean; values: Record<string, FormDataEntryValue> }>;
}

// Extend HTMLElementEventMap for autocomplete
declare global {
  interface HTMLElementEventMap extends HelixEventMap {}
}
```

With this pattern, event names and detail types autocomplete in IDEs:

```typescript
// TypeScript autocompletes 'hx-change', 'hx-input', etc.
element.addEventListener('hx-change', (event) => {
  // event.detail is automatically typed as { checked: boolean; value: string }
  console.log(event.detail.checked);
});
```

### Generic Event Handler Type

Create a reusable handler type:

```typescript
type HelixEventHandler<T = any> = (event: CustomEvent<T>) => void;

// Usage
const handleChange: HelixEventHandler<{ value: string }> = (event) => {
  console.log(event.detail.value); // ✓ Typed as string
};

input.addEventListener('hx-input', handleChange);
```

### Real-World Pattern from hx-library

```typescript
// hx-radio-group internal event handler
private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
  e.stopPropagation();

  const newValue = e.detail.value;  // ✓ TypeScript infers string
  if (newValue === this.value) return;

  this.value = newValue;
  this._internals.setFormValue(this.value);
  this._syncRadios();
  this._updateValidity();

  // Dispatch public event
  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
};
```

## Event Documentation with JSDoc `@fires`

Documenting events in JSDoc ensures they appear in Custom Elements Manifest (CEM), Storybook autodocs, and IDE autocomplete.

### Basic `@fires` Syntax

```typescript
/**
 * @fires {CustomEvent<DetailType>} event-name - Description of when event fires.
 */
```

### Single Event Example

```typescript
/**
 * A checkbox component with label, validation, and form association.
 *
 * @tag hx-checkbox
 *
 * @fires {CustomEvent<{checked: boolean, value: string}>} hx-change - Dispatched when the checkbox is toggled.
 */
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  // ...
}
```

### Multiple Events Example

```typescript
/**
 * A text input component with label, validation, and form association.
 *
 * @tag hx-text-input
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the input loses focus after its value changed.
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  // ...
}
```

### Complex Event with Nested Types

```typescript
/**
 * A form component that wraps native form elements.
 *
 * @tag hx-form
 *
 * @fires {CustomEvent<{valid: boolean, values: Record<string, FormDataEntryValue>}>} hx-submit - Dispatched on valid client-side submit when no action is set.
 * @fires {CustomEvent<{errors: Array<{name: string, message: string}>}>} hx-invalid - Dispatched when validation fails on submit.
 * @fires {CustomEvent} hx-reset - Dispatched when the form is reset.
 */
@customElement('hx-form')
export class HelixForm extends LitElement {
  // ...
}
```

### Inline Documentation at Dispatch Site

Add a comment before `dispatchEvent()` for in-code documentation:

```typescript
private _handleChange(): void {
  if (this.disabled) return;

  this.checked = !this.checked;
  this._internals.setFormValue(this.checked ? this.value : null);
  this._updateValidity();

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

### CEM Output

JSDoc `@fires` tags appear in `custom-elements.json`:

```json
{
  "events": [
    {
      "name": "hx-change",
      "type": {
        "text": "CustomEvent<{checked: boolean, value: string}>"
      },
      "description": "Dispatched when the checkbox is toggled."
    }
  ]
}
```

Storybook autodocs and documentation sites consume this CEM data to generate event tables automatically.

## Event Dispatching Patterns

Common patterns for when and how to dispatch events in Lit components.

### Pattern 1: Dispatch After State Change

The most common pattern: update state, then dispatch event.

```typescript
private _handleChange(): void {
  // 1. Update internal state
  this.checked = !this.checked;

  // 2. Sync with form internals
  this._internals.setFormValue(this.checked ? this.value : null);

  // 3. Update validation state
  this._updateValidity();

  // 4. Notify consumers via event
  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true,
      detail: { checked: this.checked, value: this.value },
    })
  );
}
```

**Order matters**: Dispatch the event **after** state is updated so that listeners see the new state when they query the component.

### Pattern 2: Dispatch on User Interaction

Dispatch events in response to user actions on internal elements:

```typescript
private _handleClick(e: MouseEvent): void {
  if (this.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // Dispatch custom event with access to native event
  this.dispatchEvent(
    new CustomEvent('hx-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e },
    })
  );
}

// In render
render() {
  return html`
    <button @click=${this._handleClick}>
      <slot></slot>
    </button>
  `;
}
```

### Pattern 3: Internal Coordination Events

Use internal events for parent-child coordination, and **stop propagation** to prevent leaking:

```typescript
// Child component: hx-radio
private _handleChange(): void {
  // Dispatch internal event for parent coordination
  this.dispatchEvent(
    new CustomEvent('hx-radio-select', {  // ← Internal event
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
}

// Parent component: hx-radio-group
override connectedCallback(): void {
  super.connectedCallback();
  // Listen for internal events from children
  this.addEventListener('hx-radio-select', this._handleRadioSelect as EventListener);
}

private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
  e.stopPropagation();  // ← Don't let internal event leak to consumers

  this.value = e.detail.value;
  this._internals.setFormValue(this.value);

  // Dispatch public event for external consumers
  this.dispatchEvent(
    new CustomEvent('hx-change', {  // ← Public event
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
};
```

**Pattern**: Internal events for coordination, public events for the API.

### Pattern 4: Debounced Events

For high-frequency events (like `input`), consider debouncing:

```typescript
private _debounceTimer: number | null = null;

private _handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;

  // Dispatch immediate hx-input event
  this.dispatchEvent(
    new CustomEvent('hx-input', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );

  // Debounce expensive operation
  if (this._debounceTimer !== null) {
    clearTimeout(this._debounceTimer);
  }

  this._debounceTimer = window.setTimeout(() => {
    this._performExpensiveValidation();
  }, 300);
}
```

### Pattern 5: Before/After Event Pairs

For cancelable actions and lifecycle events:

```typescript
async show(): Promise<void> {
  // Dispatch "before" event (cancelable)
  const beforeEvent = new CustomEvent('hx-before-show', {
    bubbles: true,
    composed: true,
    cancelable: true,  // ← Consumers can cancel
  });

  const allowed = this.dispatchEvent(beforeEvent);
  if (!allowed) {
    // Consumer called preventDefault()
    return;
  }

  // Perform the action
  this.open = true;
  await this.updateComplete;  // Wait for render

  // Dispatch "after" event (not cancelable)
  this.dispatchEvent(
    new CustomEvent('hx-after-show', {
      bubbles: true,
      composed: true,
      cancelable: false,
    })
  );
}
```

**Usage**:

```typescript
dialog.addEventListener('hx-before-show', (event) => {
  if (userNotLoggedIn) {
    event.preventDefault(); // Cancel the show
  }
});

dialog.addEventListener('hx-after-show', () => {
  console.log('Dialog is now visible');
});
```

## Preventing Default and Stopping Propagation

Understanding when and how to prevent default behavior and stop event propagation.

### `event.preventDefault()`

Prevents the default action associated with an event. Only works if the event is `cancelable: true`.

```typescript
// Dispatch cancelable event
const event = new CustomEvent('hx-before-close', {
  bubbles: true,
  composed: true,
  cancelable: true, // ← Required for preventDefault to work
});

const allowed = this.dispatchEvent(event);
if (!allowed) {
  // Consumer called preventDefault()
  console.log('Close was cancelled');
  return;
}

// Proceed with close
this.open = false;
```

**Consumer**:

```typescript
dialog.addEventListener('hx-before-close', (event) => {
  if (formIsDirty) {
    event.preventDefault(); // Cancel the close
    showConfirmationDialog();
  }
});
```

### When to Make Events Cancelable

**Cancelable events** (before actions):

- `hx-before-show`, `hx-before-close`, `hx-before-submit`
- User can prevent the action from happening

**Non-cancelable events** (state changes, after actions):

- `hx-change`, `hx-input`, `hx-after-close`
- Action already happened, cannot be undone

### `event.stopPropagation()`

Stops the event from bubbling further up the DOM tree.

```typescript
// Parent listens for all hx-change events
document.addEventListener('hx-change', (event) => {
  console.log('A component changed');
});

// Stop specific event from bubbling
someComponent.addEventListener('hx-change', (event) => {
  event.stopPropagation(); // Parent listener won't receive this
});
```

**When to stop propagation**:

1. **Internal coordination events** — Stop internal events from leaking:

   ```typescript
   private _handleRadioSelect = (e: CustomEvent): void => {
     e.stopPropagation();  // ← Internal event, don't leak
     // Handle and dispatch public event
   };
   ```

2. **Preventing delegation** — Stop events from reaching delegated listeners:
   ```typescript
   button.addEventListener('hx-click', (event) => {
     if (shouldHandleLocally) {
       event.stopPropagation();
     }
   });
   ```

**When NOT to stop propagation**:

1. **Public events** — Let consumers decide if they want to stop propagation
2. **Form events** — Let form controls bubble to parent forms
3. **Default behavior** — Don't stop events unless you have a specific reason

### `event.stopImmediatePropagation()`

Stops propagation AND prevents other listeners on the same element from firing:

```typescript
element.addEventListener('hx-click', (event) => {
  event.stopImmediatePropagation(); // ← Other listeners won't fire
  console.log('First listener');
});

element.addEventListener('hx-click', (event) => {
  console.log('Second listener - NEVER RUNS');
});
```

**Use rarely** — usually indicates a design issue. Prefer stopping propagation or not attaching multiple conflicting listeners.

## Testing Custom Events

Testing that events are dispatched with correct detail payloads is essential for component reliability.

### Basic Event Assertion

```typescript
import { fixture, oneEvent } from '@helixui/test-utils';

it('dispatches hx-change when checkbox is toggled', async () => {
  const el = await fixture<HelixCheckbox>(html`<hx-checkbox></hx-checkbox>`);

  // Set up event listener
  const eventPromise = oneEvent(el, 'hx-change');

  // Trigger change
  el.click();

  // Wait for event
  const event = await eventPromise;

  // Assert event details
  expect(event).toBeInstanceOf(CustomEvent);
  expect(event.detail.checked).toBe(true);
});
```

### Testing Event Properties

```typescript
it('dispatches event with correct configuration', async () => {
  const el = await fixture<HelixTextInput>(html`<hx-text-input></hx-text-input>`);

  const eventPromise = oneEvent(el, 'hx-input');

  const input = el.shadowRoot!.querySelector('input')!;
  input.value = 'test';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  const event = await eventPromise;

  // Assert event configuration
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
  expect(event.cancelable).toBe(false);
  expect(event.detail.value).toBe('test');
});
```

### Testing Detail Payload

```typescript
it('includes all required data in detail', async () => {
  const el = await fixture<HelixCheckbox>(html` <hx-checkbox value="newsletter"></hx-checkbox> `);

  const eventPromise = oneEvent(el, 'hx-change');
  el.click();
  const event = await eventPromise;

  // Assert complete detail payload
  expect(event.detail).toEqual({
    checked: true,
    value: 'newsletter',
  });
});
```

### Testing Event Propagation

```typescript
it('event crosses shadow boundary', async () => {
  const container = await fixture(html`
    <div>
      <hx-checkbox></hx-checkbox>
    </div>
  `);

  const checkbox = container.querySelector('hx-checkbox')!;

  // Listen on parent (outside shadow DOM)
  const eventPromise = oneEvent(container, 'hx-change');

  checkbox.click();

  const event = await eventPromise;
  expect(event.target).toBe(checkbox); // Retargeted to shadow host
});
```

### Testing Cancelable Events

```typescript
it('respects preventDefault() on cancelable events', async () => {
  const el = await fixture<HelixDialog>(html`<hx-dialog></hx-dialog>`);

  // Add listener that prevents default
  el.addEventListener('hx-before-close', (event) => {
    event.preventDefault();
  });

  // Try to close
  await el.close();

  // Should still be open
  expect(el.open).toBe(true);
});
```

### Testing Internal Event Coordination

```typescript
it('stops internal events from propagating', async () => {
  const container = await fixture(html`
    <div>
      <hx-radio-group>
        <hx-radio value="a"></hx-radio>
        <hx-radio value="b"></hx-radio>
      </hx-radio-group>
    </div>
  `);

  const group = container.querySelector('hx-radio-group')!;
  const radio = group.querySelector('hx-radio')!;

  // Listen for internal event on container (should never fire)
  let internalEventFired = false;
  container.addEventListener('hx-radio-select', () => {
    internalEventFired = true;
  });

  // Listen for public event on container (should fire)
  const publicEventPromise = oneEvent(container, 'hx-change');

  // Trigger selection
  radio.click();

  await publicEventPromise;

  // Internal event was stopped, public event was dispatched
  expect(internalEventFired).toBe(false);
});
```

## Examples from hx-library

Real-world event patterns from production components.

### Example 1: hx-checkbox (Simple State Change)

```typescript
// packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts

private _handleChange(): void {
  if (this.disabled) return;

  // Update state
  this.indeterminate = false;
  this.checked = !this.checked;

  // Sync form internals
  this._internals.setFormValue(this.checked ? this.value : null);
  this._updateValidity();

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

**Key features**:

- Guards against disabled state
- Updates state before dispatching
- Includes both `checked` and `value` in detail
- Uses standard `bubbles` and `composed` flags

### Example 2: hx-text-input (Multiple Events)

```typescript
// packages/hx-library/src/components/hx-text-input/hx-text-input.ts

private _handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);

  /**
   * Dispatched on every keystroke as the user types.
   * @event hx-input
   */
  this.dispatchEvent(
    new CustomEvent('hx-input', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
}

private _handleChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  this.value = target.value;
  this._internals.setFormValue(this.value);
  this._updateValidity();

  /**
   * Dispatched when the input loses focus after its value changed.
   * @event hx-change
   */
  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
}
```

**Key features**:

- Two events for different use cases (`hx-input` vs `hx-change`)
- `hx-input` fires on every keystroke (high frequency)
- `hx-change` fires on blur after value changed (validation)
- Both use identical configuration

### Example 3: hx-button (Native Event Access)

```typescript
// packages/hx-library/src/components/hx-button/hx-button.ts

private _handleClick(e: MouseEvent): void {
  if (this.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  /**
   * Dispatched when the button is clicked.
   * @event hx-click
   */
  this.dispatchEvent(
    new CustomEvent('hx-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: e },
    })
  );

  // Handle form submission/reset if form-associated
  if (this.type === 'submit' && this._internals.form) {
    this._internals.form.requestSubmit();
  } else if (this.type === 'reset' && this._internals.form) {
    this._internals.form.reset();
  }
}
```

**Key features**:

- Includes `originalEvent` for access to native MouseEvent
- Consumers can check modifier keys (Shift, Ctrl, etc.)
- Guards against disabled state
- Handles form integration after dispatching event

### Example 4: hx-radio-group (Internal Coordination)

```typescript
// packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts

override connectedCallback(): void {
  super.connectedCallback();
  this.addEventListener('hx-radio-select', this._handleRadioSelect as EventListener);
}

private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
  e.stopPropagation();  // ← Internal event, don't leak

  const newValue = e.detail.value;
  if (newValue === this.value) return;

  this.value = newValue;
  this._internals.setFormValue(this.value);
  this._syncRadios();
  this._updateValidity();

  // Dispatch public event for external consumers
  this.dispatchEvent(
    new CustomEvent('hx-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value },
    })
  );
};
```

**Key features**:

- Internal `hx-radio-select` event for child-parent coordination
- `stopPropagation()` prevents internal event from leaking
- Public `hx-change` event dispatched for external API
- Type-safe event handler with detail type

### Example 5: hx-alert (Lifecycle Events)

```typescript
// packages/hx-library/src/components/hx-alert/hx-alert.ts

private _handleClose(): void {
  this.open = false;

  /**
   * Dispatched when the user dismisses the alert.
   * @event hx-close
   */
  this.dispatchEvent(
    new CustomEvent('hx-close', {
      bubbles: true,
      composed: true,
      detail: { reason: 'user' },
    })
  );

  /**
   * Dispatched after the alert is dismissed.
   * @event hx-after-close
   */
  this.dispatchEvent(
    new CustomEvent('hx-after-close', {
      bubbles: true,
      composed: true,
    })
  );
}
```

**Key features**:

- Two events for different timing: `hx-close` (immediate) and `hx-after-close`
- `reason` in detail indicates why close happened
- Both events use standard configuration

## Best Practices Summary

1. **Always use `bubbles: true` and `composed: true`** for public events

   ```typescript
   { bubbles: true, composed: true }
   ```

2. **Prefix event names with `hx-`** to avoid collisions

   ```typescript
   ('hx-change', 'hx-input', 'hx-click');
   ```

3. **Include relevant data in `detail`**, but avoid redundant information

   ```typescript
   detail: {
     value: this.value;
   } // ✓ Essential data only
   ```

4. **Document events with `@fires` JSDoc** for CEM and autodocs

   ```typescript
   /**
    * @fires {CustomEvent<{value: string}>} hx-change - Description
    */
   ```

5. **Type event details** with TypeScript for type safety

   ```typescript
   new CustomEvent<{ value: string }>('hx-change', {
     /* ... */
   });
   ```

6. **Dispatch events after state changes**, not before

   ```typescript
   this.value = newValue; // Update state first
   this.dispatchEvent(/* ... */); // Then notify
   ```

7. **Stop propagation for internal coordination events**

   ```typescript
   e.stopPropagation(); // Internal event, don't leak
   ```

8. **Make events cancelable only for "before" actions**

   ```typescript
   cancelable: true; // For hx-before-close, hx-before-submit, etc.
   ```

9. **Test event dispatch and detail payloads** in component tests

   ```typescript
   const event = await oneEvent(el, 'hx-change');
   expect(event.detail.value).toBe('expected');
   ```

10. **Use consistent naming patterns** for related events
    ```typescript
    ('hx-input', 'hx-change'); // Same component, different timing
    ('hx-before-show', 'hx-after-show'); // Lifecycle pair
    ```

## Common Mistakes to Avoid

### Mistake 1: Forgetting `composed: true`

```typescript
// ✗ WRONG: Event trapped inside shadow tree
this.dispatchEvent(
  new CustomEvent('hx-change', {
    bubbles: true,
    // composed defaults to false!
  }),
);
```

**Fix**: Always set `composed: true` for public events.

### Mistake 2: Not Using Event Prefix

```typescript
// ✗ WRONG: Collides with native 'change' event
this.dispatchEvent(
  new CustomEvent('change', {
    /* ... */
  }),
);
```

**Fix**: Use `hx-change` to avoid collisions.

### Mistake 3: Including Redundant Data

```typescript
// ✗ WRONG: Redundant data in detail
detail: {
  value: this.value,
  label: this.label,      // Already a public property
  disabled: this.disabled, // Already a public property
}
```

**Fix**: Only include data that changed or isn't easily accessible.

### Mistake 4: Dispatching Before State Change

```typescript
// ✗ WRONG: Event dispatched before state update
this.dispatchEvent(
  new CustomEvent('hx-change', {
    /* ... */
  }),
);
this.value = newValue; // Listeners see old value!
```

**Fix**: Update state first, then dispatch.

### Mistake 5: Not Documenting Events

```typescript
// ✗ WRONG: No JSDoc for event
this.dispatchEvent(
  new CustomEvent('hx-change', {
    /* ... */
  }),
);
```

**Fix**: Add `@fires` JSDoc at class level and inline comment.

### Mistake 6: Leaking Internal Events

```typescript
// ✗ WRONG: Internal event leaks to consumers
private _handleRadioSelect(e: CustomEvent): void {
  // Forgot to stop propagation!
  this.value = e.detail.value;
}
```

**Fix**: Use `e.stopPropagation()` for internal events.

## Further Reading

- [CustomEvent - MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [Event: composed property - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)
- [Event: bubbles property - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles)
- [Shadow DOM Events (hx-library docs)](./shadow-dom/events.md)
- [Lit Events Documentation](https://lit.dev/docs/components/events/)
- [Web Components Best Practices - Google](https://web.dev/custom-elements-best-practices/)

---

**Next steps**:

- Review [Shadow DOM Events](./shadow-dom/events.md) for event propagation and retargeting
- Explore [Component Testing](./testing/vitest.md) for event testing patterns
- Read [TypeScript Strict Mode](./typescript/strict-mode.md) for type-safe event patterns
