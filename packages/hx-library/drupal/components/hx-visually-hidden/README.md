# HX Visually Hidden

A utility component that hides content visually while keeping it
accessible to screen readers. Uses the standard visually-hidden CSS
technique — does NOT use `visibility: hidden` or `display: none`,
which would also hide content from assistive technologies.

## Usage

```twig
{% include 'helix:hx-visually-hidden' with {
  focusable: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| focusable | boolean | false | When true, the component becomes visible when a focusable child
(such as a skip link) receives focus. This enables the standard
"skip to content" accessibility pattern. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | The content to hide visually but expose to screen readers. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner wrapper element containing the slotted content. |
