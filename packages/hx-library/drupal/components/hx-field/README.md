# HX Field

Layout wrapper providing consistent label + input + help text + validation
message structure for any form control. Use this when wrapping non-HELiX
form controls or native HTML elements in the HELiX form field pattern.

This component is NOT form-associated — it is a pure visual layout wrapper.

**Light DOM side effect:** This component injects a visually-hidden `<span>`
into its light DOM children for ARIA describedby linkage across the shadow
DOM boundary. This span has `id="${fieldId}-desc"` and is removed on
`disconnectedCallback`. This is an intentional, documented accessibility
mechanism.

## Usage

```twig
{% include 'helix:hx-field' with {
  label: '',
  required: false,
  error: '',
  helpText: '',
  disabled: false,
  hxSize: 'md',
  layout: 'column',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | The visible label text for the field. |
| required | boolean | false | Whether the field is required. Shows a required indicator on the label. |
| error | string |  | Error message to display. When set, the field enters an error state. |
| helpText | string |  | Help text displayed below the control for guidance. |
| disabled | boolean | false | Visual disabled state applied via opacity. Does not affect slotted control
interactivity — set disabled on the slotted control directly. |
| hxSize | object | md | Size variant controlling label and help text font sizes. |
| layout | object | column | Layout variant. 'column' stacks label above control; 'inline' places them side-by-side. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | The form control element (native or custom). |
| label | Custom label content (overrides the label property). |
| help-text | Custom help text content (overrides the helpText property). |
| error | Custom error content (overrides the error property). |
| description | Additional descriptive content above the control. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-field-label-color | var(--hx-color-neutral-700) | Label color. |
| --hx-field-error-color | var(--hx-color-error-500) | Error color. |
| --hx-field-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-field-gap | var(--hx-space-1, 0.25rem) | Gap between field segments. |
| --hx-field-help-text-color | var(--hx-color-neutral-500) | Help text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| field | The outer field container. |
| label | The label element. |
| control | The wrapper around slotted content. |
| help-text | The help text container. |
| error-message | The error message container. |
| required-indicator | The required asterisk span. |
