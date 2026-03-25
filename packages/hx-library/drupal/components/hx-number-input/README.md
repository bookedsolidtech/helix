# HX Number Input

A numeric input component with stepper controls, label, validation, and
full form association. Designed for healthcare data-entry contexts where
precise numeric values (dosage, age, measurements) must be captured safely.

## Usage

```twig
{% include 'helix:hx-number-input' with {
  name: '',
  value: 'null',
  required: false,
  disabled: false,
  readonly: false,
  min: 'undefined',
  max: 'undefined',
  step: 1,
  label: '',
  error: '',
  helpText: '',
  size: 'md',
  noStepper: false,
  labelIncrement: 'Increment',
  labelDecrement: 'Decrement',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | The name of the input, used for form submission. |
| value | object | null | The current numeric value of the input. Null when the field is empty. |
| required | boolean | false | Whether the input is required for form submission. |
| disabled | boolean | false | Whether the input is disabled. |
| readonly | boolean | false | Whether the input is read-only. |
| min | object | undefined | Minimum allowed value. When reached, the decrement button is disabled. |
| max | object | undefined | Maximum allowed value. When reached, the increment button is disabled. |
| step | number | 1 | The amount to increment or decrement on each step action. |
| label | string |  | The visible label text for the input. |
| error | string |  | Error message to display. When set, the input enters an error state. |
| helpText | string |  | Help text displayed below the input for guidance. |
| size | object | md | Size variant controlling input padding and font size. |
| noStepper | boolean | false | When set, hides the +/- stepper buttons. |
| labelIncrement | string | Increment | Accessible label for the increment button. |
| labelDecrement | string | Decrement | Accessible label for the decrement button. |

## Slots

| Slot | Description |
|------|-------------|
| label | Custom label content (overrides the label property). Use for Drupal Form API rendered labels. |
| help-text | Custom help text content (overrides the helpText property). |
| error | Custom error content (overrides the error property). Use for Drupal Form API rendered errors. |
| prefix | Content rendered before the input (e.g., a unit icon). |
| suffix | Content rendered after the input and before the stepper buttons (e.g., a unit label). |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Dispatched when the input loses focus after its value changed. |
| hx-input | Dispatched on every keystroke as the user types. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-number-input-bg | var(--hx-color-neutral-0) | Input background color. |
| --hx-number-input-color | var(--hx-color-neutral-800) | Input text color. |
| --hx-number-input-border-color | var(--hx-color-neutral-300) | Input border color. |
| --hx-number-input-border-radius | var(--hx-border-radius-md) | Input border radius. |
| --hx-number-input-error-color | var(--hx-color-error-500) | Error state color. |
| --hx-number-input-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-number-input-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-number-input-font-family | var(--hx-font-family-sans) | Font family. |

## CSS Parts

| Part | Description |
|------|-------------|
| field | The outer field container. |
| label | The label element. |
| input-wrapper | The wrapper around prefix, input, suffix, and stepper. |
| input | The native input element. |
| help-text | The help text container. |
| error-message | The error message container. |
| stepper | The stepper button group container. |
| increment | The increment (+) button. |
| decrement | The decrement (-) button. |
