# HX Icon

An icon component that supports inline SVG fetching and SVG sprite sheet references.
Decorative icons are automatically hidden from assistive technology.
When a label is provided the icon is announced as an image with that label.

**Render modes:**
- **Sprite mode** (recommended for Drupal/SSR): Set `name` and optionally `sprite-url`.
  Renders an `<svg><use href="...#name">` — works server-side without JavaScript.
- **Inline mode**: Set `src` to a URL of a standalone SVG file. The component fetches,
  sanitizes, and embeds the SVG markup. Requires JavaScript; not server-side renderable.
  For Drupal/Twig templates use sprite mode to avoid content shift before hydration.

## Usage

```twig
{% include 'helix:hx-icon' with {
  name: '',
  src: 'undefined',
  spriteUrl: 'undefined',
  size: 'md',
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | Icon name used as the fragment identifier when referencing a sprite sheet.
For sprite mode provide the bare symbol id (e.g. `check`). The component
will build the full href as `${spriteUrl}#${name}`. If `name` already
starts with `#` it is used as-is (inline sprite reference without a base
URL). |
| src | object | undefined | URL of a standalone SVG file to fetch and render inline. Takes precedence
over sprite mode when both `src` and `spriteUrl`/`name` are set.

**Note:** Inline mode requires browser JavaScript (`fetch` + `DOMParser`).
It is not server-side renderable. For Drupal/Twig use sprite mode instead. |
| spriteUrl | object | undefined | Base URL of the SVG sprite sheet. Used together with `name` to construct
the `<use>` href: `${spriteUrl}#${name}`. |
| size | object | md | Size variant of the icon.

Set via the `hx-size` HTML attribute (e.g. `hx-size="lg"`) or via the
`size` JavaScript property (e.g. `el.size = 'lg'`). Both are equivalent —
the `attribute: 'hx-size'` mapping is used to avoid colliding with the
native `<input>` `size` attribute in Drupal attribute-passthrough scenarios.
The CEM exposes both the JS property name (`size`) and the HTML attribute
name (`hx-size`). |
| label | string |  | Accessible label for the icon. When non-empty, `role="img"` and
`aria-label` are applied so assistive technology announces the icon.
When empty the icon is treated as decorative and `aria-hidden="true"` is
applied. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-icon-size | var(--hx-size-6,1.5rem) | Width and height of the icon. |
| --hx-icon-color | currentColor | Icon color. |

## CSS Parts

| Part | Description |
|------|-------------|
| svg | The SVG element rendered in sprite mode, or the inline SVG container in inline mode. In sprite mode this is an `<svg>` element; in inline mode it is a `<span>` element wrapping the fetched SVG. Both expose the same `part` name for consistent external styling via `::part(svg)`. |
