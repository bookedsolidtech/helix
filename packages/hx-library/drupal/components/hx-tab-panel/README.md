# HX Tab Panel

A content panel associated with an `<hx-tab>`, managed by a parent `<hx-tabs>`.

## Usage

```twig
{% include 'helix:hx-tab-panel' with {
  name: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | The name that corresponds to the `panel` attribute on the associated `<hx-tab>`. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for panel content. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-tabs-panel-padding | var(--hx-space-4, 1rem) | Panel inner padding. |
| --hx-tabs-panel-color | var(--hx-color-neutral-700, #343a40) | Panel text color. |
| --hx-tabs-focus-ring-color | var(--hx-focus-ring-color, #2563eb) | Focus ring color. |

## CSS Parts

| Part | Description |
|------|-------------|
| panel | The panel content wrapper. |
