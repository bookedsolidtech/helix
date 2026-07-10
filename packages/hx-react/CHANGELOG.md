# @helixui/react

## 3.11.2

### Patch Changes

- Updated dependencies [c0357eb]
  - @helixui/library@3.11.2

## 3.11.1

### Patch Changes

- Updated dependencies [05c1a8b]
  - @helixui/library@3.11.1

## 3.11.0

### Patch Changes

- Updated dependencies [95351f0]
- Updated dependencies [8769f4f]
- Updated dependencies [738e2ed]
- Updated dependencies [d5bf3a7]
- Updated dependencies [5f239e4]
- Updated dependencies [9b70d85]
- Updated dependencies [dc0b356]
- Updated dependencies [0cb0051]
- Updated dependencies [3b1afdf]
- Updated dependencies [65f80b8]
- Updated dependencies [3622e2c]
- Updated dependencies [0d66a4e]
- Updated dependencies [0765c59]
- Updated dependencies [9f32606]
- Updated dependencies [f9a47fa]
  - @helixui/library@3.11.0

## 3.10.0

### Patch Changes

- Updated dependencies [a6c7d38]
  - @helixui/library@3.10.0

## 3.9.4

### Patch Changes

- c1067b7: deps: dependabot batch 2026-05 — major bumps for vitest (3→4), TypeScript (5→6), zod (3→4), eslint (9→10), commitlint (20→21), and react/react-dom alignment to 19.2 across admin, hx-react, and react-starter. CI tooling: actions/checkout v4→v6. The package surface area is unchanged — runtime dependencies are unaffected and no API has shifted — but the build/test/type toolchain has moved, so consumers running their own pipelines should expect the same toolchain bumps.

  Two dependabot PRs are intentionally NOT in this batch:
  - #1628 vite 6→8 (with vite-plugin-dts 4→5 and @vitejs/plugin-react 4→6). Bisecting the a11y CI regression on this PR pinned the cause to the vite 8 upgrade: under vite 8's bundle output, axe-core surfaces three previously-hidden AAA violations on Components/Breadcrumb and Components/OverflowMenu (two `aria-required-parent` critical findings, one `color-contrast-enhanced` serious). Both issues are real latent ARIA defects exposed by vite 8's transpile/bundle output; they need component-level fixes (light-DOM role placement, story-level color override) before vite 8 can ship.
  - #1608 playwright 1.50→1.60. Same shape — newer vendored Chromium surfaces ARIA issues that axe couldn't see before. Held until the breadcrumb-item/overflow-menu work lands.

  Also included: small AAA-compliant fix to the overflow-menu Delete story's inline color (#A21312 → #7a0e0e, the prior value hit 6.92:1 on the panel's #efefef background which is below the AAA 7:1 threshold) and a host-role fix on hx-breadcrumb-item that moves `role="listitem"` from the inner span to the host element so axe's parent search resolves in the light tree without crossing the shadow boundary.

- Updated dependencies [c1067b7]
  - @helixui/library@3.9.4

## 3.9.3

### Patch Changes

- @helixui/library@3.9.3

## 3.9.2

### Patch Changes

- @helixui/library@3.9.2

## 3.9.1

### Patch Changes

- c4208b2: **Docs deep fact-check audit** — every package README + the Starlight docs
  site + the Storybook MDX surface validated against source-of-truth, with new
  preflight enforcement.

  **Per-package README accuracy fixes** (`@helixui/library`, `@helixui/tokens`,
  `@helixui/icons`, `@helixui/react`, `@helixui/drupal-behaviors`,
  `@helixui/drupal-starter`):
  - Install snippets, CDN URLs, and import maps now pin to verified current
    versions (`@helixui/library@3.9.0`, `@helixui/tokens@3.9.0`,
    `@helixui/icons@1.0.0`) — stale `^1.0.0` / `^0.3.0` / older pins removed.
  - Component API claims (events, slots, attributes) reconciled with the
    Custom Elements Manifest. Fabricated tags, events, and CSS parts removed.
  - Drupal behaviors README re-aligned to the actual `hxDrawer` /
    `hxMenu` / `hxTabs` source (real `data-direction` / `data-size` /
    `data-active-tab` attribute names; real `hx-change.detail.value` event
    contract).
  - `@helixui/drupal-starter/theme/README.md` rewritten to use raw
    `CSSStyleSheet` + `adoptedStyleSheets` primitives — the previous draft
    referenced a fictional `@helixui/adopted-stylesheets` npm package.

  **New preflight gates** (release-critical infrastructure, no consumer-facing
  shape change for these packages):
  - Gate 11 (docs version drift, `scripts/check-version-drift.mjs`) — extended
    to scan `packages/**/README.md` (was apps-only), so future patch releases
    cannot ship stale CDN URLs in package READMEs without tripping preflight.
  - Gate 12 (docs claims fact-check, `scripts/check-docs-claims.mjs`) — new
    blocking gate that validates `<hx-*>` tags against the CEM, `--hx-*` token
    prefixes against `@helixui/tokens`, `@helixui/*` package references against
    the workspace + npm, internal `/<slug>/` links, stale repo references, and
    outdated WCAG conformance claims.

  No public API changes. Patch-only release.

- Updated dependencies [c4208b2]
  - @helixui/library@3.9.1

## 4.0.0 [UNPUBLISHED]

Mistakenly published as MAJOR via the [library, tokens, react] linked-package group cascade. The 4.0.0 release was unpublished from npm; `latest` dist-tag is on 3.8.0 with 3.9.0 the corrected republish below. Same code — regenerated wrappers only.

## 3.9.0

### Patch Changes

- Updated dependencies [7b42779]
- Updated dependencies [2068ed3]
- Updated dependencies [723eec6]
- Updated dependencies [1ea6a14]
  - @helixui/library@4.0.0

  > **Note:** the changesets cascade originally generated `@helixui/library@4.0.0` here. That entry is an unpublished/deprecated artifact of the linked-package major-bump cascade; the workspace-current library release is **`@helixui/library@3.9.0`**.

## 3.8.0

### Minor Changes

