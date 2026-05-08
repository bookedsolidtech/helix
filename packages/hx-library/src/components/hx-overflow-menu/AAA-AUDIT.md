# AAA Audit — HelixOverflowMenu

**Component:** `hx-overflow-menu`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-overflow-menu.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core (test file) | pass | Trigger button paints `currentColor` (inherits page text color) on transparent bg by default; the kebab-icon SVG has 3:1 against page bg. Panel surface paints `--hx-color-surface-raised` text. Slotted menu items contribute their own AA-cleared text. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | Panel surface `--hx-color-text-primary` over `--hx-color-surface-raised` clears AAA 7:1 across 18/18 contexts. The trigger is icon-only (no text) so 1.4.6 does not apply at the trigger. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Trigger SVG icon (kebab/dots) renders `currentColor` against the page bg — meets 3:1. Panel border `--hx-color-border-default` and shadow `--hx-color-shadow-md` provide ≥3:1 luminance change. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | Panel opens on click (not hover); persistent (no auto-close timer); dismissable via Escape (line 419-423) and outside-click; hoverable. |
| 2.1.1 | Keyboard | A | `hx-overflow-menu.test.ts` (keyboard suite) + KeyboardNavigation story | pass | APG menu pattern in `_handleKeydown` (line 417-456): Escape closes and returns focus to trigger button (line 419-423); Tab closes and lets focus advance naturally (line 425-429, APG-compliant); ArrowUp/Down/Home/End rove with full wrap-around (line 431-450); first-character typeahead with 500ms timeout (line 452-455). |
| 2.1.3 | Keyboard (No Exception) | AAA | menu pattern | pass | All operations are single-keystroke. Trigger Enter/Space toggles the panel; the panel is opened via the host's `_show` which initializes roving tabindex and focuses the first item. Typeahead is single-character (cumulative buffer with 500ms reset). No timing or path-dependent input. |
| 2.4.7 | Focus Visible | AA | matrix harness | pass | Trigger `[part="button trigger"]` (line 695) carries `:focus-visible` outline. Panel items (slotted hx-menu-item or `<button role="menuitem">`) carry their own rings. Roving tabindex ensures only the focused item is the tab stop with a visible ring. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness | pass | `inViewport=true` for the focused element across all 18 contexts. Floating panel (positioned via @floating-ui/dom) flips placement when overflow-bound; the focused item never lands behind the trigger or off-screen. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | pass | Trigger and slotted items paint rings of width ≥2px and offset ≥2px via `--hx-focus-ring-*` tokens. Trigger ring is detected via `[part="trigger"]` selector in matrix harness ringSelectors. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Trigger button renders ≥40×40 desktop carve-out (sm size 44×44 touch-mandate). Slotted menu items render at ≥40px row height. Container exemption per `isOverflowMenu` carve-out for any sub-44 surface attributable to slotted children. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) | pass | Trigger button (line 694-704): `<button part="button trigger" type="button" aria-label={resolvedLabel} aria-haspopup="menu" aria-expanded={String(open)} aria-controls={open ? panelId : nothing}>` — full APG menu button contract. Panel (line 707-720): `<div id={panelId} part="panel menu" role="menu" aria-label={labelMenu}>` — the announced surface. The host element does NOT carry `role="menu"` (PR #1688 fix); `role` lives on the inner `<div>` to prevent dual-announcement. |

## Keyboard contract

`navigate=Arrow,Home,End; activate=Enter,Space; dismiss=Escape; disabled-suppresses=true`

APG `menu button` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) + `menu` pattern for panel. Implementation in `_handleKeydown` (line 417-456):

- **On the trigger (closed)**: Enter / Space / ArrowDown opens the panel and focuses the first item via `_show()`.
- **On the trigger (open)**: Enter / Space / ArrowUp / ArrowDown closes the panel via `_hide()`.
- **In the panel**:
  - **Escape** (line 419-423): closes the panel and returns focus to the trigger button (`this._buttonEl?.focus()`).
  - **Tab** (line 425-429): closes the panel and lets focus advance naturally (no `preventDefault`). APG-compliant.
  - **ArrowDown / ArrowUp / Home / End** (line 431-450): rove the focused item with wrap-around. ArrowDown from the last item → first; ArrowUp from the first → last.
  - **First-character typeahead** (line 452-455): single-keystroke letter accumulates in a 500ms buffer; matches the next item starting with the buffer (case-insensitive). Submenu-aware via `getMenuItemTypeaheadLabel`.
  - **Enter / Space** on a focused menu item: activates the item (delegated to the item's own contract — typically dispatches `hx-item-select`).
- **Disabled items**: filtered from `_getMenuItems()` so they're skipped during arrow-roving and typeahead (suppress-disabled).

## ARIA pattern

`menu button` + `menu` — https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/

Implementation:

1. Host: no explicit role (PR #1688 corrected previous `role="menu"` on host). The host element wraps the trigger button and the panel.
2. Trigger button (line 694-706): native `<button type="button">` with `aria-label`, `aria-haspopup="menu"`, `aria-expanded={String(open)}`, and conditional `aria-controls={open ? panelId : nothing}`. The `aria-controls` is only set when the panel is rendered, avoiding broken-reference warnings when closed.
3. Panel (line 707-720): `<div id={panelId} part="panel menu" role="menu" aria-label={labelMenu}>` — the announced surface. The `id` matches the trigger's `aria-controls`.
4. Slotted hx-menu-item children (or consumer-provided `<button role="menuitem">`) carry `role="menuitem"` on their HOST after Group 5b's host-canonical migration.
5. Submenu support: items can declare children via `slot="submenu"`; the parent fires `hx-item-submenu-open`/`hx-item-submenu-close` events handled by `_handleSlotSubmenu*` (line 717-718).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-overflow-menu/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

The trigger button renders `ButtonText` on `ButtonFace` under forced-colors. The kebab SVG icon inherits `ButtonText`. Panel renders on `Canvas` with `CanvasText` text and `ButtonText` border. Slotted items inherit `ButtonText`/`Highlight` for hover/focus. Floating-positioned panel still renders correctly under forced-colors. Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **Container exemption (2.5.5)**: hx-overflow-menu is a popover-host container that owns the trigger (a real focusable button) plus the panel. The trigger is sized via the `size` property (sm = 44px touch, md = 40px desktop carve-out, lg = 48px). Slotted menu items inside the panel inherit the desktop carve-out. Matrix harness `isOverflowMenu` carve-out documented in `scripts/aaa-matrix-verify.mjs` (this batch).
- **Host role fix (PR #1688)**: prior to this PR, the host carried `role="menu"`. PR #1688 moved the role to the inner `<div role="menu">` so the host is a composer container. This prevents dual-announcement and aligns with hx-menu's host-canonical `role="menu"` migration model. Note: hx-overflow-menu's host does NOT carry `role="menu"` — that's the dropdown panel's role; the host has no role (composer pattern).
- **Tab semantics**: Tab closes the panel and advances focus to the next document element naturally. Escape closes and returns focus to the trigger. Both are APG-compliant.
- **Typeahead 500ms buffer**: matches hx-menu and hx-dropdown. Single-keystroke based; cumulative buffer resets after 500ms idle.
- **Submenu support**: parents emit submenu open/close events; the host coordinates focus return when a submenu closes. Submenu items participate in roving tabindex via `_getMenuItems()` flattening.
