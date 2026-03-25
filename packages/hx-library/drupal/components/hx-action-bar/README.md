# HX Action Bar

A horizontal toolbar container for grouping related action buttons and controls.
Implements the ARIA toolbar pattern with roving tabindex keyboard navigation.

## Usage

```twig
{% include 'helix:hx-action-bar' with {
  size: 'md',
  variant: 'default',
  position: 'top',
  sticky: false,
  ariaLabel: 'Actions',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | object | md | Size of the action bar — propagated as a data attribute to slotted children. |
| variant | object | default | Visual variant controlling the bar background. |
| position | object | top | Position and sticky behavior of the action bar.
- `top` — normal flow (default)
- `sticky` — sticks to the top of the scroll container; add `scroll-padding-top` to the
  scroll container equal to the bar height to prevent anchor targets from scrolling behind it
- `bottom` — sticks to the bottom of the scroll container with iOS safe-area-inset support |
| sticky | boolean | - |  |
| ariaLabel | string | Actions | Accessible label for the toolbar.
Required when multiple toolbars appear on the same page. |

## Slots

| Slot | Description |
|------|-------------|
| start | Left-aligned actions. |
| (default) | Center content (default slot). |
| end | Right-aligned actions. |
| overflow | Actions revealed when the bar is constrained for space. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-action-bar-bg | transparent | Bar background color (default variant). |
| --hx-action-bar-border | none | Bar border (default variant). |
| --hx-action-bar-padding | var(--hx-space-2,0.5rem) var(--hx-space-3,0.75rem) | Inner padding. |
| --hx-action-bar-gap | var(--hx-space-2,0.5rem) | Gap between slotted items. |
| --hx-action-bar-z-index | 10 | Z-index when sticky or bottom position. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root toolbar container element. |
| start | The start (left) slot wrapper. |
| center | The center (default) slot wrapper. |
| end | The end (right) slot wrapper. |
| overflow | The overflow slot wrapper (hidden when no overflow content). |
