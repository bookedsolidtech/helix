---
title: Writing Component Tests
description: Comprehensive guide to writing Vitest browser mode tests for hx-library components. Covers fixture helpers, shadow DOM queries, event testing, form validation, accessibility checks, and complete test patterns for building production-grade web components.
sidebar:
  order: 43
---

# Writing Component Tests

Testing is not optional. In an enterprise healthcare environment, untested code is unshippable code. Every component in `hx-library` must have comprehensive test coverage before merge. This guide teaches you how to write deterministic, browser-based tests using Vitest browser mode, Playwright, and our custom test utilities.

## Testing Philosophy

**hx-library uses real browser testing.** No jsdom. No happy-dom. Tests run in Chromium via Playwright to ensure behavior matches production environments. This catches issues that synthetic environments miss: Shadow DOM edge cases, focus management, form participation, and ARIA implementation.

### Core Principles

1. **Deterministic** — Tests never flake. No timing-dependent assertions. Use `oneEvent()` and `await updateComplete` for async work.
2. **Comprehensive** — Test all properties, events, slots, keyboard interactions, form behavior, and accessibility.
3. **Isolated** — Each test is independent. Use `afterEach(cleanup)` to prevent test pollution.
4. **Real Browser** — Tests run in actual Chromium, not a DOM simulator.
5. **80% Coverage Minimum** — Enforced in CI. No exceptions.

## Test Infrastructure

### Vitest Configuration

`hx-library` uses Vitest browser mode with Playwright provider:

```typescript
// packages/hx-library/vitest.config.ts
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    include: ['src/components/**/*.test.ts'],
    coverage: {
      enabled: true,
      include: ['src/components/**/*.ts'],
      exclude: [
        'src/components/**/*.test.ts',
        'src/components/**/*.stories.ts',
        'src/components/**/*.styles.ts',
        'src/components/**/index.ts',
      ],
      reporter: ['text', 'json-summary'],
      reportsDirectory: '.cache/coverage',
    },
  },
});
```

**Key settings:**

- **Browser mode** — Tests run in real Chromium
- **Headless** — No visible browser window in CI
- **Coverage threshold** — 80% minimum enforced
- **Exclusions** — Styles, stories, and index files don't count toward coverage

### Test File Structure

Every component has a co-located test file:

```
src/components/hx-button/
├── index.ts               # Re-export
├── hx-button.ts           # Component class
├── hx-button.styles.ts    # Lit CSS tagged template
├── hx-button.stories.ts   # Storybook stories
└── hx-button.test.ts      # ← Test file (THIS FILE)
```

## Test Utilities

The `test-utils.ts` file provides five essential helpers for testing web components with Shadow DOM.

### fixture()

Creates a component, appends it to the DOM, and waits for Lit's `updateComplete` lifecycle.

**Type signature:**

```typescript
async function fixture<T extends HTMLElement>(html: string): Promise<T>;
```

**Usage:**

```typescript
import { fixture } from '../../test-utils.js';
import type { HxButton } from './hx-button.js';
import './index.js';

it('renders with shadow DOM', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  expect(el.shadowRoot).toBeTruthy();
});
```

**What it does:**

