---
title: Component Fixtures and Test Utilities
description: Full reference for the HELiX test-utils module — fixture, shadowQuery, oneEvent, cleanup, and checkA11y.
---

HELiX ships a shared test utility module at `packages/hx-library/src/test-utils.ts`. Every component test imports from it. This page documents each utility, its signature, and when to use it.

## Import Pattern

```typescript
import { fixture, shadowQuery, shadowQueryAll, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
```

The path is relative to the component's test file. The `.js` extension is required even for `.ts` source files due to ESM module resolution.

## `fixture<T>(html: string): Promise<T>`

Renders an HTML string into the shared test container, waits for Lit's `updateComplete` lifecycle, and returns a typed reference to the root element.

```typescript
const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
```

**How it works:**

1. Creates a wrapper `<div>` and sets its `innerHTML` to the provided HTML string.
2. Appends the wrapper's first child to `#test-fixture-container` (a `<div>` appended to `document.body` when the module loads).
3. If the element has an `updateComplete` property, awaits it.
4. Returns the element cast to `T`.

**Signature:**

```typescript
async function fixture<T extends HTMLElement>(html: string): Promise<T>
```

**When to use it:** For every test that needs a rendered component in a real DOM context. Always prefer `fixture` over `document.createElement` because it handles Lit's async rendering automatically.

## `shadowQuery<T>(host: HTMLElement, selector: string): T | null`

Queries a single element inside the host's shadow root. Equivalent to `host.shadowRoot?.querySelector<T>(selector) ?? null`.

```typescript
const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
const spinner = shadowQuery(el, '[part="spinner"]');
const label = shadowQuery(el, '[part~="label"]');
```

**Signature:**

```typescript
function shadowQuery<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T | null
```

Returns `null` when the selector does not match or when `shadowRoot` is `null`. The `!` non-null assertion is appropriate when you know the element must exist (and want a test failure, not a crash, if it doesn't).

## `shadowQueryAll<T>(host: HTMLElement, selector: string): T[]`

Queries all matching elements inside the shadow root. Returns an empty array (not `null`) when nothing matches.

```typescript
const items = shadowQueryAll<HTMLLIElement>(el, 'li[part~="item"]');
expect(items.length).toBe(3);
```

**Signature:**

```typescript
function shadowQueryAll<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T[]
```

## `oneEvent<T>(el: EventTarget, eventName: string): Promise<T>`

Returns a `Promise` that resolves the next time the named event fires on the target. The promise resolves with the event object. Register it before triggering the action.

```typescript
const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
btn.click();
const event = await eventPromise;
expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
```

**Signature:**

```typescript
function oneEvent<T extends Event = Event>(
  el: EventTarget,
  eventName: string,
): Promise<T>
```

The listener is registered with `{ once: true }` and is automatically removed after the first event.

**Important:** If the event never fires, `oneEvent` will hang the test until the `testTimeout` (30 seconds by default). Add an assertion guard when testing optional events:

```typescript
// Safe pattern: use a flag variable for "must NOT fire" assertions
let fired = false;
el.addEventListener('hx-click', () => { fired = true; });
btn.click();
await el.updateComplete;
expect(fired).toBe(false);
```

## `cleanup(): void`

Empties `#test-fixture-container`, removing all elements rendered during the current test.

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '../../test-utils.js';

afterEach(cleanup);
```

Always register `cleanup` at the **top level** of the test file (not inside a `describe` block) so it runs after every test, not just those in a specific suite.

## `checkA11y(el, options?): Promise<{ violations, passes }>`

Runs axe-core against the component's shadow root (or the element itself if `shadowRoot` is `null`). Returns `violations` and `passes` arrays.

```typescript
const { violations } = await checkA11y(el);
expect(violations).toEqual([]);
```

The audit runs against WCAG 2.1 AA tags: `wcag2a`, `wcag2aa`, and `best-practice`.

**Signature:**

```typescript
async function checkA11y(
  el: HTMLElement,
  options?: { rules?: Record<string, { enabled: boolean }> },
): Promise<{ violations: AxeViolation[]; passes: AxePass[] }>
```

**Disabling specific rules:**

```typescript
const { violations } = await checkA11y(el, {
  rules: { 'color-contrast': { enabled: false } },
});
```

## Creating Reusable Fixture Factories

For components with complex setup, extract a factory function:

```typescript
async function makeButton(attrs = '') {
  return fixture<HelixButton>(`<hx-button ${attrs}>Click</hx-button>`);
}

it('applies secondary variant', async () => {
  const el = await makeButton('variant="secondary"');
  expect(el.variant).toBe('secondary');
});

it('is disabled', async () => {
  const el = await makeButton('disabled');
  expect(el.disabled).toBe(true);
});
```

## Custom Test Utilities

For complex components, add component-specific helpers alongside the test file:

```typescript
// hx-combobox.test-helpers.ts
export async function openCombobox(el: HelixCombobox) {
  const trigger = shadowQuery<HTMLButtonElement>(el, '[part="trigger"]')!;
  trigger.click();
  await el.updateComplete;
}

export async function selectOption(el: HelixCombobox, value: string) {
  const option = el.querySelector(`hx-option[value="${value}"]`) as HTMLElement;
  option.click();
  await el.updateComplete;
}
```

Import and use in the test file:

```typescript
import { openCombobox, selectOption } from './hx-combobox.test-helpers.js';

it('selects an option', async () => {
  const el = await fixture<HelixCombobox>(
    '<hx-combobox><hx-option value="a">Option A</hx-option></hx-combobox>'
  );
  await openCombobox(el);
  const eventPromise = oneEvent(el, 'hx-change');
  await selectOption(el, 'a');
  const event = await eventPromise;
  expect(event.detail.value).toBe('a');
});
```

## Next Steps

- [Testing Setup with Vitest](/components-guide/testing/vitest-setup/) — `vitest.config.ts` and test runner configuration
- [Shadow DOM Testing](/components-guide/testing/shadow-dom/) — querying shadow internals
- [Async Testing](/components-guide/testing/async/) — `updateComplete` and fake timers
