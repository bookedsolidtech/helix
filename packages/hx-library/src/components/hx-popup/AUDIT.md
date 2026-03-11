# AUDIT: hx-popup — Deep Review

**Auditor:** Deep Opus-Level Review
**Date:** 2026-03-11
**Status:** PASS — all P0 and P1 issues resolved

---

## Files Reviewed

- `hx-popup.ts` — Component implementation (502 lines)
- `hx-popup.styles.ts` — Lit CSS styles (28 lines)
- `hx-popup.test.ts` — Vitest browser tests (59 tests)
- `hx-popup.stories.ts` — Storybook stories (13 stories)
- `index.ts` — Barrel re-export
- `apps/docs/src/content/docs/component-library/hx-popup.mdx` — Starlight docs (401 lines)

---

## Quality Gate Results

| Gate | Check             | Status                                                 |
| ---- | ----------------- | ------------------------------------------------------ |
| 1    | TypeScript strict | PASS — zero errors, no `any` types                     |
| 2    | Test suite        | PASS — 59 tests, all passing                           |
| 3    | Accessibility     | PASS — axe-core audits, inert attribute, consumer docs |
| 4    | Storybook         | PASS — 13 stories covering all variants and features   |
| 5    | CEM accuracy      | PASS — all exports match public API                    |
| 6    | Bundle size       | PASS — 2.4KB gzipped (well under 5KB budget)           |
| 7    | Code review       | PASS — deep audit complete                             |

---

## Previous Findings — Resolution Status

### P0 Findings (all resolved)

| #   | Finding                                            | Resolution                                                                                                       |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Bundle size unverified; Floating UI may exceed 5KB | RESOLVED — hx-popup chunk is 7.4KB raw / 2.4KB gzipped. Floating UI is tree-shaken and shared across components. |

### P1 Findings (all resolved)

| #   | Finding                                             | Resolution                                                                                                                                                                                          |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `strategy` hardcoded as `'fixed'`, not configurable | FIXED — `strategy` is an exposed `@property` typed `'fixed' \| 'absolute'` with `reflect: true`, default `'fixed'`.                                                                                 |
| 2   | `flipFallbackPlacements` typed `string[]`           | FIXED — typed as `PopupPlacement[]` with custom converter for JSON attribute parsing.                                                                                                               |
| 3   | `aria-hidden` on shadow container unreliable        | FIXED — replaced with `inert` attribute on the popup container. `display: none` and `inert` together reliably hide from the accessibility tree.                                                     |
| 4   | No documented consumer ARIA contract                | FIXED — comprehensive Accessibility Contract section in JSDoc (lines 67–80) documenting roles, aria-expanded, aria-controls, focus management responsibilities.                                     |
| 5   | No tests for positioning computation output         | FIXED — tests verify `left`/`top` styles on popup, `data-placement` on arrow, arrow offset for start/end placement, `arrowPadding` propagation, auto placement, and CSS selector anchor resolution. |
| 6   | No test for CSS selector string anchor path         | FIXED — test at line 531 verifies `anchor="#test-anchor-btn"` resolves correctly and reposition succeeds.                                                                                           |
| 7   | No story for `auto` placement                       | FIXED — `AutoPlacement` story demonstrates auto-placement with play function validation.                                                                                                            |
| 8   | No story for `autoSize`                             | FIXED — `AutoSize` story demonstrates `--hx-auto-size-available-height` with play function verifying the CSS custom property is set.                                                                |
| 9   | Missing `--hx-popup-transition` token               | FIXED — `transition: var(--hx-popup-transition, none)` in styles. JSDoc documents how consumers override `display: none` for opacity transitions.                                                   |

### P2 Findings (all resolved)

