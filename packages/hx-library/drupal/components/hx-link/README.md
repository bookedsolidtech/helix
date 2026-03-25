# HX Link

A semantic hyperlink component with accessibility-first design.
Renders a native `<a>` element for enabled state and a `<span>` for
disabled state with full keyboard and screen reader support.

## Usage

```twig
{% include 'helix:hx-link' with {
  href: 'undefined',
  target: 'undefined',
  variant: 'default',
  disabled: false,
  download: 'undefined',
  rel: 'undefined',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| href | object | undefined | The URL the link points to. |
| target | object | undefined | Where to display the linked URL (_self, _blank, etc.).
When set to "_blank", automatically adds rel="noopener noreferrer"
and shows an external-link indicator. |
| variant | object | default | Visual style variant of the link. |
| disabled | boolean | false | Whether the link is disabled. Renders a span instead of an anchor.
The disabled span is keyboard-focusable (tabindex="0") and announces
as a disabled link to screen readers. |
| download | object | undefined | Prompts the user to download the linked URL. When set to a string,
the value is used as the suggested filename. |
| rel | object | undefined | Relationship between the current document and the linked URL.
Automatically set to "noopener noreferrer" when target="_blank". |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for link label text or content. |

## Events

| Event | Description |
|-------|-------------|
| hx-click | Dispatched when the link is clicked and is not disabled. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-link-color | var(--hx-color-primary-500) | Default link color. |
| --hx-link-color-hover | var(--hx-color-primary-700) | Hover color. |
| --hx-link-color-active | var(--hx-color-primary-800) | Active color. |
| --hx-link-color-disabled | var(--hx-color-neutral-400) | Disabled color. |
| --hx-link-color-subtle | var(--hx-color-neutral-600) | Subtle variant color. |
| --hx-link-color-danger | var(--hx-color-error-text) | Danger variant color. |
| --hx-link-color-danger-hover | var(--hx-color-error-700) | Danger variant hover color. |
| --hx-link-font-family | var(--hx-font-family-sans) | Link font family. |
| --hx-link-text-decoration | underline | Link text decoration. |
| --hx-link-text-decoration-hover | underline | Hover text decoration. |
| --hx-link-underline-offset | 2px | Text underline offset. |
| --hx-link-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |

## CSS Parts

| Part | Description |
|------|-------------|
| link | The inner anchor or span element. |
| external-icon | The external link icon SVG (when target="_blank"). |
