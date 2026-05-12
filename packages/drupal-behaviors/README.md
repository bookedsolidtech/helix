# @helixui/drupal-behaviors

Drupal behaviors for a curated set of interactive HELiX web components using Drupal's `once()` pattern.

This package ships `Drupal.behaviors.*` registrations for **eight** HELiX components — `hx-accordion`, `hx-dialog`, `hx-drawer`, `hx-menu`, `hx-popover`, `hx-tabs`, `hx-toast`, `hx-tooltip` — covering the overlays, navigation primitives, and live-region surfaces that benefit most from Drupal-side wiring. Other interactive `hx-*` components (form controls, links, cards) upgrade from their own module imports and do not require a behavior wrapper. Each shipped behavior handles initialization from data attributes, event wiring, and detach-time cleanup; accessibility-affordance details vary per behavior (see the Behavior Reference + Accessibility Notes below for the actual contract). Behaviors are compatible with Drupal's AJAX, BigPipe, and Layout Builder rendering pipelines through the standard `Drupal.behaviors` + `once()` contract; Experience Builder (XB) compatibility is consumer-validated, not package-tested.

---

## Why Drupal Behaviors?

Drupal's rendering pipeline re-evaluates JavaScript on partial page updates (AJAX, BigPipe chunks, Layout Builder previews). Without the `once()` pattern, event listeners and initialization code run multiple times on the same element, causing duplicate handlers, memory leaks, and broken state.

`Drupal.behaviors` with `once()` solves this:

- `attach` runs on every DOM update but `once()` ensures per-element initialization happens exactly once
- `detach` with `trigger === 'unload'` removes the `once()` marker, allowing re-initialization after removal and re-insertion
- Event listeners added inside `once()` are scoped to that single initialization

---

## Installation

### npm (theme build pipeline)

```bash
npm install @helixui/drupal-behaviors
# or
pnpm add @helixui/drupal-behaviors
```

The published package ships the compiled bundle at `dist/index.js` plus the per-behavior files
under `dist/behaviors/`. Reference those `dist/` paths from your theme libraries — the `src/` tree
is repository-only and is **not** included in the published tarball.

### Direct download

Download the compiled per-behavior files from the package's `dist/behaviors/` directory (or the
shipped GitHub release) and place them in your Drupal theme's `js/` folder.

---

## Usage

### Load all behaviors (combined bundle)

Reference `src/index.js` in your `mytheme.libraries.yml`:

```yaml
# mytheme.libraries.yml
helix-behaviors:
  js:
    path/to/node_modules/@helixui/drupal-behaviors/dist/index.js: {}
  dependencies:
    - core/drupal
    - core/once
```

### Load individual behaviors (selective loading)

For performance-sensitive pages, load only the behaviors you need:

```yaml
# mytheme.libraries.yml
helix-accordion:
  js:
    path/to/node_modules/@helixui/drupal-behaviors/dist/behaviors/hx-accordion.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once

helix-dialog:
  js:
    path/to/node_modules/@helixui/drupal-behaviors/dist/behaviors/hx-dialog.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once
```

---

## Behavior Reference

Every behavior follows the same pattern: attach to a wrapper element identified by a `data-drupal-*` attribute, then read configuration from additional `data-*` attributes on the same wrapper.

### hxAccordion

Attaches to: `[data-drupal-accordion]`

| Data attribute    | Type    | Description                                |
| ----------------- | ------- | ------------------------------------------ |
| `data-open-first` | boolean | When `"true"`, auto-expands the first item |

Behavior:

- Auto-expands the first `hx-accordion-item` when `data-open-first="true"`
- The component itself manages ARIA expand/collapse state on each `hx-accordion-item` (`aria-expanded`, `aria-controls`); this behavior does not add an explicit `Drupal.announce()` layer on top — screen readers pick up the state change from the component's own ARIA

```html
<div data-drupal-accordion data-open-first="true">
  <hx-accordion>
    <hx-accordion-item>...</hx-accordion-item>
  </hx-accordion>
</div>
```

---

### hxDialog

Attaches to: `[data-drupal-dialog]`

| Data attribute          | Type   | Description                                       |
| ----------------------- | ------ | ------------------------------------------------- |
| `data-trigger-selector` | string | CSS selector for the button that opens the dialog |

Behavior:

