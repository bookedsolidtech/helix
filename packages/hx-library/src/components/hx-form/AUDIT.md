# AUDIT: hx-form — T2-35 Antagonistic Quality Review

**Reviewer:** Antagonistic audit agent
**Component:** `packages/hx-library/src/components/hx-form/`
**Audit tier:** T2-35 (Deep antagonistic — validation orchestration wrapper)
**Files reviewed:**

- `hx-form.ts`
- `hx-form.test.ts`
- `hx-form.stories.ts`
- `hx-form.styles.ts`
- `src/styles/form/form.scoped.css`
- `src/styles/form/_validation.css`

---

## Summary

`hx-form` is a Light DOM form wrapper that injects scoped CSS and provides client-side validation orchestration. The architecture (Light DOM, adopted stylesheets, Drupal-compatible no-`action` mode) is sound. However, several gaps exist between documented behavior and actual implementation, particularly around accessibility announcement of validation errors, forced-colors mode, and CSS custom property contracts.

---

## Findings

### P0 — Critical (must fix before merge)

#### P0-01: No DOM-rendered error summary on validation failure

**File:** `hx-form.ts:207-224`

When `hx-invalid` fires, the component dispatches a custom event but renders **nothing in the DOM**. The audit spec requires `role="alert"` error summary announced to screen readers on submit failure. Consumers receive the `errors` array only via JavaScript event listeners; users of AT (screen readers) receive no announcement unless consumers manually build and inject the summary. There is no default implementation, no guidance in JSDoc, and no Storybook story demonstrating the pattern.

This is a WCAG 2.1 AA violation for forms where hx-form is the sole orchestration point.

**Evidence:** `_handleSubmit` dispatches `hx-invalid` (line 217-223) and returns. No DOM mutation follows.

---

### P1 — High (blocks shipping)

#### P1-01: `outline: none` in focus styles without forced-colors fallback

**File:** `src/styles/form/form.scoped.css:113, 200, 252`

All focus states replace the browser's `outline` with a `box-shadow` ring:

```css
hx-form input[type='text']:focus {
  outline: none;
  box-shadow: ...;
}
```

`box-shadow` is invisible in Windows High Contrast Mode (forced-colors). No `@media (forced-colors: active)` block restores a visible outline. This fails WCAG 2.1 AA Success Criterion 2.4.7 (Focus Visible) for users on Windows HCM.

Affects: all text inputs, textarea, select, summary element focus styles.

#### P1-02: Documented `@cssprop` tokens not consumed by CSS

**File:** `hx-form.ts:28-31`, `form.scoped.css`

The JSDoc block declares three CSS custom properties:

```
@cssprop [--hx-form-gap=var(--hx-space-4)]
@cssprop [--hx-form-max-width=none]
@cssprop [--hx-form-padding=0]
```

None of these tokens appear anywhere in `form.scoped.css`. The CEM will expose these as valid theming API but setting them has zero effect. This is a broken contract between documentation and implementation.

#### P1-03: No `aria-invalid` management on validation failure

**File:** `hx-form.ts:201-225`

On submit failure, the component collects errors and fires `hx-invalid`. It does not set `aria-invalid="true"` on invalid fields. Screen readers announce the field's state via `aria-invalid`; without it, visually impaired users cannot distinguish which fields have errors unless the consumer does this manually. No helper or guidance exists.

#### P1-04: No server-side validation API

**File:** `hx-form.ts` (missing method)

Drupal commonly returns server-side validation errors after form submission. There is no `setErrors()`, `setFieldError()`, or equivalent method to programmatically mark fields invalid and render error messages. The only error path is client-side via constraint validation. Healthcare forms virtually always require server validation (e.g., duplicate MRN, insurance verification). Without this, `hx-form` cannot fully orchestrate the form lifecycle for Drupal server responses.

#### P1-05: No test for hx-\* component validation chain

