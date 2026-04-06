---
'@helixui/library': patch
---

fix(cem): add missing @csspart JSDoc annotations to hx-drawer, hx-slider, hx-time-picker

Resolves 14 CEM API Diff validation errors caused by CSS parts declared in
component templates (`part="..."`) that were not documented in `@csspart` JSDoc
blocks, causing the manifest to omit them from `cssParts`.

Components fixed:
- `hx-drawer`: added `@csspart close-btn` (visually-hidden close button rendered when `noHeader` is true)
- `hx-slider`: added `@csspart help-text` (help text element below the slider)
- `hx-time-picker`: added `@csspart field`, `@csspart error`, `@csspart help-text`
