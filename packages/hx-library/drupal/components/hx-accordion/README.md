# HX Accordion

An accordion container that manages collapsible content sections.

## Usage

```twig
{% include 'helix:hx-accordion' with {
  mode: 'single',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| mode | object | single | Expansion mode: 'single' collapses all other items when one expands.
'multi' allows multiple items open simultaneously. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for hx-accordion-item elements. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-accordion-border-radius | var(--hx-border-radius-md) | Outer border radius. |

## CSS Parts

| Part | Description |
|------|-------------|
| accordion | The outer container wrapping all accordion items. |
