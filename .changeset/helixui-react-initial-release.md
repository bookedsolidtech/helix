---
'@helixui/react': minor
---

Add `@helixui/react` package with auto-generated React wrappers for all 98 HELiX web components.

Wrappers are generated from `custom-elements.json` via `scripts/generate-react-wrappers.ts` using `@lit/react` `createComponent()`. Each wrapper includes `'use client'` for Next.js 15 App Router compatibility, full TypeScript prop types derived from CEM declarations, and React-style event callbacks (`onHxClick`, `onHxInput`, `onHxChange`, etc.).

Tree-shakeable: each component is a separate entry point so importing `HxButton` does not bundle all 98 components.
