# HX Form

A Light DOM form wrapper that styles native HTML form elements and
hx-* components with the design system's form styles.

When `action` is set, renders a `<form>` wrapper around slotted content.
When no `action` is set (the Drupal pattern), renders only a `<slot>`
so Drupal can provide its own `<form>` tag.

Uses adopted stylesheets to inject scoped CSS into the document without
Shadow DOM, keeping native form participation and Drupal compatibility.

## Usage

```twig
{% include 'helix:hx-form' with {
  action: '',
  method: 'post',
  novalidate: false,
  name: '',
  enctype: 'application/x-www-form-urlencoded',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| action | string |  | The URL to submit the form to. When empty, the form handles
submission client-side only and dispatches `hx-submit`. |
| method | object | post | The HTTP method used when submitting the form. |
| novalidate | boolean | false | When true, disables the browser's built-in constraint validation
on form submission. |
| name | string |  | Identifies the form for scripting and form discovery. |
| enctype | object | application/x-www-form-urlencoded | The encoding type for form submission. Only used when `action` is set.
Use `multipart/form-data` for forms with file uploads. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for form fields and controls. |

## Events

| Event | Description |
|-------|-------------|
| hx-submit | Dispatched on valid client-side submit when no action is set. |
| hx-invalid | Dispatched when validation fails on submit. |
| hx-reset | Dispatched when the form is reset. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-form-gap | var(--hx-space-4) | Gap between form fields. |
| --hx-form-max-width | none | Maximum width of the form. |
| --hx-form-padding | 0 | Internal padding of the form. |
