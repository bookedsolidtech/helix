# hx-skeleton — Deep Audit v2

**Auditor:** Claude Opus 4.6 (deep audit v2)
**Date:** 2026-03-06
**Branch:** feature/deep-audit-v2-hx-skeleton
**wc-mcp health score:** 100 (A)
**wc-mcp a11y score:** 0/100 (F) — Expected for decorative component; not an implementation gap

---

## Executive Summary

`hx-skeleton` is a well-structured decorative loading placeholder with four shape variants, CSS-only shimmer animation, full token support, and proper Shadow DOM encapsulation. The wc-mcp a11y score of 0/100 is expected — skeleton is a purely decorative element that should be hidden from assistive technology, so ARIA roles, keyboard events, focus management, and form association are intentionally absent.

### Changes Made in This Audit

| Change                                                                     | File                                      | Severity Fixed |
| -------------------------------------------------------------------------- | ----------------------------------------- | -------------- |
| Set `aria-hidden` + `role="presentation"` on host via `connectedCallback`  | `hx-skeleton.ts`                          | HIGH           |
| Changed `prefers-reduced-motion` from `animation: none` to `display: none` | `hx-skeleton.styles.ts`                   | HIGH           |
| Added `--hx-skeleton-circle-radius` CSS custom property                    | `hx-skeleton.ts`, `hx-skeleton.styles.ts` | MEDIUM         |
| Fixed misleading `animated="false"` boolean attribute test                 | `hx-skeleton.test.ts`                     | HIGH           |
| Added rect variant class application test                                  | `hx-skeleton.test.ts`                     | MEDIUM         |
| Added host-level `aria-hidden` / `role` test                               | `hx-skeleton.test.ts`                     | HIGH           |

---

## Audit Results by Dimension

### 1. Design Tokens

| Token                         | Semantic Fallback                      | Status |
| ----------------------------- | -------------------------------------- | ------ |
| `--hx-skeleton-bg`            | `var(--hx-color-neutral-200, #e2e8f0)` | PASS   |
| `--hx-skeleton-shimmer-color` | `rgba(255, 255, 255, 0.4)`             | PASS   |
| `--hx-skeleton-duration`      | `1.5s`                                 | PASS   |
| `--hx-skeleton-text-radius`   | `var(--hx-border-radius-full, 9999px)` | PASS   |
| `--hx-skeleton-rect-radius`   | `var(--hx-border-radius-sm, 0.25rem)`  | PASS   |
| `--hx-skeleton-circle-radius` | `50%`                                  | ADDED  |
| `--hx-skeleton-button-radius` | `var(--hx-border-radius-md, 0.375rem)` | PASS   |

**Dark mode:** Handled at semantic token level via `--hx-color-neutral-200`. No hardcoded colors. PASS.

### 2. Accessibility

| Check                                 | Status | Notes                                   |
| ------------------------------------- | ------ | --------------------------------------- |
| `aria-hidden="true"` on host          | FIXED  | Added via `connectedCallback`           |
| `role="presentation"` on host         | FIXED  | Added via `connectedCallback`           |
| `aria-hidden="true"` on shadow child  | PASS   | Set on `<span part="base">`             |
| `role="presentation"` on shadow child | PASS   | Set on `<span part="base">`             |
| `prefers-reduced-motion`              | FIXED  | Changed to `display: none` on `::after` |
| axe-core (default)                    | PASS   | Zero violations                         |
| axe-core (all 4 variants)             | PASS   | Zero violations                         |
| axe-core (not animated)               | PASS   | Zero violations                         |

