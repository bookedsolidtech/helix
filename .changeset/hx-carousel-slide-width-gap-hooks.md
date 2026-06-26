---
'@helixui/library': patch
---

fix(hx-carousel): honor the documented `--hx-carousel-slide-width` and `--hx-carousel-gap` custom properties

Both CSS hooks were documented on `hx-carousel` but never read by the styles, so setting them had no effect.

- `--hx-carousel-slide-width` now overrides each slide's width. The per-page width derived from `slides-per-page` is preserved as the default (the computed value is written to the private `--_hx-carousel-computed-slide-width`, and the item resolves `width: var(--hx-carousel-slide-width, var(--_hx-carousel-computed-slide-width, 100%))`).
- `--hx-carousel-gap` now sets the gap between slides on the slide track, defaulting to `0`.

With neither property set, the rendered carousel is unchanged. The `@cssprop` annotations were corrected so the Custom Elements Manifest reflects the true defaults.
