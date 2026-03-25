# HX Toast

A transient notification message that auto-dismisses after a configurable duration.
Supports multiple visual variants, a closable button, icon/action slots, and full
ARIA live region semantics for screen readers.

## Usage

```twig
{% include 'helix:hx-toast' with {
  variant: 'default',
  duration: 3000,
  closable: false,
  open: false,
  closeLabel: 'Dismiss notification',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | default | Visual style variant. |
| duration | number | 3000 | Auto-dismiss duration in milliseconds. Set to 0 for persistent toasts. |
| closable | boolean | false | Whether to show a close button. |
| open | boolean | false | Whether the toast is currently visible. |
| closeLabel | string | Dismiss notification | Accessible label for the close button. Override for localization. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the notification message. |
| icon | Optional icon rendered before the message. |
| action | Optional action button rendered after the message. |

## Events

| Event | Description |
|-------|-------------|
| hx-show | Dispatched when the toast becomes visible. |
| hx-hide | Dispatched when the toast begins hiding. |
| hx-after-hide | Dispatched after the hide animation completes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-toast-bg | var(--hx-color-neutral-900) | Toast background color. |
| --hx-toast-color | var(--hx-color-neutral-0) | Toast text color. |
| --hx-toast-border-radius | var(--hx-border-radius-md) | Toast border radius. |
| --hx-toast-shadow | - | Toast box shadow. |
| --hx-toast-width | 20rem | Toast width. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner toast container div. |
| icon | The icon slot wrapper. |
| message | The message slot wrapper. |
| close-button | The dismiss button (only when closable). |
| action | The action slot wrapper. |
