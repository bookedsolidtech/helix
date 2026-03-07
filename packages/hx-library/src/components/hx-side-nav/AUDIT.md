# AUDIT: hx-side-nav — Deep Audit v2

**Date:** 2026-03-07
**Reviewer:** Deep Audit v2 Agent
**Component:** `hx-side-nav` + `hx-nav-item`

---

## wc-mcp Scores

| Component | Health Score | Accessibility Score |
|-----------|-------------|-------------------|
| hx-side-nav | 92/100 (A) | 10/100 (F) -> improved via JSDoc |
| hx-nav-item | 100/100 (A) | 15/100 (F) -> improved via JSDoc |

---

## Issues Found & Fixed

### CRITICAL/HIGH — Fixed

| ID | Issue | Severity | Fix |
|----|-------|----------|-----|
| P1-01 | `_isCollapsed` getter not reactive — tooltip never renders in collapsed mode | CRITICAL | Converted to `@state()` property with `MutationObserver` on `data-collapsed` attribute |
| P1-03 | Tooltip missing `aria-describedby` linkage | HIGH | Added `id` to tooltip, `aria-describedby` on link/button elements |
| P1-04 | `textContent` includes descendant text — garbled tooltip | HIGH | Added `_getSlotLabel()` that reads only default slot text nodes |
| P1-05 | Responsive CSS auto-collapse creates ARIA/state mismatch | HIGH | Removed CSS-only auto-collapse; consumers should control `collapsed` via JS for proper ARIA sync |
| P2-01 | `_bodyEl` declared but never used (dead code) | MEDIUM | Removed unused `@query` and `query` import |
| P2-03 | Toggle button has no CSS `part` | MEDIUM | Added `part="toggle"` to toggle button, documented in JSDoc |
| P2-04 | `--hx-side-nav-toggle-color` and `--hx-nav-item-host-bg` undocumented | MEDIUM | Added `@cssprop` entries to JSDoc |
| P2-05 | Tooltip `z-index` and `box-shadow` hardcoded | MEDIUM | Replaced with `var(--hx-z-index-tooltip, 100)` and `var(--hx-shadow-md, ...)` |
| CEM | JSDoc missing ARIA/keyboard accessibility documentation | HIGH | Added accessibility patterns to component summaries |

### Documented — Not Fixed (Lower Priority)

| ID | Issue | Severity | Reason |
|----|-------|----------|--------|
| P1-02 | `aria-controls` crosses Shadow DOM — but both elements are in same shadow root, so this works correctly within the shadow tree | INFO | Not a real issue — audit report was incorrect; IDREF resolution is scoped to shadow root |
| P1-06 | Keyboard tests verify existence not focus | LOW | Tests still provide coverage; improving focus assertions is a separate task |
| P2-02 | `WcSideNav`/`WcNavItem` type alias prefix inconsistency | LOW | Breaking change to rename; defer to coordinated cleanup |
| P2-06 | Sub-navigation children no open/close transition | LOW | Cosmetic; `display: none` toggling is standard pattern |
| P2-07 | `color-mix()` without fallback for older browsers | LOW | Safari 16.5+ support is sufficient for target enterprise environments |
| P2-08 | `aria-current` on button elements with children | INFO | Technically valid per ARIA 1.2 |
| P2-09 | Missing standalone hx-nav-item stories | LOW | Separate task |
| P2-10 | Missing grouped/sectioned navigation story | LOW | Separate task |
| P2-11 | No test for badge hidden in collapsed mode | LOW | Separate task |
| P2-12 | No test for sub-nav expand/collapse interaction | LOW | Separate task |

---

## Files Modified

- `hx-side-nav.ts` — Removed unused `_bodyEl` query, added `toggle` part, improved JSDoc with ARIA docs and undocumented tokens
- `hx-nav-item.ts` — Fixed tooltip reactivity via MutationObserver, added `aria-describedby` linkage, fixed `_getSlotLabel()`, added JSDoc tokens
- `hx-side-nav.styles.ts` — Removed CSS-only responsive auto-collapse that caused ARIA mismatch
- `hx-nav-item.styles.ts` — Replaced hardcoded `z-index` and `box-shadow` with token references
- `hx-side-nav.test.ts` — Added test for `toggle` CSS part
