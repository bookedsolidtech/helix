# HX Drawer

A slide-in drawer panel that can appear from any edge of the viewport.
Supports focus trapping, overlay backdrop, keyboard navigation, and full
ARIA labelling for enterprise healthcare accessibility requirements.

## Usage

```twig
{% include 'helix:hx-drawer' with {
  open: false,
  placement: 'end',
  size: 'md',
  contained: false,
  noHeader: false,
  noFooter: false,
  label: '',
  closeLabel: 'Close drawer',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| open | boolean | false | Controls whether the drawer is open. |
| placement | object | end | Which edge of the viewport the drawer slides in from. |
| size | object | md | The size of the drawer panel. Use 'sm', 'md', 'lg', 'full', or any valid CSS length. |
| contained | boolean | false | When true, the drawer is constrained to its positioned parent instead of the viewport.
The host element must have `position: relative` (or the library handles it via :host). |
| noHeader | boolean | false | When true, the header (title, header-actions, close button) is hidden. |
| noFooter | boolean | false | When true, the footer slot is hidden. |
| label | string |  | Accessible label for the dialog when the `label` slot is not populated.
When the `label` slot is used, `aria-labelledby` takes precedence. |
| closeLabel | string | Close drawer | Accessible label for the built-in close button. Override for localized text. |

## Slots

| Slot | Description |
|------|-------------|
| label | The drawer title text. |
| header-actions | Action buttons displayed in the header near the close button. |
| (default) | Default slot for the drawer body content. |
| footer | Action buttons or footer content. |

## Events

| Event | Description |
|-------|-------------|
| hx-show | Fired when the drawer begins to open. |
| hx-after-show | Fired after the drawer open animation completes. |
| hx-hide | Fired when the drawer begins to close. |
| hx-after-hide | Fired after the drawer close animation completes. |
| hx-initial-focus | Fired when initial focus is set inside the drawer. Cancelable to override focus behavior. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-drawer-bg | var(--hx-color-neutral-0) | Drawer panel background color. |
| --hx-drawer-color | var(--hx-color-neutral-900) | Drawer panel text color. |
| --hx-drawer-shadow | var(--hx-shadow-xl) | Drawer panel box shadow. |
| --hx-drawer-backdrop-color | var(--hx-color-neutral-900) | Backdrop color. |
| --hx-drawer-backdrop-opacity | 0.5 | Backdrop opacity. |
| --hx-drawer-header-padding | - | Padding inside the header. |
| --hx-drawer-header-border-color | var(--hx-color-neutral-200) | Header border color. |
| --hx-drawer-title-color | var(--hx-color-neutral-900) | Title text color. |
| --hx-drawer-body-padding | - | Padding inside the body. |
| --hx-drawer-footer-padding | - | Padding inside the footer. |
| --hx-drawer-footer-border-color | var(--hx-color-neutral-200) | Footer border color. |

## CSS Parts

| Part | Description |
|------|-------------|
| overlay | The full-screen overlay container (includes backdrop and panel). |
| panel | The drawer panel itself. |
| header | The header region containing the title and actions. |
| title | The drawer title element. |
| close-btn | The built-in close button. |
| body | The scrollable body region. |
| footer | The footer region. |
