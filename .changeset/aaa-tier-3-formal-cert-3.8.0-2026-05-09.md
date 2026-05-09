---
'@helixui/library': minor
'@helixui/tokens': minor
'@helixui/react': minor
---

AAA Tier 3 — Full library formal cert against WCAG 2.2 AAA (3.8.0).

**43/43 P0 components AAA-certified** against the full WCAG 2.2 AAA criteria set. Formal audit harness (`scripts/aaa-formal-audit.mjs`) sweeps all 43 components × 11 AAA criteria in a live browser session and produces an empirical verdict matrix. Latest verification run: **473/473 cells (356 Supports + 117 N/A) — zero Partials, zero Fails** (snapshot at `.reports/formal-aaa-audit/PRE-RELEASE-VERIFICATION-3.8.0.md`).

Phase D completion (2026-05-09) added the final 9 P0 components:

- **Live regions** — `hx-toast`, `hx-banner` (alert pattern; severity-driven role=alert / role=status)
- **Sliders** — `hx-slider` (native `<input type="range">` slider pattern), `hx-rating` (radiogroup pattern; precision=1 radiogroup, precision=0.5 slider)
- **Form assembly + helpers** — `hx-form` (HTML AAM form landmark), `hx-field`, `hx-field-label`, `hx-help-text`, `hx-clinical-status` (alert pattern with severity tiers + PHI handling)

Form assembly primitives are documented as structural / coordinator patterns (HTML AAM landmark + WAI-ARIA 1.2 group / label). Keyboard contract is provided by child form-controls or the user agent. Native `<input type="range">` slider keyboard contract is delegated to the user agent (Arrow keys + Home/End + PageUp/PageDown).

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

**Phase 4–6 component fixes** rolled into the 43-component cert pass: focus-appearance hardening, forced-colors fallback on every interactive element, target-size compliance (44×44 minimum on touch surfaces; user-agent exemption documented for native slider thumbs), APG keyboard patterns audited per component, and verdict-driven evidence captured per component under `.reports/formal-aaa-audit/evidence/`.

**Token shifts** (semantic-tier only — consumer overrides remain stable):

- Focus-ring tokens hardened for AAA focus-appearance contrast (3:1 against adjacent surfaces, in addition to the existing 2px outline + offset).
- Forced-colors mode bindings expanded across all interactive components — `CanvasText`, `ButtonText`, `Highlight` system colors now consumed correctly via `@media (forced-colors: active)` blocks.

**Storybook MDX template** (`apps/storybook/.storybook/blocks/aaa-story-template.mdx`) — applied to 5 anchor components (`hx-button`, `hx-checkbox`, `hx-alert`, `hx-text-input`, `hx-dialog`, `hx-tabs`) as the canonical pattern for healthcare-context AAA story documentation. Each anchor ships a hero scenario (informed-consent, destructive confirmation, patient chart, etc.) with criteria chips, keyboard contract, and screen-reader notes.

**Visual changes flagged:** focus rings are slightly thicker on certain components where the previous semantic ring failed AAA contrast against the surface; forced-colors mode now paints distinct interactive states (was inheriting). Consumers who screenshot-test forced-colors output should re-baseline.

**No breaking API.** All public attributes, slots, events, CSS parts, and CSS custom properties are backwards-compatible. CEM regenerates with `helixMeta` AAA cert metadata on every certified component.

**Audit harness now part of the gate:** `pnpm aaa:matrix` runs the full 43-component sweep against a live Storybook (port 3151). Required pre-release verification step.
