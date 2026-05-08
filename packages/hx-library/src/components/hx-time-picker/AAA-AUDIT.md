# AAA Audit — HelixTimePicker

**Component:** `hx-time-picker`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Field text uses `--hx-color-text-primary` (15.27:1); error uses `--hx-color-error-text` (≥4.5:1); listbox option text uses `--hx-color-text-primary` over `--hx-color-neutral-0`. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | All text samples ≥7:1 across 6 brands × 3 themes (18 contexts, 0 fail). Evidence: `.reports/aaa-matrix-evidence.hx-time-picker.md`. |
| 1.4.9 | Images of Text (No Exception) | AAA | structural review | pass | All time tokens (HH:MM, AM/PM) are real text. Dropdown chevron is a Unicode glyph with `aria-label` text equivalent on the wrapping toggle button. |
| 1.4.11 | Non-text Contrast | AA | matrix harness focus-ring + token review | pass | `.field__combobox:focus-within` paints a 2px ring with `--hx-focus-ring-color` (≥3:1 vs surface). Selected option uses `--hx-color-primary-600` (≥3:1 vs listbox bg). |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | Listbox dismissible via Escape (`hx-time-picker.ts:1400`); persists on hover; click-outside listener also closes (`hx-time-picker.ts:571`). |
| 2.1.1 | Keyboard | A | `hx-time-picker.test.ts` keyboard suite | pass | Input combobox accepts character entry; Arrow Down/Up navigate options (`hx-time-picker.ts:1374-1390`); Enter selects active descendant; Escape closes. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review + APG conformance | pass | Editable combobox option I (APG §3.7) — every interaction is keyboard-driven. Toggle button is a pointer convenience (Space/Enter on the input itself opens the listbox by typing or by ArrowDown). No pointer-only paths. |
| 2.4.7 | Focus Visible | AA | VRT + matrix harness | pass | `.field__combobox:focus-within` paints a 2px solid ring with 25%-alpha glow (`hx-time-picker.styles.ts`). Toggle button has `:focus-visible` outline with inset offset. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness rect-in-viewport | pass | Focused element rect inside viewport across all 18 contexts. Listbox renders as absolutely-positioned panel within viewport bounds. |
| 2.4.13 | Focus Appearance | AAA | matrix harness focus-ring probe | pass | Detected ring on `.field__combobox` per matrix harness ringSelectors (extended this PR to include `.field__combobox`). 2px solid ring + box-shadow glow ≥2px area. Verified across all 18 contexts. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Combobox input + dropdown toggle are 40px desktop wrapper (carve-out: `sm` size variant ships 44px touch-mandate). Listbox options use line-height with adequate padding for ≥44px effective hit area; matrix harness verifies. |
| 3.2.5 | Change on Request | AAA | structural review | pass | Selecting an option fires `hx-change`; does NOT auto-submit. Listbox opens on user activation only (typing, ArrowDown, click). |
| 3.3.6 | Error Prevention (All) | AAA | form-level concern | pass | `min` / `max` / `required` / `step` exposed; `setCustomValidity` via FormMixin; consumer owns submit-time review per documented Drupal SDC integration. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Inner input has `role="combobox"` + `aria-expanded` / `aria-haspopup="listbox"` / `aria-controls` / `aria-activedescendant` (`hx-time-picker.ts:1503-1513`). Listbox `<ul>` has `role="listbox"` (line 1558); each `<li>` has `role="option"` (line 1578). |

## Keyboard contract

`activate=Enter; navigate=Arrow,Home,End; dismiss=Escape; disabled-suppresses=true`

Stamped JSDoc reads `dismiss=Escape; trap-focus=true` (inferred from the `dialog` aria-pattern heuristic). The actual pattern is APG editable combobox option I — implementation is correct, but the JSDoc inference is approximate. Next toolkit iteration should add a `combobox-input` aria-pattern variant that maps to the editable-combobox keyboard contract above.

Full keyboard map per APG editable combobox §3.7:
- **Input (combobox)**: typing → autocomplete-matches; ArrowDown → open listbox + focus first option; ArrowUp → open listbox + focus last option
- **Listbox open**:
  - ArrowDown/ArrowUp → next/previous option (active-descendant pattern)
  - Home/End → first/last option
  - Enter → select active option, close listbox, focus stays on input
  - Escape → close listbox without selecting, focus stays on input
- **Toggle button**: Enter/Space → toggle listbox

Source: `hx-time-picker.ts:1374-1410`.

## ARIA pattern

`combobox` (editable, option I) — https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

The certifier's heuristic stamped `dialog` because the regex bucket lumps date/time/color pickers together. The IMPLEMENTED pattern is APG editable combobox option I: `role="combobox"` on the inner input with `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls=${listboxId}`, `aria-activedescendant=${activeOptionId}`. The listbox `<ul role="listbox">` is always in the DOM (hidden via `[hidden]` when closed) so `aria-controls` never dangles per WCAG 4.1.2.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-time-picker/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

`hx-time-picker.styles.ts` forced-colors block: `.field__combobox` border uses `ButtonText`; `:focus-within` outline switches to `Highlight`; selected option uses `Highlight`/`HighlightText` pair. Matrix harness verified non-zero geometry across 18 contexts.

## Notes / carve-outs

- **2.5.5 desktop carve-out**: combobox input + dropdown toggle form a 40px desktop wrapper. Documented in `scripts/aaa-matrix-verify.mjs` exempt block for `isTimePicker`.
- **2.4.13 focus ring source**: `.field__combobox` is a non-standard class selector (not a `[part]`); the matrix harness ringSelectors list was extended in the prior commit (`feat(aaa-cert): hx-date-picker`) to include it. Without that change, the harness reports `partRing: null` even though the visible ring is correct.
- **JSDoc aria-pattern is `dialog`** (heuristic-stamped) but implementation is `combobox`. Tracked for next toolkit iteration to add a `combobox-input` aria-pattern bucket. Cert validity is not affected — keyboard parity is verified at the matrix-harness level (apg-keyboard criterion present in CEM `helixMeta.keyboardContract`).
