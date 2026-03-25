# HX Tree View

A hierarchical tree component for navigating nested data structures.
Used in healthcare applications for org charts, ICD-10 code hierarchies, and department navigation.

Implements WAI-ARIA tree view pattern with `role="tree"` on the container
and `role="treeitem"` on each item. Supports `aria-label` via the `label` property
for screen reader identification. Full keyboard navigation: Arrow keys for movement,
Enter/Space for selection, Home/End for first/last item.

## Scale Limits

This component renders all tree items simultaneously in the DOM. It is suitable for
trees with up to ~500 visible items. For large taxonomies (e.g., ICD-10 with 70,000+
codes), use async/lazy loading: only render top-level nodes initially and populate
child nodes on `hx-select` or expand events. The component exposes the `expanded`
property on `hx-tree-item` for programmatic control of subtrees, enabling consumer-level
virtualization strategies without requiring changes to this component.

## Usage

```twig
{% include 'helix:hx-tree-view' with {
  label: '',
  selection: 'none',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | Accessible label for the tree. Applied as `aria-label` on the tree container.
Provides context to screen readers about the tree's purpose. |
| selection | object | none | Selection mode for the tree.
- `none` — items cannot be selected
- `single` — only one item can be selected at a time
- `multiple` — multiple items can be selected |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for hx-tree-item elements. |

## Events

| Event | Description |
|-------|-------------|
| hx-select | Dispatched when a tree item is selected or deselected. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-tree-font-family | var(--hx-font-family-sans) | Tree font family. |

## CSS Parts

| Part | Description |
|------|-------------|
| tree | The tree container element with role="tree". |
