# HX Breadcrumb Item

A single breadcrumb navigation item.

## Usage

```twig
{% include 'helix:hx-breadcrumb-item' with {
  href: 'undefined',
  current: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| href | object | undefined | The URL for this breadcrumb link. Omit for the current page item.
When `current` is true, this attribute is ignored and the item always
renders as static text per WAI-ARIA APG breadcrumb guidance. |
| current | boolean | false | Marks this item as the current page. When set, the item always renders as
static text (never a navigable link) and `aria-current="page"` is placed on
the inner text element per WAI-ARIA APG breadcrumb guidance, yielding the
canonical AT announcement ("current page, Patient Records").

Can be set explicitly by consumers (e.g. Drupal Twig templates) to override
the default positional last-item detection in `hx-breadcrumb`. When any item
in the breadcrumb has an explicit `current` attribute, the parent will not
override it. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | The link or page text content. Accepts text, HTML, or icon elements. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-breadcrumb-link-color | var(--hx-color-primary-600) | Link text color. |
| --hx-breadcrumb-link-hover-color | var(--hx-color-primary-700) | Link hover text color. |
| --hx-breadcrumb-text-color | var(--hx-color-neutral-700) | Current page text color. |
| --hx-breadcrumb-separator-content | '/' | Separator character displayed after non-last items. |
| --hx-breadcrumb-separator-color | var(--hx-color-neutral-400) | Separator color. |
| --hx-breadcrumb-separator-gap | var(--hx-space-1) | Horizontal margin around separator. |
| --hx-breadcrumb-item-max-width | - | Optional max-width for text truncation. |

## CSS Parts

| Part | Description |
|------|-------------|
| item | Wrapper around the link or text content. |
| link | The anchor element when href is provided (non-current items only). |
| text | The span element for the current page or items without href. |
| separator | The separator element rendered after non-last items. |
