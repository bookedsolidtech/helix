---
title: Testing Events
description: Comprehensive patterns for testing custom events, event payloads, and event bubbling in Lit web components.
---

Every HELIX component dispatches custom events to communicate state changes to consumers. Testing events thoroughly means verifying that events fire with the correct payload, that they bubble correctly across shadow boundaries, that they are suppressed when they should not fire, and that no event listener leaks accumulate over time. This guide covers every event testing pattern used in the HELIX test suite.

## The oneEvent Utility

`oneEvent()` from `@helixui/library/test-utils` wraps `addEventListener` in a `Promise` that resolves on the next occurrence of a named event. It is the primary tool for testing async event dispatch.

```typescript
/**
 * Returns a Promise that resolves on the next occurrence of an event on the element.
 */
export function oneEvent<T extends Event = Event>(el: EventTarget, eventName: string): Promise<T> {
  return new Promise<T>((resolve) => {
    el.addEventListener(eventName, ((e: Event) => resolve(e as T)) as EventListener, {
      once: true,
    });
  });
}
```

The `{ once: true }` option removes the listener automatically after the first event. This prevents the common mistake of leaving stale listeners attached to test fixtures.

### Basic Usage

Set up the promise _before_ triggering the action that dispatches the event. Setting it up after introduces a race condition where the event fires before the listener is registered.

```typescript
import { fixture, shadowQuery, oneEvent, cleanup } from '../../test-utils.js';
import type { HelixButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

it('dispatches hx-click on click', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  // Register listener BEFORE triggering the action
  const eventPromise = oneEvent(el, 'hx-click');
  btn.click();
  const event = await eventPromise;

  expect(event).toBeTruthy();
});
```

### Typed Events

HELIX events carry typed `detail` objects. Use the TypeScript generic to get a typed event object:

```typescript
it('hx-click detail contains originalEvent', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent<{ originalEvent: MouseEvent }>>(el, 'hx-click');
  btn.click();
  const event = await eventPromise;

  expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
});
```

## Testing Event Payloads

Every HELIX custom event carries a `detail` object. Test that the detail contains the correct values — not just that the event fired.

### hx-click: originalEvent

`hx-button` includes the native `MouseEvent` in its detail for consumers who need the raw event (e.g., to read `clientX`, `shiftKey`):

```typescript
it('hx-click detail.originalEvent is a MouseEvent', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent<{ originalEvent: MouseEvent }>>(el, 'hx-click');
  btn.click();
  const event = await eventPromise;

  expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
  expect(event.detail.originalEvent.type).toBe('click');
});
```

### hx-input: value

`hx-text-input` dispatches `hx-input` on every keystroke with the current input value:

```typescript
it('hx-input detail.value is the current input value', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input></hx-text-input>');
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;

  const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-input');
  input.value = 'hello';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const event = await eventPromise;

  expect(event.detail.value).toBe('hello');
});
```

### hx-change: value after blur

`hx-change` fires when the input loses focus and its value has changed. The detail carries the final committed value:

```typescript
it('hx-change detail.value reflects committed value', async () => {
  const el = await fixture<HelixTextInput>('<hx-text-input></hx-text-input>');
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;

  const eventPromise = oneEvent<CustomEvent<{ value: string }>>(el, 'hx-change');
  input.value = 'committed';
  input.dispatchEvent(new Event('change', { bubbles: true }));
  const event = await eventPromise;

  expect(event.detail.value).toBe('committed');
});
```

## Testing Events That Must NOT Fire

Disabled components suppress their events. This is critical to test—a disabled button that still dispatches `hx-click` is a bug.

`oneEvent()` is not suitable here because it waits indefinitely for an event that should never come. Instead, register a spy with `addEventListener`, trigger the interaction, wait a fixed delay, and assert the spy was never called.

```typescript
it('does NOT dispatch hx-click when disabled', async () => {
  const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  let fired = false;
  el.addEventListener('hx-click', () => {
    fired = true;
  });

  btn.click();

  // Wait longer than any async dispatch could take
  await new Promise((r) => setTimeout(r, 50));

  expect(fired).toBe(false);
});
```

The 50ms wait is intentional. It gives any async event dispatch (even in micro-tasks or promise chains) enough time to resolve before asserting the absence of the event.

### Using vi.fn() for Spy-Based Assertions

`vi.fn()` provides more detail than a boolean flag — you can assert call count, arguments, and more:

```typescript
import { vi } from 'vitest';

it('does not dispatch hx-click when disabled (vi.fn spy)', async () => {
  const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const handler = vi.fn();
  el.addEventListener('hx-click', handler);

  btn.click();
  await new Promise((r) => setTimeout(r, 50));

  expect(handler).not.toHaveBeenCalled();
});

it('dispatches hx-click exactly once per click', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const handler = vi.fn();
  el.addEventListener('hx-click', handler);

  btn.click();
  btn.click();
  btn.click();
  await new Promise((r) => setTimeout(r, 50));

  expect(handler).toHaveBeenCalledTimes(3);
});
```

