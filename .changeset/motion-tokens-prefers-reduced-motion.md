---
'@helixui/tokens': minor
'@helixui/library': minor
---

feat(motion): add motion tokens and prefers-reduced-motion support

Adds `--hx-easing-decelerate` and `--hx-easing-accelerate` design tokens to `@helixui/tokens`.

Adds a `motion` attribute to `hx-theme` accepting `"full"` (default), `"reduced"`, and `"none"`. When `motion="reduced"` or `"none"`, all duration tokens collapse to `0ms` and all easing tokens resolve to `linear`. When `motion="full"`, the OS `prefers-reduced-motion: reduce` media query is respected automatically — the same token overrides are applied when the OS preference is active.

Also exports a `MotionMode` type and a `effectiveMotion` getter from `hx-theme`.

Updated `hx-spinner` and `hx-drawer` to consume easing tokens (`--hx-easing-in-out` and `--hx-easing-default`) rather than hardcoded `ease-in-out` and `ease` values, ensuring the motion token cascade reaches these components.
