# HX Dropdown

A dropdown component — a button that opens a floating panel on click.

## Usage

```twig
{% include 'helix:hx-dropdown' with {
  open: false,
  placement: 'bottom-start',
  disabled: false,
  distance: 4,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| open | boolean | false | Whether the dropdown panel is open. |
| placement | object | bottom-start | Preferred placement of the panel relative to the trigger. |
| disabled | boolean | false | Whether the dropdown is disabled. Prevents opening. |
| distance | number | 4 | Gap in pixels between the trigger and the panel. |

## Slots

| Slot | Description |
|------|-------------|
| trigger | The element that opens the dropdown (e.g. hx-button). |
| (default) | Default slot for dropdown panel content (e.g. menu items). |

## Events

| Event | Description |
|-------|-------------|
| hx-show | Dispatched when the dropdown is opened. |
| hx-hide | Dispatched when the dropdown is closed. |
| hx-select | Dispatched when a menu item is selected. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-dropdown-panel-bg | var(--hx-color-neutral-0) | Panel background color. |
| --hx-dropdown-panel-border-color | var(--hx-color-neutral-200) | Panel border color. |
| --hx-dropdown-panel-border-radius | var(--hx-border-radius-md) | Panel border radius. |
| --hx-dropdown-panel-shadow | 0 4px 16px rgba(0,0,0,0.12) | Panel box shadow. |
| --hx-dropdown-panel-z-index | 1000 | Panel z-index. |
| --hx-dropdown-panel-min-width | 160px | Panel minimum width. |

## CSS Parts

| Part | Description |
|------|-------------|
| trigger | The trigger wrapper element. |
| panel | The floating panel element. |
