---
'@helixui/tokens': minor
'@helixui/library': minor
'@helixui/react': minor
---

Component-tier token build-out, forced-colors mixin, and contrast regression gate.

Three structural additions land alongside the Precision Cool palette refresh:

**Forced-colors mixin (`packages/hx-library/src/styles/forced-colors.ts`):**
Four reusable Lit `css` mixins — `forcedColorsInteractive`, `forcedColorsSurface`, `forcedColorsField`, `forcedColorsLink` — composed into every visual component's `static styles` array. Components now defer to OS-level Windows High Contrast / `forced-colors: active` system colors (`ButtonText`, `CanvasText`, `Highlight`, `LinkText`) at the same time as the in-app `data-hx-contrast="high"` overrides. Belt-and-suspenders: the existing rich per-component HC blocks remain; the mixin layers OS-deference on top. Layout-only primitives (stack, grid, prose, form, visually-hidden, style-scope, theme, format-date) skip the mixin since they paint no surfaces.

**Component-tier token completeness:**
Every component in `packages/hx-library/src/components/` now exposes a complete component-tier token surface following the canonical `var(--hx-{component}-{property}, var(--hx-{semantic}, #hex))` two-level fallback pattern. Five architecture violations fixed (hx-avatar, hx-steps, hx-text, hx-icon-button, hx-image — were emitting bare primitives without `var()` fallback). Coverage gaps closed across padding, border, focus-ring families. hx-text-input gains a full token surface (was 280 lines of styled CSS with zero override surface). Inline hex fallbacks across all `.styles.ts` files resynced to the Precision Cool palette so `var()` chains resolve to matching values when the outer token is undefined.

**`tokens.json` `component:` manifest block:**
Adds an 834-token, 72-component manifest documenting every component-tier token surface. **Manifest-only — not CSS-emitted.** `scripts/generate-css.ts` skips the `component:` key alongside `dark:` and `high-contrast:`, preserving the cascade-driven "undefined unless overridden" runtime model where component tokens stay authored inline in `.styles.ts`. The manifest exists as the source of truth for the Figma kit (`/Volumes/Development/booked/figma-tokens/`), audit tooling, and external integrators. A new vitest (`component-manifest-sync.test.ts`) asserts set equality between the manifest and live extraction from `.styles.ts` — drift fails CI.

**Contrast regression matrix (`contrast.test.ts`):**
A new vitest iterates every `text.* × surface.*` semantic pair across light / dark / high-contrast modes against WCAG 2.1 AA (4.5:1 body, 3:1 large/UI). 76 contrast assertions plus meta-tests. Permanent CI gate against the class of bugs that produced the original `text.on-success` and `text.on-{primary,secondary,error,info}` regressions caught earlier in this release. Authoring this gate surfaced one additional pre-existing palette bug — `text.muted` on `surface.raised` light at 4.32:1 — fixed in the same release by rebinding muted to `neutral-600` and bumping `text.secondary` to `neutral-700` to preserve the muted < secondary visual hierarchy.

**`@helixui/react` peer bump:**
React wrappers regenerated from CEM via `scripts/generate-react-wrappers.ts`. No public API surface change — wrappers were already in sync; the regen artifact (`figma-inventory.json`) re-emits two `literalFallback` hexes against the new neutral-900 (`#0f172a` → `#0D1825`).
