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
```

Each tree-shake module exports a single `string` constant containing the
sanitized inline SVG markup.

## paintMode

`paintMode` is a first-class registry field that declares how a library's
glyphs are painted:

- `'fill'` — solid silhouettes (default; matches `helix`, `fa-free`)
- `'stroke'` — outline glyphs (e.g. Lucide, Phosphor Thin)
- `'mixed'` — per-glyph fill + stroke (e.g. Phosphor Duotone)

The formal AAA contrast harness measures rendered `<hx-icon>` color/background samples on the
audit story and records the verdict in `packages/hx-library/aaa-verdicts.json`. `paintMode`
is a registry hint that drives how a library's glyphs are painted (and how third-party
tooling can reason about them); the cert verdict itself comes from the rendered measurement,
not from `paintMode` dispatch.

## Attribution

Bundled icon libraries carry their own licenses. **Font Awesome Free Solid
icons are licensed under CC BY 4.0; attribution is required.** See
[`NOTICE.md`](./NOTICE.md) for the canonical attribution text covering the
bundled libraries (the file is an attribution / license disclosure, not an
asset-level inventory — see the `helix` / `fa-free` library directories
under `dist/` for the actual glyph filenames).

## License

MIT — see the repository root.
