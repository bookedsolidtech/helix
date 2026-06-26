---
'@helixui/library': patch
---

fix(hx-carousel): honor the documented `--hx-carousel-slide-width` and `--hx-carousel-gap` custom properties

Both CSS hooks were documented on `hx-carousel` but never read by the styles, so setting them had no effect.

- `--hx-carousel-slide-width` now overrides each slide's width, and the override participates in both layout and navigation. The per-page width derived from `slides-per-page` is preserved as the default.
- `--hx-carousel-gap` now sets the gap between slides on the slide track, defaulting to `0`.

Both the slide-width computation and the navigation transform are gap- and slide-width-aware: the computed per-page width is `calc((100% - (slides-per-page - 1) * var(--hx-carousel-gap, 0px)) / slides-per-page)`, so `slides-per-page` slides plus their gaps fill the viewport exactly without clipping, and each navigation step advances by one slide's full outer extent (slide width + gap) so the active slide lands flush with the viewport's leading edge.

With neither property set, the rendered carousel and its navigation offsets are byte-identical to before. The `@cssprop` annotations were corrected so the Custom Elements Manifest reflects the true defaults.
