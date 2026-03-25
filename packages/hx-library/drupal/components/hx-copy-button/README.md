# HX Copy Button

A clipboard copy button component that writes a given value to the system
clipboard. Provides idle and success states with configurable feedback
duration, slot-based icon overrides, and an accessible live region that
announces copy completion to screen reader users.

The `aria-label` reflects the current copy state: idle shows `label`,
copied state appends " — Copied" so screen reader users who re-focus the
button after copy receive an accurate accessible name.

Note: `aria-pressed` is intentionally NOT used. This is not a toggle button;
copied is a transient feedback state, not a persistent on/off toggle.

## Usage

```twig
{% include 'helix:hx-copy-button' with {
  value: '',
  label: 'Copy to clipboard',
  feedbackDuration: 2000,
  size: 'md',
  disabled: false,
  labelCopied: 'Copied',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string |  | The text value to write to the clipboard on click. Required for the
component to perform a copy operation. |
| label | string | Copy to clipboard | Accessible label applied as `aria-label` and `title` on the button. |
| feedbackDuration | number | 2000 | Duration in milliseconds to display the success (copied) state before
reverting to the idle state. Values below 300 ms are clamped to 300 ms
to ensure the success announcement remains visible long enough for
assistive technology and human perception. |
| size | object | md | Visual size of the button. Maps to fixed height and padding tokens.
Accepts: 'sm' | 'md' | 'lg'. Invalid values are silently coerced to 'md'.

**Accessibility (WCAG 2.5.8):** The `sm` variant uses `--hx-size-8` for
its minimum width and height. Ensure this token resolves to at least 24×24 px
(WCAG 2.5.8 AA minimum target size). For touch-primary interfaces such as
mobile clinical apps, prefer `md` or `lg` to meet the 44×44 px recommended
target size (WCAG 2.5.5 AAA / Apple HIG / Android guidelines). |
| disabled | boolean | false | Whether the button is disabled. When true, click events are suppressed
and clipboard writes do not occur. |
| labelCopied | string | Copied | Text announced to screen readers and appended to aria-label after a
successful copy. Also used as the content of the aria-live announcement. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Optional label text rendered inside the button alongside the icon. |
| copy-icon | Icon shown in the idle (pre-copy) state. |
| success-icon | Icon shown after a successful clipboard write. |

## Events

| Event | Description |
|-------|-------------|
| hx-copy-error | Dispatched when the clipboard write fails (permission denied, iframe restriction, etc.). The `error` detail contains the caught error for diagnostic use. |
| hx-copy | Dispatched after the value has been successfully written to the clipboard. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-copy-button-bg | transparent | Button background color. |
| --hx-copy-button-color | var(--hx-color-primary-500) | Icon and text color. |
| --hx-copy-button-border-color | transparent | Button border color. |
| --hx-copy-button-border-radius | var(--hx-border-radius-md) | Button border radius. |
| --hx-copy-button-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |

## CSS Parts

| Part | Description |
|------|-------------|
| button | The native button element. |
| icon | The icon container span wrapping the active icon slot. |
