# HX Overflow Menu

An overflow menu (kebab/meatball menu) that reveals hidden actions via a
floating panel. Composed from a trigger button and a slotted menu panel.

## Usage

```twig
{% include 'helix:hx-overflow-menu' with {
  placement: 'bottom-end',
  size: 'md',
  disabled: false,
  icon: 'vertical',
  label: 'More actions',
  menuLabel: 'Actions',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| placement | object | bottom-end | Preferred placement of the floating panel relative to the trigger. |
| size | object | md | Size of the trigger button. |
| disabled | boolean | false | Whether the trigger button is disabled. |
| icon | object | vertical | Icon orientation: vertical (kebab ⋮) or horizontal (meatball ···). |
| label | string | More actions | Accessible label for the trigger button. |
| menuLabel | string | Actions | Accessible label for the menu panel. Reflected as `menu-label`. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Menu items (e.g. `<button role="menuitem">` or `<hx-menu-item>` elements). |

## Events

| Event | Description |
|-------|-------------|
| hx-show | Dispatched when the panel opens. |
| hx-hide | Dispatched when the panel closes. |
| hx-select | Dispatched when a menu item is selected. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-overflow-menu-panel-bg | var(--hx-color-neutral-0,#fff) | Panel background color. |
| --hx-overflow-menu-panel-border | 1px solid var(--hx-color-neutral-200,#e5e7eb) | Panel border. |
| --hx-overflow-menu-panel-border-radius | var(--hx-border-radius-md) | Panel border radius. |
| --hx-overflow-menu-panel-shadow | 0 4px 16px rgba(0,0,0,0.12) | Panel box shadow. |
| --hx-overflow-menu-panel-min-width | 160px | Minimum panel width. |
| --hx-overflow-menu-panel-z-index | 1000 | Panel z-index. |
| --hx-overflow-menu-button-color | var(--hx-color-neutral-600) | Trigger icon color. |

## CSS Parts

| Part | Description |
|------|-------------|
| button | The trigger icon button element. |
| trigger | Alias for button — the trigger icon button element. |
| panel | The floating menu panel container. |
| menu | Alias for panel — the floating menu panel container. |
