# AUDIT: `hx-number-input` — T1-07 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit (Claude Sonnet 4.6)
**Date:** 2026-03-05
**Source:** `rescue/abandoned-components` branch (PR #175 — not yet merged to dev)
**Files audited:**

- `hx-number-input.ts`
- `hx-number-input.styles.ts`
- `hx-number-input.test.ts`
- `hx-number-input.stories.ts`

> **Prerequisite note:** PR #175 was OPEN (not merged) at time of audit. All findings are based on source files read directly from `origin/rescue/abandoned-components`. This audit must be re-verified after merge.

---

## Severity Key

| Severity | Meaning                                                                                |
| -------- | -------------------------------------------------------------------------------------- |
| **P0**   | Blocking — ships broken behavior, data loss, or hard accessibility violation           |
| **P1**   | High — incorrect contract, AT inaccessibility, missing test coverage for critical path |
| **P2**   | Medium — code quality, minor spec deviation, documentation gap                         |

---

## Area 1: TypeScript

### P1 — `formStateRestoreCallback` uses `parseFloat` but value converter uses `Number()`

**File:** `hx-number-input.ts`, `formStateRestoreCallback` method

The `value` property converter uses `Number(attr)` which returns `NaN` for values like `"77abc"`. But `formStateRestoreCallback` uses `parseFloat(state)` which returns `77` for `"77abc"`. These two paths are inconsistent — a value that would be `null` when set via attribute could be `77` when restored from form state. In a healthcare dosage entry context, silent numeric coercion from corrupted form state is dangerous.

```ts
// converter (strict):
const n = Number(attr);
return isNaN(n) ? null : n;

// restore (lenient — inconsistency):
const parsed = parseFloat(state);
this.value = isNaN(parsed) ? null : parsed;
```

**Fix needed:** Use `Number(state)` in `formStateRestoreCallback` to match the converter's behavior.

---

### P1 — `_applyStep` dispatches both `hx-input` AND `hx-change` — consumer contract violation

**File:** `hx-number-input.ts`, `_applyStep` method

The documentation establishes two distinct events:

- `hx-input` — "Dispatched on every keystroke as the user types"
- `hx-change` — "Dispatched when the input loses focus after its value changed"

But `_applyStep` (invoked by stepper buttons and ArrowUp/ArrowDown keys) dispatches BOTH events simultaneously. A consumer listening to `hx-change` for "committed value changes" will receive two events per stepper interaction, and an `hx-change` will fire without any focus change. This violates the documented event contract.

**Fix needed:** `_applyStep` should dispatch only `hx-change` (stepper = committed intent). The `hx-input` event should remain exclusively for in-progress typing via the native input.

---

### P1 — `step` property inconsistently typed vs `min`/`max`

**File:** `hx-number-input.ts`

`min` and `max` are typed `number | undefined = undefined` — consumers can read `undefined` to detect "unset". `step` is typed `number = 1` — there is no way to distinguish "step not set by consumer" from "step explicitly set to 1". The `ifDefined` binding `step=${ifDefined(this.step !== 1 ? this.step : undefined)}` silently omits `step` from the native input when its value is `1`, but this means a consumer who explicitly sets `step="1"` gets identical behavior to `step` unset. Minor but the inconsistency with `min`/`max` typing is worth flagging.

---

### P2 — `select()` public method is misleading on `type="number"` inputs

**File:** `hx-number-input.ts`, `select()` method; test line 790

The spec states that `selectionStart`/`selectionEnd` are `null` on `type="number"` inputs — `select()` is effectively a no-op and will throw in strict browsers. The test acknowledges this: `"Should not throw"`, and notes selectionStart/selectionEnd are null. Exposing `select()` as a public method on a numeric input is misleading API surface. It implies text selection is supported when it is not.

**Fix needed:** Either remove `select()` from the public API or document it as a no-op with a comment in the implementation.

---

### P2 — `_input` `@query` result type conflicts with `setValidity` third argument

**File:** `hx-number-input.ts`

`this._internals.setValidity({...}, message, this._input ?? undefined)` — the `?? undefined` is correct but the Lit `@query` decorator will set `_input` to `null` before first render, not `undefined`. The `?? undefined` converts null to undefined correctly for the ElementInternals API. This works but is worth noting as a subtle nullability difference between Lit's `@query` (returns `null`) and the ElementInternals API (wants `undefined`).

---

### P2 — No runtime validation of `hxSize` attribute values

**File:** `hx-number-input.ts`

`hxSize: 'sm' | 'md' | 'lg' = 'md'` — TypeScript enforces the type at compile time, but an invalid attribute value like `hx-size="xl"` silently produces no size class (none of the `field--sm/md/lg` conditions match). The input renders with the base styles but no size variant. A defensive check or a runtime warning would improve DX in Drupal/Twig contexts where attributes are string-typed.

---

## Area 2: Accessibility

### P0 — Stepper container `aria-hidden="true"` makes buttons inaccessible to pointer + screen reader users

**File:** `hx-number-input.ts`, render method (stepper div)

```html
<div part="stepper" class="field__stepper" aria-hidden="true">
  <button ... aria-label="Increment" tabindex="-1">...</button>
  <button ... aria-label="Decrement" tabindex="-1">...</button>
</div>
```

The stepper `div` carries `aria-hidden="true"`, which hides ALL descendant content from the accessibility tree — including the buttons and their `aria-label` attributes. The buttons also have `tabindex="-1"` so they are excluded from keyboard tab order. The combined effect:

- **Screen reader users cannot activate the stepper buttons at all** (pointer OR keyboard)
- `aria-label="Increment"` / `aria-label="Decrement"` on the buttons are completely ignored — they serve no AT purpose
- The only way to increment/decrement with assistive technology is via ArrowUp/ArrowDown on the native `type="number"` spinbutton

A sighted screen reader user (e.g., low-vision user who mouses to the buttons) cannot activate them via AT. This is a WCAG 2.1 AA violation under **SC 4.1.2 Name, Role, Value** — interactive controls must be accessible.

**Fix needed:** Remove `aria-hidden="true"` from the stepper container. The buttons should remain `tabindex="-1"` (keyboard users use ArrowUp/ArrowDown, which is correct for spinbutton UX), but they must NOT be hidden from the accessibility tree so pointer-based AT users can discover and activate them.

---

### P1 — `role="alert"` + `aria-live="polite"` semantic conflict on error element

**File:** `hx-number-input.ts`, error div in render

```html
<div
  part="error-message"
  class="field__error"
  id="${this._errorId}"
  role="alert"
  aria-live="polite"
>
  ${this.error}
</div>
```

`role="alert"` has an implicit `aria-live="assertive"` and `aria-atomic="true"`. Adding `aria-live="polite"` attempts to downgrade it to polite announcement, but `role="alert"` wins — the content will still be announced assertively by most screen readers. In a healthcare UI where error announcements compete with ongoing task narration, an unintended assertive interrupt could disorient users.

**Fix needed:** Choose one semantic:

- `role="alert"` alone (assertive — appropriate for validation errors that require immediate attention)
- `role="status"` + `aria-live="polite"` (polite — appropriate if errors are informational, non-blocking)

For form validation in a healthcare context, `role="alert"` (assertive) is likely the correct choice — remove the redundant `aria-live="polite"`.

---

### P1 — Stepper `aria-label` attributes serve no purpose given `aria-hidden` container

**File:** `hx-number-input.ts`

Both stepper buttons carry `aria-label="Increment"` and `aria-label="Decrement"`. These are hidden from AT by the parent `aria-hidden="true"`. The labels have zero effect and exist only as dead markup. Once the P0 (`aria-hidden`) is fixed, these labels will become meaningful — but in the current state they are misleading in code review.

---

### P1 — `aria-required="true"` redundant alongside native `required` on `type="number"` input

**File:** `hx-number-input.ts`

```html
<input type="number" ?required=${this.required} aria-required=${this.required ? 'true' : nothing} ...>
```

The native `required` attribute already communicates requiredness to all assistive technologies. `aria-required="true"` is redundant. More importantly, when `required` is `false`, the code renders `aria-required` with `nothing` — but if a prior render had set `aria-required="true"`, removing the attribute requires `aria-required="false"` or attribute removal, not `nothing` (which removes the attribute, so this is technically correct). However, the redundancy adds noise and increases the risk of inconsistency if `required` and `aria-required` ever diverge.

**Fix needed:** Remove `aria-required` — the native `required` attribute is sufficient for `type="number"`.

---

### P2 — `type="number"` allows scientific notation input (e.g., `1e5`) that bypasses validation

**File:** `hx-number-input.ts`

`type="number"` on desktop browsers accepts scientific notation (`1e5`, `1.5e-3`). The `_parseInput` method uses `parseFloat` which will parse these correctly as numbers, so validation is not broken — but `1e5` will become `100000` silently. In a healthcare dosage context where a clinician might type `1e2` (100) instead of `100`, the silent acceptance of scientific notation could be surprising. Consider `inputmode="numeric"` + `pattern="[0-9]*"` for strictly whole-number contexts, though the component's fractional step support (`step=0.5`) makes this a design tradeoff.

**Note:** This is an architectural observation, not a defect in the current implementation. The decision to use `type="number"` is defensible; the tradeoff should be explicitly documented.

---

## Area 3: Tests

### P1 — Long-press stepper behavior has zero test coverage

**File:** `hx-number-input.test.ts`

The component implements a long-press acceleration pattern (`_startLongPress`, `_repeatInterval`, 400ms initial delay, 100ms repeat interval). This is one of the most complex and behavior-rich features of the component, but it has no tests:

- No test for repeated firing during hold
- No test for stopping on `pointerup`
- No test for stopping on `pointerleave`
- No test for stopping on `pointercancel`
- No test for cleanup on `disconnectedCallback`

**Fix needed:** Add tests for each pointer event transition in the long-press state machine.

---

### P1 — `formResetCallback` resets to `null` regardless of initial `value` attribute

**File:** `hx-number-input.ts`, `formResetCallback`; `hx-number-input.test.ts` line 551

The test verifies that `formResetCallback` sets value to `null`. This is the implemented behavior. However, HTML form reset semantics require resetting to the **default value** — the value of the `value` attribute at time of parsing. Native `<input type="number" value="10">` resets to `10`, not empty. The current implementation resets to `null` (empty) unconditionally. A test exists that asserts this incorrect behavior.

**Note:** `hx-text-input` has the same issue (resets to `''`). This is a systemic bug — flagging at P1 since it affects form UX in healthcare where default values often represent clinically safe starting points.

---

### P1 — Test at line 543 depends on `document.getElementById('test-fixture-container')`

**File:** `hx-number-input.test.ts`, lines 542-549

```ts
document.getElementById('test-fixture-container')!.appendChild(form);
```

This assumes a `#test-fixture-container` DOM element exists in the test environment. The test uses a non-null assertion (`!`) and will throw with an unhelpful error if the element doesn't exist. The test framework may provide this container, but coupling a test to an assumed DOM structure is fragile. All other tests use the `fixture` helper — this one bypasses it.

**Fix needed:** Rewrite using the `fixture` helper or create/clean up the container element within the test.

---

### P1 — No test for `_applyStep` dual-event dispatch

**File:** `hx-number-input.test.ts`

Given the P1 finding that `_applyStep` dispatches both `hx-input` and `hx-change` simultaneously, there is no test that explicitly documents or constrains this behavior. A consumer relying on event contracts could be surprised by double-firing. The current stepper tests (lines 369-407) only await `hx-change` — they don't verify that `hx-input` does or does not fire.

---

### P2 — `pointerleave` and `pointercancel` handlers not tested

**File:** `hx-number-input.ts`, `_handleStepperPointerDown`; test file

The stepper buttons register `@pointerleave` and `@pointercancel` handlers that call `_handleStepperPointerUp`. These code paths are untested.

---

### P2 — `select()` method test validates "does not throw" but method is a documented no-op

**File:** `hx-number-input.test.ts`, lines 790-798

The test comment acknowledges that `selectionStart/selectionEnd are null on type="number"` per spec. The test asserts `expect(() => el.select()).not.toThrow()`. This test is validating a no-op and provides no regression protection. If `select()` is retained, the test should document the no-op intent more explicitly. If `select()` is removed (per the TypeScript P2 finding), this test is deleted.

---

### P2 — `formStateRestoreCallback` edge case `"77abc"` not tested

**File:** `hx-number-input.test.ts`

Tests cover `"77"` (valid) and `"not-a-number"` (invalid). The edge case `"77abc"` — where `parseFloat` returns `77` but `Number()` would return `NaN` — is not tested. Given the P1 inconsistency between converter and restore logic, this edge case is precisely where the bug manifests.

---

## Area 4: Storybook

### P1 — `argTypes` keys use camelCase instead of HTML attribute names

**File:** `hx-number-input.stories.ts`, `argTypes` object

```ts
argTypes: {
  helpText: { ... },   // should be 'help-text'
  hxSize: { ... },     // should be 'hx-size'
  noStepper: { ... },  // should be 'no-stepper'
}
```

Storybook's CEM-driven autodocs uses `argTypes` keys to display attribute names in the controls panel. Camelcase keys (`helpText`, `hxSize`, `noStepper`) will show as camelCase in the UI, but the HTML attribute names are kebab-case (`help-text`, `hx-size`, `no-stepper`). This creates confusion for Drupal/Twig consumers who see the Storybook docs and try to use camelCase in their templates.

**Fix needed:** Use the HTML attribute name as the `argTypes` key. The property can still be accessed via `args.helpText` in the render function — Storybook maps both.

---

### P1 — Stories use hardcoded hex colors instead of `--hx-*` tokens

**File:** `hx-number-input.stories.ts`

Several stories use raw hex values instead of design tokens:

- `InAForm`: submit button uses `background: #2563EB; color: white; border: 1px solid #dee2e6` — no tokens
- `WithErrorSlot`: error SVG uses `color: var(--hx-color-error-500, #dc3545)` — token with hardcoded fallback (acceptable)
- `CSSParts`: Heading styles use `color: #6c757d`, `#212529`, etc. (demonstration context, lower severity)

The `InAForm` violation is the most egregious — it's a primary story demonstrating a production pattern, and the buttons in that story will not respond to theme changes. This sets a bad precedent for consumers copying the pattern.

---

### P2 — No story demonstrating the `label` named slot (Drupal Form API pattern)

**File:** `hx-number-input.stories.ts`

The component has a `label` named slot specifically for Drupal Form API rendered labels, but no story demonstrates this slot. The `WithErrorSlot` and `WithHelpSlot` stories exist as Drupal slot patterns, but the primary Drupal integration scenario (server-rendered label) has no story.

---

### P2 — No "Drupal Form API" story combining all three slots simultaneously

**File:** `hx-number-input.stories.ts`

A realistic Drupal Form API usage would render a label slot, an error slot, and a help slot together. No composite story exists. The `InAForm` story demonstrates native form association but not the Drupal slot pattern.

---

## Area 5: CSS

### P1 — Undocumented CSS custom properties `--hx-number-input-label-color` and `--hx-number-input-font-family`

**File:** `hx-number-input.styles.ts`; `hx-number-input.ts` JSDoc

The styles use two component-level tokens that are absent from the `@cssprop` JSDoc annotations:

```css
/* Documented: 6 properties */

/* Undocumented but used: */
--hx-number-input-label-color  /* .field__label color */
--hx-number-input-font-family  /* .field font-family */
```

Consumers who inspect the JSDoc or autodocs cannot discover these customization points. The CEM will also be inaccurate.

**Fix needed:** Add `@cssprop` entries for both properties to the class JSDoc.

---

### P1 — `.field__stepper-btn { outline: none }` removes native focus ring without equivalent replacement for programmatic focus

**File:** `hx-number-input.styles.ts`

```css
.field__stepper-btn {
  outline: none; /* removes default focus ring */
}
.field__stepper-btn:focus-visible {
  outline: ...; /* restores via :focus-visible */
}
```

`:focus-visible` correctly handles keyboard focus. However, the buttons are programmatically focusable (they are regular buttons even with `tabindex="-1"`). Programmatic `focus()` calls will not trigger `:focus-visible` in all browsers — the outline will be absent. In testing contexts where programmatic focus is used to verify focus behavior, this could mask issues.

This is secondary to the P0 `aria-hidden` finding. Once `aria-hidden` is removed and the buttons become AT-accessible, the focus ring behavior becomes more important.

---

### P2 — `-moz-appearance: textfield` is a deprecated vendor prefix

**File:** `hx-number-input.styles.ts`

```css
.field__input[type='number'] {
  -moz-appearance: textfield; /* deprecated */
  appearance: textfield;
}
```

`-moz-appearance` has been deprecated in Firefox; the unprefixed `appearance` property is now universally supported. The prefixed property is harmless but adds dead weight and signals outdated CSS.

---

### P2 — `color-mix()` in box-shadow — Baseline 2023 feature

**File:** `hx-number-input.styles.ts`

```css
box-shadow: 0 0 0 var(--hx-focus-ring-width)
  color-mix(
    in srgb,
    var(--hx-focus-ring-color) calc(var(--hx-focus-ring-opacity) * 100%),
    transparent
  );
```

`color-mix()` is Baseline 2023 (broadly available as of late 2023). For healthcare enterprise deployments on older managed browsers or Windows 7/8 era systems, this could silently drop the focus ring box-shadow. No fallback is provided.

**Note:** This pattern is used across other components in the library (observed in `hx-text-input`), so this is a systemic concern, not unique to this component.

---

### P2 — Undocumented: `pointer-events: none` on `[disabled]` host AND `disabled` attribute on buttons

**File:** `hx-number-input.styles.ts`, `hx-number-input.ts`

```css
:host([disabled]) {
  pointer-events: none;
}
```

```ts
?disabled=${this.disabled || this.readonly || this._atMax}
```

The buttons are both pointer-events suppressed at the host level AND individually disabled. This is redundant but correct. Worth documenting: the CSS `pointer-events: none` means mouse/touch events cannot reach any child, while the HTML `disabled` attribute handles keyboard and programmatic event prevention. Both are needed for full cross-mode coverage.

---

## Area 6: Performance

### P2 — `Math.random()` for stable IDs — collision risk and non-deterministic

**File:** `hx-number-input.ts`

```ts
private readonly _inputId = `hx-number-input-${Math.random().toString(36).slice(2, 9)}`;
```

`Math.random()` generates 7 base-36 characters ≈ 2 billion possibilities. In a page with many instances (e.g., a healthcare form with 50+ dynamic rows), collisions are statistically negligible but non-zero. More importantly, the IDs are non-deterministic, making snapshot testing and SSR hydration unreliable. A monotonic counter (shared across instances, as used in other Helix components) would be more robust.

**Note:** This pattern is used in other rescued components — it may be a systemic preference in this branch's rescue batch.

---

### P2 — `setInterval(100ms)` long-press creates GC pressure during sustained hold

**File:** `hx-number-input.ts`, `_startLongPress`

The long-press repeat interval fires at 100ms (10 times/second). Each tick calls `_applyStep` which: computes a new value, runs `_clamp`, dispatches two `CustomEvent` objects (`hx-input` + `hx-change`), triggers a Lit reactive update, and re-renders. For healthcare dosage entry with large step ranges (e.g., `max=10000, step=1`), a sustained press could fire thousands of updates. The repeat rate and event dispatch overhead should be profiled.

**Minor note:** `_clearLongPress` is correctly called in `disconnectedCallback` — no leak.

---

### P2 — Bundle size not verified

The feature requirement specifies `< 5KB (min+gz)`. Given the implementation size (~400 lines TypeScript + ~200 lines CSS), the bundle may exceed the 5KB budget. This must be verified by running `npm run build` and checking the per-component output size.

---

## Area 7: Drupal Integration

### P0 — `@slot -` JSDoc documents a default slot that does not exist in the render template

**File:** `hx-number-input.ts`

The JSDoc documents:

```
 * @slot - Default slot — label override for Drupal Form API rendered labels.
```

But the render template has NO default `<slot></slot>`. It only renders named slots: `label`, `prefix`, `suffix`, `error`, `help`. Content placed in the default slot will be assigned to an unrendered slot and will not appear visually.

This is a documentation-implementation mismatch. The actual slot for label override is `slot="label"` (named), not the default slot. Drupal integrations following this documentation will silently lose their server-rendered label content.

**Fix needed:** Either add a rendered `<slot></slot>` to display default slot content, or correct the `@slot -` documentation to `@slot label`.

---

### P1 — `formResetCallback` does not restore to the HTML `value` attribute default

**File:** `hx-number-input.ts`

As noted in the Tests section, `formResetCallback` resets to `null` (empty) regardless of the `value` attribute value. For a Drupal-rendered form field like:

```twig
<hx-number-input name="dosage" value="250" min="0" max="1000">
```

Clicking "Reset" will clear the field to empty, not restore it to `250`. This violates HTML form reset semantics and would surprise Drupal Form API integrators who expect reset to restore the default value.

**Context:** `hx-text-input` has the same issue. This is systemic.

---

### P1 — Step attribute not set on native input when `step === 1`

**File:** `hx-number-input.ts`

```ts
step=${ifDefined(this.step !== 1 ? this.step : undefined)}
```

When `step` is `1` (the default), the `step` attribute is omitted from the native `<input>`. This means `<input type="number">` without an explicit `step` defaults to `any` in some browser implementations, or to `1` in others. From a Drupal Form API perspective, if a Twig template sets `step="1"` explicitly, the value IS `1` — but the attribute won't appear on the rendered input. This is a cosmetic inconsistency but could confuse developers inspecting the DOM.

---

### P2 — No `placeholder` property exposed

**File:** `hx-number-input.ts`

Healthcare contexts often show placeholder hints for expected format (e.g., `placeholder="0-1000"`). `hx-text-input` exposes a `placeholder` property. `hx-number-input` omits it — consumers have no way to set placeholder text without CSS Part overrides. Minor, but the parity gap with `hx-text-input` is notable.

---

## Summary Table

| #   | Area          | Severity | Finding                                                                                                                            |
| --- | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | TypeScript    | P1       | `formStateRestoreCallback` uses `parseFloat` vs converter's `Number()` — inconsistency                                             |
| 2   | TypeScript    | P1       | `_applyStep` dispatches both `hx-input` AND `hx-change` — violates event contract                                                  |
| 3   | TypeScript    | P1       | `step` typed inconsistently vs `min`/`max`                                                                                         |
| 4   | TypeScript    | P2       | `select()` is misleading API on `type="number"`                                                                                    |
| 5   | TypeScript    | P2       | No runtime validation of `hxSize` attribute                                                                                        |
| 6   | Accessibility | **P0**   | Stepper `aria-hidden="true"` hides buttons from AT — WCAG SC 4.1.2 violation                                                       |
| 7   | Accessibility | P1       | `role="alert"` + `aria-live="polite"` semantic conflict                                                                            |
| 8   | Accessibility | P1       | Stepper `aria-label` attributes are dead code (hidden by `aria-hidden`)                                                            |
| 9   | Accessibility | P1       | `aria-required` redundant alongside native `required`                                                                              |
| 10  | Accessibility | P2       | `type="number"` accepts scientific notation silently                                                                               |
| 11  | Tests         | P1       | Long-press behavior has zero test coverage                                                                                         |
| 12  | Tests         | P1       | `formResetCallback` test validates incorrect behavior                                                                              |
| 13  | Tests         | P1       | Test uses `getElementById('test-fixture-container')` — fragile DOM assumption                                                      |
| 14  | Tests         | P1       | No test for `_applyStep` dual-event dispatch                                                                                       |
| 15  | Tests         | P2       | `pointerleave`/`pointercancel` handlers untested                                                                                   |
| 16  | Tests         | P2       | `select()` test validates no-op                                                                                                    |
| 17  | Tests         | P2       | `formStateRestoreCallback("77abc")` edge case not tested                                                                           |
| 18  | Storybook     | P1       | `argTypes` keys use camelCase, not HTML attribute names                                                                            |
| 19  | Storybook     | P1       | `InAForm` story uses hardcoded hex colors                                                                                          |
| 20  | Storybook     | P2       | No `label` slot story (Drupal Form API pattern)                                                                                    |
| 21  | Storybook     | P2       | No composite Drupal slot story                                                                                                     |
| 22  | CSS           | P1       | `--hx-number-input-label-color` and `--hx-number-input-font-family` undocumented                                                   |
| 23  | CSS           | P1       | `outline: none` on stepper buttons without reliable replacement for programmatic focus                                             |
| 24  | CSS           | P2       | `-moz-appearance: textfield` is deprecated                                                                                         |
| 25  | CSS           | P2       | `color-mix()` has no fallback for older managed browsers                                                                           |
| 26  | CSS           | P2       | Double-disable (`pointer-events: none` + `disabled`) undocumented                                                                  |
| 27  | Performance   | P2       | `Math.random()` IDs — non-deterministic, SSR/snapshot unfriendly                                                                   |
| 28  | Performance   | P2       | 100ms `setInterval` long-press creates GC pressure at high step counts                                                             |
| 29  | Performance   | P2       | Bundle size not verified against 5KB budget                                                                                        |
| 30  | Drupal        | **P0**   | ~~`@slot -` documents default slot that doesn't exist~~ **FIXED** — `@slot -` removed; named `label` slot documented               |
| 31  | Drupal        | P1       | ~~`formResetCallback` doesn't restore to HTML `value` attribute default~~ **FIXED** — `_defaultValue` captured in `firstUpdated()` |
| 32  | Drupal        | P1       | ~~`step="1"` omitted from native input DOM when value is 1~~ **FIXED** — `step=${this.step}` always rendered                       |
| 33  | Drupal        | P2       | No `placeholder` property (parity gap with `hx-text-input`)                                                                        |
| 34  | Storybook     | P2       | ~~No `label` slot story (Drupal Form API pattern)~~ **FIXED** — `WithLabelSlot` story added                                        |
| 35  | Storybook     | P2       | ~~No composite Drupal slot story~~ **FIXED** — `DrupalFormAPI` story added (all three slots)                                       |

---

## P0 Issues Requiring Immediate Attention Before Merge

1. **Stepper `aria-hidden="true"` (Finding #6)** — Buttons are completely inaccessible to screen reader users. WCAG 2.1 AA violation. Must be fixed before merge.

2. **`@slot -` documents non-existent default slot (Finding #30)** — Drupal consumers following the documentation will silently lose server-rendered label content. Either add the slot or fix the documentation before merge.
