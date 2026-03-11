---
title: Storybook Interaction Tests
description: Writing automated interaction tests in Storybook stories using the @storybook/test API.
---

Storybook interaction tests run inside a real browser, operate on rendered component HTML, and use the same `@storybook/test` utilities that ship with Storybook 10. They live in the `play()` function of a story and execute automatically when Storybook renders that story. They can be run in CI via `storybook test --ci`.

Interaction tests bridge the gap between unit tests (which test component logic in isolation) and end-to-end tests (which test the full application stack). They verify that a component behaves correctly when a user interacts with it — typing text, clicking buttons, tabbing between fields.

## The play() Function

The `play()` function is an async function attached to a story export. Storybook runs it automatically after the story renders. If `play()` throws or an assertion fails, the story shows a red indicator in the sidebar and in the Interactions panel.

```typescript
// packages/hx-library/src/components/hx-text-input/hx-text-input.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './hx-text-input.js';

const meta = {
  title: 'Components/Text Input',
  component: 'hx-text-input',
  tags: ['autodocs'],
  // ...
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    label: 'Patient Name',
    placeholder: 'Enter patient full name',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    await expect(host).toBeTruthy();

    const input = host.shadowRoot!.querySelector('input')!;
    await userEvent.type(input, 'Jane Doe');
    await expect(input.value).toBe('Jane Doe');
  },
};
```

`canvasElement` is the DOM element that Storybook renders your story into. It is the starting point for all queries.

## Imports from storybook/test

HELIX stories import test utilities from `storybook/test` (the Storybook 10.x barrel that re-exports everything):

```typescript
import { expect, within, userEvent, waitFor, fn } from 'storybook/test';
```

| Export      | Purpose                                             |
| ----------- | --------------------------------------------------- |
| `expect`    | Assertion library (Vitest-compatible)               |
| `userEvent` | Simulate user interactions (type, click, tab)       |
| `within`    | Scope queries to a DOM subtree                      |
| `waitFor`   | Wait for assertions to become true (polling)        |
| `fn`        | Create Storybook spy functions (replaces `vi.fn()`) |

Do not import from `@storybook/test`. The `storybook/test` barrel is the correct import path for Storybook 10.

## canvasElement and within()

`canvasElement` is the full Storybook canvas. For most stories, `canvasElement` contains your component directly. Use `within()` to scope queries to a DOM subtree:

```typescript
play: async ({ canvasElement }) => {
  // Query the whole canvas — fine for simple stories
  const button = canvasElement.querySelector('hx-button');

  // Scope queries to a subtree with within()
  const canvas = within(canvasElement);
  const label = canvas.getByText('Patient Name');
  await expect(label).toBeTruthy();
},
```

### Querying Inside Shadow DOM with within()

`within()` uses Testing Library's DOM queries. To query inside a component's shadow root, pass the shadow root to `within()`:

```typescript
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('hx-text-input')!;

  // Create a within() scope over the shadow root
  const shadow = within(host.shadowRoot! as unknown as HTMLElement);

  // Query elements inside shadow DOM by text
  const label = shadow.getByText('Patient Name');
  await expect(label).toBeTruthy();
},
```

The `as unknown as HTMLElement` cast is required because `ShadowRoot` is not a `HTMLElement`, but the underlying DOM is compatible.

### Helper: getNativeInput

Shadow DOM querying is verbose. Extract a helper function at the top of your story file for elements you query frequently:

```typescript
// Defined once at the top of the stories file
function getNativeInput(canvasElement: HTMLElement): HTMLInputElement {
  const host = canvasElement.querySelector('hx-text-input');
  if (!host || !host.shadowRoot) {
    throw new Error('hx-text-input not found or shadowRoot unavailable');
  }
  const input = host.shadowRoot.querySelector('input');
  if (!input) {
    throw new Error('Native <input> not found inside hx-text-input shadow DOM');
  }
  return input;
}

// Used in every play() function that needs the native input
export const TypeAndVerify: Story = {
  args: { label: 'Diagnosis Code', placeholder: 'Enter ICD-10 code' },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'J06.9');
    await expect(input.value).toBe('J06.9');
  },
};
```

