# HX Text Input

A text input component with label, validation, and form association.
Supports accessible labeling via `label` property, `aria-label` attribute, or the `label` slot.
Uses `aria-invalid` and `aria-describedby` on the native input for screen reader support. Native `required` provides implicit aria-required mapping per HTML-AAM.
Error messages are announced via `role="alert"`. Keyboard navigation follows native input behavior.

## Usage

```twig
{% include 'helix:hx-text-input' with {
  label: '',
  placeholder: '',
  value: '',
  type: 'text',
  required: false,
  disabled: false,
  error: '',
  helpText: '',
  name: '',
  ariaLabel: 'null',
  readonly: false,
  minlength: 'undefined',
  maxlength: 'undefined',
  pattern: '',
  autocomplete: '',
  requiredMessage: 'This field is required.',
  size: 'md',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | The visible label text for the input. |
| placeholder | string |  | Placeholder text shown when the input is empty. |
| value | string |  | The current value of the input. |
| type | object | text | The type of the native input element. |
| required | boolean | false | Whether the input is required for form submission. |
| disabled | boolean | false | Whether the input is disabled. |
| error | string |  | Error message to display. When set, the input enters an error state. |
| helpText | string |  | Help text displayed below the input for guidance. |
| name | string |  | The name of the input, used for form submission. |
| ariaLabel | object | null | Accessible name for screen readers, if different from the visible label. |
| readonly | boolean | false | Whether the input is read-only. |
| minlength | object | undefined | Minimum number of characters allowed. |
| maxlength | object | undefined | Maximum number of characters allowed. |
| pattern | string |  | A regular expression pattern the value must match for form validation. |
| autocomplete | string |  | Hint for the browser's autocomplete feature. Accepts standard HTML autocomplete values. |
| requiredMessage | string | This field is required. | Validation message shown when the field is required but empty. |
| size | object | md | Visual size of the input field. |

## Slots

| Slot | Description |
|------|-------------|
| label | Custom label content (overrides the label property). Use for Drupal Form API rendered labels. |
| prefix | Content rendered before the input (e.g., icon). |
| suffix | Content rendered after the input (e.g., icon or button). |
| help-text | Custom help text content (overrides the helpText property). |
| error | Custom error content (overrides the error property). Use for Drupal Form API rendered errors. |

## Events

| Event | Description |
|-------|-------------|
| hx-input | Dispatched on every keystroke as the user types. |
| hx-change | Dispatched when the input loses focus after its value changed. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-input-bg | var(--hx-color-neutral-0) | Input background color. |
| --hx-input-color | var(--hx-color-neutral-800) | Input text color. |
| --hx-input-border-color | var(--hx-color-neutral-300) | Input border color. |
| --hx-input-border-radius | var(--hx-border-radius-md) | Input border radius. |
| --hx-input-font-family | var(--hx-font-family-sans) | Input font family. |
| --hx-input-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-input-error-color | var(--hx-color-error-500) | Error state color. |
| --hx-input-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-input-sm-font-size | 0.875rem | Font size for the sm size variant. |
| --hx-input-lg-font-size | 1.125rem | Font size for the lg size variant. |

## CSS Parts

| Part | Description |
|------|-------------|
| field | The outer field container. |
| label | The label element. |
| input-wrapper | The wrapper around prefix, input, and suffix. |
| input | The native input element. |
| help-text | The help text container. |
| error | The error message container. |
