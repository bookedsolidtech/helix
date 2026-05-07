---
'@helixui/tokens': minor
'@helixui/library': minor
'@helixui/react': minor
---

AAA conformance posture + Storybook canonical-template foundation.

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
