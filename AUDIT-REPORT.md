# Deep Antagonistic Audit Report — HELiX Tier 1 Component Library

**Date:** 2026-03-04
**Branch:** `feature/final-audit-deep-antagonistic-review-of`
**Scope:** 19 components, 21 CEM declarations, 10 audit dimensions
**Verdict:** RELEASE BLOCKED — 23 critical findings require remediation

---

## Executive Summary

The HELiX Tier 1 component library demonstrates strong foundational engineering: zero `any` types, zero `@ts-ignore`, proper Shadow DOM encapsulation, consistent design token usage, and comprehensive Storybook stories (531 exports, 221 play functions). However, the audit reveals **23 critical/blocking findings** across accessibility, infrastructure, testing, and performance that must be resolved before enterprise healthcare deployment.

**Top 5 Blockers:**
1. **hx-checkbox is keyboard-inaccessible** (WCAG 2.1 AA violation — patient safety risk)
2. **Build is broken** — `vite.config.ts` is gitignored, fresh clones cannot build
3. **Coverage infrastructure is broken** — v8 provider fails in browser mode, reports 0%
4. **hx-field accessibility is fundamentally broken** — labels/errors can't cross shadow boundary
5. **2 test files silently not executing** — hx-form and hx-field have 71 phantom tests

---

## Library Health Score

**Overall: 62/100 (D+) — RELEASE BLOCKED**

| Dimension | Score | Grade | Weight |
|---|---|---|---|
| 1. TypeScript Strictness | 88/100 | B+ | 10% |
| 2. Design Token Compliance | 82/100 | B | 10% |
| 3. Accessibility (WCAG 2.1 AA) | 45/100 | F | 15% |
| 4. API Consistency | 72/100 | C | 10% |
| 5. Test Coverage & Quality | 48/100 | F | 15% |
| 6. Storybook Completeness | 88/100 | B+ | 5% |
| 7. Performance & Bundle Size | 68/100 | D+ | 10% |
| 8. Shadow DOM & Encapsulation | 85/100 | B | 10% |
| 9. Drupal Integration | 70/100 | C | 10% |
| 10. Infrastructure & Tooling | 45/100 | F | 5% |

---

## Component Maturity Matrix

| Component | TS | Tokens | A11y | API | Tests | Stories | Perf | Shadow | Drupal | Overall | Grade |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **hx-container** | A | A | A | A | B | A | A | A+ | B | **91** | **A** |
| **hx-prose** | B+ | A | A | B | C | A | B | N/A | A | **83** | **B** |
| **hx-button** | A | A | A- | A | B- | A | A | A+ | B | **87** | **B+** |
| **hx-icon-button** | A | A | A | A | C | A- | A | A | B | **83** | **B** |
| **hx-switch** | B+ | A | A- | A | A- | A | A | A+ | B | **86** | **B+** |
| **hx-slider** | B+ | A | A- | B | C | A | A | A | B | **78** | **C+** |
| **hx-text-input** | B | A | A | A | B | A | A | A- | B | **82** | **B** |
| **hx-textarea** | B | A | A- | A | B | A | A | A- | B | **81** | **B** |
| **hx-alert** | A | A | B | B | B | A | A | A- | B | **82** | **B** |
| **hx-avatar** | A | A | B+ | A | C+ | B- | A | A | B | **77** | **C+** |
| **hx-badge** | A | A | D | A | B | A | A | A | B | **75** | **C** |
| **hx-card** | B | A | B- | C | B | A- | A | B+ | B | **73** | **C** |
| **hx-breadcrumb** | B+ | A | B+ | A | B- | C | A | A- | B+ | **74** | **C** |
| **hx-button-group** | A | A | B- | B | C+ | B+ | A | A- | B | **76** | **C+** |
| **hx-checkbox** | B+ | A | D | A | A- | A- | A | A | B | **70** | **C-** |
| **hx-radio-group** | B | A | D+ | B | B | A | A | A- | B | **68** | **D+** |
| **hx-select** | B | A | B | C | C | A | F | B | B | **62** | **D** |
| **hx-form** | B | A | B | C | F | A- | F | N/A | B+ | **55** | **D-** |
| **hx-field** | A | A | F | B | F | A- | A | B | B | **52** | **F** |

---

## Critical Findings by Severity

