# HX Radio Group

A form-associated radio group that manages a set of `<hx-radio>` children.

## Usage

```twig
{% include 'helix:hx-radio-group' with {
  value: '',
  name: '',
  label: '',
  required: false,
  disabled: false,
  error: '',
  helpText: '',
  orientation: 'vertical',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string |  | The selected radio's value. |
| name | string |  | The name used for form submission. |
| label | string |  | The fieldset legend/label text. |
| required | boolean | false | Whether a selection is required for form submission. |
| disabled | boolean | false | Whether the entire group is disabled. |
| error | string |  | Error message to display. When set, the group enters an error state. |
| helpText | string |  | Help text displayed below the group for guidance. |
| orientation | object | vertical | Layout orientation of the radio items. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | `<hx-radio>` elements. |
| error | Custom error content (overrides the error property). |
| help-text | Custom help text content (overrides the helpText property). |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when the selected radio changes. |
| hx-radio-select | Internal event dispatched by `hx-radio` when selected; consumed by the group. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-radio-group-gap | var(--hx-space-3, 0.75rem) | Gap between radio items. |
| --hx-radio-group-label-color | var(--hx-color-neutral-700, #343a40) | Label text color. |
| --hx-radio-group-error-color | var(--hx-color-error-500, #dc3545) | Error message color. |
| --hx-radio-group-help-text-color | var(--hx-color-neutral-500, #6c757d) | Help text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| fieldset | The fieldset wrapper. |
| legend | The legend/label. |
| group | The container for radio items. |
| error | The error message. |
| help-text | The help text. |
