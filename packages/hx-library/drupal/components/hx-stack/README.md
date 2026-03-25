# HX Stack

A flexbox layout wrapper for consistent vertical/horizontal spacing between children.

## Usage

```twig
{% include 'helix:hx-stack' with {
  direction: 'vertical',
  gap: 'md',
  align: 'stretch',
  justify: 'start',
  wrap: false,
  inline: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| direction | object | vertical | Direction of the stack layout. |
| gap | object | md | Gap between children using design tokens. |
| align | object | stretch | Align-items value for cross-axis alignment. |
| justify | object | start | Justify-content value for main-axis distribution. |
| wrap | boolean | false | When true, children wrap onto multiple lines. |
| inline | boolean | false | When true, the component renders as `display: inline-flex`. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for any child content. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner flex container. |
