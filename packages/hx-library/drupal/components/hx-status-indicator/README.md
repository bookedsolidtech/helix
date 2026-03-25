# HX Status Indicator

A colored dot/badge indicating system or entity health status.
Purely visual — no slots. Supports an animated pulse ring.

Uses `role="img"` with an auto-generated `aria-label` (e.g. "Status: Online").
When used decoratively alongside visible text that conveys the same status information
(e.g. "Provider is available"), set `aria-hidden="true"` on the host element to prevent
duplicate announcements to screen reader users. This is the recommended composition
pattern in healthcare dashboards.

## Usage

```twig
{% include 'helix:hx-status-indicator' with {
  status: 'unknown',
  size: 'md',
  pulse: false,
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| status | object | unknown | The status to display. |
| size | object | md | Size of the indicator dot. |
| pulse | boolean | false | Whether to show an animated pulse ring around the dot.
Animation is suppressed when prefers-reduced-motion is active. |
| label | string |  | Accessible label for the indicator. Defaults to "Status: {Status}".
Set aria-hidden="true" on the host when status is conveyed by adjacent text. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-status-indicator-color-online | - | Override color for the "online" status dot. |
| --hx-status-indicator-color-offline | - | Override color for the "offline" status dot. |
| --hx-status-indicator-color-away | - | Override color for the "away" status dot. |
| --hx-status-indicator-color-busy | - | Override color for the "busy" status dot. |
| --hx-status-indicator-color-unknown | - | Override color for the "unknown" status dot. |
| --hx-status-indicator-size-sm | - | Override size for the "sm" variant. |
| --hx-status-indicator-size-md | - | Override size for the "md" variant. |
| --hx-status-indicator-size-lg | - | Override size for the "lg" variant. |
| --hx-status-indicator-pulse-duration | - | Override pulse animation duration. |
| --hx-status-indicator-pulse-scale | - | Override pulse animation max scale. |
| --hx-status-indicator-pulse-color | - | Override pulse ring color independently from dot color. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The dot element. |
| pulse-ring | The animated pulse ring element. |