| #   | Finding                                          | Resolution                                                                                                                                                                     |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `arrowData` cast unnecessarily wide              | FIXED — `ArrowData` type defined with `x`, `y`, and `centerOffset` fields matching Floating UI's structure.                                                                    |
| 2   | `anchor` property decorator clarity              | FIXED — JSDoc explicitly documents attribute form (CSS selector string) vs property form (Element reference).                                                                  |
| 3   | axe tests don't validate composite patterns      | DOCUMENTED — component is a positioning utility; composite pattern ARIA is consumer responsibility per Accessibility Contract. axe tests validate the component itself passes. |
| 4   | `arrowPlacement` untested                        | FIXED — 6 tests cover defaults, all 3 values, and offset verification for start/end placements.                                                                                |
| 5   | `arrowPadding` untested beyond defaults          | FIXED — 3 tests cover default, attribute parsing, and offset propagation (`15px` verified).                                                                                    |
| 6   | `auto` placement code path untested              | FIXED — test at line 581 verifies auto placement triggers reposition and sets positioning styles.                                                                              |
| 7   | `autoSize` CSS custom properties not verified    | FIXED — 2 tests verify properties are set on `:host` when active and removed when `autoSize` is disabled.                                                                      |
| 8   | `arrowPlacement` no dedicated story              | FIXED — `ArrowPlacements` story shows start/center/end side-by-side with play function.                                                                                        |
| 9   | `WithArrow` missing left placement               | FIXED — story shows all 4 directions (top, bottom, left, right).                                                                                                               |
| 10  | Flip/Shift stories no `play` assertions          | FIXED — both stories have play functions verifying positioning styles are applied.                                                                                             |
| 11  | No interactive toggle story                      | FIXED — `Interactive` story with toggle button, `aria-expanded` management, and play function.                                                                                 |
| 12  | `flipFallbackPlacements` not demonstrated        | FIXED — `FlipFallbackPlacements` story demonstrates JSON attribute format.                                                                                                     |
| 13  | `--hx-auto-size-*` set on popup, not `:host`     | FIXED — properties set via `this.style.setProperty()` on `:host` for light DOM accessibility.                                                                                  |
| 14  | Arrow `background: currentColor` fragile default | FIXED — default is `var(--hx-color-surface-overlay, #ffffff)` — semantic token with safe fallback.                                                                             |
| 15  | No Twig usage example                            | FIXED — JSDoc includes Twig template and Drupal behavior examples. Starlight docs have full Drupal integration section.                                                        |
| 16  | No dynamic Drupal ID guidance                    | FIXED — JSDoc documents slot-based anchoring preference for server-rendered contexts and Twig variable pattern for CSS selector form.                                          |

---

## Component Capabilities Summary

### Properties (13)

| Property                 | Type                        | Default    | Reflects |
| ------------------------ | --------------------------- | ---------- | -------- |
| `anchor`                 | `string \| Element \| null` | `null`     | No       |
| `placement`              | `PopupPlacement`            | `'bottom'` | Yes      |
| `active`                 | `boolean`                   | `false`    | Yes      |
| `distance`               | `number`                    | `0`        | Yes      |
| `skidding`               | `number`                    | `0`        | Yes      |
| `arrow`                  | `boolean`                   | `false`    | Yes      |
| `arrowPlacement`         | `ArrowPlacement \| null`    | `null`     | Yes      |
| `arrowPadding`           | `number`                    | `10`       | No       |
| `flip`                   | `boolean`                   | `false`    | Yes      |
| `flipFallbackPlacements` | `PopupPlacement[]`          | `[]`       | Yes      |
| `shift`                  | `boolean`                   | `false`    | Yes      |
| `autoSize`               | `boolean`                   | `false`    | Yes      |
| `strategy`               | `'fixed' \| 'absolute'`     | `'fixed'`  | Yes      |

### Events (1)

| Event           | Detail | Bubbles | Composed |
| --------------- | ------ | ------- | -------- |
| `hx-reposition` | —      | Yes     | Yes      |

### CSS Custom Properties (6)

| Property                          | Default                                    |
| --------------------------------- | ------------------------------------------ |
| `--hx-popup-z-index`              | `9000`                                     |
| `--hx-popup-transition`           | `none`                                     |
| `--hx-arrow-size`                 | `8px`                                      |
| `--hx-arrow-color`                | `var(--hx-color-surface-overlay, #ffffff)` |
| `--hx-auto-size-available-width`  | _(set by component)_                       |
| `--hx-auto-size-available-height` | _(set by component)_                       |

### CSS Parts (2)

| Part    | Description                  |
| ------- | ---------------------------- |
| `popup` | The floating panel container |
| `arrow` | The arrow indicator element  |

### Slots (2)

| Slot        | Description                            |
| ----------- | -------------------------------------- |
| `anchor`    | Reference element the popup anchors to |
| _(default)_ | Popup content                          |

### Public Methods (1)

| Method         | Return          | Description                   |
| -------------- | --------------- | ----------------------------- |
| `reposition()` | `Promise<void>` | Forces position recalculation |
