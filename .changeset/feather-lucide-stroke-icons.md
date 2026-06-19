---
'@helixui/library': minor
'@helixui/icons': minor
---

feat(hx-icon): add Feather and Lucide icon libraries with stroke-paint rendering

Registers `feather` (287 glyphs, MIT) and `lucide` (~1,986 glyphs, ISC) as built-in
stroke-paint icon libraries in `@helixui/icons`, shipped as CDN sprite sheets
(`dist/feather.svg`, `dist/lucide.svg`) and per-icon tree-shake modules
(`@helixui/icons/tree-shake/feather/*`, `.../lucide/*`).

`<hx-icon>` now reflects the resolved library's `paintMode` onto the rendered SVG and
paints stroke libraries with `fill: none; stroke: currentColor` and rounded caps/joins,
with stroke width driven by the existing `--hx-icon-stroke-width` token. Fill libraries
(`helix`, `fa-free`) are unchanged.

```html
<hx-icon library="feather" name="activity" label="Activity"></hx-icon>
<hx-icon library="lucide" name="heart" label="Favorite"></hx-icon>
```

Also hardens `<hx-icon>`: icon-library mutator output is now re-sanitized before render,
so a compromised or hostile library mutator cannot reintroduce `<script>`, `on*`
handlers, or `javascript:` payloads that the first sanitization pass stripped.
