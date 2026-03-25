# HX Steps

A multi-step wizard / stepper progress indicator. Renders a sequence of
`<hx-step>` children as a horizontal or vertical step tracker with connector
lines and status-based styling.

Provide an `aria-label` on `<hx-steps>` to describe the step process for assistive technology.

## Usage

```twig
{% include 'helix:hx-steps' with {
  orientation: 'horizontal',
  size: 'md',
  ariaLabel: 'null',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| orientation | object | horizontal | Layout orientation of the steps. |
| size | object | md | Size variant of the steps. |
| ariaLabel | object | null | Accessible label for the list. Forwarded to the inner list element. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for `<hx-step>` elements. |

## Events

| Event | Description |
|-------|-------------|
| hx-step-click | Dispatched when a step is clicked. Detail contains the clicked `step` element and its zero-based `index`. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-steps-indicator-size | 2rem | Step indicator circle diameter. |
| --hx-steps-connector-color | var(--hx-color-neutral-200) | Connector line color. |
| --hx-steps-label-color | var(--hx-color-neutral-600) | Step label text color. |
| --hx-steps-description-color | var(--hx-color-neutral-500) | Step description color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner wrapper element. |
