# HX Code Snippet

A styled code block with optional copy button and max-lines truncation.
Supports block (`<pre><code>`) and inline (`<code>`) rendering modes.
No external syntax highlighting dependency — use the `language` attribute
as a hint for consumers integrating their own highlighter via slotted content.

## Usage

```twig
{% include 'helix:hx-code-snippet' with {
  language: '',
  inline: false,
  wrap: false,
  copyable: false,
  maxLines: 0,
  lineNumbers: false,
  labelCopy: 'Copy code',
  labelCopied: 'Copied!',
  labelShowMore: 'Show more',
  labelShowLess: 'Show less',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| language | string |  | Language hint for consumers to apply syntax highlighting.
Does not affect rendering directly; it is applied as a `language-*` class
on the `<code>` element so external highlighters can target it. |
| inline | boolean | false | When true, renders as an inline `<code>` element instead of a `<pre><code>` block. |
| wrap | boolean | false | When true, enables word-wrap in block mode. |
| copyable | boolean | false | When true, shows a copy-to-clipboard button. Add the `copyable` attribute to enable it. |
| maxLines | number | 0 | Maximum number of lines to display before showing a "Show more" button.
Set to 0 (default) to disable truncation. |
| lineNumbers | boolean | false | When true, prepends line numbers to each displayed line in block mode.
Line numbers are rendered as `aria-hidden` spans so screen readers skip them. |
| labelCopy | string | Copy code | Label for the copy button in idle state. |
| labelCopied | string | Copied! | Label for the copy button after successful copy. |
| labelShowMore | string | Show more | Label for the expand button when content is collapsed. |
| labelShowLess | string | Show less | Label for the expand button when content is expanded. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Code content as plain text. Note: HTML markup in slot content will be stripped — only text content is extracted. Pre-highlighted HTML is not supported. |

## Events

| Event | Description |
|-------|-------------|
| hx-copy | Dispatched when the copy button is clicked. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-code-snippet-bg | var(--hx-color-neutral-900,#0f172a) | Background color. |
| --hx-code-snippet-color | var(--hx-color-neutral-100,#f1f5f9) | Text color. |
| --hx-code-snippet-font-family | var(--hx-font-family-mono,monospace) | Font family. |
| --hx-code-snippet-font-size | var(--hx-font-size-sm,0.875rem) | Font size. |
| --hx-code-snippet-border-radius | var(--hx-border-radius-md,0.375rem) | Border radius. |
| --hx-code-snippet-padding | var(--hx-space-4,1rem) | Inner padding (block mode). |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The outermost container (block: `<div>`, inline: `<code>`). |
| header | The header bar containing the copy button (block mode only). |
| code | The `<code>` element containing the content. |
| copy-button | The copy-to-clipboard button. |
| expand-button | The "Show more / Show less" button. |
