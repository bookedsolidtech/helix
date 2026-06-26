---
"@helixui/library": minor
---

add a `no-intercept` opt-out to hx-form and stop it cancelling host-owned form submission.

hx-form now scopes its client-side submit bridge so it never cancels a form it does not own. With hx-form's own `action` empty, a slotted form that declares its own non-empty `action` (a Drupal Form API form, a Marketo `mktoForm_*` form, etc.) submits natively and no `hx-submit` / `hx-invalid` is dispatched — previously hx-form intercepted and cancelled every bubbling submit event. A slotted form with no `action`, or an empty / whitespace-only `action` (e.g. templated markup binding an action that renders empty), is treated as the controlled case and is still bridged.

The new reflected boolean attribute `no-intercept` makes hx-form a purely presentational wrapper: it runs no submit bridge at all, so any contained or slotted form submits natively. The intercept decision is now exposed as a protected `shouldInterceptSubmit(e)` hook that subclasses can override to opt out cleanly without monkey-patching.