### P0 — RELEASE BLOCKERS (Must fix before any deployment)

| # | Dimension | Component | Finding | Impact |
|---|---|---|---|---|
| 1 | A11y | hx-checkbox | **Keyboard-inaccessible** — `tabindex="-1"` on hidden input, no tab target exists. WCAG 2.1.1 violation. | Patient safety: consent checkboxes unreachable by keyboard |
| 2 | A11y | hx-checkbox | **No visible focus ring** — CSS targets unreachable input. WCAG 2.4.7 violation. | Users cannot see where focus is |
| 3 | A11y | hx-radio | **Focus ring targets wrong element** — CSS targets hidden input but host gets focus via roving tabindex. WCAG 2.4.7 violation. | Radio selections invisible to keyboard users |
| 4 | A11y | hx-field | **Label cannot associate across shadow boundary** — `<label>` has no `for` and can't cross shadow DOM. WCAG 1.3.1, 4.1.2 violation. | Screen readers cannot identify form controls |
| 5 | A11y | hx-field | **Error/help IDs unreachable across shadow boundary** — `aria-describedby` cannot reference shadow DOM IDs. WCAG 1.3.1 violation. | Validation errors silent to assistive tech |
| 6 | A11y | hx-radio-group | **Error/help text not connected via aria-describedby**. WCAG 1.3.1 violation. | Radio group errors never announced |
| 7 | Infra | Library | **Build broken** — `vite.config.ts` gitignored, no generation script. Fresh clones fail `npm run build`. | CI cannot build, new contributors blocked |
| 8 | Test | Library | **Coverage v8 completely broken** — reports 0% due to browser mode incompatibility. 80% threshold meaningless. | Quality gate #2 is theater |
| 9 | Test | hx-form, hx-field | **71 tests silently not executing** — 2 test files dropped by vitest without error. | Components appear tested but aren't |
| 10 | Infra | Library | **Package exports point to TypeScript source** — `"import": "./src/index.ts"` fails for all non-TS consumers. | npm publish will ship broken package |
| 11 | Perf | hx-select | **7.8KB gzipped (152% of 5KB budget)** — 1,045-line component with 12KB styles. | Bundle size gate violation |
| 12 | Perf | hx-form | **6.1KB gzipped (120% of 5KB budget)** — 32KB CSS payload inlined. | Bundle size gate violation |

### P1 — HIGH (Fix before GA)

| # | Dimension | Component(s) | Finding |
|---|---|---|---|
| 13 | API | hx-card, hx-form | **JSDoc `@fires` uses `wc-` prefix** — CEM reports wrong event names (`wc-card-click`, `wc-submit`, `wc-invalid`, `wc-reset`). Consumers will listen for non-existent events. |
| 14 | API | hx-card | **Property `wcHref` uses legacy `wc` prefix** — should be `hxHref` or `href`. |
| 15 | Test | hx-button, hx-icon-button | **Fake keyboard tests** — call `.click()` instead of dispatching `KeyboardEvent`. 0 actual keyboard behavior tested. |
| 16 | Test | hx-select, hx-slider | **Missing keyboard tests** — interactive form controls with zero keyboard test coverage. WCAG compliance unverified. |
| 17 | Test | 14 files | **30+ `setTimeout(r, 50)` hacks** — flaky test seeds, not proper async patterns. |
| 18 | A11y | hx-badge | **Dot variant invisible to screen readers** — no role, no aria-label, pulsing dot is purely visual. |
| 19 | A11y | hx-button | **Loading state not announced** — `aria-busy` set but no live region announces "Loading". |
| 20 | Perf | Library | **`sideEffects` poisons barrel import tree-shaking** — all component TS files marked side-effectful. |
| 21 | Infra | Library | **No release/publish workflow** — zero GitHub Actions for npm publish. Changesets installed but no automation. |
| 22 | Infra | Library | **Tests/stories not type-checked** — excluded from library tsconfig. |
| 23 | Shadow | hx-field | **`hxSize` missing `reflect: true`** — CSS `:host([hx-size='sm'])` selectors don't work when set via JS. |
| 24 | TS | hx-card | **`as unknown as MouseEvent` type lie** — casts KeyboardEvent to MouseEvent in production code. |
| 25 | TS | 10 components | **`Map<string, unknown>` instead of `PropertyValues<this>`** — loses type safety in `updated()` lifecycle. |
| 26 | Shadow | 5 components | **Slot-tracking booleans not `@state()`** — rely on manual `requestUpdate()` instead of reactivity. |
| 27 | Drupal | All | **CDN deployment impossible** — bare specifier imports require bundler, no import map provided. |

