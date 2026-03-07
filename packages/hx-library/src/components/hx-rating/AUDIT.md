# hx-rating — Deep Audit v2

**Auditor:** Claude Opus 4.6 (deep audit v2)
**Date:** 2026-03-06
**Branch:** feature/deep-audit-v2-hx-rating
**wc-mcp health score:** 91 (A)
**wc-mcp a11y score:** 40/100 (F) — CEM documentation gap, not implementation gap

---

## Executive Summary

`hx-rating` is a well-implemented component with solid ARIA patterns, keyboard navigation, form participation, and half-star precision. The primary gap is **CEM documentation** — the accessibility implementation is strong but not reflected in the Custom Elements Manifest, causing the wc-mcp a11y analyzer to score it 40/100. All quality gates pass.

### Changes Made in This Audit

| Change                                                              | File                                  | Severity Fixed |
| ------------------------------------------------------------------- | ------------------------------------- | -------------- |
| Added accessibility section to JSDoc (ARIA roles, keyboard, states) | `hx-rating.ts`                        | CRITICAL       |
| Added `@internal` to `formAssociated`, `_internals`, `_hoverValue`  | `hx-rating.ts`                        | HIGH           |
| Added `--hx-rating-hover-color` CSS custom property + token         | `hx-rating.ts`, `hx-rating.styles.ts` | HIGH           |
| Added `CustomIcon` story for slotted icon demo                      | `hx-rating.stories.ts`                | MEDIUM         |

---

## Audit Results by Dimension

### 1. Design Tokens

| Token                     | Semantic Fallback                      | Status |
| ------------------------- | -------------------------------------- | ------ |
| `--hx-rating-color`       | `var(--hx-color-warning-400, #fbbf24)` | PASS   |
| `--hx-rating-empty-color` | `var(--hx-color-neutral-300, #d1d5db)` | PASS   |
| `--hx-rating-hover-color` | `var(--hx-color-warning-300, #fcd34d)` | ADDED  |
| `--hx-rating-size`        | `var(--hx-font-size-xl, 1.25rem)`      | PASS   |
| `--hx-rating-gap`         | `var(--hx-space-1, 0.25rem)`           | PASS   |
| Focus ring                | Uses `--hx-focus-ring-*` tokens        | PASS   |
| Disabled opacity          | Uses `--hx-opacity-disabled`           | PASS   |
| Transition                | Uses `--hx-transition-fast`            | PASS   |

**Dark mode:** Handled at semantic token level — no hardcoded colors. PASS.

### 2. Accessibility

| Check                    | Status | Notes                                |
| ------------------------ | ------ | ------------------------------------ |
| ARIA role (interactive)  | PASS   | `role="radiogroup"` + `role="radio"` |
| ARIA role (readonly)     | PASS   | `role="img"` with descriptive label  |
| `aria-label` on group    | PASS   | Falls back to "Rating"               |
| `aria-label` on stars    | PASS   | "1 star", "2 stars", etc.            |
| `aria-checked`           | PASS   | Correctly toggles                    |
| `aria-disabled`          | PASS   | Set on group when disabled           |
| Keyboard (Arrow keys)    | PASS   | Adjusts by `precision` step          |
| Keyboard (Home/End)      | PASS   | Sets to 0/max                        |
| Focus management         | PASS   | Active star gets tabindex="0"        |
| `focus-visible` ring     | PASS   | Styled with tokens                   |
| `prefers-reduced-motion` | PASS   | Transition disabled                  |
| axe-core (4 states)      | PASS   | Zero violations                      |

**CEM documentation gap:** ARIA roles, keyboard events, and focus patterns were not documented in JSDoc — causing wc-mcp to score 40/100. **FIXED** by adding accessibility section to class JSDoc.

### 3. Functionality

| Feature                | Status | Notes                             |
| ---------------------- | ------ | --------------------------------- |
| Configurable max stars | PASS   | `max` property                    |
| Half-star precision    | PASS   | `precision="0.5"`                 |
| Read-only mode         | PASS   | `readonly` attribute              |
| Disabled mode          | PASS   | `disabled` attribute              |
| Hover preview          | PASS   | `_hoverValue` + `hx-hover` event  |
| Form integration       | PASS   | `ElementInternals.setFormValue()` |
| Clear/reset            | PASS   | Home key sets to 0                |
| Value clamping         | PASS   | `_clampAndSnap` enforces bounds   |

### 4. TypeScript

| Check                  | Status                                |
| ---------------------- | ------------------------------------- |
| Strict mode            | PASS                                  |
| No `any` types         | PASS                                  |
| No `@ts-ignore`        | PASS                                  |
| No non-null assertions | PASS                                  |
| Type-safe event detail | PASS — `CustomEvent<{value: number}>` |

