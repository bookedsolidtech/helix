# AUDIT: `hx-field` — Antagonistic Quality Review

**Auditor:** Automated antagonistic review agent (T1-15)
**Date:** 2026-03-05
**Audit scope:** `packages/hx-library/src/components/hx-field/`
**Severity scale:** P0 = blocker/data-loss, P1 = high/accessibility/correctness, P2 = medium/UX/polish

**Deep Audit Status:** COMPLETE (2026-03-11)
**All 7 quality gates:** PASS
**Test coverage:** 74 tests, all passing
**Axe-core:** 8 WCAG 2.1 AA audits, zero violations

---

## Summary

`hx-field` is a layout wrapper for slotted form controls — label, control, help text, and error message. The implementation is architecturally sound and the test coverage is broad. No P0 issues were found. All P1 and P2 issues identified in the original audit have been resolved.

### Resolution Status

| Issue | Status | Resolution |
|-------|--------|------------|
| P1-01 | FIXED | Removed conflicting `aria-live="polite"` from `role="alert"` error element |
| P1-02 | FIXED | Added `_handleLabelClick` to focus slotted control on label click |
| P1-03 | FIXED | Added `field__error-slot-announcer` with `aria-live="assertive"` for slotted error content |
| P1-04 | FIXED | Added `data-aria-managed` opt-out attribute for third-party custom elements |
| P1-05 | FIXED | SlottedLabel story demonstrates `for`/`id` linkage; docs warn about manual association |
| P1-06 | FIXED | Test added for `aria-invalid` with error slot content (line 570) |
| P2-01 | FIXED | Console warning on invalid `hxSize` values |
| P2-02 | FIXED | `--hx-field-help-text-color` token added |
| P2-03 | FIXED | Help text font size scales with `hxSize` variant (sm/lg CSS rules) |
| P2-04 | FIXED | `.field__control` uses `display: block` instead of `display: contents` |
| P2-05 | FIXED | `--hx-field-gap` token added |
| P2-06 | FIXED | `layout="inline"` variant implemented |
| P2-07 | FIXED | ARIA tests for textarea and select added (4 tests) |
| P2-08 | FIXED | Invalid hxSize attribute test added (2 tests) |
| P2-09 | FIXED | WrappingTextarea Storybook story added |
| P2-10 | FIXED | Light DOM side effect documented in JSDoc and Starlight docs |
| P2-11 | FIXED | `crypto.randomUUID()` used instead of `Math.random()` |
| P2-12 | FIXED | Error state outline added to `.field--error .field__control` |
| P2-13 | FIXED | SlottedLabel story demonstrates `for`/`id` linkage |
| P2-14 | FIXED | SlottedError story uses `role="alert"` without conflicting `aria-live` |
| P2-15 | FIXED | Drupal/Twig integration example in Starlight docs

---

## P1 — High Priority

### P1-01 · `role="alert"` + `aria-live="polite"` conflict on error element

**File:** `hx-field.ts:298–301`

The error `<div>` is rendered with both `role="alert"` and `aria-live="polite"`:

```html
<div role="alert" aria-live="polite" ...>
```

`role="alert"` carries an implicit `aria-live="assertive"`. Specifying `aria-live="polite"` on the same element creates a conflict. Browser and screen reader behavior when these two attributes disagree is inconsistent across AT/browser combinations. The ARIA spec states the explicit `aria-live` attribute takes precedence, effectively downgrading the assertive alert to a polite region — which may cause error announcements to be queued behind other live-region updates and delayed. This is particularly risky in healthcare forms where validation errors must be announced immediately.

**Expected:** Use `role="alert"` alone (assertive, fires immediately), or `aria-live="assertive"` alone, or `role="status"` + `aria-live="polite"` for non-critical feedback.

---

### P1-02 · Clicking the shadow-DOM `<label>` does not focus the slotted input

**File:** `hx-field.ts:265–276`, `hx-field.test.ts` (absent)

When `label` prop is set, a `<label>` element is rendered inside the shadow root. Slotted inputs live in the light DOM. Because `for`/`id` cannot cross shadow DOM boundaries, clicking the rendered label **does not** focus or activate the slotted control. The component mitigates this via `aria-label` on the slotted control (screen readers hear the label name), but the click-to-focus behavior — a standard UX expectation for form labels — is silently broken.

