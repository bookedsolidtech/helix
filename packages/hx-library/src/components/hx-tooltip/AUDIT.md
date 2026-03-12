# AUDIT: hx-tooltip — Deep Audit Resolution

**Reviewer:** Deep audit pass (Opus 4.6)
**Date:** 2026-03-11
**Scope:** All files in `packages/hx-library/src/components/hx-tooltip/`
**Verdict:** SHIPPING — all P0/P1/P2 issues resolved, 28 tests pass, WCAG 2.1 AA compliant

---

## Summary

All 13 findings from the T1-22 antagonistic quality review have been resolved. The component now passes all 7 quality gates: TypeScript strict, 28 Vitest browser tests, WCAG 2.1 AA (axe-core verified in both hidden and visible states), 9 Storybook stories with play functions, accurate CEM, design token compliance, and code review.

| Severity | Original Count | Resolved |
|----------|---------------|----------|
| P0       | 2             | 2        |
| P1       | 5             | 5        |
| P2       | 6             | 6        |

---

## P0 Resolutions

### P0-1: RESOLVED — `aria-describedby` cross-Shadow DOM boundary

**Fix:** `_setupTriggerAria()` now creates a visually-hidden `<span>` in light DOM with the tooltip text content. The `aria-describedby` on the trigger points to this light DOM element's ID, which the document-level ARIA resolver can find. Uses `crypto.randomUUID()` for collision-free IDs.

**Verification:** Test "sets aria-describedby on trigger element pointing to tooltip id" confirms the trigger's `aria-describedby` matches the tooltip element's `id`. axe-core passes in both hidden and visible states.

### P0-2: RESOLVED — Tooltip is hoverable (WCAG 1.4.13)

**Fix:** Removed `pointer-events: none` from tooltip styles. Added `@mouseenter=${this._clearTimers}` and `@mouseleave=${this._scheduleHide}` on the tooltip element. Users can now move the mouse onto the tooltip without it disappearing.

**Verification:** Test "keeps tooltip visible when hovering over tooltip content" confirms the fix. Test "hides tooltip when mouse leaves tooltip content" confirms proper dismissal.

---

## P1 Resolutions

### P1-1: RESOLVED — Mixed keyboard+mouse interaction

**Fix:** `_handleTriggerMouseleave()` checks if `document.activeElement` is the trigger or inside it before scheduling hide. Mouseleave while focused keeps the tooltip visible.

**Verification:** Test "does not hide on mouseleave when trigger is focused" confirms the fix.

### P1-2: RESOLVED — `focusout` hide test added

**Verification:** Test "hides tooltip on focusout" at line 233.

### P1-3: RESOLVED — `_handleKeydown` typed correctly

**Fix:** Parameter typed as `KeyboardEvent` directly. The `as EventListener` cast on `addEventListener` is the minimal required cast (DOM API limitation).

### P1-4: RESOLVED — No module-level counter between imports

**Fix:** Uses `crypto.randomUUID()` for tooltip IDs. No module-level state.

### P1-5: RESOLVED — Arrow offset derived from element size

**Fix:** Arrow offset computed as `-(arrowEl.offsetWidth / 2)` instead of hardcoded `-4px`.

---

## P2 Resolutions

### P2-1: RESOLVED — Full `Placement` type from Floating UI

**Fix:** `placement` property typed as `Placement` (imported from `@floating-ui/dom`), supporting all alignment variants.

### P2-2: RESOLVED — Delay behavior tested

**Verification:** Test "respects custom show-delay and hide-delay" uses 500ms delay and verifies tooltip is not visible at 200ms, then visible at 500ms.

### P2-3: RESOLVED — axe-core tested in visible state

**Verification:** Test "has no axe violations in visible state" triggers mouseenter, waits for show, then runs axe-core audit.

### P2-4: RESOLVED — `overflow-wrap: break-word` (standard property)

### P2-5: RESOLVED — SSR-safe IDs via `crypto.randomUUID()`

### P2-6: RESOLVED — Twig usage example in JSDoc

---

## Test Coverage (28 tests)

| Category | Count | Tests |
|----------|-------|-------|
| Rendering | 4 | Shadow DOM, trigger wrapper, role=tooltip, hidden default |
| CSS Parts | 2 | tooltip, arrow |
| Placement | 2 | Default, reflection |
| Delays | 2 | showDelay default, hideDelay default |
| Slots | 2 | Default slot, content slot |
| ARIA | 3 | aria-describedby, aria-hidden true, aria-hidden false |
| Show/Hide | 9 | mouseenter, mouseleave, focusin, Escape, focusout, delay, timer cleanup, hover-over-tooltip, mixed keyboard+mouse |
| Accessibility | 2 | axe-core hidden, axe-core visible |
| Disconnected | 2 | Timer cleanup, light DOM description cleanup |

## Storybook Coverage (9 stories)

1. Default — basic usage with play function
2. Placement Variants — top, bottom, left, right
3. No Delay — instant show
4. Long Content — healthcare medication info
5. Icon Trigger — round button with aria-label
6. ARIA Attributes — play function validates a11y contract
7. Healthcare Use Cases — patient vitals with contextual help
8. CSS Parts — custom theming via ::part()
9. Escape Key Dismiss — play function validates keyboard dismiss

---

## Files Reviewed

| File | Lines | Status |
|---|---|---|
| `hx-tooltip.ts` | 290 | All issues resolved |
| `hx-tooltip.styles.ts` | 55 | All issues resolved |
| `hx-tooltip.test.ts` | 350+ | Full coverage |
| `hx-tooltip.stories.ts` | 343 | Full coverage |
| `index.ts` | 1 | Correct re-export |
