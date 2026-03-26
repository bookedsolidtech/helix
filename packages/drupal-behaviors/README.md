# @helixui/drupal-behaviors

Drupal behaviors for all interactive HELiX web components using Drupal's `once()` pattern.

This package provides `Drupal.behaviors.*` registrations for every interactive `hx-*` component in the HELiX library. Each behavior handles initialization from data attributes, event wiring, accessibility announcements, and proper cleanup on detach — making HELiX components fully compatible with Drupal's AJAX, BigPipe, Layout Builder, and XB rendering pipelines.

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

Copy or reference the files from `node_modules/@helixui/drupal-behaviors/src/` in your theme or module build.

### Direct download

Download individual behavior files from the `src/behaviors/` directory and place them in your Drupal theme's `js/` folder.

---

## Usage

### Load all behaviors (combined bundle)

Reference `src/index.js` in your `mytheme.libraries.yml`:

```yaml
# mytheme.libraries.yml
helix-behaviors:
  js:
    path/to/node_modules/@helixui/drupal-behaviors/src/index.js: {}
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
    path/to/node_modules/@helixui/drupal-behaviors/src/behaviors/hx-accordion.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once

helix-dialog:
  js:
    path/to/node_modules/@helixui/drupal-behaviors/src/behaviors/hx-dialog.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once
```

---

## Behavior Reference

Every behavior follows the same pattern: attach to a wrapper element identified by a `data-drupal-*` attribute, then read configuration from additional `data-*` attributes on the same wrapper.

### hxAccordion

Attaches to: `[data-drupal-accordion]`

| Data attribute    | Type    | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| `data-open-first` | boolean | When `"true"`, auto-expands the first panel       |

Behavior:
- Auto-expands the first `hx-accordion-panel` when `data-open-first="true"`
- Announces panel state changes via `Drupal.announce()` for screen readers

```html
<div data-drupal-accordion data-open-first="true">
  <hx-accordion>
    <hx-accordion-panel>...</hx-accordion-panel>
  </hx-accordion>
</div>
```

---

### hxDialog

Attaches to: `[data-drupal-dialog]`

| Data attribute         | Type   | Description                                        |
| ---------------------- | ------ | -------------------------------------------------- |
| `data-trigger-selector`| string | CSS selector for the button that opens the dialog  |

Behavior:
- Binds a click handler to the trigger element that sets `dialog.open = true`
- Returns focus to the trigger element on `hx-close` and `hx-cancel` events
- Correctly handles focus management for WCAG 2.1 AA compliance

```html
<div data-drupal-dialog data-trigger-selector="#open-patient-dialog">
  <hx-dialog>
    <span slot="heading">Patient Record</span>
    ...
  </hx-dialog>
</div>
<button id="open-patient-dialog">View Record</button>
```

---

### hxDrawer

Attaches to: `[data-drupal-drawer]`

| Data attribute         | Type   | Description                                        |
| ---------------------- | ------ | -------------------------------------------------- |
| `data-trigger-selector`| string | CSS selector for the toggle button                 |
| `data-direction`       | string | Sets `direction` attribute: `left`, `right`, `top`, `bottom` |
| `data-size`            | string | Sets `size` attribute on the component             |

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

Attaches to: `[data-drupal-menu]`

Behavior:
- Closes the menu on click outside the wrapper element
- Closes the menu on `Escape` key press
- Properly removes the `document`-level click listener on detach

```html
<div data-drupal-menu>
  <hx-menu>
    <button slot="trigger">Actions</button>
    <hx-menu-item>Edit</hx-menu-item>
    <hx-menu-item>Delete</hx-menu-item>
  </hx-menu>
</div>
```

---

### hxTabs

Attaches to: `[data-drupal-tabs]`

| Data attribute    | Type   | Description                                        |
| ----------------- | ------ | -------------------------------------------------- |
| `data-active-tab` | string | Tab ID to activate on initialization               |

Behavior:
- Activates a tab on init, preferring the URL hash over `data-active-tab`
- Syncs the URL hash via `history.replaceState()` on `hx-change` for direct linking
- Enables deep linking to specific tabs from Drupal views or blocks

```html
<div data-drupal-tabs data-active-tab="overview">
  <hx-tabs>
    <hx-tab value="overview">Overview</hx-tab>
    <hx-tab value="history">History</hx-tab>
    <hx-tab-panel value="overview">...</hx-tab-panel>
    <hx-tab-panel value="history">...</hx-tab-panel>
  </hx-tabs>
</div>
```

---

### hxPopover

Attaches to: `[data-drupal-popover]`

| Data attribute    | Type   | Description                                        |
| ----------------- | ------ | -------------------------------------------------- |
| `data-placement`  | string | Sets `placement` attribute: `top`, `bottom`, `left`, `right` |
| `data-trigger`    | string | When `"click"`, enables click-outside-to-close     |

Behavior:
- Applies placement from data attribute
- Closes on `Escape` key press
- For click-triggered popovers, closes on click outside the wrapper

```html
<div data-drupal-popover data-placement="bottom" data-trigger="click">
  <hx-popover>
    <button slot="trigger">More info</button>
    <div slot="content">Additional details here.</div>
  </hx-popover>
</div>
```

---

### hxToast

Attaches to: `[data-drupal-toast]`

| Data attribute  | Type    | Description                                         |
| --------------- | ------- | --------------------------------------------------- |
| `data-duration` | number  | Auto-dismiss delay in milliseconds                  |
| `data-show`     | boolean | When `"true"`, shows the toast immediately on attach |

Behavior:
- Sets auto-dismiss duration from data attribute
- Wires `[data-toast-close]` buttons inside the wrapper
- Auto-shows the toast when `data-show="true"` — useful for Drupal status messages

```html
<div data-drupal-toast data-duration="5000" data-show="true">
  <hx-toast variant="success">
    Your changes have been saved.
  </hx-toast>
</div>
```

---

### hxTooltip

Attaches to: `[data-drupal-tooltip]`

| Data attribute    | Type   | Description                                        |
| ----------------- | ------ | -------------------------------------------------- |
| `data-content`    | string | Tooltip text content                               |
| `data-placement`  | string | Tooltip placement: `top`, `bottom`, `left`, `right` |

Behavior:
- Sets content and placement from data attributes
- Closes on `Escape` key press for keyboard accessibility (WCAG 2.1 SC 1.4.13)

```html
<div data-drupal-tooltip data-content="Patient ID: 12345" data-placement="top">
  <hx-tooltip>
    <button slot="trigger">View ID</button>
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

- `hxAccordion`: Announces expand/collapse state via `Drupal.announce()` (requires `core/drupal.announce`)
- `hxDialog` and `hxDrawer`: Return focus to trigger element on close (WCAG 2.1 SC 2.4.3)
- `hxTooltip`: `Escape` dismissal meets WCAG 2.1 SC 1.4.13 (Content on Hover or Focus)
- `hxMenu` and `hxPopover`: `Escape` key closes via keyboard for SC 2.1.2 (No Keyboard Trap)

---

## License

MIT. See [LICENSE](../../LICENSE).
