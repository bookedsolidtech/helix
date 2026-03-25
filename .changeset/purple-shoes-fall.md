---
'@helixui/library': minor
---

add light dom style injection patterns for drupal and non-shadow-dom consumers

introduces `injectLightStyles`, `generateScopedSelectors`, `SheetManager`, and `adoptedStylesheetRegistry` utilities plus the `<hx-style-scope>` wrapper component. enables slotted content in drupal twig templates to receive component typography and spacing styles via scoped `[data-hx-styled]` selectors with single-stylesheet-per-component-type deduplication.