1. Parses HTML string
2. Appends element to persistent fixture container in `document.body`
3. Waits for `updateComplete` (Lit's async render cycle)
4. Returns typed element reference

**When to use:**

- Every test that needs a component instance
- First line after `it()` block

**Key details:**

- Returns fully initialized component (constructor + connectedCallback + first render complete)
- Component remains in DOM until `cleanup()` is called
- Type parameter ensures TypeScript knows component methods/properties

### shadowQuery()

Query a single element inside a component's shadow DOM.

**Type signature:**

```typescript
function shadowQuery<T extends Element = Element>(host: HTMLElement, selector: string): T | null;
```

**Usage:**

```typescript
it('exposes "button" CSS part', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery(el, '[part="button"]');
  expect(btn).toBeTruthy();
});
```

**What it does:**

- Returns `host.shadowRoot.querySelector<T>(selector)`
- Returns `null` if element not found or shadow root doesn't exist

**When to use:**

- Querying internal DOM (button, input, label, etc.)
- Checking CSS parts are exposed
- Reading internal state (classes, attributes, text content)

**Common patterns:**

```typescript
// Query by element type
const btn = shadowQuery<HTMLButtonElement>(el, 'button');

// Query by CSS part
const input = shadowQuery(el, '[part="input"]');

// Query by class
const wrapper = shadowQuery(el, '.field__wrapper');

// Query by role
const alert = shadowQuery(el, '[role="alert"]');
```

### shadowQueryAll()

Query multiple elements inside a component's shadow DOM.

**Type signature:**

```typescript
function shadowQueryAll<T extends Element = Element>(host: HTMLElement, selector: string): T[];
```

**Usage:**

```typescript
it('renders multiple option elements', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="1">One</option>
      <option value="2">Two</option>
      <option value="3">Three</option>
    </hx-select>
  `);
  const options = shadowQueryAll<HTMLOptionElement>(el, 'option');
  expect(options).toHaveLength(3);
});
```

**What it does:**

- Returns `Array.from(host.shadowRoot.querySelectorAll<T>(selector))`
- Returns empty array if none found

**When to use:**

- Testing lists (options, radio buttons, checkboxes)
- Verifying slot content rendering
- Counting elements

### oneEvent()

Returns a promise that resolves on the next occurrence of an event.

**Type signature:**

```typescript
function oneEvent<T extends Event = Event>(el: EventTarget, eventName: string): Promise<T>;
```

**Usage:**

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

**What it does:**

1. Adds event listener with `{ once: true }` option
2. Returns promise that resolves with event object when fired
3. Automatically removes listener after event fires

**When to use:**

- Testing custom events (`hx-click`, `hx-input`, `hx-change`)
- Verifying event properties (bubbles, composed, detail)
- Async event assertions

**Key patterns:**

**Basic event check:**

```typescript
const eventPromise = oneEvent(el, 'hx-click');
btn.click();
const event = await eventPromise;
expect(event).toBeTruthy();
```

**Type-safe custom event:**

```typescript
const eventPromise = oneEvent<CustomEvent>(el, 'hx-input');
input.dispatchEvent(new Event('input', { bubbles: true }));
const event = await eventPromise;
expect(event.detail.value).toBe('hello');
```

**Verify bubbles and composed:**

```typescript
const eventPromise = oneEvent<CustomEvent>(el, 'hx-change');
input.dispatchEvent(new Event('change', { bubbles: true }));
const event = await eventPromise;
expect(event.bubbles).toBe(true);
expect(event.composed).toBe(true);
```

### cleanup()

Clears the fixture container between tests to prevent test pollution.

**Type signature:**

```typescript
function cleanup(): void;
```

**Usage:**

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '../../test-utils.js';

afterEach(cleanup);
```

**What it does:**

- Sets `fixtureContainer.innerHTML = ''`
- Removes all elements created by `fixture()`
- Ensures test isolation

**When to use:**

- **Always.** Every test file must have `afterEach(cleanup);` after imports.

**Why it's critical:**
Without cleanup, elements from previous tests remain in the DOM:

- Tests become dependent on execution order
- Event listeners leak between tests
- Form associations persist incorrectly
- Memory usage grows unbounded

### checkA11y()

Runs axe-core WCAG 2.1 AA accessibility audit on a component.

**Type signature:**

```typescript
async function checkA11y(
  el: HTMLElement,
  options?: { rules?: Record<string, { enabled: boolean }> },
): Promise<{ violations: AxeViolation[]; passes: AxePass[] }>;
```

**Usage:**

```typescript
it('has no axe violations in default state', async () => {
  const el = await fixture<HxButton>('<hx-button>Click me</hx-button>');
  const { violations } = await checkA11y(el);
  expect(violations).toEqual([]);
});
```

