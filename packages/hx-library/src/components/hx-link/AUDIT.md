# hx-link Deep Audit Report

**Auditor:** Deep Opus-level Quality Review
**Date:** 2026-03-11
**Branch:** `feature/deep-audit-hx-link`
**Prior audit:** T1-05 Antagonistic Quality Review (2026-03-05)
**Files reviewed:**

- `hx-link.ts` — component class (188 lines)
- `hx-link.styles.ts` — Lit CSS (100 lines)
- `hx-link.test.ts` — Vitest browser tests (287 lines, 31 tests)
- `hx-link.stories.ts` — Storybook stories (270 lines, 10 stories)
- `index.ts` — re-exports
- `apps/docs/.../hx-link.mdx` — Astro Starlight documentation (243 lines)

---

## Severity Legend

| Severity | Meaning                                                                            |
| -------- | ---------------------------------------------------------------------------------- |
| **P0**   | Showstopper — blocks merge. Missing feature or broken behavior.                    |
| **P1**   | Major — significant accessibility, correctness, or spec gap. Must fix before ship. |
| **P2**   | Minor — quality, spec deviation, or subtle risk. Fix before release.               |
| **P3**   | Low — polish or informational. Fix when convenient.                                |

---

## Executive Summary

The hx-link component is **production-ready**. All P0 and P1 issues identified in the prior T1-05 audit have been resolved. The component demonstrates strong patterns: semantic `<a>` element, proper disabled state with `<span role="link" aria-disabled="true" tabindex="0">`, automatic `rel="noopener noreferrer"` for `target="_blank"`, visible external-link icon with sr-only text, defense-in-depth click prevention on disabled state, and comprehensive design token usage with no hardcoded values.

Test coverage is thorough (31 tests across rendering, properties, events, keyboard, and axe-core accessibility). Storybook stories cover all variants with interactive play tests. Documentation includes Drupal Twig integration examples.

**No P0 or P1 issues remain.** Two minor P3 items documented below for awareness.

---

## Prior Audit Remediation Status

All 14 issues from the T1-05 audit have been addressed:

| ID   | Issue                                        | Status                                                                  |
| ---- | -------------------------------------------- | ----------------------------------------------------------------------- |
| P0-1 | Disabled span missing `tabindex="0"`         | **Fixed**                                                               |
| P0-2 | Disabled click test was vacuous              | **Fixed**                                                               |
| P1-1 | Missing external-link SVG icon               | **Fixed**                                                               |
| P1-2 | `:visited` dead code in Shadow DOM           | **Fixed** (removed, documented in JSDoc)                                |
| P1-3 | `download` type included unreachable boolean | **Fixed** (`string \| undefined` only)                                  |
| P1-4 | Story render function empty attribute leak   | **Fixed** (uses `ifDefined`)                                            |
| P2-1 | Variant spec mismatch                        | **Accepted** (default/subtle/danger is intentional design)              |
| P2-2 | No keyboard navigation tests                 | **Fixed** (3 keyboard tests added)                                      |
| P2-3 | No download-without-filename test            | **Fixed** (empty download test added)                                   |
| P2-4 | Deprecated `clip: rect()` in sr-only         | **Fixed** (uses `clip-path: inset(50%)`)                                |
| P2-5 | Redundant `cursor: not-allowed`              | **Fixed** (removed from `.link--disabled`, kept on `:host([disabled])`) |
| P2-6 | `LinkVariant` type not exported              | **Fixed** (exported from `index.ts`)                                    |
| P2-7 | Missing `outline: 0` on `.link`              | **Fixed** (present on `.link` base)                                     |
| P2-8 | No Drupal Twig usage example                 | **Fixed** (full Twig + behaviors in docs and `DrupalIntegration` story) |

---

## Current Findings

### P0 — Showstopper

None.

### P1 — Major

None.

### P2 — Minor

#### P2-01: `LinkVariant` type not re-exported from main `index.ts`

**File:** `packages/hx-library/src/index.ts`

The `LinkVariant` type was exported from the component's `index.ts` but not re-exported from the library barrel file. Consumers importing from `@helixui/library` could not access the type. Other components (e.g., `ComboboxOption`, `DropdownPlacement`) correctly re-export their types.

