# HX Spinner

A circular loading indicator for inline and overlay loading states.
Purely visual — no slots. Announces loading state to screen readers via
`role="status"` and an `aria-label` (customizable via the `label` prop).

When used alongside visible loading text, set `decorative` to suppress
duplicate AT announcements.

## Usage

```twig
{% include 'helix:hx-spinner' with {
  size: 'md',
  variant: 'default',
  label: 'Loading',
  decorative: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | object | md | Size of the spinner. Accepts `SpinnerSize` token values ('sm' | 'md' | 'lg'),
or any valid CSS size string (e.g. "3rem", "48px") for custom dimensions.

The type is `SpinnerSize | string` which widens to `string` at the TypeScript
level — this is intentional to support CSS size overrides. Use `SpinnerSize`
values for standard sizing; custom strings bypass token-based scaling. |
| variant | object | default | Visual variant of the spinner. |
| label | string | Loading | Accessible label announced to screen readers. Defaults to "Loading".
Reflected as an attribute for Drupal/Twig compatibility. |
| decorative | boolean | false | When true, the spinner is decorative and suppresses all ARIA announcements.
Use this when the spinner appears alongside visible loading text to prevent
duplicate announcements. Sets `role="presentation"` and removes `aria-label`. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-spinner-color | - | Spinner arc color. Defaults per variant. |
| --hx-spinner-track-color | - | Spinner track color. Defaults per variant. |
| --hx-duration-spinner | - | Duration of the rotation animation. Defaults to 750ms. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The SVG spinner element. |