## Simulating Clicks

```typescript
play: async ({ canvasElement }) => {
  const button = canvasElement.querySelector('hx-button')!;

  // Click the host element (delegates to shadow DOM)
  await userEvent.click(button);

  // Click the native button inside shadow DOM
  const nativeBtn = button.shadowRoot!.querySelector('button')!;
  await userEvent.click(nativeBtn);
},
```

`userEvent.click()` fires real browser events: `pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`. This is more realistic than calling `.click()` directly.

## Simulating Keyboard Input

`userEvent.type()` types a string character-by-character, firing `keydown`, `keypress`, `input`, and `keyup` for each character. This means every keystroke triggers `hx-input` on `hx-text-input`:

```typescript
export const TypeAndVerify: Story = {
  args: { label: 'Diagnosis Code', placeholder: 'Enter ICD-10 code' },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);

    // Types 5 characters, firing hx-input 5 times
    await userEvent.type(input, 'J06.9');
    await expect(input.value).toBe('J06.9');

    // Also verify the component's value property updated
    const host = canvasElement.querySelector('hx-text-input')!;
    await expect(host.value).toBe('J06.9');
  },
};
```

### Clearing and Retyping

Use `userEvent.clear()` to empty a field before typing new content:

```typescript
export const ClearAndRetype: Story = {
  args: { label: 'Patient ID', value: 'OLD-VALUE' },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);

    // Verify initial value
    await expect(input.value).toBe('OLD-VALUE');

    // Clear then type new value
    await userEvent.clear(input);
    await expect(input.value).toBe('');

    await userEvent.type(input, 'PAT-2026-00999');
    await expect(input.value).toBe('PAT-2026-00999');
  },
};
```

### Special Keys

`userEvent.keyboard()` sends key sequences without typing into an input:

```typescript
// Press Escape
await userEvent.keyboard('{Escape}');

// Press Ctrl+A (select all)
await userEvent.keyboard('{Control>}a{/Control}');

// Press Enter
await userEvent.keyboard('{Enter}');
```

## Simulating Focus and Tab Navigation

`userEvent.tab()` moves focus to the next focusable element, exactly as pressing Tab in the browser:

```typescript
export const KeyboardNavigation: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;">
      <hx-text-input label="First Field" name="first"></hx-text-input>
      <hx-text-input label="Second Field" name="second"></hx-text-input>
      <hx-text-input label="Third Field" name="third"></hx-text-input>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const inputs = canvasElement.querySelectorAll('hx-text-input');
    const firstInput = inputs[0]!.shadowRoot!.querySelector('input')!;
    const secondInput = inputs[1]!.shadowRoot!.querySelector('input')!;

    // Focus first input
    firstInput.focus();
    await expect(inputs[0]!.shadowRoot!.activeElement).toBe(firstInput);

    // Type into first field
    await userEvent.type(firstInput, 'Cardiology');
    await expect(firstInput.value).toBe('Cardiology');

    // Tab to second field
    await userEvent.tab();
    await expect(inputs[1]!.shadowRoot!.activeElement).toBe(secondInput);

    // Type into second field
    await userEvent.type(secondInput, 'Ward 4B');
    await expect(secondInput.value).toBe('Ward 4B');
  },
};
```

Note: `userEvent.tab()` moves focus from the current `document.activeElement`. For shadow DOM focus, the host element is the `document.activeElement` and the internal element is `shadowRoot.activeElement`.

## Testing Component Behavior, Not Just Visual

The power of `play()` is that it runs in the same browsing context as the rendered story. You can attach event listeners, verify component state, and test behavior that cannot be captured in a screenshot.

### Verifying Event Firing and Detail

Attach an event listener before interacting, then assert it was called with the correct data:

