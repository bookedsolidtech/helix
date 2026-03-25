# HX Toast Stack

A fixed-position container that stacks `hx-toast` elements at the specified
corner of the viewport. Enforces a maximum visible toast count via `stack-limit`.

## Usage

```twig
{% include 'helix:hx-toast-stack' with {
  placement: 'bottom-end',
  stackLimit: 3,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| placement | object | bottom-end | Corner of the viewport where toasts appear. |
| stackLimit | number | 3 | Maximum number of simultaneously visible toasts. 0 = unlimited. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Accepts `hx-toast` elements. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-z-index-toast | 9000 | Z-index for the fixed stack. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner stack container div. |
