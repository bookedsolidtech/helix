# AUDIT: hx-form — Deep Component Audit v2

**Reviewer:** Deep audit agent
**Component:** `packages/hx-library/src/components/hx-form/`
**wc-mcp Health Score:** 89 (B) -> target 100 (A)
**Date:** 2026-03-06

---

## Summary

`hx-form` is a Light DOM form wrapper that injects scoped CSS via adopted stylesheets and provides client-side validation orchestration. The architecture (Light DOM, adopted stylesheets, Drupal-compatible no-`action` mode) is sound.

This audit identified 1 critical, 6 high, 10 medium, and 3 low findings. All critical and high issues have been fixed in this PR.

---

## Fixes Applied (CRITICAL + HIGH)

### P0-01: FIXED — Error summary with `role="alert"` on validation failure

- Added `@state()` property `_validationErrors` to track validation errors
- Render `<div class="hx-form-error-summary" role="alert" aria-live="assertive">` with error list when validation fails
- Error summary clears on successful submit and on reset
- Added CSS styles for error summary in `form.scoped.css`
- WCAG 2.1 AA compliant: screen readers now receive form error announcements

### P1-01: FIXED — Forced-colors fallback for focus styles

- Added `@media (forced-colors: active)` block to `form.scoped.css`
- Restores visible `outline: 2px solid CanvasText` on focus for all input types, textarea, and select
- Resolves WCAG 2.4.7 (Focus Visible) in Windows High Contrast Mode

### P1-02: FIXED — CSS custom property tokens now consumed

- Added `hx-form` host rule consuming `--hx-form-gap`, `--hx-form-max-width`, `--hx-form-padding`
- Updated `hx-form form` rule to use `--hx-form-gap` token
- JSDoc `@cssprop` declarations now match actual CSS consumption

### P1-03: FIXED — `aria-invalid` management on validation failure

- Added `_syncAriaInvalid()` method that sets `aria-invalid="true"` on invalid fields and removes it from valid ones
- Called during submit handler (both success and failure paths)
- `aria-invalid` cleared on form reset
- New tests verify aria-invalid is set/cleared correctly

### P1-04: FIXED — Server-side validation API

- Added `setErrors(errors)` method for programmatic error setting (e.g., Drupal server responses)
- Added `clearErrors()` method to remove all error state
- Both methods manage error summary rendering AND `aria-invalid` attributes
- Uses `CSS.escape()` for safe name-based field selection

### P1-05: FIXED — Test for hx-\* component validation chain

- Added test: `checkValidity() includes hx-* components with checkValidity method`
- Tests that `hx-text-input[required]` with no value causes `hx-form.checkValidity()` to return `false`
- Verifies the `_getAllValidatableElements()` path for custom elements

### CEM: FIXED — 3 missing descriptions on private members

- Added `@internal` JSDoc tag to `_styles`, `_handleSubmit`, `_handleReset`, `_collectValidationErrors`
- These private implementation details will be excluded from CEM output

### Additional fixes applied

- **P2-01**: Fixed stale `wc-submit` reference in `action` property JSDoc -> `hx-submit`
- **P2-02**: Fixed stale `wc-*` reference in `getFormElements()` docstring -> `hx-*`
- **P2-03**: Updated test imports from deprecated `WcForm` to `HelixForm`
- **P2-04**: Added `formData: FormData` to `hx-submit` event detail alongside `values`
- **P3-01**: Added standard `appearance: textfield` alongside deprecated `-moz-appearance`
- **P3-03**: Removed deprecated `WcForm` type alias (consumers should use `HelixForm`)
- Added accessibility guidance in class-level JSDoc

---

## Remaining Issues (Documented — P2/P3)

### P2-05: No `enctype` property

The `<form>` element rendered when `action` is set has no `enctype` attribute. Healthcare forms with file attachments need `enctype="multipart/form-data"`. Recommend adding an `enctype` property.

### P2-06: Reset test only verifies event dispatch, not field clearing

Reset test confirms `hx-reset` is dispatched but does not verify field values are cleared. A regression in native reset behavior would not be caught.

### P2-07: `getFormElements()` uses hardcoded allowlist

```ts
'hx-text-input, hx-select, hx-checkbox, hx-textarea, hx-radio-group, hx-switch';
```

Must be manually updated for new form components. A protocol-based approach (querying for `formAssociated` marker or shared mixin) would be more resilient.

### P2-08: Screenshot artifacts carry stale `wc-*` event names

Screenshot filenames from before the `hx-*` prefix rename still exist in `__screenshots__/`.

### P2-09: No story for reset behavior

No story demonstrates the reset cycle with a play function verifying behavior.

### P2-10: Redundant error class naming variants

CSS handles three Drupal error class variants (`.error`, `.has-error`, `--error`) with 39-selector rules. Maintenance burden when adding new input types.

### P3-02: `outline: none` vs `outline: 0`

Some lint configurations flag `outline: none` in favor of `outline: 0`. Not a functional issue.

---

## Test Coverage

| Suite               | Tests | Status                      |
| ------------------- | ----- | --------------------------- |
| Rendering           | 3     | Pass                        |
| Properties          | 4     | Pass                        |
| Events              | 5     | Pass                        |
| Form Discovery      | 5     | Pass                        |
| Validation          | 4     | Pass (includes hx-\* chain) |
| Error Summary       | 2     | Pass (NEW)                  |
| Aria Invalid        | 2     | Pass (NEW)                  |
| Server-Side Errors  | 2     | Pass (NEW)                  |
| Scoped Styles       | 3     | Pass                        |
| Accessibility (axe) | 3     | Pass                        |

**Total: 33 tests** (up from 22)

---

## Files Modified

- `hx-form.ts` — Component class (accessibility, error summary, server-side API, CEM fixes)
- `hx-form.test.ts` — 11 new tests, updated imports
- `form.scoped.css` — Host tokens, error summary styles, forced-colors fallback
