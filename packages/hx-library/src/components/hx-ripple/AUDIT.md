# Deep Audit v2: `hx-ripple`

**Audit Date:** 2026-03-06
**Deep Audit Date:** 2026-03-06
**wc-mcp Score:** 92/100 (Grade A)
**Verdict:** ALL P0/P1 findings RESOLVED. P2 findings addressed.

---

## wc-mcp Health Score

| Dimension             | Score          |
| --------------------- | -------------- |
| Description present   | 15             |
| Property descriptions | 17             |
| Event types           | 20             |
| Event descriptions    | 15             |
| CSS parts documented  | 15             |
| Slots documented      | 10             |
| **Total**             | **92/100 (A)** |

---

## Original Findings (from antagonistic audit) — Resolution Status

| ID   | Severity | Title                                     | Status                                                                      |
| ---- | -------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| R-01 | **P0**   | `unbounded` property missing              | **RESOLVED** — Added `unbounded` boolean property with attribute reflection |
| R-02 | **P1**   | Keyboard Enter/Space don't trigger ripple | **RESOLVED** — Added `keydown` handler for Enter and Space                  |
| R-03 | **P1**   | Host lacks `role="presentation"`          | **RESOLVED** — Set in `connectedCallback`                                   |
| R-04 | **P1**   | No keyboard ripple tests                  | **RESOLVED** — Added 3 tests (Enter, Space, other keys)                     |
| R-05 | **P1**   | No icon button story                      | **RESOLVED** — Added `OnIconButtons` and `Unbounded` stories                |
| R-06 | **P1**   | No reduced-motion demo story              | **RESOLVED** — Added `ReducedMotion` story with documentation               |
| R-07 | **P2**   | No animationend cleanup test              | **RESOLVED** — Added test verifying ripple removal                          |
| R-08 | **P2**   | No color prop backgroundColor test        | **RESOLVED** — Added test verifying style.backgroundColor                   |
| R-09 | **P2**   | Hardcoded `scale(4)`                      | **RESOLVED** — Now uses `--hx-ripple-scale` CSS custom property             |
| R-10 | **P2**   | No `will-change` hint                     | **RESOLVED** — Added `will-change: transform, opacity`                      |
| R-11 | **P2**   | `overflow: hidden` on host clips tooltips | **RESOLVED** — Moved `overflow: hidden` to `.ripple__base` only             |
| R-12 | **P2**   | No Drupal/Twig documentation              | DEFERRED — Documentation task, not a component code issue                   |

---

## Changes Made

### `hx-ripple.ts`

- Added `unbounded` boolean property with `@attr` and `reflect: true`
- Added `_createRipple()` method extracted from `_handlePointerDown` for reuse
- Added `_handleKeyDown` listener for Enter/Space keyboard ripple triggers
- Set `role="presentation"` on host in `connectedCallback`
- Added `@internal` JSDoc tags to private methods to exclude from CEM

### `hx-ripple.styles.ts`

- Removed `overflow: hidden` from `:host` (fixes tooltip/dropdown clipping)
- Added `:host([unbounded]) .ripple__base { overflow: visible }` for unbounded mode
- Replaced hardcoded `scale(4)` with `var(--hx-ripple-scale, 4)` token
- Added `will-change: transform, opacity` to `.ripple__wave` for compositor hints

### `hx-ripple.test.ts`

- Added `role="presentation"` rendering test
- Added `unbounded` property default and reflection tests
- Added keyboard ripple tests (Enter, Space, non-trigger keys)
- Added `color` prop backgroundColor assertion test
- Added `animationend` DOM cleanup test
- Added unbounded mode ripple creation test
- Added unbounded a11y test
- **Total: 22 tests** (up from 12)

### `hx-ripple.stories.ts`

- Added `unbounded` argType with control
- Added `Unbounded` story comparing bounded vs unbounded
- Added `OnIconButtons` story with icon-only buttons
- Added `ReducedMotion` story with accessibility documentation
- Added `--hx-ripple-scale` demo to CSS Custom Properties story
- **Total: 9 stories** (up from 6)

---

## CSS Custom Properties

| Token                  | Default        | Description                                |
| ---------------------- | -------------- | ------------------------------------------ |
| `--hx-ripple-color`    | `currentColor` | Color of the ripple wave                   |
| `--hx-ripple-opacity`  | `0.2`          | Opacity of the ripple wave                 |
| `--hx-ripple-duration` | `600ms`        | Duration of the ripple animation           |
| `--hx-ripple-scale`    | `4`            | Final scale factor of the ripple expansion |

---

## Remaining Items (P2 — not blocking)

- **R-12**: Drupal/Twig documentation — Should be added to Starlight docs site, not component code.
