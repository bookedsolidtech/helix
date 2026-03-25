# HX Time Picker

A time-picker component with a combobox pattern: a text input with format
masking and a dropdown listbox of pre-generated time slots.

## Usage

```twig
{% include 'helix:hx-time-picker' with {
  name: '',
  value: '',
  min: '00:00',
  max: '23:59',
  step: 30,
  label: '',
  required: false,
  disabled: false,
  error: '',
  format: '12h',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | The name submitted with the form. Value is always HH:MM (24-hour). |
| value | string |  | The current value in HH:MM (24-hour) format. |
| min | string | 00:00 | The earliest selectable time in HH:MM format. |
| max | string | 23:59 | The latest selectable time in HH:MM format. |
| step | number | 30 | Step interval between dropdown options, in minutes. Defaults to 30. |
| label | string |  | The visible label text for the field. |
| required | boolean | false | Whether the field is required for form submission. |
| disabled | boolean | false | Whether the field is disabled. |
| error | string |  | Error message to display. When set, the field enters an error state. |
| format | object | 12h | Display format for the time input. '12h' shows AM/PM; '24h' is bare HH:MM. |

## Slots

| Slot | Description |
|------|-------------|
| label | Custom label content; overrides the rendered label element when used. |
| help-text | Help text displayed below the field. |
| error | Custom error content; overrides the `error` property. |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when the selected time changes. Detail value is HH:MM (24h). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-time-picker-bg | var(--hx-color-neutral-0) | Input background color. |
| --hx-time-picker-color | var(--hx-color-neutral-800) | Input text color. |
| --hx-time-picker-border-color | var(--hx-color-neutral-300) | Border color. |
| --hx-time-picker-border-radius | var(--hx-border-radius-md) | Border radius. |
| --hx-time-picker-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-time-picker-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-time-picker-error-color | var(--hx-color-error-500) | Error state color. |
| --hx-time-picker-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-time-picker-chevron-color | var(--hx-color-neutral-500) | Toggle chevron color. |
| --hx-time-picker-listbox-bg | var(--hx-color-neutral-0) | Listbox background. |
| --hx-time-picker-listbox-max-height | 16rem | Maximum height of the dropdown. |
| --hx-time-picker-listbox-shadow | 0 4px 16px color-mix(in srgb, var(--hx-color-neutral-900) 12%, transparent) | Box shadow for the dropdown listbox. |
| --hx-time-picker-option-color | var(--hx-color-neutral-800) | Option text color. |
| --hx-time-picker-option-hover-bg | var(--hx-color-primary-50) | Option hover background. |
| --hx-time-picker-option-hover-color | var(--hx-color-primary-700) | Option hover text color. |
| --hx-time-picker-option-selected-bg | var(--hx-color-primary-100) | Selected option background. |
| --hx-time-picker-option-selected-color | var(--hx-color-primary-800) | Selected option text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| label | The label element. |
| input | The text input element. |
| toggle | The clock icon toggle button. |
| listbox | The dropdown `<ul>` element. |
| option | Each `<li>` option in the listbox. |
