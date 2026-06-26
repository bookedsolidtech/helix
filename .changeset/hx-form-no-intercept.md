---
"@helixui/library": minor
---

add a `no-intercept` opt-out to hx-form and stop it cancelling host-owned form submission.

hx-form now scopes its client-side submit bridge so it never cancels a form it does not own. With hx-form's own `action` empty, a submission is treated as host-owned — left to submit natively with no `hx-submit` / `hx-invalid` dispatched — when the slotted form declares its own non-empty `action`, OR when the submit button that triggered it carries a non-empty `formaction` (multi-submit host forms such as a Drupal Form API form's Save vs Preview buttons). Previously hx-form intercepted and cancelled every bubbling submit event. A form with no `action`, or an empty / whitespace-only `action` and no submitter `formaction` (e.g. templated markup binding a value that renders empty), is treated as the controlled case and is still bridged.

The new reflected boolean attribute `no-intercept` makes hx-form a purely presentational wrapper: it runs no submit bridge at all, so any contained or slotted form submits natively. The intercept decision is now exposed as a protected `shouldInterceptSubmit(e)` hook that subclasses can override to opt out cleanly without monkey-patching.
