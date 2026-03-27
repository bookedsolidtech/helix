---
title: Testing Events
description: Assert on custom events dispatched by HELiX components using oneEvent, event spies, and bubbling assertions.
---

HELiX components dispatch custom events with the `hx-` prefix. This page covers every pattern for asserting that events fire (and don't fire) correctly, inspecting `detail` payloads, and verifying bubbling behavior.

## `oneEvent()` — Awaiting a Single Event

`oneEvent` returns a `Promise` that resolves the next time a given event fires on the target. Register it before triggering the action:

```typescript
import { fixture, shadowQuery, oneEvent, cleanup } from '../../test-utils.js';

afterEach(cleanup);

it('dispatches hx-click on click', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent(el, 'hx-click');
  btn.click();
  const event = await eventPromise;

  expect(event).toBeTruthy();
});
```

The type parameter on `oneEvent<CustomEvent>` gives you a typed `detail` property:

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

## Asserting `bubbles` and `composed`

All HELiX custom events bubble out of the shadow root using `composed: true`. Test both flags explicitly:

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

## Testing That Events Are NOT Dispatched

When a component is disabled or loading, it must suppress events. Use a flag variable and `await el.updateComplete` to assert silence:

```typescript
it('does NOT dispatch hx-click when disabled', async () => {
  const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  let fired = false;
  el.addEventListener('hx-click', () => { fired = true; });
  btn.click();
  await el.updateComplete;

  expect(fired).toBe(false);
});

it('prevents hx-click when loading', async () => {
  const el = await fixture<HelixButton>('<hx-button loading>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  let fired = false;
  el.addEventListener('hx-click', () => { fired = true; });
  btn.click();
  await el.updateComplete;

  expect(fired).toBe(false);
});
```

## `vi.fn()` as Event Spy

For counting calls or inspecting all invocations, use `vi.fn()` as the event listener:

```typescript
import { vi } from 'vitest';

it('dispatches hx-change once per value change', async () => {
  const el = await fixture<HelixSwitch>('<hx-switch></hx-switch>');
  const spy = vi.fn();
  el.addEventListener('hx-change', spy);

  const toggle = shadowQuery<HTMLButtonElement>(el, 'button')!;
  toggle.click();
  await el.updateComplete;

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0].detail.checked).toBe(true);
});
```

## Full `oneEvent` + `userEvent` Pattern

Combine `oneEvent` with `userEvent` for keyboard-triggered events:

```typescript
import { userEvent } from '@vitest/browser/context';

it('hx-change fires when toggled via keyboard', async () => {
  const el = await fixture<HelixSwitch>('<hx-switch></hx-switch>');
  const toggle = shadowQuery<HTMLElement>(el, '[role="switch"]')!;

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
  toggle.focus();
  await userEvent.keyboard('{Enter}');
  const event = await eventPromise;

  expect(event.detail.checked).toBe(true);
});
```

## Asserting Event `detail` Shape

For events with structured detail payloads, assert the full shape:

```typescript
it('hx-select detail contains selected item', async () => {
  const el = await fixture<HelixDropdown>(
    '<hx-dropdown><hx-option value="a">Option A</hx-option></hx-dropdown>'
  );

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
  const option = el.querySelector('hx-option') as HTMLElement;
  option.click();
  const event = await eventPromise;

  expect(event.detail).toEqual({ value: 'a', label: 'Option A' });
});
```

## Testing Event Bubbling Through a Parent

To verify that a composed event escapes the shadow root and reaches a parent:

```typescript
it('hx-click reaches the parent container', async () => {
  const container = document.createElement('div');
  container.innerHTML = '<hx-button>Click</hx-button>';
  document.body.appendChild(container);
  const el = container.querySelector('hx-button') as HelixButton;
  await el.updateComplete;

  const spy = vi.fn();
  container.addEventListener('hx-click', spy);

  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  btn.click();
  await el.updateComplete;

  expect(spy).toHaveBeenCalledTimes(1);
  container.remove();
});
```

## Next Steps

- [Async Testing](/components-guide/testing/async/) — timing and `updateComplete`
- [Accessibility Testing](/components-guide/testing/accessibility-testing/) — ARIA state assertions
- [Mocking in Component Tests](/components-guide/testing/mocking/) — `vi.spyOn` and mock fetch
