---
'@helixui/library': patch
---

fix(hx-carousel): honor `--hx-carousel-slide-width` / `--hx-carousel-gap` and correct navigation across orientation, gap, peek, and responsive transitions

Both CSS hooks were documented on `hx-carousel` but never read by the styles, so setting them had no effect.

- `--hx-carousel-slide-width` now overrides each slide's width, and the override participates in layout and navigation. The per-page width derived from `slides-per-page` is preserved as the default.
- `--hx-carousel-gap` now sets the gap between slides on the slide track, defaulting to `0`.

The slide-width computation and the navigation transform are gap- and slide-width-aware: the computed per-page width is `calc((100% - (slides-per-page - 1) * var(--hx-carousel-gap, 0px)) / slides-per-page)`, so `slides-per-page` slides plus their gaps fill the viewport exactly without clipping, and each navigation step advances by one slide's full outer extent (slide size + gap).

When a custom `--hx-carousel-slide-width` produces a genuine horizontal "peek" (the visible slides do not exactly fill the viewport), slide selection is decoupled from track scroll: every slide stays reachable via the previous/next buttons, pagination dots, drag/swipe, autoplay, `Home`/`End`, and `goTo()`, while the track translate is clamped to the measured maximum scroll so a near-end slide saturates at the trailing edge with no blank space. Selection bounds, the active pagination dot, the prev/next disabled states, and the ARIA "slide X of N" announcement all reflect the true active index. Runtime changes to `--hx-carousel-gap` / `--hx-carousel-slide-width` (theme toggles, media queries) and to the `slides-per-page` / `orientation` properties switch between the peek and legacy page models in either direction; the bounds re-derive reactively (a gap change resizes an internal observed sentinel, and `slides-per-page` / `orientation` changes are picked up in `updated()` — a `slides-per-page` change also re-syncs every slide's computed width so the per-item width and the transform step stay on the same value), so the prev/next disabled states update with no navigation required. Autoplay also re-derives bounds before deciding whether to wrap, so a carousel sitting at the old bound advances into newly-reachable slides instead of wrapping. Whenever the selection bound changes the active index is clamped back into range so the transform, dots, disabled states, and ARIA never desync; a resize or responsive recompute with no following navigation emits one `hx-slide-change` on the clamp (never during initial setup), and a navigation that coincides with a mode flip emits exactly one event for its destination — so hosts syncing thumbnails, counters, or analytics stay in sync.

When the whole track fits inside the viewport (narrow custom widths whose total is under the viewport, `slides-per-page` greater than the slide count, or a vertical carousel no taller than its viewport), the carousel is treated as a single static page: the maximum index is 0, the previous and next buttons are both disabled, the track translate is 0, pagination is omitted, and navigation is a no-op — so it never advertises slides the track cannot reveal.

Vertical carousels now navigate correctly. Previously a vertical step used a transform percentage relative to the track's full height (≈ all slides), so it jumped multiple slides per `next()`; vertical now navigates by a measured block-axis step (slide height + `row-gap`), reaches every slide, and clamps at the trailing edge with no blank space.

Horizontal default, gap-only, and exact-fill layouts run the legacy page model byte-for-byte (selection bounds, transform, disabled states, and ARIA unchanged). The `@cssprop` annotations were corrected so the Custom Elements Manifest reflects the true defaults.
