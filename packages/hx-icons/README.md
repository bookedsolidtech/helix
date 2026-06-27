# @helixui/icons

Icon registry and curated icon libraries for the HELiX enterprise healthcare
web component library.

## Status

| Phase | Scope                                                | Status |
| ----- | ---------------------------------------------------- | ------ |
| 1     | Package scaffold, exports map, type surface          | Done   |
| 2     | Registry runtime (`registerIconLibrary` and friends) | Done   |
| 3     | `helix` + `fa-free` libraries with auto-registration | Done   |
| 4     | `<hx-icon>` upgrade in `@helixui/library` + P0 cert  | Done — hx-icon ships in 3.9.0 with AAA verdicts recorded in `packages/hx-library/aaa-verdicts.json` |
| 5     | Internal SVG migration + 1.0.0 public release        | Done — `@helixui/icons` 1.0.0 published, internal components consume the registry |

## Why a registry

`<hx-icon>` is purely a renderer. Resolving icon names to SVG payloads is
delegated to a registry of named libraries. This separation lets consumers:

- Use the bundled `helix` (original glyphs, MIT), `fa-free` (Font Awesome
  Free Solid v7, CC BY 4.0), `feather` (Feather Icons, MIT), and `lucide`
  (Lucide, ISC) libraries out of the box.
- Register custom libraries — e.g. Font Awesome Pro Medical — without
  modifying or rebuilding `@helixui/library`.
- Tree-shake to a single icon when bundle budget matters
  (`@helixui/icons/tree-shake/helix/check`).

The public registry API is wire-compatible with Shoelace's
`registerIconLibrary()` contract, so existing patterns and snippets transfer
without translation.

## Bundled libraries

Importing the package triggers auto-registration of four libraries:

| Library   | Glyphs | Source                                   | License   | Paint    |
| --------- | ------ | ---------------------------------------- | --------- | -------- |
| `helix`   | 32     | Original HELiX glyphs                    | MIT       | `fill`   |
| `fa-free` | 1900+  | Font Awesome Free Solid v7.x (Fonticons) | CC BY 4.0 | `fill`   |
| `feather` | 287    | Feather Icons (Cole Bemis)               | MIT       | `stroke` |
| `lucide`  | ~1986  | Lucide (Lucide Contributors)             | ISC       | `stroke` |

All four set `spriteSheet: true` — they resolve through pre-built sprite sheets
in the package's `dist/`. `helix` and `fa-free` are `paintMode: 'fill'` solid
silhouettes; `feather` and `lucide` are `paintMode: 'stroke'` outlines (see
[paintMode](#paintmode) below).

```ts
import '@helixui/icons';
// `helix`, `fa-free`, `feather`, and `lucide` are now all registered.
```

```html
<!-- A stroke-paint glyph from each new library -->
<hx-icon library="feather" name="activity"></hx-icon>
<hx-icon library="lucide" name="heart-pulse"></hx-icon>
```

`feather` and `lucide` glyphs paint with `stroke: currentColor` (no fill) and
honor the `--hx-icon-stroke-width` token (default `2`):

```html
<!-- Override the stroke width for a hairline feather glyph -->
<hx-icon
  library="feather"
  name="activity"
  style="--hx-icon-stroke-width: 1.5;"
></hx-icon>
```

## Custom libraries

Register a custom library (e.g. Font Awesome Pro Medical):

```ts
import { registerIconLibrary } from '@helixui/icons';

// External resolvers must be allow-listed by the consumer page via the
// `allowed-origins` attribute on every <hx-icon> that targets the
// library (or via the global allowlist on the page-level <hx-icon>
// default), or the icon fetch will be blocked by the registry's
// origin guard.
registerIconLibrary('fa-pro-medical', {
  resolver: (name) =>
    `https://kit.fontawesome.com/your-kit/icons/medical/${name}.svg`,
  mutator: (svg) => {
    svg.removeAttribute('fill');
    svg.setAttribute('aria-hidden', 'true');
  },
  paintMode: 'fill',
});
```

```html
<hx-icon
  library="fa-pro-medical"
  name="stethoscope"
  allowed-origins="https://kit.fontawesome.com"
></hx-icon>
```

## Tree-shake imports

For bundle-sensitive applications, import a single glyph:

```ts
import { check } from '@helixui/icons/tree-shake/helix/check';
import { stethoscope } from '@helixui/icons/tree-shake/fa-free/solid/stethoscope';
import { activity } from '@helixui/icons/tree-shake/feather/activity';
import { heartPulse } from '@helixui/icons/tree-shake/lucide/heart-pulse';
```

Each tree-shake module exports a single `string` constant containing the
sanitized inline SVG markup.

### Import paths

Every bundled library exposes the same export surface in `package.json`:

| Library   | Library side-effect import | Tree-shake glyph import                | Sprite sheet                       |
| --------- | -------------------------- | -------------------------------------- | ---------------------------------- |
| `helix`   | `@helixui/icons/helix`     | `@helixui/icons/tree-shake/helix/*`    | `@helixui/icons/dist/helix.svg`    |
| `fa-free` | `@helixui/icons/fa-free`   | `@helixui/icons/tree-shake/fa-free/solid/*` | `@helixui/icons/dist/fa-free-solid.svg` |
| `feather` | `@helixui/icons/feather`   | `@helixui/icons/tree-shake/feather/*`  | `@helixui/icons/dist/feather.svg`  |
| `lucide`  | `@helixui/icons/lucide`    | `@helixui/icons/tree-shake/lucide/*`   | `@helixui/icons/dist/lucide.svg`   |

Importing a library side-effect module (e.g. `@helixui/icons/feather`)
registers only that single library — useful when you want `feather` and
`lucide` without pulling `fa-free` into the bundle.

## paintMode

`paintMode` is a first-class registry field that declares how a library's
glyphs are painted:

- `'fill'` — solid silhouettes (default; matches `helix`, `fa-free`)
- `'stroke'` — outline glyphs painted with `stroke: currentColor` and no fill
  (matches the bundled `feather` and `lucide`; also e.g. Phosphor Thin). Stroke
  libraries honor the `--hx-icon-stroke-width` token (default `2`).
- `'mixed'` — per-glyph fill + stroke (e.g. Phosphor Duotone)

The formal AAA contrast harness measures rendered `<hx-icon>` color/background samples on the
audit story and records the verdict in `packages/hx-library/aaa-verdicts.json`. `paintMode`
is a registry hint that drives how a library's glyphs are painted (and how third-party
tooling can reason about them); the cert verdict itself comes from the rendered measurement,
not from `paintMode` dispatch.

## Attribution

Bundled icon libraries carry their own licenses. **Font Awesome Free Solid
icons are licensed under CC BY 4.0; attribution is required.** `feather` is
MIT (© Cole Bemis) and `lucide` is ISC (© Lucide Icons and Contributors). See
[`NOTICE.md`](./NOTICE.md) for the canonical attribution text covering all
bundled libraries (the file is an attribution / license disclosure, not an
asset-level inventory — see the per-library directories under `dist/` for the
actual glyph filenames).

## License

MIT — see the repository root.
