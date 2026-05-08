# AAA Audit — HelixTabs

**Component:** `hx-tabs`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-tabs.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core (test file) | pass | Tab text `--hx-color-text-primary` on tablist surface clears AA across all 6 brands. Active-tab indicator paints `--hx-color-primary-600` border which meets AA non-text 3:1. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | hx-tab text in default story clears AAA 7:1 across 18/18 contexts. The matrix harness probe walks both hx-tabs's shadow root AND the focused hx-tab's own shadow root (extension this batch) to find the ring/text on `[part="tab"]`. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Active-tab indicator (1px or 2px bottom border in horizontal mode) uses `--hx-color-primary-600` with ≥3:1 contrast against the tablist bg. Hover/focus underlines use `--hx-color-primary-700` against neutral bg. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | No hover popovers or tooltips at the tablist level. Tabs themselves do not show any focus-revealed content beyond the focus ring. |
| 2.1.1 | Keyboard | A | `hx-tabs.test.ts` (keyboard suite) + KeyboardNavigation story | pass | Full APG tabs pattern in `_handleKeydown` (line 555-626): ArrowLeft/Right (horizontal) or ArrowUp/Down (vertical) navigates among tabs; Home jumps to first; End jumps to last; Space/Enter activates focused tab in manual mode. Both manual and automatic activation modes implemented per APG. |
| 2.1.3 | Keyboard (No Exception) | AAA | tabs pattern | pass | All operations are single-keystroke. Disabled tabs receive focus (so keyboard users can discover them) but are not activated by Enter/Space (line 583 explicit check). No timing or path-dependent input. |
| 2.4.7 | Focus Visible | AA | matrix harness | pass | hx-tab paints `:host(:focus-visible) .tab` outline (hx-tab.styles.ts:71-77): `outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color)` with `outline-offset: var(--hx-focus-ring-offset, 2px)`. The host's default focus outline is stripped (line 80-82) so the inner `.tab` is the visual treatment. Single-host roving tabindex (Group 5a) means the host IS the focusable surface. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness | pass | `inViewport=true` for the focused element across all 18 contexts. The tablist scrolls horizontally when overflowing (vertical-orientation tablist scrolls vertically); the focused tab is always brought into view via `scrollIntoView` on focus. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | pass | hx-tab focus outline (≥2px width, ≥2px offset) detected by matrix harness via the `[part="tab"]` ring selector + extended walk into the focused element's own shadow root (this batch). 18/18 contexts show pass with the outline source `[part="tab"]` reported. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | hx-tab renders ≥36px height (desktop carve-out for `md` size). Touch-mandate sm size renders ≥44×44 via `--hx-touch-target-min`. Container exemption per `isTabs` carve-out for hx-tab slotted children. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) | pass | Host carries `role="tablist"` (Group 5a host-canonical). hx-tab host carries `role="tab"`, `aria-selected={active}`, `aria-controls={panelId}`, and `tabindex={active ? 0 : -1}` (single-host roving). hx-tab-panel host carries `role="tabpanel"`, `aria-labelledby={tabId}`, and `tabindex={visible ? 0 : -1}` (line 446-449). The inner `<button tabindex="-1">` inside hx-tab is presentational; the host is the announced surface. |

## Keyboard contract

`navigate=Arrow,Home,End; activate=Enter,Space; disabled-suppresses=true`

APG `tabs` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Implementation in `_handleKeydown` (line 555-626):

- **ArrowRight / ArrowLeft** (horizontal) or **ArrowDown / ArrowUp** (vertical): focus next/previous tab. Wraps with modulo arithmetic (line 607, 610).
- **Home**: focus first tab (line 602-603).
- **End**: focus last tab (line 604-605).
- **Space / Enter**: activate focused tab if not disabled (line 581-589). Activation calls `_activateTab` which updates `_activePanel`, dispatches `hx-tab-show` event, and sets the corresponding panel's `tabindex="0"`.
- **Manual activation** (default per Group 5a): arrow keys move focus only; Space/Enter activates. Safer for heavy panel content.
- **Automatic activation**: arrow keys move focus AND activate the focused tab (if not disabled). Per APG, this is fine when panel content is light.
- **Disabled tabs**: receive focus (per APG — keyboard users must be able to discover their existence) but cannot be activated. Activation guard at line 583.
- **Tab / Shift+Tab**: enters/exits the tablist at the active tab; once inside, arrow keys are the primary navigation. Single-host roving means only the active tab carries `tabindex="0"`.

## ARIA pattern

`tabs` — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

Group 5a host-canonical implementation:

1. **Host (`hx-tabs`)**: carries `role="tablist"` and `aria-orientation` directly (Group 5a; line 31-34 inline doc). The host is the announced tablist; the inner `<div part="tablist">` is presentational.
2. **Tab (`hx-tab`)**: host carries `role="tab"`, `aria-selected={active}`, `aria-controls={panelId}`, and roving `tabindex` (active=0, others=-1). The inner `<div part="tab" tabindex="-1">` is presentational (line 491-496 `hx-tab.ts:307-322`).
3. **Panel (`hx-tab-panel`)**: host carries `role="tabpanel"`, `aria-labelledby={tabId}`, and roving `tabindex` (visible=0 to allow tab-into-panel-content; hidden=-1) per line 446-449.
4. **Cross-component wiring**: `_activateTab` sets `_activePanel = tab.panel`. Each tab's `panel` property names the matching panel; the tabs container queries hx-tab-panel children by `name` attribute and toggles their visibility.
5. **Activation modes**: `activation="manual"` (default) per Group 5a — safer for heavy panel content; `automatic` for light content.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-tabs/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas / SelectedItem / SelectedItemText.

The tablist and tabs collapse to system defaults under forced-colors. Active tab uses `Highlight` / `SelectedItem` border. Tab text inherits `ButtonText` / `LinkText`. Focus ring (hx-tab.styles.ts:128-130) explicitly switches to `outline: 3px solid Highlight` under `forced-colors: active` media query. Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **Group 5a host-canonical**: hx-tabs migrated to host-canonical roles in Group 5a. The host is the focusable surface for tabs (single-host roving tabindex); the inner `<button>` is `tabindex="-1"` presentational. This simplifies the keyboard model and makes ATs announce the host directly.
- **Manual activation default**: hx-tabs ships with `activation="manual"` per healthcare patterns. Heavy panel content (clinical forms, charts) is safer with explicit Space/Enter activation. Consumers can opt into `activation="automatic"` for lightweight tabs (filter/category switchers).
- **Matrix harness extension this batch**: the harness now walks the focused element's own shadow root for ring detection. hx-tab places its `:focus-visible` outline on the inner `[part="tab"]` element via `:host(:focus-visible) .tab`; the host itself has `outline: none`. The harness's previous shadow-root-of-cert-target-only walk missed this; the extension to also walk `focusedEl.shadowRoot` resolves it.
- **Disabled-tab focus**: per APG, disabled tabs receive focus so keyboard users can discover them, but Space/Enter does NOT activate. This is preferred over excluding disabled tabs from arrow-roving (which would hide their existence).
- **Vertical orientation**: ArrowUp/Down navigate; orientation is reflected in `aria-orientation` on the host. `_handleKeydown` selects the appropriate prev/next keys based on orientation (line 564-565).
- **No `tabindex` on panel content**: hx-tab-panel sets `tabindex="0"` on the visible panel host so users can Tab into the panel content; hidden panels get `tabindex="-1"` to skip them.