### P2 — MEDIUM (Address before enterprise release)

| # | Dimension | Finding |
|---|---|---|
| 28 | A11y | hx-select: Space key toggles instead of opening per APG |
| 29 | A11y | hx-select: aria-activedescendant not on search input in searchable mode |
| 30 | A11y | hx-switch: Enter key toggles (APG says Space only) |
| 31 | A11y | hx-button-group: role="group" without accessible name |
| 32 | A11y | hx-radio-group: Double group semantics (host radiogroup + fieldset) |
| 33 | A11y | hx-textarea: Character counter not in aria-describedby |
| 34 | A11y | hx-alert: Redundant role="alert" + aria-live, close button <44x44px |
| 35 | A11y | hx-card: Interactive card uses raw URL as aria-label |
| 36 | A11y | hx-breadcrumb: Uses `div role="list"` instead of native `<ol>` |
| 37 | A11y | hx-form: No form semantics when `action` not set |
| 38 | API | hx-slider: Help slot named `"help"` not `"help-text"` (inconsistent) |
| 39 | API | hx-textarea: Missing `hx-size` property (only component without it) |
| 40 | Perf | hx-text-input, hx-textarea: 16/13 @property with 0 @state (over-exposed internal state) |
| 41 | Perf | hx-select: Document listeners registered entire lifecycle (should be open-only) |
| 42 | Infra | Branch coverage threshold 75% vs 80% mandate |
| 43 | Infra | No Turborepo remote caching configured |
| 44 | Infra | Pre-commit hook runs full test suite (~2min per commit) |
| 45 | Infra | CEM output gitignored — PRs can't diff API changes |
| 46 | Infra | ESLint `no-explicit-any` and `no-non-null-assertion` are `warn` not `error` |
| 47 | Stories | hx-breadcrumb: Zero play functions, minimal stories (5 exports) |
| 48 | Stories | Only 5/19 components have Drupal integration stories |
| 49 | Drupal | hx-card/hx-form JSDoc event name mismatches will break Drupal.behaviors |

---

## Dimension Detail Summaries

### Dimension 1: TypeScript Strictness (88/100 — B+)

**What passes clean:** Zero `any` types, zero `@ts-ignore`, zero `@ts-expect-error`, `npm run type-check` passes with zero errors, `HTMLElementTagNameMap` declared for all 21 elements.

**Key findings:**
- 1 CRITICAL: `as unknown as MouseEvent` type lie in `hx-card.ts:104`
- 10 components use `Map<string, unknown>` instead of `PropertyValues<this>` in `updated()`
- 9 test files use `as unknown as { formAssociated: boolean }` (should be shared utility)
- ~130 non-null assertions (`!`) in test/story files
- All 21 `render()` methods missing explicit `TemplateResult` return type

### Dimension 2: Design Token Compliance (82/100 — B)

**What passes clean:** All `.styles.ts` files use `--hx-*` CSS custom properties extensively. Three-tier cascade pattern used consistently. No raw hex color values in component styles.

**Key findings:**
- `hx-prose` and `hx-form` scoped CSS files contain extensive raw values (by design — they style arbitrary HTML)
- Some components use `0` for spacing instead of token (acceptable for zero values)
- Token naming generally consistent across components
- `hx-card` uses `!important` (scoped to shadow DOM, acceptable)

### Dimension 3: Accessibility (45/100 — F)

**RELEASE BLOCKER.** 6 critical findings, 16 warnings.

**Critical blockers:**
1. hx-checkbox keyboard-inaccessible (tabindex=-1 on only focusable element)
2. hx-radio focus ring targets wrong element
3. hx-field label/error association broken across shadow boundary
4. hx-radio-group error text not connected via aria-describedby

**What passes clean:** ElementInternals form association, `prefers-reduced-motion` media queries, `nothing` used for ARIA attribute omission, focus-visible patterns in most components, axe-core tests in all executed test files.

### Dimension 4: API Consistency (72/100 — C)

