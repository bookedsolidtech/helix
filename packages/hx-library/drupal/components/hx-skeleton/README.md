# HX Skeleton

An animated placeholder used to indicate loading content.
Purely decorative — hidden from assistive technology.
Supports a `loaded` state that announces content availability to screen readers.

## Usage

```twig
{% include 'helix:hx-skeleton' with {
  variant: 'rect',
  width: '100%',
  height: 'undefined',
  animated: true,
  loaded: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | rect | Shape variant of the skeleton placeholder. |
| width | string | 100% | CSS width of the skeleton. Accepts any valid CSS width value. |
| height | object | undefined | CSS height of the skeleton. Accepts any valid CSS height value.
Defaults vary by variant when not set. |
| animated | boolean | true | Whether the shimmer wave animation is active.
Set to false to display a static skeleton. |
| loaded | boolean | false | When true, hides the skeleton and dispatches an `hx-loaded` event.
Consumers should pair this with an external `aria-live` region to
announce loading completion to assistive technology users. |

## Events

| Event | Description |
|-------|-------------|
| hx-loaded | Dispatched when `loaded` transitions to `true`. Consumers should use this event to update an external `aria-live` region announcing content availability. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-skeleton-bg | var(--hx-color-neutral-200) | Skeleton background color. |
| --hx-skeleton-shimmer-color | rgba(255,255,255,0.4) | Shimmer highlight color. |
| --hx-skeleton-shimmer-width | 200% | Shimmer sweep width (background-size X axis). |
| --hx-skeleton-duration | 1.5s | Shimmer animation duration. |
| --hx-skeleton-text-radius | var(--hx-border-radius-full) | Border radius for text variant. |
| --hx-skeleton-rect-radius | var(--hx-border-radius-sm) | Border radius for rect variant. |
| --hx-skeleton-button-radius | var(--hx-border-radius-md) | Border radius for button variant. |
| --hx-skeleton-circle-radius | 50% | Border radius for circle variant. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner skeleton element. |
