# AUDIT: hx-popover (T2-08) — Antagonistic Quality Review

**Reviewed:** `packages/hx-library/src/components/hx-popover/`
**Files audited:**

- `hx-popover.ts`
- `hx-popover.styles.ts`
- `hx-popover.test.ts`
- `hx-popover.stories.ts`
- `index.ts`

---

## Summary

| Severity | Count |
| -------- | ----- |
| P0       | 2     |
| P1       | 7     |
| P2       | 6     |

---

## P0 — Critical (blocks merge)

### P0-01: No click-outside-to-close

**File:** `hx-popover.ts`

The component has no document-level click listener to close the popover when the user clicks outside of it. This is a fundamental UX requirement for all popover/dropdown components. Currently, the only ways to close are: second click on the trigger, Escape key, or programmatic `open = false`.

A click listener must be added on `document` (in `_show`, removed in `_hide`) that calls `_hide()` when the click target is outside the component's shadow root. Without this, users have no standard way to dismiss the popover.

There is also no test coverage for click-outside behavior (because the feature is absent), which the audit description explicitly requires.

---

### P0-02: `role="dialog"` applied universally without focus management

**File:** `hx-popover.ts`, lines 301–313

`role="dialog"` is unconditionally applied to the popover body for all trigger modes and all content types. The ARIA spec requires that when a `dialog` element is opened, focus must move into it (typically to the first focusable element or the dialog container itself). This implementation does **not** move focus on show.

**Consequences:**

- Screen readers announce the element as a dialog and expect focus to transfer in, but focus stays on the trigger.
- VoiceOver (macOS/iOS) will not automatically read the popover content.
- AT users on click-trigger mode will hear "button, collapsed" → click → focus stays on button → popover content is invisible to them unless they manually navigate.

**Fix options (either acceptable):**

1. Change `role` to `tooltip` for non-interactive / informational popovers and add a `role` property allowing callers to opt into `dialog` + focus management.
2. Add `tabindex="-1"` to the body element and call `bodyEl.focus()` inside `_show()`, then return focus to the trigger inside `_hide()`.

---

## P1 — High (significant quality gap)

### P1-01: `aria-label="Popover"` is hardcoded and non-descriptive

**File:** `hx-popover.ts`, line 306

The dialog body has `aria-label="Popover"` hardcoded. Screen readers announce this as "Popover, dialog" — entirely useless. There is no way for the consumer to provide a meaningful label (e.g., "Patient details", "Help text for date field").

A `label` or `heading` property should be added, or the component should support `aria-labelledby` pointing to a heading in the default slot.

---

### P1-02: Hidden popover body is not `inert`

**File:** `hx-popover.ts`, lines 301–313

When the popover is hidden (`aria-hidden="true"`), the body element is visually hidden via CSS (`visibility: hidden; opacity: 0`) and hidden from the AT tree via `aria-hidden`. However, it is **not** marked `inert`. This means:

- Keyboard users can Tab into focusable elements inside the hidden popover content (links, buttons, form fields in the default slot).
- This is a WCAG 2.1 AA violation under SC 2.1.1 (Keyboard) and SC 1.3.1 (Info and Relationships).

The body element should receive the `inert` attribute when `_visible === false`, and it should be removed when `_visible === true`.

---

### P1-03: Escape key only works when focus is on the host element or a child

**File:** `hx-popover.ts`, lines 117, 248–252

The `keydown` listener is attached to `this` (the host element). If `trigger="click"` opens a popover and the user Tabs into content elsewhere on the page, pressing Escape will not close the popover because the event target is no longer within the component.

The listener should be on `document` while the popover is open (added in `_show`, removed in `_hide`), consistent with how `role="dialog"` semantics work in production.

---

### P1-04: `aria-expanded` is not updated on open/close after initial setup ✅ FIXED

**Resolution:** Added test `aria-expanded cycles false → true → false across open/close` verifying the full open/close cycle updates `aria-expanded` correctly on the anchor element.

---

### P1-05: Missing test — hover `mouseleave` hides popover ✅ FIXED

**Resolution:** Added test `hides on mouseleave when trigger="hover"` verifying that `_handleAnchorMouseLeave` correctly closes the popover when the mouse leaves the anchor.

---

### P1-06: Missing test — `trigger="focus"` open and close ✅ FIXED

**Resolution:** Added two tests: `shows on focusin when trigger="focus"` and `hides on focusout when trigger="focus"`, covering both the open and close paths for the focus trigger mode.

---

### P1-07: Missing tests for `hx-after-show` and `hx-after-hide` events ✅ FIXED

**Resolution:** Added tests `dispatches hx-after-show after the popover is fully visible` and `dispatches hx-after-hide after the popover is fully hidden`, completing the event coverage for all four lifecycle events.

