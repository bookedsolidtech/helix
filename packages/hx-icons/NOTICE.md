# NOTICE — Third-Party Attributions

This package redistributes icon assets from third-party sources under their
respective licenses. The MIT license at the repository root covers the
`@helixui/icons` registry and build code only — not the icon assets.

## Font Awesome Free (bundled as `fa-free` library)

- **Version**: `@fortawesome/fontawesome-free@7.2.0`
- **Style bundled**: Solid only (1900+ glyphs)
- **Icons (CC BY 4.0)**: https://creativecommons.org/licenses/by/4.0/
  - Attribution: Font Awesome Free by Fonticons, Inc. — https://fontawesome.com
- **Brand icons** (subject to Font Awesome's terms): https://fontawesome.com/license/free

The `fa-free` library resolves through the pre-built sprite at
`dist/fa-free-solid.svg`, generated at build time from the upstream package.
To use FA Pro Medical or any other Font Awesome paid tier, register a custom
library — see `apps/docs/src/content/docs/icons/fa-pro.mdx`.

## Feather Icons (bundled as `feather` library)

- **Version**: `feather-icons@4.29.2`
- **Glyphs bundled**: 287
- **License**: MIT — https://opensource.org/license/mit
  - SPDX-License-Identifier: `MIT`
  - Copyright (c) 2013-2023 Cole Bemis
  - Upstream project: Feather Icons — https://github.com/feathericons/feather

The `feather` library resolves through the pre-built sprite at
`dist/feather.svg`, generated at build time from the upstream package. Feather
glyphs are stroke-paint outlines (`paintMode: 'stroke'`); the bundled sprite
redistributes their glyph geometry, which is what makes the MIT attribution
above legally required.

## Lucide (bundled as `lucide` library)

- **Version**: `lucide-static@1.21.0`
- **Glyphs bundled**: ~1,986
- **License**: ISC — https://opensource.org/license/isc-license-txt
  - SPDX-License-Identifier: `ISC`
  - Copyright (c) 2026 Lucide Icons and Contributors
  - Upstream project: Lucide — https://github.com/lucide-icons/lucide

The `lucide` library resolves through the pre-built sprite at `dist/lucide.svg`,
generated at build time from the upstream package. Lucide glyphs are stroke-paint
outlines (`paintMode: 'stroke'`); the bundled sprite redistributes their glyph
geometry, which is what makes the ISC attribution above legally required. A
subset of Lucide glyphs are derived from the Feather project and carry Feather's
MIT terms (Copyright (c) 2013-present Cole Bemis); see the upstream
`lucide-static` LICENSE file for the per-glyph list.

## Helix glyphs (bundled as `helix` library)

The HELiX `helix` library glyphs are **original work** drawn for this project,
MIT-licensed under the HELiX project license. They are not redistributed from
any third-party set.

For visual consistency the silhouette shape language draws on free,
permissively licensed reference sets — most directly Material Symbols Filled
(Apache 2.0, https://fonts.google.com/icons) — but every path was redrawn
for the helix coordinate system. No upstream SVG markup is copied verbatim.

## Build-time only dependencies

The published package does **not** depend on `@fortawesome/fontawesome-free`,
`feather-icons`, or `lucide-static` at runtime. They are `devDependencies`-only;
sprites and tree-shake exports are generated during `pnpm run build` and shipped
pre-rendered in `dist/`.
