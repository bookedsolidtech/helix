---
"@helixui/library": minor
---

add a `no-intercept` opt-out to hx-form and stop it cancelling native submission of host-owned forms.

hx-form no longer cancels a form the host owns. Its client-side submit bridge now decides from the SUBMITTING form: native submission proceeds untouched (no `hx-submit` / `hx-invalid`) when the submitting `<form>` declares its own non-empty `action` attribute, OR the submit button that triggered it carries a non-empty `formaction` (a multi-submit host form such as a Drupal Form API form's Save vs Preview buttons). A form with no own `action`/`formaction` — or an empty / whitespace-only one (e.g. templated Twig/Drupal markup binding a value that renders empty) — is the controlled case and is still bridged. Previously hx-form intercepted and cancelled every bubbling submit event, breaking host-owned and slotted forms.

The new reflected boolean attribute `no-intercept` makes hx-form a purely presentational wrapper: it runs no submit bridge at all, so any contained or slotted form submits natively. The intercept decision is exposed as a protected `shouldInterceptSubmit(e)` hook that subclasses can override to opt out cleanly without monkey-patching.
