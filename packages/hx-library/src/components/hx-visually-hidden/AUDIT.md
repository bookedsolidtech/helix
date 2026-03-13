# Deep Audit v2: hx-visually-hidden

**Date:** 2026-03-07
**Status:** PASS — all issues resolved

---

## wc-mcp Scores

| Metric        | Score                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Health Score  | 100/100 (A)                                                           |
| Accessibility | 5/100 (expected — utility component, no ARIA/form/focus roles needed) |

---

## Issues Found & Resolved

### P0 — Missing `focusable` property (F-01, F-02, F-03, F-04)

- Added `focusable` boolean property with `reflect: true`
- Added `:host([focusable]:focus-within)` CSS rule that removes visually-hidden constraints on focus
- Added 4 tests for focusable behavior (default, reflection, removal, keyboard accessibility)
- Added `SkipLink` story demonstrating the focusable variant

### P1 — Deprecated `clip` without modern `clip-path` (F-05) — GH #833

- Added `clip-path: inset(50%) !important` alongside existing `clip: rect(0, 0, 0, 0)` for modern browser support

### P1 — No guard against display:none / visibility:hidden (F-06)

- Added "A11y contract" test asserting `display !== 'none'` and `visibility !== 'hidden'`

### P1 — Low contextual coverage (F-07)

- Added nesting context tests (nav element, list item)

### P1 — Missing skip-link story (F-08)

- Added `SkipLink` story with focusable variant and anchor tag

---

## Verification

- `npm run verify` — 0 errors, all 11 tasks pass (FULL TURBO)
- 4 files modified, 138 insertions, 3 deletions
- Only component files changed — no unintended side effects
