# AAA Audit — HelixRadioGroup

**Component:** `hx-radio-group`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC      | Title                        | Level | Method                            | Status | Evidence                                                                                                                                                  |
| ------- | ---------------------------- | ----- | --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4.3   | Contrast (Minimum)           | AA    | axe-core                          | pass   | Legend `--hx-color-text-strong` on `--hx-color-surface-default` (`hx-radio-group.styles.ts:37`). Help/error tokens `:71, 77`.                              |
| 1.4.6   | Contrast (Enhanced)          | AAA   | axe-core color-contrast-enhanced  | pass   | Matrix harness 18/18 contexts ≥ 7:1 on legend, help-text, error-text. Evidence: `.reports/aaa-matrix-evidence.hx-radio-group.md` (apex/meridian/lumen/verdant/signal/ember × light/dark/high-contrast). |
| 1.4.11  | Non-text Contrast            | AA    | axe-core                          | pass   | No non-text indicators owned at the group surface; the slotted `hx-radio` children own radio circle / dot contrast.                                        |
| 1.4.13  | Content on Hover or Focus    | AA    | manual review                     | pass   | Group does not surface dismissible-on-hover content. Help/error are persistent `<div role="alert">` regions (`hx-radio-group.ts:1112-1138`).               |
| 2.1.1   | Keyboard                     | A     | play() interaction test           | pass   | Roving tabindex (`_syncRadios()` at `hx-radio-group.ts:728-740`) — only the checked (or first enabled) radio carries `tabindex="0"`. Arrow/Home/End handled in `_handleKeydown` (`:779-842`). |
| 2.1.3   | Keyboard (No Exception)      | AAA   | manual review                     | pass   | Full APG radiogroup keyboard contract: ArrowDown/ArrowRight → next; ArrowUp/ArrowLeft → previous; Home → first; End → last; Space → select focused (`hx-radio-group.ts:785-841`). Disabled radios skipped via `_getEnabledRadios()` (`:688-690`). |
| 2.4.7   | Focus Visible                | AA    | VRT snapshot                      | pass   | Focus rings live on slotted `hx-radio` children. Group host is `role="radiogroup"` and not focusable.                                                     |
| 2.4.12  | Focus Not Obscured (Minimum) | AAA   | manual review                     | pass   | Group renders inline; no overlay/sticky chrome obscures focused radio children. Inner fieldset is `role="presentation"` (no clipping).                    |
| 2.4.13  | Focus Appearance             | AAA   | VRT snapshot                      | pass   | **N/A at container** — group is non-focusable accessible-container (`role="radiogroup"` via `internals.role` at `hx-radio-group.ts:463`). Focus rings live on slotted children. Matrix harness records this as `skip` per group-container carve-out. |
| 2.5.5   | Target Size (Enhanced)       | AAA   | computed style check              | pass   | Group container has no clickable targets. Slotted `hx-radio` children meet 44×44.                                                                          |
| 4.1.2   | Name, Role, Value            | A     | axe-core                          | pass   | `internals.role = 'radiogroup'` (`hx-radio-group.ts:463`); `internals.ariaOrientation` mirrored from `orientation` (`:467`); `internals.ariaRequired/ariaInvalid/ariaDisabled` mirrored from validity (`:464-466`). Accessible name resolved from consumer `aria-label` → `aria-labelledby` IDREFs → `label` property (`:469-510`). |

## Keyboard contract

`navigate=Arrow; activate=Space; disabled-suppresses=true`

Per APG radiogroup pattern (https://www.w3.org/WAI/ARIA/apg/patterns/radio/):

- **Tab**: enters the group, focusing the checked radio (or first enabled radio if none checked) — roving tabindex managed by `_syncRadios()` at `hx-radio-group.ts:728-740`.
- **ArrowDown / ArrowRight**: focus + select the next enabled radio (`_handleKeydown` at `:825-826`).
- **ArrowUp / ArrowLeft**: focus + select the previous enabled radio (`:828-829`).
- **Home**: focus + select the first enabled radio (`:821-822`).
- **End**: focus + select the last enabled radio (`:823-824`).
- **Space**: select the currently-focused radio without moving focus (`:801-813`).
- **Group disabled**: every child is force-disabled via `_syncRadios()` (`:711-717`); selection is preserved across disable→enable cycles via `_individualDisabledStates` WeakMap (`:670-671, 718-723`) so re-enable restores per-child state. Round-10 P1: `value` is preserved while disabled (matches native `<fieldset disabled>` semantics).

## ARIA pattern

`radiogroup` — https://www.w3.org/WAI/ARIA/apg/patterns/radio/

Host-canonical accessible-container surface (round-19 P1). Inner `<fieldset>` is `role="presentation"` on BOTH the modern and no-IDL-ref fallback paths so AT announces exactly one accessible container (the host). The host carries `role="radiogroup"` + `aria-orientation` via `ElementInternals` on both paths (`hx-radio-group.ts:1086-1106`).

`internals.ariaLabel` resolution order (round-35 hardening at `:497-510`): consumer `aria-label` (live attribute) → resolved `aria-labelledby` IDREFs (effective only when at least one resolves to an element) → `label` property fallback. A typo or transiently-missing IDREF target does NOT erase the visible label — round-35 (medium) + round-36 (medium) hardening clear broken host attributes so `internals.ariaLabel` wins per ARIA priority.

Validity-driven `aria-invalid`: `_updateValidity()` re-runs `_syncHostAriaSemantics()` (`:1037-1038`) after every `setValidity()` so the announced state matches the current `ValidityState`. Validity anchor prefers checked-enabled → enabled-first → presentational group (`:1024-1028`) so reportValidity() pins UA error UI to a focusable surface (round-35 fix).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-radio-group/*.png`
System-color-keyword assertions: legend → `CanvasText`; legend (error) → `LinkText`; help-text → `GrayText`; error → `LinkText`; disabled legend → `GrayText` (`hx-radio-group.styles.ts:83-111`). Border-removal under forced-colors prevents double-border with the slotted `hx-radio` children.

## Notes / carve-outs

- **2.4.13 N/A at container**: `hx-radio-group` is a `role="radiogroup"` accessible-container. The host is non-focusable; focus rings live on slotted `hx-radio` children. The matrix harness records this as `skip` via the group-container carve-out at `scripts/aaa-matrix-verify.mjs` (added 2026-05-08 in the hx-checkbox-group cert commit). Identical treatment to `hx-checkbox-group`.
- **2.5.5 N/A at container**: same reasoning — no clickable targets owned at the group surface; slotted children meet 44×44.
- **No-IDL-ref fallback**: legacy engines (Firefox today) lose internal legend/help/error references via shadow IDs. `internals.ariaDescription` mirrors slotted help/error text via `readSlottedOrShadowText()` (`:30-42`) so the description still surfaces (round-22 P1 #2, round-23 P2 Finding C).
- **Selection preservation across disable→enable**: round-10 P1 + round-18 P2 — `value` is preserved across disabled flips, but cleared if the previously-selected radio has been removed from the DOM while disabled.
- **Externally-checked radio adoption**: round-12 P2 — when a `<hx-radio checked>` is appended whose value differs from the current group value, `_reconcileChildren()` adopts it as the new selection. Naive "first checked" lookup would have rejected it.
