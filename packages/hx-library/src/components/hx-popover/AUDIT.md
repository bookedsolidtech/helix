# AUDIT: hx-popover — Deep Audit v2

**Reviewed:** `packages/hx-library/src/components/hx-popover/`
**Files audited:**

- `hx-popover.ts`
- `hx-popover.styles.ts`
- `hx-popover.test.ts`
- `hx-popover.stories.ts`
- `index.ts`

**wc-mcp Health Score:** 86/100 (B) — pre-audit
**wc-mcp Accessibility Score:** 0/100 (F) — CEM lacks accessibility documentation

---

## Summary

| Severity | Found | Fixed | Remaining |
| -------- | ----- | ----- | --------- |
| CRITICAL | 2     | 1     | 1         |
| HIGH     | 7     | 3     | 4         |
| MEDIUM   | 6     | 0     | 6         |

---

## CRITICAL Issues

### P0-01: No click-outside-to-close — FIXED

**File:** `hx-popover.ts`

Added `_handleOutsideClick` handler using `e.composedPath()` to detect clicks outside the component. Listener registered on `document` (capture phase) via `queueMicrotask` in `_show()`, removed in `_hide()` and `disconnectedCallback()`. Only fires when `trigger="click"`.

Tests added: click-outside dismiss, click-inside stays open.

---

### P0-02: `role="dialog"` applied universally without focus management — DOCUMENTED

**File:** `hx-popover.ts`

`role="dialog"` is applied unconditionally. The ARIA spec requires focus to move into a dialog on open, but this implementation keeps focus on the trigger. For simple informational popovers, `role="tooltip"` may be more appropriate.

**Recommendation:** Add a `role` property defaulting to `"dialog"` that allows consumers to set `"tooltip"` for non-interactive content. When `role="dialog"`, add `tabindex="-1"` to body and call `focus()` on show, restoring focus on hide.

---

## HIGH Issues

### P1-01: `aria-label="Popover"` hardcoded — FIXED

**File:** `hx-popover.ts`

Added `label` property (default `"Popover"`) that maps to `aria-label` on the dialog body. Consumers can now set `label="Patient details"` for meaningful screen reader announcements.

Tests added: default label, custom label.

---

### P1-02: Private members leaking to CEM — FIXED

**File:** `hx-popover.ts`

Added `@internal` JSDoc tags to all private state/handlers: `_visible`, `_popoverId`, `_handleKeydown`, `_handleOutsideClick`, `_handleAnchorClick`, `_handleAnchorMouseEnter`, `_handleAnchorMouseLeave`, `_handleAnchorFocusIn`, `_handleAnchorFocusOut`.

---

### P1-03: Accessibility JSDoc missing from class description — FIXED

**File:** `hx-popover.ts`

Added accessibility documentation to the class JSDoc describing `aria-expanded` on anchor, `role="dialog"`, configurable `aria-label`, Escape dismiss, and click-outside dismiss.

---

### P1-04: Hidden popover body is not `inert` — DOCUMENTED

**File:** `hx-popover.ts`

When hidden (`aria-hidden="true"`), keyboard users can Tab into focusable elements inside the popover content. The body should receive the `inert` attribute when `_visible === false`.

---

### P1-05: Escape key only works when focus is on host or child — DOCUMENTED

**File:** `hx-popover.ts`

The `keydown` listener is on `this` (host element). If focus moves elsewhere on the page, Escape won't close the popover. The listener should be on `document` while open.

---

### P1-06: Missing test — hover `mouseleave` hides popover — DOCUMENTED

**File:** `hx-popover.test.ts`

`mouseenter` tested, but no test for `mouseleave` closing the popover.

---

### P1-07: Missing test — `trigger="focus"` open and close — DOCUMENTED

**File:** `hx-popover.test.ts`

No tests for `trigger="focus"`. Both `focusin` and `focusout` handlers are untested.

---

## MEDIUM Issues (Documented — no fix applied)

### P2-01: Hardcoded `rgba(0,0,0,0.12)` fallback in box-shadow

**File:** `hx-popover.styles.ts`, line 25

Should use a design token like `var(--hx-shadow-md)` instead of a raw rgba value.

### P2-02: Arrow border clipping — wrong border side shown

**File:** `hx-popover.styles.ts`, `hx-popover.ts`

Arrow renders all 4 border sides. The two sides facing the popover body should be transparent.

### P2-03: Duplicate ARIA methods

**File:** `hx-popover.ts`

`_setupAnchorAria` and `_updateAnchorAriaExpanded` can be collapsed into a single method.

### P2-04: Storybook Placements story shows only 4 of 12 variants

**File:** `hx-popover.stories.ts`

Only cardinal directions shown. All 12 placement variants should be demonstrated.

### P2-05: `display: inline-block` + `position: relative` on `:host`

**File:** `hx-popover.styles.ts`

`position: relative` is vestigial since body uses `position: fixed`. Consider `display: contents`.

### P2-06: Module-level `_popoverCounter` is not SSR-safe

**File:** `hx-popover.ts`

Module-level counter causes ID collisions across frames. Consider `crypto.randomUUID()`.

---

## Audit Dimensions

| #   | Dimension            | Status   | Notes                                                                                                                         |
| --- | -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Design Tokens        | PASS     | 11 `--hx-popover-*` tokens with semantic fallbacks. P2-01 box-shadow exception.                                               |
| 2   | Accessibility        | PARTIAL  | role=dialog, aria-expanded, aria-hidden, Escape dismiss all present. Missing: inert, focus management, document-level Escape. |
| 3   | Functionality        | PASS     | Click/hover/focus/manual triggers. 12 placements via Floating UI. Arrow. Click-outside dismiss (added).                       |
| 4   | TypeScript           | PASS     | Strict mode. No `any`. Clean union types for placement/trigger.                                                               |
| 5   | CSS/Styling          | PASS     | Shadow DOM encapsulation. CSS Parts (body, arrow). prefers-reduced-motion.                                                    |
| 6   | CEM Accuracy         | IMPROVED | Private members tagged @internal. New `label` property documented.                                                            |
| 7   | Tests                | PASS     | 30 tests. Rendering, properties, slots, ARIA, show/hide, events, click-outside, label, axe-core.                              |
| 8   | Storybook            | PASS     | 9 stories. Default, arrow, placements, triggers, manual, rich content, events, escape, CSS parts.                             |
| 9   | Drupal Compatibility | PASS     | Standard slots, attributes, events. Twig-friendly.                                                                            |
| 10  | Portability          | PASS     | CDN-ready. No framework dependencies beyond Lit.                                                                              |

---

## Test Coverage

- **Total tests:** 30 (was 26, added 4)
- **New tests:** click-outside dismiss (2), label property (2)
- **Axe-core:** 2 tests (default + open state), zero violations