```typescript
export const EventVerification: Story = {
  args: { label: 'Medication Name', name: 'medication' },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = getNativeInput(canvasElement);

    let inputEventCount = 0;
    let changeEventFired = false;
    let lastInputDetail = '';
    let changeDetail = '';

    host.addEventListener('hx-input', ((e: CustomEvent<{ value: string }>) => {
      inputEventCount++;
      lastInputDetail = e.detail.value;
    }) as EventListener);

    host.addEventListener('hx-change', ((e: CustomEvent<{ value: string }>) => {
      changeEventFired = true;
      changeDetail = e.detail.value;
    }) as EventListener);

    // Type each character — hx-input fires once per character
    await userEvent.type(input, 'Aspirin');
    await expect(inputEventCount).toBe(7); // 'A','s','p','i','r','i','n'
    await expect(lastInputDetail).toBe('Aspirin');

    // Tab away to trigger hx-change (fires on blur after value change)
    await userEvent.tab();
    await expect(changeEventFired).toBe(true);
    await expect(changeDetail).toBe('Aspirin');
  },
};
```

### Verifying Disabled Input Does Not Accept Interaction

```typescript
export const DisabledNoInput: Story = {
  args: { label: 'Locked Field', value: 'Original Value', disabled: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = host.shadowRoot!.querySelector('input')!;

    // Verify the input is disabled at the DOM level
    await expect(input.disabled).toBe(true);

    // Value must remain unchanged
    await expect(input.value).toBe('Original Value');
    await expect(host.value).toBe('Original Value');
  },
};
```

## Testing Forms with userEvent.type()

For stories that include a `<form>`, test the full submission cycle. Use `fn()` to capture and inspect submitted data:

```typescript
import { fn } from 'storybook/test';

export const FormDataParticipation: Story = {
  render: () => {
    const onSubmit = fn();

    return html`
      <form
        id="test-form"
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const fd = new FormData(e.target as HTMLFormElement);
          onSubmit(Object.fromEntries(fd.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-text-input label="Patient Name" name="patientName"></hx-text-input>
        <hx-text-input label="MRN" name="mrn"></hx-text-input>
        <button type="submit">Submit</button>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const inputs = canvasElement.querySelectorAll('hx-text-input');
    const nameInput = inputs[0]!.shadowRoot!.querySelector('input')!;
    const mrnInput = inputs[1]!.shadowRoot!.querySelector('input')!;

    // Fill in both fields
    await userEvent.type(nameInput, 'Jane Doe');
    await userEvent.type(mrnInput, 'PAT-2026-00482');

    // Verify the component values are correct
    await expect(inputs[0]!.value).toBe('Jane Doe');
    await expect(inputs[1]!.value).toBe('PAT-2026-00482');

    // Submit the form
    const submitButton = canvasElement.querySelector('button[type="submit"]')!;
    await userEvent.click(submitButton);
  },
};
```

## Testing Accessibility with storybook-addon-a11y

The `@storybook/addon-a11y` addon runs axe-core against every story automatically when installed. It shows the violations panel in the Storybook UI and can block CI if violations are found.

Interaction tests can also trigger programmatic accessibility checks using the `checkA11y()` helper from `@helixui/library/test-utils`. However, within a `play()` function, you can use the `storybook/test` `expect` to assert on aria attributes directly:

```typescript
export const AccessibilityVerification: Story = {
  args: { label: 'Email Address', required: true },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = host.shadowRoot!.querySelector('input')!;

    // Verify required fields have aria-required
    await expect(input.getAttribute('aria-required')).toBe('true');

    // Verify input has an accessible label via aria-labelledby or aria-label
    const hasLabel =
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      input.labels?.length > 0;
    await expect(hasLabel).toBeTruthy();
  },
};

export const ErrorStateAccessibility: Story = {
  args: { label: 'Email', error: 'Please enter a valid email address.' },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = host.shadowRoot!.querySelector('input')!;
    const errorDiv = host.shadowRoot!.querySelector('.field__error')!;

    // aria-invalid must be true in error state
    await expect(input.getAttribute('aria-invalid')).toBe('true');

    // aria-describedby must reference the error element
    const describedBy = input.getAttribute('aria-describedby');
    await expect(describedBy).toContain(errorDiv.id);

    // Error element must have role="alert"
    await expect(errorDiv.getAttribute('role')).toBe('alert');
  },
};
```

## waitFor: Polling for Async State

`waitFor()` retries an assertion until it passes or a timeout is reached. Use it when you need to wait for async side effects:

```typescript
import { waitFor } from 'storybook/test';

