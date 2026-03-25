# HX Dialog

A modal and non-modal dialog component built on the native HTML `<dialog>` element.
Provides focus trapping, backdrop interaction, keyboard navigation, and full
ARIA labelling for enterprise healthcare accessibility requirements.

## Usage

```twig
{% include 'helix:hx-dialog' with {
  open: false,
  modal: true,
  closeOnBackdrop: true,
  heading: '',
  variant: 'dialog',
  description: '',
  closeLabel: 'Close dialog',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| open | boolean | false | Controls whether the dialog is open. |
| modal | boolean | true | When true, renders as a modal dialog with a backdrop and focus trap.
When false, renders as a non-modal dialog. |
| closeOnBackdrop | boolean | true | When true, clicking the backdrop closes the dialog. |
| heading | string |  | Text content for the dialog heading. Used as the accessible label via aria-labelledby. |
| variant | object | dialog | ARIA role variant. Use `'alertdialog'` for urgent dialogs requiring immediate attention
(e.g., drug interaction warnings, critical lab alerts). Defaults to `'dialog'`. |
| description | string |  | Optional description text linked to the dialog via `aria-describedby`.
When provided, screen readers will announce this text when the dialog receives focus.
Recommended for dialogs that surface critical clinical information. |
| closeLabel | string | Close dialog | Accessible label for the close button. Override for localized text. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for the dialog body content. |
| header | Slot for custom header content. When provided, replaces the built-in heading. |
| footer | Slot for action buttons or footer content. |

## Events

| Event | Description |
|-------|-------------|
| hx-open | Fired when the dialog opens. |
| hx-close | Fired when the dialog closes for any reason. |
| hx-cancel | Fired when the dialog is dismissed via Escape key or cancel action. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-dialog-bg | var(--hx-color-neutral-0) | Dialog background color. |
| --hx-dialog-color | var(--hx-color-neutral-900) | Dialog text color. |
| --hx-dialog-border-radius | var(--hx-border-radius-lg) | Dialog corner radius. |
| --hx-dialog-shadow | var(--hx-shadow-xl) | Dialog box shadow. |
| --hx-dialog-width | 32rem | Dialog width. |
| --hx-dialog-backdrop-color | var(--hx-color-neutral-900) | Backdrop overlay color. |
| --hx-dialog-backdrop-opacity | 0.5 | Backdrop overlay opacity (set to 0 to hide; note that opacity:0 makes the backdrop invisible but still present in the layout — use pointer-events carefully if you need a fully non-blocking backdrop). |
| --hx-dialog-header-padding | - | Padding inside the dialog header. |
| --hx-dialog-header-border-color | var(--hx-color-neutral-200) | Header bottom border color. |
| --hx-dialog-heading-color | var(--hx-color-neutral-900) | Heading text color. |
| --hx-dialog-body-padding | - | Padding inside the dialog body. |
| --hx-dialog-footer-padding | - | Padding inside the dialog footer. |
| --hx-dialog-footer-border-color | var(--hx-color-neutral-200) | Footer top border color. |

## CSS Parts

| Part | Description |
|------|-------------|
| dialog | The inner container div that holds the dialog content. |
| backdrop | The non-modal backdrop overlay element. |
| header | The header region containing the heading and header slot. |
| close-button | The built-in close button in the dialog header. |
| body | The scrollable body region containing the default slot. |
| footer | The footer region containing the footer slot. |
