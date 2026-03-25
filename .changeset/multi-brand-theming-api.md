---
'@helixui/library': minor
'@helixui/tokens': minor
---

add multi-brand theming api for hospital system white-label implementations

- `HelixBrandRegistry` singleton in `@helixui/tokens` allows consumers to register named brand token sets at application bootstrap
- brand registration validates all 22 required semantic tokens (primary and secondary color ramps) at registration time, throwing with a list of missing tokens on failure
- `hx-theme` gains a `brand` attribute that merges registered brand tokens on top of the base theme via adoptedStyleSheets replacement
- unregistered brands fall back gracefully to the base theme with a `console.warn`
- new exports: `HelixBrandRegistry`, `HelixBrandRegistryClass`, `REQUIRED_SEMANTIC_TOKENS`, `BrandTokenMap`, `BrandValidationResult`
