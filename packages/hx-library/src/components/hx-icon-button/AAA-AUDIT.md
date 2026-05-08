# AAA Audit — HelixIconButton

**Component:** `hx-icon-button`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | _populate during audit_ |
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced | pass | _populate during audit_ |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | _populate during audit_ |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | _populate during audit_ |
| 2.1.1 | Keyboard | A | play() interaction test | pass | _populate during audit_ |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | _populate during audit_ |
| 2.4.7 | Focus Visible | AA | VRT snapshot | pass | _populate during audit_ |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual review | pass | _populate during audit_ |
| 2.4.13 | Focus Appearance | AAA | VRT snapshot | pass | _populate during audit_ |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | _populate during audit_ |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | _populate during audit_ |

## Keyboard contract

`activate=Enter,Space; disabled-suppresses=true`

## ARIA pattern

`button` — https://www.w3.org/WAI/ARIA/apg/patterns/button/

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-icon-button/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

## Notes / carve-outs

_Document any deliberate AA-only pairs, scope-limited SC, or consumer-fulfilled criteria here. Empty
when the component clears all 11 component-shippable AAA SCs without exception._
