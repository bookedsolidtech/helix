# HX Checkbox

A checkbox component with label, validation, and form association.

## Usage

```twig
{% include 'helix:hx-checkbox' with {
  checked: false,
  indeterminate: false,
  disabled: false,
  required: false,
  name: '',
  value: 'on',
  label: '',
  error: '',
  helpText: '',
  requiredMessage: 'This field is required.',
  size: 'md',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | boolean | false | Whether the checkbox is checked. |
| indeterminate | boolean | false | Whether the checkbox is in an indeterminate state (e.g., for "select all" patterns). |
| disabled | boolean | false | Whether the checkbox is disabled. |
| required | boolean | false | Whether the checkbox is required for form submission. |
| name | string |  | The name of the checkbox, used for form submission. |
| value | string | on | The value submitted when the checkbox is checked. |
| label | string |  | The visible label text for the checkbox. |
| error | string |  | Error message to display. When set, the checkbox enters an error state. |
| helpText | string |  | Help text displayed below the checkbox for guidance. |
| requiredMessage | string | This field is required. | Validation message shown when the field is required but empty. |
| size | object | md | The size of the checkbox. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Custom label content (overrides the label property). Rich HTML allowed — Drupal can include links in consent labels. |
| error | Custom error content (overrides the error property). |
| help-text | Custom help text content (overrides the helpText property). |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when the checkbox is toggled. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-checkbox-size | var(--hx-size-5, 1.25rem) | Checkbox dimensions. |
| --hx-checkbox-bg | var(--hx-color-neutral-0, #ffffff) | Unchecked background color. |
| --hx-checkbox-border-color | var(--hx-color-neutral-300, #ced4da) | Checkbox border color. |
| --hx-checkbox-border-radius | var(--hx-border-radius-sm, 0.25rem) | Checkbox border radius. |
| --hx-checkbox-checked-bg | var(--hx-color-primary-500, #2563EB) | Checked background color. |
| --hx-checkbox-checked-border-color | var(--hx-color-primary-500, #2563EB) | Checked border color. |
| --hx-checkbox-checkmark-color | var(--hx-color-neutral-0, #ffffff) | Checkmark color. |
| --hx-checkbox-focus-ring-color | var(--hx-focus-ring-color, #2563EB) | Focus ring color. |
| --hx-checkbox-label-color | var(--hx-color-neutral-700, #343a40) | Label text color. |
| --hx-checkbox-help-text-color | var(--hx-color-neutral-500, #6c757d) | Help text color. |
| --hx-checkbox-hover-border-color | var(--hx-checkbox-border-color) | Border color on hover. |
| --hx-checkbox-error-color | var(--hx-color-error-500, #dc3545) | Error state color. |

## CSS Parts

| Part | Description |
|------|-------------|
| checkbox | The visual checkbox element. |
| checkmark | The SVG checkmark icon inside the checkbox. |
| label | The label element. |
| help-text | The help text container. |
| error | The error message container. |
| control | The wrapper around checkbox and label. |
