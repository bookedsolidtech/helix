---
'@helixui/library': minor
'@helixui/tokens': minor
'@helixui/react': minor
---

AAA Tier 3 — full P0 surface measured against WCAG 2.2 AAA via formal audit harness (3.8.0).

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
