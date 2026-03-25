# HX Select

A form-associated select component with custom styling, label, error, and
help text. Options are provided via slotted `<option>` (and `<optgroup>`)
elements in the light DOM. The component wraps a hidden native `<select>`
for form participation and provides a combobox trigger for consistent
cross-browser styling.

## Usage

```twig
{% include 'helix:hx-select' with {
  label: '',
  placeholder: '',
  value: '',
  required: false,
  disabled: false,
  name: '',
  error: '',
  helpText: '',
  size: 'md',
  ariaLabel: 'null',
  open: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | The visible label text for the select. |
| placeholder | string |  | Placeholder text shown in the trigger when no option is selected. |
| value | string |  | The current value of the select. |
| required | boolean | false | Whether the select is required for form submission. |
| disabled | boolean | false | Whether the select is disabled. |
| name | string |  | The name used for form submission. |
| error | string |  | Error message to display. When set, the field enters an error state. |
| helpText | string |  | Help text displayed below the select for guidance. |
| size | object | md | Size variant of the select trigger. |
| ariaLabel | object | null | Accessible name for screen readers, if different from the visible label. |
| open | boolean | false | Controls whether the dropdown listbox is open. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for `<option>` and `<optgroup>` elements. |
| label | Custom label content (overrides the label property). |
| error | Custom error content (overrides the error property). |
| help-text | Custom help text content (overrides the helpText property). |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when the selected option changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-select-bg | var(--hx-color-neutral-0) | Select background color. |
| --hx-select-color | var(--hx-color-neutral-800) | Select text color. |
| --hx-select-border-color | var(--hx-color-neutral-300) | Select border color. |
| --hx-select-border-radius | var(--hx-border-radius-md) | Select border radius. |
| --hx-select-font-family | var(--hx-font-family-sans) | Select font family. |
| --hx-select-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-select-error-color | var(--hx-color-error-500) | Error state color. |
| --hx-select-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-select-chevron-color | var(--hx-color-neutral-500) | Chevron indicator color. |
| --hx-select-listbox-bg | var(--hx-color-neutral-0) | Listbox panel background color. |
| --hx-select-option-hover-bg | var(--hx-color-primary-50) | Option hover background color. |
| --hx-select-option-selected-bg | var(--hx-color-primary-100) | Selected option background color. |
| --hx-select-placeholder-color | var(--hx-color-neutral-400) | Placeholder text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| field | The outer field container. |
| label | The label element. |
| select-wrapper | The wrapper containing the trigger and listbox. |
| select | The hidden native select element (kept for form participation). |
| trigger | The button that opens/closes the dropdown. |
| listbox | The dropdown panel containing options. |
| option | Individual option items in the listbox. |
| help-text | The help text container. |
| error | The error message container. |
