# HX Carousel Item

A wrapper for individual carousel slides.

## Usage

```twig
{% include 'helix:hx-carousel-item' with {
  slideIndex: 0,
  totalSlides: 0,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| slideIndex | number | 0 | The 0-based index of this slide within the carousel. Set by hx-carousel. |
| totalSlides | number | 0 | Total number of slides in the carousel. Set by hx-carousel. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Slide content. |

## CSS Parts

| Part | Description |
|------|-------------|
| slide | The slide wrapper element. |
