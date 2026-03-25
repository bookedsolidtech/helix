# HX Popover

A popover that displays rich floating content attached to a trigger element.

## Usage

```twig
{% include 'helix:hx-popover' with {
  open: false,
  placement: 'bottom',
  trigger: 'click',
  distance: 8,
  skidding: 0,
  arrow: false,
  label: 'Popover',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| open | boolean | false | Whether the popover is open. |
| placement | object | bottom | Preferred placement of the popover relative to the anchor. |
| trigger | object | click | How the popover is triggered. |
| distance | number | 8 | Distance in pixels between the popover and the anchor. |
| skidding | number | 0 | Alignment offset in pixels along the anchor. |
| arrow | boolean | false | Whether to show an arrow pointing to the anchor. |
| label | string | Popover | Accessible label for the popover body (sets aria-label on the dialog). |

## Slots

| Slot | Description |
|------|-------------|
| anchor | The trigger element that opens the popover. |
| (default) | Default slot for popover body content. |

## Events

| Event | Description |
|-------|-------------|
| hx-show | Emitted when the popover begins to show. |
| hx-after-show | Emitted after the popover is fully visible. |
| hx-hide | Emitted when the popover begins to hide. |
| hx-after-hide | Emitted after the popover is fully hidden. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-popover-bg | var(--hx-color-neutral-0) | Popover background color. |
| --hx-popover-color | var(--hx-color-neutral-900) | Popover text color. |
| --hx-popover-font-size | var(--hx-font-size-sm) | Popover font size. |
| --hx-popover-max-width | 320px | Maximum popover width. |
| --hx-popover-padding | - | Popover padding. |
| --hx-popover-border-color | var(--hx-color-neutral-200) | Popover border color. |
| --hx-popover-border-radius | var(--hx-border-radius-md) | Popover border radius. |
| --hx-popover-shadow | - | Popover box shadow. |
| --hx-popover-z-index | 9999 | Popover z-index. |
| --hx-popover-transition-duration | 0.2s | Show/hide transition duration. |
| --hx-popover-arrow-size | 10px | Size of the arrow indicator. |

## CSS Parts

| Part | Description |
|------|-------------|
| body | The popover body container element. |
| arrow | The arrow indicator element. |