**Key findings:**
- 4 events use stale `wc-` prefix in JSDoc (CEM reports wrong names)
- `wcHref` property on hx-card uses legacy `wc` naming
- Help slot inconsistency: hx-slider uses `"help"`, others use `"help-text"`
- hx-textarea missing `hx-size` property (only form component without it)
- CSS part naming mostly consistent but `error-message` vs `error` varies

### Dimension 5: Test Coverage & Quality (48/100 — F)

**RELEASE BLOCKER.** Coverage infrastructure broken, 2 test files not executing.

**725 tests pass, 0 fail.** But:
- Coverage reports 0% (v8 provider broken in browser mode)
- hx-form (22 tests) and hx-field (49 tests) silently not executing
- Only 3/10 interactive components have real keyboard tests
- 2 components have fake keyboard tests (call `.click()`)
- 30+ `setTimeout(r, 50)` anti-patterns

### Dimension 6: Storybook Completeness (88/100 — B+)

**Strong.** 531 story exports, 221 play functions, 100% story file coverage.

**Gaps:** hx-breadcrumb has 0 play functions, only 5/19 have Drupal stories, hx-avatar missing CSS custom property and parts demos, hx-checkbox missing size variant stories.

### Dimension 7: Performance & Bundle Size (68/100 — D+)

**2 budget violations:** hx-select (7.8KB gz, 152% of budget), hx-form (6.1KB gz, 120% of budget).

**Total library: 42KB gzipped (within 50KB budget).** All other 17 components pass individual budgets. Zero cross-component import dependencies. All event listeners properly cleaned up.

**Infrastructure issues:** Exports map points to source not dist, sideEffects field defeats tree-shaking, no CDN bundle target.

### Dimension 8: Shadow DOM & Encapsulation (85/100 — B)

**Generally excellent.** 17 Shadow DOM components with proper encapsulation. 2 intentional Light DOM components (hx-form, hx-prose) use AdoptedStylesheetsController.

**Key findings:** hx-field missing `reflect: true` on `hxSize` (functional bug), 5 components use plain booleans instead of `@state()` for slot tracking, hx-select uses inline style on slot, hx-card CEM event name mismatch.

### Dimension 9: Drupal Integration (70/100 — C)

**Foundation is strong:** All components self-register, all events use `composed: true` + `bubbles: true`, all form components use ElementInternals, attribute-driven APIs throughout.

**Blockers:** CDN deployment impossible (bare specifier imports), CEM event name mismatches will break Drupal.behaviors, no dynamic content handling beyond slotchange, help slot name inconsistency will confuse Twig template authors.

### Dimension 10: Infrastructure & Tooling (45/100 — F)

**RELEASE BLOCKER.** Build is broken, no release workflow exists.

**Critical gaps:**
1. vite.config.ts gitignored — builds fail on fresh clones
2. Package exports point to TypeScript source
3. No release/publish GitHub Actions workflow
4. Coverage enforcement missing from CI
5. Tests/stories excluded from type-checking
6. Pre-commit hook excessively heavy (~2min per commit)

---

## Remediation Plan — Board Features

### Phase 1: Release Blockers (P0)

| Feature | Title | Components | Est. |
|---|---|---|---|
| AUDIT-001 | Fix hx-checkbox keyboard accessibility | hx-checkbox | S |
| AUDIT-002 | Fix hx-radio focus ring targeting | hx-radio, hx-radio-group | S |
| AUDIT-003 | Fix hx-field shadow boundary a11y | hx-field | M |
| AUDIT-004 | Add aria-describedby to hx-radio-group | hx-radio-group | S |
| AUDIT-005 | Restore vite.config.ts to git | Infrastructure | S |
| AUDIT-006 | Fix package.json exports to dist/ | Infrastructure | S |
| AUDIT-007 | Switch coverage to Istanbul provider | Test infra | S |
| AUDIT-008 | Fix hx-form/hx-field test execution | Test infra | M |
| AUDIT-009 | Reduce hx-select bundle size (<5KB) | hx-select | L |
| AUDIT-010 | Reduce hx-form bundle size (<5KB) | hx-form | M |

### Phase 2: High Priority (P1)

