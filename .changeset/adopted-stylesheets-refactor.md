---
'@helixui/library': minor
---

Adopt design tokens at document level via `document.adoptedStyleSheets`

Removes redundant per-component `tokenStyles` from all 98 components' `static styles`.
Tokens are now adopted once at the document `:root` level, eliminating ~27,000 redundant
CSS custom property declarations per page and fixing `hx-theme` cascade override behavior.

- New utility: `ensureDocumentTokens()` in `src/utilities/document-token-adoption.ts`
- Auto-executes on first import — no consumer API change required
- SSR-safe with `typeof document` guard
- Multi-bundle safe via `document.__hx_tokens_adopted__` marker
- Added to `sideEffects` in package.json to prevent tree-shaking
- 16 dedicated tests covering idempotency, marker, CSS content, and preservation
