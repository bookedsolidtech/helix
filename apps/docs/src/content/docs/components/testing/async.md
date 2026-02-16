---
title: Async Testing Patterns
description: Comprehensive guide to async testing patterns for Lit web components with Vitest browser mode
order: 45
---

Testing asynchronous behavior in web components requires careful synchronization between test assertions and component lifecycle updates. HELIX uses Vitest browser mode with real DOM testing, where async patterns like Lit's `updateComplete` promise, event listeners, and timing-sensitive operations demand deterministic test strategies.

This guide covers the async testing patterns used throughout the hx-library, drawing from real-world component tests and industry best practices.

## Why Async Testing Matters

Web components are inherently asynchronous. When you set a property on a Lit component, the DOM doesn't update immediately. Instead, Lit batches updates and processes them asynchronously. Similarly, events fire asynchronously, user interactions trigger async callbacks, and form validation may involve async operations.

Writing deterministic async tests prevents flaky tests that pass intermittently, fail randomly, or behave differently in CI versus local environments. The patterns in this guide ensure your tests synchronize properly with component updates.

## The updateComplete Promise

### What is updateComplete?

Every Lit component exposes an `updateComplete` promise that resolves when the component finishes its current update cycle. This is the primary synchronization mechanism for testing Lit components.

When you change a reactive property, Lit:

1. Marks the component as needing an update
2. Schedules an update for the next microtask
3. Batches any additional property changes
4. Renders the template
5. Updates the DOM
6. Resolves `updateComplete`

### Using updateComplete in Tests

The `fixture()` helper automatically awaits `updateComplete` after creating the element:

```typescript
import { fixture } from '../../test-utils.js';

it('renders with correct default state', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  // At this point, updateComplete has resolved
  // The component is fully rendered and ready to test
  expect(el.shadowRoot).toBeTruthy();
});
```

### Manual updateComplete Usage

When you programmatically change properties after fixture creation, await `updateComplete` before asserting:

```typescript
it('updates value attribute when programmatically changed', async () => {
  const el = await fixture<HxSelect>('<hx-select></hx-select>');

  // Programmatic property change
  el.value = 'updated';

  // Wait for the update to complete
  await el.updateComplete;

  // Now safe to assert
  expect(el.value).toBe('updated');
  expect(el.getAttribute('value')).toBe('updated');
});
```

### Chaining Multiple Updates

When making multiple property changes, you typically only need to await once at the end, since Lit batches updates:

```typescript
it('applies multiple property changes in one update', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');

  // Multiple changes
  el.variant = 'secondary';
  el.size = 'lg';
  el.disabled = true;

  // Single await batches all changes
  await el.updateComplete;

  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  expect(btn.classList.contains('button--secondary')).toBe(true);
  expect(btn.classList.contains('button--lg')).toBe(true);
  expect(btn.disabled).toBe(true);
});
```

### When updateComplete Is Not Enough

Some operations extend beyond Lit's update cycle. For example, slot changes trigger a separate `slotchange` event that may fire after `updateComplete` resolves. In these cases, add a small timeout:

```typescript
it('clones slotted options into native select', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="x">X</option>
      <option value="y">Y</option>
      <option value="z">Z</option>
    </hx-select>
  `);

  await el.updateComplete;

  // Wait for slotchange event to process
  await new Promise((r) => setTimeout(r, 50));

  const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
  const clonedOptions = select.querySelectorAll('option[data-cloned]');
  expect(clonedOptions.length).toBe(3);
});
```

## The oneEvent Helper

### Awaiting Custom Events

The `oneEvent()` helper returns a promise that resolves when a specific event fires on an element. This is crucial for testing custom events dispatched by components.

```typescript
import { oneEvent } from '../../test-utils.js';

it('dispatches hx-click on click', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  // Create promise before triggering the event
  const eventPromise = oneEvent(el, 'hx-click');

  // Trigger the event
  btn.click();

  // Await the event
  const event = await eventPromise;
  expect(event).toBeTruthy();
});
```

### Event Detail Assertions

Custom events often carry data in their `detail` property:

```typescript
it('hx-click detail contains originalEvent', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.click();

  const event = await eventPromise;
  expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
});

