# HX Checkbox Group

A form-associated checkbox group that manages a set of `<hx-checkbox>` children.

## Usage

```twig
{% include 'helix:hx-checkbox-group' with {
  name: '',
  label: '',
  required: false,
  disabled: false,
  error: '',
  orientation: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | The name used for form submission. Passed to child `hx-checkbox` elements. |
| label | string |  | The fieldset legend/label text. |
| required | boolean | false | Whether at least one checkbox must be checked for form submission. |
| disabled | boolean | false | Whether the entire group is disabled. |
| error | string |  | Error message to display. When set, the group enters an error state. |
| orientation | object | - | Layout orientation of the checkbox items. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | `<hx-checkbox>` elements. |
| label | Rich HTML group label (overrides the label property when used). |
| error | Custom error content (overrides the error property). |
| help-text | Group-level help text. |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when any child checkbox changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-checkbox-group-gap | var(--hx-space-3, 0.75rem) | Gap between checkbox items. |
| --hx-checkbox-group-label-color | var(--hx-color-neutral-700, #343a40) | Label text color. |
| --hx-checkbox-group-error-color | var(--hx-color-error-500, #dc3545) | Error message color. |
| --hx-checkbox-group-help-text-color | var(--hx-color-neutral-500) | Help text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| group | The fieldset wrapper. |
| label | The legend/label. |
| help-text | The help text container. |
| error-message | The error message container. |