**What it does:**

1. Imports axe-core dynamically
2. Runs WCAG 2.1 AA audit on shadow root or element
3. Returns violations and passes

**When to use:**

- Every component must have at least one axe test
- Test all interactive states (default, disabled, error, checked, etc.)

**Common patterns:**

**Test all variants:**

```typescript
it('has no axe violations for all variants', async () => {
  for (const variant of ['primary', 'secondary', 'ghost']) {
    const el = await fixture<HxButton>(`<hx-button variant="${variant}">Click me</hx-button>`);
    const { violations } = await checkA11y(el);
    expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
    el.remove();
  }
});
```

**Disable specific rules:**

```typescript
const { violations } = await checkA11y(el, {
  rules: {
    'color-contrast': { enabled: false }, // Skip contrast check
  },
});
```

## Test Categories

Every component must cover these categories. Use nested `describe()` blocks for organization.

### 1. Rendering

Test that the component renders with correct structure and default state.

**Tests to include:**

- Shadow DOM exists
- CSS parts are exposed
- Native elements render (button, input, etc.)
- Default classes/attributes applied

**Example:**

```typescript
describe('Rendering', () => {
  it('renders with shadow DOM', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('exposes "button" CSS part', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery(el, '[part="button"]');
    expect(btn).toBeTruthy();
  });

  it('renders native <button> element', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery(el, 'button');
    expect(btn).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies default variant=primary class', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery(el, 'button')!;
    expect(btn.classList.contains('button--primary')).toBe(true);
  });
});
```

### 2. Properties

Test every public property (reflected attributes, reactive state, variants, sizes, disabled, etc.).

**Tests to include:**

- Attribute reflection (does attribute sync to host?)
- Class application (does variant/size apply correct CSS classes?)
- Boolean properties (disabled, checked, required, etc.)
- Enum properties (variant, size, type)

**Example:**

```typescript
describe('Property: variant', () => {
  it('reflects variant attr to host', async () => {
    const el = await fixture<HxButton>('<hx-button variant="secondary">Click</hx-button>');
    expect(el.getAttribute('variant')).toBe('secondary');
  });

  it('applies secondary class', async () => {
    const el = await fixture<HxButton>('<hx-button variant="secondary">Click</hx-button>');
    const btn = shadowQuery(el, 'button')!;
    expect(btn.classList.contains('button--secondary')).toBe(true);
  });

  it('applies ghost class', async () => {
    const el = await fixture<HxButton>('<hx-button variant="ghost">Click</hx-button>');
    const btn = shadowQuery(el, 'button')!;
    expect(btn.classList.contains('button--ghost')).toBe(true);
  });
});

describe('Property: disabled', () => {
  it('sets native disabled attribute', async () => {
    const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
    expect(btn.disabled).toBe(true);
  });

  it('sets aria-disabled="true"', async () => {
    const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
    const btn = shadowQuery(el, 'button')!;
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('applies host opacity 0.5 via disabled attribute', async () => {
    const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
    expect(el.hasAttribute('disabled')).toBe(true);
  });
});
```

### 3. Events

Test custom events (dispatch, bubbles, composed, detail, disabled suppression).

**Tests to include:**

- Event fires on interaction (click, input, change, etc.)
- Event has correct properties (bubbles, composed)
- Event detail contains correct data
- Event does NOT fire when disabled

**Example:**

```typescript
describe('Events', () => {
  it('dispatches hx-click on click', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
    const eventPromise = oneEvent(el, 'hx-click');
    btn.click();
    const event = await eventPromise;
    expect(event).toBeTruthy();
  });

  it('hx-click bubbles and is composed', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.click();
    const event = await eventPromise;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('hx-click detail contains originalEvent', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.click();
    const event = await eventPromise;
    expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
  });

  it('does NOT dispatch hx-click when disabled', async () => {
    const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
    let fired = false;
    el.addEventListener('hx-click', () => {
      fired = true;
    });
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    expect(fired).toBe(false);
  });
});
```

