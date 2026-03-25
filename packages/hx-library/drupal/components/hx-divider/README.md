# HX Divider

A visual separator element for dividing content sections. Supports
horizontal and vertical orientations, configurable spacing, and an optional
centered label rendered between two lines.

## Usage

```twig
{% include 'helix:hx-divider' with {
  orientation: 'horizontal',
  spacing: 'md',
  decorative: false,
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| orientation | object | horizontal | Orientation of the divider. |
| spacing | object | md | Spacing applied to the block axis (horizontal) or inline axis (vertical). |
| decorative | boolean | false | When true, renders the divider as decorative only (role="presentation").
Screen readers will not announce decorative dividers. |
| label | object | - | Optional text label rendered centered between the divider lines.
Also sets aria-label on the separator for assistive technologies. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Optional label text rendered centered between two lines. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-divider-color | var(--hx-color-neutral-200) | Line color. |
| --hx-divider-width | var(--hx-border-width-thin) | Line thickness. |
| --hx-divider-label-color | var(--hx-color-neutral-500) | Label text color. |
| --hx-divider-label-font-size | var(--hx-font-size-sm) | Label font size. |
| --hx-divider-label-gap | var(--hx-space-3) | Gap between lines and label. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root divider element. |
| label | The optional centered label wrapper. |
