# HX Progress Bar

A linear progress indicator for determinate and indeterminate states.

## Usage

```twig
{% include 'helix:hx-progress-bar' with {
  value: 'null',
  min: 0,
  max: 100,
  indeterminate: false,
  label: '',
  description: '',
  size: 'md',
  variant: 'default',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | object | null | Current progress value (min–max). Set to null for indeterminate state. |
| min | number | 0 | Minimum value for the progress bar. |
| max | number | 100 | Maximum value for the progress bar. |
| indeterminate | boolean | false | When true, displays an animated indeterminate loading state regardless of value. |
| label | string |  | Accessible label for the progress bar (maps to aria-label when no label slot content is used). |
| description | string |  | Additional description for the progress operation, linked via aria-describedby. |
| size | object | md | Size of the progress bar track. |
| variant | object | default | Visual variant controlling the indicator color. |

## Slots

| Slot | Description |
|------|-------------|
| label | Visible label text rendered above the progress bar track. |

## Events

| Event | Description |
|-------|-------------|
| hx-complete | Emitted when progress reaches 100%. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-progress-bar-track-bg | var(--hx-color-neutral-100) | Track background color. |
| --hx-progress-bar-indicator-bg | var(--hx-color-primary-500) | Indicator fill color. |
| --hx-progress-bar-border-radius | var(--hx-border-radius-full) | Track border radius. |
| --hx-progress-bar-height-sm | var(--hx-size-1) | Track height for size="sm". |
| --hx-progress-bar-height-md | var(--hx-size-2) | Track height for size="md". |
| --hx-progress-bar-height-lg | var(--hx-size-3) | Track height for size="lg". |
| --hx-progress-bar-label-font-family | var(--hx-font-family-sans) | Label font family. |
| --hx-progress-bar-label-font-size | var(--hx-font-size-sm) | Label font size. |
| --hx-progress-bar-label-font-weight | var(--hx-font-weight-medium) | Label font weight. |
| --hx-progress-bar-label-color | var(--hx-color-neutral-700) | Label text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| track | The outer track container element. |
| fill | The filled portion indicating progress. |
| label | The label slot wrapper element. |
