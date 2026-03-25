# HX Progress Ring

SVG-based circular progress indicator. Supports determinate and indeterminate modes,
multiple size variants, semantic color variants, and a center content slot.

## Usage

```twig
{% include 'helix:hx-progress-ring' with {
  value: 'null',
  max: 100,
  size: 'md',
  strokeWidth: 4,
  variant: 'default',
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | object | null | Current progress value (0–max). When null, renders in indeterminate mode. |
| max | number | 100 | Maximum value for the progress range. Defaults to 100. Used for aria-valuemax. |
| size | object | md | Size of the ring. Controls SVG diameter. |
| strokeWidth | number | 4 | Stroke width of the ring circles in SVG user units. |
| variant | object | default | Semantic color variant. |
| label | string |  | Accessible label for the progressbar. Exposed as aria-label.
Set this attribute to satisfy WCAG 4.1.2. When absent, aria-busy reflects
indeterminate state and a console warning is emitted. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for center content (percentage text, icon, etc.). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-progress-ring-track-color | var(--hx-color-neutral-200) | Track stroke color. |
| --hx-progress-ring-indicator-color | var(--hx-color-primary-500) | Indicator stroke color. |
| --hx-progress-ring-label-color | var(--hx-color-neutral-900) | Center label text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The SVG element. |
| track | The background circle track. |
| indicator | The progress arc indicator. |
| label | The center slot wrapper div. |
