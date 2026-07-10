---
"@helixui/library": patch
---

fix leaked JavaScript in the distributed `dist/css/` bundles for components whose `.styles.ts` exports multiple `css`` literals

The CSS bundle generator extracted a component's styles by taking the first `css`` marker and the last backtick in the file. For single-literal styles files this was correct, but files with several `css`` tagged literals had all the JavaScript between them — `export const … = css`` lines, tagged-literal terminators — swept into the emitted CSS. The published 3.11.0/3.11.1 tarballs shipped that leaked JS in eight files: the per-component `hx-table.css`, `hx-grid.css`, `hx-structured-list.css`, and `hx-toast.css`, plus the `helix-data.css`, `helix-feedback.css`, `helix-layout.css`, and `helix-all.css` bundles that include them.

- The extractor now locates every `css`` tagged literal (matching only when `css` is a standalone identifier, so `unsafeCSS`` and similar are ignored) and scans each one character-by-character to its own closing backtick, correctly handling escape sequences and `${ … }` interpolations. Bodies are concatenated in source order, so a multi-literal file emits all of its CSS and none of the surrounding JavaScript.
- `css:validate` gains a content gate that scans every `dist/css/*.css` file for leaked-JavaScript signatures (`css`` starts, `export`/`import` lines, arrow functions, `${` interpolations, tagged-literal terminators) and fails with `file:line` on any hit. It is wired into `build` and into a new `prepack` lifecycle script so a leaking tarball is refused by CI and by `npm pack`/publish instead of shipping.

Distribution-artifact only — no component source, public API, or token changes.
