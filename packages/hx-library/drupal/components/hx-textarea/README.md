# HX Textarea

A multi-line text area component with label, validation, and form association.

Uses `aria-invalid` to convey error state and `aria-describedby` to link
error/help text to the textarea. Label association is handled through
`aria-labelledby` (for slotted labels) or the standard `<label for>` pattern.
Supports `aria-label` for cases where a visible label is not present.
Validation errors are announced via `role="alert"` (assertive live region).

## Usage

```twig
{% include 'helix:hx-textarea' with {
  label: '',
  placeholder: '',
  value: '',
  required: false,
  disabled: false,
  error: '',
  helpText: '',
  name: '',
  rows: 4,
  minlength: '',
  maxlength: '',
  readonly: false,
  resize: 'vertical',
  showCount: false,
  requiredMessage: 'This field is required.',
  ariaLabel: 'null',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | The visible label text for the textarea. |
| placeholder | string |  | Placeholder text shown when the textarea is empty. |
| value | string |  | The current value of the textarea. |
| required | boolean | false | Whether the textarea is required for form submission. |
| disabled | boolean | false | Whether the textarea is disabled. |
| error | string |  | Error message to display. When set, the textarea enters an error state. |
| helpText | string |  | Help text displayed below the textarea for guidance. |
| name | string |  | The name of the textarea, used for form submission. |
| rows | number | 4 | The number of visible text rows. Must be a positive integer (minimum 1).
Invalid values are clamped to the nearest valid value. |
| minlength | object | - | Minimum number of characters required. |
| maxlength | object | - | Maximum number of characters allowed. |
| readonly | boolean | false | Whether the textarea is read-only. Read-only fields are visible but
cannot be edited by the user. Common in healthcare for displaying
non-editable patient data inline with editable fields. |
| resize | object | vertical | Controls how the textarea can be resized. Use 'auto' for auto-grow behavior. |
| showCount | boolean | false | Whether to show a character count below the textarea. |
| requiredMessage | string | This field is required. | Validation message shown when the field is required but empty. |
| ariaLabel | object | null | Accessible name for screen readers, if different from the visible label. |

## Slots

| Slot | Description |
|------|-------------|
| label | Custom label content (overrides the label property). Use for Drupal Form API rendered labels. |
| help-text | Custom help text content (overrides the helpText property). |
| error | Custom error content (overrides the error property). Use for Drupal Form API rendered errors. |

## Events

| Event | Description |
|-------|-------------|
| hx-input | Dispatched on every keystroke as the user types. |
| hx-change | Dispatched when the textarea loses focus after its value changed. |

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
| --hx-textarea-min-height | var(--hx-size-20, 5rem) | Minimum textarea height. |

## CSS Parts

| Part | Description |
|------|-------------|
| field | The outer field container. |
| label | The label element. |
| textarea-wrapper | The wrapper around the textarea. |
| textarea | The native textarea element. |
| counter | The character count display. |
| help-text | The help text container. |
| error | The error message container. |
