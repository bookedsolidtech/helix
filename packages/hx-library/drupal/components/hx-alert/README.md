# HX Alert

A feedback component for communicating status messages, warnings, and errors.
Critical for healthcare patient safety alerts.

## Usage

```twig
{% include 'helix:hx-alert' with {
  variant: 'info',
  dismissible: false,
  heading: '',
  open: false,
  showIcon: false,
  accent: false,
  returnFocusTo: 'null',
  closeLabel: 'Close alert',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | info | Visual variant of the alert that determines colors and ARIA semantics. |
| dismissible | boolean | false | Whether the alert can be dismissed by the user. |
| heading | string |  | Optional heading text that provides context for the close button's accessible label.
When provided, the close button is announced as "Close [heading] alert".
When absent, the close button falls back to "Close alert". |
| open | boolean | false | Whether the alert is visible. Add the `open` attribute to show the alert. |
| showIcon | boolean | false | Whether to show the default variant icon. Add `show-icon` attribute to display the icon. |
| accent | boolean | false | When true, applies a left border accent stripe instead of a full border.
Common healthcare/enterprise dashboard pattern for visual distinction of alert types. |
| returnFocusTo | object | null | CSS selector for the element to return focus to after the alert is dismissed.
When set, the component will find and focus the matching element after dismissal.
If not set, focus management is the caller's responsibility via the hx-after-close event. |
| closeLabel | string | Close alert | Accessible label for the dismiss button. Override for localized text. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for alert message content. |
| title | Optional title/headline for the alert. |
| icon | Custom icon to override the default variant icon. |
| actions | Action buttons rendered within the alert. |

## Events

| Event | Description |
|-------|-------------|
| hx-close | Dispatched when the user dismisses the alert. |
| hx-after-close | Dispatched after the alert is dismissed. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-alert-bg | var(--hx-color-info-50) | Alert background color. |
| --hx-alert-color | var(--hx-color-info-800) | Alert text color. |
| --hx-alert-border-color | var(--hx-color-info-200) | Alert border color. |
| --hx-alert-border-radius | var(--hx-border-radius-md) | Alert border radius. |
| --hx-alert-border-width | var(--hx-border-width-thin) | Alert border width. |
| --hx-alert-padding | var(--hx-space-4) | Alert padding. |
| --hx-alert-gap | var(--hx-space-3) | Gap between alert elements. |
| --hx-alert-icon-color | var(--hx-color-info-500) | Alert icon color. |
| --hx-alert-font-family | var(--hx-font-family-sans) | Alert font family. |
| --hx-touch-target-size | 44px | Minimum touch target size for the close button. |
| --hx-alert-accent-width | 4px | Width of the left border accent stripe. |

## CSS Parts

| Part | Description |
|------|-------------|
| alert | The outer alert container. |
| title | The title/headline container. |
| icon | The icon container. |
| message | The message content area. |
| close-button | The dismiss button (only rendered when dismissible). |
| actions | The actions container. |
