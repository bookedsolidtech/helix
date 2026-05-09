# @helixui/icons

Icon registry and curated icon libraries for the HELiX enterprise healthcare
web component library.

> **Phase 1 scaffold — registry implementation pending.**
>
> This package currently exposes type definitions and stub functions that
> throw with a `Phase 2` marker. Calling them from application code is a
> bug; the runtime registry lands in the next phase. Type imports are safe.

## Status

| Phase | Scope                                                | Status         |
| ----- | ---------------------------------------------------- | -------------- |
| 1     | Package scaffold, exports map, type surface          | In progress    |
| 2     | Registry runtime (`registerIconLibrary` and friends) | Planned        |
| 3     | `helix` + `fa-free` libraries with auto-registration | Planned        |
| 4     | `<hx-icon>` upgrade in `@helixui/library` + P0 cert  | Planned        |
| 5     | Internal SVG migration, recert, public release       | Planned        |

## Why a registry

`<hx-icon>` is purely a renderer. Resolving icon names to SVG payloads is
delegated to a registry of named libraries. This separation lets consumers:

- Use the bundled `helix` (original glyphs, MIT) and `fa-free` (Font Awesome
  Free Solid v7, CC BY 4.0) libraries out of the box.
- Register custom libraries — e.g. Font Awesome Pro Medical — without
  modifying or rebuilding `@helixui/library`.
- Tree-shake to a single icon when bundle budget matters
  (`@helixui/icons/tree-shake/helix/heart`).

The public registry API is wire-compatible with Shoelace's
`registerIconLibrary()` contract, so existing patterns and snippets transfer
without translation.

## Usage (Phase 2 onward)

```ts
import { registerIconLibrary } from '@helixui/icons';

registerIconLibrary('fa-pro-medical', {
  resolver: (name) =>
    `https://kit.fontawesome.com/your-kit/icons/medical/${name}.svg`,
  mutator: (svg) => {
    svg.removeAttribute('fill');
    svg.setAttribute('aria-hidden', 'true');
  },
});
```

```html
<hx-icon library="fa-pro-medical" name="stethoscope"></hx-icon>
```

## Attribution

Bundled icon libraries carry their own licenses. See [`NOTICE.md`](./NOTICE.md)
for the canonical attribution text — this package's MIT license covers the
registry code only, not the icon assets.

## License

MIT — see the repository root.