export const AsyncValidation: Story = {
  render: () => html` <hx-text-input label="Username" name="username"></hx-text-input> `,
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    const host = canvasElement.querySelector('hx-text-input')!;

    await userEvent.type(input, 'admin');

    // waitFor polls until the condition passes (or 1000ms timeout)
    await waitFor(
      () => {
        expect(host.value).toBe('admin');
      },
      { timeout: 1000, interval: 50 },
    );
  },
};
```

## Running Interaction Tests in CI

Storybook 10 ships with a test runner that executes `play()` functions in CI:

```bash
# Build Storybook first
npm run build:storybook

# Serve the built Storybook on port 3151
npx serve storybook-static --port 3151 &

# Wait for the server to be ready
npx wait-on http://localhost:3151 --timeout 60000

# Run all interaction tests
npx storybook test --ci --url http://localhost:3151

# Run tests for a specific component
npx storybook test --ci --url http://localhost:3151 --testNamePattern "hx-text-input"
```

The `--ci` flag:

- Disables the interactive watch mode
- Exits with a non-zero code if any test fails
- Disables coverage reporting (too slow for CI)

In GitHub Actions:

```yaml
- name: Build Storybook
  run: npm run build:storybook

- name: Serve Storybook
  run: npx serve storybook-static --port 3151 &

- name: Wait for Storybook
  run: npx wait-on http://localhost:3151 --timeout 60000

- name: Run Storybook Interaction Tests
  run: npx storybook test --ci --url http://localhost:3151
```

## Interaction Tests vs Vitest Unit Tests

Both test in a real browser, but they serve different purposes.

**Use interaction tests (play()) when:**

- You want to test realistic user flows (type → tab → submit)
- You want the test to be visible and exploratory in the Storybook UI
- You are testing a story's documented behavior (this story should work like this)
- You need to verify behavior that requires the full story rendering context

**Use Vitest unit tests when:**

- You need isolated, fast tests without Storybook overhead
- You need to test edge cases not represented in stories (invalid props, boundary values)
- You need to test internal DOM structure (shadow DOM queries, CSS part existence)
- You need precise control over timing and async behavior
- You need to verify that events do NOT fire

| Concern                       | Vitest                  | Storybook play()          |
| ----------------------------- | ----------------------- | ------------------------- |
| Event dispatch and payload    | Best choice             | Possible                  |
| Shadow DOM structure          | Best choice             | Awkward                   |
| Constraint validation API     | Best choice             | Possible                  |
| User interaction flows        | Possible                | Best choice               |
| Visual regression             | Not possible            | Not primary purpose       |
| Accessibility (axe-core)      | Both `checkA11y()`      | ARIA attribute assertions |
| Form submission cycle         | Both                    | Good for end-to-end demos |
| Disabled state blocking input | Vitest (timing control) | Possible                  |

The key distinction: Vitest gives you precise programmatic control, while `play()` gives you realistic user simulation in the context of a living story.

## Complete Example: hx-text-input Story with Interaction Test

This is the full `TypeAndVerify` story from `hx-text-input.stories.ts`, which demonstrates the primary interaction pattern:

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './hx-text-input.js';

const meta = {
  title: 'Components/Text Input',
  component: 'hx-text-input',
  tags: ['autodocs'],
  args: {
    label: 'Patient Name',
    placeholder: 'Enter patient full name',
    value: '',
    type: 'text',
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    name: '',
  },
  render: (args) => html`
    <hx-text-input
      label=${args.label}
      placeholder=${args.placeholder}
      value=${args.value}
      type=${args.type}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      name=${args.name}
    ></hx-text-input>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─── Helper: shadow DOM access ───────────────────────────────────
