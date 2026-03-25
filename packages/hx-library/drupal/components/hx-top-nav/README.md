# HX Top Nav

Top-of-page site navigation bar with logo, menu items, and utility area.
Supports sticky positioning, responsive hamburger menu, and full slot-driven
content composition for Drupal and other CMS consumers.

## Usage

```twig
{% include 'helix:hx-top-nav' with {
  sticky: false,
  label: 'Site Navigation',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| sticky | boolean | false | When true, the navigation bar sticks to the top of the viewport during scroll. |
| label | string | Site Navigation | Accessible label applied to the `<nav>` element via `aria-label`. |

## Slots

| Slot | Description |
|------|-------------|
| logo | Brand area rendered on the left side. |
| (default) | Default slot for primary navigation items rendered in the center. IMPORTANT: Do NOT place a `<nav>` element in this slot — the component already renders a `<nav>` landmark internally. Use a `<div>` or bare links. |
| actions | Utility area rendered on the right side (search, user menu, etc.). |

## Events

| Event | Description |
|-------|-------------|
| hx-mobile-toggle | Dispatched when the hamburger button is toggled. Detail contains the new open state. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-top-nav-bg | var(--hx-color-neutral-0) | Navigation bar background color. |
| --hx-top-nav-color | var(--hx-color-neutral-800) | Navigation bar text color. |
| --hx-top-nav-border-color | var(--hx-color-neutral-200) | Bottom border color. |
| --hx-top-nav-height | var(--hx-space-16) | Navigation bar height. |
| --hx-top-nav-padding-x | var(--hx-space-6) | Horizontal padding. |
| --hx-top-nav-z-index | var(--hx-z-index-sticky) | Z-index for sticky mode. |
| --hx-top-nav-toggle-color | var(--hx-color-neutral-700) | Hamburger icon color. |

## CSS Parts

| Part | Description |
|------|-------------|
| header | The outer `<header>` landmark element. |
| nav | The `<nav>` element inside the header. |
| logo | The logo slot container. |
| menu | The primary navigation slot container. |
| actions | The actions slot container. |
| mobile-toggle | The hamburger toggle button. |
