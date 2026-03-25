# HX Tag

A compact label for categorization, filtering, and selection.

## Usage

```twig
{% include 'helix:hx-tag' with {
  variant: 'default',
  size: 'md',
  pill: false,
  removable: false,
  disabled: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | default | Visual style variant of the tag. |
| size | object | md | Size of the tag. |
| pill | boolean | false | Whether the tag uses fully rounded (pill) styling. |
| removable | boolean | false | Whether the tag renders a dismiss button. |
| disabled | boolean | false | Whether the tag is disabled. When disabled, interactions are suppressed. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for tag label text. |
| prefix | Icon or avatar rendered before the label. |
| suffix | Content rendered after the label. |

## Events

| Event | Description |
|-------|-------------|
| hx-remove | Dispatched when the user clicks the remove button. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-tag-bg | var(--hx-color-neutral-100) | Tag background color. |
| --hx-tag-color | var(--hx-color-neutral-700) | Tag text color. |
| --hx-tag-border-color | var(--hx-color-neutral-200) | Tag border color. |
| --hx-tag-font-size | - | Tag font size (set per size variant). |
| --hx-tag-font-weight | var(--hx-font-weight-medium) | Tag font weight. |
| --hx-tag-font-family | var(--hx-font-family-sans) | Tag font family. |
| --hx-tag-border-radius | var(--hx-border-radius-sm) | Tag border radius (non-pill mode). |
| --hx-tag-border-radius-pill | var(--hx-border-radius-full) | Border radius in pill mode. Independent of --hx-tag-border-radius so consumer overrides don't break pill shape. |
| --hx-tag-padding-x | - | Tag horizontal padding (set per size variant). |
| --hx-tag-padding-y | - | Tag vertical padding (set per size variant). |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root tag element. |
| prefix | The prefix slot wrapper. |
| label | The label slot wrapper. |
| suffix | The suffix slot wrapper. |
| remove-button | The remove/dismiss button. |
