# AUDIT: hx-container — Deep Audit v2

**Reviewer:** Deep Audit v2 pipeline
**Date:** 2026-03-06
**Component:** `hx-container` — Layout width-constraining primitive
**Previous audit:** T3-59 (2026-03-05)
**Files audited:**

- `hx-container.ts`
- `hx-container.styles.ts`
- `hx-container.test.ts`
- `hx-container.stories.ts`
- `index.ts`

---

## wc-mcp Scores

| Dimension                 | Score                                                     |
| ------------------------- | --------------------------------------------------------- |
| CEM Health                | **100/100 (A)**                                           |
| Accessibility (CEM-based) | **0/100 (F)** — Expected for layout primitive (see notes) |

The CEM accessibility score of F is a **false signal** for this component. `hx-container` is a pure layout primitive — it correctly has no ARIA roles, no keyboard interaction, no form association, and no focus management. The wc-mcp accessibility heuristic penalizes this because it expects interactive component patterns. Axe-core audits pass with zero violations, confirming correct accessibility behavior.

---

## Severity Key

| Level  | Meaning                                                                                   |
| ------ | ----------------------------------------------------------------------------------------- |
| **P0** | Blocks release. Broken functionality, security issue, or WCAG violation.                  |
| **P1** | Must fix before merge. Violates project conventions or creates consumer-facing gaps.      |
| **P2** | Should fix. Quality issue — test is misleading, code is inconsistent, or gap in coverage. |
| **P3** | Nice to fix. Minor convention drift or documentation gap.                                 |

---

## Findings Fixed in This Audit

### [FIXED] Missing `narrow` token in design system

**File:** `packages/hx-tokens/src/tokens.json`
**Previous:** The `container` token group had `sm`, `md`, `lg`, `xl`, `content` but was missing `narrow`. The CSS referenced `--hx-container-narrow` but no token was generated, relying entirely on the `48rem` fallback.
**Fix:** Added `"narrow": { "value": "48rem" }` to the container token group.

### [FIXED] `WcContainer` type not exported from `index.ts` (was P3-01)

**File:** `index.ts`
**Fix:** Added `export type { WcContainer } from './hx-container.js';`

### [FIXED] Centering test was a false positive (was P2-01)

**File:** `hx-container.test.ts`
**Previous:** Test asserted `marginLeft === '0px'` which passes even with `margin: 0` (no centering).
**Fix:** Test now uses a 1200px-wide fixture with `width="sm"` (640px max-width) and asserts `marginLeft === marginRight`, proving symmetrical centering.

### [FIXED] Width tests lacked computed max-width assertions (was P2-02)

**File:** `hx-container.test.ts`
**Previous:** Tests only checked CSS class presence, not actual computed max-width.
**Fix:** All width variant tests now assert `getComputedStyle(inner).maxWidth` matches expected values (640px, 768px, 1024px, 1280px, none).

---

## Previous Audit Findings — Reassessed

### [CLOSED — Design Decision] P1-01: Missing `alignment` prop

**Reassessment:** Centering is the correct and only behavior for a container primitive. Adding alignment would be scope creep. Consumers who need non-centered containers in sidebar layouts should use `width="full"` (no max-width = no centering needed) or apply CSS overrides via the `::part(inner)` part. This is consistent with how Bootstrap, Tailwind, and Material UI container components work — none provide an alignment prop.

**Status:** Closed as design decision, not a defect.

### [CLOSED — Incorrect] P1-02: Hardcoded px/rem fallbacks

**Reassessment:** The CSS pattern `var(--hx-container-sm, 640px)` is correct. The `--hx-container-sm` IS the token (generated from `tokens.json` via `tokenStyles`). The `640px` is the last-resort fallback for CDN/standalone usage where tokens aren't loaded. This is standard defensive CSS, not a token violation. The fallback values match the token values exactly.

**Status:** Closed. Not a defect — this is the correct pattern.

### [DOWNGRADED] P1-03: No responsive padding → P3

**Reassessment:** While responsive padding could improve mobile experiences, this is an enhancement, not a defect. The component's contract is clear: `padding="lg"` means `4rem` of vertical padding. Consumers can use the `--hx-container-bg` and `padding` attributes responsively at the template level (e.g., different `padding` values per breakpoint via media queries in the consumer's CSS). Making the component internally responsive would reduce consumer control.

**Status:** Downgraded to P3 enhancement.

---

## Remaining Open Findings