- b5a3c60: AAA Tier 3 — full P0 surface measured against WCAG 2.2 AAA via formal audit harness (3.8.0 release snapshot).

  ## Posture (read this first)

  This release publishes a **self-attested WCAG 2.2 AAA conformance posture** sourced from the formal audit harness, with W3C-cited spec URLs and three-way cross-tool agreement (axe-core + WCAG luminance math + CEM helixMeta claims).

  **This is NOT a third-party-signed VPAT 2.5 cert.** Such a cert requires engagement with a credentialed accessibility vendor (e.g., Deque, TPGi, Level Access) and is on the roadmap, not in this release. We deliberately use "conformance posture per WCAG 2.2" (not "AAA Certified") in messaging to avoid mis-stating the legal/compliance weight of the claim.

  ## What ships at 3.8.0 (release-time snapshot)

  **43 of 43 P0 components measured against 11 AAA criteria** via the formal audit harness:
  - 3.8.0 release-time verification: **473/473 cells, 356 Supports + 117 Not Applicable, zero Partials, zero Fails**. (The P0 surface has since grown — current `aaa-verdicts.json` measures **44 P0 components / 376 Supports + 109 Not Applicable / 0 Partial / 0 Fail** across the 11 criteria; consult `packages/hx-library/aaa-verdicts.json` for the live numbers.)
  - Snapshot: `.reports/formal-aaa-audit/PRE-RELEASE-VERIFICATION-3.8.0.md` (gitignored evidence)
  - Cert toolkit (`scripts/aaa-cert.mjs`) gates on formal audit verdict, not the informational matrix harness
  - Standards reference: `scripts/aaa-standards.json` (W3C URLs WebFetch-verified — see the file for the current count)

  **Criteria measured per component (11 axes):**
  - 1.4.6 Contrast (Enhanced)
  - 1.4.9 Images of Text (No Exception)
  - 2.1.3 Keyboard (No Exception)
  - 2.3.3 Animation from Interactions
  - 2.4.12 Focus Not Obscured (Enhanced)
  - 2.4.13 Focus Appearance
  - 2.5.5 Target Size (Enhanced)
  - 3.2.5 Change on Request
  - 3.3.6 Error Prevention (All)
  - forced-colors media query support (peer standard, not WCAG)
  - WAI-ARIA APG keyboard pattern conformance (peer standard, not WCAG)

  Per-component evidence in `.reports/formal-aaa-audit/evidence/<tag>.json` captures measured contrast ratios, computed outline width/offset, target rect sizes, focus-visible behavior, and APG keyboard contract verification.

  **43 P0 components** spanning form inputs (9), selection controls (4), buttons (7), navigation (8), overlays (5), live regions (3), sliders (2), form assembly (2), and field helpers (3).

  ## Phase 4 component fixes rolled in
  - Token chain shift: `--hx-color-action-primary-bg` resolves to `primary-700` (was `primary-600`) for AAA-strict 7:1 across all 6 brands
  - Touch-target compliance: button family default `md` size 40 → 44px to meet 2.5.5 (Enhanced)
  - Hit-area expansions on form fields, navigation links, side-nav toggle, color picker controls, date/time picker triggers
  - hx-switch checked-track now consumes `action.primary.bg` (was primary-500 directly)
  - Focus-ring contrast hardening across components where the previous semantic ring missed AAA contrast against adjacent surfaces

  ## Documentation
  - At the 3.8.0 release: 43 `AAA-AUDIT.md` files regenerated against `scripts/AAA-AUDIT.formal.template.md` using VPAT 2.5 verdict language ("Supports" / "Not Applicable") and W3C spec URLs (the on-disk count tracks the current P0 set — 44 since 3.9.0)
  - Storybook A11y Dashboard with live cert-count hero (reads CEM directly, refreshes on every cert)
  - 5 anchor components (hx-button, hx-text-input, hx-checkbox, hx-dialog, hx-tabs) ship MDX stories as proper AAA conformance documentation (hero scenario + AAA card + APG walkthrough + consumer obligations + InlineAuditPanel embed)
  - Remaining 38 component MDX rewrites land in subsequent minors

  ## Cert tooling
  - `scripts/aaa-formal-audit.mjs` — formal audit harness, the cert authority (invoke via `pnpm aaa:audit` or `pnpm exec node scripts/aaa-cert.mjs <component-name>` for the per-component cert stamp; no `pnpm aaa:cert` shortcut exists in the workspace)
  - `scripts/aaa-standards.json` — WCAG 2.2 reference with 46 verified W3C URLs
  - `scripts/aaa-matrix-verify.mjs` — demoted to informational coverage tool (header banner explicit; not a cert authority)
  - `pnpm aaa:audit` alias — runs the full 43-component formal sweep against live Storybook

  ## Visual changes consumers should re-baseline
  - Button family default density grew 4px (40 → 44 per WCAG 2.5.5 mandate)
  - Hit-area expansions (visual icon/label sizes preserved; only padding/min-height grew)
  - Primary action surfaces darkened from primary-600 to primary-700
  - hx-switch checked-track shifted accordingly
  - Focus rings rendered slightly thicker on a handful of components
  - Forced-colors mode now paints distinct interactive states (was inheriting)

  Consumers who screenshot-test forced-colors output OR who pinned layouts to 40px button heights should re-baseline.

  ## NOT a breaking change

  Token NAMES unchanged. Component PROPS, slots, events, CSS parts, CSS custom properties unchanged. CEM schema additive (`helixMeta` field expanded). Public API surface stable.

  ## Roadmap before VPAT v1.0

  This release is the **starting line** for AAA conformance posture, not the finish. Prior to publishing a VPAT 2.5 with legal/compliance weight, we are:
  1. **Tier 1 — harness self-validation** (1-2 days): build broken-component fixtures, cross-tool comparison (WAVE / IBM Equal Access / axe DevTools), cross-browser Playwright (Firefox + WebKit + Chromium)
  2. **Tier 2 — manual AT testing + methodology doc** (1 week): NVDA / VoiceOver runs on anchor components with announcement transcripts, published audit methodology
  3. **Helixir a11y extension** — externalize the formal audit harness as a Helixir MCP tool so the same cert lens can audit ANY web-component library (positioning HELiX as the toolmaker, not just a cert holder)
  4. **Third-party AAA audit** — engage Deque / TPGi / Level Access for credentialed VPAT 2.5 sign-off, only after Tier 1+2 close and we are 1000% ready

  Until that path completes, public-facing language is "AAA conformance posture / self-attested per WCAG 2.2 with formal audit harness." VPAT v1.0 publication is held.