### 5. CSS / Styling

| Check                        | Status |
| ---------------------------- | ------ |
| Shadow DOM encapsulation     | PASS   |
| CSS Parts (`base`, `symbol`) | PASS   |
| Half-star via `clip-path`    | PASS   |
| Hover scale transform        | PASS   |
| Focus-visible ring           | PASS   |
| Reduced motion               | PASS   |
| No hardcoded values          | PASS   |

### 6. CEM Accuracy

| Issue                                       | Severity | Status                         |
| ------------------------------------------- | -------- | ------------------------------ |
| Private members in CEM without descriptions | HIGH     | FIXED — added `@internal`      |
| `formAssociated` in CEM without description | HIGH     | FIXED — added `@internal`      |
| ARIA documentation missing from CEM         | CRITICAL | FIXED — added JSDoc section    |
| Public properties documented                | PASS     | All have descriptions          |
| Events documented with types                | PASS     | `hx-change`, `hx-hover`        |
| CSS parts documented                        | PASS     | `base`, `symbol`               |
| CSS custom properties documented            | PASS     | 5 properties (incl. new hover) |
| Slots documented                            | PASS     | `icon` slot                    |

### 7. Tests

| Suite                    | Count  | Status   |
| ------------------------ | ------ | -------- |
| Rendering                | 4      | PASS     |
| Property: value          | 4      | PASS     |
| Property: readonly       | 3      | PASS     |
| Property: disabled       | 3      | PASS     |
| Click to Rate            | 3      | PASS     |
| Keyboard Navigation      | 5      | PASS     |
| Half-Star Precision      | 3      | PASS     |
| Hover Preview            | 2      | PASS     |
| Form Participation       | 3      | PASS     |
| ARIA                     | 4      | PASS     |
| Accessibility (axe-core) | 4      | PASS     |
| **Total**                | **38** | **PASS** |

**Coverage:** 84.95% statements, 79.26% branches, 87.5% functions — all above thresholds.

### 8. Storybook

| Story                        | Status |
| ---------------------------- | ------ |
| Default (with play function) | PASS   |
| WithValue                    | PASS   |
| Readonly                     | PASS   |
| HalfStar                     | PASS   |
| HalfStarReadonly             | PASS   |
| Disabled                     | PASS   |
| MaxTen                       | PASS   |
| FormParticipation            | PASS   |
| CustomIcon                   | ADDED  |
| InteractiveEvents            | PASS   |

### 9. Drupal Compatibility

| Check                       | Status | Notes                            |
| --------------------------- | ------ | -------------------------------- |
| Attribute-driven API        | PASS   | All props reflect to attributes  |
| Twig-renderable             | PASS   | Standard custom element          |
| Form submission             | PASS   | `name` + `ElementInternals`      |
| CDN-compatible              | PASS   | Self-contained, no external deps |
| Fivestar module integration | PASS   | Maps naturally to star rating UX |

### 10. Portability

| Check                                 | Status |
| ------------------------------------- | ------ |
| Self-contained                        | PASS   |
| No external dependencies (beyond Lit) | PASS   |
| CDN-ready                             | PASS   |
| Framework-agnostic                    | PASS   |

---

## Remaining Items (LOW / Documented Only)

| #   | Dimension  | Severity | Description                                                                   |
| --- | ---------- | -------- | ----------------------------------------------------------------------------- |
| 1   | Tests      | LOW      | `_handleSymbolMouseMove` not directly tested (hover with half-star precision) |
| 2   | Tests      | LOW      | Focus restoration after keyboard nav not tested                               |
| 3   | Tests      | LOW      | Half-star click resolution right-half branch partially covered                |
| 4   | A11y       | LOW      | Individual star labels could include "of N" for full context                  |
| 5   | Validation | LOW      | `precision` has no runtime guard against invalid attribute values             |
| 6   | Storybook  | LOW      | No "Sizes" story demonstrating `--hx-rating-size` variations                  |
| 7   | Drupal     | LOW      | No `.html.twig` example template                                              |

---

## Quality Gates

| Gate | Check             | Result                          |
| ---- | ----------------- | ------------------------------- |
| 1    | TypeScript strict | PASS — zero errors              |
| 2    | Test suite        | PASS — 38/38, 84.95% coverage   |
| 3    | Accessibility     | PASS — zero axe violations      |
| 4    | Storybook         | PASS — 10 stories, all variants |
| 5    | CEM accuracy      | PASS — public API documented    |
| 6    | Bundle size       | PASS — ~3 KB (well under 5 KB)  |
| 7    | Code review       | This audit                      |
