# HX List Item

A rich list item for use inside `hx-list`.

## Usage

```twig
{% include 'helix:hx-list-item' with {
  disabled: false,
  selected: false,
  href: 'undefined',
  value: 'undefined',
  interactive: false,
  type: 'default',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| disabled | boolean | false | Whether the item is disabled. Prevents interaction. |
| selected | boolean | false | Whether the item is selected (used in interactive mode). |
| href | object | undefined | When set, renders the item as a link (only in non-interactive variants). |
| value | object | undefined | The value associated with this item (used with hx-select). |
| interactive | boolean | false | Set by the parent hx-list to indicate this item is part of an interactive listbox.
Controls CSS styling and ARIA role via host attributes. |
| type | object | default | Item type for description list variant. Use 'term' for <dt> and 'definition' for <dd>. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the item label text. |
| prefix | Icon, avatar, or content rendered before the label. |
| suffix | Icon, badge, or text rendered after the label. |
| description | Secondary descriptive text rendered below the label. |

## Events

| Event | Description |
|-------|-------------|
| hx-list-item-click | Dispatched when the item is clicked and not disabled. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-list-item-padding | var(--hx-space-3) | Item padding. |
| --hx-list-item-color | var(--hx-color-neutral-900) | Item text color. |
| --hx-list-item-bg-hover | var(--hx-color-neutral-50) | Item hover background. |
| --hx-list-item-bg-selected | var(--hx-color-primary-50) | Selected item background. |
| --hx-list-item-color-selected | var(--hx-color-primary-700) | Selected item text color. |
| --hx-list-item-description-color | var(--hx-color-neutral-500) | Description text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root item element (li, dt, dd, or wrapper). |
| prefix | The prefix slot container. |
| label | The label slot container. |
| description | The description slot container. |
| suffix | The suffix slot container. |
