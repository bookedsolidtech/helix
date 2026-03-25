# HX Rating

A star rating input component for user feedback and display.
Supports whole and half-star ratings, keyboard navigation, hover preview,
and native form participation via ElementInternals.

### Accessibility

- **Interactive mode (precision=1)**: Uses `role="radiogroup"` with individual `role="radio"` stars.
  Each star has `aria-label` ("1 star", "2 stars", etc.) and `aria-checked`.
- **Interactive mode (precision=0.5)**: Uses `role="slider"` with `aria-valuemin`, `aria-valuemax`,
  `aria-valuenow`, and `aria-valuetext` (e.g. "2.5 out of 5 stars"). Star elements are
  `aria-hidden="true"` decorative visuals. This avoids a WCAG 2.5.3 label-content-name mismatch
  that would occur if a `role="radio"` labeled "3 stars" were checked for a value of 2.5.
- **Readonly mode**: Uses `role="img"` with a descriptive `aria-label` ("Rating: 3 out of 5").
- **Keyboard**: Arrow keys (Left/Right/Up/Down) adjust value by `precision` step.
  Home sets to 0, End sets to `max`. Focus follows the active tab stop.
- **Disabled**: Sets `aria-disabled="true"` on the group and prevents interaction.

## Usage

```twig
{% include 'helix:hx-rating' with {
  value: 0,
  max: 5,
  precision: '1',
  readonly: false,
  disabled: false,
  name: '',
  label: '',
  required: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | number | 0 | The current rating value (0 to max). |
| max | number | 5 | The maximum number of stars. |
| precision | object | 1 | The minimum selectable increment. Use 0.5 for half-star ratings. |
| readonly | boolean | false | When true, the rating is display-only and cannot be changed. |
| disabled | boolean | false | When true, the rating is disabled and cannot be interacted with. |
| name | string |  | The name submitted with the form. |
| label | string |  | Accessible label for the rating group. |
| required | boolean | false | When true, a non-zero rating is required for form submission. |

## Slots

| Slot | Description |
|------|-------------|
| icon | Custom rating icon. Receives `data-state` attribute ("full" | "half" | "empty"). |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when the rating value changes. |
| hx-hover | Dispatched while hovering over a star for preview. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-rating-color | var(--hx-color-warning-400,#fbbf24) | Filled star color. |
| --hx-rating-empty-color | var(--hx-color-neutral-300,#d1d5db) | Empty star color. |
| --hx-rating-hover-color | var(--hx-color-warning-300,#fcd34d) | Star color on hover. |
| --hx-rating-size | var(--hx-font-size-xl,1.25rem) | Star icon size. |
| --hx-rating-gap | var(--hx-space-1,0.25rem) | Gap between stars. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The outer container element. |
| symbol | Each individual star/icon element. |
