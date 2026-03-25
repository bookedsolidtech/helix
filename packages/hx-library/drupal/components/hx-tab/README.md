# HX Tab

An individual tab button, designed to be used inside an `<hx-tabs>` container.
Must be placed in the `tab` named slot of `<hx-tabs>`.

## Usage

```twig
{% include 'helix:hx-tab' with {
  panel: '',
  selected: false,
  disabled: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| panel | string |  | The name of the `<hx-tab-panel>` this tab controls. Must match the `name`
attribute on the corresponding `<hx-tab-panel>`. |
| selected | boolean | false | Whether this tab is currently selected. Managed by the parent `<hx-tabs>`. |
| disabled | boolean | false | Whether this tab is disabled. Prevents selection and keyboard navigation. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the tab label text or content. |
| prefix | Icon or content rendered before the label. |
| suffix | Icon or content rendered after the label. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
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
| --hx-tabs-focus-ring-color | var(--hx-focus-ring-color, #2563eb) | Focus ring color. |

## CSS Parts

| Part | Description |
|------|-------------|
| tab | The underlying button element. |
| prefix | The container for prefix slot content (e.g. icons). |
| suffix | The container for suffix slot content (e.g. badges). |
