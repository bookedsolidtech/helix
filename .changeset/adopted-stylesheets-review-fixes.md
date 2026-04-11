---
'@helixui/library': patch
---

Address Tier 2 code review findings for adopted stylesheets

- Fix TOCTOU race: set idempotency marker before stylesheet adoption
- Use `lightTokenCss` from `@helixui/tokens` instead of mapping `tokenEntries` (tree-shaking)
- Switch document marker from string property to `Symbol.for('hx-tokens-adopted')`
- Add try/catch for graceful degradation if `adoptedStyleSheets` assignment fails
- Deprecate `mergeTokenStyles` utility (superseded by document-level token adoption)
