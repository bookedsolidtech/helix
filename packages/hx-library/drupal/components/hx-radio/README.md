# HX Radio

An individual radio button, designed to be used inside a `<hx-radio-group>`.

## Usage

```twig
{% include 'helix:hx-radio' with {
  value: '',
  label: '',
  disabled: false,
  checked: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string |  | The value this radio represents. |
| label | string |  | Visible label text for the radio. |
| disabled | boolean | false | Whether this radio is disabled. |
| checked | boolean | false | Whether this radio is checked. Managed by the parent group. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Custom label content (overrides the label property). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-radio-size | var(--hx-size-5, 1.25rem) | Radio circle size. |
| --hx-radio-border-color | var(--hx-color-neutral-300, #ced4da) | Radio border color. |
| --hx-radio-checked-bg | var(--hx-color-primary-500, #2563EB) | Checked background color. |
| --hx-radio-checked-border-color | var(--hx-color-primary-500, #2563EB) | Checked border color. |
| --hx-radio-dot-color | var(--hx-color-neutral-0, #ffffff) | Inner dot color when checked. |
| --hx-radio-focus-ring-color | var(--hx-focus-ring-color, #2563EB) | Focus ring color. |
| --hx-radio-label-color | var(--hx-color-neutral-700, #343a40) | Label text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| radio | The visual radio circle. |
| label | The label text. |
