---
'@helixui/library': patch
---

fix(hx-carousel): honor the documented `--hx-carousel-slide-width` and `--hx-carousel-gap` custom properties

Both CSS hooks were documented on `hx-carousel` but never read by the styles, so setting them had no effect.

- `--hx-carousel-slide-width` now overrides each slide's width, and the override participates in layout, navigation, and the navigation bounds. The per-page width derived from `slides-per-page` is preserved as the default.
- `--hx-carousel-gap` now sets the gap between slides on the slide track, defaulting to `0`.

The slide-width computation, the navigation transform, and the navigation bounds are all gap- and slide-width-aware: the computed per-page width is `calc((100% - (slides-per-page - 1) * var(--hx-carousel-gap, 0px)) / slides-per-page)`, so `slides-per-page` slides plus their gaps fill the viewport exactly without clipping; each navigation step advances by one slide's full outer extent (slide width + gap) so the active slide lands flush with the viewport's leading edge; and when a custom `--hx-carousel-slide-width` is set the maximum reachable index is measured from the rendered geometry, so navigation reaches the last slide without overshooting into blank space.

With neither property set, the rendered carousel, its navigation offsets, and its navigation bounds are byte-identical to before. The `@cssprop` annotations were corrected so the Custom Elements Manifest reflects the true defaults.
