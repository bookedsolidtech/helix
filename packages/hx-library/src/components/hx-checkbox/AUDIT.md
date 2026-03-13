# hx-checkbox — Deep Opus-Level Quality Audit

**Auditor:** Claude Opus 4.6 (feature-deep-audit-hx-checkbox)
**Date:** 2026-03-11
**Previous audit:** 2026-03-05 (T1-09 antagonistic review, 27 findings)

**Files reviewed:**

- `hx-checkbox.ts`
- `hx-checkbox.styles.ts`
- `hx-checkbox.test.ts`
- `hx-checkbox.stories.ts`
- `index.ts`
- `apps/docs/src/content/docs/component-library/hx-checkbox.mdx`
- `packages/hx-library/custom-elements.json` (CEM output)

---

## Previous Audit Resolution: 24 of 27 FIXED

All 2 P0 and all 10 P1 findings are resolved. Remediation quality is high.

| ID    | Area          | Severity | Description                                          | Status                                                                                                                                          |
| ----- | ------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | Accessibility | P0       | `aria-describedby` broken for `error` slot           | **FIXED** — wrapper div always owns the ID                                                                                                      |
| P0-02 | Accessibility | P0       | `NoLabel` pattern fails — `aria-label` not forwarded | **FIXED** — host aria-label forwarded to inner input                                                                                            |
| P1-01 | TypeScript    | P1       | `formStateRestoreCallback` wrong signature           | **FIXED** — accepts `string \| File \| FormData \| null`                                                                                        |
| P1-02 | Accessibility | P1       | `role="alert"` + `aria-live="polite"` contradiction  | **FIXED** — `role="status"` used, no explicit aria-live                                                                                         |
| P1-03 | CSS           | P1       | Hover border-color ignores component token           | **FIXED** — cascades through `--hx-checkbox-hover-border-color`                                                                                 |
| P1-04 | Storybook     | P1       | `hx-size` missing from `argTypes`                    | **FIXED** — select control with sm/md/lg                                                                                                        |
| P1-05 | Tests         | P1       | No axe-core test for indeterminate state             | **FIXED** — axe test added                                                                                                                      |
| P1-06 | Tests         | P1       | No test for `input.indeterminate`                    | **FIXED** — asserts `input.indeterminate === true`                                                                                              |
| P1-07 | Tests         | P1       | Error slot has no test coverage                      | **FIXED** — slot + aria-describedby tested                                                                                                      |
| P1-08 | Storybook     | P1       | Empty-string attributes passed unconditionally       | **FIXED** — `ifDefined` used for error/helpText/name                                                                                            |
| P1-09 | TypeScript    | P1       | `indeterminate` missing `reflect: true`              | **FIXED** — reflects to host attribute                                                                                                          |
| P1-10 | Tests         | P1       | No test clicking label text                          | **FIXED** — label click test added                                                                                                              |
| P2-01 | Tests         | P2       | Tests use deprecated `WcCheckbox` type               | **FIXED** — uses `HelixCheckbox`                                                                                                                |
| P2-02 | CSS/Tokens    | P2       | Missing `--hx-checkbox-bg` component token           | **FIXED** — token added with fallback                                                                                                           |
| P2-03 | CSS/Tokens    | P2       | Help text color missing component token              | **FIXED** — `--hx-checkbox-help-text-color` used                                                                                                |
| P2-04 | HTML          | P2       | `tabindex="0"` redundant on native input             | **FIXED** — removed                                                                                                                             |
| P2-05 | TypeScript    | P2       | `Math.random()` for ID — collision risk              | **FIXED** — monotonic counter                                                                                                                   |
| P2-06 | TypeScript    | P2       | Redundant condition in `describedBy`                 | **FIXED** — simplified                                                                                                                          |
| P2-07 | Tests         | P2       | No tests for `hx-size` variants                      | **FIXED** — sm, lg, reflection tested                                                                                                           |
| P2-08 | Tests         | P2       | No test for `formStateRestoreCallback(null)`         | **FIXED** — null case tested                                                                                                                    |
| P2-09 | CSS           | P2       | `clip: rect(0,0,0,0)` deprecated                     | **FIXED** — `clip-path: inset(50%)`                                                                                                             |
| P2-10 | Drupal        | P2       | `hx-size` may conflict with htmx                     | **ADDRESSED** — `hx-checkbox.twig` added with documentation of the htmx namespace consideration and planned normalization in next major version |
| P2-11 | Storybook     | P2       | `NoLabel` story lacks play function                  | **OPEN** — no runtime axe assertion on this pattern                                                                                             |
| P2-12 | Storybook     | P2       | `--hx-checkbox-bg` undocumented in stories           | **FIXED** — token exists, documented in JSDoc + Starlight                                                                                       |
| P2-13 | TypeScript    | P2       | `_hasErrorSlot` re-render edge case                  | **FIXED** — resolved by P0-01 wrapper pattern                                                                                                   |
| P2-14 | API           | P2       | Missing `checkmark` CSS part                         | **FIXED** — `part="checkmark"` on SVG                                                                                                           |
| P2-15 | Storybook     | P2       | Select-All stories use DOM anti-pattern              | **OPEN** — story-quality issue, not component bug                                                                                               |

