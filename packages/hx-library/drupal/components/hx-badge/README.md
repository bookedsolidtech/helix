# HX Badge

A small status indicator for notifications, counts, and labels.

## Usage

```twig
{% include 'helix:hx-badge' with {
  variant: 'primary',
  size: 'md',
  pill: false,
  pulse: false,
  removable: false,
  count: 'undefined',
  max: 99,
  dotLabel: '',
  removeLabel: 'Remove',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | primary | Visual style variant of the badge. |
| size | object | md | Size of the badge. |
| pill | boolean | false | Whether the badge uses fully rounded (pill) styling. |
| pulse | boolean | false | Whether the badge displays an animated pulse for attention. |
| removable | boolean | false | Whether the badge renders a dismiss button. |
| count | object | undefined | Numeric count to display. When set, renders the count as badge content.
When count exceeds `max`, displays `${max}+` (e.g. `99+`). |
| max | number | 99 | Maximum count value before truncation to `${max}+`. Defaults to 99. |
| dotLabel | string |  | Accessible label for the dot indicator mode (pulse + empty slot).
Required for WCAG 4.1.2 compliance when using the dot indicator pattern.
Example: `dot-label="3 new messages"`. |
| removeLabel | string | Remove | Accessible label for the remove button. Should describe what is being removed.
Defaults to "Remove". For better accessibility, include context: e.g. "Remove Critical badge". |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for badge content (text, number). When empty with pulse enabled, renders as a dot indicator. |
| prefix | Icon or content rendered before the badge text. |

## Events

| Event | Description |
|-------|-------------|
| hx-remove | Dispatched when the user clicks the remove button. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-badge-bg | var(--hx-color-primary-500) | Badge background color. The primary override point. |
| --hx-badge-color | var(--hx-color-neutral-0) | Badge text color. The primary override point. |
| --hx-badge-font-size | - | Badge font size (set per size variant). |
| --hx-badge-font-weight | var(--hx-font-weight-semibold) | Badge font weight. |
| --hx-badge-font-family | var(--hx-font-family-sans) | Badge font family. |
| --hx-badge-border-radius | var(--hx-border-radius-md) | Badge border radius. |
| --hx-badge-padding-x | - | Badge horizontal padding (set per size variant). |
| --hx-badge-padding-y | - | Badge vertical padding (set per size variant). |
| --hx-badge-pulse-color | - | Pulse color matching variant background with reduced opacity. |
| --hx-badge-dot-size | var(--hx-size-2) | Dot indicator size when rendered without content. |
| --hx-badge-secondary-bg | var(--hx-color-neutral-100) | Background for the secondary variant. |
| --hx-badge-secondary-color | var(--hx-color-neutral-700) | Text color for the secondary variant. |
| --hx-badge-info-bg | var(--hx-color-info-700) | Background for the info variant. |
| --hx-badge-info-color | var(--hx-color-neutral-0) | Text color for the info variant. |

## CSS Parts

| Part | Description |
|------|-------------|
| badge | The badge element. |
| remove-button | The remove/dismiss button. |
