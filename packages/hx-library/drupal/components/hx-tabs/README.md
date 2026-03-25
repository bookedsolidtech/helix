# HX Tabs

A tabbed content organizer that manages a set of `<hx-tab>` and `<hx-tab-panel>` children.
Supports horizontal and vertical orientations, automatic and manual activation modes,
and full keyboard navigation per the ARIA Authoring Practices Guide.

## Usage

```twig
{% include 'helix:hx-tabs' with {
  orientation: 'horizontal',
  activation: 'automatic',
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| orientation | object | horizontal | The layout orientation of the tabs. |
| activation | object | automatic | Controls how keyboard navigation activates tabs.
In `automatic` mode, focus also activates the tab.
In `manual` mode, focus moves independently; Space or Enter activates. |
| label | string |  | Accessible label for the tablist. Rendered as `aria-label` on the tablist container.
Provide a brief description of what the tabs represent (e.g., "Patient record sections"). |

## Slots

| Slot | Description |
|------|-------------|
| tab | Slot for `<hx-tab>` elements. Rendered inside the tablist. |
| (default) | Default slot for `<hx-tab-panel>` elements. |

## Events

| Event | Description |
|-------|-------------|
| hx-tab-change | Dispatched when the active tab changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-tabs-border-color | var(--hx-color-neutral-200, #e9ecef) | Tablist border color. |
| --hx-tabs-border-width | 1px | Tablist border width. |
| --hx-tabs-vertical-width | 12rem | Width of the tablist in vertical orientation. |
| --hx-tabs-gap | 0 | Gap between the tablist and panels container. |
| --hx-tabs-tab-color | var(--hx-color-neutral-600, #495057) | Inactive tab text color. |
| --hx-tabs-tab-active-color | var(--hx-color-primary-600, #1d4ed8) | Active tab text color. |
| --hx-tabs-tab-hover-color | var(--hx-color-neutral-800, #212529) | Tab hover text color. |
| --hx-tabs-tab-hover-bg | var(--hx-color-neutral-50, #f8f9fa) | Tab hover background. |
| --hx-tabs-tab-font-size | var(--hx-font-size-md, 1rem) | Tab font size. |
| --hx-tabs-tab-font-weight | var(--hx-font-weight-medium, 500) | Tab font weight. |
| --hx-tabs-tab-active-font-weight | var(--hx-font-weight-semibold, 600) | Active tab font weight. |
| --hx-tabs-tab-padding-x | var(--hx-space-4, 1rem) | Horizontal tab padding. |
| --hx-tabs-tab-padding-y | var(--hx-space-2, 0.5rem) | Vertical tab padding. |
| --hx-tabs-indicator-color | var(--hx-color-primary-500, #2563eb) | Active indicator color. |
| --hx-tabs-indicator-size | 2px | Active indicator thickness. |
| --hx-tabs-focus-ring-color | var(--hx-focus-ring-color, #2563eb) | Focus ring color for tabs and panels. |
| --hx-tabs-panel-padding | var(--hx-space-4, 1rem) | Panel inner padding. |
| --hx-tabs-panel-color | var(--hx-color-neutral-700, #343a40) | Panel text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| tablist | The tablist container element. |
| panels | The panel content container element. |