## Testing Event Bubbling and Composition

HELIX events are dispatched with `bubbles: true, composed: true`. Both properties must be tested — they are part of the public contract.

- `bubbles: true` — the event traverses up the DOM tree
- `composed: true` — the event crosses shadow DOM boundaries

If either property is missing, consumers listening on a parent element will not receive the event.

```typescript
it('hx-click bubbles and is composed', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.click();
  const event = await eventPromise;

  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
});
```

### Verifying Events Cross Shadow Boundaries

Test that a parent element outside the shadow tree also receives the event. This confirms `composed: true` is working:

```typescript
it('hx-click reaches a parent listener outside the shadow tree', async () => {
  // Wrap the component in a parent container
  const wrapper = document.createElement('div');
  wrapper.innerHTML = '<hx-button>Click</hx-button>';
  document.getElementById('test-fixture-container')!.appendChild(wrapper);

  const el = wrapper.querySelector('hx-button') as HelixButton;
  await el.updateComplete;

  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  // Listen on the PARENT, not the component itself
  const eventPromise = oneEvent<CustomEvent>(wrapper, 'hx-click');
  btn.click();
  const event = await eventPromise;

  // Event crossed the shadow boundary and bubbled to the parent
  expect(event).toBeTruthy();
  expect(event.composed).toBe(true);
});
```

### Event Retargeting

When a `composed` event crosses a shadow boundary, the browser retargets `event.target` to the shadow host. This is correct browser behavior but is worth documenting in tests when the target matters to consumers:

```typescript
it('hx-click target is the hx-button host element', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.click();
  const event = await eventPromise;

  // Target is the custom element host, not the internal <button>
  expect(event.target).toBe(el);
});
```

## Testing Keyboard Events That Trigger Custom Events

Keyboard interactions must trigger the same events as pointer interactions. Test keyboard events directly on the shadow element that handles them.

### Enter and Space on hx-button

Native `<button>` elements activate on Enter and Space natively. Since `hx-button` wraps a native button, keyboard activation goes through the native element's click handler, which then dispatches `hx-click`:

```typescript
it('Enter activates hx-button and dispatches hx-click', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');

  // Fire the keyboard event on the native button, then click it
  btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  btn.click();

  const event = await eventPromise;
  expect(event).toBeTruthy();
});

it('Space activates hx-button and dispatches hx-click', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');

  btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  btn.click();

  const event = await eventPromise;
  expect(event).toBeTruthy();
});
```

### Keyboard Events on Custom-Handled Components

For components that handle keyboard events directly (e.g., a custom dropdown), dispatch `KeyboardEvent` on the element and await the expected custom event:

```typescript
it('Escape key on hx-select dispatches hx-close', async () => {
  const el = await fixture<HelixSelect>('<hx-select label="Pick one"></hx-select>');

  // Open the dropdown first
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await el.updateComplete;

  const eventPromise = oneEvent(el, 'hx-close');
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await eventPromise;

  // If we got here without timing out, the event fired
  expect(true).toBe(true);
});
```

## Testing Async Events

Some events fire asynchronously — after a fetch, after a debounce, or after a transition completes. Use `oneEvent()` combined with the action that triggers the async dispatch, and `await` the promise:

```typescript
it('hx-loaded fires after async data resolves', async () => {
  const el = await fixture<HelixDataComponent>(
    '<hx-async-component src="/api/data"></hx-async-component>',
  );

  // oneEvent will wait until the event fires, regardless of how long it takes
  const event = await oneEvent<CustomEvent<{ items: unknown[] }>>(el, 'hx-loaded');

  expect(event.detail.items).toBeDefined();
  expect(Array.isArray(event.detail.items)).toBe(true);
});
```

For events that have a reasonable timeout bound, wrap `oneEvent()` in a `Promise.race()` against a timeout:

```typescript
it('hx-loaded fires within 2 seconds', async () => {
  const el = await fixture<HelixDataComponent>(
    '<hx-async-component src="/api/data"></hx-async-component>',
  );

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('hx-loaded did not fire within 2s')), 2000),
  );

  const event = await Promise.race([oneEvent<CustomEvent>(el, 'hx-loaded'), timeout]);

  expect(event).toBeTruthy();
});
```

## Testing Event Listener Cleanup

Event listeners attached in `connectedCallback` must be removed in `disconnectedCallback`. Leaking listeners causes memory issues and incorrect behavior when components are re-mounted. Test cleanup by disconnecting the element and verifying the listener is gone.

### Pattern: Spy on removeEventListener

```typescript
it('removes its internal listeners on disconnect', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  // Removing the element from the DOM triggers disconnectedCallback
  el.remove();

  // After disconnect, clicking the internal button should not dispatch hx-click
  let fired = false;
  document.addEventListener('hx-click', () => {
    fired = true;
  });

  btn.click();
  await new Promise((r) => setTimeout(r, 50));

  expect(fired).toBe(false);

  // Cleanup the test listener
  document.removeEventListener('hx-click', () => {});
});
```

