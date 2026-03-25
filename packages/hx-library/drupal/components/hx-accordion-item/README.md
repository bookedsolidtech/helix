# HX Accordion Item

An individual accordion item with collapsible content.

## Usage

```twig
{% include 'helix:hx-accordion-item' with {
  expanded: false,
  disabled: false,
  level: '3',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| expanded | boolean | false | Whether this item is expanded. |
| disabled | boolean | false | Whether this item is disabled (cannot be toggled). |
| level | object | 3 | Heading level (1–6) applied via `role="heading" aria-level` on the summary
trigger. Defaults to 3. Set to match the document outline around the
accordion so screen readers surface accordion items in the heading list. |

## Slots

| Slot | Description |
|------|-------------|
| trigger | The heading/trigger content for this item. |
| (default) | Default slot for the collapsible body content. |

## Events

| Event | Description |
|-------|-------------|
| hx-expand | Dispatched when the item is expanded. |
| hx-collapse | Dispatched when the item is collapsed. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-accordion-border-color | var(--hx-color-neutral-200) | Border color between items. |
| --hx-accordion-trigger-padding | var(--hx-space-4) | Trigger padding. |
| --hx-accordion-trigger-color | var(--hx-color-neutral-800) | Trigger text color. |
| --hx-accordion-trigger-bg | transparent | Trigger background color. |
| --hx-accordion-trigger-hover-bg | var(--hx-color-neutral-50) | Trigger hover background. |
| --hx-accordion-icon-color | var(--hx-color-neutral-500) | Icon color. |
| --hx-accordion-content-padding | 0 var(--hx-space-4) var(--hx-space-4) | Content padding. |
| --hx-accordion-content-color | var(--hx-color-neutral-600) | Content text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| item | The outer details element container. |
| trigger | The summary/trigger element. |
| content | The collapsible content area. |
| icon | The expand/collapse icon. |