**File:** `hx-form.test.ts:264-296`

The `Validation` suite tests only native `<input>` elements. There is no test verifying that nested `hx-text-input`, `hx-select`, `hx-checkbox`, etc. with `checkValidity()` are actually called during `hx-form.checkValidity()` / `reportValidity()`. The `_getAllValidatableElements()` path for wc-\* components is untested. If a custom element's `checkValidity` returns `false`, it's unclear whether this is correctly surfaced.

#### P1-06: No story demonstrating the validation/error cycle

**File:** `hx-form.stories.ts`

There is a `RequiredFields` story (partially read) but no story demonstrates the complete cycle:

1. Submit empty form
2. `hx-invalid` fires
3. Error summary appears (`role="alert"`)
4. User corrects fields
5. Resubmit fires `hx-submit`

Without this story, Storybook provides no guidance on how consumers should handle `hx-invalid`. The error summary pattern is undocumented in stories.

---

### P2 — Medium (quality issues)

#### P2-01: JSDoc for `action` property references stale event name `wc-submit`

**File:** `hx-form.ts:63-66`

```ts
/**
 * The URL to submit the form to. When empty, the form handles
 * submission client-side only and dispatches `wc-submit`.
```

The event is `hx-submit`. This is leftover from the `wc-*` → `hx-*` prefix rename and will appear verbatim in CEM-generated documentation.

#### P2-02: `getFormElements()` docstring references `wc-*` prefix

**File:** `hx-form.ts:158-162`

```ts
/**
 * Returns all child wc-* form components (elements whose tag starts
 * with `wc-` and that have a `name` property or a `value` property).
 */
```

The selector targets `hx-text-input, hx-select, hx-checkbox, hx-textarea, hx-radio-group, hx-switch`. The description is doubly wrong: it says `wc-*` prefix and implies tag-prefix-based discovery, but the implementation is a hardcoded allowlist. If a new `hx-*` form component is added (e.g., `hx-date-picker`), it must be manually added to this selector list.

#### P2-03: Tests import deprecated `WcForm` type alias

**File:** `hx-form.test.ts:3`

```ts
import type { WcForm } from './hx-form.js';
```

The `WcForm` alias is marked `@deprecated` in the source. Tests should import `HelixForm` to avoid consuming deprecated API.

#### P2-04: `hx-submit` detail does not include a `FormData` instance

**File:** `hx-form.ts:228-248`

The `hx-submit` event detail provides `values: Record<string, FormDataEntryValue | FormDataEntryValue[]>` — a plain object — not a `FormData` instance. Consumers cannot use `FormData` methods (`formData.entries()`, `formData.append()`, etc.) on the payload. The audit spec explicitly calls out "form submit event typing with FormData." Including the raw `FormData` alongside or instead of the plain object would satisfy this contract.

#### P2-05: No `enctype` property

**File:** `hx-form.ts`

The `<form>` element rendered by hx-form when `action` is set (line 287-296) has no `enctype` attribute. Healthcare forms commonly include file attachments (scanned referrals, imaging orders). Without `enctype="multipart/form-data"` support, binary uploads fall back to the browser default `application/x-www-form-urlencoded`, silently corrupting file data.

#### P2-06: Reset test only verifies event dispatch, not field clearing

**File:** `hx-form.test.ts:160-178`

