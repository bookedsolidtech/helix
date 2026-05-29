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
  computed outline. Verdicts and evidence are unchanged in conformance (all Supports),
  but the evidence prose is now precise about where the ring is painted and that it is
  gained on focus.
- **2.4.12 Focus Not Obscured (Enhanced)** — overlay components (`hx-dialog`,
  `hx-popover`) are now audited in their open state via dedicated audit stories, so the
  criterion is evaluated against the surface a keyboard user actually focuses.

As a measurement consequence, the 1.4.6 Contrast (Enhanced) verdict for `hx-dialog`,
`hx-menu`, `hx-select`, and `hx-toggle-button` moved from Supports to Not Applicable:
the audit now measures the component's own painted target, which is transparent for
these elements (foreground contrast is inherited from the consumer page background).
This is a lateral cert clarification, not a regression — no component regressed to
Partially Supports or Does Not Support, and the full-DOM `color-contrast-enhanced`
sweep remains at zero violations.

## Visible changes consumers should re-baseline

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
