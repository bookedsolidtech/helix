# AAA Audit — HelixMenu

**Component:** `hx-menu`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-menu.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core (test file) | pass | Menu text paints `--hx-color-text-primary` against `--hx-color-surface-raised`; AA 4.5:1 across all 6 brands. Disabled items use `--hx-color-text-disabled` against the surface; informational only (3:1 not strictly required for disabled per WCAG, but token-tier ensures at least non-text 3:1). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | Menu text on raised-surface bg clears AAA 7:1 across 18/18 contexts. The matrix harness extension this batch walks the focused hx-menu-item's own shadow root to find ring/text on `[part="base"]`. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Selected/checked icon (`[part="checked-icon"]`, hx-menu-item.ts:505) paints `--hx-color-primary-600` against the menu surface — meets 3:1. Submenu chevron uses `--hx-color-text-secondary` against the menu bg — meets 3:1 across all brands. Divider (hx-menu-divider) uses `--hx-color-border-subtle` — meets 3:1 non-text. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | Submenus open on ArrowRight (or hover-with-delay if implemented at consumer level); persistent (no auto-close timer for opened submenus); dismissable via ArrowLeft (line 47 fires `hx-item-submenu-close`) and Escape (line 276-279 fires `hx-close`); hoverable (mouse can move between parent and submenu). |
| 2.1.1 | Keyboard | A | `hx-menu.test.ts` (keyboard suite) + KeyboardNavigation story | pass | Full APG menu pattern in `_handleKeyDown` (line 254-286): ArrowUp/Down with wrap-around (line 260-267); Home/End jump to first/last (line 268-275); Escape fires `hx-close` (line 276-279); first-character typeahead with 500ms timeout (line 280-283). hx-menu-item handles ArrowLeft/ArrowRight for submenu open/close locally (hx-menu-item.ts:202+). |
| 2.1.3 | Keyboard (No Exception) | AAA | menu pattern | pass | All operations are single-keystroke. Submenu navigation: ArrowRight opens and focuses first child; ArrowLeft closes and returns focus to parent. Disabled items are skipped during arrow-navigation but typeahead also skips them via `item.disabled` filter (line 300). No timing or path-dependent input. The 500ms typeahead buffer is single-keystroke based. |
| 2.4.7 | Focus Visible | AA | matrix harness | pass | hx-menu-item host paints `:host(:focus-visible) .menu-item` outline (hx-menu-item.styles.ts:22-26): `outline: var(--hx-focus-ring-width, 2px) solid` with offset. The host's default focus outline is stripped (line 10) so the inner `.menu-item` is the visual treatment. Single-host roving (Group 5b host-canonical) means the menu-item host IS the focusable surface. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness | pass | `inViewport=true` for the focused element across all 18 contexts. **Submenu careful handling**: when a submenu opens (ArrowRight), focus moves to the submenu's first item; the parent menu remains visible (no overlay) so the parent item is not obscured by the submenu. The submenu is positioned to the right of the parent (or flipped left if overflow); never overlaps the focused submenu item. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | pass | hx-menu-item focus outline detected by matrix harness via `[part="base"]` ring selector + extended walk into the focused element's own shadow root (this batch). Width ≥2px, offset 0px (per `--hx-menu-item-focus-ring-offset: 0px` for menu density) is acceptable per APG guidance — the outline contrasts the surface and is fully visible. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | hx-menu-item renders ≥40px height (desktop carve-out for menu density). Touch-mandate sm size renders ≥44px via `--hx-touch-target-min`. Container exemption per `isMenu` carve-out for slotted hx-menu-item children. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) | pass | Host carries `role="menu"` (Group 5b host-canonical, line 51-55 inline doc). Host receives `aria-label` resolved from consumer-supplied `aria-label`, `aria-labelledby` (flattened via `flattenAccName` from `aria-flatten.js`), or the `label` property in that precedence (line 543-552). hx-menu-item host carries `role="menuitem"`, `role="menuitemcheckbox"`, or `role="menuitemradio"` based on its `type` property. Roving `tabindex` on items (line 200-205): only the active item carries `tabindex=0`. dev-warn fires (line 514-521) if no accessible label is provided (WCAG 4.1.2 enforcement at dev time). |

## Keyboard contract

`navigate=Arrow,Home,End; activate=Enter,Space; dismiss=Escape; disabled-suppresses=true`

APG `menu` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/menubar/, references `menu`). Implementation in `_handleKeyDown` (line 254-286):

