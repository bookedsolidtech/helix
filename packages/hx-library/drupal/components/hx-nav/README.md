# HX Nav

Primary and secondary navigation component.
Supports horizontal menu bar and vertical sidebar patterns.
Mobile responsive with hamburger toggle.

## Usage

```twig
{% include 'helix:hx-nav' with {
  items: '[]',
  orientation: 'horizontal',
  label: 'Main navigation',
  labelOpenMenu: 'Open navigation menu',
  labelCloseMenu: 'Close navigation menu',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | object | [] | Navigation items array. |
| orientation | object | horizontal | Layout orientation: 'horizontal' (menu bar) or 'vertical' (sidebar). |
| label | string | Main navigation | Accessible label for the nav landmark. |
| labelOpenMenu | string | Open navigation menu | Accessible label for the navigation toggle button when menu is closed. |
| labelCloseMenu | string | Close navigation menu | Accessible label for the navigation toggle button when menu is open. |

## Events

| Event | Description |
|-------|-------------|
| hx-nav-select | Dispatched when a nav item is activated. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-nav-bg | var(--hx-color-neutral-900) | Navigation background color. |
| --hx-nav-color | var(--hx-color-neutral-100) | Navigation text color. |
| --hx-nav-font-family | var(--hx-font-family-sans) | Navigation font family. |
| --hx-nav-link-color | var(--hx-color-neutral-100) | Link text color. |
| --hx-nav-link-hover-bg | var(--hx-color-neutral-700) | Link hover background. |
| --hx-nav-link-hover-color | var(--hx-color-white) | Link hover text color. |
| --hx-nav-link-active-bg | var(--hx-color-primary-600) | Active link background. |
| --hx-nav-link-active-color | var(--hx-color-white) | Active link text color. |
| --hx-nav-submenu-bg | var(--hx-color-neutral-800) | Submenu background color. |
| --hx-nav-submenu-min-width | 12rem | Submenu minimum width. |
| --hx-nav-font-size | var(--hx-font-size-sm) | Navigation font size. |
| --hx-nav-padding | var(--hx-space-2) var(--hx-space-4) | Navigation padding. |
| --hx-nav-item-padding | var(--hx-space-2) var(--hx-space-3) | Item padding. |
| --hx-nav-border-radius | var(--hx-border-radius-sm) | Item border radius. |

## CSS Parts

| Part | Description |
|------|-------------|
| nav | The nav landmark element. |
| list | The top-level list element. |
| item | Each list item wrapper. |
| link | The anchor or button element inside each item. |
| toggle | The mobile hamburger toggle button. |
