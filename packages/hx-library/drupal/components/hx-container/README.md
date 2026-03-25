# HX Container

A layout container that constrains content width and provides
consistent vertical spacing and horizontal gutters.

Uses a two-layer model: the outer host spans full width (background,
vertical padding), while the inner wrapper constrains max-width,
centers content, and applies horizontal gutters.

## Accessibility

`hx-container` is a purely visual layout primitive with no semantic meaning.
It carries no ARIA role and is intentionally transparent to assistive
technologies. Screen readers announce the container's children directly,
not the container itself.

The inner wrapper always centers content horizontally (via `margin: auto`).
This is by design for page-layout use cases. If you need non-centered
alignment at a specific breakpoint, override `margin-left` and
`margin-right` on `::part(inner)` from your stylesheet.

## Usage

```twig
{% include 'helix:hx-container' with {
  width: 'content',
  padding: 'none',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | object | content | Controls the max-width of the inner content wrapper. |
| padding | object | none | Vertical padding applied to the outer wrapper. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for container content. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-container-bg | transparent | Background color on the outer wrapper. |
| --hx-container-gutter | var(--hx-space-6) | Horizontal padding on the inner box. |
| --hx-container-max-width | - | Override the max-width set by the width property. |
| --hx-container-content | 72rem | Max-width for the content width preset. |
| --hx-container-narrow | 48rem | Max-width for the narrow width preset. |
| --hx-container-sm | 640px | Max-width for the sm width preset. |
| --hx-container-md | 768px | Max-width for the md width preset. |
| --hx-container-lg | 1024px | Max-width for the lg width preset. |
| --hx-container-xl | 1280px | Max-width for the xl width preset. |

## CSS Parts

| Part | Description |
|------|-------------|
| inner | The inner wrapper that constrains max-width and applies gutters. |