- **ArrowDown / ArrowUp**: focus next/previous enabled item with wrap-around (line 260-267). Disabled items can receive focus or be skipped depending on consumer `_focusItem` policy; the typeahead path skips disabled (line 300).
- **Home**: focus first item (line 268-271).
- **End**: focus last item (line 272-275).
- **Escape**: dispatches `hx-close` event (line 276-279) so the parent (e.g. hx-dropdown, hx-overflow-menu, hx-split-button) can close the popover and return focus to the trigger.
- **First-character typeahead** (line 280-284): single-keystroke letter accumulates in a 500ms buffer; matches the next item starting with the buffer (case-insensitive, submenu-aware via `getMenuItemTypeaheadLabel`).
- **Enter / Space** on a menu-item: activate the item via the item's own contract (dispatches `hx-item-select` typically). Checkbox/radio items toggle their `checked` state.
- **ArrowRight** on an item with submenu: opens the submenu and moves focus into it (handled in hx-menu-item — fires `hx-item-submenu-open` event on line 46).
- **ArrowLeft** in a submenu: closes the submenu and returns focus to the parent item (fires `hx-item-submenu-close` on line 47).
- **Disabled items**: filtered from typeahead (line 300); receive arrow-roving per APG so keyboard users can discover them.

## ARIA pattern

`menu` — https://www.w3.org/WAI/ARIA/apg/patterns/menubar/

Group 5b host-canonical implementation:

1. **Host (`hx-menu`)**: carries `role="menu"` directly (Group 5b; line 51-55). The host is the announced menu surface.
2. **Accessible name resolution** (line 543-552): `aria-labelledby` (flattened via `flattenAccName`) > `aria-label` > `label` property. The resolved name lands on the host's `aria-label`. Inner `div[role="menu"]` (legacy) mirrors this for ATs traversing the legacy fallback path.
3. **Item (`hx-menu-item`)**: host carries `role="menuitem"` (default), `role="menuitemcheckbox"` (when `type="checkbox"`), or `role="menuitemradio"` (when `type="radio"`). `aria-checked`, `aria-disabled`, and `aria-label` are managed at the item host level.
4. **Roving tabindex** (line 200-205): only the active item carries `tabindex=0`; the rest are `tabindex=-1`. `_syncRovingTabIndex` is called on slot change and on keyboard navigation.
5. **Submenu nesting**: nested hx-menu-item children of an item with `slot="submenu"` activate when the parent's submenu is opened (via ArrowRight or pointer hover). The nested submenu uses the same hx-menu component recursively.
6. **Dividers**: hx-menu-divider is a presentational separator (`role="separator"`) inside the menu surface. Excluded from `_getItems()` so it doesn't participate in roving.
7. **dev-warn for missing label**: if no `aria-label`, `aria-labelledby`, or `label` is provided (line 514-521), a console warning fires at first paint to enforce 4.1.2 at dev time.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-menu/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas / SelectedItem / SelectedItemText.

The menu surface renders on `Canvas` with `CanvasText` text and `ButtonText` border under forced-colors. Selected/checked items use `Highlight` / `SelectedItem` for the indicator. Focus ring (hx-menu-item.styles.ts:130-132 forced-colors block) explicitly switches to `Highlight` outline. Submenus retain the same forced-colors styling at each level. Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **Group 5b host-canonical**: hx-menu migrated to host-canonical `role="menu"` in Group 5b. Aria-related attributes (`aria-label`, `aria-labelledby`) are accepted on the host and resolved via the shared `aria-idref` and `aria-flatten` utilities. The inner `div[role="menu"]` is a legacy fallback path; modern ATs read the host directly.
- **Matrix harness extension this batch**: the harness now walks the focused element's own shadow root for ring detection. hx-menu-item places its `:focus-visible` outline on the inner `[part="base"]` element via `:host(:focus-visible) .menu-item`; the host itself has `outline: none`. The harness extension to also walk `focusedEl.shadowRoot` resolves the prior 2.4.13 false-fail.
- **Typeahead 500ms buffer**: matches hx-dropdown, hx-overflow-menu, and hx-split-button. Single-keystroke based; cumulative buffer resets after 500ms idle. Submenu-aware via the shared `getMenuItemTypeaheadLabel` extractor.
- **Submenu 2.4.12 careful handling**: per the task spec, hx-menu submenus must satisfy 2.4.12 (focus not obscured). The submenu opens to the right of the parent (with @floating-ui/dom positioning) and never overlaps the focused submenu item. When the submenu's content overflows the viewport, the positioner flips placement.
- **Used by other components**: hx-menu is the canonical menu surface; hx-dropdown, hx-overflow-menu, and hx-split-button compose hx-menu (or compatible `<button role="menuitem">` slotted children) inside their popover panels. The menu pattern is shared across all four.
- **Checkbox / radio menu items**: hx-menu-item supports `type="checkbox"` and `type="radio"` for stateful items. These follow APG's `menuitemcheckbox` / `menuitemradio` patterns: `aria-checked` reflects state; Space toggles; Enter activates with persistence.
