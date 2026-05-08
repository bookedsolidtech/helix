# AAA Audit — HelixActionBar

**Component:** `hx-action-bar`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-action-bar.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Container surface only; no text in shadow DOM. Slotted action buttons carry their own AAA-cert contrast guarantees. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | No text samples in shadow DOM (probe returns 0 → vacuously satisfied). Container is purely a slot wrapper around inner `div[role="toolbar"]`. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | No focus ring on container itself (delegates to slotted children). Optional sticky-mode shadow uses `--hx-color-shadow-md` which is ≥3:1 luminance change against the page background. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | No hover popovers or tooltips at the toolbar level. |
| 2.1.1 | Keyboard | A | `hx-action-bar.test.ts` keyboard suite + KeyboardNavigation story | pass | Roving tabindex implemented in `_handleKeydown` (line 159-183): ArrowLeft/Right move focus, Home/End jump to first/last. Slotted action items are individually focusable; only one carries `tabindex="0"` at a time per APG toolbar pattern. |
| 2.1.3 | Keyboard (No Exception) | AAA | toolbar pattern | pass | All operations are single-keystroke. No timing or path-dependent input. Disabled children excluded from roving via `_isFocusable` (line 224-236) which checks both native `disabled` attribute and the custom-element `disabled` property. |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 N/A skip | pass | Container is N/A (toolbar/group container delegates focus to slotted children — see matrix harness toolbar/group container exemption added this batch). Slotted hx-button children paint their own focus rings (each AAA-cert'd independently). |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual + Sticky story review | pass | Container does not obscure children's focus rings in default story. Sticky-mode positioning preserves children's focus visibility (sticky bar slides; ring outline is unobstructed). |
| 2.4.13 | Focus Appearance | AAA | matrix harness skip | pass | N/A at container per matrix harness toolbar/group container carve-out (mirrors hx-checkbox-group / hx-radio-group / hx-button-group precedent). Slotted children carry the rings. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Container is non-clickable; slotted action items carry hit areas (each ≥ 40×40 desktop carve-out, 44×44 sm touch-mandate). Container 2.5.5 exemption documented in matrix harness `isActionBar` carve-out. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) + manual | pass | Inner `div[role="toolbar"]` carries the toolbar role + `aria-orientation="horizontal"` (test confirms "toolbar has aria-orientation"). Host element gets `role="none"` (line 199) to prevent dual announcement — host's `aria-label` is mirrored onto the inner toolbar (line 194-205 doc). Required `accessible-label` or `aria-label` provides the toolbar's accessible name. |

## Keyboard contract

`navigate=Arrow; activate=Enter,Space; disabled-suppresses=true`

APG `toolbar` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) with full roving-tabindex implementation:

- **ArrowRight**: focus next focusable item (wraps to first at end via `_moveFocus('next')`)
- **ArrowLeft**: focus previous focusable item (wraps to last at start)
- **Home**: focus first item, set `tabindex="0"` on first / `-1` on rest (line 167-173)
- **End**: focus last item, set `tabindex="0"` on last / `-1` on rest (line 174-181)
- **Tab/Shift+Tab**: enters/exits the toolbar at the currently-roving item (single tab stop in document tab order)
- **Enter/Space**: activate the focused item via the item's own contract
- **Disabled items**: excluded from roving (`_isFocusable` returns false for both `[disabled]` attribute and `disabled` property)

## ARIA pattern

`toolbar` — https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/

Strict APG-aligned implementation:

1. Inner `<div role="toolbar">` is the announced surface (line 194-197 comment).
2. Host element receives `role="none"` (line 199) to suppress dual announcement; `devWarn` fires if consumer overrides (line 201-205).
3. `aria-orientation` is always `horizontal` in current implementation (vertical orientation deferred to future scope).
4. `aria-label` flows through standard host attribute mirroring (line 134) and is duplicated to the inner `[role="toolbar"]`.
5. Roving tabindex on slotted children: only one carries `tabindex="0"` at a time. `_initRovingTabindex` (called from `firstUpdated`, line 213) initializes; `_handleKeydown` updates on navigation.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-action-bar/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

Container styles (background, border, shadow) collapse to system defaults under forced-colors. Children inherit their own forced-colors styling (hx-button's `forced-colors-interactive`). Sticky variant renders correctly under forced-colors (no transparency). Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **2.4.13 N/A at container:** matrix harness explicit carve-out (toolbar/group container exemption added this batch). Container delegates focus to slotted children; the children's rings are independently AAA-cert'd via hx-button.
- **2.5.5 N/A at container:** matrix harness `isActionBar` exemption — container has no inner clickable; children carry hit areas.
- **Roving tabindex correctness:** Home/End paths intentionally bypass `_moveFocus` (line 168 comment) — `_moveFocus` would walk through items en route to the target; the explicit-tabindex assignment + direct focus is the APG-correct behavior.
- **Slot change resilience:** `_focusableCache` (line 240) is invalidated on slotchange so dynamically added/removed items maintain the roving contract.
- **Host `role="none"` requirement:** the dual-announcement gate (line 198-206) is documented and dev-warned. Consumers cannot break the toolbar role binding without an explicit warning.
- **Accessible label is required:** line 115-117 doc — when multiple toolbars appear on the same page, each must have a unique `aria-label` or `accessible-label`. Falls back to the literal "Actions" if neither is set (line 138-141 doc) so AT users always have a name.
- **`accessible-label` legacy attribute:** retained for backwards compatibility; new code uses standard `aria-label`. Both flow into the inner toolbar element.