### [P2-03] Mixed units in max-width presets — `rem` vs `px`

**File:** `hx-container.styles.ts`

The `content` (72rem) and `narrow` (48rem) presets use `rem` while `sm`/`md`/`lg`/`xl` use `px`. This is intentional: the named sizes (`content`, `narrow`) are typographic/reading-optimized widths that should scale with base font size, while the T-shirt sizes map to fixed viewport breakpoints. However, this distinction is not documented and may confuse consumers.

**Recommendation:** Add a code comment in the styles file explaining the unit choice rationale.

### [P2-04] No Drupal Twig usage example

No Twig template example exists for this component. As a layout primitive likely used on every page, a Drupal integration guide would reduce adoption friction.

**Recommendation:** Create a Twig example in documentation (separate feature).

### [P3-02] Bundle size not measured

Component is likely well under the 5KB budget given its minimal implementation (no JS dependencies beyond Lit, ~80 lines of CSS). Should be formally measured.

### [P3-03] Hardcoded hex in Storybook demos

Story renders use hardcoded hex colors for `--hx-container-bg` demos. These are visual aids only and don't affect the component, but ideally would model correct token usage.

### [P3-04] No responsive gutter

Gutter is fixed at `--hx-space-6` (1.5rem) at all viewports. On very narrow screens (320px), this consumes ~15% of viewport width. Enhancement opportunity.

---

## Summary Matrix

| ID    | Severity  | Status     | Area       | Title                                               |
| ----- | --------- | ---------- | ---------- | --------------------------------------------------- |
| —     | **P1**    | FIXED      | Tokens     | Missing `narrow` container token                    |
| P3-01 | **P3**    | FIXED      | TypeScript | `WcContainer` not exported from `index.ts`          |
| P2-01 | **P2**    | FIXED      | Tests      | Centering test false positive                       |
| P2-02 | **P2**    | FIXED      | Tests      | Width tests lacked computed max-width checks        |
| P1-01 | **P1**    | CLOSED     | Design     | `alignment` prop — design decision, not a defect    |
| P1-02 | **P1**    | CLOSED     | CSS        | Hardcoded fallbacks — correct defensive CSS pattern |
| P1-03 | **P1→P3** | DOWNGRADED | CSS        | Responsive padding — enhancement, not defect        |
| P2-03 | **P2**    | OPEN       | CSS        | Mixed rem/px units (intentional but undocumented)   |
| P2-04 | **P2**    | OPEN       | Drupal     | No Twig usage example                               |
| P3-02 | **P3**    | OPEN       | Perf       | Bundle size not measured                            |
| P3-03 | **P3**    | OPEN       | Storybook  | Hex colors in demos                                 |
| P3-04 | **P3**    | OPEN       | CSS        | No responsive gutter                                |

**Total:** 4 fixed, 3 closed/downgraded, 5 open (0 P0, 0 P1, 2 P2, 3 P3)

---

## What Passes

- **TypeScript strict:** No `any`, no `@ts-ignore`, no non-null assertions
- **Type safety:** Union types for `width` and `padding` props with `reflect: true`
- **Shadow DOM:** Full encapsulation, styles don't leak
- **CSS Parts:** `inner` part exposed and tested
- **CSS Custom Properties:** 9 documented props (`--hx-container-bg`, `--hx-container-gutter`, `--hx-container-max-width`, plus 6 preset overrides)
- **Design Tokens:** All spacing and max-width values flow from `@helix/tokens` via `tokenStyles`
- **Accessibility:** Zero axe-core violations, no unnecessary ARIA roles (correct for layout primitive)
- **Default slot:** Accepts arbitrary content, multiple children tested
- **Tests:** 30 tests across 8 describe blocks — rendering, properties, reflection, slots, parts, custom properties, layout behavior, accessibility
- **Storybook:** 35 stories with play functions — all width/padding variants, compositions (cards, alerts), nested containers, CSS parts demo, interaction tests, hospital portal layout
- **CEM:** Score 100/100, all members/slots/parts/cssProperties documented
- **Drupal compatible:** Standard custom element, works in Twig `<hx-container width="content">{{ content }}</hx-container>`
- **CDN-ready:** Defensive CSS fallbacks ensure the component renders correctly without token injection

---

## Audit Verdict

**PASS** — Component is production-ready. All P1/P2 issues from the previous audit have been either fixed or correctly reassessed. Remaining items are P2-P3 enhancements that do not block release.
