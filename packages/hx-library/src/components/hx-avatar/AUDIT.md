# AUDIT: hx-avatar — Deep Opus-Level Quality Review

**Reviewer:** Deep audit (Opus 4.6) — accessibility engineer + Lit specialist + principal engineer
**Date:** 2026-03-11
**Component:** `hx-avatar` — `packages/hx-library/src/components/hx-avatar/`
**Files reviewed:** `hx-avatar.ts`, `hx-avatar.styles.ts`, `hx-avatar.stories.ts`, `hx-avatar.test.ts`, `index.ts`

---

## Summary

The previous antagonistic audit (2026-03-05) identified 16 findings (2 P0, 7 P1, 8 P2). **All 16 findings have been remediated.** The component is now in strong shape with 32 passing tests (including 5 axe-core a11y tests across all render modes), accurate CEM output, 9 Storybook stories with play functions, and a 2.5KB gzipped bundle.

This deep audit found **5 new findings** — no P0 critical issues, 2 P1 high issues, and 3 P2 medium issues. All relate to Lit lifecycle best practices, Windows High Contrast Mode accessibility, and developer experience guardrails.

---

## Previous Audit Status: ALL RESOLVED

| ID   | Status   | Title                                                           |
| ---- | -------- | --------------------------------------------------------------- |
| P0-1 | RESOLVED | `_imgError` resets in `updated()` when `src` changes            |
| P0-2 | RESOLVED | Badge moved outside overflow:hidden via `.avatar-wrapper`       |
| P1-1 | RESOLVED | `label` property provides human-readable accessible name        |
| P1-2 | RESOLVED | Console warning when `src` provided without `alt`               |
| P1-3 | RESOLVED | `aria-hidden="true"` on inner `<img>` prevents double semantics |
| P1-4 | RESOLVED | 3 tests cover image error → fallback recovery                   |
| P1-5 | RESOLVED | Test covers `_imgError` reset on `src` change                   |
| P1-6 | RESOLVED | Story uses `ifDefined(args.src)` to omit undefined src          |
| P1-7 | RESOLVED | `label` property used for initials `aria-label`                 |
| P2-1 | RESOLVED | Runtime validation with console.warn for invalid size/shape     |
| P2-2 | RESOLVED | Badge wrapper hidden when empty via CSS class toggle            |
| P2-3 | RESOLVED | Stories use `label` for descriptive accessible names            |
| P2-4 | RESOLVED | `BrokenSrc` story demonstrates image-error recovery             |
| P2-5 | RESOLVED | `:host([hidden])` rule added                                    |
| P2-7 | RESOLVED | Tests use `el.updateComplete` instead of `setTimeout`           |
| P2-8 | RESOLVED | axe-core covers all 5 render modes                              |

---

## New Findings

### P1-A: `_imgError` reset in `updated()` causes double render cycle (Lit anti-pattern)

**File:** `hx-avatar.ts:100-104`

```ts
override updated(changedProperties: PropertyValues): void {
  if (changedProperties.has('src')) {
    this._imgError = false; // @state() mutation triggers second render
  }
}
```

Setting a `@state()` property inside `updated()` schedules a second synchronous update cycle. Lit's dev mode correctly flags this: "Element hx-avatar scheduled an update after an update completed." In a list of 50 avatars loading simultaneously, this doubles render work (100 renders instead of 50).

**Fix:** Move the `_imgError` reset to `willUpdate()`, which runs before `render()` and does not schedule a new cycle:

```ts
override willUpdate(changedProperties: PropertyValues): void {
  if (changedProperties.has('src')) {
    this._imgError = false;
  }
}
```

**Impact:** Performance — unnecessary double renders on every `src` change.

---

### P1-B: No `@media (forced-colors: active)` styles — avatar invisible in Windows High Contrast Mode

**File:** `hx-avatar.styles.ts`

In Windows High Contrast Mode (forced-colors), background colors are removed by the system. The avatar relies entirely on its background color (`--hx-avatar-bg`) for its visual boundary. With backgrounds stripped, the avatar becomes invisible — no border, no background, no distinguishable shape.

The fallback SVG icon uses `fill="currentColor"` (adapts correctly) and initials text uses `color` (also adapts), but the container itself loses all visual presence.

**Fix:** Add a forced-colors media query:

```css
@media (forced-colors: active) {
  .avatar {
    border: 2px solid ButtonText;
  }
}
```

**Impact:** WCAG 1.4.11 Non-text Contrast (Level AA). Healthcare users with High Contrast Mode enabled cannot perceive avatar boundaries.

---

