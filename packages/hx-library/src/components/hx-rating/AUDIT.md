# hx-rating — Antagonistic Quality Audit (T3-15)

**Auditor:** Claude Sonnet 4.6 (automated antagonistic review)
**Date:** 2026-03-06
**Branch:** feature/audit-hx-rating-t3-15-antagonistic

---

## Executive Summary

`hx-rating` is a well-constructed component. Tests pass (38/38), axe-core reports zero violations, bundle is within budget, and the TypeScript is strict. However, two high-severity gaps expose untested production paths (half-star click resolution, mousemove handler), and the CSS parts API deviates from the specification. Two accessibility defects reduce screen reader quality below the stated standard.

---

## Test Results (Objective Baseline)

| Metric | Result | Threshold | Pass? |
|--------|--------|-----------|-------|
| Tests | 38/38 | 100% | YES |
| Statements | 84.95% | 80% | YES |
| Branches | 79.26% | 70% | YES |
| Functions | 87.5% | 80% | YES |
| Lines | 85.71% | 80% | YES |
| Bundle (min+gz) | ~3 KB | < 5 KB | YES |
| axe-core violations | 0 | 0 | YES |
| CEM score | 91 (A) | — | — |

---

## Findings

### P1 — High Severity (should fix before release)

#### P1-01 — Half-star click resolution is not tested
**File:** `hx-rating.test.ts`

The `_resolveValue(e, i)` method (hx-rating.ts:141-148) resolves half vs. full star from the horizontal mouse position (`e.clientX`, `getBoundingClientRect()`). Every test in the "Click to Rate" and "Half-Star Precision" suites dispatches a plain `symbol.click()` or `symbol?.click()`, which produces a `MouseEvent` with `clientX=0`. This bypasses the half-star branch entirely:

```ts
// hx-rating.ts:142-147 — never exercised by any test
if (this.precision === 0.5) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const isLeftHalf = (e.clientX - rect.left) / rect.width < 0.5;
  return isLeftHalf ? i - 0.5 : i;
}
```

With `clientX=0` and `rect.left=0` (typical in headless), the condition `0/width < 0.5` is `true`, so the test always covers the `i - 0.5` path. The `i` (right-half) path is never covered. The claim "half-star click is tested" is false — only one of the two branches is reachable from the current test.

**Risk:** A consumer using `precision=0.5` who clicks the right half of a star gets full-star behavior that was never validated.

---

#### P1-02 — `_handleSymbolMouseMove` is entirely uncovered
**File:** `hx-rating.ts:219-234`, `hx-rating.test.ts`

The mousemove handler, responsible for dynamically switching half/full hover state as the cursor crosses the midpoint during movement, is at 0% coverage. No test dispatches a `mousemove` event. Coverage confirms the gap — uncovered lines reported at 220-237.

```ts
private _handleSymbolMouseMove(e: MouseEvent, i: number): void {
  if (this.readonly || this.disabled || this.precision !== 0.5) return;
  // ... updates _hoverValue based on cursor position
}
```

**Risk:** Regressions in the primary half-star interaction UX path cannot be caught by the test suite.

---

#### P1-03 — Readonly aria-label omits "stars" — deviates from spec and reduces screen reader quality
**File:** `hx-rating.ts:328`

The audit specification requires the value to be announced as `"3 of 5 stars"`. The implementation produces:

```
"${ariaLabel}: ${this.value} out of ${this.max}"
// e.g. "Product: 3 out of 5"
```

"Out of 5" does not communicate the unit (stars). A screen reader user who encounters this element without visual context cannot determine what is being measured. The ARIA label should say "3 out of 5 stars" (or "3 of 5 stars") to be self-contained.

The test at `hx-rating.test.ts:85` locks in the incorrect format:
```ts
expect(base?.getAttribute('aria-label')).toBe('Product: 3 out of 5');
// Should be: 'Product: 3 out of 5 stars'
```

**Risk:** Screen reader users in readonly contexts lose unit context. Fails the "value announced" requirement from the audit spec.

---

#### P1-04 — CSS parts API deviates from specification
**File:** `hx-rating.ts:334`, `hx-rating.styles.ts`

The audit specification requires CSS parts `(star, icon)`. The implementation exposes `(base, symbol)`. This is not a style preference — it is a **public API contract**. Consumers who write:

```css
hx-rating::part(star) { ... }
hx-rating::part(icon) { ... }
```

...per the spec will get no result. They must instead use `part(symbol)`. The mismatch means any documentation, design system guide, or consumer code written to spec will silently fail.

