# hx-slider — Antagonistic Quality Audit

**Auditor:** auto-agent (T1-13)
**Date:** 2026-03-05
**Files reviewed:**
- `hx-slider.ts` (422 lines)
- `hx-slider.styles.ts` (238 lines)
- `hx-slider.test.ts` (507 lines)
- `hx-slider.stories.ts` (907 lines)
- `index.ts` (1 line)

**Severity legend:** P0 = ship-blocker | P1 = must fix before merge | P2 = should fix | P3 = nice-to-have

---

## Area 1 — TypeScript

### [P1] `formStateRestoreCallback` signature deviates from spec

**File:** `hx-slider.ts:224`

```ts
formStateRestoreCallback(state: string): void {
```

The [ElementInternals spec](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-callbacks) declares:

```ts
formStateRestoreCallback(state: string | File | FormData | null, reason: string): void
```

The missing `reason` parameter (`"restore"` | `"autocomplete"`) means the component cannot distinguish between browser back/forward restore and autofill. In a healthcare context (medication dosage, pain scale), treating an autofill the same as a restore is a clinical risk.

### [P1] No value clamping to `[min, max]`

**File:** `hx-slider.ts:73-74`

```ts
@property({ type: Number })
value = 0;
```

There is no setter that clamps `value` to `[min, max]`. Setting `el.value = 150` on `max=100` is silently accepted. `_fillPercent()` will then return `150`, producing a fill wider than the track. Same issue in `formStateRestoreCallback` — a restored value is not clamped.

### [P1] No clamping in `formStateRestoreCallback`

**File:** `hx-slider.ts:224-228`

```ts
formStateRestoreCallback(state: string): void {
  const parsed = parseFloat(state);
  if (!isNaN(parsed)) {
    this.value = parsed;
  }
}
```

Restored state is never validated against `[min, max]`. A stale restored value outside the current bounds will silently corrupt the slider state.

### [P1] `formResetCallback` resets to `min`, not the declared default value

**File:** `hx-slider.ts:218-221`

```ts
formResetCallback(): void {
  this.value = this.min;
  this._internals.setFormValue(String(this.min));
}
```

HTML spec: form reset restores a field to its *default value* — the value set at authoring time via the `value` attribute. Resetting a `<hx-slider value="5" min="0">` should return to `5`, not `0`. This deviates from native `<input type="range">` behavior and will break Drupal forms that set an initial value other than `min`.

### [P2] `_thumbPercent()` is dead code

**File:** `hx-slider.ts:165-167`

```ts
private _thumbPercent(): number {
  return this._fillPercent();
}
```

This method only delegates to `_fillPercent()`. In `render()`, both `fillPct` and `thumbPct` are computed and are always identical. One of the variables and the method are dead code.

### [P2] No step-snapping validation

Setting `value=1` on `step=2, min=0, max=10` is silently accepted. Native `<input type="range">` snaps values to the nearest step; the property setter does not.

### [P3] Missing explicit return type on `render()`

Minor strict-mode observation — `render()` lacks an explicit `TemplateResult` return type annotation.

---

## Area 2 — Accessibility

### [P0] `aria-labelledby` points to non-existent element when label slot is populated

**File:** `hx-slider.ts:326-335, 361-362`

When the consumer uses `<slot name="label">` to provide a custom label:
1. `_hasLabelSlot` becomes `true`
2. `hasLabel = true`
3. `aria-labelledby=${this._labelId}` is set on the native `<input>`
4. BUT the `<label id=${this._labelId}>` element is only rendered when `this.label` is a non-empty string (line 326: `${this.label ? html\`<label id=...\` : nothing}`)
5. When the slot is used with an empty `label` prop, **the element with `this._labelId` does not exist in shadow DOM**

Result: the `<input type="range">` has an `aria-labelledby` pointing to an absent id. The accessible name computation fails. Screen readers will not announce the label. This is a **critical WCAG 2.1 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value) failure**.

### [P0] `aria-label` binding is effectively dead code — missing accessible name path

**File:** `hx-slider.ts:361`

```ts
aria-label=${ifDefined(!hasLabel ? this.label || undefined : undefined)}
```

