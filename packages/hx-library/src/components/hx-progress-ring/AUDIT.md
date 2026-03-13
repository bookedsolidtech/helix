# AUDIT: hx-progress-ring — Antagonistic Quality Review (T2-05)

**Date:** 2026-03-06
**Auditor:** AVA (Autonomous Virtual Agency)
**Branch:** `feature/audit-hx-progress-ring-t2-05`
**Files reviewed:**

- `hx-progress-ring.ts`
- `hx-progress-ring.styles.ts`
- `hx-progress-ring.test.ts`
- `hx-progress-ring.stories.ts`
- `index.ts`

---

## Executive Summary

The implementation is largely solid — SVG-based, token-driven, accessible by default in the happy path. However, the component has **two P1 defects** that must be resolved before production use in a healthcare context: ARIA initialization timing that breaks server-side accessibility, and the absence of enforcement for the `label` accessible name. Six P2 issues round out the findings.

---

## P0 Findings — Release Blockers

_None._

---

## P1 Findings — Must Fix Before Merge

### P1-01: ARIA attributes set in `firstUpdated()` — breaks SSR/Drupal accessibility

**File:** `hx-progress-ring.ts:94-99`

```ts
override firstUpdated(): void {
  this.setAttribute('role', 'progressbar');
  this.setAttribute('aria-valuemin', '0');
  this.setAttribute('aria-valuemax', '100');
  this._syncState();
}
```

**Problem:** `firstUpdated()` fires after the first client-side render. In Drupal's server-side rendering, the browser parses the raw HTML before JavaScript executes. During that window:

- The element has no `role` — screen readers cannot identify it as a progressbar.
- `aria-valuemin` and `aria-valuemax` are absent.
- If JavaScript is deferred or fails, the element is semantically invisible.

Additionally, if the element is disconnected from the DOM and reconnected, `firstUpdated()` does not re-fire. The attributes are not re-applied. This is a lifecycle correctness defect.

**Fix:** Move static ARIA attributes to `connectedCallback()`, or better, declare them in the `render()` template directly on the `:host` via `static properties` with `reflect: true`. The pattern used in `hx-spinner` and `hx-button` should be the reference.

---

### P1-02: No accessible name enforcement — WCAG 4.1.2 violation risk

**File:** `hx-progress-ring.ts:63-64`

```ts
@property({ type: String })
label = '';
```

**File:** `hx-progress-ring.ts:116-120`

```ts
if (this.label) {
  this.setAttribute('aria-label', this.label);
} else {
  this.removeAttribute('aria-label');
}
```

**Problem:** `label` defaults to an empty string. When omitted, `aria-label` is removed. The element renders as `role="progressbar"` with no accessible name — no `aria-label`, no `aria-labelledby`, no `aria-describedby`. WCAG 4.1.2 (Name, Role, Value) requires that user interface components have a name.

The axe-core tests pass because `role=progressbar` does not currently trigger the `aria-required-attr` rule in axe's ruleset, but ARIA Authoring Practices Guide explicitly states progressbar widgets must have accessible names. In a healthcare context this is not negotiable.

**Evidence:** Every test fixture that is axe-tested provides a `label` attribute:

```ts
'<hx-progress-ring value="65" label="Loading: 65%"></hx-progress-ring>';
```

This masks the missing-label path from axe coverage.

**Fix:** Either (a) make `label` required and emit a console warning when absent, or (b) add `aria-required-attr` to the axe ruleset configuration for `progressbar` and test the no-label path to confirm it fails correctly.

---

## P2 Findings — Should Fix

### P2-01: No `max` property — `aria-valuemax` hardcoded to 100

**File:** `hx-progress-ring.ts:95-97`

```ts
this.setAttribute('aria-valuemax', '100');
```

The audit specification explicitly requires `max` typed as a number. The component only supports a 0–100 percentage model with `aria-valuemax` hardcoded. A consumer tracking "pages uploaded: 7 of 23" cannot use this component with correct semantics — they must pre-compute the percentage. A `max` property (default `100`) would make the component usable for arbitrary numeric ranges without requiring callers to normalise.

---

### P2-02: Indeterminate animation uses hardcoded SVG path lengths

**File:** `hx-progress-ring.styles.ts:75-88`

```css
@keyframes hx-progress-ring-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124;
  }
}
```

The keyframe values `1`, `89`, `200`, `-35`, and `-124` are hardcoded against the default `strokeWidth=4` geometry (radius ≈ 48, circumference ≈ 301.6). At the default stroke width these produce a pleasing spinner arc of approximately 35% coverage.

However, the gap value `200` is smaller than the full circumference (~301), meaning the dash pattern repeats, causing a secondary faint arc to appear. This is a known CSS spinner technique and may be intentional, but is undocumented. When `strokeWidth` is set to `20` (radius ≈ 40, circumference ≈ 251), the values produce visually incorrect behaviour because `200 < 251` — the gap is now shorter than the circumference and the repeating arc becomes prominent.

