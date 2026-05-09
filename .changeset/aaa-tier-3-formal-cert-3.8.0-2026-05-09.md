---
'@helixui/library': minor
'@helixui/tokens': minor
'@helixui/react': minor
---

AAA Tier 3 — Full library formal cert against WCAG 2.2 AAA (3.8.0).

**34/34 components AAA-certified** against the full WCAG 2.2 AAA criteria set. Formal audit harness (`scripts/aaa-formal-audit.mjs`) sweeps all 34 components × 11 AAA criteria in a live browser session and produces an empirical verdict matrix. Latest verification run: **374/374 cells (302 Supports + 72 N/A) — zero Partials, zero Fails** (snapshot at `.reports/formal-aaa-audit/PRE-RELEASE-VERIFICATION-3.8.0.md`).

**Criteria matrix (11 axes, all components):**

- 1.4.6 Contrast (Enhanced)
- 1.4.9 Images of Text (No Exception)
- 2.1.3 Keyboard (No Exception)
- 2.3.3 Animation from Interactions
- 2.4.12 Focus Not Obscured (Enhanced)
- 2.4.13 Focus Appearance
- 2.5.5 Target Size (Enhanced)
- 3.2.5 Change on Request
- 3.3.6 Error Prevention (All)
- forced-colors media query support
- WAI-ARIA APG keyboard pattern conformance

**Phase 4–6 component fixes** rolled into the 34-component cert pass: focus-appearance hardening, forced-colors fallback on every interactive element, target-size compliance (44×44 minimum on touch surfaces), APG keyboard patterns audited per component, and verdict-driven evidence captured per component under `.reports/formal-aaa-audit/evidence/`.

**Token shifts** (semantic-tier only — consumer overrides remain stable):

- Focus-ring tokens hardened for AAA focus-appearance contrast (3:1 against adjacent surfaces, in addition to the existing 2px outline + offset).
- Forced-colors mode bindings expanded across all interactive components — `CanvasText`, `ButtonText`, `Highlight` system colors now consumed correctly via `@media (forced-colors: active)` blocks.

**Storybook MDX template** (`apps/storybook/.storybook/blocks/aaa-story-template.mdx`) — applied to 5 anchor components (`hx-button`, `hx-checkbox`, `hx-alert`, `hx-text-input`, `hx-dialog`, `hx-tabs`) as the canonical pattern for healthcare-context AAA story documentation. Each anchor ships a hero scenario (informed-consent, destructive confirmation, patient chart, etc.) with criteria chips, keyboard contract, and screen-reader notes.

**Visual changes flagged:** focus rings are slightly thicker on certain components where the previous semantic ring failed AAA contrast against the surface; forced-colors mode now paints distinct interactive states (was inheriting). Consumers who screenshot-test forced-colors output should re-baseline.

**No breaking API.** All public attributes, slots, events, CSS parts, and CSS custom properties are backwards-compatible. CEM regenerates with `helixMeta` AAA cert metadata on every certified component.

**Audit harness now part of the gate:** `pnpm aaa:matrix` runs the full 34-component sweep against a live Storybook (port 3151). Required pre-release verification step.