### Patch Changes

- Updated dependencies [b5a3c60]
  - @helixui/library@3.8.0

## 3.7.0

### Minor Changes

- 58ee1c1: AAA Tier 3 Phase C — 5-component AAA cert + structural primary contrast fix.

  **5 components AAA-certified** (`hx-button`, `hx-checkbox`, `hx-alert`, `hx-text-input`, `hx-dialog`). Each ships AAA-AUDIT.md, JSDoc helixMeta block, AAA-level axe tests, forced-colors VRT, and VPAT row promotion. Verified across the full **6 brands × 3 themes × 11 AAA criteria matrix** (522/0/468 pass/fail/skip — empirical evidence in `.reports/aaa-matrix-evidence.md`).

  **A11y Status Card on every Storybook component page** (`apps/storybook/.storybook/docs/A11yStatusCard.tsx` + `HelixDocsPage.tsx`). Reads `helixMeta` from CEM, renders certified state, criteria chips, ARIA pattern + APG link, keyboard contract, capability badges, audit link, priority tier. AAA-cert'd components show "AAA Certified" with date + criteria; pending components show "AAA — Pending audit".

  **Structural primary action token + 8-component re-bind:**

  The previous Phase C cert relied on default Apex/light axe runs. Brand swap to Meridian/Lumen exposed a contrast gap — `text-on-primary` (neutral-900) on darker brand primary-500 stops landed at 1.88:1 (Meridian) — unreadable. Root cause: `text-on-primary` was over-loaded across two paint contracts (primary-500 direct vs action.primary.bg). Fixed by re-binding 8 components to consume the action.primary.bg/text-on-primary semantic pair, then shifting the token contract:
  - `--hx-color-action-primary-bg`: primary-500 → primary-600 (AAA-large rest fill)
  - `--hx-color-action-primary-bg-hover`: primary-600 → primary-700
  - `--hx-color-action-primary-bg-active`: primary-700 → primary-800
  - `--hx-color-text-on-primary`: neutral-900 → neutral-0 (white)

  Components re-bound: hx-badge, hx-pagination, hx-checkbox, hx-date-picker, hx-toggle-button, hx-steps, hx-icon-button, hx-radio. hx-button INVERTED hover/active text repointed to neutral-900 primitive (since `text-primary` flips in dark mode and would regress the dark-on-light-primary-400 pair).

  White-on-primary-600 verified across all 6 brands: Apex 5.82:1, Meridian 12.05:1, Lumen 7.10:1, Verdant 6.70:1, Signal 6.37:1, Ember 6.22:1 — all AAA-large compliant. Contrast report: **0 sub-AA pairs across light + dark + HC modes** (was 5).

  **Storybook brand toolbar fix:** `apps/storybook/.storybook/docs/brand-overrides.css` `[data-brand="*"]` rules were silently disabled by `@layer hx-docs` wrapper — unlayered `:root` rules in `tokens.css` always win cascade priority over named layers. Unwrapped + promoted selectors to `:root[data-brand="*"]` for definitive specificity victory.

  **Cert toolkit hardened:** `scripts/aaa-cert.mjs` round-1 P2 fixes — VPAT row matching, notes preservation, CEM staging order.

  **State of the AAA cert claim**: 5/43 P0 components AAA-cert'd. VPAT v1.0 trigger at 30+ P0 cert (currently in Phase D queue). 38 P0 + 11 P1 + 23 P2 components remain on the roadmap.

### Patch Changes

- Updated dependencies [58ee1c1]
  - @helixui/library@3.7.0

## 3.6.0

### Patch Changes

- Updated dependencies [d620f8d]
  - @helixui/library@3.6.0

## 3.5.0

### Minor Changes

- 191bda3: AAA conformance posture + Storybook canonical-template foundation.

  **`@helixui/tokens`**
  - Added WCAG 1.4.6-correct contrast pair role classification (body-text 7:1 / large-text 4.5:1 / ui-element 3:1). 1.4.0 release-snapshot pair count: 156 of 163 AAA-passing, 0 sub-AA. (Current generator output is 114 of 160 AAA-pass, 46 AA-only, 0 sub-AA — consult `.cache/contrast-report.json` for the live numbers.) Public test helpers (`PairRole`, `aaaThresholdForRole`) exposed for downstream conformance reporting.
  - New `pnpm contrast:report` script generates `CONTRAST-REPORT.md` + `.cache/contrast-report.json` per release for the AAA conformance ledger.

  **`@helixui/library`**
  - `checkA11y(level: 'aa' | 'aaa')` test-utils API for per-component AAA opt-in (default unchanged for backward compat).
  - New CEM analyzer plugin `cem-plugins/aaa-certified.mjs` reads `@aaa-certified <date>` JSDoc tags and emits `aaaCertified: true` + `aaaCertifiedDate` on the manifest. Allow-list infrastructure at `scripts/a11y-aaa-allowlist.json` was empty at the 1.4.0 release; the file has since been populated as components landed in the formal audit and now lists the P0 cohort.

  **Brand registry contract** (`apps/storybook` — not a published package, framing only)
  - 6 reference brands: Apex (default), Meridian, Lumen, Verdant, Signal, Ember. Every brand verified AAA at primary-700 against text-primary. Override-author contract documented: body-text uses ≥primary-700, button labels use the WCAG large-text bold carve-out at primary-500/600.

  **Storybook canonical-template foundation**
  - Editorial port of 14 dist pages → MDX (Foundations, Patterns, Accessibility, Playground).
  - Shared MDX components (EyebrowHeading, SectionHead, StatCard, RatioCard, TokenSwatchGrid, SurfaceCard, StateMatrix, DocsCard, CodeBlock, CodeTabs, ContrastMatrix, TokenRef, ConsumerObligations).
  - Shiki-based dark editor chrome with copy controls + multi-syntax tabs.
  - 7-page Accessibility section (Dashboard, Forced Colors, Keyboard Contracts, Focus Management, Contrast Deep-Dive, Success Criteria, Consumer Obligations) — the AAA cert dashboard.
  - 3 sample composition stories (Patient Intake, Provider Dashboard, Settings) with `play()` interaction tests.
  - Storybook bumped to 10.3.6 + 3 new addons (designs, pseudo-states, chromatic).
  - IA restructured: Accessibility promoted to 2nd, Components demoted, heavy roots collapsed by default.
  - Pattern extracted into `apps/docs/src/content/docs/storybook-preset.mdx` for `create-helix-app` consumers.

