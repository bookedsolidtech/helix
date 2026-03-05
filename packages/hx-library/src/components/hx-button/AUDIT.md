# hx-button — Antagonistic Quality Audit (T1-01)

**Audited:** 2026-03-05
**Auditor:** Antagonistic review pass — no fixes, document only.
**Files reviewed:**
- `hx-button.ts`
- `hx-button.styles.ts`
- `hx-button.stories.ts`
- `hx-button.test.ts`
- `index.ts`
- Build output (`dist/shared/hx-button-6ZHyyf2g.js`)

---

## Executive Summary

`hx-button` is structurally sound with solid TypeScript, comprehensive variant/size coverage, and
axe-core tests that pass. However, two **P0 accessibility defects** exist that are undetected by
the current test suite, one **double-opacity visual bug** renders disabled buttons at 25% opacity
instead of 50%, and several test gaps leave critical code paths untested.

---

## P0 — Must Fix Before Release

### P0-01: Icon-only buttons are inaccessible — `aria-label` on host does not propagate to inner `<button>`

**File:** `hx-button.ts:206–244` (render method) / `hx-button.stories.ts:687–706` (IconOnly story)

When an icon-only button is used (no slot text), the recommended pattern is to set `aria-label` on
the host element:

```html
<hx-button variant="ghost" aria-label="Close dialog">
  <svg aria-hidden="true">…</svg>
</hx-button>
```

In Shadow DOM, `aria-label` placed on the custom element (`<hx-button>`) applies to the host
element in the accessibility tree. The **inner `<button>`** rendered inside shadow root has no
accessible name — the host's `aria-label` does not flow into the shadow tree. The `<svg>` is
`aria-hidden="true"`, leaving the inner button completely unlabeled.

The current axe-core tests (`hx-button.test.ts:438–488`) never test icon-only scenarios. The
`IconOnly` Storybook story exists but has no `play` function or corresponding browser test.

**Impact:** Screen reader users encounter an unlabeled interactive element — WCAG 2.1 AA violation
(Success Criterion 4.1.2 Name, Role, Value). Critical for healthcare context.

**Resolution needed:** Add an `ariaLabel` reflected property that sets `aria-label` on the inner
`<button>`/`<a>`, or use `ElementInternals.ariaLabel` delegation.

---

### P0-02: Disabled anchor (`href` mode) remains keyboard-focusable

**File:** `hx-button.ts:214–228` (anchor render branch)

When `href` is set and `disabled` is true, the component renders:

```html
<a part="button" aria-disabled="true">…</a>
```

The `href` attribute is stripped (set to `nothing` at line 219), which in Chromium still leaves
the `<a>` element in the tab order unless `tabindex="-1"` is applied. Keyboard users can Tab to
a "disabled" link-button that visually appears inert. While `pointer-events: none` on the host
prevents mouse interaction, keyboard focus is unaffected by that CSS rule.

The test at `hx-button.test.ts:229–243` verifies the anchor has `aria-disabled="true"` and that
`hx-click` is not fired, but does **not** verify that `tabindex="-1"` is set to remove it from
the focus order.

**Impact:** WCAG 2.1 AA violation (SC 2.1.1 Keyboard). Disabled elements should not receive
keyboard focus.

**Resolution needed:** Add `tabindex="-1"` to the `<a>` element when `this.disabled` is true.

---

## P1 — High Priority

### P1-01: Double opacity — disabled button renders at 25% opacity, not 50%

**File:** `hx-button.styles.ts:8–11, 133–136`

Two CSS rules both apply `opacity: 0.5` to a disabled button simultaneously:

```css
/* Rule 1: host — line 8 */
:host([disabled]) {
  opacity: var(--hx-opacity-disabled, 0.5);
}

/* Rule 2: inner button — line 133 */
.button[disabled] {
  cursor: not-allowed;
  opacity: var(--hx-opacity-disabled, 0.5);
}
```

CSS opacity is multiplicative across parent/child. When `disabled` is set:
- Host renders at 50% opacity
- Inner button renders at 50% of that = **25% total opacity**

The test at `hx-button.test.ts:125–129` only checks `el.hasAttribute('disabled')`, not the actual
rendered opacity. The double-opacity bug is completely untested.

**Impact:** All disabled variants render at 25% opacity — far below the design spec and potentially
failing WCAG 1.4.3 contrast requirements at that opacity level.

**Resolution needed:** Remove `opacity` from either `:host([disabled])` or `.button[disabled]` —
not both.

---

### P1-02: Missing test — loading state does not prevent form submission

**File:** `hx-button.test.ts` (no such test exists)

The `_handleClick` handler at `hx-button.ts:129–130` gates on `this.loading`:

