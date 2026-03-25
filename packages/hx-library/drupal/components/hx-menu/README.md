# HX Menu

A menu container that manages keyboard navigation over a list of menu items.
Use with `hx-menu-item` and `hx-menu-divider`.

## Usage

```twig
{% include 'helix:hx-menu' with {
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | Accessible label for the menu. Rendered as `aria-label` on the inner
`role="menu"` element when set. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for hx-menu-item and hx-menu-divider elements. |

## Events

| Event | Description |
|-------|-------------|
| hx-close | Dispatched when Escape is pressed. |
| hx-select | Dispatched when an item is selected. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-menu-bg | var(--hx-color-neutral-0) | Menu background color. |
| --hx-menu-border-color | var(--hx-color-neutral-200) | Menu border color. |
| --hx-menu-border-radius | var(--hx-border-radius-md) | Menu border radius. |
| --hx-menu-shadow | - | Menu box shadow. |
| --hx-menu-min-width | 10rem | Minimum menu width. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root menu element. |