---

## New Findings (this audit)

### Remediated in this audit

| ID     | Severity | Area     | Description                                                            | Resolution                                                                              |
| ------ | -------- | -------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| NEW-02 | P2       | A11y/CSS | Missing `prefers-reduced-motion` media query for transitions           | Added `@media (prefers-reduced-motion: reduce)` to disable `.checkbox__box` transitions |
| NEW-03 | P2       | Form     | `formDisabledCallback` not implemented — `<fieldset disabled>` ignored | Implemented callback; test added                                                        |
| NEW-05 | P3       | CEM/Docs | `--hx-checkbox-hover-border-color` missing from JSDoc `@cssprop`       | Added to JSDoc block                                                                    |
| NEW-08 | P3       | Tests    | No test for `aria-checked="mixed"` DOM attribute                       | Test added                                                                              |

### Remaining new findings

| ID     | Severity | Area         | Description                                                                                                                 |
| ------ | -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| NEW-01 | P3       | A11y         | `aria-checked="mixed"` is redundant with native `input.indeterminate` — harmless, no action required                        |
| NEW-04 | P2       | Code Quality | Label + input click suppression pattern (`preventDefault` + `stopPropagation`) is fragile — should have explanatory comment |
| NEW-06 | P3       | CEM          | Private members exposed in CEM output — needs analyzer plugin to strip                                                      |
| NEW-07 | P3       | CEM          | `aria-label` attribute in CEM has no type/description — inferred from `observedAttributes`                                  |
| NEW-09 | P3       | A11y         | No `aria-required` on input — native `required` sufficient per spec but inconsistent with other form components             |
| NEW-10 | P3       | Docs         | `hx-checkbox-group` reference in Starlight docs may lack a link to its page                                                 |

---

## Quality Gate Status

| Gate | Check                                    | Status                                                                     |
| ---- | ---------------------------------------- | -------------------------------------------------------------------------- |
| 1    | TypeScript strict (`npm run type-check`) | **PASS** — zero errors                                                     |
| 2    | Test suite (Vitest browser mode)         | **PASS** — 67 tests, all green, axe-core across 5 states                   |
| 3    | Accessibility (WCAG 2.1 AA)              | **PASS** — axe-core clean, proper ARIA, keyboard nav, form validation      |
| 4    | Storybook stories                        | **PASS** — 27+ stories, all variants, play functions, healthcare scenarios |
| 5    | CEM accuracy                             | **PASS** — properties, events, slots, parts documented                     |
| 6    | Bundle size                              | **PASS** — component <5KB                                                  |
| 7    | Code review                              | Deep audit complete                                                        |

---

## Test Coverage Summary (67 tests)

- Rendering (4): shadow DOM, native input, visual box, CSS part
- Property: checked (3): default, reflection, class
- Property: indeterminate (5): class, toggle clear, native property, reflection, aria-checked
- Property: label (3): text, required marker, CSS part
- Property: error (4): role="status", no aria-live conflict, aria-invalid, hides help text
- Property: helpText (2): render, hidden when error
- Property: value (2): default, custom in event
- Property: required (2): native attr, reflection
- Property: disabled (3): native attr, reflection, prevents toggle
- Events (5): dispatch, detail, bubbles/composed, disabled no-fire, label click
- Slots (3): default, help-text, error (with aria-describedby)
- CSS Parts (4): control, checkbox, error, checkmark
- Property: hxSize (3): sm, lg, reflection
- Form (7): formAssociated, internals, form getter, reset, restore, null restore, formDisabledCallback
- Validation (6): checkValidity, valueMissing, reportValidity, validationMessage
- Accessibility (3): aria-describedby error, help text, no aria-invalid default
- Keyboard (2): Space toggles, Enter does not
- Methods (1): focus() delegation
- Accessibility axe-core (5): default, checked, error, disabled, indeterminate

---

## Overall Assessment

The hx-checkbox component is production-ready. All critical and high-priority findings from the previous audit are resolved. The component demonstrates solid form-association patterns (ElementInternals, formResetCallback, formStateRestoreCallback, formDisabledCallback), comprehensive accessibility (ARIA labeling, describedby, indeterminate, keyboard, axe-core), proper design token cascade (three-tier with fallbacks), and thorough test coverage.

The remaining open items are low-risk: two story-quality concerns (P2-11, P2-15), one design naming decision (P2-10), and one code-quality improvement (NEW-04). These do not block production use.
