---
"@helixui/library": minor
---

Add a WRAPPED (slotted) mode to `hx-image` alongside its existing OWNED (attribute-driven) mode, making the component a framing/style/enhancement layer over BOTH its own responsive image and consumer-supplied slotted media.

The mode is selected automatically and is fully additive — OWNED mode is unchanged and back-compatible:

- **OWNED mode** (unchanged): with `src` (and optional `srcset`/`sizes`) set and no default-slot content, `hx-image` renders and owns its own responsive `<img>`, exactly as before.
- **WRAPPED mode** (new): when the default (unnamed) slot has assigned element(s), `hx-image` renders no `<img>` of its own and instead frames the slotted media. This lets consumers slot a plain `<img>` or full responsive-image markup (`<picture><source><img></picture>`) and still get the component's framing and enhancement layer.

Both modes share the same figure framing (`ratio`/`fit`/`rounded`/`width`/`height`), the caption slot, and the error/fallback slot. In WRAPPED mode:

- The framed figure sizes directly-slotted `<img>`/`<picture>` via shadow `::slotted()` rules, and sizes the `<img>` nested inside a slotted `<picture>` via a scoped, deduplicated light-DOM stylesheet (stamped with `data-hx-styled="hx-image"`), so responsive-image markup fills the frame. This is SSR-safe (a no-op without a DOM).
- `hx-load`/`hx-error` are re-emitted (composed + bubbling) from the resolved slotted `<img>` — whether directly slotted or nested inside a `<picture>` — with listeners cleaned up on every slot change and on disconnect to avoid leaks or double-dispatch.
- On a slotted-image error the component swaps to the shared error state and shows the `fallback` slot. `fallback-src` does not apply in WRAPPED mode, since the consumer owns the media.
- The slotted media owns its own `alt`; the OWNED `alt`-required warning is not imposed. Providing both `src` and slotted media logs a development warning and resolves to WRAPPED.

A new default `@slot` is documented for the Custom Elements Manifest.