**Note on P0-01 from previous audit:** The previous audit flagged a missing `loaded` property and live region announcement. This is a **consumer responsibility**, not a skeleton component concern. The correct pattern is `aria-busy="true"` on the parent container (demonstrated in Storybook's CardSkeleton, ProfileSkeleton, and TableSkeleton stories). The skeleton component is decorative — it should not manage loading state transitions.

### 3. Functionality

| Feature           | Status | Notes                                |
| ----------------- | ------ | ------------------------------------ |
| Variant: text     | PASS   | Rounded, 1em default height          |
| Variant: circle   | PASS   | 50% radius, aspect-ratio: 1          |
| Variant: rect     | PASS   | Small radius, 1rem default height    |
| Variant: button   | PASS   | Medium radius, 2.5rem default height |
| Custom width      | PASS   | Via `width` attribute                |
| Custom height     | PASS   | Via `height` attribute               |
| Shimmer animation | PASS   | CSS-only, no JS timers               |
| Static mode       | PASS   | `animated="false"` disables shimmer  |

### 4. TypeScript

| Check                  | Status                                            |
| ---------------------- | ------------------------------------------------- |
| Strict mode            | PASS                                              |
| No `any` types         | PASS                                              |
| No `@ts-ignore`        | PASS                                              |
| No non-null assertions | PASS                                              |
| Variant union type     | PASS — `'text' \| 'circle' \| 'rect' \| 'button'` |

### 5. CSS / Styling

| Check                                                | Status                               |
| ---------------------------------------------------- | ------------------------------------ |
| Shadow DOM encapsulation                             | PASS                                 |
| CSS Part (`base`)                                    | PASS                                 |
| Shimmer via `::after` pseudo                         | PASS                                 |
| Token-driven border-radius (all variants)            | PASS (circle FIXED)                  |
| `prefers-reduced-motion`                             | FIXED — `display: none` on `::after` |
| No hardcoded colors                                  | PASS                                 |
| Internal custom properties (`--_width`, `--_height`) | PASS                                 |

### 6. CEM Accuracy

| Check                 | Status | Notes                                    |
| --------------------- | ------ | ---------------------------------------- |
| Component description | PASS   | Clear, accurate                          |
| Properties documented | PASS   | `variant`, `width`, `height`, `animated` |
| CSS custom properties | PASS   | 7 properties (incl. new circle-radius)   |
| CSS parts             | PASS   | `base`                                   |
| Events                | PASS   | None (decorative component)              |
| Slots                 | PASS   | None                                     |

### 7. Tests

| Suite                    | Count  | Status                    |
| ------------------------ | ------ | ------------------------- |
| Rendering                | 5      | PASS (+1 host aria test)  |
| Property: variant        | 6      | PASS (+1 rect class test) |
| Property: animated       | 3      | PASS (fixed boolean test) |
| Property: width          | 2      | PASS                      |
| Property: height         | 2      | PASS                      |
| Dynamic Updates          | 2      | PASS                      |
| Accessibility (axe-core) | 3      | PASS                      |
| **Total**                | **23** | **PASS**                  |

### 8. Storybook

| Story                     | Status                                  |
| ------------------------- | --------------------------------------- |
| Default                   | PASS                                    |
| TextVariant               | PASS                                    |
| CircleVariant             | PASS                                    |
| RectVariant               | PASS                                    |
| ButtonVariant             | PASS                                    |
| StaticNoAnimation         | PASS                                    |
| CardSkeleton (pattern)    | PASS — demonstrates `aria-busy` wrapper |
| ProfileSkeleton (pattern) | PASS — demonstrates `aria-busy` wrapper |
| TableSkeleton (pattern)   | PASS                                    |

### 9. Drupal Compatibility

| Check                | Status | Notes                                   |
| -------------------- | ------ | --------------------------------------- |
| Attribute-driven API | PASS   | All props reflect to attributes         |
| Twig-renderable      | PASS   | Standard custom element, no JS required |
| CDN-compatible       | PASS   | Self-contained, no external deps        |
| Decorative pattern   | PASS   | Consumer wraps with `aria-busy` div     |

### 10. Portability

| Check                                 | Status |
| ------------------------------------- | ------ |
| Self-contained                        | PASS   |
| No external dependencies (beyond Lit) | PASS   |
| CDN-ready                             | PASS   |
| Framework-agnostic                    | PASS   |

---

## Remaining Items (LOW / Documented Only)

| #   | Dimension | Severity | Description                                                                                                 |
| --- | --------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | CSS       | LOW      | `background-size: 200% 100%` shimmer width is hardcoded (no `--hx-skeleton-shimmer-width` token)            |
| 2   | Tests     | LOW      | No test for invalid/unknown variant values (graceful degradation)                                           |
| 3   | Storybook | LOW      | No loading-to-loaded transition story (consumer pattern, not component responsibility)                      |
| 4   | Drupal    | LOW      | No `.html.twig` example template                                                                            |
| 5   | Variants  | LOW      | `paragraph` variant (multi-line skeleton) not implemented — consumers compose with multiple `text` variants |

---

## Quality Gates

| Gate | Check             | Result                                    |
| ---- | ----------------- | ----------------------------------------- |
| 1    | TypeScript strict | PASS — zero errors                        |
| 2    | Test suite        | PASS — 23/23                              |
| 3    | Accessibility     | PASS — zero axe violations                |
| 4    | Storybook         | PASS — 9 stories, all variants + patterns |
| 5    | CEM accuracy      | PASS — public API documented              |
| 6    | Bundle size       | PASS — ~3.2 KB (well under 5 KB)          |
| 7    | Code review       | This audit                                |