it('hx-change detail contains new value', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="a">A</option>
      <option value="b">B</option>
    </hx-select>
  `);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 50));

  const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');

  select.value = 'b';
  select.dispatchEvent(new Event('change', { bubbles: true }));

  const event = await eventPromise;
  expect(event.detail.value).toBe('b');
});
```

### Testing Event Properties

Verify that events have correct `bubbles` and `composed` flags for Shadow DOM traversal:

```typescript
it('hx-click bubbles and is composed', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.click();

  const event = await eventPromise;
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
});
```

## Testing Events That Don't Fire

When testing that an event does NOT fire (e.g., when a component is disabled), you cannot await an event that never happens. Instead, use a flag and a timeout:

```typescript
it('does NOT dispatch hx-click when disabled', async () => {
  const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  let fired = false;
  el.addEventListener('hx-click', () => {
    fired = true;
  });

  btn.click();

  // Give time for any async dispatch
  await new Promise((r) => setTimeout(r, 50));

  expect(fired).toBe(false);
});
```

## Testing Async Lifecycle Methods

### firstUpdated Lifecycle

Components often perform setup in `firstUpdated()`, which runs after the first render. The `fixture()` helper awaits `updateComplete`, which includes `firstUpdated()`:

```typescript
it('initializes state in firstUpdated', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');
  // firstUpdated has completed
  expect(el.initialized).toBe(true);
});
```

### updated Lifecycle

The `updated()` lifecycle method runs after every render. Test it by changing properties and awaiting `updateComplete`:

```typescript
it('reacts to property changes in updated', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');

  el.someProperty = 'new-value';
  await el.updateComplete;

  // updated() has run
  expect(el.derivedState).toBe('computed-from-new-value');
});
```

### connectedCallback and disconnectedCallback

Test connection and disconnection by adding and removing elements:

```typescript
it('cleans up resources in disconnectedCallback', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');

  // Component is connected
  expect(el.isConnected).toBe(true);

  // Track cleanup
  const cleanupSpy = vi.spyOn(el as any, '_cleanup');

  // Disconnect
  el.remove();

  // Verify cleanup ran
  expect(cleanupSpy).toHaveBeenCalled();
});
```

## Avoiding Race Conditions

### Race Condition: Property Change Before Render

**Problem**: Asserting before `updateComplete` resolves.

```typescript
// WRONG: Race condition
it('updates value', async () => {
  const el = await fixture<HxInput>('<hx-input></hx-input>');
  el.value = 'new';
  // BUG: el.value may not be reflected in DOM yet
  expect(shadowQuery(el, 'input')!.value).toBe('new');
});

// CORRECT: Await updateComplete
it('updates value', async () => {
  const el = await fixture<HxInput>('<hx-input></hx-input>');
  el.value = 'new';
  await el.updateComplete;
  expect(shadowQuery(el, 'input')!.value).toBe('new');
});
```

### Race Condition: Event Timing

**Problem**: Triggering an action before creating the event listener promise.

```typescript
// WRONG: Event listener added too late
it('dispatches event', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  btn.click(); // Event fires immediately
  const event = await oneEvent(el, 'hx-click'); // Too late!
  expect(event).toBeTruthy();
});

// CORRECT: Create promise before triggering
it('dispatches event', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  const eventPromise = oneEvent(el, 'hx-click'); // Listen first
  btn.click(); // Then trigger
  const event = await eventPromise;
  expect(event).toBeTruthy();
});
```

### Race Condition: Slot Changes

**Problem**: Slotted content may not be processed by the time `updateComplete` resolves.

```typescript
// WRONG: Slotchange hasn't fired yet
it('processes slotted content', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="a">A</option>
    </hx-select>
  `);
  await el.updateComplete;
  // BUG: slotchange event may not have fired
  const cloned = shadowQuery(el, 'option[data-cloned]');
  expect(cloned).toBeTruthy();
});

