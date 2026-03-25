# HX Button

A production-grade button component for user interaction. Supports multiple
visual variants, sizes, loading state, prefix/suffix slots, anchor rendering,
and full ElementInternals form association.

## Usage

```twig
{% include 'helix:hx-button' with {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
  href: 'undefined',
  target: 'undefined',
  name: 'undefined',
  value: 'undefined',
  full: false,
  inverted: false,
  ariaLabel: 'null',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | primary | Visual style variant of the button. |
| size | object | md | Size of the button. |
| disabled | boolean | false | Whether the button is disabled. Prevents all interaction and form actions. |
| loading | boolean | false | Whether the button is in a loading state. Shows spinner, prevents interaction,
and sets aria-busy. Does not set the disabled attribute. |
| type | object | button | The type attribute for the underlying button element. Ignored when href is set. |
| href | object | undefined | When set, renders an anchor element instead of a button. |
| target | object | undefined | Anchor target attribute. Only used when href is set. |
| name | object | undefined | Form field name submitted via ElementInternals.setFormValue on submit. |
| value | object | undefined | Form field value submitted via ElementInternals.setFormValue on submit. |
| full | boolean | false | When true, the button stretches to fill its container width.
Sets the host to `display: block` and the inner element to `width: 100%`. |
| inverted | boolean | false | When true, flips button colors for placement on dark or gradient backgrounds.
Forces text to white and adjusts hover/focus ring colors across all variants. |
| ariaLabel | object | null | Accessible label forwarded to the inner button/anchor. Required for icon-only usage. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for button label text or content. |
| prefix | Icon or content rendered before the label. |
| suffix | Icon or content rendered after the label. |

## Events

| Event | Description |
|-------|-------------|
| hx-click | Dispatched when the button is clicked and is neither disabled nor loading. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-button-bg | var(--hx-color-primary-500) | Button background color. |
| --hx-button-hover-bg | - | Hover background color override. When set, overrides the variant default hover background from outside the shadow DOM. |
| --hx-button-color | var(--hx-color-neutral-0) | Button text color. |
| --hx-button-border-color | transparent | Button border color. |
| --hx-button-border-radius | var(--hx-border-radius-md) | Button border radius. |
| --hx-button-font-family | var(--hx-font-family-sans) | Button font family. |
| --hx-button-font-weight | var(--hx-font-weight-semibold) | Button font weight. |
| --hx-button-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-button-inverted-color | #ffffff | Text color when inverted. |
| --hx-button-inverted-ghost-hover-bg | rgba(255,255,255,0.15) | Ghost hover bg when inverted. |
| --hx-button-inverted-focus-ring-color | rgba(255,255,255,0.5) | Focus ring color when inverted. |

## CSS Parts

| Part | Description |
|------|-------------|
| button | The native button or anchor element. |
| label | The label text wrapper span. |
| prefix | The prefix slot container span. |
| suffix | The suffix slot container span. |
| spinner | The loading spinner SVG element. |