### 4. Keyboard

Test keyboard interaction (Enter, Space, Escape, Arrow keys).

**Tests to include:**

- Enter activates buttons
- Space activates buttons/checkboxes
- Escape closes dialogs/modals
- Arrow keys navigate lists/radio groups

**Example:**

```typescript
describe('Keyboard', () => {
  it('Enter activates native button', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    btn.click();
    const event = await eventPromise;
    expect(event).toBeTruthy();
  });

  it('Space activates native button', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    btn.click();
    const event = await eventPromise;
    expect(event).toBeTruthy();
  });
});
```

### 5. Slots

Test slot content rendering (default slot, named slots, empty state).

**Tests to include:**

- Default slot renders text
- Default slot renders HTML
- Named slots render (prefix, suffix, help-text, etc.)

**Example:**

```typescript
describe('Slots', () => {
  it('default slot renders text', async () => {
    const el = await fixture<HxButton>('<hx-button>Hello World</hx-button>');
    expect(el.textContent?.trim()).toBe('Hello World');
  });

  it('default slot renders HTML', async () => {
    const el = await fixture<HxButton>('<hx-button><span class="icon">+</span> Add</hx-button>');
    const span = el.querySelector('span.icon');
    expect(span).toBeTruthy();
    expect(span?.textContent).toBe('+');
  });

  it('prefix slot renders', async () => {
    const el = await fixture<HxTextInput>(
      '<hx-text-input><span slot="prefix">@</span></hx-text-input>',
    );
    const prefix = el.querySelector('[slot="prefix"]');
    expect(prefix).toBeTruthy();
    expect(prefix?.textContent).toBe('@');
  });
});
```

### 6. Form

Test form-associated components (formAssociated, validation, reset, restore).

**Tests to include:**

- `formAssociated` static property is true
- `form` getter returns associated form
- `formResetCallback()` resets value
- `formStateRestoreCallback()` restores value
- Type="submit" triggers form submission
- Type="reset" triggers form reset

**Example:**

```typescript
describe('Form', () => {
  it('has formAssociated=true', () => {
    const ctor = customElements.get('hx-button') as unknown as { formAssociated: boolean };
    expect(ctor.formAssociated).toBe(true);
  });

  it('has ElementInternals attached', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    expect(el.form).toBe(null); // null when not inside a form
  });

  it('form getter returns associated form', async () => {
    const form = document.createElement('form');
    form.innerHTML = '<hx-text-input name="test"></hx-text-input>';
    document.getElementById('test-fixture-container')!.appendChild(form);
    const el = form.querySelector('hx-text-input') as HxTextInput;
    await el.updateComplete;
    expect(el.form).toBe(form);
  });

  it('formResetCallback resets value to empty', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input value="hello"></hx-text-input>');
    el.formResetCallback();
    await el.updateComplete;
    expect(el.value).toBe('');
  });

  it('formStateRestoreCallback restores value', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
    el.formStateRestoreCallback('restored');
    await el.updateComplete;
    expect(el.value).toBe('restored');
  });

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
    await new Promise((r) => setTimeout(r, 50));
    expect(submitted).toBe(true);
  });
});
```

### 7. Accessibility

Test ARIA attributes, focus management, and axe-core audits.

**Tests to include:**

- aria-label, aria-labelledby, aria-describedby
- aria-invalid when error present
- aria-required when required
- aria-disabled when disabled
- No axe violations for all states

**Example:**

