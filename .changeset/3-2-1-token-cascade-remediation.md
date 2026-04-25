---
'@helixui/tokens': minor
'@helixui/library': patch
'@helixui/react': patch
---

3.2.1 — token cascade remediation surfaced by Codex Token Cascade campaign pilot.

**Tokens (minor — additive only):**
- New semantic action layer under `semantic.color.action.{primary,secondary,ghost,danger}.*` for interactive surfaces, with light/dark/HC overrides.
- New `text.on-primary-strong` and `text.on-error-strong` semantics (neutral-0) for darker hover states where AA contrast demands white.
- New `border.on-dark-{strong,default,subtle}` semantics for inverted-button outlines, abstracting the overlay-white primitives.
- New `surface.success-strong` / `warning-strong` / `danger-strong` / `info-strong` semantics for emphasized status surfaces (toast variants).
- 13 new contrast regression assertions in `contrast.test.ts` covering every new action × text-on-strong pair across light/dark/HC.

**Library (patch — bug fixes):**
- `hx-button`, `hx-toast`, `hx-side-nav`, `hx-nav-item` variant rules rewritten to consume the new semantic action layer instead of bare primitives. Closes 21 high-severity Token Cascade campaign findings.
- **Two latent AA cold-start failures fixed in `hx-button`:** the inline hex fallback for `--hx-color-text-on-primary` and `--hx-color-text-on-error` was `#ffffff` while the semantic resolves to `#0D1825`. When the semantic was unset (cold-start, theme switch race) buttons painted white-on-primary-500 (3.43:1) and white-on-error-500 (3.92:1) — both AA failures the semantic was specifically designed to prevent. Inline fallbacks corrected.
- Stale inline hex fallbacks in `hx-side-nav` corrected to match post-3.2.0 semantic resolutions (text.inverse, border.strong).
- Forced-colors composition resolved in `hx-button`, `hx-side-nav`, `hx-nav-item`, `hx-text-input` — components no longer double-up on both the `forcedColorsInteractive`/`forcedColorsField` mixin and a bespoke `@media (forced-colors: active)` block.
- `hx-text-input` `@cssprop` JSDoc defaults aligned with runtime cascade — defaults now reference the semantic tokens used at paint time (`--hx-color-surface-default`, `--hx-color-text-strong`, `--hx-color-border-strong`, `--hx-color-error-text`).

**React (patch — peer bump):** No public API surface delta; wrapper regeneration confirms zero breakage.

No tokens removed, no APIs broken. Pure additive cleanup.
