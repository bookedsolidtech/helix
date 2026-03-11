# AUDIT: hx-form — Deep Review

**Auditor:** Deep Opus-Level Review
**Date:** 2026-03-11
**Status:** PASS — all P0 and P1 issues resolved

---

## Files Reviewed

- `hx-form.ts` — Component implementation (Light DOM form wrapper with validation orchestration)
- `hx-form.styles.ts` — Lit CSS styles
- `hx-form.test.ts` — Vitest browser tests (36 tests)
- `hx-form.stories.ts` — Storybook stories with validation and error state variants
- `index.ts` — Barrel re-export
- `src/styles/form/form.scoped.css` — Scoped CSS for native form elements
- `src/styles/form/_validation.css` — Validation-specific styles

---

## Quality Gate Results

| Gate | Check             | Status                                       |
| ---- | ----------------- | -------------------------------------------- |
| 1    | TypeScript strict | PASS — zero errors, no `any` types           |
| 2    | Test suite        | PASS — 36 tests across 8 categories          |
| 3    | Accessibility     | PASS — error summary, aria-invalid, axe-core |
| 4    | Storybook         | PASS — comprehensive variant coverage        |
| 5    | CEM accuracy      | PASS — all exports match public API          |
| 6    | Bundle size       | PASS — within budget                         |
| 7    | Code review       | PASS — deep audit complete                   |

---

## Previous Findings — Resolution Status

### P0 Findings (all resolved)

| #   | Finding                                          | Resolution                                                                                      |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | No DOM-rendered error summary on validation fail | FIXED — `render()` outputs error summary with `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"` when `_validationErrors` has entries |

### P1 Findings (all resolved)

| #   | Finding                                             | Resolution                                                                              |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | `outline: none` without forced-colors fallback      | FIXED — `@media (forced-colors: active)` blocks added at lines 165, 264, 324, 998      |
| 2   | `--hx-form-*` CSS tokens declared but never consumed | FIXED — `form.scoped.css` consumes `--hx-form-gap`, `--hx-form-max-width`, `--hx-form-padding` |
| 3   | No `aria-invalid` management on validation failure  | FIXED — `_applyAriaInvalidFromValidity()` on submit failure, `_applyAriaInvalidFromErrors()` for server-side errors |
| 4   | No server-side validation API                       | FIXED — `setErrors()`, `setFieldError()`, `clearErrors()` methods implemented          |
| 5   | No test for hx-* component validation chain         | FIXED — test "checkValidity() calls checkValidity() on hx-* components" at line 357    |
| 6   | No story demonstrating validation/error cycle       | FIXED — stories with comprehensive error states and validation variants                 |

### P2 Findings (resolved or accepted)

| #   | Finding                                           | Resolution                                                                       |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | JSDoc `action` property references stale `wc-submit` | FIXED — all JSDoc references use `hx-` prefix correctly                       |
| 2   | `getFormElements()` docstring references `wc-*` prefix | FIXED — JSDoc updated to `hx-` prefix                                       |
| 3   | Tests import deprecated `WcForm` type alias       | FIXED — tests import `HelixForm`, no deprecated alias in source                 |
| 4   | `hx-submit` detail missing `FormData` instance    | FIXED — `hx-submit` detail includes `formData: FormData` along with `values`    |
| 5   | No `enctype` property                             | FIXED — `enctype` property exists with proper typing                             |
| 6   | Reset test only verifies event, not field clearing | ACCEPTED — event dispatch is the primary contract; native reset handles fields  |
| 7   | `getFormElements()` uses hardcoded allowlist       | ACCEPTED — allowlist is explicit and maintainable; protocol-based approach deferred |
| 8   | Screenshot artifacts carry stale `wc-*` event names | ACCEPTED — screenshots regenerated on next VRT run                             |
| 9   | No story for reset behavior                        | ACCEPTED — reset buttons present in existing stories                            |
| 10  | Three redundant error class naming variants        | ACCEPTED — Drupal compatibility requires all three variants                     |

### P3 Findings (cosmetic, deferred)

| #   | Finding                                    | Status                                                                     |
| --- | ------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | Deprecated `-moz-appearance: textfield`    | OPEN — low priority; Firefox 128+ uses standard `appearance` property      |
| 2   | `outline: none` vs `outline: 0` lint style | OPEN — cosmetic; no functional impact, may trigger stylelint if added      |
| 3   | `WcForm` deprecated alias                  | RESOLVED — alias removed, all consumers use `HelixForm`                    |

---

## Component Capabilities Summary

### Architecture

Light DOM form wrapper with adopted stylesheet injection. Provides client-side and server-side validation orchestration, Drupal-compatible no-`action` mode, and scoped CSS for native form elements.

### Properties

`action`, `method`, `enctype`, `novalidate`

### Events (3)

`hx-submit`, `hx-invalid`, `hx-reset`

### Public Methods

`checkValidity()`, `reportValidity()`, `reset()`, `getFormElements()`, `getFormData()`, `setErrors()`, `setFieldError()`, `clearErrors()`

### CSS Custom Properties (3)

`--hx-form-gap`, `--hx-form-max-width`, `--hx-form-padding` — all consumed in `form.scoped.css` with semantic token fallbacks.

### Design Token Compliance

All colors, spacing, typography, border widths, focus rings, and transitions use design tokens. No hardcoded values in production styling. Forced-colors media queries present for Windows High Contrast Mode.

### Accessibility

- Error summary rendered with `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"`
- `aria-invalid` set on fields during client-side and server-side validation failure
- Forced-colors fallback for all focus states
- Full constraint validation API integration with native and `hx-*` form elements

### TypeScript

- Strict mode, zero `any` types
- Exported type: `HelixForm`
- Proper CEM JSDoc annotations with `@cssprop`, `@fires`, `@slot` tags

### Drupal Integration

- Server-side validation API (`setErrors()`, `setFieldError()`, `clearErrors()`)
- No-`action` mode for client-side SPA handling
- Scoped CSS for native form elements within Drupal markup
- `enctype` support for file uploads

---

## Test Coverage

| Category       | Tests                                                            |
| -------------- | ---------------------------------------------------------------- |
| Rendering      | 3 (shadow DOM structure, form element presence)                  |
| Properties     | 5 (action, method, enctype, novalidate, attribute reflection)    |
| Events         | 7 (hx-submit, hx-invalid, hx-reset, FormData in detail)         |
| Form Discovery | 5 (native elements, hx-* components, getFormElements, getFormData) |
| Validation     | 5 (checkValidity, reportValidity, hx-* component chain, aria-invalid) |
| Error Summary  | 5 (role="alert" render, setErrors, setFieldError, clearErrors)   |
| Scoped Styles  | 3 (adopted stylesheet injection, token consumption)              |
| Accessibility  | 3 (axe-core, error summary ARIA attributes, forced-colors)       |

**Total: 36 tests**

---

## Exports

`HelixForm` exported from `packages/hx-library/src/index.ts`.
