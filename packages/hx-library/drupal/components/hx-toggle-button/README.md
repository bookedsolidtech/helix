# HX Toggle Button

A two-state toggle button that communicates a pressed/unpressed status to
assistive technology via `aria-pressed`. Supports multiple visual variants
and sizes, prefix/suffix slots, full ElementInternals form association, and
a distinct pressed visual state for every variant.

## Usage

```twig
{% include 'helix:hx-toggle-button' with {
  pressed: false,
  variant: 'secondary',
  size: 'md',
  disabled: false,
  name: 'undefined',
  value: 'undefined',
  label: 'undefined',
  required: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| pressed | boolean | false | Whether the toggle button is in the pressed state.
Reflected as an attribute so CSS selectors like `:host([pressed])` work. |
| variant | object | secondary | Visual style variant of the button. |
| size | object | md | Size of the button. |
| disabled | boolean | false | Whether the button is disabled. Prevents all interaction and form actions. |
| name | object | undefined | Form field name submitted via ElementInternals when the button is pressed. |
| value | object | undefined | Form field value submitted via ElementInternals when the button is pressed. |
| label | object | undefined | Accessible label forwarded to the inner `<button>` as `aria-label`.
Required for icon-only toggle buttons where no visible text is present. |
| required | boolean | false | When true, the button must be in the pressed state for the form to be submitted. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the button label text or content. |
| prefix | Icon or content rendered before the label. |
| suffix | Icon or content rendered after the label. |

## Events

| Event | Description |
|-------|-------------|
| hx-toggle | Dispatched when the toggle state changes. Not dispatched when the button is disabled. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-toggle-button-bg | var(--hx-color-primary-500) | Button background color. |
| --hx-toggle-button-color | var(--hx-color-neutral-0) | Button text color. |
| --hx-toggle-button-border-color | transparent | Button border color. |
| --hx-toggle-button-border-radius | var(--hx-border-radius-md) | Button border radius. |
| --hx-toggle-button-font-family | var(--hx-font-family-sans) | Button font family. |
| --hx-toggle-button-font-weight | var(--hx-font-weight-semibold) | Button font weight. |
| --hx-toggle-button-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-toggle-button-pressed-bg | var(--hx-color-primary-500) | Background when pressed (variant-specific fallback applies). |
| --hx-toggle-button-pressed-color | var(--hx-color-neutral-0) | Text color when pressed (variant-specific fallback applies). |

## CSS Parts

| Part | Description |
|------|-------------|
| button | The native `<button>` element. |
| label | The label text wrapper span. |
| prefix | The prefix slot container span. |
| suffix | The suffix slot container span. |
