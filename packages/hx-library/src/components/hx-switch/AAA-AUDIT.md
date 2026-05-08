# AAA Audit — HelixSwitch

**Component:** `hx-switch`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC      | Title                        | Level | Method                            | Status | Evidence                                                                                                                                                  |
| ------- | ---------------------------- | ----- | --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4.3   | Contrast (Minimum)           | AA    | axe-core                          | pass   | Label `--hx-switch-label-color` (`--hx-color-text-strong`) on default surface (`hx-switch.styles.ts:163`). Help/error tokens `:179, 185`.                  |
| 1.4.6   | Contrast (Enhanced)          | AAA   | axe-core color-contrast-enhanced  | pass   | Matrix harness 18/18 contexts ≥ 7:1 on label, help-text, error-text. Track checked: `--hx-color-primary-500` thumb on `--hx-color-surface-default`. Evidence: `.reports/aaa-matrix-evidence.hx-switch.md` (apex/meridian/lumen/verdant/signal/ember × light/dark/high-contrast). |
| 1.4.11  | Non-text Contrast            | AA    | axe-core                          | pass   | Track-vs-thumb non-text contrast: unchecked track `--hx-color-border-strong` (#66787b) vs thumb `--hx-color-surface-default` (#ffffff) ≥ 3:1. Checked track `--hx-color-primary-500` (#429797) vs thumb #ffffff ≥ 3:1.                          |
| 1.4.13  | Content on Hover or Focus    | AA    | manual review                     | pass   | No dismissible-on-hover content. Help/error are persistent live regions (`hx-switch.ts:683-707`).                                                          |
| 2.1.1   | Keyboard                     | A     | play() interaction test           | pass   | Modern path: host owns Space/Enter activation in `_handleHostKeyDown` (`hx-switch.ts:270-278`). Fallback path: native `<button>` Space activation. Click on track delegates to host on modern path (`:534-536`). |
| 2.1.3   | Keyboard (No Exception)      | AAA   | manual review                     | pass   | Per APG switch pattern (https://www.w3.org/WAI/ARIA/apg/patterns/switch/): Space toggles. `Enter` also accepted on the modern path for parity with native `<button>` activation. Disabled state suppresses both pointer + key activation (`:271, 273, 287`).         |
| 2.4.7   | Focus Visible                | AA    | VRT snapshot                      | pass   | `:host(:focus-visible) .switch__track` AND `.switch__track:focus-visible` (modern + fallback paths) — outline `--hx-focus-ring-width` solid `--hx-switch-focus-ring-color` with `--hx-focus-ring-offset` (`hx-switch.styles.ts:60-74`). |
| 2.4.12  | Focus Not Obscured (Minimum) | AAA   | manual review                     | pass   | Switch renders inline; no overlay/sticky chrome obscures the focused track. Matrix harness `2.4.12` GREEN across 18/18 contexts.                          |
| 2.4.13  | Focus Appearance             | AAA   | VRT snapshot                      | pass   | Focus ring outline ≥ 2px solid + offset ≥ 2px on the track button across all 18 brand × theme contexts. Forced-colors mode upgrades ring to `3px solid Highlight` (`hx-switch.styles.ts:207-211`). |
| 2.5.5   | Target Size (Enhanced)       | AAA   | computed style check              | pass   | `.switch__control-row` `min-height: var(--hx-touch-target-min, 2.75rem)` — 44px enforced (`hx-switch.styles.ts:29-34`). Visible 40×22 track sits inside this row, label `for="${this._switchId}"` association makes the entire row a hit target (`hx-switch.ts:669`). Carve-out documented in `scripts/aaa-matrix-verify.mjs` (added 2026-05-08). |
| 4.1.2   | Name, Role, Value            | A     | axe-core                          | pass   | **Modern path** (host announced): `internals.role = 'switch'`, `internals.ariaChecked` mirrored from `checked`, `ariaRequired/ariaInvalid/ariaDisabled` mirrored from validity (`hx-switch.ts:348-352`). **Fallback path** (no IDL refs): inner `<button role="switch" aria-checked tabindex="0">` is the announced surface; host role/state cleared via `internals` to prevent double-announcement (`:402-407`). Round-2 finding #2. |

## Keyboard contract

`activate=Space; disabled-suppresses=true`

Per APG switch pattern (https://www.w3.org/WAI/ARIA/apg/patterns/switch/):

- **Space**: toggles checked state (modern path: `_handleHostKeyDown` at `hx-switch.ts:270-278`; fallback path: native `<button>` Space activation in `_handleKeyDown` at `:541-546`).
- **Enter**: also accepted on the modern path for parity with native `<button>` semantics (`:274`). The fallback path uses native button keyboard handling.
- **Disabled**: pointer + keyboard activation both suppressed (`:271, 287`); host carries `internals.ariaDisabled='true'` and `tabindex="-1"` (modern path) so the switch is removed from tab order.

The validity-driven `aria-invalid` updates in real time — `_updateValidity()` re-runs `_syncHostAriaSemantics()` (`:445`) so `internals.ariaInvalid` mirrors the current `ValidityState` rather than the previous render snapshot (round-1 finding #6).

## ARIA pattern

`switch` — https://www.w3.org/WAI/ARIA/apg/patterns/switch/

Dual-path implementation hardened by codex round-2 finding #2:

- **Modern path** (`_supportsIdrefRefs === true`): host is the announced surface. `internals.role = 'switch'`, `internals.ariaChecked`, and `aria-labelledby/describedby` element references projected via `ariaLabelledByElements` / `ariaDescribedByElements`. Inner `<button>` is `aria-hidden + tabindex="-1"` (presentational chrome). Host carries `tabindex="0"` and owns Space/Enter activation. After click on inner button, focus is redirected to host (`hx-switch.ts:534-536`) so AT focus and `document.activeElement` agree on the announced surface.
- **Fallback path** (`_supportsIdrefRefs === false`, e.g. Firefox today): inner `<button role="switch" aria-checked aria-labelledby aria-describedby aria-required aria-invalid tabindex="0">` is the announced surface. Host role/state cleared via `internals` to prevent double-announcement (`:402-407`). Host `tabindex="-1"` so it stays out of tab order. Programmatic `focus()` redirects to inner button (`:560-566`) so error recovery / scripted focus reach the announced surface.

`internals.ariaLabel` resolution order (round-35 hardening at `:331-360, 412-415`): consumer `aria-label` → resolved `aria-labelledby` IDREFs (effective only when at least one resolves) → `label` property → label slot. Broken IDREFs do NOT erase the visible label.

Touch target: `.switch__control-row` `min-height: 2.75rem` (44px floor) per WCAG 2.5.5 healthcare mandate (`hx-switch.styles.ts:26-34`). The visible track is 40×22 (md) inside a 44px row — equivalent-pattern carve-out: native `<label for="${this._switchId}">` (`:669`) makes the entire row a click target.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-switch/*.png`
System-color-keyword assertions (`hx-switch.styles.ts:200-255`):

- Track unchecked: `ButtonFace` background, `ButtonText` 2px border.
- Track checked: `Highlight` background and border.
- Thumb unchecked: `ButtonText`. Thumb checked: `HighlightText`.
- Focus ring: `3px solid Highlight` with 2px offset.
- Disabled: opacity locked to 1; track border `GrayText`, thumb `GrayText`, label `GrayText`.
- Help-text: `GrayText`. Error: `LinkText`.

## Notes / carve-outs

- **2.5.5 equivalent-pattern carve-out**: visible track is 40×22 (md) / 32×18 (sm) / 48×26 (lg). The 44px floor is enforced at the row level (`min-height: var(--hx-touch-target-min, 2.75rem)` on `.switch__control-row` at `hx-switch.styles.ts:29-34`). The `<label for>` association (`hx-switch.ts:669`) makes the entire row a hit target. Matrix harness exempts `hx-switch` button targets from the 2.5.5 size check at `scripts/aaa-matrix-verify.mjs` (added 2026-05-08 in this cert). Same equivalent-pattern carve-out as hx-checkbox (small box, larger row hit area).
- **Dual-path announced surface**: modern path projects `role=switch` onto the host via `internals.role`; fallback path keeps the inner button as the announced surface (round-2 finding #2). Host tabindex flips between `0` (modern) and `-1` (fallback) so tab order always lands on the announced node.
- **Consumer `tabindex` preservation**: round-14 P2 — `_internalTabindexManaged` flag tracks ownership. Consumer-supplied `tabindex` (e.g. roving-tabindex toolbar pattern with `-1`) survives disabled flips and supports-flag transitions (`hx-switch.ts:218-220, 244-248, 309-313`).
- **No-IDL-ref fallback `aria-labelledby` precedence**: round-14 P2 — when consumer supplies `aria-label` without `aria-labelledby`, the internal `_labelId` is omitted on the inner button so the consumer name wins per ARIA spec (`:626-632`).
- **Disabled host suppression**: host-level keydown/click handlers short-circuit on `disabled` (`:271-272, 287-288`); the inner button additionally gets `disabled` attribute on the fallback path via `?disabled=${this.disabled}` (`:662`).
