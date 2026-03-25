# HX Nav Item

A navigation item for use inside hx-side-nav.
Supports icons, badges, sub-navigation, and active/disabled states.

## Usage

```twig
{% include 'helix:hx-nav-item' with {
  href: '',
  active: false,
  expanded: false,
  disabled: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| href | string |  | The URL this nav item links to. |
| active | boolean | false | Whether this item is the current/active page. |
| expanded | boolean | false | Whether the sub-navigation is expanded. |
| disabled | boolean | false | Whether this nav item is disabled. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for item label text. |
| icon | Icon to display before the label. |
| badge | Badge content (e.g., notification count). |
| children | Nested hx-nav-item children for sub-navigation. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-nav-item-color | var(--hx-color-neutral-300) | Item text color. |
| --hx-nav-item-hover-bg | - | Item hover background. |
| --hx-nav-item-hover-color | var(--hx-color-neutral-100) | Item hover text color. |
| --hx-nav-item-active-bg | var(--hx-color-primary-600) | Active item background. |
| --hx-nav-item-active-color | var(--hx-color-neutral-50) | Active item text color. |
| --hx-nav-item-padding | - | Item padding. |
| --hx-nav-item-host-bg | var(--hx-color-neutral-900) | Component host background color. |

## CSS Parts

| Part | Description |
|------|-------------|
| link | The anchor or button element. |
| icon | The icon container. |
| label | The label container. |
| badge | The badge container. |
| children | The children container. |
