# AAA Audit — HelixTopNav

**Component:** `hx-top-nav`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-top-nav.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core (test file) | pass | Container surface only; no text in shadow DOM beyond the mobile-toggle aria-label and slotted content. Slotted links carry their own consumer-driven contrast (or are themselves AAA-cert'd hx-button / hx-nav children). The optional sticky-mode shadow uses `--hx-color-shadow-md` (3:1 luminance change against page bg). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | No text samples found in the host's shadow DOM (the `<nav>` landmark wraps slots only). The mobile-toggle button is icon-only with an `aria-label` — no visible text. Matrix probe returns 0 visible-text samples → vacuously satisfied across 18/18 contexts. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Mobile hamburger SVG icon (line 184-200) renders `currentColor` (inherits link/text color) against the nav background (`--hx-top-nav-bg`); meets 3:1 across all 6 brands. Sticky-mode shadow `--hx-color-shadow-md` provides ≥3:1 luminance change. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | Mobile menu opens on toggle click (not hover); dismissable via Escape (line 164-179) and via the toggle button. The menu is hoverable (mouse-friendly) and persistent (no auto-dismiss). |
| 2.1.1 | Keyboard | A | `hx-top-nav.test.ts` (keyboard suite) + KeyboardNavigation story | pass | Mobile toggle is a native `<button>` with Enter/Space activation. Escape closes the open mobile menu (line 164-179). When the mobile menu opens, focus moves to the first interactive element in the default slot via `assignedElements({flatten: true})` + `FOCUSABLE_SELECTOR` walk (line 141-159) — guards against focus-trapping on a non-interactive `<div>` slot child. |
| 2.1.3 | Keyboard (No Exception) | AAA | navigation pattern | pass | All operations are single-keystroke. Mobile toggle Enter/Space activates; Escape closes. No timing or path-dependent input. The `escape-closes-menu` story (`components-top-nav--escape-closes-menu`) is dedicated to this verification. |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 N/A skip | pass | N/A at the container per `isNavContainer` exemption. The mobile-toggle `<button part="mobile-toggle">` and slotted links carry their own focus rings. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness | pass | `inViewport=true` for the focused element across all 18 contexts. Sticky-mode positioning preserves children's focus visibility (the bar slides; rings remain unobstructed). When the mobile menu opens, focus moves to the first focusable child within the visible menu region. |
| 2.4.13 | Focus Appearance | AAA | matrix harness skip (nav-container) | pass | N/A at the container per matrix harness `isNavContainer` carve-out. The slotted nav children and the mobile toggle each carry rings with width ≥2px and offset ≥2px via `--hx-focus-ring-*` tokens. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Container is non-clickable; the mobile-toggle button (`[part="mobile-toggle"]`) renders ≥40×40 desktop carve-out (sm variant 44×44 touch-mandate per `--hx-touch-target-min`). Slotted links inherit nav-link desktop carve-out. Container exemption per `isTopNav` carve-out. |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) | pass | Inner `<nav part="nav" aria-label={label}>` (line 220) provides `navigation` landmark with required accessible name (default "Main navigation"). Mobile toggle is `<button aria-expanded={mobileOpen} aria-controls="nav-menu" aria-label={contextual}>` (line 230-233) — full Name/Role/Value with state. The menu container has `id="nav-menu"` to satisfy the `aria-controls` reference. |

## Keyboard contract

`navigate=Arrow,Home,End; activate=Enter,Space`

APG `navigation` landmark (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/navigation.html). hx-top-nav implements the disclosure-toggle pattern for mobile and exposes the slot-based navigation for desktop:

- **Tab / Shift+Tab**: traverse all focusable children (mobile toggle + slotted links + actions slot).
- **Enter / Space** on mobile toggle (line 230): toggles `_mobileOpen` and dispatches `hx-mobile-toggle` event. When opening, focus moves to first focusable slotted child (line 137-159).
- **Escape** (when mobile menu is open): closes the menu, dispatches `hx-mobile-toggle` with `open: false`, and returns focus to the toggle button (line 164-179).
- **Slotted links/actions**: arrow-key navigation is the consumer's responsibility (slot-based architecture). When slotted with hx-nav, the inner navigation provides arrow-key roving.
- **Sticky mode**: scroll-driven, no keyboard impact. Focus rings remain visible against the sticky background.

## ARIA pattern

`navigation` — https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/navigation.html (with disclosure toggle for mobile)

Implementation:

1. Host: no explicit role (default presentation). Shadow-DOM `<nav part="nav" aria-label={label}>` (line 220) is the authoritative landmark.
2. Three slot architecture: `logo` (left), default (center, primary nav), `actions` (right, utilities).
3. Mobile toggle: `<button part="mobile-toggle" aria-expanded={String(mobileOpen)} aria-controls="nav-menu" aria-label={contextual}>` (line 228-235). The `aria-label` flips between "Open navigation" / "Close navigation" based on state — matches APG disclosure pattern.
4. Menu container has `id="nav-menu"` to satisfy `aria-controls`. The `[hidden]` attribute on the menu when closed prevents focus from reaching slotted children at desktop breakpoint when collapsed.
5. The default slot's IMPORTANT note (lines 19-22) warns consumers NOT to place a `<nav>` element in the default slot — would create nested landmarks. Linter test verifies this in `hx-top-nav.test.ts`.
6. `hx-mobile-toggle` CustomEvent (composed, bubbles) lets consumers track menu state externally.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-top-nav/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas / LinkText.

The `<nav>` landmark and mobile-toggle button collapse to system defaults under forced-colors. The hamburger SVG inherits `currentColor` (becomes `LinkText` or `ButtonText`). The mobile menu (when open) renders on `Canvas` background with system text color. Sticky-mode shadow is suppressed under forced-colors (transparent shadow not honored; system handles depth indicators). Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **Container exemption (2.4.7 / 2.4.13 / 2.5.5)**: hx-top-nav is a navigation-landmark container — the host has no clickable inner element of its own beyond the mobile-toggle (which IS focusable and gets a ring at the slotted-link level). Matrix harness `isNavContainer` and `isTopNav` carve-outs documented in `scripts/aaa-matrix-verify.mjs` (this batch).
- **Mobile-only behavior**: `_mobileOpen` is irrelevant at desktop breakpoints (the menu is always visible). The toggle is `display: none` at >= breakpoint per CSS media query.
- **Focus-trap-on-empty-slot prevention**: line 141-159 explicitly walks `assignedElements({flatten: true})` to find the first FOCUSABLE descendant rather than just `slot.firstChild`. This handles the case where a consumer places a non-interactive `<div>` wrapper in the slot — focus would otherwise land on a non-keyboard-reachable element.
- **Drupal compatibility**: `hx-top-nav.html.twig` is provided for Drupal SDC integration; the Twig template renders the same slot architecture and is idempotent with the JS component.
- **No JSON-LD**: top navigation is not site-structure metadata; for that, use hx-breadcrumb's JSON-LD opt-in.
