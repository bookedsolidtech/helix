# HX Counter

Animated number counter that counts from 0 (or the previous value) to the
target value using requestAnimationFrame. Respects prefers-reduced-motion.

## Usage

```twig
{% include 'helix:hx-counter' with {
  value: 0,
  duration: 1000,
  easing: 'ease-out',
  format: 'integer',
  prefix: '',
  suffix: '',
  size: 'md',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | number | 0 | The target numeric value to count to. |
| duration | number | 1000 | Animation duration in milliseconds. |
| easing | object | ease-out | Easing function applied to the animation progress. |
| format | object | integer | Number format. 'integer' rounds to the nearest whole number;
'decimal' shows two decimal places. |
| prefix | string |  | String prepended to the formatted value (e.g., '$'). |
| suffix | string |  | String appended to the formatted value (e.g., '%'). |
| size | object | md | Size variant controlling font size. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-counter-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-counter-font-weight | var(--hx-font-weight-bold) | Font weight. |
| --hx-counter-color | var(--hx-color-neutral-900) | Counter text color. |
| --hx-counter-font-size-sm | var(--hx-font-size-xl) | Font size at sm. |
| --hx-counter-font-size-md | var(--hx-font-size-3xl) | Font size at md. |
| --hx-counter-font-size-lg | var(--hx-font-size-5xl) | Font size at lg. |

## CSS Parts

| Part | Description |
|------|-------------|
| counter | The outer counter element. |
