# AAA Audit — HelixDropdown

**Component:** `hx-dropdown`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-dropdown.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core (test file) | pass | Panel surface paints `--hx-dropdown-bg` (token-driven `--hx-color-surface-raised`) with shadow `--hx-color-shadow-md`. Slotted menu items render their own text in `--hx-color-text-primary` against the surface — AA across all brands. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | Matrix probe finds 0 visible text samples in default state (panel is closed). When open, slotted hx-menu-item text on raised-surface bg clears AAA 7:1 across 18/18 contexts. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Panel border uses `--hx-color-border-default` against the page bg (AA non-text 3:1). Panel shadow `--hx-color-shadow-md` provides ≥3:1 luminance change to indicate the floating layer. Trigger arrow chevron (when present in slotted hx-button) inherits trigger color. |
| 1.4.13 | Content on Hover or Focus | AA | manual + outside-click test | pass | Panel opens on trigger activation (not hover); persistent (no auto-close timer); dismissable via Escape (line 404-406) and outside-click (line 308 listener); hoverable (mouse can move between trigger and panel). |
| 2.1.1 | Keyboard | A | `hx-dropdown.test.ts` (keyboard suite) + KeyboardNavigation story | pass | APG Menu Button pattern fully implemented in `_handleKeydown` (line 403-429): Escape closes and returns focus to trigger; Tab closes WITHOUT returning focus (lets focus advance naturally per P2-02); ArrowDown/ArrowUp/Home/End rove among menu items via `_handleMenuNavigation` (line 433-450); first-character typeahead (line 425-427) with 500ms timeout matching hx-menu. |
| 2.1.3 | Keyboard (No Exception) | AAA | menu button pattern | pass | All operations are single-keystroke. ArrowDown enters the panel and focuses first item (line 320-326); typeahead is character-based, not chord-based. No timing or path-dependent input. The 500ms typeahead buffer reset is generous (NOT a 2.1.3 violation — operation is still triggered by single keystrokes; the buffer accumulates unrelated single-keystroke matches). |
| 2.4.7 | Focus Visible | AA | matrix harness | pass | Trigger (slotted hx-button) carries its own focus ring. Panel items carry their own `:focus-visible` outline. The roving tabindex pattern (`_applyRovingTabIndex`, line 462) ensures only the focused item is the tab stop, and its focus ring is always visible. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness | pass | `inViewport=true` for the focused element across all 18 contexts. Panel positioning via `_updatePosition` (line 358+) uses `@floating-ui/dom` to flip placement when the panel would overflow the viewport; the focused item never lands behind the trigger or off-screen. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | pass | Inner `[part="panel"]` (when open) and `[part="trigger"]` carry rings of width ≥2px and offset ≥2px via `--hx-focus-ring-*` tokens. Slotted menu items inherit ring styling from `:host(:focus-visible)` rules in hx-menu-item.styles.ts (line 22-26). |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Container is non-clickable; the slotted trigger (typically hx-button or hx-icon-button) carries the trigger hit area at ≥40×40 desktop carve-out. Slotted menu items render at ≥40px height (desktop carve-out). Container exemption per `isDropdown` carve-out. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) | pass | Slotted trigger button receives `aria-haspopup="menu"` and `aria-expanded={open}` via the dropdown's host-mirror logic. Inner `<div role="menu" id={panelId}>` (line 39) is the panel surface — `aria-controls` from trigger references this. Slotted hx-menu-item children carry `role="menuitem"` on their HOST (Group 5b host-canonical migration, line 71-73 inline doc). The dropdown host itself has no role — it's a composer container. |

## Keyboard contract

`navigate=Arrow,Home,End; activate=Enter,Space; dismiss=Escape; disabled-suppresses=true`

APG `menu button` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/, references `menubar`/`menu`). Combined with the APG `menu` pattern for the panel content. Implementation in `_handleKeydown` (line 403-429) and `_handleMenuNavigation` (line 433-450):

- **On the trigger (closed state)**: Enter / Space / ArrowDown opens the panel and focuses the first item (line 320-326). ArrowUp opens and focuses the last item (per APG menu button).
- **On the trigger (open state)**: Enter / Space activates the trigger which closes the panel (toggles the state).
- **In the panel**: ArrowDown / ArrowUp / Home / End navigate the roving tabindex (line 433-450); first-character typeahead (line 425-427) with 500ms buffer; Escape closes and returns focus to trigger (line 404-406); Tab closes the panel and lets focus advance to the next document element naturally (line 407-409, P2-02 semantic).
- **Disabled items**: filtered from `_getFocusableMenuItems()` so they're skipped during arrow-roving and typeahead.
- **Outside click**: closes the panel without returning focus (capture-phase listener at line 308).

## ARIA pattern

`menu button` + `menu` — https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/

Implementation:

1. Host: no explicit role. The host wraps a slotted `[slot="trigger"]` button and the floating panel.
2. Slotted trigger: hx-dropdown's `_ariaMirror` (initialized in `connectedCallback`) writes `aria-haspopup="menu"`, `aria-expanded={open}`, and `aria-controls={panelId}` onto the slotted trigger button (line 39-46 inline doc).
3. Inner panel: `<div part="panel" role="menu" id={panelId} aria-labelledby={triggerLabelId} ?hidden={!open}>` — the announced surface. The `role="menu"` is intentionally NOT migrated to the host; the host is a composer (line 69-73 inline doc).
4. Slotted hx-menu-item children carry `role="menuitem"` on their HOST after Group 5b's menu host-canonical migration. Each is independently focusable via roving tabindex.
5. The host can listen for outside clicks (line 308) and the `Escape` key (line 404) to dismiss; both paths are visible in `_hide(returnFocus)` semantics.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-dropdown/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

The panel collapses to `Canvas` background with `CanvasText` text and a `ButtonText` border under forced-colors. Slotted menu items inherit `ButtonText`/`Highlight` for hover and focus states. Floating-positioned panel still renders correctly under forced-colors (no transparency issues; system honors solid colors). Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **Container exemption (2.4.7 / 2.4.13 / 2.5.5)**: hx-dropdown is a popover-host container that composes a slotted trigger + floating panel. The trigger and slotted menu items carry the focus rings and hit areas. Matrix harness `isDropdown` carve-out documented in `scripts/aaa-matrix-verify.mjs` (this batch).
- **Tab semantics (P2-02)**: Tab closes the panel without returning focus to the trigger — focus advances naturally to the next document element. This matches user expectations on Tab-out from any popover and is APG-compliant. Escape always returns focus to the trigger.
- **Typeahead 500ms buffer**: matches hx-menu and hx-overflow-menu. The buffer is character-keystroke based (single keystrokes accumulate), not a chord/sequence requirement. 2.1.3 is satisfied — each keystroke is single.
- **Roving tabindex initialized on open**: `_applyRovingTabIndex` is called immediately on `_show()` (line 320-323) so Tab from outside the dropdown lands on the same item that has visual focus.
- **External `aria-labelledby`/`aria-describedby`**: an `_externalRefsObserver` (line 294) tracks consumer-supplied references on the host and propagates them to the inner panel for cross-shadow-DOM ID resolution.
- **No drupal `<select>` substitute**: hx-dropdown is a menu-button, not a combobox/select. For form-associated single-value selection, use hx-select (independently AAA-cert'd in batch 3).
