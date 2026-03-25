# HX Field Label

Standardized label for form fields. Used as a consistent sub-component
for hx-field and other form field components.

## Label Association

**For inputs in light DOM (the typical consumer deployment):** Use
`aria-labelledby` pointing to the host element's `id`. The `for` attribute
renders a native `<label for="...">` inside shadow DOM, but the HTML spec
scopes `for`/`id` lookup to the same tree — a shadow-DOM label cannot
associate with a light-DOM input. Example:

```html
<hx-field-label id="label-email">Email</hx-field-label>
<input id="email" aria-labelledby="label-email" />
```

**For inputs in the same shadow root:** The `for` attribute works as
expected for direct label association.

When `for` is unset, renders a `<span>` that can be referenced via
`aria-labelledby` for labeling controls across the shadow DOM boundary.

## Usage

```twig
{% include 'helix:hx-field-label' with {
  for: '',
  required: false,
  optional: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| for | string |  | The ID of the associated form control. When set, renders a native
`<label for="...">` element for direct label association. |
| required | boolean | false | Whether the associated field is required. Shows a required indicator (*). |
| optional | boolean | false | Whether the associated field is optional. Shows "(optional)" text. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Label text content. |
| required-indicator | Custom required marker (defaults to "*"). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-field-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-field-label-required-color | var(--hx-color-danger, var(--hx-color-error-text, #b91c1c)) | Required indicator color. |
| --hx-font-label-size | var(--hx-font-size-sm) | Label font size. |
| --hx-font-label-weight | var(--hx-font-weight-medium) | Label font weight. |
| --hx-font-label-line-height | var(--hx-line-height-normal) | Label line height. |
| --hx-font-label-family | var(--hx-font-family-sans) | Label font family. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The label or span element. |
| required-indicator | The required indicator wrapper. |
| optional-indicator | The optional text indicator. |