- Binds a click handler to the trigger element that sets `dialog.open = true`
- Returns focus to the trigger element on `hx-close` and `hx-cancel` events
- Supports WCAG 2.2 SC 2.4.3 Focus Order; the dialog component itself owns focus-trap + return-focus and is covered by the formal AAA harness verdicts in `packages/hx-library/aaa-verdicts.json`

```html
<div data-drupal-dialog data-trigger-selector="#open-patient-dialog">
  <hx-dialog heading="Patient Record">
    <h2 slot="header">Patient Record</h2>
    ...
  </hx-dialog>
</div>
<button id="open-patient-dialog">View Record</button>
```

---

### hxDrawer

Attaches to: `[data-drupal-drawer]`. The behavior reads three data attributes and copies them onto the inner `hx-drawer` (matching what the shipped behavior source does today):

| Data attribute          | Maps to `hx-drawer` attribute | Description                                                                       |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| `data-trigger-selector` | (consumed by behavior)        | CSS selector for the toggle button outside the wrapper.                           |
| `data-direction`        | `direction`                   | Slide direction (`left`, `right`, `top`, `bottom`). Forwarded as `direction="…"`. |
| `data-size`             | `size`                        | Drawer size token (`sm`, `md`, `lg`). Forwarded as `size="…"`.                    |

> **Source-of-truth note:** Both `direction` and `size` are the attribute names the **behavior** writes onto `hx-drawer`. If your `hx-drawer` build maps those to a different inner attribute (e.g. `placement` / `hx-size`), the behavior either needs an update or you should fork-and-rebrand it; the published `@helixui/drupal-behaviors` source does not currently translate. Always cross-check `packages/drupal-behaviors/src/behaviors/hx-drawer.behavior.js`.

Behavior:

- Applies body scroll lock (`overflow: hidden`) while the drawer is open
- Restores scroll and returns focus to trigger on close
- Releases scroll lock on detach to prevent stuck scroll state

```html
<div data-drupal-drawer data-trigger-selector="#nav-toggle" data-direction="left">
  <hx-drawer>
    <nav>...</nav>
  </hx-drawer>
</div>
<button id="nav-toggle">Open Navigation</button>
```

---

### hxMenu

Attaches to: `[data-drupal-menu]` (the wrapper element). The behavior pairs that wrapper with an **external** trigger button matched by `aria-controls` pointing at the wrapper's `id`:

- The trigger button lives **outside** the wrapper and carries `data-drupal-menu-trigger` plus `aria-controls="<wrapper id>"`.
- The behavior toggles the wrapper's `hidden` state, updates `aria-expanded` on the trigger, returns focus to the trigger on `hx-close`, and closes on outside click / Escape.

Behavior:

- Listens for `hx-close` on the inner `hx-menu` and runs the close path
- Closes on click outside the wrapper (or trigger)
- Closes on `Escape` key press
- Returns focus to the trigger when the menu closes
- Properly removes the `document`-level click listener on detach

```html
<button data-drupal-menu-trigger aria-expanded="false" aria-controls="actions-menu-wrapper">
  Actions
</button>

<div id="actions-menu-wrapper" data-drupal-menu hidden>
  <hx-menu>
    <hx-menu-item>Edit</hx-menu-item>
    <hx-menu-item>Delete</hx-menu-item>
  </hx-menu>
</div>
```

---

### hxTabs

Attaches to: `[data-drupal-tabs]`

| Data attribute    | Type   | Description                                                                                       |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `data-active-tab` | string | Tab identifier (matches the `value` carried in `hx-change.detail`) to activate on initialization. |

Behavior:

- Reads `element.dataset.activeTab` (preferring the current URL hash) and activates the matching tab on init
- Listens for `hx-change` on `hx-tabs` and syncs the URL hash via `history.replaceState()` from `event.detail.value`
- Enables deep linking to specific tabs from Drupal views or blocks

> **Source-of-truth note:** The behavior uses **`data-active-tab`** plus the `hx-change` event with **`event.detail.value`** — that's what the shipped `packages/drupal-behaviors/src/behaviors/hx-tabs.behavior.js` reads/writes today. If your `hx-tabs` component dispatches `hx-tab-change` with `detail.panel` instead, the behavior either needs an update or a parallel custom integration. Cross-check the behavior source before composing.

```html
<div data-drupal-tabs data-active-tab="overview">
  <hx-tabs>
    <hx-tab value="overview">Overview</hx-tab>
    <hx-tab value="history">History</hx-tab>
    <hx-tab-panel name="overview">...</hx-tab-panel>
    <hx-tab-panel name="history">...</hx-tab-panel>
  </hx-tabs>
</div>
```

