# Web Component Quality Gates

All 7 gates must pass before any component merges. No exceptions, no overrides.

---

## Gate 1: TypeScript Strict

**Command:** `pnpm run type-check`
**Threshold:** Zero errors

- TypeScript strict mode enforced (`strict: true` in tsconfig)
- No `any` types anywhere — use `unknown` + type guards
- No `@ts-ignore` or `@ts-expect-error`
- No non-null assertions (`!`)
- All public API types exported from component index

**Failure action:** Fix type errors. Do not suppress them.

---

## Gate 2: Test Suite

**Command:** `pnpm run test` (full) or `pnpm run test:smart` (changed components only)
**Threshold:** 100% pass rate, 80%+ code coverage

- Vitest browser mode with Playwright (Chromium)
- Tests run in real browser, not jsdom
- Shadow DOM queries via `shadowQuery` test utility
- Every public property, method, event, and slot tested
- Edge cases: empty values, boundary values, rapid state changes
- Test file location: `src/components/hx-{name}/hx-{name}.test.ts`

**Failure action:** Fix failing tests. Never skip or `.skip` tests to pass the gate.

---

## Gate 3: Accessibility

**Threshold:** Zero WCAG 2.1 AA violations

- axe-core audit integrated in Vitest tests
- Every component gets `await axe(element)` in its test suite
- Keyboard navigation tested: Tab, Enter, Space, Arrow keys, Escape
- Focus management: focus delegation via `delegatesFocus: true`
- ARIA attributes: roles, states, properties through ElementInternals
- Color contrast: 4.5:1 for text, 3:1 for large text and UI components
- Healthcare mandate: zero a11y regressions allowed

**Failure action:** Fix violations. Accessibility is non-negotiable in healthcare.

---

## Gate 4: Storybook

**Command:** Verify stories exist in `apps/storybook/`
**Threshold:** Stories for all variants, controls for all public properties

- Every component has a `.stories.ts` file
- Default story shows baseline rendering
- Variant stories for each visual/behavioral variant
- Controls auto-generated from CEM (Custom Elements Manifest)
- Interactive stories for complex behaviors (dialogs, dropdowns, forms)
- Stories serve as living documentation and visual regression baseline

**Failure action:** Add missing stories before merge.

---

## Gate 5: CEM Accuracy

**Command:** `pnpm run cem`
**Threshold:** Generated manifest matches actual public API

- Custom Elements Manifest (custom-elements.json) auto-generated
- All `@property` decorators reflected in manifest
- All events documented with `@fires` JSDoc tags
- All CSS custom properties listed
- All CSS parts and slots documented
- CEM drives Storybook autodocs — inaccuracy = broken docs

**Failure action:** Update JSDoc annotations to match implementation, regenerate CEM.

---

## Gate 6: Bundle Size

**Threshold:** <5KB per component (minified + gzipped), <50KB full bundle

- Per-component entry points via Vite library mode
- Tree-shakeable exports — no barrel file side effects
- No runtime dependencies beyond Lit core
- Measure with: `npx bundlephobia <package>` or build output analysis
- Watch for: unnecessary imports, large utility functions, embedded assets

**Failure action:** Reduce bundle size. Split utilities, lazy-load heavy features, remove dead code.

---

## Gate 7: Code Review (3-Tier)

**Threshold:** All three tiers approved

| Tier | Agent                  | Focus                                              |
| ---- | ---------------------- | -------------------------------------------------- |
| 1    | `code-reviewer`        | Patterns, TypeScript, a11y basics, CEM, standards  |
| 2    | `senior-code-reviewer` | Naming, tokens, Lit patterns, edge cases, API      |
| 3    | `chief-code-reviewer`  | Precision: whitespace, comments, abstractions      |

- Tier 1 runs first. If rejected, fix before escalating.
- Tier 2 catches what Tier 1 missed. Stricter lens.
- Tier 3 is the final boss. Nothing ships without Tier 3 approval.
- All review feedback must be addressed — no "will fix later."

**Failure action:** Address all review comments, re-request review.

---

## Running All Gates

```bash
# Quick verification (Gates 1, partial 2)
pnpm run verify          # lint + format:check + type-check

# Full gate check
pnpm run type-check      # Gate 1
pnpm run test            # Gate 2
pnpm run cem             # Gate 5

# Gates 3, 4, 6, 7 require manual/agent verification
```

## Pre-Push Checklist

Before every `git push`:
1. `pnpm run verify` passes with zero errors
2. `pnpm run test:smart` passes for changed components
3. CEM regenerated if public API changed
4. Stories updated if variants added
