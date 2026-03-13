---
'@helixui/library': patch
---

Fix accessibility findings for hx-breadcrumb, hx-prose, hx-stack, hx-container, hx-copy-button

- hx-breadcrumb: Extract `_buildListItem` return type to named `JsonLdListItem` interface (BC-A01/P3-05 a11y)
- hx-stack: Document `role="presentation"` accessibility implications and consumer override pattern in JSDoc (P2-05 a11y)
- hx-container: Add accessibility section to component JSDoc clarifying layout-only semantic contract (P2-03 a11y)
- hx-copy-button: Document WCAG 2.5.8 touch target requirement for `sm` size variant in JSDoc (P3-01 a11y)
- hx-prose: `caption-side: top` and `p:first-child` lead selector removal already applied in previous pass; no further a11y changes needed in `.ts`
