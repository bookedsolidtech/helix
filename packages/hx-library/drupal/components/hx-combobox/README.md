# HX Combobox

A form-associated combobox component combining a text input with a listbox
for autocomplete and typeahead. Supports filtering, free-text entry,
keyboard navigation, and async option loading.

## Usage

```twig
{% include 'helix:hx-combobox' with {
  label: '',
  placeholder: '',
  value: '',
  required: false,
  disabled: false,
  name: '',
  error: '',
  helpText: '',
  size: 'md',
  multiple: false,
  clearable: false,
  loading: false,
  filterDebounce: 0,
  ariaLabel: 'null',
  labelNoOptions: 'No options found',
  labelRequired: 'Please select an option.',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | The visible label text for the combobox. |
| placeholder | string |  | Placeholder text shown in the input when no value is entered. |
| value | string |  | The current value of the combobox. |
| required | boolean | false | Whether the combobox is required for form submission. |
| disabled | boolean | false | Whether the combobox is disabled. |
| name | string |  | The name used for form submission. |
| error | string |  | Error message to display. When set, the field enters an error state. |
| helpText | string |  | Help text displayed below the combobox for guidance. |
| size | object | md | Size variant of the combobox. |
| multiple | boolean | false | Whether multiple options can be selected. |
| clearable | boolean | false | Whether the combobox shows a clear button when a value is set. |
| loading | boolean | false | Whether the combobox is in a loading state (shows spinner). |
| filterDebounce | number | 0 | Debounce delay in milliseconds for the filter input event. |
| ariaLabel | object | null | Accessible name for screen readers, if different from the visible label. |
| labelNoOptions | string | No options found | Text shown when no options match the current filter. |
| labelRequired | string | Please select an option. | Validation message shown when the field is required but empty. |

## Slots

| Slot | Description |
|------|-------------|
| option | Slot for `<option>` elements that populate the listbox. |
| prefix | Content to display before the text input. |
| suffix | Content to display after the text input. |
| empty-label | Content shown when no options match the filter. |
| label | Custom label content (overrides the label property). |
| error | Custom error content (overrides the error property). |
| help-text | Custom help text content (overrides the helpText property). |

## Events

| Event | Description |
|-------|-------------|
| hx-show | Dispatched when the listbox opens. |
| hx-hide | Dispatched when the listbox closes. |
| hx-input | Dispatched on each keystroke as the user types. |
| hx-clear | Dispatched when the clear button is activated. |
| hx-change | Dispatched when an option is selected. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-combobox-bg | var(--hx-color-neutral-0) | Input background color. |
| --hx-combobox-color | var(--hx-color-neutral-800) | Input text color. |
| --hx-combobox-border-color | var(--hx-color-neutral-300) | Border color. |
| --hx-combobox-border-radius | var(--hx-border-radius-md) | Border radius. |
| --hx-combobox-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-combobox-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-combobox-error-color | var(--hx-color-error-500) | Error state color. |
| --hx-combobox-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-combobox-listbox-bg | var(--hx-color-neutral-0) | Listbox background color. |
| --hx-combobox-option-hover-bg | var(--hx-color-primary-50) | Option hover background. |
| --hx-combobox-option-selected-bg | var(--hx-color-primary-100) | Selected option background. |

## CSS Parts

| Part | Description |
|------|-------------|
| input | The native text input element. |
| listbox | The dropdown panel containing options. |
| trigger | The input wrapper element acting as the combobox trigger. |
| clear-button | The button that clears the current value. |
| loading-indicator | The loading spinner shown during async operations. |
