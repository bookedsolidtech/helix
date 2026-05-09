# @helixui/icons

Icon registry and curated icon libraries for the HELiX enterprise healthcare
web component library.

## Status

| Phase | Scope                                                | Status      |
| ----- | ---------------------------------------------------- | ----------- |
| 1     | Package scaffold, exports map, type surface          | Done        |
| 2     | Registry runtime (`registerIconLibrary` and friends) | Done        |
| 3     | `helix` + `fa-free` libraries with auto-registration | Done        |
| 4     | `<hx-icon>` upgrade in `@helixui/library` + P0 cert  | In progress |
| 5     | Internal SVG migration, recert, public release       | Planned     |

## Why a registry

`<hx-icon>` is purely a renderer. Resolving icon names to SVG payloads is
delegated to a registry of named libraries. This separation lets consumers:

- Use the bundled `helix` (original glyphs, MIT) and `fa-free` (Font Awesome
  Free Solid v7, CC BY 4.0) libraries out of the box.
- Register custom libraries — e.g. Font Awesome Pro Medical — without
  modifying or rebuilding `@helixui/library`.
- Tree-shake to a single icon when bundle budget matters
  (`@helixui/icons/tree-shake/helix/check`).

The public registry API is wire-compatible with Shoelace's
`registerIconLibrary()` contract, so existing patterns and snippets transfer
without translation.

## Bundled libraries

Importing the package triggers auto-registration of two libraries:

| Library    | Glyphs | Source                                     | License    |
| ---------- | ------ | ------------------------------------------ | ---------- |
| `helix`    | 32     | Original HELiX glyphs                      | MIT        |
| `fa-free`  | 1900+  | Font Awesome Free Solid v7.x (Fonticons)   | CC BY 4.0  |

Both ship with `paintMode: 'fill'` and `spriteSheet: true` — they resolve
through pre-built sprite sheets in the package's `dist/`.

```ts
import '@helixui/icons';
// `helix` and `fa-free` are now both registered.
```

## Custom libraries

Register a custom library (e.g. Font Awesome Pro Medical):

```ts
import { registerIconLibrary } from '@helixui/icons';

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
<hx-icon library="fa-pro-medical" name="stethoscope"></hx-icon>
```

## Tree-shake imports

For bundle-sensitive applications, import a single glyph:

```ts
import { check } from '@helixui/icons/tree-shake/helix/check';
import { stethoscope } from '@helixui/icons/tree-shake/fa-free/solid/stethoscope';
```

Each tree-shake module exports a single `string` constant containing the
sanitized inline SVG markup.

## paintMode

`paintMode` is a first-class registry field that declares how a library's
glyphs are painted:

- `'fill'` — solid silhouettes (default; matches `helix`, `fa-free`)
- `'stroke'` — outline glyphs (e.g. Lucide, Phosphor Thin)
- `'mixed'` — per-glyph fill + stroke (e.g. Phosphor Duotone)

The `<hx-icon>` AAA contrast harness in Phase 4 dispatches per `paintMode`,
so libraries that declare the correct mode get the right measurement model
without consumer intervention.

## Attribution

Bundled icon libraries carry their own licenses. **Font Awesome Free Solid
icons are licensed under CC BY 4.0; attribution is required.** See
[`NOTICE.md`](./NOTICE.md) for the canonical attribution text and the full
list of bundled assets.

## License

MIT — see the repository root.
