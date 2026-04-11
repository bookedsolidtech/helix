# Shadow DOM Story Test Patterns — Common Failures and Fixes

Story interaction tests use `@storybook/test`: `within`, `userEvent`, `expect`, `canvas`.
These run in real browser context via Playwright/Chromium. Shadow DOM creates specific
access patterns that differ from normal DOM. Ignore these and you fail CI.

---

## Rule 0: Run Tests Before Pushing

**MANDATORY: `pnpm run test:storybook` before pushing any `.stories.ts` changes.**

`test:smart` does NOT run story tests. `pnpm run test` does NOT run story tests.
The only way to catch story test failures locally is `pnpm run test:storybook`.

---

## Pattern 1: Querying Inside Shadow DOM

**WRONG** — `canvas.querySelector()` returns null for shadow DOM elements:
```ts
const input = canvas.querySelector('input');  // null — input is in shadow root
```

**CORRECT** — access via the web component's shadow root:
```ts
const host = canvas.getByRole('textbox');  // or getByLabel, etc.
const input = (host as HTMLElement).shadowRoot!.querySelector('input')!;
```

Or use `within()` on the shadow root:
```ts
import { within } from '@storybook/test';
const shadow = within((host as HTMLElement).shadowRoot! as unknown as HTMLElement);
const input = shadow.getByRole('textbox');
```

---

## Pattern 2: getByLabelText with aria-hidden Asterisks

**WRONG** — label text includes the visual `*` which is wrapped in `aria-hidden`:
```ts
const input = canvas.getByLabelText('Patient Name *');  // fails — * is aria-hidden
```

**CORRECT** — use the accessible label text (without the aria-hidden asterisk):
```ts
const input = canvas.getByLabelText('Patient Name');
```

How to verify: inspect the `aria-label` or `<label>` text content; `aria-hidden` spans
are excluded from the accessible name.

---

## Pattern 3: userEvent on Shadow DOM Inputs

**WRONG** — `userEvent.clear()` / `userEvent.type()` fails because it can't focus a shadow DOM input:
```ts
await userEvent.clear(canvas.getByRole('textbox'));  // "element could not be focused"
```

**CORRECT** — interact with the host element's `value` property, or trigger events on the host:
```ts
const host = canvas.getByTestId('my-input') as HxTextInput;
host.value = '';  // direct property
await host.updateComplete;
```

Or use keyboard simulation on the focused host:
```ts
await userEvent.click(host);  // focus the host
await userEvent.keyboard('{Control>}a{/Control}{Backspace}');  // clear via keyboard
```

---

## Pattern 4: Slot Text Content vs. Expected String

**WRONG** — slot text includes the slot name prefix or surrounding whitespace:
```ts
expect(badge.textContent).toBe('3');  // fails: actual is 'Error: \n        \n        3'
```

**CORRECT** — query the specific CSS part or normalize:
```ts
const value = badge.shadowRoot!.querySelector('[part="value"]')!;
expect(value.textContent?.trim()).toBe('3');
```

---

## Pattern 5: Component Not Updated Before Assertion

**WRONG** — asserting before the Lit component has re-rendered:
```ts
host.setAttribute('variant', 'error');
expect(host.shadowRoot!.querySelector('.error')).toBeTruthy();  // not yet rendered
```

**CORRECT** — await `updateComplete`:
```ts
host.setAttribute('variant', 'error');
await (host as LitElement).updateComplete;
expect(host.shadowRoot!.querySelector('.error')).toBeTruthy();
```

---

## Pattern 6: Non-null Assertions in Story Play Functions

**WRONG** — non-null assertions hide bugs and fail TypeScript strict:
```ts
const card = canvas.getByTestId('card')!;  // TS2741 in strict mode
card!.focus();  // non-null assertion
```

**CORRECT** — explicit runtime guard:
```ts
const card = canvas.getByTestId('card');
if (!card) throw new Error('card not found');
card.focus();
```

---

## Pattern 7: axe-core Shadow DOM traversal

When writing axe tests for components with shadow DOM:

- Use `checkA11y(el, { useElement: true })` to pass the HOST to axe (not the shadow root)
- Do NOT put `role="list"` on a shadow host that also has a `<nav>` shadow child — axe flat-tree
  traversal sees `<nav>` as the a11y parent of slotted items, not the host
- Let shadow `<ol>` carry native list semantics; slotted `role="listitem"` items become flat-tree
  children of `<ol>`, satisfying both `aria-required-parent` and `aria-required-children`
- Only disable specific axe rules when you have documented proof of a known false positive.
  Never disable rules to make tests pass without understanding WHY they fire.

---

## Running Story Tests Locally

```bash
pnpm run test:storybook        # full suite (all stories, ~3-5 min)
pnpm --filter=@helixui/storybook run test  # same command

# Run a specific story file
cd apps/storybook && pnpm exec vitest run --reporter=verbose hx-alert
```

The storybook vitest config uses `fileParallelism: false` and `testTimeout: 30000` to
prevent OOM crashes from parallel story mounting. Do not change these settings.