---

### hxPopover

Attaches to: `[data-drupal-popover]`

| Data attribute   | Type   | Description                                                  |
| ---------------- | ------ | ------------------------------------------------------------ |
| `data-placement` | string | Sets `placement` attribute: `top`, `bottom`, `left`, `right` |
| `data-trigger`   | string | When `"click"`, enables click-outside-to-close               |

Behavior:

- Applies placement from data attribute
- Closes on `Escape` key press
- For click-triggered popovers, closes on click outside the wrapper

`hx-popover` exposes an `anchor` slot for the triggering element and a default slot for the
popover body. The trigger button lives in `slot="anchor"`; the body content sits in the default
slot.

```html
<div data-drupal-popover data-placement="bottom" data-trigger="click">
  <hx-popover>
    <button slot="anchor">More info</button>
    <div>Additional details here.</div>
  </hx-popover>
</div>
```

---

### hxToast

Attaches to: `[data-drupal-toast]`

| Data attribute  | Type    | Description                                          |
| --------------- | ------- | ---------------------------------------------------- |
| `data-duration` | number  | Auto-dismiss delay in milliseconds                   |
| `data-show`     | boolean | When `"true"`, shows the toast immediately on attach |

Behavior:

- Sets auto-dismiss duration from data attribute
- Wires `[data-toast-close]` buttons inside the wrapper
- Auto-shows the toast when `data-show="true"` — useful for Drupal status messages

```html
<div data-drupal-toast data-duration="5000" data-show="true">
  <hx-toast variant="success"> Your changes have been saved. </hx-toast>
</div>
```

---

### hxTooltip

Attaches to: `[data-drupal-tooltip]`

| Data attribute   | Type   | Description                                         |
| ---------------- | ------ | --------------------------------------------------- |
| `data-placement` | string | Tooltip placement: `top`, `bottom`, `left`, `right` |

Behavior:

- Sets `placement` from the data attribute
- Closes on `Escape` key press for keyboard accessibility (WCAG 2.2 SC 1.4.13 — Content on Hover or Focus)

`hx-tooltip` does not expose a `content` attribute or a `trigger` slot; the trigger element is
the tooltip's preceding sibling, and the tooltip body content lives in the `content` slot.

```html
<div data-drupal-tooltip data-placement="top">
  <button id="view-id-trigger">View ID</button>
  <hx-tooltip>
    <span slot="content">Patient ID: 12345</span>
  </hx-tooltip>
</div>
```

---

## AJAX and BigPipe Compatibility

All behaviors are safe to use with:

- **Drupal AJAX**: Behaviors re-attach after any AJAX response that adds new DOM
- **BigPipe**: Behaviors attach to each streamed chunk independently via the `context` parameter
- **Layout Builder**: Behaviors re-attach when block previews are inserted
- **Views AJAX**: Behavior attaches to refreshed view results

The `once()` key namespacing (`hx-accordion`, `hx-dialog`, etc.) ensures no conflicts with other behaviors using the same pattern.

---

## Data-Attribute Initialization Schema

All behaviors follow the same wrapper pattern. The `data-drupal-*` attribute identifies the component type; additional `data-*` attributes provide initialization configuration:

```
[data-drupal-{component}]   <- Required: identifies the behavior target
  [data-{option}="value"]   <- Optional: component configuration
    <hx-{component}>        <- The actual web component
```

This separation allows Drupal theme layers (Twig templates, field formatters, views) to configure component behavior entirely from server-side rendering — no JavaScript configuration needed.

---

## Accessibility Notes

- `hxAccordion`: state changes are announced by the component's own ARIA (`aria-expanded` on each item) — this behavior does not add a separate `Drupal.announce()` layer
- `hxDialog` and `hxDrawer`: Return focus to trigger element on close (WCAG 2.2 SC 2.4.3 — Focus Order). The components themselves own the focus trap and are covered by the formal AAA harness verdicts
- `hxTooltip`: `Escape` dismissal contributes to WCAG 2.2 SC 1.4.13 (Content on Hover or Focus); the canonical dismissable / hoverable / persistent contract is enforced by `hx-tooltip` itself
- `hxMenu` and `hxPopover`: `Escape` key closes via keyboard (supports SC 2.1.2 — No Keyboard Trap)

---

## License

MIT. See [LICENSE](../../LICENSE).
