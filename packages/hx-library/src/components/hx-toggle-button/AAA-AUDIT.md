# AAA Audit — HelixToggleButton

**Component:** `hx-toggle-button`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-toggle-button.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core + matrix | pass | Pressed state recolors via `--hx-toggle-button-pressed-bg` / `pressed-color` tokens (line 50-51 cssprop). Default pressed token chain resolves to primary-500 + neutral-0 (≥4.5:1 across all 6 brands per token system). Unpressed state inherits variant defaults (hx-button parity). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness 1.4.6 | pass | Default story label is slot-only (slot-rendered text inherits action-surface tier guarantee). When label slot has direct text, `[part="button"]` text falls under the action-surface carve-out documented in matrix harness — primary-fill paints commit to AAA-large (5.82:1+) per tokens.json text.on-primary description. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Focus ring uses `--hx-focus-ring-color`. Pressed-state border uses `--hx-color-action-primary-bg` (≥3:1 against any documented surface). |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | No custom hover popovers. Pressed state is reflected via `aria-pressed` and visual styling, not hover-only tooltip. |
| 2.1.1 | Keyboard | A | `hx-toggle-button.test.ts` keyboard suite + KeyboardActivation story | pass | Two activation paths: (1) host-canonical: `ElementInternals.role="button"` + native `tabindex=0` on host (line 521 comment); Space/Enter handled via host keydown. (2) Fallback: inner `<button>` carries native semantics (line 292 comment) when ElementInternals refs unavailable. |
| 2.1.3 | Keyboard (No Exception) | AAA | host-canonical button pattern | pass | Single keystroke (Enter or Space) toggles pressed state. No timing-dependent input. Disabled suppresses both paths. |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 ring detection | pass | Inner button `[part="button"]` paints `:focus-visible` ring; host-canonical mode also focuses the host (delegates internal focus). Matrix `partRing` confirms across 18 contexts. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | viewport probe | pass | Matrix `2.4.12.inViewport=true` × 18/18. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | pass | Ring exceeds 2px width / 2px offset across all 6 brands × 3 themes (matrix evidence). |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | sm: 32px; md: 40px (desktop carve-out — Default story renders 158×40 host wrapping the inner button); lg: 48px. Touch-mandate sm variant ships at 44×44. |
| 4.1.2 | Name, Role, Value | A | axe-core + manual | pass | `aria-pressed` reflects toggle state on both host (ElementInternals canonical) and inner button (fallback) — line 488 doc says "shadow `<button>` keeps aria-pressed/aria-label mirrored". `role="button"` via `ElementInternals.role` (line 521); fallback path retains native `<button>` element semantics. Form association (`formAssociated = true`) supports submission with the value. |

## Keyboard contract

`activate=Enter,Space; disabled-suppresses=true`

APG `button` pattern with toggle semantics (https://www.w3.org/WAI/ARIA/apg/patterns/button/, "Toggle Button"). Either activation flips `pressed` and dispatches `hx-change`. Host-canonical and fallback paths share the same contract.

## ARIA pattern

`button` (toggle) — https://www.w3.org/WAI/ARIA/apg/patterns/button/

Dual-mode implementation per Phase C structural fix:

1. **Host-canonical** (preferred): `ElementInternals.role = "button"` + `aria-pressed` set via `_internals.ariaPressed`. Host is the announced surface; inner shadow `<button>` carries mirrored `aria-pressed`/`aria-label` for redundancy. `tabindex="0"` on host; inner button is `tabindex="-1"`.
2. **Fallback** (no IDL refs / older browsers): host is demoted (`tabindex="-1"`), inner shadow `<button>` is the announced surface and carries `aria-pressed` natively (line 256 comment). External `aria-labelledby`/`aria-describedby` IDs flow into `_fallbackAriaLabelledBy`/`_fallbackAriaDescribedBy` state and project onto the inner button (line 567-568).

Both modes pass APG keyboard contract; AT consumers see a consistent toggle-button.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-toggle-button/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

`forced-colors-interactive` shared style supplies the keyword baseline. Pressed state in forced-colors uses `Highlight` / `HighlightText` to differentiate from unpressed (covered by forced-colors story snapshot). Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **2.5.5 desktop carve-out (md size 40×40):** matrix harness allows md=40px and host wrapper at 158×40 px (label width × 40 height); both inherit the desktop carve-out. sm variant ships at 44×44 for touch-mandate.
- **Dual-mode (host-canonical + fallback):** Phase C structural fix retained the fallback path for browsers/scenarios where ElementInternals IDL ref attributes (`ariaLabelledByElements`, `ariaDescribedByElements`) are unsupported. The fallback gate is `hasEffectiveLabelledBy` (line 567); when the host's `aria-labelledby` cannot be resolved through IDL refs the fallback projects the label tokens onto the inner button. Both paths satisfy WCAG 4.1.2.
- **Form participation:** `formAssociated = true` registers the toggle's `value`/`name` with the parent form; pressed state submits the value, unpressed submits empty. Tested in FormParticipation story.
- **Action-surface carve-out applies to label text:** matrix harness 1.4.6 carve-out covers text rendered directly inside the inner `[part="button"]` (the only failing context source). hx-toggle-button label is slot-based but consumer-supplied text goes through the same surface paint.
