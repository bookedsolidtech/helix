# HX Icon Button

An icon-only button component for compact, accessible actions.
Renders a square button or anchor element containing a single icon.
The `label` property is required and provides the accessible name
via `aria-label` and a native tooltip via the `title` attribute.

## Usage

```twig
{% include 'helix:hx-icon-button' with {
  label: '',
  variant: 'ghost',
  size: 'md',
  type: 'button',
  disabled: false,
  href: 'undefined',
  name: 'undefined',
  value: 'undefined',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | Accessible name for the button. Required. Rendered as `aria-label` and
`title` on the underlying element. The component renders nothing when absent,
and a console warning is emitted to alert developers during authoring. |
| variant | object | ghost | Visual style variant of the button. |
| size | object | md | Size of the button. |
| type | object | button | The type attribute for the underlying button element.
Has no effect when `href` is set. |
| disabled | boolean | false | Whether the button is disabled. |
| href | object | undefined | When set, renders an `<a>` element instead of a `<button>`. |
| name | object | undefined | Name submitted with form data. Only applicable when rendering as a button. |
| value | object | undefined | Value submitted with form data. Only applicable when rendering as a button. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Icon element to display (hx-icon, svg, or img). |

## Events

| Event | Description |
|-------|-------------|
| hx-click | Dispatched when the button is clicked (not disabled). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-icon-button-bg | transparent | Button background color. |
| --hx-icon-button-color | var(--hx-color-primary-500) | Icon color. |
| --hx-icon-button-border-color | transparent | Button border color. |
| --hx-icon-button-border-radius | var(--hx-border-radius-md) | Button border radius. |
| --hx-icon-button-size | - | Explicit width and height override for the button. |
| --hx-icon-button-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |

## CSS Parts

| Part | Description |
|------|-------------|
| button | The native button or anchor element. |
| icon | The icon container span wrapping the default slot. |
