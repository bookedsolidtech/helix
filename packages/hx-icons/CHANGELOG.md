# @helixui/icons

## 2.0.0 [DEPRECATED]

Mistakenly bumped to MAJOR via a changeset metadata defect — the workspace package.json was at 1.0.0 as the initial-publish placeholder and a `major` changeset cascaded into a 2.0.0 version. The intended initial release is the **1.0.0** entry below; consumers should depend on `@helixui/icons@1.0.0`.

## 1.0.0

### Initial Release

- 723eec6: initial release of @helixui/icons — registry-pattern icon system for hx-icon.
  - public api wire-compatible with shoelace's `registerIconLibrary` / `unregisterIconLibrary` / `getIconLibrary` / `setBasePath` / `getBasePath`
  - two built-in libraries auto-registered on import:
    - `helix` — 32 curated fill-only system glyphs (mit). default sprite at `dist/helix.svg` + per-icon esm under `dist/tree-shake/helix/`
    - `fa-free` — 2,000-glyph fa free solid sprite (cc by 4.0). default sprite at `dist/fa-free-solid.svg` + per-icon esm under `dist/tree-shake/fa-free/solid/`
  - optional `paintMode` field per library: `'fill' | 'stroke' | 'mixed'` — a registry hint that documents the library's paint strategy (the formal AAA harness measures rendered icon color/background samples to produce verdicts; `paintMode` is not a cert-dispatch axis)
  - optional `mutator` hook lets registered libraries transform sanitized svg before injection
  - `iconLibraryAaaVerdict()` helper — exposes baked-in AAA verdicts for the two **built-in** libraries (`helix`, `fa-free`); third-party libraries return `undefined` unless they publish their own verdict evidence
  - aaa verdict baked for built-in libraries: both `helix` and `fa-free` pass non-text contrast 1.4.11 at minimum render size

  required peer dependency of `@helixui/library@^3.9.0`. install both together. consumers register additional libraries (font awesome pro, phosphor, heroicons, iconify, brand sprites) via `registerIconLibrary(name, options)`.

### Minor Changes

- 7b42779: aaa-cert hx-icon as p0; wire @helixui/icons registry resolution

  `<hx-icon>` resolves through the `@helixui/icons` registry. The component
  is P0 AAA self-certified for the applicable WCAG 2.2 AAA criteria measured
  by the formal audit harness, with supplemental **WCAG 1.4.11** non-text
  contrast evidence recorded in `packages/hx-icons/AAA-VERDICT.md`. The
  component ships a `library` attribute that defaults to `''` — registry
  resolution requires the consumer to set `library="fa-free"`,
  `library="helix"`, or another registered library explicitly. The lookup
  runs through `getIconLibrary()` and honors the optional library mutator
  hook (which runs AFTER security sanitization).

  Adds the `--hx-icon-stroke-width` semantic token (default `2`)
  consumed by stroke-paint and mixed-paint consumer libraries; the
  bundled `helix` and `fa-free` libraries are fill-only and ignore
  it.

  The formal AAA harness gains a `non-text-contrast-icon` check that
  measures rendered glyph contrast against the document background.
  `iconLibraryAaaVerdict()` from `@helixui/icons` exposes the
  per-library AAA verdict for both built-ins (`pass` across all three
  dimensions). `packages/hx-icons/AAA-VERDICT.md` publishes the full
  per-library evidence including borderline glyphs (`dot`, `dash`,
  `star-outline`) with recommended minimum render sizes.

  Existing `src` (inline-fetch) and `sprite-url` escape hatches are
  preserved unchanged.
