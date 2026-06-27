---
"@helixui/library": minor
---

make hx-form a pure Light-DOM wrapper: add a `no-intercept` opt-out, stop cancelling host-owned form submission, and stop rendering its own `<form>`.

hx-form no longer cancels a form the host owns. Its client-side submit bridge decides from the SUBMITTING form: native submission proceeds untouched (no `hx-submit` / `hx-invalid`) when the submitting `<form>` declares its own non-empty `action` attribute, OR the submit button that triggered it carries a non-empty `formaction` (a multi-submit host form such as a Drupal Form API form's Save vs Preview buttons). A form with no own `action`/`formaction` is the controlled case and is bridged (validated + `hx-submit`/`hx-invalid`), scoped to that form's controls (honoring `form="id"` association). Previously hx-form intercepted and cancelled every bubbling submit event, breaking host-owned and slotted forms.

The new reflected boolean attribute `no-intercept` makes hx-form a purely presentational wrapper: it runs no submit bridge at all. The intercept decision is exposed as a protected `shouldInterceptSubmit(e)` hook that subclasses can override.

BEHAVIOR CHANGE: hx-form is now a pure Light-DOM wrapper and NO LONGER renders its own `<form>` in any mode. The consumer/host provides the actual `<form>` (a Drupal/Marketo host form, or an action-less `<form>` slotted for controlled behavior). The `action` property (and the now-inert `method`/`name`/`enctype`) is `@deprecated` and retained only for compatibility — it has no rendering effect; posting is owned by the consumer's `<form>`. A consumer that relied on hx-form to render a `<form>` for them must now provide their own `<form>` (loose controls with no `<form>` no longer submit). This was already the de facto reality: the Light-DOM `<slot>` never projected slotted controls into the rendered wrapper, so that `<form>` never owned them.