```typescript
describe('Accessibility', () => {
  it('aria-describedby references error ID when error set', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input error="Bad input"></hx-text-input>');
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    const errorDiv = shadowQuery(el, '.field__error')!;
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain(errorDiv.id);
  });

  it('aria-describedby references help text ID when helpText set', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input help-text="Some help"></hx-text-input>');
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    const helpDiv = shadowQuery(el, '.field__help-text')!;
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain(helpDiv.id);
  });

  it('no aria-invalid when no error', async () => {
    const el = await fixture<HxCheckbox>('<hx-checkbox></hx-checkbox>');
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });
});

describe('Accessibility (axe-core)', () => {
  it('has no axe violations in default state', async () => {
    const el = await fixture<HxButton>('<hx-button>Click me</hx-button>');
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations when disabled', async () => {
    const el = await fixture<HxButton>('<hx-button disabled>Click me</hx-button>');
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations for all variants', async () => {
    for (const variant of ['primary', 'secondary', 'ghost']) {
      const el = await fixture<HxButton>(`<hx-button variant="${variant}">Click me</hx-button>`);
      const { violations } = await checkA11y(el);
      expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
      el.remove();
    }
  });
});
```

## Advanced Testing Patterns

### Testing Reactive Properties

Reactive properties trigger async updates. Always wait for `updateComplete`.

```typescript
describe('Property: value', () => {
  it('syncs value to native input', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input value="hello"></hx-text-input>');
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    expect(input.value).toBe('hello');
  });

  it('programmatic value update is reflected', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
    el.value = 'updated';
    await el.updateComplete; // Wait for Lit to process change
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    expect(input.value).toBe('updated');
  });
});
```

### Testing Methods

Public methods like `focus()`, `select()`, `checkValidity()`, `reportValidity()`.

```typescript
describe('Methods', () => {
  it('focus() moves focus to native input', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
    el.focus();
    await new Promise((r) => setTimeout(r, 50)); // Allow focus to settle
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    expect(el.shadowRoot?.activeElement).toBe(input);
  });

  it('select() selects text in native input', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input value="hello world"></hx-text-input>');
    el.focus();
    el.select();
    await new Promise((r) => setTimeout(r, 50));
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('hello world'.length);
  });
});
```

### Testing Validation

Test `checkValidity()`, `reportValidity()`, `validity`, and `validationMessage`.

```typescript
describe('Validation', () => {
  it('checkValidity returns false when required + empty', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input required></hx-text-input>');
    expect(el.checkValidity()).toBe(false);
  });

  it('checkValidity returns true when required + filled', async () => {
    const el = await fixture<HxTextInput>(
      '<hx-text-input required value="filled"></hx-text-input>',
    );
    expect(el.checkValidity()).toBe(true);
  });

  it('valueMissing validity flag is set when required + empty', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input required></hx-text-input>');
    expect(el.validity.valueMissing).toBe(true);
  });

  it('reportValidity returns false when required + empty', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input required></hx-text-input>');
    expect(el.reportValidity()).toBe(false);
  });

  it('validationMessage is set when required + empty', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input required></hx-text-input>');
    await el.updateComplete;
    expect(el.validationMessage).toBeTruthy();
  });
});
```

### Testing Error States

Error properties should render error message, set aria-invalid, and hide help text.

```typescript
describe('Property: error', () => {
  it('renders error message in role="alert" div', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input error="Required field"></hx-text-input>');
    const errorDiv = shadowQuery(el, '[role="alert"]');
    expect(errorDiv).toBeTruthy();
    expect(errorDiv?.textContent?.trim()).toBe('Required field');
  });

  it('error div has aria-live="polite"', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input error="Required"></hx-text-input>');
    const errorDiv = shadowQuery(el, '.field__error');
    expect(errorDiv?.getAttribute('aria-live')).toBe('polite');
  });

  it('sets aria-invalid="true" on input', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input error="Required"></hx-text-input>');
    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('error hides help text', async () => {
    const el = await fixture<HxTextInput>(
      '<hx-text-input error="Error" help-text="Help"></hx-text-input>',
    );
    const helpText = shadowQuery(el, '.field__help-text');
    expect(helpText).toBeNull();
  });
});
```

