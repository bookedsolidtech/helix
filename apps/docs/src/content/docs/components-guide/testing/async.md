---
title: Async Testing
description: Correctly await Lit's rendering cycle, user interactions, and debounced behavior in HELiX component tests.
---

Web component tests are inherently asynchronous. Lit batches property changes and renders them in microtasks. User interactions dispatch events that trigger async state changes. Timers and promises must be handled carefully. This page covers every async pattern used in HELiX tests.

## `await fixture(...)` — Initial Render

`fixture` itself is async. It appends the element to the DOM and awaits `updateComplete` before returning, so the component is fully rendered by the time you receive it:

```typescript
// The element is rendered and updateComplete has resolved before this line
const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
expect(el.shadowRoot).toBeTruthy();
```

You do not need to call `await el.updateComplete` after `fixture` — it is already done.

## `await el.updateComplete` — After Property Changes

When you change a reactive property programmatically, Lit schedules a re-render asynchronously. Await `updateComplete` before asserting on the DOM:

```typescript
it('shows spinner after programmatic loading=true', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  el.loading = true;
  await el.updateComplete; // wait for Lit to re-render
  const spinner = shadowQuery(el, '[part="spinner"]');
  expect(spinner).toBeTruthy();
});

it('removes aria-busy after loading transitions to false', async () => {
  const el = await fixture<HelixButton>('<hx-button loading>Click</hx-button>');
  el.loading = false;
  await el.updateComplete;
  const btn = shadowQuery(el, 'button')!;
  expect(btn.hasAttribute('aria-busy')).toBe(false);
});
```

### Multiple Update Cycles

Some patterns (such as clamping an invalid property back to a valid value inside `updated()`) trigger a second render cycle. Await `updateComplete` twice when testing these:

```typescript
it('clamps invalid variant and applies primary class', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  el.variant = 'invalid-variant' as 'primary';
  await el.updateComplete; // first cycle: setter runs, clamping scheduled
  await el.updateComplete; // second cycle: clamping applied, DOM updated
  const btn = shadowQuery(el, 'button')!;
  expect(btn.classList.contains('button--primary')).toBe(true);
});
```

## `await userEvent.click()` — Simulating User Interaction

`userEvent` from `@vitest/browser/context` simulates real browser user interactions. It dispatches native events and awaits their completion:

```typescript
import { userEvent } from '@vitest/browser/context';

it('dispatches hx-click on user click', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent(el, 'hx-click');
  await userEvent.click(btn);
  const event = await eventPromise;
  expect(event).toBeTruthy();
});
```

### Keyboard Simulation

```typescript
it('Enter activates button', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.focus();
  await userEvent.keyboard('{Enter}');
  const event = await eventPromise;
  expect(event).toBeTruthy();
});

it('Space activates button', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.focus();
  await userEvent.keyboard(' ');
  const event = await eventPromise;
  expect(event).toBeTruthy();
});
```

## Testing Properties That Trigger Async Updates

When a property change causes a component to fetch data or run a timer internally, pair `updateComplete` with the appropriate async boundary:

```typescript
it('shows resolved content after async load', async () => {
  const el = await fixture<HelixFormatDate>('<hx-format-date date="2024-01-01"></hx-format-date>');
  await el.updateComplete;
  expect(el.shadowRoot!.textContent).toContain('Jan');
});
```

## `vi.useFakeTimers()` — Debounced and Throttled Behavior

For components with debounced input or throttled scroll handlers, use Vitest's fake timer API:

```typescript
import { vi } from 'vitest';

it('debounced search waits 300ms before firing', async () => {
  vi.useFakeTimers();
  const el = await fixture<HelixCombobox>('<hx-combobox></hx-combobox>');
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;

  // Simulate typing
  input.value = 'he';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));

  // Event should not have fired yet
  let fired = false;
  el.addEventListener('hx-input', () => { fired = true; });
  expect(fired).toBe(false);

  // Advance the timer past the debounce threshold
  vi.advanceTimersByTime(300);
  await el.updateComplete;
  expect(fired).toBe(true);

  vi.useRealTimers();
});
```

Always restore real timers after the test. Use `afterEach(() => vi.useRealTimers())` when an entire describe block needs fake timers.

## Async Event Assertions

The canonical pattern for testing async events is to set up the `oneEvent` promise before triggering the action, then await both together:

```typescript
it('hx-click detail contains originalEvent', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  // Register listener BEFORE triggering the action
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.click();
  const event = await eventPromise;

  expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
});
```

If you await the action before setting up the listener, you may miss the event.

## Next Steps

- [Testing Events](/components-guide/testing/event-testing/) — full event testing patterns with `oneEvent`
- [Mocking in Component Tests](/components-guide/testing/mocking/) — fake timers, spies, and mock fetch
- [Shadow DOM Testing](/components-guide/testing/shadow-dom/) — `fixture` and `shadowQuery` reference
