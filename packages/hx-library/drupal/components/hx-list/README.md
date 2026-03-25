# HX List

A styled list container supporting plain, bulleted, numbered, description, and interactive variants.

## Usage

```twig
{% include 'helix:hx-list' with {
  variant: 'plain',
  divided: false,
  label: 'undefined',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | plain | Visual variant of the list. |
| divided | boolean | false | Whether to show dividers between list items. |
| label | object | undefined | Accessible label for the list. Required when variant is "interactive" (listbox role). |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for `hx-list-item` elements. |

## Events

| Event | Description |
|-------|-------------|
| hx-select | Dispatched when an item is clicked in interactive mode. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-list-gap | 0 | Gap between list items. |
| --hx-list-divider-color | var(--hx-color-neutral-200) | Divider line color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root list element. |
