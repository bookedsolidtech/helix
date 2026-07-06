---
"@helixui/library": patch
---

Remove the dangling `sideEffects` entry for `./dist/utilities/document-token-adoption.js`, a file that is never emitted. The `dist/utilities/` directory ships type declarations only; the module's runtime is bundled into `dist/index.js`. The document-token-adoption side effect is preserved via `./dist/index.js`, which is already listed in `sideEffects`, so tree-shaking behavior is unchanged — this only stops the published `package.json` from referencing a build artifact that does not exist.
