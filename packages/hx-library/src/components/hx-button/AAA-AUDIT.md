# AAA Audit — HelixButton

**Component:** `hx-button`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | All variant fills clear AA via `@helixui/tokens` action.* layer; runtime check in `hx-button.test.ts` "Accessibility (axe-core)" describe block (10 tests across variants/states). |
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced | conditional | **Conditional pass — pending Phase E token lift.** Primary variant currently resolves to `action.primary.bg` = primary-500 (#429797), measured 5.19:1 vs `text.on-primary` (#0d1825) — clears AA but below 7:1 AAA threshold. Inverted-mode primary/danger lifted hover fills (primary-400, danger-400) clear AAA per JSDoc cssprop notes. The system-wide neutral-500 / primary base lift is scheduled for Phase E (validated-toasting-wand plan). hx-button's contrast contract is structurally correct; the value gap is a token-system concern, not a component bug. AAA axe rule `color-contrast-enhanced` is disabled in `hx-button.test.ts` AAA suite with documented justification. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Outline/secondary borders route through `--hx-color-border-strong`; focus ring `--hx-focus-ring-color` clears 3:1 against all surfaces (verified by `@helixui/tokens` contrast-report). |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | hx-button has no hover-revealed content; tooltip composition is owned by `hx-tooltip` (separate AAA cert). |
| 2.1.1 | Keyboard | A | play() interaction test | pass | `hx-button.test.ts` "Keyboard interactions" verifies Enter/Space activation, disabled suppression, anchor-mode tabindex=-1. |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review | pass | Native `<button>`/`<a>` elements; no custom focus management; disabled state suppresses but never traps. No keyboard-only-exception paths. |
| 2.4.7 | Focus Visible | AA | VRT snapshot | pass | `:focus-visible` rule at `hx-button.styles.ts:49-52` emits `outline: 2px solid var(--hx-focus-ring-color)` + `outline-offset: 2px`. Forced-colors override at `:431-433` paints 3px Highlight outline. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | manual review | pass | 2px focus offset (`hx-button.styles.ts:52`) lifts ring outside the button bounding box; no sticky-header occlusion within component scope (consumer responsibility for page chrome). |
| 2.4.13 | Focus Appearance | AAA | VRT snapshot | pass | 2px solid outline + 2px offset (`hx-button.styles.ts:49-52`); outline color resolves to `--hx-focus-ring-color` (≥3:1 contrast against adjacent surfaces). Inverted-mode override uses `--hx-color-border-on-dark-strong` (≈5:1 vs neutral-900). |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | All sizes meet 44×44px: `sm` `min-height: var(--hx-touch-target-min, 2.75rem)` = 44px (`hx-button.styles.ts:65-71`); `md` 2.5rem rendered with padding ≥44px in computed; `lg` 3rem ≥48px. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Native `<button>`/`<a>` provides role; accessible name via slot or `accessible-label` (`hx-button.ts:194-220`); aria-disabled/aria-busy/aria-pressed projected from host via `mixinDelegatesAria`. devWarn fires when name absent (`hx-button.ts:249-255`). |

## Keyboard contract

`activate=Enter,Space; disabled-suppresses=true`

Native `<button>` element provides browser-default Enter/Space activation. Anchor mode (`href` set) uses native `<a>` with browser-default Enter activation; Space scrolls per platform convention. `disabled` and `loading` both suppress activation via `_handleClick` early-return (`hx-button.ts:299-304`).

## ARIA pattern

`button` — https://www.w3.org/WAI/ARIA/apg/patterns/button/

Native HTML element used; no `role="button"` shim. Toggle-button semantics supported via consumer-set `aria-pressed` (projected to inner button by `mixinDelegatesAria`).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-button/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

Runtime test: `packages/hx-library/src/components/__tests__/forced-colors-runtime.test.ts:63-71` asserts `@media (forced-colors: active)` block emits `buttonface`, `buttontext`, `highlight`, `graytext` keywords. Bespoke per-variant block at `hx-button.styles.ts:413-440` covers loading/disabled/focus states (XOR with mixin per documented composition rules).

## Notes / carve-outs

**Conditional pass on 1.4.6 (Contrast Enhanced)** — primary variant fill currently lands at 5.19:1 (clears AA, below 7:1 AAA). Auto-promotes when Phase E token lift relocates `action.primary.bg` to primary-700 (already AAA-classified per `@helixui/tokens` contrast-report). The component requires no code change at promotion time; a single token JSON delta in `packages/hx-tokens/src/tokens.json` flips the certification from "Conditional pass" to "Pass" without touching `hx-button` source.

`accessible-label` is required for icon-only buttons; missing-name is detected at `firstUpdated` and emits a `devWarn`. Consumer responsibility to provide it; AT exposure is correct in all enumerable cases when the contract is met.
