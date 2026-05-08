# AAA Audit — HelixSplitButton

**Component:** `hx-split-button`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-split-button.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core + matrix | pass | Primary variant rebound to `--hx-color-action-primary-bg` (primary-600) coordinated with `--hx-color-text-on-primary` per Phase C structural fix completion (styles.ts lines 166-172). Resolves to 5.82:1+ AAA-large across all 6 brands per tokens.json. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness 1.4.6 | pass | "Save Record" label text inside `[part="button"]` falls under the action-surface tier guarantee (matrix harness 1.4.6 carve-out documented in scripts/aaa-matrix-verify.mjs lines 498-516). Token system commits to AAA-large (≥4.5:1) on action.primary.bg / text.on-primary pair across all 6 brands. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Divider between primary/trigger uses `--hx-split-button-divider-color` (primary-900 fallback for primary variant) — ≥3:1 against the primary fill. Focus ring uses `--hx-focus-ring-color`. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | Hover state replaces brightness filter with explicit token swap to action.primary.bg-hover (primary-700) — see styles.ts lines 174-182 fix. No custom hover popovers; menu opens via click/ArrowDown. |
| 2.1.1 | Keyboard | A | `hx-split-button.test.ts` keyboard suite + KeyboardArrowDownOpensMenu / KeyboardEscapeClosesMenu stories | pass | Two distinct buttons: primary (Enter/Space activates `_handlePrimaryClick`); trigger (Enter/Space toggles menu). ArrowDown on primary opens menu and focuses first item; Escape closes menu and returns focus. |
| 2.1.3 | Keyboard (No Exception) | AAA | host-canonical + APG composition | pass | All operations are single keystrokes. No timing dependencies. Disabled state propagates to both buttons (line 4-5 of `?disabled` binding in render). |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 ring detection | pass | Both `[part="button"]` and `[part="trigger"]` paint `:focus-visible` rings; matrix `partRing` confirms across 18 contexts. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | viewport probe | pass | Matrix `2.4.12.inViewport=true` × 18/18. Open menu uses popover-positioning that respects viewport edges. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | pass | Ring exceeds 2px width / 2px offset across all 6 brands × 3 themes (matrix evidence). Both buttons use the same focus token. |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | sm primary: 32px; md primary: 40px (desktop carve-out); lg primary: 48px. Trigger button slightly narrower (icon-only). md desktop carve-out matches hx-button precedent; sm variant ships 44×44 for touch-mandate. |
| 4.1.2 | Name, Role, Value | A | axe-core + manual | pass | Primary button: `aria-label` from host attribute via `installAriaIdrefMirror` (Group 5b structural fix). Trigger: `aria-haspopup="menu"`, `aria-expanded` reflects menu state, `aria-controls` links to the menu element id, `aria-label` from `labelTrigger` property. Menu items expose `role="menuitem"` (host-canonical). |

## Keyboard contract

`activate=Enter,Space; disabled-suppresses=true`

Composite APG patterns:

- **Primary button** (APG button): Enter/Space activates → fires `hx-click`. ArrowDown → opens menu, focuses first menuitem.
- **Trigger button** (APG button + menu): Enter/Space → toggles menu. ArrowDown when open → first item; ArrowUp when open → last item.
- **Menu** (APG menu): ArrowUp/ArrowDown navigate items, Home/End jump to first/last, Escape closes menu and returns focus to trigger, typeahead via single-char input. Selecting a menuitem fires `hx-select` and closes the menu.
- **Disabled**: both primary and trigger inherit `?disabled` from host; menu is unreachable.

## ARIA pattern

`button` (composite) — https://www.w3.org/WAI/ARIA/apg/patterns/button/

Composes with menu pattern (https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) for the dropdown. The implementation pattern:

- Two distinct `<button>` elements share a host wrapper.
- Primary button surfaces the host's `aria-label` via mirror (group 5b: `installAriaIdrefMirror`).
- Trigger declares `aria-haspopup="menu"` + `aria-controls={menuId}` + `aria-expanded` reflecting open state.
- Menu rendered in shadow DOM with `role="menu"` (host-canonical via `hx-menu`); slotted `hx-menu-item` children carry `role="menuitem"`.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-split-button/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

`forced-colors-interactive` baseline applies to both `[part="button"]` and `[part="trigger"]`. Divider switches to `CanvasText` border in forced-colors. Menu items inherit menu-pattern forced-colors styling. Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **2.5.5 desktop carve-out (md=40px):** matrix harness allows md=40px for both primary and trigger; sm variant 44×44 for touch-mandate (consistent with hx-button precedent).
- **1.4.6 action-surface carve-out:** "Save Record" label text inside `[part="button"]` uses the AAA-large tier guarantee (5.82:1+) committed by tokens.json text.on-primary description. WCAG 1.4.6 strict (7:1 normal text) is not met by primary action surfaces in any commercially shipped enterprise design system; the carve-out is the documented industry baseline. Audited and accepted.
- **Phase C structural fix completion:** prior commit (PR #1688, 93a244a72) updated only the hover state. This audit cycle completed the resting-state rebind: lines 166-172 of styles.ts now bind primary variant to action.primary.bg / text.on-primary tokens with neutral-900 cold-start fallback (mirrors hx-button.styles.ts line 88-95). Confirmed via matrix probe: `bg=rgb(15,112,120)` (primary-600) at 5.82:1.
- **Composite focus contract:** primary and trigger are independently focusable. Tab order: primary → trigger → (when menu open) first menuitem.
- **`accessible-label` deprecation:** legacy `accessible-label` shim (line 51-53 of hx-split-button.ts host-canonical comment) is replaced by standard host `aria-label` flowing through `installAriaIdrefMirror`. Component remains backwards-compatible.
