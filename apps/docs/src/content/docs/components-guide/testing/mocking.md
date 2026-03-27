---
title: Mocking in Component Tests
description: Use vi.spyOn, vi.mock, and vi.useFakeTimers to isolate HELiX component behavior from external dependencies.
---

Web components occasionally depend on external APIs, global browser objects, or time-sensitive behavior. Vitest's built-in mock utilities let you isolate the component under test.

## `vi.spyOn()` — Method Spying

Spy on a method without replacing its implementation. The original behavior still executes, but you can assert it was called:

```typescript
import { vi } from 'vitest';

it('calls form.requestSubmit on type=submit click', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<hx-button type="submit">Submit</hx-button>';
  document.body.appendChild(form);
  const el = form.querySelector('hx-button') as HelixButton;
  await el.updateComplete;

  const spy = vi.spyOn(form, 'requestSubmit');
  let submitted = false;
  form.addEventListener('submit', (e) => { e.preventDefault(); submitted = true; });

  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  btn.click();
  await el.updateComplete;

  expect(submitted).toBe(true);
  form.remove();
});
```

Spy on internal methods to verify they fire without replacing behavior:

```typescript
it('calls _handleClick when button is clicked', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const spy = vi.spyOn(el as unknown as { _handleClick: () => void }, '_handleClick');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  btn.click();
  await el.updateComplete;
  expect(spy).toHaveBeenCalledOnce();
});
```

## `vi.mock()` — Replacing Module Imports

Mock an entire module import. The factory function receives the original module and can override individual exports:

```typescript
vi.mock('../../utils/dev-warn.js', () => ({
  devWarn: vi.fn(), // suppress console warnings during tests
}));

it('does not throw when button is empty', async () => {
  // devWarn is suppressed — test only checks no exception is thrown
  let threw = false;
  try {
    const el = await fixture<HelixButton>('<hx-button></hx-button>');
    await el.updateComplete;
    expect(el).toBeTruthy();
  } catch {
    threw = true;
  }
  expect(threw).toBe(false);
});
```

## Mocking `fetch` in Component Tests

For components that fetch data, replace `globalThis.fetch` with a mock:

```typescript
it('loads remote data on connect', async () => {
  const mockData = { items: [{ id: 1, label: 'Alpha' }] };

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockData,
  }));

  const el = await fixture<HelixDataTable>(
    '<hx-data-table src="/api/items"></hx-data-table>'
  );
  await el.updateComplete;

  const rows = shadowQuery(el, 'tbody')?.querySelectorAll('tr');
  expect(rows?.length).toBe(1);

  vi.unstubAllGlobals();
});
```

## Injecting Test Data via `@property`

The simplest approach for data-driven components is property injection — no mocking needed:

```typescript
it('renders rows from the data property', async () => {
  const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
  el.data = [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'Viewer' },
  ];
  await el.updateComplete;

  const rows = shadowQuery(el, 'tbody')?.querySelectorAll('tr');
  expect(rows?.length).toBe(2);
});
```

## `vi.useFakeTimers()` — Controlling Time

Fake timers replace `setTimeout`, `setInterval`, `Date.now`, and `requestAnimationFrame` with controllable versions:

```typescript
it('auto-dismisses toast after delay', async () => {
  vi.useFakeTimers();

  const el = await fixture<HelixToast>('<hx-toast duration="3000">Message</hx-toast>');
  expect(el.open).toBe(true);

  vi.advanceTimersByTime(3000);
  await el.updateComplete;

  expect(el.open).toBe(false);

  vi.useRealTimers();
});
```

### Restoring Timers in `afterEach`

If many tests in a suite use fake timers, restore them automatically:

```typescript
describe('hx-toast auto-dismiss', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('closes after 3 seconds', async () => {
    const el = await fixture<HelixToast>('<hx-toast duration="3000">Saved</hx-toast>');
    vi.advanceTimersByTime(3000);
    await el.updateComplete;
    expect(el.open).toBe(false);
  });

  it('stays open before timeout', async () => {
    const el = await fixture<HelixToast>('<hx-toast duration="3000">Saved</hx-toast>');
    vi.advanceTimersByTime(1000);
    await el.updateComplete;
    expect(el.open).toBe(true);
  });
});
```

## `vi.restoreAllMocks()` — Cleanup

After using `vi.spyOn`, restore all mocks to their original implementations in `afterEach`:

```typescript
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});
```

Or call it once after all tests in a suite:

```typescript
afterAll(() => {
  vi.restoreAllMocks();
});
```

## `vi.stubGlobal()` vs Direct Assignment

Prefer `vi.stubGlobal` over direct assignment to global properties. It tracks the original value and restores it cleanly with `vi.unstubAllGlobals()`:

```typescript
// Preferred
vi.stubGlobal('ResizeObserver', class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
});

// Cleanup
afterEach(() => vi.unstubAllGlobals());
```

## Next Steps

- [Async Testing](/components-guide/testing/async/) — `updateComplete` and fake timers
- [Testing Events](/components-guide/testing/event-testing/) — event spy patterns
- [Component Fixtures and Test Utilities](/components-guide/testing/component-fixtures/) — the full HELiX test utility API
