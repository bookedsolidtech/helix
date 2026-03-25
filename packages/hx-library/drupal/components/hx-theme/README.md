# HX Theme

A theme provider that injects CSS custom property tokens for a named theme
onto a scoped root element. Wrapping content with this component scopes
all `--hx-*` design tokens to the selected theme.

This is a pure infrastructure component with `display: contents` — it does
not affect layout. Use it to apply a theme to a subtree of components.

Supported themes:
- `"light"` — standard light-mode token set (default)
- `"dark"` — dark-mode semantic overrides applied on top of light primitives
- `"high-contrast"` — WCAG 7:1+ contrast token set for low-vision accessibility
- `"auto"` — follows the OS `prefers-color-scheme` media query (light or dark)

## Usage

```twig
{% include 'helix:hx-theme' with {
  theme: 'light',
  system: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| theme | object | light | The theme to apply. Determines which set of --hx-* tokens are injected.
- `"light"` (default): standard light-mode tokens
- `"dark"`: dark-mode semantic overrides applied on top of light primitives
- `"high-contrast"`: WCAG 7:1+ contrast tokens for low-vision users
- `"auto"`: follows OS `prefers-color-scheme`; resolves to `"light"` or `"dark"` at runtime |
| system | boolean | false |  |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for themed content. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-* | - | All design tokens for the selected theme are injected as CSS custom properties on the host element. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner slot wrapper element. `display: contents` — no layout effect. |
