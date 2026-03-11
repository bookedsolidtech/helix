# Deep Audit v3 — hx-accordion

**Date:** 2026-03-11
**Auditor:** Deep opus-level audit — comprehensive review across all audit categories
**Files reviewed:** hx-accordion.ts, hx-accordion-item.ts, hx-accordion.styles.ts, hx-accordion-item.styles.ts, hx-accordion.test.ts, hx-accordion.stories.ts, index.ts, custom-elements.json

---

## Audit Summary

| Category      | Status   | Issues Found | Issues Fixed |
| ------------- | -------- | ------------ | ------------ |
| API / CEM     | FIXED    | 3            | 3            |
| Accessibility | FIXED    | 1            | 1            |
| TypeScript    | FIXED    | 1            | 1            |
| Tests         | IMPROVED | 0 new bugs   | +8 tests     |
| Storybook     | PASS     | 0            | -            |
| Design Tokens | PASS     | 0            | -            |
| CSS/Styling   | PASS     | 0            | -            |
| Shadow DOM    | PASS     | 0            | -            |
| Performance   | PASS     | 0            | -            |
| Drupal Compat | PASS     | 0            | -            |

---

## Issues Found and Fixed

### P1 (High) — Fixed

#### P1-1: CEM phantom event `eventName`

- **File:** hx-accordion-item.ts:82
- **Problem:** The CEM analyzer parsed the local variable `const eventName = expanded ? 'hx-expand' : 'hx-collapse'` as an event declaration, producing a phantom unnamed event in `custom-elements.json`. Consumers reading auto-generated API docs saw 3 events instead of 2.
- **Fix:** Replaced ternary-based dispatch with explicit if/else branches using string literals directly in `new CustomEvent('hx-expand', ...)` / `new CustomEvent('hx-collapse', ...)`. CEM now correctly shows exactly 2 events.

#### P1-2: Missing `aria-controls` on summary (WCAG 2.1 SC 1.3.1)

- **File:** hx-accordion-item.ts:119-137
- **Problem:** The `<summary>` trigger element lacked `aria-controls` pointing to the content panel. Per the ARIA APG Accordion pattern, the trigger must programmatically associate with its controlled panel. Screen readers couldn't navigate from trigger to panel.
- **Fix:** Added `aria-controls="content"` on `<summary>` and `id="content"` on the content `<div>`. Since these are inside shadow DOM, IDs are scoped per component instance — no collision risk. Added test verifying the relationship.

#### P1-3: Arrow key navigation untested

- **File:** hx-accordion.test.ts
- **Problem:** The `_handleKeyDown` handler in hx-accordion.ts implements ArrowDown, ArrowUp, Home, End navigation per ARIA APG — but zero tests verified this behavior. A regression could silently break keyboard navigation for screen reader and keyboard-only users.
- **Fix:** Added 4 tests covering all arrow key navigation paths (ArrowDown, ArrowUp, Home, End).

### P2 (Medium) — Fixed

#### P2-1: `accordion` CSS part undocumented in JSDoc

- **File:** hx-accordion.ts:15-17
- **Problem:** The parent component exposes `part="accordion"` in its render template but lacked a `@csspart` JSDoc tag. CEM didn't include it, so consumer tooling couldn't discover it.
- **Fix:** Added `@csspart accordion - The outer container wrapping all accordion items.` to the JSDoc block. CEM now lists it.

#### P2-2: `as EventListener` type cast

- **File:** hx-accordion.ts:45,53
- **Problem:** `this._handleChildExpand as EventListener` is a TypeScript safety escape that circumvents type checking on the event parameter. If the event shape changes, the cast silently accepts the mismatch.
- **Fix:** Converted `_handleChildExpand` from a regular method to an arrow function property with `Event` parameter type, eliminating the cast. Arrow function also ensures correct `this` binding without relying on the cast.

#### P2-3: Missing edge case tests

- **File:** hx-accordion.test.ts
- **Problem:** No tests for empty accordion, single-item accordion, `aria-hidden` toggle on expand, or `aria-controls` relationship.
- **Fix:** Added 4 tests: empty accordion renders without errors, single-item accordion works, `aria-hidden` removed when expanded, `aria-controls` points to content panel with `role="region"`.

---

## Remaining Items (LOW — documented for follow-up)

