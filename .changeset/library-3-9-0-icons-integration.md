---
'@helixui/library': minor
---

wire @helixui/icons registry into hx-icon and migrate internal components to `<hx-icon library="helix">`.

**hx-icon component**

- new `library` attribute (defaults to `'fa-free'`); resolves names through @helixui/icons registry
- mutator hook integration: registered libraries with `spriteSheet: false` can transform sanitized svg before injection
- existing `name`+`sprite-url` and `src` modes preserved as escape hatches — no consumer breaks

**internal migration (29 components)**

every inline svg glyph for status / direction / forms / actions / domain / navigation has been replaced with `<hx-icon library="helix" name="...">` (or `library="fa-free"` for the handful of glyphs that aren't in the helix vocabulary):

hx-checkbox, hx-radio, hx-alert, hx-toast, hx-banner, hx-rating, hx-stat, hx-help-text, hx-clinical-status, hx-phi-field, hx-file-upload, hx-combobox, hx-date-picker, hx-time-picker, hx-number-input, hx-tree-view, hx-side-nav (+nav-item), hx-accordion, hx-badge, hx-tag, hx-avatar (uses `fa-free name="user"`), hx-link, hx-steps, hx-overflow-menu (helix + fa-free), hx-menu, hx-split-button, hx-nav, hx-top-nav, hx-carousel (helix + fa-free), hx-drawer

structural svg components (hx-icon, hx-progress-ring, hx-spinner, hx-data-table sort indicators) are intentionally not migrated — their svgs are the visual, not glyph references.

**aaa cert**

- new p0: hx-icon — 6 supports / 6 not applicable / 0 partial / 0 fail. non-text contrast 1.4.11 measured at 21:1 against minimum render background.
- existing 43 p0 components recertified post-migration — no regressions.

**design tokens**

- new semantic token `--hx-icon-stroke-width` (default `2`) — applies to stroke-paint consumer libraries (lucide, phosphor regular, heroicons outline). built-in libraries are fill-only and ignore the token.

**peer dependency**

- adds `@helixui/icons@^1.0.0` to peerDependencies. install both packages together.