```ts
if (this.disabled || this.loading) {
  e.preventDefault();
  e.stopPropagation();
  return;
}
```

The form interaction path at lines 148–155 is only reached if this guard passes. However, there is
no test that verifies: when `type="submit"` + `loading=true` is set, clicking the button does
**not** submit the form.

The existing form tests (`hx-button.test.ts:382–434`) do not set `loading` in any form scenario.

**Impact:** An untested code path. If the guard logic is ever refactored, a loading submit button
could double-submit forms — critical defect in a healthcare form context.

---

### P1-03: Missing test — `name` / `value` props and `ElementInternals.setFormValue()` are untested

**File:** `hx-button.ts:149–151` / `hx-button.test.ts` (no corresponding test)

When `type="submit"` is clicked with `name` and `value` set, the component calls:

```ts
if (this.name !== undefined && this.value !== undefined) {
  this._internals.setFormValue(this.value);
}
```

No test in the suite verifies that:
1. `name` and `value` properties exist and are settable
2. `ElementInternals.setFormValue()` is called with the correct value
3. The submitted form data includes the button's value under the given name

**Impact:** A form-associated custom element whose value submission is completely unverified. Dead
code risk — if this logic has a bug it would be invisible.

---

### P1-04: Storybook `size` argType key mismatches component API

**File:** `hx-button.stories.ts:25–34`

The argTypes definition uses `size` as the control key:

```ts
argTypes: {
  size: { … }  // line 25
}
```

But the component property is `hxSize` and the HTML attribute is `hx-size`. The custom `render`
function patches this manually (`hx-size=${args.size}`), so the canvas works. However:

1. The CEM-generated autodocs will surface `hxSize` (or `hx-size`), creating a mismatch with the
   Storybook control panel which shows `size`.
2. Any consumer using `args`-based story composition (e.g., `{ ...Primary.args, size: 'lg' }`)
   will work only because of the custom render — it's fragile and undocumented.
3. URL-based story args (e.g., `?args=hxSize:lg`) won't apply via the Storybook controls panel.

**Impact:** Confusing developer experience, CEM/Storybook misalignment, brittle arg passing.

---

## P2 — Should Fix

### P2-01: `white-space: nowrap` hardcoded with no escape hatch

**File:** `hx-button.styles.ts:35`

```css
white-space: nowrap;
```

This is unconditional. There is no `--hx-button-white-space` token or CSS part override mechanism.
The `LongLabel` story (`hx-button.stories.ts:794`) explicitly notes: "Button uses `white-space:
nowrap` by default. Long labels will not wrap." — and lists a label that overflows a 320px
container. In healthcare contexts, action labels like "Submit Prior Authorization Request for
Extended Inpatient Stay Approval" are realistic. Forcing overflow is not acceptable for responsive
layouts.

---

### P2-02: `filter: brightness()` hover effect applies during loading state

**File:** `hx-button.styles.ts:45–51`

```css
.button:hover {
  filter: brightness(var(--hx-filter-brightness-hover, 0.9));
}
```

This rule has no `.button--loading` exclusion. When `loading` is true, hovering the button
still dims it, creating visual feedback that implies the button is interactive — contradicting the
`cursor: wait` state and `aria-busy="true"`. The loading state should visually suppress hover
feedback.

---

### P2-03: Deprecated `WcButton` type still imported in test file

**File:** `hx-button.test.ts:4`

```ts
import type { WcButton } from './hx-button.js';
```

`hx-button.ts:252–253` marks `WcButton` as `@deprecated: Use HelixButton`. The test file should
use `HelixButton` directly. As long as `WcButton` is imported in the canonical test file, the
deprecation has no enforcement path — consumers will see it used in "official" code and assume
it's current.

---

### P2-04: Form tests bypass `fixture()` helper — potential test pollution

**File:** `hx-button.test.ts:395–433`

The form interaction tests manipulate the DOM directly:

```ts
const form = document.createElement('form');
document.getElementById('test-fixture-container')!.appendChild(form);
```

The `fixture()` helper in `test-utils.ts` tracks elements for cleanup via `afterEach(cleanup)`.
Elements appended directly to `#test-fixture-container` are also cleaned up by `cleanup()` if
that function clears the container — but this depends on `cleanup()` implementation. If the test
throws before the form is removed, or if `cleanup()` uses a different container reference, test
state can leak between tests.

---

### P2-05: Stale screenshots from renamed tests

**File:** `__screenshots__/hx-button.test.ts/`

Screenshot filenames include old test names that no longer exist in the test file:

- `hx-button-Events-dispatches-wc-click-on-click-1.png` — current test is
  `dispatches hx-click on click` (not `wc-click`)