### Patch Changes

- Updated dependencies [191bda3]
  - @helixui/library@3.5.0

## 3.4.1

### Patch Changes

- Updated dependencies [606df3f]
  - @helixui/library@3.4.1

## 3.4.0

### Patch Changes

- Updated dependencies [8e026a3]
- Updated dependencies [1a82b8d]
- Updated dependencies [0de77f8]
- Updated dependencies [c66503f]
- Updated dependencies [8876409]
- Updated dependencies [bd52f5f]
- Updated dependencies [69de082]
- Updated dependencies [174c2b9]
- Updated dependencies [158c706]
- Updated dependencies [1eedfee]
- Updated dependencies [b64b6cc]
- Updated dependencies [4235d63]
- Updated dependencies [2143bb9]
- Updated dependencies [93342cd]
- Updated dependencies [e1ad574]
- Updated dependencies [2a790dd]
- Updated dependencies [32cef7d]
- Updated dependencies [5ae29a2]
- Updated dependencies [5a15e9e]
- Updated dependencies [396ad82]
  - @helixui/library@3.4.0

## 3.3.1

### Patch Changes

- Updated dependencies [dae4918]
- Updated dependencies [65feccb]
  - @helixui/library@3.3.1

## 3.3.0

### Patch Changes

- d4b0aec: 3.2.1 — token cascade remediation surfaced by Codex Token Cascade campaign pilot.

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
  - **Round-4 fixes (Codex re-review on PR #1568, third pass):**
    - `tokens.json` description contrast ratios recomputed and corrected (round 4) for entries the round-3 sweep missed: `text.secondary` (neutral-700 on surface.default `10.84:1`/raised `10.10:1`/sunken `9.01:1` → `10.93:1`/`10.20:1`/`9.34:1`); `text.muted` (neutral-600 on surface.raised `7.36:1`/default `7.88:1`/sunken `6.55:1` → `7.25:1`/`7.76:1`/`6.63:1`); `action.secondary.fg` (primary-600 on surface.default `5.20:1` → `5.82:1`); dark `action.secondary.fg` (primary-400 `7.18:1` → `7.27:1`); dark `action.secondary.bg-hover` (primary-400 on primary-900 `5.97:1` → `5.63:1`).
    - `hx-nav-item.styles.ts` inline active-state contrast comment corrected (`5.39:1` → `5.82:1` for white on primary-600) — sibling occurrence missed in round 3's `hx-toast.styles.ts` sweep.
    - `hx-toast.ts` `@cssprop` block fully aligned with runtime cascade — replaced the stale primitive entries (`--hx-color-neutral-900`, `--hx-color-neutral-0`, `--hx-color-success-600`, `--hx-color-warning-500`, `--hx-color-error-600`, `--hx-color-primary-600`) with the semantic tokens the variant rules actually consume (`surface.{success,warning,danger,info}-strong`, `text.on-{success,warning,error-strong,primary-strong}`).
    - `contrast.test.ts` adds two `action.secondary.border` × `surface.default` and `action.secondary.border` × `action.secondary.bg-hover` assertions (light/dark, threshold 3:1) — covers the outline button border affordance at WCAG 1.4.11 floor.
  - **Round-5 fixes (Codex re-review on PR #1568, fourth pass):**
    - `hx-toast` forced-colors XOR violation resolved: dropped the `forcedColorsSurface` mixin composition. The bespoke `@media (forced-colors: active)` block in `hx-toast.styles.ts` (per-class overrides on `.toast` and `.toast__close`) is strictly more comprehensive than the mixin's `:host`/`[part]` contract, so it owns HC alone — matching the XOR pattern hx-button/hx-side-nav/hx-nav-item/hx-text-input already follow.
    - `tokens.json` description contrast ratios recomputed and corrected (round 5) for residual entries: `dark.color.error-text` (`#F87171` on neutral-900 `6.45:1` → `6.46:1`); `dark.color.success-text` (`#4ADE80` on neutral-900 `10.25:1` → `10.26:1`); HC `action.danger.bg-active` (`#000000` on `#A21312` `2.56:1` → `2.64:1`, `#F87171` on `#000000` `6.45:1` → `7.59:1`).
    - `hx-button.styles.ts` inline ratio comments corrected (`primary-500 #429797 on white 3.43:1` → `3.44:1`, `primary-600 #0F7078 on white 6.06:1` → `5.82:1`) — both .button--secondary and .button--ghost rationale blocks.
    - `hx-button.ts`, `hx-side-nav.ts`, `hx-text-input.ts` `@cssprop` JSDoc trimmed: dropped the auto-generated primitive inventory (`--hx-color-neutral-*`, `--hx-overlay-white-*`, raw spacing/transition/font tokens) and replaced with the semantic action/surface/text/border tokens the styles actually consume at runtime — plus the canonical `--hx-text-input-*` outer hooks that sit above the legacy `--hx-input-*` aliases in the cascade.
  - **Round-6 fixes (Codex re-review on PR #1568, fifth pass):**
    - **Filled-button `:active` AA gap closed in `hx-button`:** `.button:active { filter: brightness(0.8) }` was darkening the resting `action.{primary,danger}.bg` fill below AA on press (primary 3.70:1, danger 3.26:1). Added explicit `.button--primary:active` and `.button--danger:active` rules that bind to `--hx-color-action-{primary,danger}-bg-active` (primary-700 / error-700) plus `--hx-color-text-on-{primary,error}-strong` (neutral-0), and override `filter: none` so the action.\*.bg-active token is what actually paints. Pressed-state contrasts are now 7.03:1 (primary-700 on white) and 7.96:1 (error-700 on white) — both AA. Closes the F1/F5 dead-token gap: `action.danger.bg-active` now has a real consumer.
    - **`hx-toast` forced-colors surface contract restored:** the bespoke `@media (forced-colors: active)` block now sets `background: Canvas` + `color: CanvasText` on `.toast` (in addition to the existing border + close-button overrides). When `forcedColorsSurface` was dropped in round 5, the mixin's `Canvas`/`CanvasText` surface mapping went with it — bespoke block was strictly less than the mixin for the surface contract until this fix.
    - **Stale `@cssprop` defaults in `hx-button` corrected:** `--hx-button-inverted-color` JSDoc default was `var(--hx-color-text-on-dark)` — a token that does not exist in `tokens.json`. Now references `var(--hx-color-text-inverse)` (the actual runtime resolution). `--hx-button-inverted-ghost-hover-bg` JSDoc default was `var(--hx-color-overlay-white-15)` (also nonexistent and inconsistent with the styles.ts binding). Now references `var(--hx-color-border-on-dark-default)` matching the runtime cascade.
    - **`hx-button.styles.ts` ratio comment corrected:** danger-hover rationale block cited `error-600 (#C92A2A) drops [neutral-900 contrast] to 2.25:1` — `2.25:1` is the error-700 number; error-600 against neutral-900 is `3.28:1` per the WCAG 2.1 sRGB luminance formula. Comment now reads `3.28:1`.
    - New `hx-button.test.ts` regression assertions pin both filled `:active` rules to `--hx-color-action-{primary,danger}-bg-active` and verify the tokens resolve to primary-700 (#0F6363) / error-700 (#A21312) — catches any future regression that re-routes filled-active back through the generic brightness filter.
  - **Round-7 fixes (Codex re-review on PR #1568, sixth pass — light-mode inverted only; dark-mode-inverted handling tracked as a 3.2.x follow-up):**
    - **Inverted-mode `:hover`/`:active` regression closed in `hx-button` (light mode):** round-6 closed the standard-mode AA gap but the new `.button--primary:active` and `.button--danger:active` rules also fired under `:host([inverted])`, painting `action.{primary,danger}.bg-active` (primary-700 #0F6363, error-700 #A21312) over `surface.inverse` (neutral-900 #0D1825) — both fall to ~2.5–3:1, failing WCAG 1.4.11's 3:1 UI-component floor. Added combined `:host([inverted]) .button--primary:hover, :host([inverted]) .button--primary:active` and `:host([inverted]) .button--danger:hover, :host([inverted]) .button--danger:active` rules that reuse `action.{primary,danger}.bg-inverted-hover` for the lifted fill on dark surfaces. New `action.danger.bg-inverted-hover` semantic added (error-400 #FC7264, 6.58:1 on neutral-900) — sister to the existing `action.primary.bg-inverted-hover` (primary-400, 7.27:1).
    - **Foreground also pinned on inverted hover/active:** the lifted -400 fills are permanent (no dark-mode flip), but the base `:host([inverted]) .button` color binds to `text.inverse`, which DOES flip (neutral-0 light, neutral-900 dark). White text on light teal/red collapses to ~2.4–2.6:1 in light mode (AA fail). The new combined hover/active rules pin `color: var(--hx-color-text-on-{primary,error})` (neutral-900, no dark-mode flip) so dark text rides the lifted fill — primary clears 7.27:1, danger 6.58:1 in light mode. Two new component hooks (`--hx-button-inverted-{primary,danger}-interactive-color`) expose the foreground for outside-shadow override; the `-interactive-color` naming reflects that one hook covers both `:hover` and `:active` (the rules are combined).
    - **`--hx-button-active-bg` and `--hx-button-hover-bg` both honored under inverted:** the inverted hover/active background bindings wrap a two-step fallback chain (`var(--hx-button-active-bg, var(--hx-button-hover-bg, var(--hx-color-action-{primary,danger}-bg-inverted-hover, …)))`), so consumer overrides on either prop apply under inverted. Active-bg wins when both are set (matches the standard-mode contract); when only hover-bg is set, it applies to both states because hover and active share a paint in the inverted combined rule. Both `@cssprop` JSDoc entries spell this out so consumers can predict the behavior without reading `.styles.ts`.
    - **Dark-mode-inverted scope disclosed (3.2.x follow-up):** `[inverted]` is validated for placement on a dark _region_ within a light-mode-active page (hero banners, gradient sections, dark cards). It is NOT validated for use within a dark-mode-active root context: in dark mode, `surface.inverse` flips to a light surface (neutral-100), and the lifted `-400` hover/active fills lose UI-floor contrast against it (primary 2.10:1, danger 2.32:1 vs WCAG 1.4.11's 3:1 floor). Mode-aware fill stops + foreground for the dark-mode-inverted combination are tracked as a 3.2.x follow-up. The `inverted` property's JSDoc carries this mode-scope disclaimer for consumers.
    - **`tokens.json` surface-strong descriptions corrected:** `surface.success-strong`, `surface.danger-strong`, `surface.info-strong` instructed consumers to "Pair with text.inverse (neutral-0)" — wrong in dark mode, where text.inverse flips to neutral-900 against the same dark-fill surface and produces sub-AA contrast. Descriptions now explicitly state surface.{role}-strong does NOT dark-mode-flip while text.inverse does, and point at `text.on-{role}-strong` as the correct (non-flipping) pair.
    - **`hx-button` `@cssprop` JSDoc gap closed:** `--hx-button-active-bg` (consumed by both standard-mode and inverted-mode `:active`) was not declared, so it was missing from CEM and figma-inventory. Added with the canonical default-cascade documentation. Also added `@cssprop` entries for the new `--hx-color-action-{primary,danger}-bg-inverted-hover` semantics (with the `error-400 = 6.58:1 on neutral-900` ratio — round-7-followup-2 caught a fifth stale `6.27:1` on this `@cssprop` that had propagated to CEM and figma-inventory) and the new `--hx-button-inverted-{primary,danger}-interactive-color` foreground hooks.
    - **`bundle-budgets.json` reason text corrected:** previous reason claimed "+0.14 KB over the 5.5 KB standard"; the actual budget headroom is 0.50 KB (5632 → 6144). Reason rewritten to clarify "measured artifact growth ~0.14 KB; budget bumped one gating step from 5.5 KB to 6.0 KB" so the prose matches the math.
    - **Component-manifest sync entries added:** `--hx-button-active-bg`, `--hx-button-inverted-primary-interactive-color`, `--hx-button-inverted-danger-interactive-color` registered in the `component:` block of `tokens.json` so the manifest sync test keeps the styles.ts ↔ manifest contract closed.
    - **`hx-button.test.ts` regression net extended:** all five inverted hover/active assertions (three background pin + two foreground pin) use the bounded regex form `[^{]*\{[^}]*` so the match cannot bleed across rule boundaries, pin background to `--hx-color-action-{primary,danger}-bg-inverted-hover` and foreground `color` to `--hx-color-text-on-{primary,error}`, and resolve `action.{primary,danger}.bg-inverted-hover` to primary-400 (#6AB1B1) / error-400 (#FC7264). Two additional fallback-chain assertions (added in round-7-followup-2) pin the literal `var(--hx-button-active-bg, var(--hx-button-hover-bg, var(--hx-color-action-{primary,danger}-bg-inverted-hover` nesting — closes the F4 test-coverage gap so a future agent collapsing the chain back to a single level cannot silently re-introduce the `--hx-button-hover-bg` no-op-under-inverted regression.
    - **`contrast.test.ts` extended:** new assertions pin `action.{primary,danger}.bg-inverted-hover` × `surface.inverse` at the WCAG 1.4.11 3:1 UI floor (light mode only — see dark-mode-inverted follow-up above), and `text.on-{primary,error}` × `action.{primary,danger}.bg-inverted-hover` at the 4.5:1 body-text AA floor (light/dark, since both sides are mode-stable). The regression net for both the surface-against-surface and the foreground-on-fill contracts this round established.

  **React (patch — peer bump):** No public API surface delta; wrapper regeneration confirms zero breakage.

  No tokens removed, no APIs broken. Pure additive cleanup.

- c60adb5: color contrast fixes — sub-3:1 UI-floor failures across light + dark

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
    visible in dark mode (`overlay-white-*` on light surface ≈ 1.1:1, invisible).
    Flipped to `overlay-black-*` (3.84:1 strong / proportional alphas for
    default/subtle).
  - Inline fallback hex values updated across 45 component `.styles.ts` files
    to track the new primitive resolutions (`#6ab1b1`→`#0f7078` for focus,
    `#8e9c98`→`#66787b` for border-strong) — keeps the inline-fallback parity
    invariant intact. Initial sweep covered 24 form-field/action components;
    the parity sweep then aligned 21 additional focus-ring consumers
    (hx-card, hx-popover, hx-icon-button, hx-pagination, hx-table,
    hx-color-picker, hx-data-table, hx-overflow-menu, hx-phi-field, hx-drawer,
    hx-accordion-item, hx-menu-item, hx-nav, hx-step, hx-tree-item, hx-dialog,
    hx-meter, hx-top-nav, hx-breadcrumb-item, hx-split-panel,
    hx-clinical-status) so cold-start (CSS-not-loaded) painting matches the
    semantic's resolved primary-600 instead of stale primary-500.
  - `hx-split-button` primary divider rebound from `primary-400` (1.40:1 on
    primary-500 — invisible divider) to `primary-900` (4.03:1 on primary-500 —
    AA-pass divider). `@cssprop` JSDoc updated; outline-variant divider
    unchanged.
  - `hx-button` `:host([inverted]) .button--primary` resting rule rebinds
    `--hx-button-bg` to the new `action.primary.bg-inverted-rest` semantic at
    higher specificity (cascade-aware option B). The earlier draft tried to
    paint `background-color` directly (option A) but was shadowed by the base
    `.button--primary` rule writing `--hx-button-bg` unconditionally, so the
    inverted-rest semantic never reached the pixel and dark-mode inverted
    primary stayed at 2.94:1. Note: rebinding `--hx-button-bg` at a descendant
    scope means consumer-tier overrides of that property at the host level
    are shadowed inside the inverted-primary variant — consumers must override
    the upstream semantic (`--hx-color-action-primary-bg-inverted-rest`)
    instead.

  Two regression tests gate the fixes:
  - contrast matrix gains three pairs (`border.strong` × `surface.default`,
    `bg-inverted-rest` × `surface.inverse` light/dark);
  - `dark-mode-resolution.test.ts` asserts `<hx-button variant="primary"
inverted>` resolves to `primary-500` in light and `primary-600` in dark
    (catches the CSS-cycle regression at the painted-pixel layer, not just the
    token tier).

- b5acf86: 3.2.2 — `HxThemeProps['effectiveTheme']` type narrowed from `'light' | 'dark' | 'high-contrast' | 'auto'` to `'light' | 'dark' | 'high-contrast'`.

  The runtime getter on `<hx-theme>` resolves `theme="auto"` to either `'light'` or `'dark'` via `matchMedia`, so the wrapper type previously declared a value the runtime never returns. The wrapper has been regenerated from the corrected library types in 3.2.2.

  **Consumer impact:** if you have an exhaustiveness check on `effectiveTheme` that handles `'auto'`, TypeScript will now flag that branch as unreachable. Remove it. The input `theme` prop still accepts `'auto'`; only the resolved `effectiveTheme` getter narrowed.

  **Why patch (not minor).** The runtime never produced `'auto'` from `effectiveTheme` — the original type was misdocumented. No consumer relying on documented runtime behavior could have legitimately matched `'auto'` against an effective state, because the runtime always resolves `'auto'` into `'light'`/`'dark'` before the getter returns. HELiX classifies type-narrowings that bring declared types into alignment with documented and observable runtime behavior as patches; strict-mode TS consumers may need a one-line removal of the dead `'auto'` branch (called out above). Minor/major bumps are reserved for type changes that alter the runtime contract — this change does not.

- Updated dependencies [d4b0aec]
- Updated dependencies [4f446be]
- Updated dependencies [e41346c]
- Updated dependencies [e254b72]
- Updated dependencies [350ab57]
- Updated dependencies [f2e6253]
- Updated dependencies [69784a2]
- Updated dependencies [3cb4bba]
- Updated dependencies [0d69763]
- Updated dependencies [c60adb5]
- Updated dependencies [b5acf86]
- Updated dependencies [450a70e]
  - @helixui/library@3.3.0

## 3.2.0

### Minor Changes

- c1c93f5: Component-tier token build-out, forced-colors mixin, and contrast regression gate.

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

- ef049df: "Precision Cool" palette refresh — every primitive color ramp regenerated from OKLCH math.

  The previous primitive ramps were effectively Tailwind defaults (`blue-600` primary, slate neutrals, violet accent, amber warning). The 3.2.0 refresh replaces all seven chromatic families — `primary`, `secondary`, `accent`, `neutral`, `success`, `warning`, `error`, `info` — with hand-tuned OKLCH ramps anchored on the brand teal `#0F7078`. No Tailwind-derivative values remain.

  **Anchor colors (stop 600):**
  - `primary` `#0F7078` — brand teal, 5.82:1 on white (AA pass)
  - `secondary` `#0F6B7E` — deeper sea-teal, coordinated cousin of primary (6.13:1)
  - `accent` `#3A4BC9` — cool steel-indigo, replaces Tailwind violet (6.93:1)
  - `neutral` `#4A5362` — hand-tuned cool gray; blue cast at the dark end, warm drift at the bright end
  - `success` `#0E8A4A` — deeper than Tailwind green-500, pairs with dark-on-green text
  - `warning` `#B8650E` — burnt amber, warmer than Tailwind amber and less yellow than gold
  - `error` `#C92A2A` — powerful red, 5.46:1 (AA pass)
  - `info` `#1B6FD4` — clear medium-blue, differentiable from teal primary (4.92:1)

  **Semantic token changes:**
  - `--hx-color-success-text` rebound from `success-600` to `success-700`. The new precision-cool `success-600` (`#0E8A4A`) sits at 4.42:1 on white — just under WCAG AA body-text threshold. `success-700` (`#146831`) restores 6.88:1 AA headroom. Matches the `error-text` / `warning-text` pattern at the same stop.
  - Dark-mode `text.placeholder` bumped from `neutral-500` to `neutral-400`. The new precision-cool `neutral-500` (`#66787B`) is 3.86:1 on dark surface.default — fails AA for placeholder text. `neutral-400` (`#8E9C98`) = 6.27:1.
  - Overlay RGB fallback values (`overlay.primary.25`, `overlay.error.25`, `overlay.neutral.12`) resynced against the new -500 / -900 hexes so color-mix()-less browsers match the CSS custom property values.

  **Reproducibility:**
  All ramps generated by `scripts/generate-palette.ts` — a deterministic OKLCH→sRGB generator (hand-rolled, zero runtime deps) that takes anchor hex + stop + curve params and emits all 11 stops. Run `pnpm tsx scripts/generate-palette.ts` to reproduce the JSON exactly. Same inputs always emit the same hexes; the math lives in the repo alongside the tokens.

  **Expected visual impact:**
  Largest single-commit visual change in the repo's history. Every surface that paints primary/accent/status color flips tone. Dark-mode surfaces shift from cool-slate to slightly blue-tinted cool gray (chromatic elevation). HC mode overrides (Windows High Contrast fidelity) are unaffected — they remain system-color-deferent.

  No token names renamed. No stops removed or added. Existing component-level `var(--hx-button-bg, var(--hx-color-primary-500, #...))` two-level fallback chains continue to resolve — the inner hex fallbacks across component styles will drift stale and are addressed in subsequent commits of this PR.

### Patch Changes

- Updated dependencies [c1c93f5]
- Updated dependencies [ef049df]
- Updated dependencies [56eec71]
- Updated dependencies [6327024]
- Updated dependencies [6577704]
- Updated dependencies [55d4523]
- Updated dependencies [8c7b41f]
- Updated dependencies [1439f83]
- Updated dependencies [9591b01]
  - @helixui/library@3.2.0

## 3.1.0

### Patch Changes

- Updated dependencies [36d5bde]
  - @helixui/library@3.1.0

## 3.0.0

### Major Changes

- edee58a: HELiX 3.0.0 — first major release to the enterprise healthcare channel.

  This release bumps `@helixui/library`, `@helixui/tokens`, and `@helixui/react` to `3.0.0` in lockstep (enforced via the `linked` package group in `.changeset/config.json`). See `packages/hx-library/CHANGELOG.md` and `docs/UPGRADING-TO-3.md` for the complete breaking-change surface and migration guide.

  Headline changes:
  - Subclassing contract — `HelixElement` and `FormMixin` override hooks promoted from `@internal` to `@protected` with stability guarantees gated to major releases.
  - `aria-label` / `hxAriaLabel` → `accessible-label` / `accessibleLabel` on all ARIA-labelable components.
  - `::part(error-message)` → `::part(error)` on the 13 form controls that expose the part (`hx-checkbox`, `hx-checkbox-group`, `hx-combobox`, `hx-date-picker`, `hx-field`, `hx-file-upload`, `hx-number-input`, `hx-radio-group`, `hx-select`, `hx-switch`, `hx-text-input`, `hx-textarea`, `hx-time-picker`). See `docs/UPGRADING-TO-3.md` §5 for the full list.
  - `hx-dialog.modal` defaults to `false` (silent behavior change — consumers relying on default modal behavior must add `modal` explicitly).
  - `hx-phi-field` strips the `value` attribute from the DOM after `connectedCallback` for HIPAA-aligned DOM-serialization safety.
  - `hx-date-picker` and `hx-time-picker` migrate from native modal `<dialog>` to non-modal popup.
  - `FormMixin` consolidation across all 15 form-associated components.
  - `Wc*` type aliases and 2.0 property-rename shims removed.
  - `@floating-ui/dom` becomes a dynamic import on first use.
  - Public-API allowlist enforced on the library barrel.
  - `@helixui/tokens` — `tokenStyles` remains exported but is deprecated since 2.1.0 (planned removal targeted for 4.0). Version bumped to 3.0.0 in lockstep with `@helixui/library` via the linked-package policy; no tokens source removals in this release.
  - `@helixui/react` — `ariaLabel` → `accessibleLabel`; named event detail types replace anonymous `CustomEvent<unknown>`. Version jumps from 1.x to 3.0.0 (bookkeeping bump realigned 1.1.4 → 2.1.2 before the major so all three public packages share a 3.0.0 line; see `.changeset/align-react-version.md`).

### Patch Changes

- e4b79be: chore(react): align version line with @helixui/library@2.1.2 in preparation for 3.0.0 lockstep

  The `@helixui/react` package was introduced later than `@helixui/library` and had accumulated an independent version history (last release 1.1.4). This bookkeeping bump realigns it to the same 2.1.2 baseline as `@helixui/library` and `@helixui/tokens` so the 3.0.0 major aggregates to a coherent 3.0.0 across all three public packages (see `docs/UPGRADING-TO-3.md`). `@helixui/react` is now in the `linked` group with `@helixui/library` and `@helixui/tokens` to enforce lockstep in future releases.

- 5c36408: Fix Storybook interaction tests for shadow DOM focus and event patterns; remove dead mixinDelegatesAria export; rename ariaLabel to accessibleLabel in React types to stop shadowing native HTMLElement.ariaLabel
- Updated dependencies [1ae0509]
- Updated dependencies [a610bb7]
- Updated dependencies [aff17e8]
- Updated dependencies [373bf84]
- Updated dependencies [19e966b]
- Updated dependencies [c8a63a0]
- Updated dependencies [61911c1]
- Updated dependencies [50b36a3]
- Updated dependencies [ae1e6e8]
- Updated dependencies [49fdb6c]
- Updated dependencies [196094a]
- Updated dependencies [6d62cc2]
- Updated dependencies [9c8720f]
- Updated dependencies [fce3340]
- Updated dependencies [a0562c4]
- Updated dependencies [20d0129]
- Updated dependencies [700c329]
- Updated dependencies [d3f1d2a]
- Updated dependencies [04ddfae]
- Updated dependencies [2d16e9b]
- Updated dependencies [d830889]
- Updated dependencies [bfca244]
- Updated dependencies [3f6c595]
- Updated dependencies [1fb3e7a]
- Updated dependencies [91e00b4]
- Updated dependencies [9a8cafb]
- Updated dependencies [6b2500d]
- Updated dependencies [edee58a]
- Updated dependencies [5c36408]
  - @helixui/library@3.0.0

## 1.1.4

### Patch Changes

- Updated dependencies [ba1e9bf]
  - @helixui/library@2.1.2

## 1.1.3

### Patch Changes

- Updated dependencies [928975d]
  - @helixui/library@2.1.1

## 1.1.2

### Patch Changes

- Updated dependencies [ba9c72d]
- Updated dependencies [97d75d9]
- Updated dependencies [56585b5]
- Updated dependencies [d6d2244]
- Updated dependencies [d887573]
- Updated dependencies [3c8937b]
  - @helixui/library@2.1.0

## 1.1.1

### Patch Changes

- e00e680: fix: remediate react wrapper test suite CI issues
- e0adb4e: add ssr browser api guards, fix event composition, complete fouc coverage, and fix drupal cdn path
- Updated dependencies [7641ef1]
- Updated dependencies [3bbe6a5]
- Updated dependencies [448c908]
- Updated dependencies [257cf7d]
- Updated dependencies [2d9d739]
- Updated dependencies [23f5f6f]
- Updated dependencies [4d85c91]
- Updated dependencies [bd97a70]
- Updated dependencies [262083c]
- Updated dependencies [8db97bd]
- Updated dependencies [5757017]
- Updated dependencies [0d22fe1]
- Updated dependencies [0a74c8c]
- Updated dependencies [670c553]
- Updated dependencies [923e9d1]
- Updated dependencies [1037809]
- Updated dependencies [2243d3c]
- Updated dependencies [91267a1]
- Updated dependencies [abb4de6]
- Updated dependencies [5c4e4c9]
- Updated dependencies [224884e]
- Updated dependencies [fd65331]
- Updated dependencies [727e99f]
- Updated dependencies [82bd233]
- Updated dependencies [6ceafc0]
- Updated dependencies [ff7bcfd]
- Updated dependencies [1f3791d]
- Updated dependencies [3b6017b]
- Updated dependencies [9c17779]
- Updated dependencies [de9ccbe]
- Updated dependencies [ba21f3f]
- Updated dependencies [5d9ccf7]
- Updated dependencies [917d707]
- Updated dependencies [3458dd0]
- Updated dependencies [d776f72]
- Updated dependencies [be9b080]
- Updated dependencies [984a6f6]
- Updated dependencies [64fd2fc]
- Updated dependencies [dad6c71]
- Updated dependencies [dd58277]
- Updated dependencies [dcf7a9c]
- Updated dependencies [e0ec673]
- Updated dependencies [27e5758]
- Updated dependencies [53ddf75]
- Updated dependencies [e0df165]
- Updated dependencies [87cdd7e]
- Updated dependencies [7f80a77]
- Updated dependencies [184d560]
- Updated dependencies [1f8eef7]
- Updated dependencies [0656b5f]
- Updated dependencies [cf0bc88]
- Updated dependencies [20d502c]
- Updated dependencies [af04577]
- Updated dependencies [4f5af84]
- Updated dependencies [c94a209]
- Updated dependencies [e0adb4e]
- Updated dependencies [281a09e]
- Updated dependencies [181876b]
- Updated dependencies [e89b4b9]
- Updated dependencies [3c48dba]
- Updated dependencies [31bab2a]
- Updated dependencies [9afb9c1]
- Updated dependencies [0660768]
- Updated dependencies [52868cd]
- Updated dependencies [8bf2c61]
- Updated dependencies [a6470e9]
- Updated dependencies [acb6076]
- Updated dependencies [1b587d2]
  - @helixui/library@2.0.0

## 1.1.0

### Minor Changes

- 54c2705: Add `@helixui/react` package with auto-generated React wrappers for the HELiX web component surface (98 wrappers at the 1.1.0 release date; the wrapper set has grown to 96 in the current generator output — consult `packages/hx-react/src/index.ts` for the live list and `packages/hx-library/custom-elements.json` for the underlying CEM).

  Wrappers are generated from `custom-elements.json` via `scripts/generate-react-wrappers.ts` using `@lit/react` `createComponent()`. Each wrapper includes `'use client'` for Next.js 15 App Router compatibility, full TypeScript prop types derived from CEM declarations, and React-style event callbacks (`onHxClick`, `onHxInput`, `onHxChange`, etc.).

  Tree-shakeable: each component is a separate entry point so importing `HxButton` does not bundle every component.

### Patch Changes

- Updated dependencies [23af064]
  - @helixui/library@1.1.2