### Testing CSS Parts

Verify all CSS parts are exposed for theming.

```typescript
describe('CSS Parts', () => {
  it('label part exposed', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input label="Test"></hx-text-input>');
    const label = shadowQuery(el, '[part="label"]');
    expect(label).toBeTruthy();
  });

  it('input-wrapper part exposed', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
    const wrapper = shadowQuery(el, '[part="input-wrapper"]');
    expect(wrapper).toBeTruthy();
  });

  it('error part exposed when error set', async () => {
    const el = await fixture<HxCheckbox>('<hx-checkbox error="Error msg"></hx-checkbox>');
    const errorPart = shadowQuery(el, '[part="error"]');
    expect(errorPart).toBeTruthy();
  });
});
```

### Testing Indeterminate State (Checkboxes)

```typescript
describe('Property: indeterminate', () => {
  it('applies indeterminate class when set', async () => {
    const el = await fixture<HxCheckbox>('<hx-checkbox></hx-checkbox>');
    el.indeterminate = true;
    await el.updateComplete;
    const container = shadowQuery(el, '.checkbox');
    expect(container?.classList.contains('checkbox--indeterminate')).toBe(true);
  });

  it('clears indeterminate on toggle', async () => {
    const el = await fixture<HxCheckbox>('<hx-checkbox></hx-checkbox>');
    el.indeterminate = true;
    await el.updateComplete;
    const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;
    control.click();
    await el.updateComplete;
    expect(el.indeterminate).toBe(false);
  });
});
```

## Test Coverage Requirements

**Minimum 80% coverage enforced in CI.** Coverage report generated after every test run.

### Running Coverage

```bash
# Run tests with coverage
npm run test:library

# Coverage output appears in terminal:
# ✓ src/components/hx-button/hx-button.ts (95.12%)
# ✓ src/components/hx-text-input/hx-text-input.ts (88.43%)
```

### What Counts Toward Coverage

**Included:**

- Component class files (`hx-button.ts`, `hx-text-input.ts`)
- Public methods and properties
- Event handlers
- Lifecycle methods
- Validation logic

**Excluded:**

- Test files (`*.test.ts`)
- Story files (`*.stories.ts`)
- Style files (`*.styles.ts`)
- Index re-exports (`index.ts`)

### Improving Coverage

**Low coverage usually means:**

1. Missing event tests (click, input, change, focus)
2. Missing conditional branches (if/else, ternaries)
3. Missing error state tests
4. Missing keyboard interaction tests
5. Missing validation tests

**Example: Branch coverage**

```typescript
// This conditional has 2 branches
if (this.disabled) {
  return; // Branch 1: disabled
}
this.dispatchEvent(new CustomEvent('hx-click')); // Branch 2: enabled

// Tests needed:
it('does NOT dispatch hx-click when disabled', async () => {
  // Tests Branch 1
});

it('dispatches hx-click when enabled', async () => {
  // Tests Branch 2
});
```

## Mocking and Stubbing

### Mocking Form Submission

```typescript
it('calls form.requestSubmit on type=submit click', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<hx-button type="submit">Submit</hx-button>';
  document.getElementById('test-fixture-container')!.appendChild(form);
  const el = form.querySelector('hx-button') as HxButton;
  await el.updateComplete;

  let submitted = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent actual submission
    submitted = true;
  });

  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  btn.click();
  await new Promise((r) => setTimeout(r, 50)); // Allow event to propagate
  expect(submitted).toBe(true);
});
```

### Mocking Timers (Advanced)

If a component uses `setTimeout` or `setInterval`, consider using Vitest's fake timers:

```typescript
import { vi } from 'vitest';

it('updates after delay', async () => {
  vi.useFakeTimers();
  const el = await fixture<HxToast>('<hx-toast duration="3000">Message</hx-toast>');

  expect(el.visible).toBe(true);

  vi.advanceTimersByTime(3000);
  await el.updateComplete;

  expect(el.visible).toBe(false);
  vi.useRealTimers();
});
```

