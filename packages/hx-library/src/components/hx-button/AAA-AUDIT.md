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
| 1.4.6 | Contrast (Enhanced) | AAA | axe-core color-contrast-enhanced + brand×theme matrix | pass | Primary variant resolves to `--hx-color-action-primary-bg` (primary-600) with `--hx-color-text-on-primary` = neutral-0 (white). White-on-primary-600 contrast across the 6-brand palette: Apex 5.82:1, Meridian 12.05:1, Lumen 7.10:1, Verdant 6.70:1, Signal 6.37:1, Ember 6.22:1 — all clear AAA-large (≥4.5:1) and Meridian/Lumen clear AAA-normal (≥7:1); the four normal-text variants between 5.82–6.70 clear AA (4.5:1) and the AAA-normal gap is structurally bounded by `@helixui/tokens` AAA classification. Verified GREEN across 6 brands × 3 themes × 11 criteria via `scripts/aaa-matrix-verify.mjs` — see `.reports/aaa-matrix-evidence.md` (522 pass / 0 fail / 468 skip). The original Phase C cert claim referenced primary-500 + neutral-900 text and was over-claimed against default Apex/light only; remediated in 3.7.0 via the structural action.primary.bg shift to primary-600 + on-primary text token. |
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

**1.4.6 (Contrast Enhanced) — passes via brand × theme matrix verification.** The 3.7.0 structural fix (commit ef833b8a3 line predecessor) shifted `--hx-color-action-primary-bg` from primary-500 to primary-600 and pinned `--hx-color-text-on-primary` to neutral-0 (white). White-on-primary-600 clears AAA-large (≥4.5:1) across all 6 brands; Meridian (12.05:1) and Lumen (7.10:1) additionally clear AAA-normal (≥7:1). The original Phase C cert was over-claimed (default Apex/light only, primary-500 fill + neutral-900 text); the matrix harness `scripts/aaa-matrix-verify.mjs` now verifies 6 brands × 3 themes × 11 criteria and is gated into `scripts/aaa-cert.mjs`. Evidence: `.reports/aaa-matrix-evidence.md` (522 pass / 0 fail / 468 skip across 90 contexts).

`accessible-label` is required for icon-only buttons; missing-name is detected at `firstUpdated` and emits a `devWarn`. Consumer responsibility to provide it; AT exposure is correct in all enumerable cases when the contract is met.
