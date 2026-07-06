---
"@helixui/library": minor
---

Reflect the `href` property to the host `href` attribute on `hx-button`, `hx-link`, and `hx-icon-button`.

Previously `href` was set-only from the attribute side: assigning `element.href` via JavaScript updated the rendered internal anchor but left the host element's `href` attribute untouched, so attribute-based CSS selectors (`[href]`) and DOM queries (`getAttribute('href')`) could not observe a property-assigned value. With reflection enabled, a property write now mirrors to the host attribute, making the host `href` a stable, observable interop surface for external scripts that operate on attributes rather than reaching into shadow DOM. This matches the already-reflected `variant` and `disabled` properties on these atoms. Setting `href` to an empty/undefined value clears the attribute. Attribute-set usage is unchanged.
