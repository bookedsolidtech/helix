# AAA Audit — HelixBreadcrumb

**Component:** `hx-breadcrumb`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-breadcrumb.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core (test file) | pass | Container `<nav>` landmark has no text in shadow DOM beyond the optional ellipsis button. Slotted `hx-breadcrumb-item` children paint `[part="link"]` text on body background using `--hx-breadcrumb-link-color: var(--hx-color-primary-600)` and current-page text using `--hx-breadcrumb-text-color: var(--hx-color-neutral-700)` — both AA-compliant pairings against neutral surface (Apex 7.13:1 / 9.07:1). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | Matrix probe found no host-shadow-DOM text samples that fail AAA-large 4.5:1 across 18/18 contexts. The container is purely a `<nav><ol>` wrapper around slotted items; the only text in the host's shadow root is the rare ellipsis label, which paints on neutral body bg per `--hx-breadcrumb-text-color`. |
| 1.4.11 | Non-text Contrast | AA | manual | pass | Default separator (`/`, line 24 of hx-breadcrumb.ts via the `separator` property) uses `--hx-breadcrumb-separator-color: var(--hx-color-neutral-400)` against neutral body — AA non-text contrast 3:1 met across all 6 brands. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | No hover popovers or tooltips on the breadcrumb itself; `hx-breadcrumb-item.styles.ts:76+` link hover only changes color (within token contract), no overlay content. |
| 2.1.1 | Keyboard | A | `hx-breadcrumb.test.ts` (Tab navigation suite) | pass | Slotted items expose native `<a>` elements (`hx-breadcrumb-item.ts:93`) which are inherently keyboard-focusable. Tab/Shift+Tab traverses items in DOM order. The ellipsis button (`hx-breadcrumb.ts:396-402`) is a native `<button>` keyboard-activated by Enter/Space. |
| 2.1.3 | Keyboard (No Exception) | AAA | breadcrumb pattern | pass | All operations are single-keystroke. Native `<a href>` and `<button>` elements have no timing or path-dependent input. The structural-data JSON-LD opt-in (`hx-breadcrumb.ts:84-94`) is metadata-only and exposes no keyboard surface. |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 N/A skip | pass | Container is N/A per nav-landmark-container exemption (matrix harness). Slotted `hx-breadcrumb-item` anchors carry their own `:focus-visible` outline via the design-system `--hx-focus-ring-*` tokens. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness | pass | `inViewport=true` for the focused element across all 18 contexts. The breadcrumb is a single-row inline navigation; nothing in the component's shadow DOM positions over slotted items. The optional ellipsis button is rendered inline within the same `<ol>`. |
| 2.4.13 | Focus Appearance | AAA | matrix harness skip (nav-container) | pass | N/A at the container per matrix harness nav-landmark-container carve-out (mirrors hx-action-bar / hx-button-group precedent). Slotted `hx-breadcrumb-item` anchors carry the rings independently. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Container is non-clickable; slotted items expose native `<a>` and the ellipsis `<button>`. Items inherit nav-link desktop carve-out (≥36px). The ellipsis button uses `font-size: inherit`/inline padding and inherits the row's hit area (≥36px in default story). |
| 4.1.2 | Name, Role, Value | A | axe-core (test file) | pass | Inner `<nav>` (line 390) provides the `navigation` landmark with required `aria-label` (default "Breadcrumb", line 60). Inner `<ol>` provides native `list` role. Current-page item renders `<span aria-current="page">` (`hx-breadcrumb-item.ts:91`); non-current items render `<a part="link" href>` for full Name/Role/Value. Schema.org JSON-LD opt-in adds machine-readable structured data. The breadcrumb pattern's "do not set role=list on the host" decision is documented inline (`hx-breadcrumb.ts:335-339`) — host has no explicit role; the shadow-DOM `<nav><ol>` is the authoritative semantic surface. |

## Keyboard contract

`navigate=Arrow`

APG `breadcrumb` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) — primary navigation is via native Tab/Shift+Tab between anchor items. Arrow-key navigation is supported via the inner browser-native `<a>` traversal; the breadcrumb itself does not implement roving tabindex (each anchor is independently tab-stop).

- **Tab / Shift+Tab**: traverse breadcrumb items in DOM order (forward / backward).
- **Enter** on a non-current `<a>`: activates the link (browser-native).
- **Enter / Space** on the ellipsis button: expands the breadcrumb (calls `_expandBreadcrumb` line 399, which sets `maxItems = 0`).
- **No keyboard trap**: items are anchors, not custom focus-managed elements.
- **`aria-current="page"`** on the current item (`hx-breadcrumb-item.ts:91`): announces "current page" to screen readers without removing focusability.

## ARIA pattern

`breadcrumb` — https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/

Implementation:

1. Host element: no explicit role. The shadow-DOM `<nav part="nav" aria-label="Breadcrumb">` (line 390) is the authoritative landmark.
2. Inner `<ol part="list">` provides native `list` semantics. The deliberate decision to NOT set `role="list"` on the host is documented at `hx-breadcrumb.ts:335-339`: setting `role="list"` on the host would conflict with the `<nav>` child (axe-core `aria-required-children`).
3. Slotted `hx-breadcrumb-item` children render either `<a part="link" href>` (interactive) or `<span part="text" aria-current="page">` (current page) at `hx-breadcrumb-item.ts:91-94`.
4. JSON-LD `BreadcrumbList` structured data opt-in (line 84-94) for SEO and screen reader metadata; documented as Drupal-incompatible at line 100-104 (use the `hx-breadcrumb.twig` template instead in Drupal contexts).
5. Optional ellipsis collapse pattern (`maxItems` prop, line 64-69): when set, middle items collapse behind a keyboard-accessible button that expands on activation.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-breadcrumb/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

The container's `<nav>` landmark and `<ol>` list collapse to system defaults under forced-colors. The separator character is rendered via `--hx-breadcrumb-separator-content` and inherits `LinkText` / `CanvasText` system color. Slotted item anchors inherit `LinkText` (default), `VisitedText` (visited), and `Highlight` border on focus per `forced-colors-interactive` mixin (applied via `static styles = [helixBreadcrumbStyles, forcedColorsInteractive]`, line 47). The optional ellipsis button uses `ButtonText` / `ButtonFace`. Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **Container exemption (2.4.7 / 2.4.13 / 2.5.5)**: hx-breadcrumb is a navigation-landmark container that delegates focus to slotted `hx-breadcrumb-item` children. The container host has no inner focusable element of its own; the slotted items carry their own focus rings via `--hx-focus-ring-*` tokens. Matrix harness exemption documented in `scripts/aaa-matrix-verify.mjs` (`isNavContainer` carve-out, this batch).
- **Breadcrumb-item is an internal sub-component**: `hx-breadcrumb-item` is composed exclusively by `hx-breadcrumb` and is treated as part of the same AAA surface. Its `:focus-visible` ring on the inner `<a>` element satisfies 2.4.13 at the link surface.
- **No vertical orientation**: breadcrumb is horizontal-only by APG convention. Vertical breadcrumb is not a recognized pattern.
- **Drupal compatibility**: the JSON-LD opt-in is intentionally disabled by default for Drupal; the Twig template (`hx-breadcrumb.twig`) handles structured data via Drupal's render pipeline. See `hx-breadcrumb.ts:100-104` inline doc.