---

## P2 — Medium (code quality / completeness)

### P2-01: Hardcoded `rgba(0,0,0,0.12)` fallback in box-shadow — **[FIXED]**

**File:** `hx-popover.styles.ts`, line 25

```css
box-shadow: var(--hx-popover-shadow, 0 4px 16px rgba(0, 0, 0, 0.12));
```

The fallback `0 4px 16px rgba(0, 0, 0, 0.12)` is a hardcoded value. The project convention (CLAUDE.md) requires: "No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always." This should use `var(--hx-shadow-md)` or an equivalent token, with the raw value as the last resort only if no token exists.

**Resolution:** Updated to use `var(--hx-shadow-md, 0 4px 16px var(--hx-overlay-black-12, rgba(0, 0, 0, 0.12)))` — token cascade with `--hx-overlay-black-12` semantic token as intermediate fallback.

---

### P2-02: Arrow border clipping — wrong border side shown for each placement ✅ FIXED

**Resolution:** `_updatePosition()` now resets all four border sides on the arrow element and then applies `1px solid transparent` to the two inward-facing sides for each placement direction via `innerBorderMap`. The mapping (`bottom → border-bottom + border-right`, `top → border-top + border-left`, `right → border-top + border-right`, `left → border-bottom + border-left`) ensures only the two outward-facing corner edges of the rotated square are visible, eliminating the inner border artefact.

---

### P2-03: `_setupAnchorAria` and `_updateAnchorAriaExpanded` are duplicate logic

**File:** `hx-popover.ts`, lines 145–167

Both methods perform the same slot query and `setAttribute('aria-expanded', ...)` call. `_setupAnchorAria` sets the initial value; `_updateAnchorAriaExpanded` updates it on show/hide. They can be collapsed into a single `_setAnchorAriaExpanded(value: boolean)` method.

---

### P2-04: Storybook `Placements` story shows only 4 of 12 placement variants

**File:** `hx-popover.stories.ts`, lines 154–170

The `Placements` story iterates over `['top', 'bottom', 'left', 'right']` — only the 4 cardinal directions. The type system supports 12 variants (`top-start`, `top-end`, `right-start`, `right-end`, `bottom-start`, `bottom-end`, `left-start`, `left-end` are absent). The story should demonstrate all variants, especially the alignment variants which are the most likely to have visual regressions.

---

### P2-05: `display: inline-block` on `:host` may cause unexpected layout behavior — **[FIXED]**

**File:** `hx-popover.styles.ts`, line 5

```css
:host {
  display: inline-block;
  position: relative;
}
```

The `position: relative` on `:host` is vestigial — the popover body uses `position: fixed` and is positioned via Floating UI, so the `:host` offset origin is irrelevant. More importantly, `display: inline-block` causes the component to collapse to zero height in flex/grid containers when the anchor slot is empty, potentially affecting page layout in ways that are hard to debug. Consider `display: contents` with inline-block applied only to `.trigger-wrapper`, or document the expected host display behavior.

**Resolution:** `:host` now uses `display: contents`; `.trigger-wrapper` uses `display: inline-block`. The vestigial `position: relative` on `:host` has been removed.

---

### P2-06: Module-level `_popoverCounter` is not SSR-safe

**File:** `hx-popover.ts`, line 7

```ts
let _popoverCounter = 0;
```

Module-level mutable state causes ID collisions when the module is imported in multiple documents/frames (e.g., Storybook iframes, server-side rendering). The generated `_popoverId` is used as the `id` on the body element. While `aria-controls` is intentionally omitted (with a code comment explaining the cross-root limitation), if a future fix re-introduces `aria-controls` or uses the ID for any purpose, duplicate IDs will cause silent bugs. The counter should use `crypto.randomUUID()` or a weakref-based approach.

---

## Non-Issues (confirmed acceptable)

- **`aria-controls` omitted**: Correctly documented in code comment. Cross-root IDREF cannot be resolved by axe-core. This is a known Shadow DOM limitation.
- **Floating UI vs. browser Popover API**: Using Floating UI is acceptable and provides broader browser support.
- **TypeScript types**: `PopoverPlacement` and `TriggerMode` union types are correct and complete. No `any` types found. P2-02 (arrow border logic) ✅ FIXED.
- **Token usage (general)**: CSS custom properties follow the `--hx-*` pattern consistently (except P2-01 above).
- **`@floating-ui/dom` `arrow` function naming**: The imported `arrow` function and the `@property() arrow` boolean coexist without TypeScript conflict because `this.arrow` (class property) and `arrow` (module import) are distinct identifiers. This is not a defect, though it reduces readability.