| ID   | Issue                                     | Severity | Notes                                                                                                                                                                                              |
| ---- | ----------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-4 | `_dispatchToggleEvent` is semi-public API | LOW      | Parent accordion calls it directly. Consider a custom event or internal method pattern instead.                                                                                                    |
| P2-5 | `itemId` defaults to empty string         | LOW      | Consumers can't distinguish un-identified items in events. Consider auto-generating IDs.                                                                                                           |
| P2-6 | No story for nested accordions            | LOW      | Edge case not demonstrated in Storybook.                                                                                                                                                           |
| P2-7 | No story for dynamic add/remove           | LOW      | No demo of programmatic item insertion/removal.                                                                                                                                                    |
| P2-8 | No axe-core automated a11y tests          | LOW      | Recommend adding `vitest-axe` or similar for holistic WCAG validation.                                                                                                                             |
| P3-1 | No heading role wrapper on triggers       | INFO     | ARIA APG recommends `role="heading"` on trigger containers. Current `<summary>` with `aria-expanded` works for most AT but explicit heading semantics would improve navigation landmark discovery. |

---

## Test Coverage

- **Before:** 30 tests
- **After:** 38 tests (+8)
- **New tests added:**
  1. ArrowDown moves focus to next item trigger
  2. ArrowUp moves focus to previous item trigger
  3. Home moves focus to first item trigger
  4. End moves focus to last item trigger
  5. Empty accordion renders without errors
  6. Single-item accordion works
  7. Content does NOT have aria-hidden when expanded
  8. Summary has aria-controls pointing to content panel

---

## Verification Gates

| Gate                                     | Status                               |
| ---------------------------------------- | ------------------------------------ |
| TypeScript strict (`npm run type-check`) | PASS — 0 errors                      |
| Tests (`vitest run`)                     | PASS — 38/38                         |
| Lint + Format (`npm run verify`)         | PASS                                 |
| CEM accuracy                             | PASS — 2 events, 5 parts, no phantom |
| Files changed                            | 3 files (accordion component only)   |

---

## CEM Accuracy Audit

### hx-accordion

| API Surface                    | CEM Status | Notes                   |
| ------------------------------ | ---------- | ----------------------- |
| `mode` attr                    | Listed     | `'single' \| 'multi'`   |
| Default slot                   | Listed     | For `hx-accordion-item` |
| `accordion` part               | Listed     | **Added in this audit** |
| `--hx-accordion-border-radius` | Listed     | Semantic token          |

### hx-accordion-item

| API Surface      | CEM Status | Notes                         |
| ---------------- | ---------- | ----------------------------- |
| `expanded` attr  | Listed     | Boolean, reflected            |
| `disabled` attr  | Listed     | Boolean, reflected            |
| `trigger` slot   | Listed     | Named slot for heading        |
| Default slot     | Listed     | For body content              |
| `hx-expand`      | Listed     | CustomEvent with detail       |
| `hx-collapse`    | Listed     | CustomEvent with detail       |
| `item` part      | Listed     | On `<details>`                |
| `trigger` part   | Listed     | On `<summary>`                |
| `content` part   | Listed     | On content `<div>`            |
| `icon` part      | Listed     | On chevron `<span>`           |
| 8 CSS properties | Listed     | All `--hx-accordion-*` tokens |

---

## Design Token Audit

All CSS values use `--hx-` prefixed tokens with proper three-tier cascade:

- Primitive fallbacks present (e.g., `#dee2e6`, `1rem`, `600`)
- Semantic tokens used (e.g., `--hx-color-neutral-200`, `--hx-space-4`)
- Component tokens exposed (e.g., `--hx-accordion-border-color`, `--hx-accordion-trigger-padding`)
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables all transitions
- Focus ring uses `--hx-focus-ring-width` and `--hx-focus-ring-color` tokens
- No hardcoded colors, spacing, or typography values in component code

---

## Storybook Audit

12 stories covering:

1. Default — basic 3-item accordion
2. Single Mode — with interaction test
3. Multi Mode — with interaction test
4. Pre-Expanded — item starts open
5. Disabled Item — with interaction test
6. Keyboard Navigation — Enter/Space test
7. Event Handling — expand/collapse event test
8. Progressive Enhancement — native details fallback
9. CSS Parts — external ::part() styling
10. CSS Custom Properties — token override demo
11. Healthcare: FAQ Section — real-world scenario
12. Healthcare: Clinical Protocols — multi-mode scenario
13. All Combinations — single/multi/disabled overview

All stories have proper argTypes, controls, and autodocs tag.

---

## Shadow DOM Encapsulation Audit

- `:host` display: block on both components
- All styles scoped to shadow DOM
- CSS Parts exposed for external styling: `accordion`, `item`, `trigger`, `content`, `icon`
- Slots: `trigger` (named), default (unnamed) on item; default on parent
- No style leakage — verified via CSS Parts story
- Token-based theming only (`--hx-*` custom properties cascade through shadow boundary)

---

## Performance Notes

- Chevron SVG is a module-level constant (no re-creation per render)
- CSS grid animation pattern (`grid-template-rows: 0fr → 1fr`) is GPU-compositable
- No unnecessary re-renders — only `expanded` and `disabled` trigger updates
- Event listeners properly cleaned up in `disconnectedCallback`