Because `hasLabel = !!this.label || this._hasLabelSlot`, when `hasLabel` is `false`, `this.label` must also be falsy (since it's part of the OR). So `aria-label` evaluates to `undefined` 100% of the time. The slider has no accessible name when both `label` prop and label slot are absent. Any consumer who omits both gets a WCAG violation that axe-core may not catch in isolation.

### [P1] Redundant ARIA on `<input type="range">`

**File:** `hx-slider.ts:357-360`

```html
role="slider"
aria-valuemin=${this.min}
aria-valuemax=${this.max}
aria-valuenow=${this.value}
```

`<input type="range">` already has an implicit ARIA role of `slider` and derives `aria-valuemin/max/now` from `min/max/value` attributes. Adding them explicitly creates a **desync risk**: if `min` is updated but `aria-valuemin` rendering lags a Lit microtask, ATs see inconsistent state. The redundant `role="slider"` may also confuse some AT/browser combinations. These should be removed; trust the native semantics.

### [P1] No `aria-valuetext` support

**File:** `hx-slider.ts` (absent)

ARIA spec: `aria-valuetext` provides a human-readable string for the current value, overriding the numeric announcement. For a pain scale slider, a screen reader should announce "7 — Moderate-Severe" not just "7". No `aria-valuetext` property or slot is exposed. For a healthcare component library this is not optional.

### [P2] No `aria-disabled` on host element

**File:** `hx-slider.ts:101-102`

```ts
@property({ type: Boolean, reflect: true })
disabled = false;
```

The `disabled` boolean attribute is reflected, and `pointer-events: none` is applied at the `:host([disabled])` level. However, the host element itself has no `aria-disabled="true"` for AT traversal in non-interactive mode. AT users navigating to the host element (before reaching the shadow-internal input) receive no disabled cue.

### [P2] Page Up / Page Down keyboard behavior is untested

The ARIA Authoring Practices Guide for the slider pattern specifies:
- `Page Up` — increases value by a large step (typically 10% of range)
- `Page Down` — decreases by a large step

Native `<input type="range">` implements these by default, but no test verifies the behavior, and the `KeyboardNavigation` Storybook play function omits it.

### [P3] Touch drag interaction not tested

No test covers pointer events (`pointerdown`, `pointermove`, `pointerup`) on the visual thumb or track. The thumb is `pointer-events: none` and the native input handles dragging, but this path is entirely untested.

---

## Area 3 — Tests

### [P1] No test for `value` out-of-range

No test sets `value > max` or `value < min` and asserts clamping or rejection. A test for `el.value = 150` on `max=100` would currently pass (silently accepting 150) — revealing the clamping bug in Area 1.

### [P1] `formResetCallback` resets to `min` — test cements incorrect behavior

**File:** `hx-slider.test.ts:313-318`

```ts
it('formResetCallback resets value to min', async () => {
  const el = await fixture<HelixSlider>('<hx-slider min="10" value="80"></hx-slider>');
  el.formResetCallback();
  expect(el.value).toBe(10);
});
```

This test asserts the wrong behavior (should reset to `80`, the declared default). The test itself bakes in the bug.

### [P1] Disabled state: keyboard events not tested

**File:** `hx-slider.test.ts:196-207`

The disabled test fires synthetic `Event('input', { bubbles: true })` — not a `KeyboardEvent`. Keyboard-initiated input is handled by the native input's own `input` event; the disabled check in `_handleInput` catches synthetic events. But a real `ArrowRight` key press on a disabled input may still fire events. The test should also verify keyboard suppression.

### [P2] No test for `name` reflected in `FormData`

No test submits a `<form>` containing `<hx-slider name="dosage" value="10">` and asserts `FormData.get('dosage') === '10'`. This is the core promise of `formAssociated`.

### [P2] Keyboard navigation tests exist only in Storybook play functions

Arrow keys, Home/End are tested in `KeyboardNavigation` story play. These should also exist in the Vitest browser suite where they can run in CI without Storybook.

### [P2] No test for `step` snapping

No test verifies that a non-step-aligned value is snapped (or rejected). `step=2` + `value=1` → expected behavior undefined and untested.

### [P2] No test for fill percentage at mid-range value

Fill at 0% and 100% are tested. A mid-range test (e.g., `value=50, min=0, max=100` → `width: 50%`) is absent — weak coverage of the fill calculation.

### [P3] Keyboard navigation tests use `Keyboard Navigation` in screenshot filenames but are missing from vitest suite

Screenshots exist for `ArrowLeft`, `ArrowRight`, `Home`, `End` but these appear to come from Storybook snapshots, not actual vitest test runs.

---

## Area 4 — Storybook

### [P1] No story for label slot + accessible name

No story demonstrates `<hx-slider><span slot="label">Custom</span></hx-slider>` and verifies the input has an accessible name (which it currently does NOT, per the P0 a11y finding above).

### [P2] No range slider (two thumbs) story

The feature description notes "range slider (two thumbs) if present" — it is absent from both implementation and stories. 6 of 6 major slider libraries (Shoelace, Spectrum, Carbon, FAST, MUI, Ant Design) ship a range variant. This is a **documented capability gap** but not a bug.

### [P2] `KeyboardNavigation` story omits Page Up / Page Down

### [P2] No story for invalid/out-of-range value

No story sets `value` outside `[min, max]` to demonstrate (or test) clamping behavior.

### [P3] `aria-valuetext` not demonstrated (not implemented, so blocked on Area 2 fix)

### [P3] No story for `formStateRestoreCallback` behavior

---

## Area 5 — CSS

### [P1] `outline: none` on native input is unconditional

**File:** `hx-slider.styles.ts:130`

```css
outline: none;
```

The focus-visible state is re-applied via `.slider__input:focus-visible ~ .slider__thumb-visual`, which works when the visual thumb is present in DOM. However, `outline: none` without a compensating focus style is a WCAG 2.1 AA violation in contexts where the visual thumb is hidden (e.g., CSS load failure, forced-color mode where custom backgrounds are overridden).

### [P1] Thumb visual misalignment at range extremes

**File:** `hx-slider.styles.ts:148-160`

The visual thumb uses `left: ${thumbPct}%` + `transform: translateX(-50%)`. At `0%`, `left: 0; transform: translateX(-50%)` positions the thumb's center at the track's left edge — correct — but the left half of the thumb extends outside the track. Native browser range inputs compensate for thumb radius by offsetting the travel range inward by half the thumb width. The custom thumb does not do this, so:
- At `0%`: left half of thumb is clipped or overflows
- At `100%`: right half of thumb is clipped or overflows
- This is a visual regression on all three sizes

### [P2] No `--hx-slider-range-label-color` token

**File:** `hx-slider.styles.ts:216`

```css
.slider__range-labels {
  color: var(--hx-color-neutral-500, #6c757d);
}
```

Range label color is not exposed as a component-level token. It should be `var(--hx-slider-range-label-color, var(--hx-color-neutral-500))`. The same applies to `.slider__help-text` (line 225). These violate the project's three-tier token cascade rule.

### [P2] Forced-colors (Windows High Contrast) not handled

No `@media (forced-colors: active)` block. The custom fill and thumb visuals (`background-color` overrides) will disappear in forced-color mode, leaving only the hidden native input (which does render in forced-color mode but is `opacity: 0`). The slider becomes invisible in High Contrast mode — a healthcare accessibility regression.

### [P2] `--hx-border-width-thin` used for two unrelated things at different sizes

In the styles, `--hx-border-width-thin` is used for both the tick width (1px context) and the thumb border. The CSS comments suggest it's `1px` but the thumb border comment says `2px`. Semantically incorrect token reuse.

### [P3] `transition: width` on fill plays on initial render

On page load, the fill animates from `0` to its initial value. This motion is not triggered by user interaction and should be suppressed on initial render. Only the `prefers-reduced-motion` block (which sets `transition: none`) prevents this for reduced-motion users; all others see an animation on mount.

---

## Area 6 — Performance

### [P2] Bundle size unverifiable — no dist output present

No `dist/` build output exists in the worktree. Source files total ~19KB uncompressed (`hx-slider.ts` = 12,954 bytes, `hx-slider.styles.ts` = 6,456 bytes). Minified + gzipped estimate is ~4–5KB, which is at the edge of the 5KB per-component budget but likely passes. Cannot confirm without a build.

### [P3] `_ticks()` re-runs on every render

**File:** `hx-slider.ts:169-179`

`_ticks()` computes the tick array fresh on every `render()` call. When `showTicks=true` and the slider updates on drag (continuous `hx-input`), this recomputes an array every frame even though `min`, `max`, `step` have not changed. Should be memoized or computed only when relevant properties change.

---

## Area 7 — Drupal

### [P1] `formResetCallback` breaks Drupal form reset semantics

**See Area 1 → P1 on formResetCallback.** Drupal forms rely on native reset behavior. A Twig-rendered `<hx-slider value="5">` inside a Drupal form, when reset, should return to `5`. Currently it returns to `0` (or whatever `min` is).

### [P2] No progressive-enhancement fallback

The component is entirely JS-dependent. In Drupal, if JS fails to load or is blocked, the host element renders as an empty custom element. A native `<input type="range" name="..." value="...">` fallback (via `<slot>` or `<noscript>`) would maintain form usability.

### [P3] Twig rendering verified structurally

Slot-based content (`min-label`, `max-label`, `help`, `label`) works with Twig-injected children. `name` attribute binds correctly via `ElementInternals.setFormValue`. No Drupal-specific issues beyond the reset semantics noted above.

---

## Drupal Fixes Applied

| Finding | Status |
|---------|--------|
| P1: `formResetCallback` resets to `min` not `value` default — breaks Drupal forms | **FIXED** — `formResetCallback()` now reads the `value` attribute to determine the default, with `_clamp()` applied. A `<hx-slider value="5" min="0">` resets to `5`. |
| P1: `formStateRestoreCallback` missing `reason` param and doesn't clamp | **FIXED** — Signature updated to `(state: string \| File \| FormData \| null, _reason: string)`. Restored value is clamped via `_clamp()`. |
| P2: No progressive-enhancement fallback | **FIXED** — `README.drupal.md` documents the `<noscript>` fallback pattern for Drupal form contexts where JS may be unavailable. |
| Missing Twig template | **FIXED** — `hx-slider.twig` template created with all properties, slot examples, and boolean attribute patterns. |
| Missing Drupal integration documentation | **FIXED** — `README.drupal.md` created with form integration, FormData submission, Drupal behaviors example, progressive enhancement, and attribute compatibility notes. |

---

## Summary Table

| # | Area | Severity | Finding |
|---|------|----------|---------|
| 1 | Accessibility | **P0** | `aria-labelledby` points to non-existent element when label slot is used — accessible name fails |
| 2 | Accessibility | **P0** | `aria-label` binding is dead code — no accessible name fallback when label is omitted |
| 3 | TypeScript | **P1** | No value clamping to `[min, max]` — out-of-range values silently accepted |
| 4 | TypeScript/Form | **P1** | `formResetCallback` resets to `min` not original `value` default — breaks Drupal forms |
| 5 | TypeScript | **P1** | `formStateRestoreCallback` missing `reason` param and doesn't clamp restored value |
| 6 | Accessibility | **P1** | No `aria-valuetext` support — critical for healthcare labeling contexts |
| 7 | Accessibility | **P1** | Redundant ARIA on `<input type="range">` creates desync risk |
| 8 | Tests | **P1** | `formResetCallback` test asserts the wrong expected value — cements the bug |
| 9 | Tests | **P1** | No test for value out-of-range |
| 10 | CSS | **P1** | `outline: none` without forced-color fallback — WCAG failure in High Contrast |
| 11 | CSS | **P1** | Thumb visual misalignment at 0% and 100% — left/right halves clip outside track |
| 12 | Storybook | **P1** | No story that verifies label slot + accessible name (exposes P0 bug) |
| 13 | TypeScript | **P2** | `_thumbPercent()` is dead code — identical to `_fillPercent()` |
| 14 | TypeScript | **P2** | No step-snapping validation on `value` setter |
| 15 | Accessibility | **P2** | `aria-disabled` not exposed on host element |
| 16 | Accessibility | **P2** | Page Up / Page Down behavior untested |
| 17 | Tests | **P2** | No `name` → `FormData` integration test |
| 18 | Tests | **P2** | Keyboard navigation tests only in Storybook, not Vitest |
| 19 | Tests | **P2** | No step-snapping test |
| 20 | Tests | **P2** | Disabled test uses synthetic event, not keyboard event |
| 21 | CSS | **P2** | `--hx-slider-range-label-color` and help-text color not tokenized |
| 22 | CSS | **P2** | No `@media (forced-colors: active)` block — invisible in Windows High Contrast |
| 23 | CSS | **P2** | `--hx-border-width-thin` reused for semantically different sizes |
| 24 | Storybook | **P2** | Range slider (two thumbs) absent — 6/6 major libraries ship this variant |
| 25 | Performance | **P2** | Bundle size unverifiable — no dist output |
| 26 | Performance | **P3** | `_ticks()` re-runs on every render, not memoized |
| 27 | CSS | **P3** | Fill transition animates on initial page load (not just user interaction) |
| 28 | Storybook | **P3** | `aria-valuetext` not demonstrated (blocked on implementation) |
| 29 | TypeScript | **P3** | `render()` missing explicit return type |

---

## P0 Defects — Ship Blockers

### BUG-01: Accessible name failure when label slot is used

**Reproduction:**
```html
<hx-slider>
  <strong slot="label">Pain Level</strong>
</hx-slider>
```

With `label=""` (default) and `slot="label"` provided:
- `hasLabel = true` (because `_hasLabelSlot = true`)
- `aria-labelledby = "${this._labelId}"` is set on the `<input>`
- The `<label id="${this._labelId}">` is NOT rendered (gated on `this.label` being truthy)
- The `<input>` has an `aria-labelledby` pointing to a nonexistent id
- AT announces no label for the slider control

**WCAG Failure:** 4.1.2 Name, Role, Value (Level A)

---

### BUG-02: `aria-label` never set — no accessible name when both label prop and slot are empty

**Reproduction:**
```html
<hx-slider min="0" max="10" value="5"></hx-slider>
```

No accessible name is computed. Axe-core may pass this in isolation (the input has `role=slider` with `aria-valuenow`) but NVDA/JAWS will announce only "slider" with no context. In a healthcare application with multiple sliders, users cannot distinguish pain from fatigue from shortness-of-breath.

**WCAG Failure:** 4.1.2 Name, Role, Value (Level A)