No test covers label-click-to-focus behavior. No documentation warns consumers that click activation is non-functional.

**Impact:** Users relying on label click to focus inputs (motor-impairment accommodations, touch targets) are affected. This is a WCAG 2.5.3 violation candidate and a UX regression for all users.

---

### P1-03 · Slotted error content has no enforced `role="alert"` — silent footgun

**File:** `hx-field.ts:290–304`, `hx-field.stories.ts:318–342`

When consumers use the `error` slot instead of the `error` property, the component sets `aria-invalid="true"` on the slotted control and applies `field--error` CSS class. However, the **wrapper element for the error slot has no `aria-live` or `role="alert"` applied**. Slot content is not automatically announced by screen readers when it appears dynamically.

The `SlottedError` story manually adds `role="alert" aria-live="polite"` to the custom error element — illustrating the pattern — but nothing in the component, documentation, or tests enforces this. A consumer who uses `slot="error"` without `role="alert"` on their content will have a visually visible error that screen readers never announce.

**Expected:** The shadow DOM slot wrapper element for `error` should have `aria-live="assertive"` (or at minimum the component docs should prominently warn consumers to add `role="alert"` to slotted error content).

---

### P1-04 · Third-party custom elements (non-`HX-` prefixed) receive ARIA attrs without consent

**File:** `hx-field.ts:186–240`, specifically `isFormControl` at lines 11–13 and the HX-skip guard at line 208

`isFormControl()` returns `true` for any element whose tag contains `-` (i.e., any custom element). `_syncSlottedControl()` then sets `aria-label`, `aria-required`, `aria-invalid`, and `aria-describedby` directly on the element — but only skips this for `HX-` prefixed elements (line 208).

A third-party custom element (e.g., `<sl-input>`, `<md-text-field>`, `<vaadin-text-field>`) wrapped in `hx-field` will have these ARIA attributes mutated without its knowledge. Those components manage their own ARIA internally and may:
- Override `aria-label` with their own value on next render, causing a race
- Not expect `aria-invalid` directly on the host (they may use it internally on a shadow `<input>`)
- Reject or ignore `aria-required` on the host

**Expected:** The skip guard should be configurable (e.g., an `aria-managed` attribute on the slotted control opts out), or the behavior should be documented with a warning that non-HX custom elements may be incompatible.

---

### P1-05 · Slotted label has no programmatic association with slotted control

**File:** `hx-field.ts:263–278`, `hx-field.stories.ts:285–312`

When a consumer provides a custom label via `slot="label"`, the component correctly removes `aria-label` from the slotted control (because `_hasLabelSlot` is true). However, it provides **no mechanism or documentation for the consumer to associate their slotted `<label>` with the slotted control**.

The `SlottedLabel` story slots a `<label>` element but does not show `for`/`id` linkage to the slotted `<input>`. Because both the label and input are in the same light DOM scope, `for`/`id` association **would work** — but the story doesn't demonstrate it, and the slot docs don't mention it. A consumer following the example would ship an inaccessible form.

**Expected:** The `SlottedLabel` story and slot documentation must demonstrate and require `for`/`id` association between the slotted label and the slotted control.

---

### P1-06 · No test verifying `aria-invalid` when using the `error` slot (not the `error` property)

**File:** `hx-field.test.ts:431–561` (ARIA management tests)

All ARIA management tests use the `error` property to trigger the error state. There is no test verifying that `aria-invalid="true"` is set on the slotted control when the error slot has content (i.e., `_hasErrorSlot = true`). The code does handle this — `hasError = !!this.error || this._hasErrorSlot` — but the slot-driven path has zero test coverage.

**Gap:** If a regression broke `_hasErrorSlot` tracking, `aria-invalid` would not be set when using the slot, and no test would catch it.

---

## P2 — Medium Priority

### P2-01 · `hxSize` property accepts invalid values silently

**File:** `hx-field.ts:89–91`

```ts
hxSize: 'sm' | 'md' | 'lg' = 'md';
```

