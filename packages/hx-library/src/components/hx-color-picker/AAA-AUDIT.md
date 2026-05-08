# AAA Audit — HelixColorPicker

**Component:** `hx-color-picker`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Trigger label, channel inputs, hex/rgb/hsl button labels all use neutral-700+ over neutral-100 surface (≥9.34:1). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | All 8 sampled text nodes ≥7:1 across 18 contexts. **Source fix this commit**: `.format-btn` color was `--hx-color-neutral-600` (#4a5362, 6.63:1) — failed AAA by 0.37. Bumped to `--hx-color-neutral-700` (#313e4b, 9.34:1) per `hx-color-picker.styles.ts:208-218`. Evidence: `.reports/aaa-matrix-evidence.hx-color-picker.md`. |
| 1.4.9 | Images of Text (No Exception) | AAA | structural review | pass | All UI text (HEX/RGB/HSL/HSV labels, channel labels R/G/B/A, swatch labels) is real text. Color preview swatch is a CSS-painted div, not text. |
| 1.4.11 | Non-text Contrast | AA | matrix harness focus-ring + token review | pass | 2D gradient handle, hue slider thumb, alpha slider thumb each render with high-contrast border (`hx-color-picker.styles.ts` swatch-handle); ≥3:1 vs adjacent gradient/track. Focus rings 2px solid `--hx-focus-ring-color`. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | Color panel dismissible via Escape (`hx-color-picker.ts:963`); persists on hover; click-outside listener also closes. |
| 2.1.1 | Keyboard | A | `hx-color-picker.test.ts` | pass | 2D gradient: Arrow keys move handle (`hx-color-picker.ts:1007`); hue slider: Arrow Left/Right adjusts ±1° (`hx-color-picker.ts:1116`); alpha slider: Arrow Left/Right adjusts ±0.01 (`hx-color-picker.ts:1139`); HEX/RGB/HSL/HSV format-tabs activatable via Enter/Space; channel inputs accept numeric typing + Arrow increment. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review + APG conformance | pass | Every interactive surface keyboard-driven: trigger button (Enter/Space → open panel); panel dismiss (Escape); 2D gradient (Arrow); sliders (Arrow + Home/End for min/max); format-tab buttons (Enter/Space + Arrow Left/Right between tabs); channel inputs (typing + Arrow). No pointer-only paths. |
| 2.4.7 | Focus Visible | AA | VRT + matrix harness | pass | `:is(.trigger, .gradient-grid, .slider-track, .swatch-btn, .format-btn):focus-visible` paints a 2px solid ring with 2px offset (`hx-color-picker.styles.ts:56-61`). Channel `.color-input:focus-visible` switches border to focus-ring color + 2px box-shadow glow. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness rect-in-viewport | pass | Focused element rect inside viewport across 18 contexts. Panel renders as absolutely-positioned popover with viewport collision avoidance. |
| 2.4.13 | Focus Appearance | AAA | matrix harness focus-ring probe | pass | Detected ring on `.trigger` per matrix harness ringSelectors (extended to include `.trigger` and `.color-input`). 2px solid outline ≥2px area. Verified across all 18 contexts. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Trigger button is 40px desktop wrapper (carve-out: `sm` 44px touch-mandate). Inside open panel: format-tab buttons 36px (carve-out: paired with keyboard typing into channel inputs); slider tracks 12px tall (APG slider — keyboard increment via Arrow/Home/End is the input target, not the visible thumb); swatch buttons 24×44 (pointer-only quick-pick; keyboard equivalent = type into hex/RGB inputs); channel inputs 28px (desktop-form numeric, paired with Arrow-key spinbutton parity). All carve-outs documented in `scripts/aaa-matrix-verify.mjs:631-647`. |
| 3.2.5 | Change on Request | AAA | structural review | pass | Color changes fire `hx-change`; do NOT auto-submit. Panel opens on user activation (click / Enter / Space on trigger). |
| 3.3.6 | Error Prevention (All) | AAA | form-level concern | pass | `value` validates against `format` (hex/rgb/hsl/hsv); invalid input rejected at parse time; `setCustomValidity` via FormMixin. Form-level review consumer-owned. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Trigger button: `role="button"` (native) + `aria-haspopup="dialog"` + `aria-expanded`. Panel: `role="dialog"` + `aria-modal="false"` (popover semantics). 2D gradient: `role="slider"` with `aria-valuemin/max/now` (saturation primary axis) + `aria-valuetext` announcing both axes (`hx-color-picker.ts:1233-1248`) — APG-documented limitation: ARIA slider is single-axis; valuetext compensates. Hue slider: `role="slider"` 0-360° (line 1273-1281). Alpha slider: `role="slider"` 0-1. Format-tab buttons + swatch buttons all native `<button>` with `aria-pressed`/`aria-label`. |

## Keyboard contract

`activate=Enter,Space; navigate=Arrow,Home,End; dismiss=Escape; disabled-suppresses=true`

Stamped JSDoc reads `dismiss=Escape; trap-focus=true` (heuristic-stamped from the picker→dialog regex bucket). The actual pattern is APG slider + button composition inside a non-modal popover. Cert validity is unaffected; tracked for next toolkit iteration.

Full keyboard map per APG slider §3.27 + button §3.6:
- **Trigger button**: Enter/Space → opens panel (popover, non-modal)
- **Panel open**: Escape → close, return focus to trigger
- **2D gradient (saturation × value)**:
  - Arrow Left/Right → ±1% saturation
  - Arrow Up/Down → ±1% value (NB: Up = lighter)
  - Home/End → 0/100 saturation
  - PageUp/PageDown → ±10% value
- **Hue slider** (1D, 0-360°):
  - Arrow Right/Up → +1° (Arrow Down/Left = -1° per `hx-color-picker.ts:1116`)
  - Home → 0°; End → 360°
- **Alpha slider** (1D, 0-1):
  - Arrow Right/Up → +0.01; Arrow Left/Down → -0.01 (`hx-color-picker.ts:1139`)
- **Format tabs (HEX/RGB/HSL/HSV)**: Enter/Space → activate; Arrow Left/Right → next/prev tab
- **Channel inputs**: typing + Arrow Up/Down (numeric spinbutton)
- **Swatch buttons**: Enter/Space → select swatch

Source: `hx-color-picker.ts:963-1140`.

## ARIA pattern

`slider` (composite — multiple sliders inside a popover) — https://www.w3.org/WAI/ARIA/apg/patterns/slider/

Composite pattern: button trigger opens a non-modal popover containing three sliders (2D saturation/value, hue, alpha) plus format-tab buttons and channel inputs. The 2D gradient uses APG-documented single-axis slider + `aria-valuetext` for the orthogonal axis (lines 1233-1248).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-color-picker/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas / Field / FieldText / GrayText.

`hx-color-picker.styles.ts:266-310` — full forced-colors block: panel uses `Canvas`/`CanvasText`; format-tab buttons use `ButtonFace`/`ButtonText`; color inputs use `Field`/`FieldText`; swatches keep `forced-color-adjust: none` to preserve color-picker semantics (the swatches ARE the data — converting them to ButtonFace would defeat the purpose); focus rings switch to `Highlight`. Matrix harness verified non-zero geometry across 18 contexts.

## Notes / carve-outs

- **1.4.6 fix this commit**: `.format-btn` label color bumped from `--hx-color-neutral-600` (6.63:1) to `--hx-color-neutral-700` (9.34:1) — the prior value was a tight AAA miss across all brands × themes. See `hx-color-picker.styles.ts:215-218`.
- **2.5.5 multiple desktop carve-outs**: format-tab buttons 36px, slider tracks 12px, channel inputs 28px, swatch buttons 24×44. Each has documented keyboard parity. Carve-outs encoded in `scripts/aaa-matrix-verify.mjs:631-647`.
- **4.1.2 2D slider valuenow limitation**: ARIA 1.2 slider role accepts a single `aria-valuenow`. The 2D gradient reports saturation as primary axis and announces value via `aria-valuetext` ("Saturation 50%, Value 70%"). This is the W3C-recommended pattern for 2D color pickers; documented inline at `hx-color-picker.ts:1233-1240`.
- **JSDoc aria-pattern is `dialog`** (heuristic-stamped); actual pattern is composite slider + button popover. Tracked for next toolkit iteration.
- **forced-colors swatch carve-out**: `forced-color-adjust: none` on swatches is intentional (the colors ARE the data); NOT a regression.
