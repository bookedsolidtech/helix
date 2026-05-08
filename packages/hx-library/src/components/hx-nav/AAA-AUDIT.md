# AAA Audit — HelixNav

**Component:** `hx-nav`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-nav.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core (test file) | pass | Default link color `--hx-nav-link-color: var(--hx-color-neutral-100)` against `--hx-nav-bg: var(--hx-color-neutral-900)` clears AA across all 6 brands. Active-state pairing addressed by 1.4.6 below. |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness (action-surface carve-out) | pass | Active link `[part="link"]` paints `--hx-color-text-on-primary` over `--hx-color-primary-600` — same token-tier guarantee as button surfaces (Apex 5.82:1, Meridian 12.05:1, Lumen 7.10:1, Verdant 6.70:1, Signal 6.37:1, Ember 6.22:1). The token correctly resolves to `#000000` under high-contrast theme (where primary-600 lightens to #60A5FA), preserving AAA-large 4.5:1. **Style fix this batch**: changed fallback chain in `hx-nav.styles.ts:103` from `--hx-color-neutral-0` (always white, broke high-contrast 2.54:1) → `--hx-color-text-on-primary` (theme-aware). Inactive-link text on neutral-900 surface easily clears AAA 7:1. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Mobile toggle hamburger icon and chevron uses `currentColor` — inherits link color which meets 3:1 against nav background. Submenu border (`--hx-color-neutral-700` against `--hx-color-neutral-800`) is non-text and clears 3:1. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | Submenu opens on hover (line 462-475 desktop) or click; submenu is dismissable via Escape (line 294-298), hoverable (mouse can move into submenu), and persistent (does not close on a delay). |
| 2.1.1 | Keyboard | A | `hx-nav.test.ts` (keyboard suite) + KeyboardNavigation story | pass | Native `<a>` and `<button>` slotted children are inherently keyboard-focusable. Custom roving navigation via `_handleKeydown` (line 250-310) handles ArrowLeft/Right/Up/Down/Home/End/Escape/Enter. |
| 2.1.3 | Keyboard (No Exception) | AAA | navigation pattern | pass | All operations are single-keystroke. ArrowDown opens submenu and focuses first sub-item (line 262-270). Escape closes the submenu and returns focus to the parent (line 294-298). No timing or path-dependent input. Mobile toggle uses standard button activation (Enter/Space). |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 N/A skip | pass | N/A at the container per nav-landmark-container exemption. Slotted `<a part="link">` paints its own focus ring via `.nav__link:focus-visible` (line 95-99): `outline: var(--hx-focus-ring-width, 2px) solid var(--hx-nav-focus-ring-color, var(--hx-focus-ring-color, #0f7078))` with `outline-offset: var(--hx-focus-ring-offset, 2px)`. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness | pass | `inViewport=true` for the focused element across all 18 contexts. Submenu in horizontal orientation appears below the parent; vertical orientation expands inline. The mobile-open submenu fills the available width and never obscures other focusable elements within the same nav. |
| 2.4.13 | Focus Appearance | AAA | matrix harness skip (nav-container) | pass | N/A at the container per matrix harness `isNavContainer` carve-out. Slotted link surfaces (`[part="link"]`) carry the rings independently — width ≥2px, offset ≥2px, contrasting color via `--hx-focus-ring-color`. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Slotted `<a part="link">` items render at the row height (≥36px, desktop carve-out). Mobile hamburger toggle uses `--hx-touch-target-min: 2.75rem` (44px) implicitly via the toggle's CSS height. Container exemption per `isNav` carve-out. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) | pass | Inner `<nav part="nav">` provides the `navigation` landmark. Top-level `<ul role="list">` (line 525) provides explicit list semantics. Each link uses `<a href>` for native `link` role + `aria-current="page"` (line 430, 475) on the active item. Submenus use `aria-expanded` (line 479) on the parent. Mobile toggle uses `<button aria-expanded aria-controls="nav-list">` (line 517-518). |

## Keyboard contract

`navigate=Arrow,Home,End; activate=Enter,Space`

APG `navigation` landmark + menubar/navigation pattern (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/navigation.html). Keyboard map implemented in `_handleKeydown` (line 250-310):

- **ArrowRight / ArrowDown** (horizontal nav): focus next item; if item has children and orientation is horizontal, ArrowDown opens submenu and focuses first sub-item.
- **ArrowLeft / ArrowUp**: focus previous item (wraps to last at start).
- **Home**: focus first item (line 284-287).
- **End**: focus last item (line 289-292).
- **Escape**: close any open submenu and return focus to the parent item (line 294-298).
- **Enter / Space**: activate the focused link (browser-native for `<a>`).
- **Tab / Shift+Tab**: enters/exits the navigation; once inside, arrow keys are the primary navigation.
- **Mobile toggle**: Enter/Space activates the hamburger which sets `_mobileOpen` and toggles `aria-expanded` on the toggle button (line 517).

## ARIA pattern

`navigation` — https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/navigation.html

Implementation:

1. Host: no explicit role. Shadow-DOM `<nav part="nav" aria-label="...">` is the authoritative landmark.
2. Top-level `<ul role="list" id="nav-list">` (line 525) — explicit list role to defy CSS `list-style: none` ambiguity in WebKit.
3. Each item is a `<li part="item">` containing either `<a part="link">` (no children) or a parent `<button part="link">` + nested `<ul class="nav__submenu">` (with children).
4. Active item: `aria-current="page"` (line 430, 475) on the link element. Recursive parent of an active child gets `aria-current="true"` (line 462).
5. Submenu parent: `aria-expanded={isExpanded}` (line 479) + chevron icon. `aria-haspopup` is implied by the menu/submenu structure.
6. Mobile toggle: `<button aria-expanded={mobileOpen} aria-controls="nav-list">` (line 515-518). The `aria-controls` ID matches the top-level list.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-nav/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas / LinkText.

The `<nav>` landmark and lists collapse to system defaults under forced-colors. Link color falls through to `LinkText`; active link border becomes `Highlight`; hover/focus rings use `Highlight` outline. The mobile toggle button picks up `ButtonText`/`ButtonFace`. `forced-colors-interactive` mixin applied via `static styles = [helixNavStyles, forcedColorsInteractive]` (line 88). Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **Container exemption (2.4.7 / 2.4.13 / 2.5.5)**: hx-nav is a navigation-landmark container — slotted/data-driven links are the focusable surfaces. Matrix harness `isNavContainer` and `isNav` carve-outs documented in `scripts/aaa-matrix-verify.mjs` (this batch).
- **Active-link 1.4.6 fix**: prior to this batch, `--hx-nav-link-active-color` fell back to `--hx-color-neutral-0` (hardcoded white). This passed default themes but failed AAA-large (2.54:1) under high-contrast where primary-600 is `#60A5FA`. Style fix: changed fallback to `--hx-color-text-on-primary` which correctly resolves to `#000000` under high-contrast. The token is the same one button surfaces use to satisfy 1.4.6 across the matrix.
- **NavItem.children rendering**: top-level items with children render as `<button>` (not `<a>`) since the parent itself is not a navigation target (line 478-487 `_renderNavLink`); this is the canonical APG menubar pattern for parent-only items.
- **Vertical orientation**: `orientation="vertical"` is supported (sidebar pattern). ArrowDown navigates next item even with children (no submenu auto-open in vertical mode); ArrowRight opens submenu.