**Fix:** Added `type { LinkVariant }` to the hx-link export in `src/index.ts`.

---

#### P2-02: CEM inaccuracy — `--hx-link-color-danger` default mismatch

**File:** `hx-link.ts` JSDoc line 36

The JSDoc `@cssprop` for `--hx-link-color-danger` documented the default as `var(--hx-color-error-500)` but the actual CSS fallback is `var(--hx-color-error-text, #b91c1c)`. The CEM output would be wrong.

**Fix:** Updated JSDoc to `var(--hx-color-error-text)`.

---

#### P2-03: Undocumented CSS custom properties

**Files:** `hx-link.ts` JSDoc, `hx-link.styles.ts`

Four CSS custom properties used in styles were missing from JSDoc `@cssprop` documentation:

- `--hx-link-color-danger-hover` (line 66 of styles)
- `--hx-link-font-family` (line 19 of styles)
- `--hx-link-text-decoration-hover` (line 33 of styles)
- `--hx-link-underline-offset` (line 23 of styles)

**Fix:** Added all four `@cssprop` entries to JSDoc. Updated Starlight docs table to match.

### P3 — Low / Informational

#### P3-01: `:host([disabled])` cursor relies on `pointer-events: none` indirection

**File:** `hx-link.styles.ts`

The disabled cursor is applied on `:host([disabled])` while `.link--disabled` has `pointer-events: none`. This is correct — mouse events pass through the inner element to the host, which shows the `not-allowed` cursor. However, this indirection is non-obvious. A comment explaining the pattern would aid future maintainers.

**Impact:** None. Behavior is correct. Informational only.

---

#### P3-02: Shadow DOM `:visited` limitation is a platform constraint

**File:** `hx-link.ts` JSDoc line 40

Browsers do not apply `:visited` styles inside Shadow DOM for privacy reasons. This is documented in the component's JSDoc and in the Starlight docs. No action needed — this is a known platform limitation, not a component defect.

---

## Quality Gate Verification

| Gate | Check             | Result                                                                                                                            |
| ---- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1    | TypeScript strict | Zero errors — no `any`, strict mode, proper type exports                                                                          |
| 2    | Test suite        | 31 tests passing, axe-core included                                                                                               |
| 3    | Accessibility     | WCAG 2.1 AA — 5 axe-core tests, keyboard nav, disabled ARIA                                                                       |
| 4    | Storybook         | 10 stories: Default, Subtle, Danger, Disabled, ExternalLink, Download, AllVariants, AllStates, InlineContext, CSSCustomProperties |
| 5    | CEM accuracy      | JSDoc documents all 12 CSS custom properties, events, CSS parts, slots                                                            |
| 6    | Bundle size       | Minimal footprint — single component with no external dependencies                                                                |
| 7    | Code review       | Deep opus-level review complete                                                                                                   |

---

## Component Scorecard

| Category          | Score     | Notes                                                 |
| ----------------- | --------- | ----------------------------------------------------- |
| TypeScript strict | 10/10     | Zero `any`, `LinkVariant` exported, proper decorators |
| Accessibility     | 10/10     | Semantic `<a>`, disabled ARIA, keyboard nav, axe-core |
| Design tokens     | 10/10     | All colors/spacing/transitions use `--hx-*` tokens    |
| Test coverage     | 10/10     | 31 tests: render, props, events, keyboard, a11y       |
| Storybook stories | 10/10     | All variants, interactive play tests, CSS prop demos  |
| Documentation     | 10/10     | Complete Starlight docs with Drupal integration       |
| Shadow DOM encap. | 10/10     | Styles encapsulated, CSS parts for customization      |
| CEM accuracy      | 10/10     | JSDoc complete and accurate                           |
| **Overall**       | **10/10** | **Production-ready. No blocking issues.**             |

---

## Issue Count

| Severity  | Count         |
| --------- | ------------- |
| P0        | 0             |
| P1        | 0             |
| P2        | 3 (all fixed) |
| P3        | 2             |
| **Total** | **5**         |
