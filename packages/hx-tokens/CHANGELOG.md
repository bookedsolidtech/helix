# @helixui/tokens

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

## 4.0.0 [DEPRECATED]

Mistakenly published as MAJOR via the [library, tokens, react] linked-package group cascade. The 4.0.0 release contains only a text-muted + success-text contrast tweak — same code as 3.9.0. The 4.0.0 version is deprecated on npm; consumers should use 3.9.0.

## 3.9.0

### Minor Changes

- 1ea6a14: bump text.muted and success-text to AAA-strict (1.4.6) ratios

  The story-audit harness flagged hundreds of contrast failures that
  trace to two semantic text tokens being tuned to AA, not AAA-strict.
  The 7:1 strict floor for body-sized text (WCAG 1.4.6 AAA) is the
  HELiX cert authority — the AA tunings let the harness flag every
  docs / MDX prose body that paints muted text on a sunken surface,
  and every success callout that paints success text on a tinted
  success-50 surface.

  `text.muted` shifts from `neutral-600` (#4A5362) to `neutral-700`
  (#313E4B). The prior value cleared 7.76:1 on white, 7.25:1 on
  surface.raised, but only 6.63:1 on surface.sunken — sub-7:1 across
  every audit story that paints muted text on the sunken background
  chrome. The new value clears 10.93 / 10.20 / 9.34 across all three
  surfaces. The shift collapses muted with secondary (also
  neutral-700); the original neutral-600 / neutral-700 visual delta
  was already imperceptible in body copy, and the AAA mandate
  permits this collapse. text.muted retains its semantic identity
  for italics / smaller-size affordances and remains brand-overridable.

  `success-text` shifts from `success-700` (#146831) to `success-800`
  (#0B4D23). The prior value cleared 6.88:1 on white but only 6.35:1
  on success-50 and 5.85:1 on success-100 — sub-7:1 on every tinted
  success callout. The new value clears 10.00 / 9.23 / 8.50 across
  all three surfaces. Sister token `error-text` is already at
  error-700 (7.96:1 on white) per the 3.8.0 AAA recert; this commit
  brings the success ramp into matching AAA-strict territory.

  The dark-mode override for text.muted (neutral-400 = 6.27:1 on
  dark surface.default) is unchanged — dark-mode contrast was
  already AAA-tuned via the 3.2.0 dark.color.text.muted override.

### Patch Changes

- 7b42779: aaa-cert hx-icon as p0; wire @helixui/icons registry resolution

  `<hx-icon>` resolves through the `@helixui/icons` registry and is
  AAA-certed (P0) per WCAG 2.2 + 1.4.11 (non-text contrast). The
  component now ships a `library` attribute (default `'fa-free'`)
  that resolves through `getIconLibrary()`, plus integration of the
  optional library mutator hook (runs AFTER security sanitization).

  Adds the `--hx-icon-stroke-width` semantic token (default `2`)
  consumed by stroke-paint and mixed-paint consumer libraries; the
  bundled `helix` and `fa-free` libraries are fill-only and ignore
  it.

  The formal AAA harness gains a `non-text-contrast-icon` check that
  measures rendered glyph contrast against the document background.
  `iconLibraryAaaVerdict()` from `@helixui/icons` exposes the
  per-library AAA verdict for both built-ins (`pass` across all three
  dimensions). `packages/hx-icons/AAA-VERDICT.md` publishes the full
  per-library evidence including borderline glyphs (`dot`, `dash`,
  `star-outline`) with recommended minimum render sizes.

  Existing `src` (inline-fetch) and `sprite-url` escape hatches are
  preserved unchanged.

## 3.8.0

### Minor Changes

- b5a3c60: AAA Tier 3 — full P0 surface measured against WCAG 2.2 AAA via formal audit harness (3.8.0).

  ## Posture (read this first)

  This release ships **self-attested AAA conformance posture** for 43 P0 components against WCAG 2.2 AAA, sourced from a formal audit harness with W3C-cited spec URLs and three-way cross-tool agreement (axe-core + WCAG luminance math + CEM helixMeta claims).

  **This is NOT a third-party-signed VPAT 2.5 cert.** Such a cert requires engagement with a credentialed accessibility vendor (e.g., Deque, TPGi, Level Access) and is on the roadmap, not in this release. We deliberately use "conformance posture per WCAG 2.2" (not "AAA Certified") in messaging to avoid mis-stating the legal/compliance weight of the claim.

  What this release IS: the most rigorous self-attested AAA evidence stack we know of in any open enterprise web-component library. What it is NOT: a substitute for third-party AAA certification.

  ## What ships

  **43 of 43 P0 components measured against 11 AAA criteria** via the formal audit harness:
  - Latest verification run: **473/473 cells, 356 Supports + 117 Not Applicable, zero Partials, zero Fails**
  - Snapshot: `.reports/formal-aaa-audit/PRE-RELEASE-VERIFICATION-3.8.0.md` (gitignored evidence)
  - Cert toolkit (`scripts/aaa-cert.mjs`) gates on formal audit verdict, not the informational matrix harness
  - Standards reference: `scripts/aaa-standards.json` (46 W3C URLs WebFetch-verified 2026-05-08)

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
  - 43 `AAA-AUDIT.md` files regenerated against `scripts/AAA-AUDIT.formal.template.md` using VPAT 2.5 verdict language ("Supports" / "Not Applicable") and W3C spec URLs
  - Storybook A11y Dashboard with live cert-count hero (reads CEM directly, refreshes on every cert)
  - 5 anchor components (hx-button, hx-text-input, hx-checkbox, hx-dialog, hx-tabs) ship MDX stories as proper AAA conformance documentation (hero scenario + AAA card + APG walkthrough + consumer obligations + InlineAuditPanel embed)
  - Remaining 38 component MDX rewrites land in subsequent minors

  ## Cert tooling
  - `scripts/aaa-formal-audit.mjs` — formal audit harness, cert authority for `pnpm aaa:cert`
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

## 3.5.0

### Minor Changes

- 191bda3: AAA conformance posture + Storybook canonical-template foundation.

  **`@helixui/tokens`**
  - Added WCAG 1.4.6-correct contrast pair role classification (body-text 7:1 / large-text 4.5:1 / ui-element 3:1). Pair count: 156 of 163 AAA-passing, 0 sub-AA. Public test helpers (`PairRole`, `aaaThresholdForRole`) exposed for downstream conformance reporting.
  - New `pnpm contrast:report` script generates `CONTRAST-REPORT.md` + `.cache/contrast-report.json` per release for the AAA conformance ledger.

  **`@helixui/library`**
  - `checkA11y(level: 'aa' | 'aaa')` test-utils API for per-component AAA opt-in (default unchanged for backward compat).
  - New CEM analyzer plugin `cem-plugins/aaa-certified.mjs` reads `@aaa-certified <date>` JSDoc tags and emits `aaaCertified: true` + `aaaCertifiedDate` on the manifest. Allow-list infrastructure at `scripts/a11y-aaa-allowlist.json` (currently empty — per-component certification is the next major phase).

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

## 3.3.1

### Patch Changes

- dae4918: 3.3.0 brand→data-brand auto-reflection — contract design and test matrix only. Implementation paused pending operator signoff per the planning note's "design up front, get explicit signoff" recommendation. No runtime change in this changeset; this is the architectural artifact that lets the implementation diff land in a single shot rather than iterating through codex.

  **What lands.**
  - `packages/hx-library/src/components/hx-theme/BRAND_REFLECTION_CONTRACT.md` — the 4-shape × 3-theme × registered/unregistered matrix (24 cases) with row-by-row expected behavior, the narrowed registered-only management model, ownership-tracking model (discriminated `LastApplied` union), state-transition table, mutation guard semantics, late-registration recovery via additive registry subscription API, SSR adoption story, Drupal Twig alignment plan, and the docs delta for `multi-brand-theming.md:39`.
  - `packages/hx-library/src/components/hx-theme/hx-theme-data-brand-reflection.test.ts` — 35 `it.todo()` cases: 24 row cases by case number, 5 state-transition todos, 2 mutation-guard todos, 3 R1 edge-case todos (late registration, ownership relinquish under external override, advisory dedupe), and 1 disconnect todo. The test file is the gate: when the contract flips to implementation, every `it.todo` becomes a real assertion.

  **What does NOT land.**
  - No change to `hx-theme.ts`. The runtime continues to NOT reflect `brand` to `data-brand` (current 3.2.x contract).
  - No change to `hx-theme.twig`. The Twig helper continues to drop `data-brand` per R31 cleanup.
  - No change to `multi-brand-theming.md`. The "runtime does not reflect" line at :39 remains accurate until the runtime change ships.
  - No change to `HelixBrandRegistry`. The additive `subscribe(brandName, callback)` API specified in the contract lands with the implementation diff, not this design changeset.

  **Why the artifact-only approach.**

  The 3.2.2 codex iteration loop (rounds 26-29) attempted unconditional reflection inside an unrelated palette PR. Each round closed the previous round's findings and surfaced new edge cases. Codex was finding the matrix; the matrix needed to be designed first. The R29-R30 verdict, captured in `00-Planning/helix/Brand → data-brand Auto-Reflection (deferred from 3.2.2).md`:

  > "Plan up front. Write the contract for all four shapes × three themes × registered/unregistered before writing code. Get explicit signoff. Don't let codex find the matrix for you."

  This changeset is that plan. The signoff gate is explicit in the contract document. Implementation lands as a separate diff once Jake confirms the matrix.

  **R0 → R1 redesign.**

  R0 of this contract used an "aggressive cleanup" model: any `brand !== ''` authorized the runtime to overwrite or strip `data-brand` regardless of registration state. Codex review on R0 returned a `blocking` verdict with 1 high + 5 medium structural findings:
  1. **Late registration / ordering hazard (high).** No event channel from registry → component; a brand registered after mount left the component in the unregistered path indefinitely.
  2. **Ownership tracking precision (medium).** A boolean-equivalent `_managedDataBrand` flag could not distinguish "runtime's prior write still live" from "author has overwritten."
  3. **Shape D unregistered loss (medium).** R0 stripped author-supplied `data-brand` even when the registry was inactive — silently destroying the cascade-only override path.
  4. **Shape B HC asymmetry (medium).** R0 did not loud-document the safety implication that Shape B authors own the HC guard.
  5. **Mutation guard precision (medium).** "Universal authorization" wording overstated what the design enforced without a `MutationObserver`.
  6. **Test stub coverage gaps (medium).** No coverage for late-registration recovery, ownership relinquish under external override, or advisory dedupe.

  R1 closes all six in a single revision per the planning rule ("redesign once, do not iterate"):
  - F1 → additive `HelixBrandRegistry.subscribe(brandName, callback)` API; `register()` / `_clear()` invoke `_notify()` synchronously; `hx-theme` subscribes/unsubscribes across the lifecycle. Bumps `@helixui/tokens` because the public registry API surface widens.
  - F2 → discriminated union `LastApplied = { kind: 'unmanaged' } | { kind: 'set', value: string } | { kind: 'cleared' }` for precise relinquish semantics.
  - F3 → contract narrowed: runtime only manages `data-brand` when `brand !== '' AND isRegistered`. Cases 14, 16, 18, 20, 22, 24 expected outcomes flipped from "removed" to "untouched."
  - F4 → Shape B HC safety implication block added to the contract; cases 11, 12 explicitly note "author-responsible HC guard."
  - F5 → "authoritative at reconcile boundaries" framing replaces the universal-authorization wording; `MutationObserver` rejected with rationale.
  - F6 → 3 new `it.todo` cases on the test stub (late registration, ownership relinquish under external override, advisory dedupe). Total stub count rises from 32 → 35.

  **Codex review on this diff.**

  A single codex pass on R1 closes the audit loop. If codex surfaces concerns on R1, they fall into two buckets per the contract's approval-gate section: (a) a row of the matrix that should flip — Jake's call — or (b) implementation-diff concerns, which are out of scope for this design-only changeset. The pattern from rounds 26-29 — codex round → patch → new finding → patch — is explicitly the failure mode this work avoids.

- 65feccb: 3.3.0 theme architecture contracts — design-only changeset for two deferred items: (1) HC brand-token suppression scope, (2) `replaceSync()` failure-mode hardening. R1 redesign — closes 8 codex blocking findings from R0 in a single revision per the planning rule "redesign once, do not iterate." Implementation paused pending Jake's signoff per the planning rule "design up front, get explicit signoff." No runtime change in this changeset; the artifacts let the implementation diff land in a single shot rather than iterating through codex.

  **What lands.**
  - `packages/hx-library/src/components/hx-theme/HC_BRAND_TOKEN_SPLIT_CONTRACT.md` — color-vs-non-color allowlist categorization, namespace-stratified unknown-token policy (R1: strict rejection for unknown `--hx-*` and color-bearing `--brand-*`; warn-and-treat-as-color for unaudited `--brand-<other>-*`; audited `--brand-*` subprefixes accepted), updated `_applyEffectiveTheme()` shape with deferred-advisory-commit pseudocode (R1: advisory state commits only after `replaceSync()` succeeds), re-registration atomicity section, 9-case row matrix + 3 state transitions + 8 categorization edges = 20 test cases, migration story, and docs deltas for `BRAND_THEMING.md` + `multi-brand-theming.md:39`.
  - `packages/hx-library/src/components/hx-theme/REPLACESYNC_HARDENING_CONTRACT.md` — Path A vs Path B analysis, decision (Path A primary for **brand-registry inputs only**; Path B primary for non-brand inputs like density/theme CSS; both surfaces share defense-in-depth try/catch), CSS value validator design (15 categories, regex-based, permissive identifier fallback), 45 validator test cases + 12 integration test cases. R1: HC-split-as-prerequisite sequencing (no longer "independently mergeable" — replaceSync hardening composes onto the categorization model from the HC contract).
  - `packages/hx-library/src/components/hx-theme/hx-theme-hc-brand-split.test.ts` — 20 `it.todo()` cases (9 row + 3 transitions + 8 categorization edges) pinning the R1 HC split contract.
  - `packages/hx-library/src/components/hx-theme/hx-theme-replacesync-hardening.test.ts` — 12 `it.todo()` cases (5 registration + 3 happy path + 2 defense-in-depth + 2 state invariants) pinning the runtime-integration surface of the replaceSync hardening contract.
  - `packages/hx-tokens/src/__tests__/css-value-validator.test.ts` — ~45 `it.todo()` cases covering all 15 validator value categories (color-hex, color-oklch, color-rgb, color-hsl, color-named, length, unitless-number, duration, easing, font-family, font-weight, var-reference, shadow, gradient, identifier) and structural rejections (null bytes, unbalanced parens/quotes, empty string, rule-break attempts).

  **What does NOT land.**
  - No change to `hx-theme.ts`. HC suppression continues to drop ALL brand tokens (color and non-color); `replaceSync()` calls continue to be unwrapped and unvalidated.
  - No change to `HelixBrandRegistry.register()`. Validation continues to check token presence only (the 22 `REQUIRED_SEMANTIC_TOKENS`), not value syntax, name namespace, or category.
  - No `mergeBrandTokens()` signature change.
  - No new CSS value validator module — the contract specifies it; the implementation lands separately.
  - No changes to `BRAND_THEMING.md`, `multi-brand-theming.md`, or `hx-theme.mdx`. Doc deltas are queued in the contract documents.

  **R0 → R1 redesign — codex blocking findings closed.**

  Codex r-arch on R0 returned BLOCKING with 8 findings. R1 closes all 8 in a single revision:

  | #   | R0 finding                                                                                                             | R1 closure                                                                                                                                                                                                                      |
  | --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | F1  | `--brand-*` allowlist is over-broad — admits `--brand-color-*`/`--brand-shadow-*` as non-color, leaking color under HC | HC contract narrows `--brand-*` to four audited subprefixes: `--brand-layout-*`, `--brand-logo-*`, `--brand-spacing-*`, `--brand-typography-*`                                                                                  |
  | F2  | "Independently mergeable" claim contradicts shared `register()` body                                                   | Both contracts add a "Sequencing" block; HC split is now an explicit prerequisite of replaceSync hardening; the two share the categorized storage model                                                                         |
  | F3  | Path A claim covers all `replaceSync()` inputs but density/theme strings don't pass through brand registry             | replaceSync contract narrows Path A scope to brand-registry inputs only; density and theme CSS strings rely on the try/catch as primary mechanism                                                                               |
  | F4  | Advisory state committed before sheet update — log/state can run ahead of failed `replaceSync()`                       | HC contract's `_applyEffectiveTheme()` pseudocode defers advisory commit until after `replaceSync()` succeeds; new test case "Advisory state ordering" pins this                                                                |
  | F5  | Token-value category count inconsistent (13 vs 15 across enum / intro / approval gate)                                 | Normalized to 15 across all locations: contract intro, enum, validator test stub, approval gate                                                                                                                                 |
  | F6  | Validator test stub missing categories present in the enum                                                             | 7 missing categories added: color-hsl, unitless-number, easing, font-family, font-weight, shadow, gradient                                                                                                                      |
  | F7  | Unknown-token "warn + treat as color" policy too permissive — masks `--hx-*` typos and hides a11y-critical token gaps  | Namespace-stratified policy: unknown `--hx-*` rejects (with rationale), color-bearing `--brand-*` rejects, unaudited `--brand-<other>-*` warns + treats as color, audited `--brand-*` subprefixes accept, anything else rejects |
  | F8  | Re-registration atomicity unspecified — partial validation throw could corrupt previously-stored brand                 | HC contract adds atomicity section: validate into a working set, single `_brands.set()` only after every check passes, subscribers not notified on failed registration; new test case pins this                                 |

  **Coupling between the two contracts.**

  The HC split contract and the replaceSync hardening contract share the same surface (`HelixBrandRegistry.register()` validation pass, `_applyEffectiveTheme()` reconcile body) and are **not** independently mergeable at the storage layer. R1 narrows the prior independence claim: implementation order is fixed (HC split first, replaceSync hardening second). Both contracts can ship in the same PR pair, but the implementation diff for the validator must layer onto a `register()` body that already does categorization. Attempting to land the validator first wastes editing capacity — the surface it modifies is materially reshaped by the HC split.

  **Sequencing relative to the brand-reflection PR.**

  The brand-reflection contract (PR #1600) is independent of both contracts in this PR. All three contracts can ship in any order. If Jake signs all three off in one sitting, the implementation diffs can be staged sequentially without rebasing pain.

  **Codex review on this diff.**

  Single codex pass on R1 is acceptable per the planning rule. R1 is the redesign that closes the loop on R0's BLOCKING verdict. If R1 codex surfaces concerns, they convert to either (a) row-flip decisions for Jake or (b) implementation-diff acceptance criteria — not another redesign. Iteration on the contract surface is explicitly off the table per the planning note.

## 3.3.0

### Minor Changes

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

### Patch Changes

- 4f446be: 3.2.2 codex round-11 remediation — backwards-compat aliases + variant override-path documentation

  Closes 2 medium codex round-11 findings on the staging→main candidate. Rolls into the same 3.2.2 patch.

  **Finding 2 [api-design] — Backwards-compat aliases for renamed border-on-dark tokens.**

  `--hx-color-border-on-dark-default` and `--hx-color-border-on-dark-subtle` shipped in `@helixui/tokens@3.2.0` and `@3.2.1`. Round-8 renamed them to `--hx-color-surface-on-dark-overlay-{default,subtle}` because the original names lied about their behavior — translucent fills, never borders, sub-3:1 alpha. A patch-level rename without aliases would silently break any consumer theme that set the old names as overrides.

  Restored the old names in `tokens.json` as deprecated aliases that resolve through the new surface tokens across all three tiers (base / dark / high-contrast). `dist/tokens.css` now emits both name pairs, so existing consumer overrides continue to apply unchanged. Marked deprecated in description fields; removal scheduled for 4.0.0.

  The round-8 structural-shape lock in `contrast.test.ts` was extended to:
  - assert the new `border.on-dark-*` shape `['on-dark-default', 'on-dark-strong', 'on-dark-subtle']` across all 3 tiers
  - assert each alias resolves through the surface namespace (catches any future regression that re-introduces a non-aliased border under that name with raw sub-3:1 alpha).

  **Finding 1 [api-design] — Inverted-primary override path documentation.**

  Codex flagged that the new `:host([inverted]) .button--primary` rest-state rule binds `--hx-button-bg` at descendant scope, shadowing host-level consumer overrides of that property. Investigation found:
  - This shadow behavior is the **established variant convention** across the entire `hx-button` cascade. Every `.button--{variant}` rule (light primary at line 89, danger at line 120, secondary, tertiary, ghost) binds `--hx-button-bg` directly with the same descendant-scope shadowing. The new inverted-primary rest rule matches this convention symmetrically.
  - The documented consumer override path for any `--hx-color-action-{variant}-bg*` paint is the upstream semantic, not `--hx-button-bg`. For inverted-primary at rest, that's `--hx-color-action-primary-bg-inverted-rest` (parallel to light primary's `--hx-color-action-primary-bg`).
  - An attempted "cascade-preserving self-fallback" form `var(--hx-button-bg, var(--semantic, hex))` was implemented and reverted: per W3C css-variables-1 §3, a custom property referencing itself in its own value forms a cycle and becomes invalid at computed-value time. The attempted fix would have invalidated `--hx-button-bg` entirely, breaking the documented semantic override path that `dark-mode-resolution.test.ts` pins.

  Resolution: kept the direct-binding form, expanded the inline comment to cite the variant convention and the override-path test that pins it. The original 3.2.2 changeset's "consumers must override the upstream semantic" wording remains accurate but is reframed here as documenting an existing pattern rather than introducing a new restriction. No source change to the rule itself; the override path was, and remains, `--hx-color-action-primary-bg-inverted-rest`.

- e41346c: 3.2.2 codex round-12 remediation — consume-site backwards-compat + variant-shadow JSDoc/Storybook honesty

  Closes 2 codex round-12 BLOCKING findings on the staging→main candidate. Rolls into the same 3.2.2 patch.

  **Finding 1 [api-design high] — Round-11 alias direction broke the canonical override path.**

  Round-11 added `border.on-dark-{default,subtle}` aliases at `:root` that resolved through the new `surface.on-dark-overlay-*` names. Round-12 proved that approach broken in two directions: not only did consumer overrides on the deprecated border name fail to reach paint (the round-12 finding), but a runtime test introduced this round caught a deeper issue — a `:root`-level alias `:root { --A: var(--B) }` freezes `--A` to `:root`'s `--B` at computed-value time per W3C css-variables-1 §3, so host-scoped overrides on the canonical name (`--B`) get shadowed by the `:root`-resolved value of `--A`. Round-11's alias broke the canonical override path.

  **Resolution:** moved backwards-compatibility from the token tier to the consume sites.
  - Reverted the `:root` alias declarations: `border.on-dark-{default,subtle}` are no longer emitted in `tokens.css` (base, dark, HC tiers). The published CSS variable names remain _settable_ by consumers — they're simply not declared at `:root` anymore, which avoids the computed-value-time freeze.
  - Every component rule that paints with `surface.on-dark-overlay-*` now reads both names via a deprecated-first fallback chain:

    ```css
    var(--hx-color-border-on-dark-default,
      var(--hx-color-surface-on-dark-overlay-default, rgba(255, 255, 255, 0.3)))
    ```

    Touched: `hx-button.styles.ts` (5 inverted-variant fills — secondary hover, tertiary rest [-subtle], tertiary hover, ghost hover, outline hover) and `hx-side-nav.styles.ts` (`.side-nav__toggle:hover` background).

  - Override semantics now (until 4.0.0 removal):
    - Consumer override on the deprecated `--hx-color-border-on-dark-{default,subtle}` (anywhere in the cascade) → wins.
    - Consumer override on the canonical `--hx-color-surface-on-dark-overlay-{default,subtle}` → wins (deprecated name is undefined at `:root`, falls through).
    - No override → canonical `:root` value applies via the fallback chain.
  - Round-11's structural-shape lock in `contrast.test.ts` was the wrong shape — it pinned the deprecated aliases at `:root`. Updated to assert `border.on-dark-*` contains exactly `['on-dark-strong']` across all 3 tiers; surface lock unchanged.
  - Two paint-level regression tests added to `dark-mode-resolution.test.ts`:
    - consumer override on the deprecated `--hx-color-border-on-dark-subtle` reaches `hx-button[variant="tertiary"][inverted]` background in light + dark
    - consumer override on the canonical `--hx-color-surface-on-dark-overlay-subtle` still reaches paint when the deprecated name is unset (proves the both-name chain falls through correctly for new consumers)

    `hx-side-nav` uses identical syntax verbatim — covered by the syntactic shape lock plus file-level grep, not duplicated as a runtime test because `:hover` synthesis isn't this file's testing pattern.

  **Finding 2 [api-design medium] — `--hx-button-bg` JSDoc and Storybook contradicted runtime.**

  Every `.button--{variant}` rule rebinds `--hx-button-bg` at descendant scope, which shadows any host-level override. The JSDoc at `hx-button.ts:38` and the CSS-properties Storybook story (`hx-button.stories.ts`) advertised `style="--hx-button-bg: #059669"` as the override path for primary buttons — every consumer following that guidance got a no-op.

  Fixed:
  - `hx-button.ts:38` `@cssprop` description rewritten to flag variant-shadowing explicitly and direct consumers to the upstream semantic (`--hx-color-action-{variant}-bg{,-inverted-rest}`) for variant fills. Notes that `--hx-button-bg` still works for unstyled base buttons and participates in the internal hover/active rebinding chain.
  - `hx-button.stories.ts` CSS-properties demo: replaced the broken `--hx-button-bg` example with `--hx-color-action-primary-bg` (the actually-working override path); updated the trailing `<pre>` Usage block to scope to `[variant='primary']` and use the semantic token.

  Out of scope for `hx-library`: the misleading `--hx-button-bg` example surface in `apps/docs/` is wider than initially scoped. Full follow-up list (per round-13 codex audit):
  - `apps/docs/src/content/docs/components/documentation/storybook.md:834`
  - `apps/docs/src/content/docs/extending/theming-quick-start.md:112`
  - `apps/docs/src/content/docs/guides/theming.mdx:208` (per-component override block)
  - `apps/docs/src/content/docs/guides/theming-recipes.md:491`
  - `apps/docs/src/content/docs/components/documentation/jsdoc.md:506`
  - `apps/docs/src/content/docs/design-tokens/customization.md:40,54,87,92`
  - `apps/docs/src/content/docs/design-tokens/tiers.md:74`

  Tracked as a follow-up docs PR; per-CLAUDE.md scope rules, `apps/` changes don't ride this `hx-library`/`hx-tokens` PR. Release notes for 3.2.2 will direct consumers to the canonical `--hx-color-action-{variant}-bg` override path so the docs surface drift doesn't materially mislead until the docs PR lands.

- 0d69763: 3.2.2 codex round-8 remediation — taxonomy honesty + fallback-chain canonicalization

  Closes 4 codex round-8 findings on the staging→main candidate. Rolls into the same 3.2.2 patch — additive token rename only (no API change, no removed semantic).
  - **#1 [high] Focus-ring fallback chain**: 20 `.styles.ts` files used `var(--hx-focus-ring-color, var(--hx-color-primary-600, #0f7078))`. Collapsed to `var(--hx-focus-ring-color, #0f7078)` — the inner semantic step was unreachable because consumers override `--hx-focus-ring-color` directly, never `--hx-color-primary-600`.
  - **#2 [high] Taxonomy lie**: `--hx-color-border-on-dark-{default,subtle}` resolved to `overlay-white-30/10` (≈2.07:1 / 1.30:1) — translucent fills, not 3:1-capable borders. Renamed to `--hx-color-surface-on-dark-overlay-{default,subtle}` across base, dark, and HC tiers. `border-on-dark-strong` (overlay-white-70 / overlay-black-50, both ≥3:1) is the only border survivor. Repointed `hx-button` (4 fills) and `hx-side-nav` (toggle hover) to the new surface tokens.
  - **#3 [medium] hx-button JSDoc drift**: `--hx-button-inverted-ghost-hover-bg` `@cssprop` claimed "≈ 5:1 vs neutral-900" — false. Now reads "translucent fill, not a border; contrast not applicable".
  - **#4 [medium] Test gap**: Added a 3-tier structural-shape lock to `contrast.test.ts` that asserts `border.on-dark-*` contains exactly `['on-dark-strong']` and `surface.on-dark-overlay-*` contains exactly `['on-dark-overlay-default', 'on-dark-overlay-subtle']` across base + dark + high-contrast. Catches future taxonomy regressions in any tier.

  Round-9 follow-up: extended the lock from base-only to all three tiers (caught by codex), and dropped numeric ratios from `hx-button.styles.ts` focus-visible comment (pointed at `tokens.json` as canonical). Codex round-10 verdict: pass, 0 findings.

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

- 450a70e: 3.2.2 staging→main codex r2 — explicit migration documentation for direct readers of the deprecated `--hx-color-border-on-dark-{default,subtle}` token names. No runtime behavior change; this is a documentation-and-rationale closeout for codex r2's medium api-design finding.

  **Background.** 3.2.2 renamed two tokens that shipped as public API in 3.2.0/3.2.1:
  - `--hx-color-border-on-dark-default` → `--hx-color-surface-on-dark-overlay-default`
  - `--hx-color-border-on-dark-subtle` → `--hx-color-surface-on-dark-overlay-subtle`

  The reason: both values use 30%/10% alpha, which cannot satisfy the WCAG 1.4.11 3:1 contrast floor required of borders against either neutral-900 (2.07:1) or neutral-0 (1.30:1). They were never functioning as borders; they were always translucent fills. The rename relocates them under the correct semantic family (`surface.on-dark-overlay-*`) where the contrast contract does not apply.

  **The codex r2 finding.** The deprecated names are no longer emitted at `:root` in `dist/tokens.css`. Component-internal usage continues to work via a both-name fallback chain at every consume site (`var(--hx-color-border-on-dark-{name}, var(--hx-color-surface-on-dark-overlay-{name}, …))`) and `dark-mode-resolution.test.ts` pins overrides on both the deprecated and canonical names. But downstream code that reads the deprecated names DIRECTLY — outside an hx-\* component — will get an empty value:

  ```css
  /* Downstream Drupal/app stylesheet (NOT inside an hx-* component shadow root) */
  .my-custom-overlay {
    /* 3.2.0 / 3.2.1: resolves to var(--hx-overlay-white-30) */
    /* 3.2.2:         resolves to empty */
    background-color: var(--hx-color-border-on-dark-default);
  }
  ```

  ```js
  // 3.2.0 / 3.2.1: returns "rgba(255, 255, 255, 0.3)" (or similar)
  // 3.2.2:         returns ""
  getComputedStyle(document.documentElement).getPropertyValue('--hx-color-border-on-dark-default');
  ```

  **Why we did not emit the deprecated names at `:root` as aliases.** Two `:root`-alias variants were considered. Both fail at the same consume-site read order, for the same reason — and both would silently break the documented host-scoped canonical-override path.

  **Variant A — `var()` alias:**

  ```css
  :root {
    --hx-color-border-on-dark-default: var(--hx-color-surface-on-dark-overlay-default);
  }
  ```

  The inner `var()` resolves at `:root`'s computed-value time (CSS Custom Properties §3) and inherits down to every descendant as an opaque resolved value. Host-scoped overrides on the canonical name (`:host { --hx-color-surface-on-dark-overlay-default: red; }`) are not consulted, because the deprecated name is already set on the host (via inheritance from `:root`) at the moment the consume site reads `var(--hx-color-border-on-dark-default, var(--hx-color-surface-on-dark-overlay-default, …))`.

  **Variant B — concrete-value alias (light + dark):**

  ```css
  :root {
    --hx-color-border-on-dark-default: rgba(255, 255, 255, 0.3);
  }
  .dark {
    --hx-color-border-on-dark-default: rgba(255, 255, 255, 0.3); /* or dark-mode value */
  }
  ```

  No inner `var()` to substitute — but inheritance still delivers a non-empty value to every descendant. Same failure mode: the consume site reads the deprecated name first, finds it set (via inheritance), and never falls through to the canonical override on the host. Variant B has additional cost: a literal value at `:root` breaks the primitive chain. A consumer who overrides `--hx-overlay-white-30` at `:root` would see that change reflected in the canonical token but NOT in the deprecated alias, silently desynchronizing the two names.

  **Both variants would fail the canonical-override test** at `dark-mode-resolution.test.ts:219-227` (which mounts `<hx-button variant="tertiary" inverted>` with a host-style override on `--hx-color-surface-on-dark-overlay-subtle` and asserts that paint resolves to the override). The test exists precisely to pin this contract.

  The chosen design — no `:root` emission, both-name fallback at consume sites — breaks an undocumented direct-reader path explicitly, rather than breaking a documented host-override path silently.

  **Migration for direct readers.** If your downstream code reads `--hx-color-border-on-dark-{default,subtle}` directly (not via an hx-\* component), update to the canonical names:

  ```diff
  - background-color: var(--hx-color-border-on-dark-default);
  + background-color: var(--hx-color-surface-on-dark-overlay-default);
  ```

  Both names continue to be honored when set as consumer overrides on hx-\* components (via the both-name fallback chain at the consume site). The deprecated names are scheduled for hard removal in 4.0.0; until then, component-internal usage is safe in either direction.

  **No runtime change in this changeset.** The deprecation rationale at `tokens.json:218` was strengthened to call out the direct-reader trade-off and enumerate both rejected alias variants. No CSS, no test, no component logic moved.

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

- 9591b01: Library-wide semantic token rebinding. 36 components, ~190 token swaps, 9 commits.
  - Adds three new semantic tokens to `@helixui/tokens`: `--hx-color-text-strong`, `--hx-color-text-placeholder`, `--hx-color-surface-inverse`. All three ship with Light, Dark, and High-Contrast mode values.
  - Rebinds surfaces, text, and borders across 36 components from primitive `--hx-color-neutral-*` references to semantic `--hx-color-surface-*` / `--hx-color-text-*` / `--hx-color-border-*` tokens. Components now flip correctly in Dark and High-Contrast modes — previously only focus rings responded to mode changes.
  - Eliminates the `hx-tooltip` and `hx-side-nav` "intentional primitive" carve-outs; both now bind to `--hx-color-surface-inverse` + `--hx-color-text-inverse`.
  - Form-input borders strengthen by one shade in Light mode (`neutral-300` → `border-strong` which resolves to `neutral-400`). This is the only visual diff in Light mode and it is WCAG-positive — form affordance contrast increases.
  - Adds the Component Token Binding Rule to `design-tokens/tiers` docs and a regression test that fails if a rebinding regresses back to a primitive.
  - Brand ramps, spacing/sizing/typography tokens, and `box-shadow` rgba literals are intentionally untouched. A shadow-semantics follow-up will cover the dark-mode shadow tinting gap.

### Patch Changes

- b029ef5: Fix WCAG AA contrast failures across `--hx-color-text-on-{role}` and the muted/secondary body-text hierarchy surfaced by the new contrast regression matrix.

  The 3.2.0 precision-cool palette refresh (commit 2) silently dropped six pairs below the WCAG AA 4.5:1 floor for body text. The new contrast regression test in `packages/hx-tokens/src/__tests__/contrast.test.ts` is the gate that caught these — exactly the bug class it was built to prevent.

  **Light-mode `text.on-{role}` rebindings (neutral-0 → neutral-900):**
  - `text.on-primary` on `primary-500` (#429797): 3.44:1 → 5.20:1 (AA pass)
  - `text.on-secondary` on `secondary-500` (#40969F): 3.45:1 → 5.18:1 (AA pass)
  - `text.on-error` on `error-500` (#E5493E): 3.92:1 → 4.56:1 (AA pass)
  - `text.on-info` on `info-500` (#0C8BEB): 3.55:1 → 5.03:1 (AA pass)

  These join `on-success` (fixed in commit 1) and `on-warning` in the dark-text-on-brand-surface pattern. The four precision-cool brand-500 hues (primary/secondary/error/info) are too light to carry white text at AA — dark text is the only AA-safe option without darkening the brand ramps.

  **Light-mode body-text hierarchy adjustment (caught unexpectedly by the matrix):**
  - `text.muted`: `neutral-500` (#66787B) → `neutral-600` (#4A5362). Muted on `surface.raised` (#F5F8F3) was 4.32:1 — pre-existing AA fail from commit 2's neutral ramp. Now 7.36:1.
  - `text.secondary`: `neutral-600` → `neutral-700` (#313E4B). Bumped to preserve the primary > strong > secondary > muted hierarchy now that muted occupies the slot secondary used to live in. neutral-700 on every light surface is 9.01:1 or better (AAA).

  **Dark-mode `text.disabled` rebinding (`neutral-600` → `neutral-500`):**

  `neutral-600` (#4A5362) on dark `surface.default` (#0D1825) = 2.30:1, fails the 3:1 UI floor. `neutral-500` (#66787B) = 3.86:1, AA UI pass. Disabled is WCAG-exempt under 1.4.3 but we still gate at 3:1 so it stays visibly distinct rather than invisible.

  No dark or high-contrast `on-{role}` changes — those modes already passed.

  Components painting text on primary/secondary/error/info surfaces (badges, buttons, alerts, toasts, status pills) will flip from white text to dark text in light mode. Every prior render at the AA failure was a defect.

- adf953d: Fix WCAG AA contrast failure on `--hx-color-text-on-success`.

  The token resolved to `var(--hx-color-neutral-0)` (white) on `--hx-color-success-500` (#16A34A) — a contrast ratio of ~2.8:1, which fails WCAG AA for body text (4.5:1) and large text (3:1). Rebound to `var(--hx-color-neutral-900)` (dark), giving 11.2:1 on the same green — AAA pass. Matches the existing on-warning pattern, which paints dark text on amber for the same reason.

  Dark mode and high-contrast overrides are unchanged: HC still emits `#000000` on bright HC success, dark mode now inherits the dark-on-light pattern via the cascade.

  Components painting text against a success surface (e.g., success badges, toasts, inline alerts) will flip from white text to dark text. This is the intended visual change — every prior render at the AA failure was technically a defect.

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

## 2.1.2

### Patch Changes

- ba1e9bf: docs: update all tokenStyles references for adopted stylesheets architecture; deprecate tokenStyles in @helixui/tokens

## 2.0.0

### Minor Changes

- be9b080: Add high-contrast token layer with WCAG AAA compliant color overrides and contrast validation utility. Tokens activate via `[data-hx-contrast="high"]` attribute or `prefers-contrast: more` media query.
- 184d560: feat(motion): add motion tokens and prefers-reduced-motion support

  Adds `--hx-easing-decelerate` and `--hx-easing-accelerate` design tokens to `@helixui/tokens`.

  Adds a `motion` attribute to `hx-theme` accepting `"full"` (default), `"reduced"`, and `"none"`. When `motion="reduced"` or `"none"`, all duration tokens collapse to `0ms` and all easing tokens resolve to `linear`. When `motion="full"`, the OS `prefers-reduced-motion: reduce` media query is respected automatically — the same token overrides are applied when the OS preference is active.

  Also exports a `MotionMode` type and a `effectiveMotion` getter from `hx-theme`.

  Updated `hx-spinner` and `hx-drawer` to consume easing tokens (`--hx-easing-in-out` and `--hx-easing-default`) rather than hardcoded `ease-in-out` and `ease` values, ensuring the motion token cascade reaches these components.

- 1f8eef7: add multi-brand theming api for hospital system white-label implementations
  - `HelixBrandRegistry` singleton in `@helixui/tokens` allows consumers to register named brand token sets at application bootstrap
  - brand registration validates all 22 required semantic tokens (primary and secondary color ramps) at registration time, throwing with a list of missing tokens on failure
  - `hx-theme` gains a `brand` attribute that merges registered brand tokens on top of the base theme via adoptedStyleSheets replacement
  - unregistered brands fall back gracefully to the base theme with a `console.warn`
  - new exports: `HelixBrandRegistry`, `HelixBrandRegistryClass`, `REQUIRED_SEMANTIC_TOKENS`, `BrandTokenMap`, `BrandValidationResult`

### Patch Changes

- 03e1beb: test: add design token validation test suite

## 0.3.4

### Patch Changes

- d55bd39: add ./dist/tokens.css export alias so both import paths resolve correctly
- ac9458e: Update package metadata: fix tokens description (remove WC-2026 codename, use HELiX) and add npm discovery keywords (shadow-dom, wcag, accessibility, enterprise, typescript, design-tokens, css-custom-properties) to both packages.

## 0.3.2

### Patch Changes

- d46e1e7: fix: correct homepage URL to helix.bookedsolid.tech (no .com domain exists)

## 0.3.1

### Patch Changes

- 819759f: fix: correct homepage URL from helix.bookedsolid.com to helix.bookedsolid.tech
- 5e4d197: Sync @helixui/tokens version to match @helixui/library@0.3.0 (linked packages).

## 0.2.0

### Minor Changes

- Version bump to stay in sync with `@helixui/library@0.2.0` (linked packages). No token value changes in this release — all component-level changes are documented in `@helixui/library` CHANGELOG.

## 0.1.3

### Patch Changes

- 553b322: fix: remove manual changeset gating from publish pipeline — let changesets/action handle both version PR creation and npm publish internally

## 0.1.2

### Patch Changes

- 04a64c8: Launch readiness: accessibility audits, documentation pages, export verification, and quality gates for all 85 custom elements across 73 component directories.
