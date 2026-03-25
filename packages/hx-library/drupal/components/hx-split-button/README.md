# HX Split Button

A split button combining a primary action button with an attached dropdown
menu for secondary actions. Implements the ARIA menu button pattern for
full keyboard and screen reader support.

## Usage

```twig
{% include 'helix:hx-split-button' with {
  variant: 'primary',
  size: 'md',
  disabled: false,
  label: 'undefined',
  triggerLabel: 'More actions',
  menuLabel: 'Secondary actions',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | primary | Visual style variant of the split button. |
| size | object | md | Size of the split button. |
| disabled | boolean | false | Whether the split button is disabled. Both the primary button and the
trigger are disabled when this is true. |
| label | object | undefined | Primary button label text. When set, overrides the default slot content. |
| triggerLabel | string | More actions | Accessible label for the dropdown trigger button. Override for localization. |
| menuLabel | string | Secondary actions | Accessible label for the dropdown menu panel. Override for localization. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Primary button label text. |
| menu | `hx-menu-item` children rendered in the dropdown panel. |

## Events

| Event | Description |
|-------|-------------|
| hx-click | Dispatched when the primary button is clicked and is not disabled. |
| hx-select | Dispatched when a menu item is selected from the dropdown. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-split-button-menu-max-height | 18rem | Maximum height of the dropdown menu panel before scrolling. |
| --hx-split-button-bg | var(--hx-color-primary-500) | Background color for both buttons. |
| --hx-split-button-color | var(--hx-color-neutral-0) | Text/icon color for both buttons. |
| --hx-split-button-border-color | transparent | Border color. |
| --hx-split-button-border-radius | var(--hx-border-radius-md) | Border radius. |
| --hx-split-button-divider-color | var(--hx-color-primary-400) | Color of the divider between primary and trigger. |
| --hx-split-button-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-split-button-font-weight | var(--hx-font-weight-semibold) | Font weight. |
| --hx-split-button-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-split-button-menu-bg | var(--hx-color-neutral-0) | Dropdown menu background. |
| --hx-split-button-menu-border-color | var(--hx-color-neutral-200) | Dropdown menu border color. |
| --hx-split-button-menu-border-radius | var(--hx-border-radius-md) | Dropdown menu border radius. |
| --hx-split-button-menu-shadow | - | Dropdown menu box shadow. |

## CSS Parts

| Part | Description |
|------|-------------|
| button | The primary action button element. |
| trigger | The dropdown trigger button element. |
| menu | The dropdown menu panel. |
