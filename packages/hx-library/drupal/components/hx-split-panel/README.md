# HX Split Panel

A resizable two-pane layout with a draggable divider.

## Usage

```twig
{% include 'helix:hx-split-panel' with {
  position: 50,
  positionInPixels: '',
  orientation: 'horizontal',
  min: 0,
  max: 100,
  snap: '[]',
  disabled: false,
  collapsible: false,
  collapsed: 'null',
  labelResize: 'Resize panels',
  labelCollapseStart: 'Collapse start panel',
  labelCollapseEnd: 'Collapse end panel',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| position | number | 50 | Position of the divider as a percentage (0–100) of the start panel. |
| positionInPixels | object | - | Position of the divider in pixels (alternative to `position`).
When set, takes precedence over `position` until the host is measured. |
| orientation | object | horizontal | Orientation of the split. |
| min | number | 0 | Minimum position as a percentage (0–100). Prevents full collapse of start panel. |
| max | number | 100 | Maximum position as a percentage (0–100). Prevents full expansion of start panel. |
| snap | object | [] | Snap points as an array of percentages. The divider snaps to the
nearest point within a 5% threshold.
Accepts JSON array string in HTML: snap="[25, 50, 75]" |
| disabled | boolean | false | When true, the divider cannot be dragged. |
| collapsible | boolean | false | When true, collapse/expand buttons appear on the divider. |
| collapsed | object | null | Which panel is collapsed: 'start', 'end', or null (not collapsed). |
| labelResize | string | Resize panels | Accessible label for the resize divider handle. |
| labelCollapseStart | string | Collapse start panel | Accessible label for the collapse-start panel button. |
| labelCollapseEnd | string | Collapse end panel | Accessible label for the collapse-end panel button. |

## Slots

| Slot | Description |
|------|-------------|
| start | The first (start) panel content. |
| end | The second (end) panel content. |

## Events

| Event | Description |
|-------|-------------|
| hx-reposition | Fired when the divider is moved. Detail: `{ position: number }`. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-split-panel-divider-size | 4px | Width (horizontal) or height (vertical) of the divider. |
| --hx-split-panel-divider-color | var(--hx-color-neutral-200) | Default divider color. |
| --hx-split-panel-divider-hover-color | var(--hx-color-primary-500) | Divider color on hover/focus. |

## CSS Parts

| Part | Description |
|------|-------------|
| start | The start panel container. |
| divider | The draggable divider element. |
| end | The end panel container. |
