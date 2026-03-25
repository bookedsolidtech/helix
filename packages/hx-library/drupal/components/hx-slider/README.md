# HX Slider

A range slider component for selecting a numeric value within a min/max boundary.
Supports tick marks, value display, range labels, and native form participation
via ElementInternals.

The native `<input type="range">` receives `role="slider"` with `aria-valuenow`,
`aria-valuemin`, and `aria-valuemax`. Label association uses `aria-labelledby`
when a label is present, or `aria-label` as a fallback. Help text is linked via
`aria-describedby`. Keyboard navigation follows the native range behavior:
Arrow keys increment/decrement by step, Home jumps to min, End jumps to max.

## Usage

```twig
{% include 'helix:hx-slider' with {
  name: '',
  value: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  label: '',
  helpText: '',
  showValue: false,
  showTicks: false,
  size: 'md',
  valueText: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | The name submitted with the form. |
| value | number | 0 | The current numeric value of the slider. |
| min | number | 0 | The minimum allowed value. |
| max | number | 100 | The maximum allowed value. |
| step | number | 1 | The stepping interval between values. |
| disabled | boolean | false | Whether the slider is disabled. |
| label | string |  | The visible label text for the slider. |
| helpText | string |  | Help text displayed below the slider for guidance. |
| showValue | boolean | false | When true, the current value is shown next to the label. |
| showTicks | boolean | false | When true, tick marks are rendered at each step interval. |
| size | object | md | The size variant of the slider. |
| valueText | string |  | Human-readable text alternative for the current value, announced by screen readers
instead of the numeric value. For example, on a pain scale: "7 — Moderate-Severe". |

## Slots

| Slot | Description |
|------|-------------|
| label | Custom label content (overrides the label property). |
| help-text | Custom help text content (overrides the helpText property). |
| min-label | Label rendered at the minimum end of the slider. |
| max-label | Label rendered at the maximum end of the slider. |

## Events

| Event | Description |
|-------|-------------|
| hx-input | Dispatched continuously while the user drags. |
| hx-change | Dispatched when the user releases the thumb. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-slider-track-bg | var(--hx-color-neutral-200) | Track background color. |
| --hx-slider-fill-bg | var(--hx-color-primary-500) | Fill/progress color. |
| --hx-slider-thumb-bg | var(--hx-color-neutral-0) | Thumb background color. |
| --hx-slider-thumb-border-color | var(--hx-color-primary-500) | Thumb border color. |
| --hx-slider-thumb-border-width | 2px | Thumb border width. |
| --hx-slider-thumb-shadow | var(--hx-shadow-sm) | Thumb box shadow. |
| --hx-slider-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-slider-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-slider-value-color | var(--hx-color-neutral-600) | Value display text color. |
| --hx-slider-tick-color | var(--hx-color-neutral-400) | Tick mark color. |
| --hx-slider-range-label-color | var(--hx-color-neutral-500) | Range label text color. |
| --hx-slider-help-text-color | var(--hx-color-neutral-500) | Help text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| slider | The outer container element. |
| track | The track background element. |
| fill | The filled portion of the track showing progress. |
| thumb | The draggable thumb overlay element. |
| label | The label element. |
| value-display | The element displaying the current numeric value. |
| tick | Each individual tick mark element. |
