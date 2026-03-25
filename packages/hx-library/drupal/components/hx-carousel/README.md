# HX Carousel

A scrollable carousel/slider for images or content slides.

## Usage

```twig
{% include 'helix:hx-carousel' with {
  label: 'Carousel',
  loop: false,
  autoplay: false,
  autoplayInterval: 3000,
  slidesPerPage: 1,
  slidesPerMove: 1,
  orientation: 'horizontal',
  mouseDragging: false,
  labelPrevSlide: 'Previous slide',
  labelNextSlide: 'Next slide',
  labelPauseAutoplay: 'Pause autoplay',
  labelPlayAutoplay: 'Play autoplay',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | Carousel | Accessible label identifying this carousel to assistive technology.
When multiple carousels appear on the same page, each must have a unique label. |
| loop | boolean | false | Whether the carousel wraps around from last to first slide and vice-versa. |
| autoplay | boolean | false | Whether the carousel auto-advances slides.
Automatically pauses on hover, focus, and when prefers-reduced-motion is active. |
| autoplayInterval | number | 3000 | Milliseconds between auto-advance transitions. |
| slidesPerPage | number | 1 | Number of slides visible at once. |
| slidesPerMove | number | 1 | Number of slides to advance per navigation action. |
| orientation | object | horizontal | Scroll axis of the carousel. |
| mouseDragging | boolean | false | Whether click-drag scrolling is enabled. |
| labelPrevSlide | string | Previous slide | Accessible label for the previous slide button. |
| labelNextSlide | string | Next slide | Accessible label for the next slide button. |
| labelPauseAutoplay | string | Pause autoplay | Accessible label for the autoplay pause button. |
| labelPlayAutoplay | string | Play autoplay | Accessible label for the autoplay play button. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | `hx-carousel-item` elements (the slides). |
| next-button | Custom next navigation button. |
| previous-button | Custom previous navigation button. |

## Events

| Event | Description |
|-------|-------------|
| hx-slide-change | Dispatched when the active slide changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-carousel-gap | 0px | Gap between slides. |
| --hx-carousel-slide-width | 100% | Width override for each slide. |
| --hx-carousel-nav-btn-size | 2.5rem | Size of previous/next navigation buttons. |
| --hx-carousel-pagination-dot-size | 0.5rem | Size of pagination dots. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The outer wrapper element. |
| slide-viewport | The slide viewport/overflow container. |
| pagination | The pagination dot container. |
| pagination-item | Individual pagination dot button. |
| navigation | The previous/next button wrapper. |
| prev-btn | The previous navigation button. |
| next-btn | The next navigation button. |
| play-pause-btn | The autoplay play/pause toggle button. |
