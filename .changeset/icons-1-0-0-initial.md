---
'@helixui/icons': major
---

initial release of @helixui/icons — registry-pattern icon system for hx-icon.

- public api wire-compatible with shoelace's `registerIconLibrary` / `unregisterIconLibrary` / `getIconLibrary` / `setBasePath` / `getBasePath`
- two built-in libraries auto-registered on import:
  - `helix` — 32 curated fill-only system glyphs (mit). default sprite at `dist/helix.svg` + per-icon esm under `dist/tree-shake/helix/`
  - `fa-free` — 2,000-glyph fa free solid sprite (cc by 4.0). default sprite at `dist/fa-free-solid.svg` + per-icon esm under `dist/tree-shake/fa-free/solid/`
- optional `paintMode` field per library: `'fill' | 'stroke' | 'mixed'` for aaa harness dispatch
- optional `mutator` hook lets registered libraries transform sanitized svg before injection
- `iconLibraryAaaVerdict()` helper — query aaa validation state for any registered library
- aaa verdict baked for built-in libraries: both `helix` and `fa-free` pass non-text contrast 1.4.11 at minimum render size

required peer dependency of `@helixui/library@^3.9.0`. install both together. consumers register additional libraries (font awesome pro, phosphor, heroicons, iconify, brand sprites) via `registerIconLibrary(name, options)`.
