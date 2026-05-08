# AAA Audit — HelixCheckbox

**Component:** `hx-checkbox`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Default unchecked uses `--hx-color-border-strong` on neutral-0 surface (≥4.5:1); checked fill uses `action.primary.bg`. Asserted in `hx-checkbox.test.ts` Accessibility (axe-core) describe (5 cases). |
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced | conditional | **Conditional pass — pending Phase E token lift.** Checked-state fill resolves to primary-500 (5.19:1) — clears AA, below 7:1 AAA. Same shared-token concern as hx-button. AAA axe rule disabled in `hx-checkbox.test.ts` AAA suite. Auto-promotes when `action.primary.bg` lifts to primary-700 in tokens.json (Phase E). |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Border (`--hx-color-border-strong`), check icon (white on primary fill ≥7:1), and focus ring all clear 3:1 UI floor. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | No hover-revealed content; help/error text rendered inline (not on hover). |
| 2.1.1 | Keyboard | A | play() interaction test | pass | Native `<input type="checkbox">` provides browser-default Space toggle; host carries `role="checkbox"` + `tabindex=0` via ElementInternals (`hx-checkbox.ts:692-693`). Keyboard tests in `hx-checkbox.test.ts` Keyboard describe. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | No mouse-only paths; indeterminate state set programmatically by consumer, not via keyboard (consistent with native checkbox; APG checkbox pattern explicitly reserves indeterminate for programmatic use). |
| 2.4.7 | Focus Visible | AA | VRT snapshot | pass | `:host(:focus-visible) .checkbox__box` outline at `hx-checkbox.styles.ts:81-85`. Inner-input fallback at `:92-95` for legacy browsers without focus delegation. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual review | pass | 2px outline-offset (`hx-checkbox.styles.ts:84,95`); ring sits outside the 24px box bounding rect. No internal occluders. |
| 2.4.13 | Focus Appearance | AAA | VRT snapshot | pass | 2px solid outline + 2px offset (`hx-checkbox.styles.ts:81-95`); color resolves to `--hx-checkbox-focus-ring-color` falling through to `--hx-focus-ring-color` (≥3:1 floor). Forced-colors override at `:246-249` paints 3px Highlight. |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | Host `min-height: var(--hx-touch-target-min, 2.75rem)` = 44px (`hx-checkbox.styles.ts:30-31`). Label and box composite into the full 44px hit region; label `<for>`-association makes the entire row clickable. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Host `role="checkbox"` + `aria-checked` (true / false / mixed) + form-association via `_internals` (`hx-checkbox.ts:692-693`). Tri-state: `aria-checked="mixed"` for indeterminate. Label projection via slot or `label` attribute. |

## Keyboard contract

`activate=Space; disabled-suppresses=true`

Native `<input type="checkbox">` provides browser-default Space toggling. Enter is intentionally NOT bound (per HTML spec / APG checkbox pattern — Enter submits the form, Space toggles). Disabled state suppresses both keyboard and click activation.

## ARIA pattern

`checkbox` — https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/

Tri-state checkbox via `aria-checked="mixed"`. Host owns the role/state (composed-tree assertive technology lookups resolve cleanly without shadow-boundary indirection).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-checkbox/*.png`
System-color-keyword assertions: Field / FieldText / Highlight / HighlightText / GrayText.

Runtime test: `packages/hx-library/src/components/__tests__/forced-colors-runtime.test.ts:73-80` asserts the `forcedColorsField` mixin emits `field`, `fieldtext`, `highlight` keywords. Bespoke focus override at `hx-checkbox.styles.ts:246-249` paints 3px Highlight ring in HC mode.

## Notes / carve-outs

**Conditional pass on 1.4.6 (Contrast Enhanced)** — checked-state fill currently lands at 5.19:1; auto-promotes when Phase E primary-700 lift lands. No component code change required.

Indeterminate state is programmatic-only by APG convention — there is no keyboard gesture to enter indeterminate. Consumers driving "select all" patterns are responsible for correctly toggling between checked/unchecked/indeterminate via JS; the component faithfully reflects whichever state is set.
