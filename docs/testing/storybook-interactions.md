# Storybook Interaction Testing — HELiX

This document covers patterns for writing `play` functions in HELiX Storybook stories.
All interactive component stories must include play functions that exercise user interactions.

## Technology

HELiX uses **Storybook 10.x** with the `@storybook/addon-vitest` integration. Stories run as
first-class Vitest browser mode tests using Playwright Chromium — no separate test runner needed.

### Running Tests

```bash
# From the monorepo root
pnpm run test:storybook

# From the storybook workspace (apps/storybook)
pnpm exec vitest run
```

### CI Integration

Storybook interaction tests run on every PR via the `storybook-tests` GitHub Actions job.
Results are uploaded as test artifacts.

---

## Import Pattern

```typescript
import { expect, userEvent, fn, within } from 'storybook/test';
```

Note: The import path is `storybook/test` (not `@storybook/test`). This is the Storybook 10.x
canonical import path.

---

## Play Function Anatomy

```typescript
export const MyStory: Story = {
  args: {
    label: 'Click me',
  },
  play: async ({ canvasElement, args }) => {
    // canvasElement is the story's root DOM element
    // args contains the story's current arg values

    // Step 1: pierce shadow DOM to find the native element
    const host = canvasElement.querySelector('hx-button') as HTMLElement;
    const button = host.shadowRoot!.querySelector('button') as HTMLButtonElement;

    // Step 2: interact using userEvent (simulates real user input)
    await userEvent.click(button);

    // Step 3: assert the outcome
    expect(args.onClick).toHaveBeenCalledOnce();
  },
};
```

---

## Shadow DOM Traversal

HELiX components use Shadow DOM. Play functions must pierce the shadow root to access
internal elements. Direct `within()` queries do not cross shadow boundaries.

### Pattern: Custom element → shadow root → internal element

```typescript
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('hx-text-input') as HTMLElement;
  const input = host.shadowRoot!.querySelector('input') as HTMLInputElement;

  await userEvent.type(input, 'hello');
  expect(input.value).toBe('hello');
},
```

### Reusable helper (for form inputs)

```typescript
function getNativeInput(host: HTMLElement): HTMLInputElement {
  return host.shadowRoot!.querySelector('input') as HTMLInputElement;
}
```

---

## Common Patterns by Component Type

### Button / Action Components

Tests to include:
- Click fires the correct event
- Disabled button does not fire on click
- Loading state prevents interaction
- Keyboard activation (Enter, Space)

```typescript
play: async ({ canvasElement, args }) => {
  const host = canvasElement.querySelector('hx-button') as HTMLElement;
  const button = host.shadowRoot!.querySelector('button') as HTMLButtonElement;

  // Test click
  await userEvent.click(button);
  expect(args.onClick).toHaveBeenCalledOnce();

  // Test keyboard
  button.focus();
  await userEvent.keyboard('{Enter}');
  expect(args.onClick).toHaveBeenCalledTimes(2);
},
```

### Form Input Components

Tests to include:
- Type text → fires `hx-input` event with value
- Focus/blur → fires `hx-focus`/`hx-blur`
- Disabled state → no interaction
- Error state → error message visible
- Label click → focuses native input

```typescript
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('hx-text-input') as HTMLElement;
  const input = host.shadowRoot!.querySelector('input') as HTMLInputElement;

  // Verify initial state
  expect(input.value).toBe('');

  // Type and verify
  await userEvent.type(input, 'test value');
  expect(input.value).toBe('test value');

  // Verify hx-input event fired
  // (events are verified via fn() spies on args)
},
```

### Select / Dropdown Components

Tests to include:
- Open trigger opens options
- Option selection updates value and fires event
- Escape closes without selection
- Arrow key navigation between options
- Disabled option is skipped

```typescript
play: async ({ canvasElement, args }) => {
  const host = canvasElement.querySelector('hx-select') as HTMLElement;
  const trigger = host.shadowRoot!.querySelector('[role="combobox"]') as HTMLElement;

  // Open
  await userEvent.click(trigger);

  // Navigate with arrow keys
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');

  expect(args['onHx-change']).toHaveBeenCalled();
},
```

### Overlay Components (Dialog, Drawer, Popover)

Tests to include:
- Trigger opens overlay
- Close button closes overlay
- Escape key closes overlay
- Focus trap: Tab stays within overlay
- Focus returns to trigger on close

```typescript
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('hx-dialog') as HTMLElement;

  // Open the dialog
  const trigger = canvasElement.querySelector('[data-trigger]') as HTMLElement;
  await userEvent.click(trigger);

  // Verify dialog is open
  expect(host.getAttribute('open')).not.toBeNull();

  // Close with Escape
  await userEvent.keyboard('{Escape}');
  expect(host.getAttribute('open')).toBeNull();
},
```

### Navigation Components (Tabs, Accordion)

Tests to include:
- Click tab/header activates correct panel
- Arrow keys navigate between tabs
- Expanded/collapsed state toggling

```typescript
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('hx-tabs') as HTMLElement;
  const tabs = host.shadowRoot!.querySelectorAll('[role="tab"]');

  // Click second tab
  await userEvent.click(tabs[1] as HTMLElement);

  // Verify activation
  expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  expect(tabs[0].getAttribute('aria-selected')).toBe('false');

  // Keyboard navigation
  (tabs[0] as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(tabs[1]);
},
```

---

## Event Verification with fn()

Use `fn()` from `storybook/test` to create spy functions for event handler args:

```typescript
const meta: Meta = {
  component: 'hx-button',
  args: {
    // Attach a spy to the click handler
    onClick: fn(),
  },
};

export const Clicked: Story = {
  play: async ({ canvasElement, args }) => {
    const button = canvasElement.querySelector('hx-button')!
      .shadowRoot!.querySelector('button')!;

    await userEvent.click(button);

    expect(args.onClick).toHaveBeenCalledOnce();
    expect(args.onClick).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'click' }),
    );
  },
};
```

For custom `hx-*` events, listen via `addEventListener` before triggering:

```typescript
play: async ({ canvasElement }) => {
  const host = canvasElement.querySelector('hx-text-input') as HTMLElement;
  const events: CustomEvent[] = [];
  host.addEventListener('hx-input', (e) => events.push(e as CustomEvent));

  const input = host.shadowRoot!.querySelector('input') as HTMLInputElement;
  await userEvent.type(input, 'hello');

  expect(events.length).toBeGreaterThan(0);
  expect(events.at(-1)!.detail.value).toBe('hello');
},
```

---

## Accessibility Testing

The `@storybook/addon-a11y` addon automatically runs axe-core checks on every story
render in the Storybook UI. Configuration lives in `.storybook/preview.ts`:

```typescript
parameters: {
  a11y: {
    config: {
      rules: [
        { id: 'color-contrast', enabled: true },
      ],
    },
  },
},
```

For documenting known exceptions (e.g., contrast in intentional disabled states):

```typescript
export const DisabledState: Story = {
  args: { disabled: true },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            // Disabled buttons have reduced contrast by design (WCAG 1.4.3 exception)
            // See: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
            id: 'color-contrast',
            enabled: false,
          },
        ],
      },
    },
  },
};
```

---

## Coverage Audit

Run the story coverage audit to see which components have complete interaction test coverage:

```bash
pnpm run audit:story-coverage
```

This generates `docs/stories-coverage.md` with a full breakdown of story and play function counts.

---

## Counting Tests

To count the total interaction tests (play functions) across all stories:

```bash
grep -r '^\s*play:' packages/hx-library/src/components --include='*.stories.ts' | wc -l
```