### Mocking Observers (ResizeObserver, IntersectionObserver)

```typescript
it('responds to intersection', async () => {
  // Mock IntersectionObserver
  const mockObserve = vi.fn();
  const mockDisconnect = vi.fn();

  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
  })) as unknown as typeof IntersectionObserver;

  const el = await fixture<HxLazyImage>('<hx-lazy-image src="/image.jpg"></hx-lazy-image>');

  expect(mockObserve).toHaveBeenCalled();

  el.remove();
  expect(mockDisconnect).toHaveBeenCalled();
});
```

## Common Pitfalls

### Pitfall 1: Not Waiting for updateComplete

```typescript
// ❌ BAD: Reads DOM before update completes
it('programmatic value update is reflected', async () => {
  const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
  el.value = 'updated';
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;
  expect(input.value).toBe('updated'); // FAILS! DOM not updated yet
});

// ✅ GOOD: Wait for update
it('programmatic value update is reflected', async () => {
  const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
  el.value = 'updated';
  await el.updateComplete; // Wait for Lit to process change
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;
  expect(input.value).toBe('updated'); // PASSES
});
```

### Pitfall 2: Not Using cleanup()

```typescript
// ❌ BAD: No cleanup
import { describe, it, expect } from 'vitest';
import { fixture, shadowQuery, oneEvent } from '../../test-utils.js';

describe('hx-button', () => {
  it('test 1', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    // Test logic...
  });

  it('test 2', async () => {
    // Element from test 1 still in DOM! Can cause interference
  });
});

// ✅ GOOD: Always cleanup
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup } from '../../test-utils.js';

afterEach(cleanup);

describe('hx-button', () => {
  // Tests are isolated
});
```

### Pitfall 3: Timing-Dependent Assertions

```typescript
// ❌ BAD: Race condition
it('dispatches hx-click on click', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

  let eventFired = false;
  el.addEventListener('hx-click', () => {
    eventFired = true;
  });

  btn.click();
  expect(eventFired).toBe(true); // FLAKY! Event may not have fired yet
});

// ✅ GOOD: Use oneEvent()
it('dispatches hx-click on click', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent(el, 'hx-click');
  btn.click();
  const event = await eventPromise; // Wait for event
  expect(event).toBeTruthy(); // RELIABLE
});
```

### Pitfall 4: Querying Light DOM Instead of Shadow DOM

```typescript
// ❌ BAD: Querying light DOM
it('renders button', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = el.querySelector('button'); // null! Button is in shadow DOM
  expect(btn).toBeTruthy(); // FAILS
});

// ✅ GOOD: Use shadowQuery
it('renders button', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery(el, 'button'); // Correct!
  expect(btn).toBeTruthy(); // PASSES
});
```

### Pitfall 5: Not Testing Disabled State Event Suppression

Every interactive component must test that events do NOT fire when disabled.

```typescript
// ✅ Required test
it('does NOT dispatch hx-click when disabled', async () => {
  const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  let fired = false;
  el.addEventListener('hx-click', () => {
    fired = true;
  });
  btn.click();
  await new Promise((r) => setTimeout(r, 50)); // Allow event propagation
  expect(fired).toBe(false);
});
```

## Real-World Test Examples

