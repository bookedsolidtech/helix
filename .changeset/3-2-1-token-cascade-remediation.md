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
- New HC override for `action.danger.bg-active` flips to HC error-500 — closes a palette gap where base error-700 paired with text.on-error-strong (HC = #000000) at 2.56:1, an AA failure flagged by adversarial review.
- 14 new contrast regression assertions in `contrast.test.ts` covering every new action × text-on-strong pair across light/dark/HC, including the action.danger.bg-active HC pair the gap fix now satisfies.
- Token description contrast ratios recomputed and corrected (round 2): `text.on-primary-strong`, `text.on-error-strong`, `text.on-success`, `surface.danger-strong`, `surface.info-strong`, and the `action.{primary,danger}.bg-{hover,active}` claims now match values produced by the WCAG 2.1 luminance formula. Conclusions unchanged — the AA pass/fail verdicts hold; only the cited numbers were stale.

**Library (patch — bug fixes):**
- `hx-button`, `hx-toast`, `hx-side-nav`, `hx-nav-item` variant rules rewritten to consume the new semantic action layer instead of bare primitives. Closes 21 high-severity Token Cascade campaign findings.
- **Two latent AA cold-start failures fixed in `hx-button`:** the inline hex fallback for `--hx-color-text-on-primary` and `--hx-color-text-on-error` was `#ffffff` while the semantic resolves to `#0D1825`. When the semantic was unset (cold-start, theme switch race) buttons painted white-on-primary-500 (3.43:1) and white-on-error-500 (3.92:1) — both AA failures the semantic was specifically designed to prevent. Inline fallbacks corrected.
- **Inverted button affordance fixes:** focus-visible outline rebound from `border.on-dark-default` (overlay-white-30, ~2.7:1 against neutral-900 — fails WCAG 1.4.11 3:1 floor) to `border.on-dark-strong` (overlay-white-70, ~5:1). Inverted tertiary resting/hover split — resting now binds to `border.on-dark-subtle` (10%) and hover to `border.on-dark-default` (30%) so the runtime hover delta is visually distinct rather than collapsed onto a single token.
- **HC hover affordance restored in `hx-button`:** the bespoke `@media (forced-colors: active)` block now defines a `:hover` rule (`Highlight` / `HighlightText`), mirroring the `forcedColorsInteractive` mixin's contract that the bespoke block replaced.
- Stale inline hex fallbacks in `hx-side-nav` corrected to match post-3.2.0 semantic resolutions (text.inverse, border.strong).
- Forced-colors composition resolved in `hx-button`, `hx-side-nav`, `hx-nav-item`, `hx-text-input` — components no longer double-up on both the `forcedColorsInteractive`/`forcedColorsField` mixin and a bespoke `@media (forced-colors: active)` block. `hx-text-input` now drops the `forcedColorsField` mixin entirely; the bespoke block (which already covered wrapper/input/placeholder/focus/disabled/error/label/help-text — strictly more than the mixin) is the sole HC owner.
- `hx-text-input` `@cssprop` JSDoc defaults aligned with runtime cascade — defaults now reference the semantic tokens used at paint time (`--hx-color-surface-default`, `--hx-color-text-strong`, `--hx-color-border-strong`, `--hx-color-error-text`).
- **Round-2 fixes (Codex re-review on PR #1568):**
  - `hx-button` secondary/ghost hover rebound from `surface.raised` to `action.{secondary,ghost}.bg-hover` so the new semantic action layer is actually consumed (the dark-mode hover overrides for these variants were previously dead code).
  - All four inverted-button hover fallbacks for `--hx-color-border-on-dark-default` normalized to `rgba(255, 255, 255, 0.3)` to match the resolved semantic value, eliminating cold-start opacity inconsistency across secondary/ghost/outline/tertiary inverted hover states.
  - `hx-nav-item` bespoke forced-colors block now mirrors the full `forcedColorsInteractive` mixin contract (resting `ButtonFace`/`ButtonText`/`ButtonText`, `:hover` flips to `Highlight`/`HighlightText`, disabled `GrayText` + opacity reset). The previous bespoke block only covered active-border + focus-outline + tooltip-border, leaving normal/hover/disabled HC affordances regressed when the mixin was dropped.
  - `hx-side-nav` bespoke forced-colors block adds the missing `.side-nav__toggle:hover` rule (`Highlight`/`HighlightText`/`Highlight`) — the toggle button lost its HC hover affordance when the mixin was dropped.
  - `hx-side-nav` and `hx-nav-item` `@cssprop` JSDoc defaults aligned with runtime cascade (drop stale `neutral-900`/`neutral-100`/`neutral-700`/`primary-600` claims; reference the actual `surface.inverse`/`text.inverse`/`border.strong`/`action.primary.bg-hover`/`text.on-primary-strong` semantics that resolve at paint time). New `--hx-side-nav-toggle-hover-color`, `--hx-nav-item-tooltip-bg`, `--hx-nav-item-tooltip-color` hooks documented.
  - New library-level regression test pins `hx-button` secondary/ghost hover backgrounds to the resolved primary-50 (#EBF8F8) value, catching any future drift back to a surface-raised binding.
- **Round-3 fixes (Codex re-review on PR #1568, second pass):**
  - `tokens.json` description contrast ratios recomputed and corrected (round 3): `text.on-success` (success-500 stale primitive `#16A34A` → current `#3B9E58`, ratios `3.30:1`/`5.43:1` → `3.38:1`/`5.29:1`); `text.on-success-strong` (success-500 contrast `4.94:1` → `5.29:1`, success-700 contrast `1.62:1` → `2.60:1`); HC `text.on-primary-strong` (primary-600 `10.09:1` → `8.26:1`, primary-700 `13.02:1` → `11.65:1`); HC `text.on-error-strong` (error-600 `10.07:1` → `11.06:1`); HC `text.on-success-strong` (success-500 `9.21:1` → `12.05:1`); HC `surface.success-strong` (success-500 `10.25:1`/`9.21:1` → `12.05:1`/`12.05:1`); HC `surface.warning-strong` (warning-500 `13.73:1` → `12.58:1`); HC `surface.info-strong` description corrected — HC primary-600 IS defined; rationale rewritten.
  - `tokens.json` HC palette descriptions recomputed: HC primary-500/600/700, secondary-500/600, error-500/600, warning-500/600, success-500/600, info-500/600 contrast vs `#000` — all updated. Plus `error-text` and `success-text` AAA citations.
  - `hx-toast.styles.ts` inline contrast comments corrected (`5.39:1` → `5.82:1` for primary-600, `5.92:1` → `5.46:1` for error-600).
  - `hx-toast.ts` `@cssprop` JSDoc defaults aligned with runtime cascade (drop stale `--hx-color-neutral-900`/`--hx-color-neutral-0` claims; reference the actual `--hx-color-surface-inverse`/`--hx-color-text-inverse` semantics that resolve at paint time).
  - `contrast.test.ts` adds `action.ghost.fg × action.ghost.bg-hover` regression assertion (light/dark) — mirrors the existing secondary pair so a future theme split between secondary and ghost cannot silently regress ghost-hover contrast.

**React (patch — peer bump):** No public API surface delta; wrapper regeneration confirms zero breakage.

No tokens removed, no APIs broken. Pure additive cleanup.