### P2-A: No console warning when initials used without `label`

**File:** `hx-avatar.ts`

The component warns when `src` is provided without `alt` (line 107-115), but does not warn when `initials` is set without `label`. Without `label`, the `aria-label` falls back to the raw initials string (e.g., "JD"), which screen readers announce as individual letters rather than a name.

In healthcare contexts (care team lists, patient charts), "J D" tells a screen reader user nothing. The `label` property exists precisely for this use case but is silently optional.

**Fix:** Add a parallel console warning:

```ts
if (changedProperties.has('initials') || changedProperties.has('label')) {
  if (this.initials && !this.label) {
    console.warn(
      '[hx-avatar] Accessibility: "label" attribute is recommended when "initials" is provided. ' +
        'Without label, screen readers announce raw initials as individual letters. ' +
        'Add label="Full Name" to your hx-avatar element.',
    );
  }
}
```

**Impact:** DX/A11y — silent accessibility gap at call sites.

---

### P2-B: Validation logic in `updated()` should move to `willUpdate()`

**File:** `hx-avatar.ts:100-130`

All property validation (size/shape warnings, alt check) runs in `updated()`. While `console.warn` does not trigger re-renders, `updated()` is the wrong lifecycle for validation:

1. If future validation logic needs to coerce invalid values (e.g., reset invalid `size` to `'md'`), doing so in `updated()` would cause the same double-render problem as P1-A.
2. `willUpdate()` is specifically designed for pre-render property validation and derived state computation.

**Fix:** Move all `changedProperties` validation to `willUpdate()`.

---

### P2-C: Badge slot lacks accessibility enforcement

**File:** `hx-avatar.ts`

The badge slot delegates all accessibility responsibility to the consumer. A common pattern is slotting a plain `<span class="green-dot"></span>` for status indicators — this is completely inaccessible (no role, no label). The Storybook story demonstrates the correct pattern (`role="img" aria-label="Online"`), but there is no runtime validation.

**Fix:** Add a console warning in `_handleBadgeSlotChange()` when slotted badge content lacks an accessible name:

```ts
const hasAccessibleName = nodes.some((node) => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    return (
      el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || el.getAttribute('role')
    );
  }
  return false;
});
if (!hasAccessibleName) {
  console.warn(
    '[hx-avatar] Badge slot content should have an accessible name (aria-label, role, etc.).',
  );
}
```

---

## Findings Summary Table

| ID   | Severity | Area     | Title                                                           | Status |
| ---- | -------- | -------- | --------------------------------------------------------------- | ------ |
| P1-A | P1       | Lit/Perf | `_imgError` reset in `updated()` causes double render           | NEW    |
| P1-B | P1       | A11y/CSS | No forced-colors styles — invisible in High Contrast Mode       | NEW    |
| P2-A | P2       | A11y/DX  | No warning when initials used without `label`                   | NEW    |
| P2-B | P2       | Lit      | Validation logic should move from `updated()` to `willUpdate()` | NEW    |
| P2-C | P2       | A11y/DX  | Badge slot lacks accessibility enforcement                      | NEW    |

---

## Verification Gates

| Gate              | Result                                                          |
| ----------------- | --------------------------------------------------------------- |
| TypeScript strict | PASS — zero errors                                              |
| Test suite        | PASS — 32/32 tests, all axe-core clean                          |
| CEM accuracy      | PASS — all 6 attributes, 2 slots, 5 CSS parts, 5 CSS properties |
| Bundle size       | PASS — 2.5KB gzipped (budget: 5KB)                              |
| Storybook stories | PASS — 9 stories with play functions                            |
| Build             | PASS — library builds clean                                     |

---

## Component Health Score

| Dimension         | Score      | Notes                                                   |
| ----------------- | ---------- | ------------------------------------------------------- |
| API completeness  | 9/10       | Strong property set, slots, CSS parts                   |
| Accessibility     | 7/10       | Good axe coverage, needs forced-colors + DX warnings    |
| TypeScript strict | 10/10      | Zero errors, proper union types                         |
| Test coverage     | 9/10       | 32 tests, all render modes covered                      |
| Storybook         | 9/10       | 9 stories with play functions                           |
| Design tokens     | 10/10      | Full token cascade, no hardcoded values                 |
| Shadow DOM        | 10/10      | Clean encapsulation, proper parts/slots                 |
| Performance       | 8/10       | 2.5KB gz, but double-render on src change               |
| Edge cases        | 9/10       | Broken image, empty initials, invalid attrs all handled |
| **Overall**       | **9.1/10** | Production-ready with 5 improvement items               |