function getNativeInput(canvasElement: HTMLElement): HTMLInputElement {
  const host = canvasElement.querySelector('hx-text-input');
  if (!host || !host.shadowRoot) {
    throw new Error('hx-text-input not found or shadowRoot unavailable');
  }
  const input = host.shadowRoot.querySelector('input');
  if (!input) {
    throw new Error('Native <input> not found inside hx-text-input shadow DOM');
  }
  return input;
}

// ─── Default Story with Interaction Test ─────────────────────────
export const Default: Story = {
  args: {
    label: 'Patient Name',
    placeholder: 'Enter patient full name',
  },
  play: async ({ canvasElement }) => {
    // 1. Verify the component rendered
    const host = canvasElement.querySelector('hx-text-input')!;
    await expect(host).toBeTruthy();

    // 2. Verify the label text is present inside shadow DOM
    const shadow = within(host.shadowRoot! as unknown as HTMLElement);
    const label = shadow.getByText('Patient Name');
    await expect(label).toBeTruthy();

    // 3. Type into the input
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'Jane Doe');

    // 4. Verify the native input value
    await expect(input.value).toBe('Jane Doe');

    // 5. Verify the component property updated via ElementInternals
    await expect(host.value).toBe('Jane Doe');
  },
};

// ─── Full Event Verification Story ──────────────────────────────
export const EventVerification: Story = {
  args: {
    label: 'Medication Name',
    placeholder: 'Enter medication',
    name: 'medication',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = getNativeInput(canvasElement);

    let inputEventCount = 0;
    let changeEventFired = false;
    let lastInputDetail = '';
    let changeDetail = '';

    host.addEventListener('hx-input', ((e: CustomEvent<{ value: string }>) => {
      inputEventCount++;
      lastInputDetail = e.detail.value;
    }) as EventListener);

    host.addEventListener('hx-change', ((e: CustomEvent<{ value: string }>) => {
      changeEventFired = true;
      changeDetail = e.detail.value;
    }) as EventListener);

    // Type 7 characters — hx-input fires once per character
    await userEvent.type(input, 'Aspirin');
    await expect(inputEventCount).toBe(7);
    await expect(lastInputDetail).toBe('Aspirin');

    // Tab away to trigger hx-change (fires on blur)
    await userEvent.tab();
    await expect(changeEventFired).toBe(true);
    await expect(changeDetail).toBe('Aspirin');
  },
};

// ─── Focus Management Story ──────────────────────────────────────
export const FocusManagement: Story = {
  args: {
    label: 'Focusable Input',
    placeholder: 'Programmatic focus test',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = host.shadowRoot!.querySelector('input')!;

    // Call the component's public focus() method
    host.focus();

    // Verify focus landed on the native input inside shadow DOM
    await expect(host.shadowRoot!.activeElement).toBe(input);

    // Type while focused
    await userEvent.type(input, 'Focused');
    await expect(input.value).toBe('Focused');
  },
};
```

## Summary

| Task                             | API                                                   |
| -------------------------------- | ----------------------------------------------------- |
| Query inside story canvas        | `within(canvasElement)`                               |
| Query inside shadow DOM          | `within(host.shadowRoot! as unknown as HTMLElement)`  |
| Click an element                 | `await userEvent.click(element)`                      |
| Type text character by character | `await userEvent.type(input, 'text')`                 |
| Clear an input                   | `await userEvent.clear(input)`                        |
| Press Tab                        | `await userEvent.tab()`                               |
| Press keyboard shortcut          | `await userEvent.keyboard('{Control>}a{/Control}')`   |
| Assert a value                   | `await expect(value).toBe('expected')`                |
| Wait for async state             | `await waitFor(() => expect(...).toBe(...))`          |
| Create a spy                     | `const handler = fn()`                                |
| Run tests in CI                  | `npx storybook test --ci --url http://localhost:3151` |

---

**Related:**

- [Visual Regression Testing](/components/testing/visual-regression) — Playwright screenshot comparison against Storybook stories
- [Testing Events](/components/testing/event-testing) — Vitest unit testing for event dispatch and payloads
- [Storybook Documentation](/components/documentation/storybook) — Story structure, argTypes, and controls configuration
