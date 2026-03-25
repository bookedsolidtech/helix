# HX Tooltip

A tooltip that displays contextual help text on hover or focus.

## Usage

```twig
{% include 'helix:hx-tooltip' with {
  placement: 'top',
  showDelay: 300,
  hideDelay: 100,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| placement | object | top | Preferred placement of the tooltip relative to the trigger.
Supports all Floating UI placement values including alignment variants
(e.g. 'top-start', 'bottom-end') and 'auto'. |
| showDelay | number | 300 | Delay in milliseconds before the tooltip is shown. |
| hideDelay | number | 100 | Delay in milliseconds before the tooltip is hidden. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the trigger element. |
| content | Tooltip content to display. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-tooltip-bg | var(--hx-color-neutral-900) | Tooltip background color. |
| --hx-tooltip-color | var(--hx-color-neutral-50) | Tooltip text color. |
| --hx-tooltip-font-size | var(--hx-font-size-xs) | Tooltip font size. |
| --hx-tooltip-max-width | 280px | Maximum tooltip width. |
| --hx-tooltip-padding | - | Tooltip padding. |
| --hx-tooltip-border-radius | var(--hx-border-radius-sm) | Tooltip border radius. |
| --hx-tooltip-shadow | - | Tooltip box shadow. |
| --hx-tooltip-z-index | 9999 | Tooltip z-index. |
| --hx-tooltip-transition-duration | 0.15s | Show/hide transition duration. |
| --hx-tooltip-arrow-size | 8px | Size of the arrow indicator. |

## CSS Parts

| Part | Description |
|------|-------------|
| tooltip | The tooltip container element. |
| arrow | The arrow indicator element. |