// CORRECT: Wait for slotchange to process
it('processes slotted content', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="a">A</option>
    </hx-select>
  `);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 50)); // Wait for slotchange

  const cloned = shadowQuery(el, 'option[data-cloned]');
  expect(cloned).toBeTruthy();
});
```

### Race Condition: Form Interactions

**Problem**: Form submit or reset events may fire before your assertions run.

```typescript
// CORRECT: Use promises to coordinate
it('calls form.requestSubmit on type=submit click', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<hx-button type="submit">Submit</hx-button>';
  document.getElementById('test-fixture-container')!.appendChild(form);

  const el = form.querySelector('hx-button') as HxButton;
  await el.updateComplete;

  let submitted = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitted = true;
  });

  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  btn.click();

  // Wait for async form interaction
  await new Promise((r) => setTimeout(r, 50));

  expect(submitted).toBe(true);
});
```

## Handling Flaky Tests

Flaky tests are tests that pass and fail intermittently without code changes. They're often caused by async timing issues.

### Symptom: Test Sometimes Passes, Sometimes Fails

**Cause**: Insufficient wait time for async operations.

**Solution**: Ensure you're awaiting all promises and add explicit waits for non-promise async operations:

```typescript
// FLAKY: No wait for async behavior
it('updates after external change', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');
  el.triggerAsyncUpdate();
  expect(el.updated).toBe(true); // May fail
});

// STABLE: Wait for update
it('updates after external change', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');
  el.triggerAsyncUpdate();
  await el.updateComplete;
  expect(el.updated).toBe(true);
});
```

### Symptom: Test Fails in CI But Passes Locally

**Cause**: CI environments may have different timing characteristics (slower CPUs, higher latency).

**Solution**: Never rely on implicit timing. Always use explicit synchronization:

```typescript
// FLAKY: Depends on execution speed
it('renders quickly', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');
  // Implicit assumption: render finished by now
  expect(shadowQuery(el, '.rendered')).toBeTruthy();
});

// STABLE: Explicit wait
it('renders', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');
  await el.updateComplete; // Explicit synchronization
  expect(shadowQuery(el, '.rendered')).toBeTruthy();
});
```

### Symptom: Test Fails When Run With Other Tests

**Cause**: Shared state or incomplete cleanup between tests.

**Solution**: Always use `afterEach(cleanup)` and avoid global state:

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '../../test-utils.js';

afterEach(cleanup);

it('test 1', async () => {
  const el = await fixture<HxComponent>('<hx-component></hx-component>');
  // ...
});

it('test 2', async () => {
  // Clean slate due to cleanup
  const el = await fixture<HxComponent>('<hx-component></hx-component>');
  // ...
});
```

## Timeout Configuration

### Default Timeouts

Vitest has a default timeout of 5000ms per test. For most component tests, this is sufficient.

### Extending Timeout for Slow Tests

If you have a legitimate slow test (e.g., testing a long animation), extend the timeout:

```typescript
it('completes long animation', async () => {
  const el = await fixture<HxComponent>('<hx-component animate></hx-component>');

  // Wait for 3-second animation
  await new Promise((r) => setTimeout(r, 3000));

  expect(el.animationComplete).toBe(true);
}, 10000); // 10-second timeout
```

### Setting Global Timeouts

Configure global timeouts in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds per test
  },
});
```

## Testing Debounced and Throttled Behavior

### Debounced Input

Components that debounce input events require careful timing:

```typescript
it('debounces input events', async () => {
  const el = await fixture<HxInput>('<hx-input debounce="300"></hx-input>');
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;

  let eventCount = 0;
  el.addEventListener('hx-debounced-input', () => {
    eventCount++;
  });

  // Rapid inputs
  input.value = 'a';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  input.value = 'ab';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  input.value = 'abc';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  // Wait less than debounce time: no event yet
  await new Promise((r) => setTimeout(r, 100));
  expect(eventCount).toBe(0);

  // Wait for debounce to complete
  await new Promise((r) => setTimeout(r, 250));

  // Now the debounced event fires once
  expect(eventCount).toBe(1);
});
```

### Throttled Scroll

Similarly, test throttled events by respecting their timing:

```typescript
it('throttles scroll events', async () => {
  const el = await fixture<HxScroller>('<hx-scroller throttle="200"></hx-scroller>');

  let eventCount = 0;
  el.addEventListener('hx-throttled-scroll', () => {
    eventCount++;
  });

  // First scroll fires immediately
  el.dispatchEvent(new Event('scroll'));
  await new Promise((r) => setTimeout(r, 10));
  expect(eventCount).toBe(1);

  // Rapid scrolls within throttle window: ignored
  el.dispatchEvent(new Event('scroll'));
  el.dispatchEvent(new Event('scroll'));
  await new Promise((r) => setTimeout(r, 10));
  expect(eventCount).toBe(1);

  // Wait for throttle window to expire
  await new Promise((r) => setTimeout(r, 200));

  // Next scroll fires
  el.dispatchEvent(new Event('scroll'));
  await new Promise((r) => setTimeout(r, 10));
  expect(eventCount).toBe(2);
});
```

## Testing Async Validation

Form components often perform async validation (e.g., checking username availability):

```typescript
it('validates asynchronously', async () => {
  const el = await fixture<HxInput>(`
    <hx-input
      name="username"
      validate-url="/api/check-username"
    ></hx-input>
  `);

  const input = shadowQuery<HTMLInputElement>(el, 'input')!;

  // Mock fetch for validation
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ available: false }),
  });

  // Trigger validation
  input.value = 'taken-username';
  input.dispatchEvent(new Event('blur', { bubbles: true }));

  // Wait for validation to complete
  await new Promise((r) => setTimeout(r, 100));
  await el.updateComplete;

  // Validation error should be set
  expect(el.error).toBe('Username is already taken');
});
```

## Examples from hx-library

### hx-button: Simple Event Test

```typescript
it('dispatches hx-click on click', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent(el, 'hx-click');
  btn.click();
  const event = await eventPromise;
  expect(event).toBeTruthy();
});
```

### hx-select: Slot Change Synchronization

```typescript
it('clones slotted options into native select', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="x">X</option>
      <option value="y">Y</option>
      <option value="z">Z</option>
    </hx-select>
  `);
  await el.updateComplete;
  // Wait for slotchange to fire
  await new Promise((r) => setTimeout(r, 50));

  const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
  const clonedOptions = select.querySelectorAll('option[data-cloned]');
  expect(clonedOptions.length).toBe(3);
});
```

### hx-form: Complex Form Interaction

```typescript
it('dispatches hx-submit on valid client-side submit', async () => {
  const el = await fixture<HxForm>(`
    <hx-form action="">
      <form>
        <input type="text" name="username" value="testuser" />
        <button type="submit">Submit</button>
      </form>
    </hx-form>
  `);

  const form = el.querySelector('form')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-submit');

  form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  const event = await eventPromise;

  expect(event.detail.valid).toBe(true);
  expect(event.detail.values).toBeDefined();
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
});
```

## Best Practices Summary

1. **Always await `updateComplete`** after programmatic property changes before asserting on DOM state.

2. **Create event listener promises before triggering events** to avoid race conditions.

3. **Use explicit waits for non-promise async operations** like slotchange events or form interactions.

4. **Never rely on implicit timing** or assume operations complete "fast enough."

5. **Clean up between tests** with `afterEach(cleanup)` to prevent shared state.

6. **Test that events don't fire** using flags and timeouts, not awaiting promises that never resolve.

7. **Add extra wait time for slot changes** since they occur after `updateComplete`.

8. **Extend timeouts for legitimate slow tests** like animations, but prefer fast tests when possible.

9. **Mock async dependencies** like fetch calls to keep tests fast and deterministic.

10. **Test event detail, bubbles, and composed** properties to verify correct event configuration.

## References

- [Lit Lifecycle Documentation](https://lit.dev/docs/v1/components/lifecycle/)
- [Open Web Components Testing Helpers](https://open-wc.org/docs/testing/helpers/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Dealing with Flaky Tests in Vitest](https://trunk.io/blog/how-to-avoid-and-detect-flaky-tests-in-vitest)

By following these async testing patterns, you ensure that your component tests are deterministic, reliable, and maintainable, even as components grow in complexity.
