# HX Menu Item

A single interactive item for use inside `hx-menu`. Supports normal, checkbox,
and radio types, loading state, prefix/suffix slots, and submenu nesting.
Use `aria-label` on the parent `hx-menu` to provide an accessible name.

## Usage

```twig
{% include 'helix:hx-menu-item' with {
  value: '',
  disabled: false,
  checked: false,
  type: 'normal',
  loading: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string |  | The value associated with this item, emitted in the hx-select event. |
| disabled | boolean | false | Whether the item is disabled. Prevents interaction and event dispatch. |
| checked | boolean | false | Whether the item is checked. Only meaningful when type="checkbox". |
| type | object | normal | The type of menu item. "checkbox" renders a checkmark and toggles checked state.
"radio" renders a checkmark and emits selection for radio-group behavior. |
| loading | boolean | false | Whether the item is in a loading state. Shows a spinner and prevents interaction. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the item label. |
| prefix | Icon or content rendered before the label. |
| suffix | Shortcut text or icon rendered after the label. |
| submenu | A nested hx-menu for submenu content. |

## Events

| Event | Description |
|-------|-------------|
| hx-item-select | Dispatched when the item is activated via click, Enter, or Space. |
| hx-item-submenu-open | Dispatched when ArrowRight is pressed on an item with a submenu. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-menu-item-color | var(--hx-color-neutral-900) | Item text color. |
| --hx-menu-item-hover-bg | var(--hx-color-neutral-100) | Item hover/focus background. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root item element. |
| prefix | Prefix slot wrapper. |
| label | Label slot wrapper. |
| suffix | Suffix slot wrapper. |
| submenu-icon | The chevron icon indicating a submenu. |
| checked-icon | The checkmark icon for checkbox-type items. |