The slot is named `icon` (correctly matching the spec) but the wrapping `part` is `symbol`. This inconsistency within the component is confusing: the slot is `icon`, the part is `symbol`, and neither matches the spec's `star`.

**Risk:** Breaking API contract for downstream CSS customization. Part names are permanent once consumers adopt them.

---

### P2 — Medium Severity (should address, not blocking)

#### P2-01 — `precision` has no runtime guard against invalid attribute values
**File:** `hx-rating.ts:73`

```ts
@property({ type: Number, reflect: true })
precision: 0.5 | 1 = 1;
```

The TypeScript union type `0.5 | 1` is a compile-time constraint only. From HTML (`<hx-rating precision="0.3">`), Lit will coerce `"0.3"` to `0.3` and store it. The `_clampAndSnap` and `_getStarState` methods will then produce fractional star states and incorrect snapping behavior with no error. Drupal CMS usage is entirely attribute-driven — invalid values from CMS data cannot be caught by TypeScript.

**Risk:** Silent misbehavior in Drupal/CMS attribute-driven usage.

---

#### P2-02 — Keyboard focus restoration path is not tested
**File:** `hx-rating.ts:195-197`

After a keyboard event changes the value, the component attempts to focus the newly active star:

```ts
void this.updateComplete.then(() => {
  this.shadowRoot?.querySelector<HTMLElement>('[part="symbol"][tabindex="0"]')?.focus();
});
```

No test exercises the actual focus behavior. The keyboard tests dispatch events and check `event.detail.value`, but no test verifies that focus moves to the correct star element after navigation. This is the only mechanism keeping the component keyboard-accessible across selections.

**Risk:** Focus management regressions are invisible to the test suite.

---

#### P2-03 — No "Sizes" story for `--hx-rating-size` token
**File:** `hx-rating.stories.ts`

The audit specification requires "all sizes" coverage in Storybook. The component exposes `--hx-rating-size` as a documented CSS custom property, but no story demonstrates size variation. Consumers have no reference for using this token.

---

#### P2-04 — `aria-label` on individual stars lacks total-max context
**File:** `hx-rating.ts:358`

```ts
const starLabel = i === 1 ? '1 star' : `${i} stars`;
```

Individual star labels are "1 star", "2 stars", etc. In a radiogroup, when a user navigates to "3 stars" with `aria-checked="true"`, some screen reader + AT combinations announce only the focused element's label without re-reading the radiogroup label. The result: "3 stars checked" without "out of 5". The WAI-ARIA authoring practices for radiogroup recommend that individual radio labels are self-describing enough to convey full context (e.g., "3 out of 5 stars").

---

#### P2-05 — Private fields surfaced in CEM as missing descriptions
**File:** CEM output (generated)

The CEM analyzer scores `_internals`, `_hoverValue`, and `_displayValue` as undocumented properties, dragging potential scores. These are private class members that should not appear in the public manifest. Verify CEM configuration (`--exclude` or `@private` JSDoc tags) to suppress private members from the output.

---

#### P2-06 — No Drupal integration example
**File:** (missing)

The audit area requires Drupal Twig-renderability validation. No `.html.twig` example or Drupal behavior file exists for `hx-rating`. The component itself is attribute-driven and should work in Twig, but there is no integration test or documented example pattern for Drupal CMS consumption (e.g., via CDN import, name attribute submission to Drupal forms).

---

## Coverage Gaps by Line

| Lines | Method | Status |
|-------|--------|--------|
| 145 | `_isChecked` right-half branch | Partially covered |
| 190 | `_handleKeydown` focus callback | Not tested |
| 220-237 | `_handleSymbolMouseMove` | Entirely untested |
| 372 | `aria-disabled` nothing branch | Not tested |

---

## Passing Gates

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript strict | PASS | No `any`, no `@ts-ignore`, no non-null assertions |
| Test suite | PASS | 38/38, all coverage thresholds met |
| axe-core | PASS | Zero violations across all states |
| Storybook stories | PASS (with gap) | All variants present; sizes story missing |
| CEM accuracy | PASS | Public API reflected; private field noise |
| Bundle size | PASS | ~3 KB gzipped, well within 5 KB budget |
| `role="radiogroup"` pattern | PASS | Correct semantic markup |
| `role="img"` readonly | PASS | Correct fallback for display-only state |
| Design tokens | PASS | All `--hx-*` prefixed, no hardcoded values |
| Star rendering via CSS/SVG | PASS | SVG inline, no image assets |
| Form association | PASS | `formAssociated = true`, ElementInternals |
| Reduced motion | PASS | `prefers-reduced-motion` respected |
