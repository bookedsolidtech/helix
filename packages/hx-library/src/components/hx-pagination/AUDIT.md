# Deep Audit v2: hx-pagination

**Component:** `packages/hx-library/src/components/hx-pagination/`
**Date:** 2026-03-06
**wc-mcp Score:** 97/A (CEM), 10/F (Accessibility CEM — see note below)

---

## Scores

| Dimension           | Score | Notes                                                                                        |
| ------------------- | ----- | -------------------------------------------------------------------------------------------- |
| CEM Health          | 97/A  | Near-perfect. One issue: private members leaking to CEM.                                     |
| Accessibility (CEM) | 10/F  | CEM docs lacked a11y description — **FIXED** in this audit. Actual implementation is strong. |
| Design Tokens       | Pass  | Full `--hx-` token cascade with semantic fallbacks.                                          |
| TypeScript          | Pass  | Strict mode, no `any`.                                                                       |
| Tests               | Pass  | 31 tests across 8 describe blocks.                                                           |
| Storybook           | Pass  | 10 stories including healthcare scenario.                                                    |

---

## Fixes Applied (CRITICAL + HIGH)

### FIX 1: Private members leaking to CEM (HIGH)

**Problem:** 7 private members (`_rovingKey`, `_effectiveRovingKey`, `_buildPageRange`, `_range`, `_navigate`, `_handleFocusin`, `_handleKeydown`) appeared in the Custom Elements Manifest as public API.

**Fix:** Added `@internal` JSDoc tags to all private methods and state properties. CEM analyzer will now exclude them from the public API surface.

**File:** `hx-pagination.ts`

### FIX 2: `<ul>` missing `role="list"` — Safari VoiceOver (HIGH)

**Problem:** Safari WebKit removes implicit list semantics from `<ul>` when `list-style: none` is applied. Screen reader users on Safari lose list context (item count, position).

**Fix:** Added `role="list"` to the `<ul>` element.

**File:** `hx-pagination.ts:213`

### FIX 3: Hover styles applying to `aria-disabled` current page button (HIGH)

**Problem:** `.button:hover:not(:disabled)` selector did not exclude `aria-disabled="true"` buttons. The current page button uses `aria-disabled` (not native `disabled`), so hover styles could theoretically apply.

**Fix:** Updated selector to `.button:hover:not(:disabled):not([aria-disabled='true'])`.

**File:** `hx-pagination.styles.ts:50`

### FIX 4: Accessibility undocumented in JSDoc (HIGH)

**Problem:** wc-mcp accessibility score was 10/F because the component description contained no accessibility documentation. The actual implementation has strong a11y (nav landmark, aria-current, roving tabindex, aria-hidden on ellipsis) but CEM consumers couldn't discover this.

**Fix:** Added comprehensive accessibility documentation paragraph to the component JSDoc describing nav landmark, aria-current, roving tabindex keyboard pattern, disabled states, and aria-hidden ellipsis.

**File:** `hx-pagination.ts:8-16`

---

## Remaining Issues (MEDIUM / LOW — documented for future work)

### MEDIUM: No `page-size` property / per-page selector

The T2 audit flagged this as P0. Design decision: page-size selection is a separate concern better handled by composition (e.g., an `<hx-select>` alongside pagination) rather than coupling into the pagination component. Most major design systems (MUI, Shoelace, Carbon) separate these concerns. If needed, can be added as a future feature.

### MEDIUM: No `aria-live` region for page change announcements

When navigating pages, screen readers rely on focus moving to the new current-page button. An explicit `aria-live="polite"` region announcing "Page X of Y" would improve UX for screen reader users. Not a WCAG violation (focus moves correctly) but a best-practice enhancement.

### MEDIUM: No `forced-colors` media query (Windows High Contrast)

Component lacks `@media (forced-colors: active)` styles. Active page indicator and disabled states may not be visible in Windows High Contrast mode. Should add `ButtonText`, `ButtonFace`, `Highlight`, and `GrayText` system color keywords.

### MEDIUM: `cursor: not-allowed` dead CSS on `:disabled` buttons

`pointer-events: none` prevents cursor changes from showing. The `cursor: not-allowed` declaration has no effect. Consider removing `pointer-events: none` and relying on native `disabled` behavior, or accept that disabled buttons show the default cursor.

### MEDIUM: `.button--active` duplicates `[aria-current='page']` selector

Both are applied to the same element. Could simplify to use only the semantic `[aria-current='page']` selector.

### MEDIUM: `_buildPageRange()` not memoized

Creates intermediate arrays on every render. For a standard pagination component this is negligible, but could be optimized for high-frequency update scenarios.

### MEDIUM: No tests for `siblingCount`/`boundaryCount` effects on page range

Public API properties lack dedicated test coverage for their visual effects on the rendered page range.

### MEDIUM: Event composability not tested

`hx-page-change` dispatches with `bubbles: true, composed: true` but no test asserts these properties. Important for Drupal/consumer app event delegation.

### LOW: No dark mode / `prefers-color-scheme` support

All token fallbacks are light-mode values. Dark mode requires consumer to override `--hx-` tokens at the theme level. No built-in dark mode.

### LOW: `reflect: true` on mutable `currentPage`

Causes attribute writes on every navigation. Minor DOM churn. Harmless in Lit 3.x but unnecessary.

### LOW: No Twig template example or Drupal integration docs

Documentation gap for Drupal consumers. The component is fully Twig-compatible via attributes but the 0-based/1-based index offset is undocumented.

---

## Positive Observations

- **Roving tabindex** correctly implemented with ArrowLeft/Right focus management
- **`aria-current="page"`** correctly marks the active page
- **Ellipsis `aria-hidden="true"`** — correctly presentational
- **Clear `aria-label`s** on all nav buttons ("Previous page", "Next page", etc.)
- **`prefers-reduced-motion: reduce`** disables transitions
- **Typed events** — `CustomEvent<{ page: number }>` with correct detail typing
- **Native `disabled`** on prev/next/first/last (not just aria-disabled)
- **Comprehensive token cascade** — component tokens → semantic tokens → hardcoded fallbacks
- **10 Storybook stories** including healthcare patient list scenario
- **31 tests** covering rendering, navigation, events, CSS parts, ellipsis, keyboard, edge cases
- **Edge case handling** — totalPages=0, negative currentPage, currentPage > totalPages all graceful

---

## Verification

- `npm run build` (library): Exit 0
- `npm run type-check`: 0 errors
- `npm run verify`: All gates pass
- `npm run test:library`: 3110 tests pass (79 files), including all 31 hx-pagination tests