| Feature | Title | Components | Est. |
|---|---|---|---|
| AUDIT-011 | Fix CEM event name mismatches (wc- → hx-) | hx-card, hx-form | S |
| AUDIT-012 | Rename wcHref to hxHref | hx-card | S |
| AUDIT-013 | Fix fake keyboard tests | hx-button, hx-icon-button | S |
| AUDIT-014 | Add keyboard tests for form controls | hx-select, hx-slider, hx-text-input, hx-textarea | M |
| AUDIT-015 | Replace setTimeout anti-patterns in tests | All test files | M |
| AUDIT-016 | Add badge a11y (role="status", aria-label) | hx-badge | S |
| AUDIT-017 | Add button loading state live region | hx-button | S |
| AUDIT-018 | Fix sideEffects for tree-shaking | Package config | S |
| AUDIT-019 | Create release/publish workflow | Infrastructure | M |
| AUDIT-020 | Use PropertyValues<this> in updated() | 10 components | S |
| AUDIT-021 | Fix slot-tracking to use @state() | 5 components | S |
| AUDIT-022 | Add hx-field reflect:true on hxSize | hx-field | S |

### Phase 3: Medium Priority (P2)

| Feature | Title | Est. |
|---|---|---|
| AUDIT-023 | Fix hx-select APG keyboard behavior | S |
| AUDIT-024 | Fix hx-switch Enter key behavior | S |
| AUDIT-025 | Add hx-button-group aria-label support | S |
| AUDIT-026 | Fix hx-radio-group double group semantics | S |
| AUDIT-027 | Add hx-textarea counter to aria-describedby | S |
| AUDIT-028 | Standardize help slot name to "help-text" | S |
| AUDIT-029 | Add hx-textarea hx-size property | S |
| AUDIT-030 | Configure Turborepo remote caching | S |
| AUDIT-031 | Slim pre-commit hooks | M |
| AUDIT-032 | Add Drupal integration stories | M |
| AUDIT-033 | Expand hx-breadcrumb stories + play functions | S |
| AUDIT-034 | Add CDN distribution strategy | M |
| AUDIT-035 | Fix ESLint any/non-null rules to error | S |

---

## Infrastructure Gaps — CI Prevention

| Gap | Current State | Required State |
|---|---|---|
| Coverage enforcement | 0% (broken) | 80% enforced per component |
| Release automation | Manual | Changesets + GitHub Actions |
| CEM diff in CI | None | Breaking change detection on PR |
| Test file count assertion | None | Expected count matches actual |
| Storybook deployment | None | Preview per PR |
| Bundle size regression | Partial (13/19 components) | All 19 checked |
| Remote caching | None | Turborepo cloud configured |

---

## What Passes Clean

Despite the critical findings, the library demonstrates strong engineering in many areas:

- **Zero `any`, zero `@ts-ignore`, zero `@ts-expect-error`** across entire codebase
- **HTMLElementTagNameMap** declared for all 21 elements
- **725 tests passing, 0 failing** (for executed tests)
- **All event listeners properly cleaned up** in disconnectedCallback
- **axe-core tests** in all 17 executed test files
- **531 Storybook story exports** with 221 play functions
- **CEM health scores: 14 components at A grade** (CEM documentation completeness)
- **Design token usage consistent** — `--hx-*` prefix, three-tier cascade
- **Shadow DOM encapsulation** properly maintained across all shadow DOM components
- **ElementInternals form association** implemented correctly in all 9 form components
- **Total library size 42KB gzipped** (within 50KB budget)
- **No cross-component import dependencies** in built output
- **`prefers-reduced-motion` media queries** in all animated components

---

## Conclusion

The HELiX component library has a strong engineering foundation but is **not ready for enterprise healthcare deployment**. The critical accessibility failures (keyboard-inaccessible checkbox, broken field labels) represent WCAG 2.1 AA violations that are unacceptable in healthcare software where forms control patient care decisions. The broken build infrastructure and phantom test coverage mean the quality gates are partially theater.

**Recommended path forward:**
1. Fix all P0 items (10 features, ~2 weeks)
2. Fix all P1 items (12 features, ~2 weeks)
3. Re-audit accessibility dimension specifically
4. Achieve genuine 80%+ test coverage with working instrumentation
5. Establish CI gates that prevent regression
6. Then and only then: ship to production

The library is ~4 weeks of focused remediation from being enterprise-grade. The architecture and engineering patterns are sound — the issues are in execution completeness, not fundamental design.