TypeScript enforces this at compile time, but the reflected attribute `hx-size` can be set to any string at runtime (e.g., from Drupal Twig or dynamic JS). An invalid value (e.g., `hx-size="xl"`) would result in no size class being applied and no console warning. The default `'md'` class would also not apply since the class map condition would evaluate false for `hxSize === 'md'` (the runtime value would be `'xl'`). All three size classes would be absent.

---

### P2-02 · `--hx-field-help-text-color` token missing

**File:** `hx-field.styles.ts:63–67`

Help text color is hardcoded to `var(--hx-color-neutral-500, #6b7280)`. Label color exposes `--hx-field-label-color`, error color exposes `--hx-field-error-color`, and font family exposes `--hx-field-font-family`. Help text has no corresponding component-level token. Consumers cannot restyle help text color without using `::part(help-text)`.

This is an inconsistency in the component token API.

---

### P2-03 · Help text font size does not scale with `hxSize` variant

**File:** `hx-field.styles.ts:52–59`, `hx-field.styles.ts:63–67`

The size variants (`sm`/`lg`) only modify `.field__label` font size. `.field__help-text` always uses `var(--hx-font-size-xs, 0.75rem)`. In a `hx-size="lg"` field, the label is `1rem` but the help text remains `0.75rem` — a typographic inconsistency. Similar issue for `hx-size="sm"` where label is `0.75rem` and help text is also `0.75rem` — no visual distinction.

---

### P2-04 · `::part(control)` uses `display: contents` — layout CSS parts non-functional

**File:** `hx-field.styles.ts:46–49`

```css
.field__control {
  display: contents;
}
```

The `control` CSS part is on this element. `display: contents` removes the element from the layout box tree — meaning consumers using `hx-field::part(control)` cannot apply `width`, `background`, `padding`, `border`, or any other box-model properties because the element has no layout box to apply them to. The part is effectively non-styleable for layout purposes.

Same issue applies to `.field__label-wrapper` (though this element has no CSS part).

---

### P2-05 · No `--hx-field-gap` token for spacing control

**File:** `hx-field.styles.ts:19–22`

```css
gap: var(--hx-space-1, 0.25rem);
```

The vertical gap between field segments uses a global spacing primitive token directly. Consumers cannot adjust field-internal spacing without overriding the `--hx-space-1` global token (which would affect all components using it). A component-level `--hx-field-gap` token is missing.

---

### P2-06 · No inline/horizontal label layout variant

**File:** `hx-field.styles.ts`

The feature description calls out "label above/inline" as an audit area. The component only supports vertical (column flex) layout. There is no `layout="inline"` or similar variant for side-by-side label + control arrangements common in healthcare form grids.

---

### P2-07 · No test for `textarea` or `select` as slotted control in ARIA management tests

**File:** `hx-field.test.ts:432–561`

All ARIA management tests use `<input type="text">`. There are no tests for:
- `<textarea>` as the slotted control (verifying `aria-label`, `aria-invalid`, etc.)
- `<select>` as the slotted control
- `<input type="checkbox">` or `<input type="radio">` (where `aria-label` vs native label association has different semantics)

The `WrappingNativeSelect` Storybook story exists but has no corresponding ARIA assertion test in the test file.

---

### P2-08 · No test for `hxSize` with invalid attribute value

**File:** `hx-field.test.ts`

No test verifies what happens when an invalid `hx-size` attribute value is set (e.g., `hx-size="xl"`). Per P2-01, all three size classes would be absent. The test suite would not catch a regression where the default size class behavior changes.

---

### P2-09 · No Storybook story for `<textarea>` as slotted control

**File:** `hx-field.stories.ts`

Stories cover: `<input>` (various types), `<select>`, custom element. No story demonstrates `<textarea>` as the slotted control, which is a common real-world use case in healthcare forms (e.g., clinical notes, patient history).

---

### P2-10 · `_a11yDescEl` is an undocumented light DOM side effect

**File:** `hx-field.ts:128–171`

`connectedCallback` injects a `<span>` into the component's light DOM children:

```ts
this.appendChild(span);
```

