---
'@helixui/library': minor
'@helixui/icons': minor
'@helixui/tokens': patch
---

aaa-cert hx-icon as p0; wire @helixui/icons registry resolution

`<hx-icon>` resolves through the `@helixui/icons` registry and is
AAA-certed (P0) per WCAG 2.2 + 1.4.11 (non-text contrast). The
component now ships a `library` attribute (default `'fa-free'`)
that resolves through `getIconLibrary()`, plus integration of the
optional library mutator hook (runs AFTER security sanitization).

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
