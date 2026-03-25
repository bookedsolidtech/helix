# HX Banner

A full-width page-level banner for persistent notifications and announcements.
Designed for healthcare applications requiring prominent system-level messaging.

## Usage

```twig
{% include 'helix:hx-banner' with {
  variant: 'info',
  position: 'sticky',
  dismissible: false,
  heading: '',
  actionLabel: '',
  actionHref: '',
  open: true,
  closeLabel: 'Dismiss banner',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | info | Visual variant of the banner that determines colors and ARIA semantics. |
| position | object | sticky | CSS positioning behavior. "sticky" keeps the banner in flow; "fixed" pins it to the viewport. |
| dismissible | boolean | false | Whether the banner can be dismissed by the user. |
| heading | string |  | Heading text for the banner, used to provide context in the action link's and
close button's accessible labels. |
| actionLabel | string |  | Label text for the optional action link. Requires action-href to render. |
| actionHref | string |  | URL for the optional action link. Requires action-label to render. |
| open | boolean | true | Whether the banner is visible. Defaults to true — banners are shown by default. |
| closeLabel | string | Dismiss banner | Accessible label for the dismiss button. Override for localized text. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for banner message content. |
| action | Optional slot to override the built-in action link with custom content. |

## Events

| Event | Description |
|-------|-------------|
| hx-dismiss | Dispatched when the user dismisses the banner. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-banner-bg | var(--hx-color-info-50) | Banner background color. |
| --hx-banner-color | var(--hx-color-info-800) | Banner text color. |
| --hx-banner-border-color | var(--hx-color-info-200) | Banner bottom border color. |
| --hx-banner-border-width | var(--hx-border-width-thin) | Banner bottom border width. |
| --hx-banner-padding | var(--hx-space-3) var(--hx-space-4) | Banner padding. |
| --hx-banner-gap | var(--hx-space-3) | Gap between banner elements. |
| --hx-banner-icon-color | var(--hx-color-info-500) | Banner icon color. |
| --hx-banner-font-family | var(--hx-font-family-sans) | Banner font family. |
| --hx-banner-action-color | var(--hx-banner-color) | Action link color. |
| --hx-banner-position | sticky | CSS position value (sticky or fixed). |
| --hx-banner-z-index | 100 | Banner z-index for stacking context. |
| --hx-touch-target-size | 44px | Minimum touch target size for the close button. |

## CSS Parts

| Part | Description |
|------|-------------|
| banner | The outer banner container. |
| icon | The icon container. |
| message | The message content area. |
| action | The action link element (only rendered when action-label and action-href are set). |
| close-button | The dismiss button (only rendered when dismissible). |
