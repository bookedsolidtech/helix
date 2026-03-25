# HX Meter

A scalar measurement within a known range — e.g., disk usage, health score,
or any numeric value with defined min/max bounds. Supports low/high/optimum
threshold markers for semantic color feedback.

## Usage

```twig
{% include 'helix:hx-meter' with {
  value: 0,
  min: 0,
  max: 100,
  low: '',
  high: '',
  optimum: '',
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | number | 0 | Current value of the meter. |
| min | number | 0 | Minimum value of the range. |
| max | number | 100 | Maximum value of the range. |
| low | object | - | Threshold below which the value is considered suboptimal (lower range warning). |
| high | object | - | Threshold above which the value is considered suboptimal (upper range warning). |
| optimum | object | - | The optimal value within the range. Used to determine which zone is "good". |
| label | object | - | Accessible label for the meter. Used as the visible label text and as
the source for `aria-labelledby`. When only slot content is provided
(no `label` attribute), the slot content is used for the accessible name. |

## Slots

| Slot | Description |
|------|-------------|
| label | Visible label rendered above the meter track. When using this slot without the `label` attribute, the accessible name is derived from the slot content via `aria-labelledby`. The `label` attribute is NOT required when slot content is provided — the component detects slot content and switches to `aria-labelledby` automatically. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-meter-track-height | - | Height of the track bar. |
| --hx-meter-track-color | - | Background color of the unfilled track. |
| --hx-meter-track-radius | - | Border radius of the track. |
| --hx-meter-indicator-color | - | Default filled bar color (no thresholds). |
| --hx-meter-color-optimum | - | Color when value is in the optimum zone. |
| --hx-meter-color-warning | - | Color when value is in a warning zone. |
| --hx-meter-color-danger | - | Color when value is in the danger zone. |
| --hx-meter-label-color | - | Label text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The outer wrapper element. |
| track | The unfilled track bar element. |
| indicator | The filled bar indicating the current value. |
| label | The label wrapper element. |
