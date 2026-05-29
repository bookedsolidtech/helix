---
'@helixui/library': minor
---

WCAG 2.2 AAA — md interactive control target sizes + focus-appearance cert corrections.

`md`-size interactive controls (`hx-icon-button`, `hx-overflow-menu`, `hx-carousel`
nav buttons) now render at a genuine 44×44 target. Previously these painted at 40px
with a `min-block-size`/`min-inline-size` clamp that satisfied the bounding box but
not the visible hit area; they now size to 44px outright to meet WCAG 2.5.5 Target
Size (Enhanced). Form-control `md` min-height fallbacks (the scoped native `select`
and shared form-control surfaces) were likewise raised to 44px so a missing
`--hx-input-height-md` override no longer collapses the control under the AAA target.

Also corrects two AAA cert dimensions surfaced by the formal audit harness:

- **2.4.13 Focus Appearance** — the focus indicator is now measured by diffing the
  focused vs unfocused painted state (true focus-gain), rather than reading a static
  computed outline. The evidence prose is now precise about where the ring is painted
  and that it is gained on focus.
- **2.4.13 — form-control focus ring is now a solid opaque indicator.** The seven
  text-like form controls (`hx-combobox`, `hx-date-picker`, `hx-number-input`,
  `hx-select`, `hx-text-input`, `hx-textarea`, `hx-time-picker`) previously painted
  their focus ring as a 25%-alpha `color-mix` halo, which composites to ~1.45:1 against
  the field background and fails the WCAG 2.4.13 ≥3:1 floor. The ring is now a solid
  opaque `box-shadow` in the resolved focus color (`--hx-focus-ring-color`, `#0f7078`),
  matching the rest of the library (checkbox/switch/button/dialog already use opaque
  rings). Measured ring contrast is now 5.82:1 (was a translucent ~1.45:1). The same
  opaque treatment is applied to the error-state focus ring and to the scoped native
  form styles used by `hx-form`. This is a **visible change**: the focus ring is now a
  crisp solid line rather than a soft translucent glow. Theming is unchanged —
  `--hx-<component>-focus-ring-color` and `--hx-focus-ring-color` overrides still flow
  through. The `--hx-focus-ring-opacity` token remains defined for back-compat but no
  longer affects these rings.
- **2.4.12 Focus Not Obscured (Enhanced)** — overlay components (`hx-dialog`,
  `hx-popover`) are now audited in their open state via dedicated audit stories, so the
  criterion is evaluated against the surface a keyboard user actually focuses.

As a measurement consequence of the refined audit harness, several components had their
1.4.6 Contrast (Enhanced) verdict re-evaluated against the component's own painted
surface. No component regressed: the full audit reports 0 Partially Supports and 0 Does
Not Support across all 44 components × 11 criteria, and the full-DOM
`color-contrast-enhanced` sweep remains at zero violations.

## Visible changes consumers should re-baseline

- The seven text-like form controls render a **solid opaque focus ring** (≥3:1) instead
  of the prior soft 25%-alpha halo. Keyboard-focus screenshots will differ.
- `md` icon-button / overflow-menu / carousel-nav default density grew 4px (40 → 44px
  per the WCAG 2.5.5 mandate). Visual icon glyph sizes are preserved; only the
  control's min target box grew.
- Form-control `md` fallbacks render 4px taller when no `--hx-input-height-md` override
  is supplied.

Consumers who pinned layouts to 40px control heights, or who screenshot-test these
controls, should re-baseline. The `--hx-input-height-md` token default itself is
**unchanged** — only component-level sizes and fallbacks moved.

## NOT a breaking change

Component props, slots, events, CSS parts, and CSS custom property names are unchanged.
The public API surface is stable; the Custom Elements Manifest is unaffected.
