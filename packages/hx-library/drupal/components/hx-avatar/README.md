# HX Avatar

A user avatar component that displays an image, initials, or a fallback icon.
Supports a badge slot for status indicator overlays.

## Usage

```twig
{% include 'helix:hx-avatar' with {
  src: 'undefined',
  alt: '',
  label: '',
  initials: '',
  size: 'md',
  shape: 'circle',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | object | undefined | Image URL. When provided and successfully loaded, displays the image. |
| alt | string |  | Accessible label for the image. Required when `src` is provided.
Used as the container's aria-label in image mode. |
| label | string |  | Human-readable accessible name for non-image states (initials, fallback icon).
In healthcare contexts, provide the full person name (e.g., "Dr. Jane Doe") rather than
relying on raw initials, which screen readers announce as individual letters.
When set, takes precedence over raw initials and the generic "Avatar" fallback. |
| initials | string |  | Fallback initials text displayed when no image is available. |
| size | object | md | Size variant of the avatar. |
| shape | object | circle | Shape variant of the avatar. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for custom avatar content. Overrides src and initials when slotted content is present. |
| badge | Status indicator overlay, positioned at the bottom-right of the avatar container. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-avatar-size | - | Computed width and height from the size variant. |
| --hx-avatar-border-radius | - | Circle = 50%, Square = var(--hx-border-radius-md). |
| --hx-avatar-bg | var(--hx-color-primary-100) | Background color of the avatar container. |
| --hx-avatar-color | var(--hx-color-primary-700) | Text and icon color inside the avatar. |
| --hx-avatar-font-size | - | Font size for the initials text, set per size variant. |

## CSS Parts

| Part | Description |
|------|-------------|
| avatar | The outer container element. |
| image | The img element shown when src is provided. |
| initials | The initials text span shown as a fallback. |
| fallback-icon | The SVG person silhouette shown when no src or initials are available. |
| badge | The badge slot container. |
