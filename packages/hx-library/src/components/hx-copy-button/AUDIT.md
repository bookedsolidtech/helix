# AUDIT: hx-copy-button — T2-30 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit agent
**Date:** 2026-03-05
**Source branch:** rescue-abandoned-components (PR #175)
**Files reviewed:**
- `hx-copy-button.ts`
- `hx-copy-button.styles.ts`
- `hx-copy-button.test.ts`
- `hx-copy-button.stories.ts`
- `index.ts`
- `dist/shared/hx-copy-button-CZiY_ffy.js` (bundle)

---

## Summary

| Area       | Rating | P0 | P1 | P2 |
|------------|--------|----|----|----|
| TypeScript | PASS   | 0  | 1  | 2  |
| A11y       | WARN   | 0  | 1  | 3  |
| Tests      | FAIL   | 0  | 2  | 3  |
| Storybook  | WARN   | 0  | 1  | 2  |
| CSS        | FAIL   | 0  | 1  | 3  |
| Performance| PASS   | 0  | 0  | 1  |
| Drupal     | FAIL   | 0  | 1  | 2  |

**Blocking issues before merge: 7 (P1)**

---

## 1. TypeScript

### PASS with reservations

**Strengths:**
- No `any` types, no `@ts-ignore`, strict mode compliant.
- `_feedbackTimer: ReturnType<typeof setTimeout> | null` correctly typed.
- `override` keywords used on all overriding methods.
- `disconnectedCallback` calls `super.disconnectedCallback()`.
- Custom event is correctly typed: `CustomEvent<{ value: string }>`.

### Findings

#### P1 — `execCommand` fallback does not throw on failure; success state incorrectly entered

**File:** `hx-copy-button.ts:101-115`

```ts
document.execCommand('copy');   // return value ignored
```

`document.execCommand('copy')` returns `false` on failure (no selection, permission denied, etc.) but the return value is not checked. If the fallback silently fails, the code falls through to set `_copied = true` and fire `hx-copy`, misleading users and consuming systems into believing a copy succeeded when it did not. In a healthcare context (patient MRN, medication order), a false positive copy confirmation is a patient-safety risk.

**Fix:** Check the return value and throw if `false`.

---

#### P2 — `size` property has no runtime guard against invalid values

**File:** `hx-copy-button.ts:67`

```ts
size: 'sm' | 'md' | 'lg' = 'md';
```

TypeScript types this correctly, but `@property({ type: String })` with `attribute: 'hx-size'` means any string can be set at runtime from HTML (e.g., `hx-size="xl"`). When an invalid size is set, `_buttonClasses()` generates `button--xl`, which has no matching CSS rule — silently produces an unsized button.

---

#### P2 — `feedbackDuration` has no minimum-value guard

**File:** `hx-copy-button.ts:59-60`

`feedbackDuration = 2000` is unguarded. Setting `feedback-duration="0"` or a negative number causes `setTimeout(fn, 0)` or `setTimeout(fn, -500)`. Both fire immediately, meaning the copied state is never visually shown. This would cause the success announcement to appear and immediately disappear, making the accessible live region announcement potentially unseen or garbled. No validation, no clamping.

---

## 2. Accessibility

### WARN

**Strengths:**
- `aria-live="polite"` + `aria-atomic="true"` live region correctly announces copy completion.
- Static `aria-label` on the button provides a persistent accessible name.
- `title` mirrors `aria-label` for sighted tooltip users.
- `type="button"` prevents accidental form submission.
- `focus-visible` focus ring uses token-based color.
- `sr-only` correctly implemented (not relying on `display:none` or `visibility:hidden`).

### Findings

#### P1 — `aria-label` is not updated during success state

**File:** `hx-copy-button.ts:187`

```html
aria-label=${this.label}
```

The `aria-label` is permanently set to the `label` property (default: "Copy to clipboard") even during the success/copied state. Screen reader users who navigate back to the button after copy will hear "Copy to clipboard" — not "Copied" — which is inconsistent with the visual success icon and the live region announcement. WCAG 1.3.1 requires that the accessible name accurately reflects the component's current state. The live region handles the initial announcement but does not cover re-focus scenarios.

**Fix:** Change `aria-label` to reflect copied state, e.g.:

```ts
aria-label=${this._copied ? `${this.label} — Copied` : this.label}
```

---

#### P2 — Redundant `aria-disabled` on natively-disabled button

**File:** `hx-copy-button.ts:189`

```html
aria-disabled=${this.disabled ? 'true' : nothing}
```

The native `?disabled=${this.disabled}` already renders the button with the `disabled` attribute, making it fully inaccessible to AT (not focusable, not activatable). Adding `aria-disabled="true"` on top of a natively-disabled element is redundant and may confuse some screen reader/browser combinations that check both attributes. Per ARIA spec, `aria-disabled` is intended for elements that remain in the focus order while being semantically disabled — which is not the case here.

---

#### P2 — Keyboard tests use `.click()` rather than actual keyboard dispatch

**File:** `hx-copy-button.test.ts:327-351`

Both "Enter key" and "Space key" tests call `btn!.click()` — a programmatic DOM click — rather than dispatching real `KeyboardEvent` events (`keydown`, `keypress`, `keyup`). While a native `<button>` does activate on Enter/Space when focused, the tests do not verify that keyboard focus and key dispatch actually trigger the handler. These tests provide false coverage confidence.

---

#### P2 — Minimum touch target size is not enforced for `sm` variant

**File:** `hx-copy-button.styles.ts:54-59`

```css
.button--sm {
  min-width: var(--hx-size-8);
  height: var(--hx-size-8);
}
```

If `--hx-size-8` resolves to less than 24×24px (WCAG 2.5.8 AA, WCAG 2.2) or 44×44px (WCAG 2.5.5 AAA, iOS Human Interface Guidelines), the `sm` variant fails minimum touch target requirements. Token values are not confirmed in this audit but must be verified. Healthcare applications are often used on touchscreen kiosks and tablets where undersized targets are a real usability hazard.

---

#### P3 — No `aria-pressed` or `aria-expanded` for the copied state

The copied state is a transient visual/accessible change but does not use `aria-pressed`. This is appropriate for a button with feedback — `aria-pressed` is for toggle buttons, not transient states. However, the component documentation does not describe this design decision. Consider noting this explicitly in JSDoc to prevent future "fix" regressions.

---

## 3. Tests

### FAIL

**Strengths:**
- 34 test cases across 9 describe blocks.
- axe-core used for default, disabled, and all three sizes.
- Clipboard mocked in `beforeEach`.
- `vi.useFakeTimers()` + `vi.useRealTimers()` correctly scoped in `finally` block.
- Slot, rendering, property, event, and state tests all present.

### Findings

#### P1 — No test for clipboard write failure (blocked/denied clipboard)

**File:** `hx-copy-button.test.ts` — missing

The audit specifically requires "copy failure (blocked clipboard)" coverage. There is a test for `navigator.clipboard === undefined` (execCommand fallback path), but there is **no test** for the case where `navigator.clipboard.writeText` rejects (e.g., permission denied, Permissions API blocked, iframe without clipboard permission). The `_performCopy` catch block silently suppresses this error:

```ts
} catch {
  // Copy failed silently; do not enter success state.
  return;
}
```

The behavior on failure (no `_copied`, no `hx-copy` event, no user notification) is completely untested. In healthcare, a failed copy with no feedback could lead to clinicians pasting outdated data.

---

#### P1 — Keyboard tests do not dispatch real keyboard events

**File:** `hx-copy-button.test.ts:327-351`

The "Enter key" and "Space key" tests call `btn!.click()` rather than dispatching `KeyboardEvent`. This does not verify that the button is keyboard-accessible — it only repeats the click test. If the `@click` handler were removed and replaced with `@keydown`, these tests would still pass. True keyboard tests must dispatch `new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })` and verify the handler fires.

---

#### P2 — Clipboard fallback test does not verify state remains uncopied

**File:** `hx-copy-button.test.ts:356-374`

```ts
expect(() => { btn!.click(); }).not.toThrow();
```

When `navigator.clipboard` is `undefined`, the `execCommand` fallback runs. The test only verifies no exception is thrown. It does NOT verify:
1. `document.execCommand` was called (or that the correct text was written).
2. `_copied` state was set to `true` after the fallback.
3. `hx-copy` event fired (or not, depending on whether execCommand returns false).

This test provides no meaningful behavioral coverage.

---

#### P2 — No test for rapid double-click timer reset

**File:** `hx-copy-button.test.ts` — missing

A user clicking the button twice rapidly should clear the first feedback timer and restart it. The `_clearFeedbackTimer()` method handles this, but it is untested. The scenario: click → wait 1.8s → click again → timer resets to 2s from the second click. Without a test, a regression in `_clearFeedbackTimer()` would go undetected.

---

#### P2 — No test for `disconnectedCallback` clearing the timer

**File:** `hx-copy-button.test.ts` — missing

If the element is removed from DOM while in the copied state (e.g., dialog close, navigation), `disconnectedCallback` should clear the pending timeout. If `_clearFeedbackTimer()` does not run or is broken, the timeout fires on a disconnected element, potentially causing Lit `_copied = false` update on a disconnected element. This is untested.

---

#### P2 — Double `Promise.resolve()` flush is fragile async coupling

**File:** `hx-copy-button.test.ts:282-283`

```ts
await Promise.resolve();
await Promise.resolve();
await el.updateComplete;
```

Two manual microtask flushes is a code smell indicating the test is coupled to the internal async implementation. If the `_performCopy` async chain adds another `await` internally, this test would silently become flaky. A more robust approach uses `oneEvent` to wait for `hx-copy` before advancing fake timers, which the test does not do (it calls `btn!.click()` without `oneEvent`).

---

## 4. Storybook

### WARN

**Strengths:**
- 9 stories covering sizes, states, healthcare use case.
- `play` functions in Default and Disabled verify event behavior.
- All 5 public properties have `argTypes` with descriptions, types, defaults, and categories.
- `autodocs` tag present.

### Findings

#### P1 — No "Copied / Success State" story

The feature description explicitly requires a "success feedback demo" story. While `ShortFeedback` demonstrates the transition, it requires user interaction to see the success state. There is no story that shows the component locked in the success/copied state (e.g., for visual regression testing or design review). A story programmatically setting `el._copied = true` or using `feedbackDuration` so long it persists throughout the story is missing.

---

#### P2 — Meta `render` function includes duplicate icon in default slot

**File:** `hx-copy-button.stories.ts:96-137`

```ts
render: (args) => html`
  <hx-copy-button ...>
    ${iconCopy}          <!-- raw SVG in DEFAULT slot (line 104) -->
    <svg slot="copy-icon" ...>   <!-- ALSO in copy-icon named slot -->
```

The meta `render` function renders the `iconCopy` variable into the default (unnamed) slot AND separately provides a `slot="copy-icon"` SVG. This means stories using the meta render will display an extra raw SVG alongside the named slot icon. The `Default`, `Medium`, `Large`, and other stories that inherit the meta render will show this duplicate. Only stories with custom `render` functions (which all of them have) avoid this — but the meta render itself is incorrect.

---

#### P2 — No story demonstrates clipboard failure state

There is no story showing what the component looks like or does when the clipboard API is blocked. While the component itself has no error state, the absence of a story leaves developers with no reference for handling errors in their consuming application.

---

## 5. CSS

### FAIL

**Strengths:**
- 100% design token usage — no hardcoded color, spacing, or typography values.
- `prefers-reduced-motion` reduces transitions appropriately.
- CSS parts (`button`, `icon`) match the JSDoc declarations.
- `sr-only` class is a textbook implementation.
- Focus ring uses `focus-visible` (not `:focus`).

### Findings

#### P1 — Double opacity on disabled state

**File:** `hx-copy-button.styles.ts:8-11` and `94-99`

```css
:host([disabled]) {
  pointer-events: none;
  opacity: var(--hx-opacity-disabled);   /* ← applied to host */
}

.button[disabled] {
  cursor: not-allowed;
  opacity: var(--hx-opacity-disabled);   /* ← applied to button inside host */
}
```

Both `:host([disabled])` and `.button[disabled]` apply `opacity: var(--hx-opacity-disabled)`. CSS opacity is multiplicative through the render tree: if `--hx-opacity-disabled` is `0.5`, the button will render at `0.5 × 0.5 = 0.25` opacity — far dimmer than the design intent. This creates a visual regression in all healthcare contexts where the disabled state must meet contrast requirements (WCAG 1.4.3 exception notwithstanding, severely over-dimmed disabled states can also mislead users).

**Fix:** Remove `opacity` from either `:host([disabled])` or `.button[disabled]`. Keep `pointer-events: none` on the host and `cursor: not-allowed` + `opacity` on the button only.

---

#### P2 — Non-standard token names for hover/active brightness filters

**File:** `hx-copy-button.styles.ts:44-50`

```css
filter: brightness(var(--hx-filter-brightness-hover, 0.9));
filter: brightness(var(--hx-filter-brightness-active, 0.8));
```

`--hx-filter-brightness-hover` and `--hx-filter-brightness-active` are not part of the documented `--hx-*` token system. They appear to be undeclared component-level tokens used only here. The fallback values (`0.9`, `0.8`) are raw numbers — not token references. This violates the "No hardcoded values" rule since the fallback path is always a hardcoded raw number.

---

#### P2 — Success state CSS change is color-only with no background or icon contrast change

**File:** `hx-copy-button.styles.ts:77-79`

```css
.button--copied {
  color: var(--hx-color-success-500, var(--hx-color-primary-500));
}
```

The success state only changes the text/icon color. There is no background color change, border change, or any other secondary cue. In healthcare contexts where color-blindness is a documented concern (WCAG 1.4.1 — use of color), a color-only success state fails to provide sufficient visual differentiation for users with red-green color blindness. A secondary indicator (icon change via slots is good, but the CSS state has no non-color visual change).

---

#### P2 — `:hover:not([disabled])` is functionally redundant

**File:** `hx-copy-button.styles.ts:44-46`

```css
.button:hover:not([disabled]) {
  filter: brightness(var(--hx-filter-brightness-hover, 0.9));
}
```

Since `:host([disabled])` sets `pointer-events: none` on the host, the hover state on the internal button is unreachable when disabled. The `:not([disabled])` guard is redundant. While harmless, it creates confusing specificity that could conflict with consumer CSS overrides on `::part(button)`.

---

## 6. Performance

### PASS

**Bundle analysis:**
- Raw: 6,315 bytes (unminified, with shared chunk)
- Gzip: ~2,161 bytes
- **Result: PASS — well under 5KB (min+gz) threshold**

### Findings

#### P2 — `execCommand` fallback forces synchronous DOM reflow

**File:** `hx-copy-button.ts:106-113`

```ts
const textarea = document.createElement('textarea');
document.body.appendChild(textarea);   // forces reflow
textarea.select();
document.execCommand('copy');
document.body.removeChild(textarea);
```

The `document.body.appendChild` / `removeChild` pattern triggers a synchronous layout reflow in all browsers. For an async copy operation this is minor, but in Drupal contexts with complex page layouts, appending to `document.body` can be expensive. The textarea is also appended to `document.body`, not inside the shadow DOM, which means it exists in the global layout context and could briefly affect scroll position on some browsers.

---

## 7. Drupal

### FAIL

**Strengths:**
- The component is declarative and can be used in Twig templates.
- No JavaScript initialization required; the Web Component self-registers.
- `disabled` attribute is boolean-compatible with Twig `{{ 'disabled' if condition }}`.

### Findings

#### P1 — No Twig template provided

No `hx-copy-button.html.twig` exists in `testing/drupal/templates/`. Other components (hx-button, hx-card) have integration templates. The absence means Drupal developers have no reference for how to wire up `value`, `label`, and `feedback-duration` from a Drupal field or block. This is a documentation gap that blocks adoption in the primary consumer (Drupal CMS).

---

#### P2 — Twig auto-escaping may corrupt `value` attribute contents

**File:** `hx-copy-button.ts:44-45` and Drupal integration

When `value` is populated from a Drupal field in Twig:

```twig
<hx-copy-button value="{{ node.field_patient_mrn.value }}">
```

Twig's `autoescape` will HTML-encode special characters: `&` → `&amp;`, `<` → `&lt;`, `"` → `&quot;`. The component reads the attribute as a raw string via `@property({ type: String })`, which means the clipboard will receive the HTML-encoded string (`MRN&amp;ABC`) rather than the intended raw value (`MRN&ABC`). Drupal developers must use `|raw` filter (a security risk) or the component must decode HTML entities from the `value` attribute.

---

#### P2 — `hx-size` attribute naming compatibility in Drupal

The `hx-size` attribute uses a hyphenated prefix that conflicts with no known Drupal attribute processor, but this is undocumented. Some Drupal contrib modules strip or namespace unknown attributes for security. Without a Twig template showing the correct attribute name, developers may incorrectly use `size` instead of `hx-size`, silently using the default size.

---

## Cross-Cutting Concerns

### P1 — Silent clipboard failure provides no user feedback

**File:** `hx-copy-button.ts:127-133`

```ts
private async _performCopy(): Promise<void> {
  try {
    await this._copyToClipboard();
  } catch {
    // Copy failed silently; do not enter success state.
    return;
  }
```

When the clipboard write fails (permissions denied, iframe restrictions, browser security policy), the component silently returns. The user receives no feedback that the copy failed — no error state, no `hx-copy-error` event, no live region announcement. In a healthcare workflow where a clinician copies a medication order or patient ID and pastes it elsewhere, a silent failure could result in pasting outdated clipboard contents without realizing the copy failed.

**Required:** At minimum, dispatch an `hx-copy-error` event and announce failure via the `aria-live` region.

---

## Verdict

**DO NOT MERGE until P1 issues are resolved.**

Priority order for fixes:
1. **[CSS]** Double opacity on disabled — visual defect, easy fix
2. **[TypeScript/Logic]** `execCommand` return value not checked — silent failure risk
3. **[Cross-cutting]** No error state/event on clipboard failure — patient safety
4. **[A11y]** `aria-label` not updated during copied state — WCAG 1.3.1
5. **[Tests]** Missing clipboard rejection test — required by audit spec
6. **[Tests]** Keyboard tests use `.click()` not real key events — false coverage
7. **[Storybook]** Missing "copied state" story — required by audit spec
8. **[Drupal]** Missing Twig template — blocks primary consumer adoption
