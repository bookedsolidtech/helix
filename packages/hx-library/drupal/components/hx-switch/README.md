# HX Switch

A toggle switch component for on/off states.

Uses `role="switch"` with `aria-checked` to convey toggle state.
Supports keyboard activation via Space key (per ARIA APG switch pattern).
Label association is handled through `aria-labelledby`, and
error/help text are linked via `aria-describedby`.

## Usage

```twig
{% include 'helix:hx-switch' with {
  checked: false,
  disabled: false,
  required: false,
  name: '',
  value: 'on',
  label: '',
  size: 'md',
  error: '',
  helpText: '',
  requiredMessage: 'This field is required.',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | boolean | false | Whether the switch is toggled on. |
| disabled | boolean | false | Whether the switch is disabled. |
| required | boolean | false | Whether the switch is required for form submission. |
| name | string |  | The name of the switch, used for form submission. |
| value | string | on | The value submitted when the switch is checked. |
| label | string |  | The visible label text for the switch. |
| size | object | md | Size variant of the switch. |
| error | string |  | Error message to display. When set, the switch enters an error state. |
| helpText | string |  | Help text displayed below the switch for guidance. |
| requiredMessage | string | This field is required. | Validation message shown when the field is required but empty. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Custom label content (overrides the label property). |
| error | Custom error content (overrides the error property). |
| help-text | Custom help text content (overrides the helpText property). |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when the switch is toggled. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-switch-track-bg | var(--hx-color-neutral-300) | Track background color. |
| --hx-switch-track-checked-bg | var(--hx-color-primary-500) | Track background when checked. |
| --hx-switch-thumb-bg | var(--hx-color-neutral-0) | Thumb background color. |
| --hx-switch-thumb-shadow | var(--hx-shadow-sm) | Thumb box shadow. |
| --hx-switch-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-switch-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-switch-error-color | var(--hx-color-error-500) | Error message color. |
| --hx-switch-help-text-color | var(--hx-color-neutral-500) | Help text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| switch | The switch container (track + thumb wrapper). |
| track | The track background element. |
| thumb | The sliding thumb element. |
| label | The label text element. |
| help-text | The help text container. |
| error | The error message container. |