### Complete hx-button.test.ts Structure

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-button', () => {
  describe('Rendering', () => {
    // 5 tests: shadow DOM, CSS parts, native button, default classes
  });

  describe('Property: variant', () => {
    // 3 tests: reflection, class application for each variant
  });

  describe('Property: size', () => {
    // 3 tests: class application for sm, md, lg
  });

  describe('Property: disabled', () => {
    // 4 tests: native disabled, aria-disabled, host attribute, opacity
  });

  describe('Property: type', () => {
    // 3 tests: default button, submit, reset
  });

  describe('Events', () => {
    // 4 tests: dispatch, bubbles/composed, detail, disabled suppression
  });

  describe('Keyboard', () => {
    // 2 tests: Enter, Space
  });

  describe('Slots', () => {
    // 2 tests: text, HTML
  });

  describe('Form', () => {
    // 4 tests: formAssociated, ElementInternals, submit, reset
  });

  describe('Accessibility (axe-core)', () => {
    // 3 tests: default, disabled, all variants
  });
});
```

### Complete hx-text-input.test.ts Structure

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxTextInput } from './hx-text-input.js';
import './index.js';

afterEach(cleanup);

describe('hx-text-input', () => {
  describe('Rendering', () => {
    // 4 tests: shadow DOM, native input, CSS parts
  });

  describe('Property: label', () => {
    // 3 tests: renders, empty state, required asterisk
  });

  describe('Property: placeholder', () => {
    // 1 test: sets placeholder attr
  });

  describe('Property: value', () => {
    // 2 tests: initial value, programmatic update
  });

  describe('Property: type', () => {
    // 4 tests: text, email, password, number
  });

  describe('Property: required', () => {
    // 2 tests: native required, aria-required
  });

  describe('Property: disabled', () => {
    // 2 tests: native disabled, host attribute
  });

  describe('Property: error', () => {
    // 4 tests: renders alert, aria-live, aria-invalid, hides help
  });

  describe('Property: helpText', () => {
    // 2 tests: renders, hidden when error
  });

  describe('Events', () => {
    // 4 tests: hx-input, detail.value, hx-change, bubbles/composed
  });

  describe('Slots', () => {
    // 3 tests: prefix, suffix, help-text
  });

  describe('CSS Parts', () => {
    // 2 tests: label, input-wrapper
  });

  describe('Form', () => {
    // 5 tests: formAssociated, form getter, reset, restore
  });

  describe('Validation', () => {
    // 6 tests: checkValidity, validity flags, reportValidity, validationMessage
  });

  describe('Methods', () => {
    // 2 tests: focus(), select()
  });

  describe('aria-describedby', () => {
    // 2 tests: references error ID, references help ID
  });

  describe('Accessibility (axe-core)', () => {
    // 4 tests: default, error, disabled, required
  });
});
```

## Running Tests

### Run All Tests

```bash
npm run test:library
```

### Run Tests in Watch Mode

```bash
npm run test:library -- --watch
```

### Run Tests for Specific Component

```bash
npm run test:library -- hx-button
```

### Run Tests in UI Mode (Debug)

```bash
npm run test:library -- --ui
```

Opens Vitest UI in browser for interactive debugging.

### Run Tests with Coverage

```bash
npm run test:library -- --coverage
```

## Summary

Writing tests for hx-library components requires discipline and attention to detail. Follow these rules:

1. **Always use `afterEach(cleanup)`** — Prevents test pollution
2. **Use test utilities** — `fixture()`, `shadowQuery()`, `oneEvent()`, `checkA11y()`
3. **Wait for async updates** — `await el.updateComplete` after property changes
4. **Test all categories** — Rendering, properties, events, keyboard, slots, form, accessibility
5. **No timing dependencies** — Use `oneEvent()` for events, not manual listeners
6. **80% coverage minimum** — Enforced in CI
7. **Test disabled state** — Events must NOT fire when disabled
8. **Test accessibility** — Every component needs axe-core tests

**Golden rule:** If it's a public API (property, method, event, slot, CSS part), it must have a test.

## References

- [Vitest Browser Mode](https://vitest.dev/guide/browser.html)
- [Playwright for Testing](https://playwright.dev/)
- [axe-core Accessibility Testing](https://github.com/dequelabs/axe-core)
- [Web Component Testing Best Practices](https://open-wc.org/docs/testing/testing-package/)
- [Lit Testing Documentation](https://lit.dev/docs/v3/tools/testing/)