This is a necessary workaround for the ARIA cross-shadow-DOM limitation, but it is an undocumented side effect. Consumers who enumerate children of `hx-field` (e.g., `el.children`, `el.querySelectorAll(':scope > *')`) will find this unexpected span. The span has a visually-hidden style but no `aria-hidden="true"` — it is intentionally in the accessibility tree to serve as the description anchor.

**Note:** The span IS correctly cleaned up on `disconnectedCallback`. The issue is only the undocumented light DOM mutation.

---

### P2-11 · `Math.random()` for ID generation — non-deterministic, not cryptographically safe

**File:** `hx-field.ts:115`

```ts
private _fieldId = `hx-field-${Math.random().toString(36).slice(2, 9)}`;
```

`Math.random()` is not cryptographically random and produces 7-character base-36 IDs (~36^7 ≈ 78 billion combinations). In SSR or high-volume form rendering scenarios, collision probability is non-trivial. `crypto.randomUUID()` is available in all modern browsers and Node 14.17+ and would eliminate this concern.

---

### P2-12 · Error state has no visual indicator on the control wrapper area

**File:** `hx-field.styles.ts:76–79`

```css
.field--error .field__label {
  color: var(--hx-field-error-color, ...);
}
```

The only CSS change in error state is the label color changing to red. The `.field__control` wrapper area receives no error styling. In a design system pattern, error state typically also includes a colored border or background on the control wrapper to reinforce the invalid state visually, separate from the error message text. This may be intentional (relying on the slotted control to show its own error border), but it's worth flagging as a potential design gap, especially when using non-native controls that don't handle their own error styling.

---

### P2-13 · `SlottedLabel` story does not demonstrate `for`/`id` linkage

**File:** `hx-field.stories.ts:285–312`

The `SlottedLabel` story renders a `<label>` in the `label` slot alongside an `<input>` in the default slot. The label element is NOT linked to the input via `for`/`id`. Because both elements are in the same light DOM, `for`/`id` association would work correctly — but the story fails to demonstrate it. Consumers following this story as a template would ship an inaccessible implementation.

---

### P2-14 · `SlottedError` story replicates the `role="alert"` + `aria-live="polite"` conflict

**File:** `hx-field.stories.ts:328–340`

The `SlottedError` story's custom error element uses both `role="alert"` and `aria-live="polite"`. This is the same pattern as P1-01. Since stories serve as consumer documentation, this propagates the problematic pattern to downstream implementations.

---

### P2-15 · No Drupal/Twig example in documentation

**File:** Component lacks a Drupal integration example

The component docs and Storybook contain no Twig template example. The component IS naturally Drupal-compatible (slot-based, no JS-only API required for basic use), but there is no example demonstrating:
- Rendering `hx-field` from a Twig template with a slotted native input
- Passing `error`, `label`, `required`, `help-text` attributes from Drupal field data
- Using Drupal Behaviors to programmatically set `error` on validation failure

Given the primary consumer of this library is Drupal, this omission represents a documentation gap for integrators.

---

## Positive Observations

- **Shadow DOM ARIA bridging pattern** (`aria-label`, `aria-invalid`, `aria-required` on slotted control) is correctly implemented for native elements and well-tested.
- **Light DOM description anchor** (`_a11yDescEl`) is a sophisticated and correct solution to the cross-shadow-root `aria-describedby` limitation.
- **Required indicator** correctly uses `aria-hidden="true"` on the asterisk span.
- **Error/help mutual exclusion** is correctly implemented and tested.
- **Lifecycle cleanup** (`disconnectedCallback`) correctly removes all injected ARIA attrs and the description span.
- **Test coverage is broad** (62 test cases across rendering, properties, slots, ARIA management, CSS parts, lifecycle, and accessibility).
- **Bundle size:** Source is ~12.7KB raw, ~5.7KB minified (pre-gzip). As a layout wrapper with no heavy dependencies, this is well within the <5KB min+gz budget (estimated ~2–3KB gzipped).
- **Token usage:** All colors, spacing, and typography use `--hx-*` tokens with hardcoded fallbacks. No hardcoded values.

---

## Issue Count

| Severity | Count |
|----------|-------|
| P0       | 0     |
| P1       | 6     |
| P2       | 15    |
| **Total**| **21**|
