# HX Tree Item

A tree item used within an hx-tree-view component.
Supports expand/collapse, selection, keyboard navigation, and icon/children slots.

## Usage

```twig
{% include 'helix:hx-tree-item' with {
  expanded: false,
  selected: false,
  disabled: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| expanded | boolean | false | Whether the item is expanded (showing children). |
| selected | boolean | false | Whether the item is selected. |
| disabled | boolean | false | Whether the item is disabled (non-interactive). |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the item label content. This text is also used to label the children group. |
| icon | Custom icon shown before the label. |
| children | Nested hx-tree-item elements for sub-tree. |

## Events

| Event | Description |
|-------|-------------|
| hx-tree-item-select | Dispatched when this item is clicked or activated via keyboard. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-tree-item-color | var(--hx-color-neutral-900) | Item text color. |
| --hx-tree-item-hover-bg | var(--hx-color-neutral-100) | Hover background color. |
| --hx-tree-item-selected-bg | var(--hx-color-primary-100) | Selected background color. |
| --hx-tree-item-selected-color | var(--hx-color-primary-800) | Selected text color. |
| --hx-tree-item-padding-x | var(--hx-space-2) | Horizontal padding. |
| --hx-tree-item-padding-y | var(--hx-space-1) | Vertical padding. |
| --hx-tree-indent-size | 1.5rem | Indentation size per level. |

## CSS Parts

| Part | Description |
|------|-------------|
| item | The outer item container. |
| row | The interactive item row (contains expand icon, icon slot, and label). |
| expand-icon | The expand/collapse toggle button. |
| label | The label text content area. |
| children | The children container. |
