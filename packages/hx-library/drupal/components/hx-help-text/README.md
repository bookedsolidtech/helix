# HX Help Text

Standardized help/hint text displayed below form fields.
Used by hx-field as a consistent sub-component for guidance and validation messages.

Non-default variants render an inline icon alongside the text to satisfy
WCAG 1.4.1 (color is not the sole visual indicator). The `error` variant
uses `role="alert"` for immediate screen-reader announcement; `warning`
and `success` use `aria-live="polite"` for non-intrusive announcements.

## Usage

```twig
{% include 'helix:hx-help-text' with {
  variant: 'default',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | default | Visual variant that determines the text color and icon.
Use `error` for validation errors, `warning` for cautions, `success` for confirmation. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | The help text content. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-help-text-color | var(--hx-color-neutral-500) | Text color. |
| --hx-help-text-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-help-text-font-size | var(--hx-font-size-sm) | Font size. |
| --hx-help-text-font-weight | var(--hx-font-weight-normal) | Font weight. |
| --hx-help-text-line-height | var(--hx-line-height-normal) | Line height. |
| --hx-help-text-icon-gap | 0.375rem | Gap between icon and text. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root element of the help text. |
| icon | The icon wrapper (only rendered for non-default variants). |
| text | The text wrapper around the default slot. |
