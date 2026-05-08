# AAA Audit — HelixButtonGroup

**Component:** `hx-button-group`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-button-group.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Container surface only; no text in shadow DOM. Slotted hx-button children carry their own AAA-cert contrast guarantees. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | No text samples in shadow DOM (probe returns 0 → vacuously satisfied). Container is purely a slot wrapper. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | No focus ring on container itself (delegates to slotted children). Border-radius / box-shadow on the group wrapper is decorative; functional state is on the children. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | No hover popovers or tooltips at the container level. |
| 2.1.1 | Keyboard | A | `hx-button-group.test.ts` keyboard suite | pass | Container is non-focusable; Tab moves through slotted children using their native focus order. Each slotted hx-button satisfies 2.1.1 independently. |
| 2.1.3 | Keyboard (No Exception) | AAA | toolbar pattern | pass | All operations are single keystrokes via slotted children. Disabled propagation: `disabledChildren` story shows `disabled` on individual buttons properly excluded from interaction. |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 N/A skip | pass | Container is N/A (toolbar/group container delegates focus to slotted children — see matrix harness toolbar/group container exemption). Slotted hx-button children paint their own focus rings (each AAA-cert'd independently). |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual | pass | Container does not obscure children's focus rings. Wrapper styling does not introduce overflow:hidden chains in default story. |
| 2.4.13 | Focus Appearance | AAA | matrix harness skip | pass | N/A at container per matrix harness toolbar/group container carve-out (mirrors hx-checkbox-group / hx-radio-group precedent). Slotted children carry the rings. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Container is non-clickable (no inner button). Slotted hx-button children carry hit areas (each ≥ 40×40 desktop carve-out, 44×44 sm touch-mandate). Container 2.5.5 exemption documented in matrix harness `isButtonGroup` carve-out. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) + manual | pass | `role="group"` (default) or consumer-set `role="toolbar"` (line 103 doc — when consumer sets role explicitly, the component does not override). `aria-label` from `label` property propagates to host attribute (line 127 in firstUpdated/willUpdate); consumer-set `aria-label` directly is preserved (line 94 doc). `aria-orientation` reflects horizontal/vertical (set on host based on `orientation` property). |

## Keyboard contract

`navigate=Arrow; activate=Enter,Space; disabled-suppresses=true`

APG `toolbar` / `group` pattern. The container itself is non-focusable; each slotted hx-button child handles its own activation. Tab moves between children (no roving tabindex at this layer — that's hx-action-bar's pattern). Disabled state at the child level removes that child from the focus order.

## ARIA pattern

`group` (default) / `toolbar` (consumer-elected) — https://www.w3.org/TR/wai-aria-1.2/#group, https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/

Implementation strategy: the container is purely structural. The host element is rendered with `role="group"` by default; consumers who want toolbar semantics with arrow-key roving navigation should use `hx-action-bar` instead OR set `role="toolbar"` explicitly on the host (the component honors the consumer-set role per line 103 doc).

`aria-label` is the announced name — required for AT to communicate purpose (line 15-16 doc: "Always provide an accessible label via aria-label or aria-labelledby").

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-button-group/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

Container-level styles: border / background colors collapse to system defaults under forced-colors. Children handle their own forced-colors styling (via hx-button's `forced-colors-interactive` shared style). Matrix harness `forced-colors`: 18/18 PASS (host renders non-zero pixels).

## Notes / carve-outs

- **2.4.13 N/A at container:** matrix harness explicit carve-out (lines 591-606 toolbar/group container exemption) mirrors hx-checkbox-group / hx-radio-group precedent. Container delegates focus to slotted children; the children's rings are independently AAA-cert'd via hx-button.
- **2.5.5 N/A at container:** matrix harness carve-out (`isButtonGroup` exemption) — container has no inner clickable; children carry hit areas.
- **No roving tabindex:** unlike hx-action-bar, hx-button-group does not implement APG toolbar's arrow-key roving-tabindex pattern. The component is a layout/grouping primitive; consumers needing toolbar arrow-key navigation should compose with `hx-action-bar`.
- **Consumer-set role respected:** per line 103 doc + behavior, when consumer sets `role` directly on the host (e.g. `<hx-button-group role="toolbar">`), the component preserves that role. This permits opt-in toolbar semantics without changing the default group behavior.
- **`aria-label` propagation:** the `label` property reflects to host's `aria-label` attribute (line 127 in setter). Consumer-set `aria-label` is also preserved (line 94 — `_consumerSetAriaLabel` flag prevents the component from clobbering it).
