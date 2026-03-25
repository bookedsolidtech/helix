# HX Grid

A CSS Grid layout wrapper with design-token-based column and gap system.

## Usage

```twig
{% include 'helix:hx-grid' with {
  columns: '1',
  gap: 'md',
  rowGap: '',
  columnGap: '',
  align: 'stretch',
  justify: 'stretch',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | object | 1 | Number of equal columns (`repeat(N, 1fr)`) or a CSS grid-template-columns string. |
| gap | object | md | Gap size applied to both row and column gaps. |
| rowGap | object | - | Row gap override. When set, takes precedence over `gap` for row spacing. |
| columnGap | object | - | Column gap override. When set, takes precedence over `gap` for column spacing. |
| align | object | stretch | Aligns grid items along the block axis (align-items). |
| justify | object | stretch | Justifies grid items along the inline axis (justify-items). |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for grid content (use `hx-grid-item` for precise placement). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-grid-columns | - | Override the computed grid-template-columns. |
| --hx-grid-gap | - | Override the computed gap. |
| --hx-grid-row-gap | - | Override the computed row-gap. |
| --hx-grid-column-gap | - | Override the computed column-gap. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The grid container element. |