- `hx-button-Accessibility--axe-core--has-no-axe-violations-for-all-variants-1.png` through `-3`
  — current tests are split into `for-original-variants` and `for-new-variants`

Stale screenshots mislead reviewers about which test runs are current and may cause false CI
comparisons.

---

### P2-06: Unused variable in Default story play function

**File:** `hx-button.stories.ts:142`

```ts
const _canvas = within(canvasElement);
```

`_canvas` is never used in the play function. The underscore prefix is a convention for
"intentionally unused" but the `within` call still executes and imports the test library. Dead
code should be removed.

---

### P2-07: No Drupal Twig documentation or CDN import example

**Files:** `packages/hx-library/src/components/hx-button/` (no `.twig`, no Drupal notes)

The CLAUDE.md states Drupal is the primary consumer. `hx-button` has no:
- Twig template example
- CDN `<script type="module">` import snippet
- Documentation of how `ElementInternals` form association interacts with Drupal AJAX forms

The `InAForm` story (`hx-button.stories.ts:718`) demonstrates the JS/HTML pattern but not the
Drupal-specific integration pattern. Drupal AJAX form submission (`Drupal.ajax`) intercepts native
form submissions, which may conflict with `requestSubmit()` called by `ElementInternals`.

---

### P2-08: Missing test — icon-only accessibility pattern

**File:** `hx-button.test.ts` (no such test)

Complementing P0-01: even if the P0 fix is implemented (propagating aria-label to inner button),
there is no test that verifies an icon-only button (`aria-label` on host, no slot text) passes
axe-core. The `IconOnly` story exists but has no automated accessibility assertion.

---

### P2-09: Missing story — interactive loading state toggle

**File:** `hx-button.stories.ts`

The `Loading` story (`hx-button.stories.ts:244–250`) renders a static loading state. There is no
story demonstrating the full async lifecycle: normal → click → loading → resolved. This is the
primary loading state use case in healthcare (form submission, API call). A `play`-driven story
would validate that the component correctly gates duplicate clicks.

---

## Summary Table

| ID     | Area          | Severity | Description                                              |
|--------|---------------|----------|----------------------------------------------------------|
| P0-01  | Accessibility | P0       | Icon-only: `aria-label` on host not propagated to inner button |
| P0-02  | Accessibility | P0       | Disabled anchor remains keyboard-focusable (missing `tabindex="-1"`) |
| P1-01  | CSS / Visual  | P1       | Double opacity — disabled renders at 25%, not 50%        |
| P1-02  | Tests         | P1       | No test: loading prevents form submission                |
| P1-03  | Tests         | P1       | No test: `name`/`value` and `setFormValue()` untested   |
| P1-04  | Storybook     | P1       | `size` argType key mismatches `hxSize` property / `hx-size` attribute |
| P2-01  | CSS           | P2       | `white-space: nowrap` hardcoded, no escape hatch for long labels |
| P2-02  | CSS           | P2       | Hover `filter: brightness()` applies during loading state |
| P2-03  | TypeScript    | P2       | Deprecated `WcButton` type still imported in test file   |
| P2-04  | Tests         | P2       | Form tests bypass `fixture()` helper — potential test pollution |
| P2-05  | Tests         | P2       | Stale screenshots from renamed/split tests               |
| P2-06  | Storybook     | P2       | Unused `_canvas` variable in Default story play function |
| P2-07  | Drupal        | P2       | No Twig example, no CDN snippet, no AJAX form interaction docs |
| P2-08  | Tests         | P2       | No test: icon-only accessibility with `aria-label`       |
| P2-09  | Storybook     | P2       | No interactive loading state toggle story                |

---

## What Passes

- TypeScript strict compliance — no `any`, no `@ts-ignore`, no non-null assertions
- All six variants typed and tested (`primary`, `secondary`, `tertiary`, `danger`, `ghost`, `outline`)
- All three sizes typed and tested (`sm`, `md`, `lg`)
- `rel="noopener noreferrer"` correctly applied when `target="_blank"`
- `aria-busy="true"` correctly set on loading state
- Native `<button disabled>` used (not `aria-disabled`) — correct ARIA pattern for button mode
- `hx-click` event is `bubbles: true, composed: true` with `detail.originalEvent`
- CSS parts exposed: `button`, `label`, `prefix`, `suffix`, `spinner`
- All CSS values use `--hx-*` design tokens with appropriate fallbacks
- Bundle size: 2.60 kB gzip — within 5 kB threshold ✓
- axe-core tests pass for all variants, disabled, loading, href mode
- Keyboard (Enter/Space) activation tested and passing
- Form association (`formAssociated = true`, `attachInternals()`) implemented correctly
- Shadow DOM encapsulation maintained — no style leakage
- `@deprecated WcButton` alias provided for backwards compatibility (migration path exists)
