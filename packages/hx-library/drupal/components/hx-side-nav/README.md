# HX Side Nav

A collapsible left-side navigation panel with nested menu item support.
Designed for clinical portals, admin dashboards, and department navigation.

## Usage

```twig
{% include 'helix:hx-side-nav' with {
  collapsed: false,
  label: 'Main Navigation',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| collapsed | boolean | false | When true, the nav collapses to show icons only. |
| label | string | Main Navigation | The accessible label for the nav landmark. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for hx-nav-item children. |
| header | Logo or branding content. |
| footer | User profile or settings content. |

## Events

| Event | Description |
|-------|-------------|
| hx-collapse | Dispatched when the nav collapses to icon-only mode. |
| hx-expand | Dispatched when the nav expands to full width. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-side-nav-width | 16rem | Full expanded width. |
| --hx-side-nav-collapsed-width | 3.5rem | Collapsed icon-only width. |
| --hx-side-nav-bg | var(--hx-color-neutral-900) | Background color. |
| --hx-side-nav-color | var(--hx-color-neutral-100) | Text color. |
| --hx-side-nav-border-color | var(--hx-color-neutral-700) | Border color. |
| --hx-side-nav-header-padding | var(--hx-space-4) | Header padding. |
| --hx-side-nav-footer-padding | var(--hx-space-4) | Footer padding. |
| --hx-side-nav-toggle-color | var(--hx-color-neutral-400) | Toggle button icon color. |

## CSS Parts

| Part | Description |
|------|-------------|
| nav | The outer nav element. |
| header | The header section. |
| body | The scrollable body section. |
| footer | The footer section. |
| toggle | The collapse/expand toggle button. |
