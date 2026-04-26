---
'@helixui/tokens': patch
'@helixui/library': patch
'@helixui/react': patch
---

color contrast fixes — sub-3:1 UI-floor failures across light + dark

Fixes three architectural contrast bugs that landed below WCAG 1.4.11's 3:1
non-text floor in the precision-cool palette (3.2.0/3.2.1):

- `color.border.strong` — light mode rebound from `neutral-400` (2.85:1 on
  white) to `neutral-500` (4.63:1). Affected every form-control border across
  the library (text input, select, checkbox, radio, switch track, file
  upload, side-nav). Dark mode flips to `neutral-400` (6.27:1 on dark
  surface.default) — the flip preserves the cross-mode parity contract for
  outline-button border tests.

- `color.focus-ring` + `focus.ring-color` — light mode rebound from
  `primary-400` (2.45:1 on white) to `primary-600` (5.82:1). Affected every
  outline-style focus indicator drawn at full opacity (hx-link, hx-text-input
  border-flip, hx-tab, hx-alert close, etc.). Dark mode keeps `primary-400`
  (7.27:1 on dark surface) via the existing override.

- `action.primary.bg-inverted-rest` (new token) — splits the inverted-mode
  primary-button bg from `action.primary.bg` so dark mode can flip the
  inverted fill independently. surface.inverse is mode-flipped (dark in
  light, light in dark); without the split, dark inverted primary
  rendered primary-500 on light at 2.94:1. New dark override pins the
  inverted-rest bg at primary-600 (4.97:1 on light surface.inverse).

- `dark.color.border.on-dark-{strong,default,subtle}` — added overrides so
  outline/focus-ring affordances drawn on the now-light surface.inverse stay
  visible in dark mode (overlay-white-* on light surface ≈ 1.1:1, invisible).
  Flipped to overlay-black-* (3.84:1 strong / proportional alphas for
  default/subtle).

- Inline fallback hex values updated across 24 component `.styles.ts` files
  to track the new primitive resolutions (`#6ab1b1`→`#0f7078` for focus,
  `#8e9c98`→`#66787b` for border-strong) — keeps the inline-fallback parity
  invariant intact.

Three new entries on the contrast regression matrix gate the fixes
permanently in CI.
