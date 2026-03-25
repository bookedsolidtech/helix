# HX Button Group

A container component that groups related hx-button elements into a cohesive
horizontal or vertical action set. Eliminates double borders between adjacent
buttons and squares off inner border-radius for a unified visual appearance.

**Accessibility:** Always provide an accessible label via `aria-label` or
`aria-labelledby` so screen readers can announce the group purpose.

## Usage

```twig
{% include 'helix:hx-button-group' with {
  orientation: '',
  size: 'md',
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| orientation | object | - | Layout orientation of the button group. |
| size | object | md | Size applied to the button group and cascaded to child buttons via
the --hx-button-group-size CSS custom property. |
| label | string |  | Accessible label for the button group. Sets aria-label via ElementInternals.
**Strongly recommended** for WCAG 2.1 AA compliance — without it, screen
readers announce an unnamed "group". For Drupal/Twig compatibility, prefer
applying `aria-label` directly as an HTML attribute instead. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot accepting hx-button children. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-button-group-size | md | Size token forwarded to child buttons. Accepts 'sm', 'md', or 'lg'. |

## CSS Parts

| Part | Description |
|------|-------------|
| group | The container div element wrapping all slotted buttons. |