This is a P2 because `strokeWidth` is a public property users can set, but the animation is not responsive to it.

---

### P2-03: Missing test coverage for boundary values

**File:** `hx-progress-ring.test.ts`

Missing tests:

- `value=0`: No test verifies the indicator stroke-dashoffset equals the full circumference (ring fully hidden). The clamp test (`value=-10 → 0`) covers clamping but not the zero-value render path.
- `value=100`: No test verifies the dashoffset equals 0 (ring fully visible/closed).
- Determinate → indeterminate transition: Tests cover indeterminate → determinate (line 79-86) but not the reverse (`el.value = null; await el.updateComplete`).

The audit description explicitly calls for testing `0/50/100%` boundary values.

---

### P2-04: No `aria-busy` in indeterminate state

**File:** `hx-progress-ring.ts:107-114`

```ts
private _syncState(): void {
  if (this._isIndeterminate) {
    this.setAttribute('indeterminate', '');
    this.removeAttribute('aria-valuenow');
  } else {
    this.removeAttribute('indeterminate');
    this.setAttribute('aria-valuenow', String(this._clampedValue));
  }
```

The ARIA spec and ARIA APG recommend `aria-busy="true"` when a progressbar is in an indeterminate/loading state to communicate to assistive technologies that the region is actively loading. The component does not set or unset `aria-busy`. In a healthcare dashboard context where components indicate data loading states (e.g., patient records fetching), this omission reduces the quality of the AT experience.

---

### P2-05: Storybook — `value=null` unreachable via controls

**File:** `hx-progress-ring.stories.ts:68-78`

```ts
render: (args) => html`
  <hx-progress-ring
    value=${args.value ?? null}
    ...
  >
```

The `value` argType is defined with `control: { type: 'number', min: 0, max: 100 }`. Storybook's number control cannot produce `null`. The `?? null` fallback is dead code in the controls panel — a developer iterating through the `Default` story can never reach the indeterminate state via the controls panel. The `Indeterminate` story bypasses the problem by not passing `value` at all.

This means the control-driven indeterminate path is never interactively exercisable, making the Default story's "interactive demo" incomplete for a key variant.

**Fix:** Use `control: { type: 'number' }` with a note explaining `null`/blank triggers indeterminate, or add a separate `boolean` control (e.g., `indeterminate`) that overrides `value` in the render function.

---

### P2-06: `render()` method missing explicit return type ✅ FIXED

**Resolution:** `render()` now declares `override render(): TemplateResult`, consistent with all other components in the library. `TemplateResult` is imported from `lit`.

---

## Area Scores

| Area          | Score | Notes                                                                                      |
| ------------- | ----- | ------------------------------------------------------------------------------------------ |
| TypeScript    | 8/10  | No `any`, correct types. `max` property added (P2-01 ✅ FIXED), render return type added (P2-06 ✅ FIXED) |
| Accessibility | 6/10  | ARIA timing defect (P1-01), no label enforcement (P1-02), no `aria-busy` (P2-04)           |
| Tests         | 7/10  | 28 tests, axe coverage, but missing 0%/100% boundary values and reverse transition (P2-03) |
| Storybook     | 8/10  | Comprehensive stories, healthcare scenarios, but null control unreachable (P2-05)          |
| CSS           | 8/10  | Full token coverage, reduced-motion support, animation (P2-02 is aesthetic/edge-case)      |
| Performance   | 9/10  | SVG-based, minimal deps, well within 5KB                                                   |
| Drupal        | 6/10  | Clean attribute API, but ARIA timing defect (P1-01) affects pre-hydration semantics        |

---

## Priority Fix Order

1. **P1-01** — ARIA initialization timing (accessibility regression in SSR/Drupal)
2. **P1-02** — Label not enforced (WCAG 4.1.2 risk in healthcare context)
3. **P2-03** — Add `value=0`, `value=100`, and determinate→indeterminate transition tests
4. **P2-01** — Add `max` property to match audit spec requirements
5. **P2-04** — Add `aria-busy` for indeterminate state
6. **P2-05** — Fix Storybook null control unreachability
7. **P2-02** — Document or fix indeterminate animation hardcoded values
8. **P2-06** — Add `render()` return type annotation

---

## Fixes Applied (A11y Audit — 2026-03-12)

| Issue | Status   | Fix                                                                                                                                                                                                         |
| ----- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | RESOLVED | `role`, `aria-valuemin` moved to `connectedCallback()`; `aria-valuemax`, `aria-valuenow`, `aria-busy`, `aria-label` synced in `willUpdate()` — no SSR/Drupal window exists where ARIA attributes are absent |
| P1-02 | RESOLVED | When `label` is absent, a `console.warn` is emitted guiding developers to WCAG 4.1.2 compliance                                                                                                             |
| P2-04 | RESOLVED | `aria-busy="true"` set during indeterminate state; removed when determinate value is set                                                                                                                    |
