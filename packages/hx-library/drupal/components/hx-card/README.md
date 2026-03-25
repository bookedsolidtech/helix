# HX Card

A flexible card component for displaying grouped content.

## Usage

```twig
{% include 'helix:hx-card' with {
  variant: 'default',
  elevation: 'flat',
  hxHref: 'undefined',
  hxAriaLabel: 'undefined',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | default | Visual style variant of the card. |
| elevation | object | flat | Elevation (shadow depth) of the card. |
| hxHref | object | undefined | Optional URL. When set, the card becomes interactive (clickable)
and navigates to this URL on click.
Uses hx-href to avoid conflicting with the native HTML href attribute. |
| hxAriaLabel | object | undefined | Accessible label for interactive cards. Use this to provide a meaningful
description of the card's purpose rather than exposing the raw URL.
Only applies when hx-href is set. |

## Slots

| Slot | Description |
|------|-------------|
| image | Optional image or media content at the top of the card. |
| heading | The card heading/title content. Use a semantic heading element (h2, h3, etc.) for proper accessibility. |
| (default) | Default slot for the card body content. |
| footer | Optional footer content below the body. |
| actions | Optional action buttons, rendered with a top border separator. Do NOT use together with hx-href (interactive card + focusable actions is an ARIA anti-pattern). |

## Events

| Event | Description |
|-------|-------------|
| hx-click | Dispatched when an interactive card (with hx-href) is clicked. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-card-bg | var(--hx-color-neutral-0) | Card background color. |
| --hx-card-color | var(--hx-color-neutral-800) | Card text color. |
| --hx-card-border-color | var(--hx-color-neutral-200) | Card border color. |
| --hx-card-border-radius | var(--hx-border-radius-lg) | Card border radius. |
| --hx-card-padding | var(--hx-space-6) | Internal padding for card sections. |
| --hx-card-gap | var(--hx-space-4) | Gap between card sections. |
| --hx-card-image-aspect-ratio | 16/9 | Aspect ratio for the image slot. |

## CSS Parts

| Part | Description |
|------|-------------|
| card | The outer card container element. |
| image | The image slot container. |
| heading | The heading slot container. |
| body | The body slot container. |
| footer | The footer slot container. |
| actions | The actions slot container. |
