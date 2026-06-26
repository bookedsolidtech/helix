---
'@helixui/library': patch
---

fix(hx-carousel): honor the documented `--hx-carousel-slide-width` and `--hx-carousel-gap` custom properties

Both CSS hooks were documented on `hx-carousel` but never read by the styles, so setting them had no effect.

- `--hx-carousel-slide-width` now overrides each slide's width, and the override participates in layout and navigation. The per-page width derived from `slides-per-page` is preserved as the default.
- `--hx-carousel-gap` now sets the gap between slides on the slide track, defaulting to `0`.

The slide-width computation and the navigation transform are gap- and slide-width-aware: the computed per-page width is `calc((100% - (slides-per-page - 1) * var(--hx-carousel-gap, 0px)) / slides-per-page)`, so `slides-per-page` slides plus their gaps fill the viewport exactly without clipping, and each navigation step advances by one slide's full outer extent (slide width + gap).

When a custom `--hx-carousel-slide-width` produces a genuine horizontal "peek" (the visible slides do not exactly fill the viewport), slide selection is decoupled from track scroll: every slide stays reachable via the previous/next buttons, pagination dots, drag/swipe, autoplay, `Home`/`End`, and `goTo()`, while the track translate is clamped to the measured maximum scroll so a near-end slide saturates at the trailing edge with no blank space. Selection bounds, the active pagination dot, the prev/next disabled states, and the ARIA "slide X of N" announcement all reflect the true active index. Runtime changes to `--hx-carousel-gap` / `--hx-carousel-slide-width` (theme toggles, media queries) are re-measured on the next navigation, switching between the peek and legacy page models in either direction as the layout crosses the exact-fill boundary, so the layout, transform, and bounds stay in sync. Exact-fill widths and vertical carousels (where the width hook is cross-axis) keep the legacy page model.

With neither property set, the rendered carousel, its navigation offsets, its selection bounds, the transform, the disabled states, and the ARIA output are byte-identical to before. The `@cssprop` annotations were corrected so the Custom Elements Manifest reflects the true defaults.