### Pattern: Reconnect and Verify

A more thorough approach: disconnect, reconnect, and verify the component works normally again. If listeners were duplicated instead of replaced, events would fire multiple times.

```typescript
it('does not duplicate listeners on reconnect', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const handler = vi.fn();
  el.addEventListener('hx-click', handler);

  // Disconnect and reconnect
  const parent = el.parentElement!;
  parent.removeChild(el);
  parent.appendChild(el);
  await el.updateComplete;

  btn.click();
  await new Promise((r) => setTimeout(r, 50));

  // Should fire exactly once, not twice
  expect(handler).toHaveBeenCalledTimes(1);
});
```

## Complete Example: Testing hx-button Events

This is the full event test suite from `hx-button.test.ts`, annotated with the patterns above:

```typescript
import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup } from '../../test-utils.js';
import type { HelixButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-button — Events', () => {
  // 1. Event fires on click
  it('dispatches hx-click on click', async () => {
    const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const eventPromise = oneEvent(el, 'hx-click');
    btn.click();
    const event = await eventPromise;

    expect(event).toBeTruthy();
  });

  // 2. Event has correct properties
  it('hx-click bubbles and is composed', async () => {
    const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.click();
    const event = await eventPromise;

    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  // 3. Event payload is correct
  it('hx-click detail contains the original MouseEvent', async () => {
    const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const eventPromise = oneEvent<CustomEvent<{ originalEvent: MouseEvent }>>(el, 'hx-click');
    btn.click();
    const event = await eventPromise;

    expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
  });

  // 4. Event is suppressed when disabled
  it('does NOT dispatch hx-click when disabled', async () => {
    const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    let fired = false;
    el.addEventListener('hx-click', () => {
      fired = true;
    });
    btn.click();

    await new Promise((r) => setTimeout(r, 50));
    expect(fired).toBe(false);
  });

  // 5. Keyboard: Enter triggers the event
  it('Enter key dispatches hx-click', async () => {
    const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    btn.click();
    const event = await eventPromise;

    expect(event).toBeTruthy();
  });

  // 6. Keyboard: Space triggers the event
  it('Space key dispatches hx-click', async () => {
    const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    btn.click();
    const event = await eventPromise;

    expect(event).toBeTruthy();
  });

  // 7. Call count verification with vi.fn
  it('dispatches one hx-click per click', async () => {
    const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const handler = vi.fn();
    el.addEventListener('hx-click', handler);

    btn.click();
    btn.click();
    await new Promise((r) => setTimeout(r, 50));

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
```

## Summary of Patterns

| Scenario                | Pattern                                                  |
| ----------------------- | -------------------------------------------------------- |
| Event fires             | `oneEvent()` before action, `await` after                |
| Typed detail            | `oneEvent<CustomEvent<DetailType>>()`                    |
| Event does not fire     | `vi.fn()` spy + 50ms wait + `not.toHaveBeenCalled()`     |
| Bubbles + composed      | Assert `event.bubbles` and `event.composed`              |
| Crosses shadow boundary | Listen on parent wrapper outside shadow tree             |
| Event retargeting       | Assert `event.target === el` (the host element)          |
| Keyboard triggers event | `dispatchEvent(KeyboardEvent)` + `.click()`              |
| Async events            | `await oneEvent()` directly — it waits as long as needed |
| Listener cleanup        | Disconnect element, verify subsequent actions don't fire |
| Call count              | `vi.fn()` + `toHaveBeenCalledTimes(n)`                   |

## Common Mistakes

**Setting up `oneEvent` after the action.** The event fires before the listener is registered:

```typescript
// Bad — race condition
btn.click();
const event = await oneEvent(el, 'hx-click'); // May already have fired

// Good — listener registered first
const eventPromise = oneEvent(el, 'hx-click');
btn.click();
const event = await eventPromise;
```

**Using `oneEvent` to test event absence.** It waits forever for an event that never comes:

```typescript
// Bad — test never finishes
it('does not fire when disabled', async () => {
  const eventPromise = oneEvent(el, 'hx-click');
  btn.click();
  await eventPromise; // Hangs
});

// Good — spy + timeout
let fired = false;
el.addEventListener('hx-click', () => {
  fired = true;
});
btn.click();
await new Promise((r) => setTimeout(r, 50));
expect(fired).toBe(false);
```

**Not asserting `bubbles` and `composed`.** These are contractual obligations:

```typescript
// Incomplete — doesn't verify the event works across shadow boundaries
expect(event).toBeTruthy();

// Complete
expect(event.bubbles).toBe(true);
expect(event.composed).toBe(true);
```

---

**Related:**

- [Testing Shadow DOM](/components/testing/shadow-dom) — `shadowQuery`, fixture, cleanup
- [Testing Form Components](/components/testing/form-testing) — ElementInternals, validation events
- [Storybook Interaction Tests](/components/documentation/storybook-interaction) — `userEvent` in `play()` functions
