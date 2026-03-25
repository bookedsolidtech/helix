# HX Stat

A static stat display component for presenting key metrics in a healthcare dashboard.

## Usage

```twig
{% include 'helix:hx-stat' with {
  label: '',
  value: '',
  trend: 'neutral',
  size: 'md',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | The metric label displayed below the value. |
| value | string |  | The metric value displayed prominently. |
| trend | object | neutral | Trend direction indicator. 'neutral' hides the indicator. |
| size | object | md | Size variant controlling font size. |

## Slots

| Slot | Description |
|------|-------------|
| icon | Optional icon displayed alongside the stat value. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-stat-gap | var(--hx-space-1) | Gap between value and label. |
| --hx-stat-header-gap | var(--hx-space-2) | Gap between icon and value in the header row. |
| --hx-stat-color | var(--hx-color-neutral-800) | Default text color. |
| --hx-stat-value-color | var(--hx-color-neutral-900) | Value text color. |
| --hx-stat-label-color | var(--hx-color-neutral-500) | Label text color. |
| --hx-stat-icon-color | var(--hx-color-primary-500) | Icon color. |
| --hx-stat-value-font-weight | var(--hx-font-weight-bold) | Value font weight. |
| --hx-stat-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-stat-value-font-size-sm | var(--hx-font-size-xl) | Value font size at sm. |
| --hx-stat-value-font-size-md | var(--hx-font-size-3xl) | Value font size at md. |
| --hx-stat-value-font-size-lg | var(--hx-font-size-5xl) | Value font size at lg. |
| --hx-stat-label-font-size-sm | var(--hx-font-size-xs) | Label font size at sm. |
| --hx-stat-label-font-size-md | var(--hx-font-size-sm) | Label font size at md. |
| --hx-stat-label-font-size-lg | var(--hx-font-size-md) | Label font size at lg. |
| --hx-stat-trend-up-color | var(--hx-color-success-700) | Trend up text color. |
| --hx-stat-trend-up-bg | var(--hx-color-success-50) | Trend up background color. |
| --hx-stat-trend-down-color | var(--hx-color-error-700) | Trend down text color. |
| --hx-stat-trend-down-bg | var(--hx-color-error-50) | Trend down background color. |

## CSS Parts

| Part | Description |
|------|-------------|
| container | The outer stat container element. |
| header | The row containing the value and optional icon. |
| value | The stat value element. |
| label | The stat label element. |
| trend | The trend indicator element (only rendered when trend is not 'neutral'). |
| icon | The icon slot container. |
