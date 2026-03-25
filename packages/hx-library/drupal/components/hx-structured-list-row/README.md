# HX Structured List Row

A single row within an `hx-structured-list`. Renders a label/value pair
with an optional actions area.

## Usage

```twig
{% include 'helix:hx-structured-list-row' with {
} %}
```

## Slots

| Slot | Description |
|------|-------------|
| label | The term or key label (`<dt>` semantics). |
| (default) | The value or definition (`<dd>` semantics). |
| actions | Optional action controls (edit button, etc.). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-structured-list-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-structured-list-value-color | var(--hx-color-neutral-900) | Value text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root row element. |
| label | The label (`dt`) cell. |
| value | The value (`dd`) cell. |
| actions | The actions cell. |