The reset test confirms `hx-reset` is dispatched. It does not verify that field values are actually cleared after reset. A regression in native reset behavior (e.g., an `hx-*` component that doesn't respond to native `reset`) would not be caught by this test.

#### P2-07: `getFormElements()` uses hardcoded allowlist — not extensible

**File:** `hx-form.ts:163-166`

```ts
'hx-text-input, hx-select, hx-checkbox, hx-textarea, hx-radio-group, hx-switch';
```

This selector must be manually updated whenever a new form component is introduced. A protocol-based approach (e.g., querying for elements with a known `formAssociated` marker or shared mixin) would be more resilient.

#### P2-08: Screenshot artifacts carry stale `wc-*` event names

**Directory:** `__screenshots__/hx-form.test.ts/`

Screenshot filenames include:

- `hx-form-Events-dispatches-wc-submit-on-valid-client-side-submit-1.png`
- `hx-form-Events-dispatches-wc-reset-when-form-is-reset-1.png`
- `hx-form-Events-dispatches-wc-invalid-when-validation-fails-on-submit-1.png`

These are stale from before the `hx-*` prefix rename. They will diverge from current test descriptions and mislead reviewers browsing the screenshot artifacts.

#### P2-09: No story for reset behavior

**File:** `hx-form.stories.ts`

No story demonstrates the reset cycle: fill form → click reset → verify fields cleared and `hx-reset` fires. The `RequiredFields` and `NativeHtmlForm` stories have reset buttons but no play function verifying the behavior.

#### P2-10: Three redundant error class naming variants create selector bloat

**File:** `form.scoped.css:700-795`

The CSS handles three Drupal error class variants: `.form-item.error`, `.form-item.has-error`, `.form-item--error`. This results in 39-selector rules for error inputs alone (lines 708-736). While Drupal compatibility justifies the variants, the repetition is a significant maintenance burden. Any new input type (e.g., `input[type='date']`) must be added in three parallel locations.

---

### P3 — Low (polish / minor)

#### P3-01: Deprecated `-moz-appearance: textfield`

**File:** `form.scoped.css:168`

`-moz-appearance` is deprecated in modern Firefox (removed in FF 128+). Should use `appearance: textfield` with the standardized property.

#### P3-02: `outline: none` preferred as `outline: 0` in some lint configs

**File:** `form.scoped.css:113, 200, 252`

Minor compatibility note: some lint configurations (stylelint) flag `outline: none` in favor of `outline: 0`. Not a functional issue but may trigger CI lint warnings if stylelint is added.

#### P3-03: `WcForm` deprecated alias adds API surface confusion

**File:** `hx-form.ts:309-311`

```ts
/** @deprecated Use `HelixForm` directly. Alias for backwards compatibility with tests that import `WcForm`. */
export type WcForm = HelixForm;
```

A type alias marked deprecated-for-tests suggests the migration was incomplete. The alias should be removed once all consumers (tests included) are updated to `HelixForm`.

---

## Missing Coverage Summary

| Audit Area                         | Status       | Gap                                              |
| ---------------------------------- | ------------ | ------------------------------------------------ |
| TypeScript strict                  | Pass         | Stale JSDoc copy (P2-01, P2-02)                  |
| FormData event typing              | Partial      | `values` is a plain object, not FormData (P2-04) |
| Accessibility — error summary      | Fail         | No `role="alert"` rendered in DOM (P0-01)        |
| Accessibility — `aria-invalid`     | Fail         | Not set on validation failure (P1-03)            |
| Accessibility — forced-colors      | Fail         | `outline: none` without HCM fallback (P1-01)     |
| Tests — hx-submit with FormData    | Partial      | No FormData instance in event (P2-04)            |
| Tests — hx-\* component validation | Fail         | Not tested (P1-05)                               |
| Tests — reset clears fields        | Partial      | Event tested, field values not verified (P2-06)  |
| Storybook — error summary story    | Fail         | Missing (P1-06)                                  |
| Storybook — reset story            | Partial      | Button present, no play function (P2-09)         |
| CSS — `--hx-form-*` tokens         | Fail         | Declared but never consumed (P1-02)              |
| CSS — CSS parts                    | N/A          | Light DOM — no shadow parts (by design)          |
| Performance — bundle size          | Not measured | Requires build analysis                          |
| Drupal — server-side validation    | Fail         | No `setErrors()` API (P1-04)                     |
| Drupal — file uploads              | Fail         | No `enctype` support (P2-05)                     |
