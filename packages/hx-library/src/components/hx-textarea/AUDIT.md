# AUDIT: hx-textarea (T1-06) — Antagonistic Quality Review

**Date:** 2026-03-05
**Auditor:** qa-engineer-automation (automated deep review)
**Scope:** All files in `packages/hx-library/src/components/hx-textarea/`
**Verdict:** BLOCKED — P0 and P1 defects require remediation before merge

---

## Summary

`hx-textarea` is a well-structured form-associated custom element with solid coverage across most audit areas. However, two P0 defects (broken aria-describedby when using error slot, silent help-text slot failure) and several P1 violations block release. The test suite is extensive (50+ cases) and the CEM annotations are accurate, but the accessibility implementation has subtle gaps that could impact screen reader users in production healthcare contexts.

---

## P0 — Critical (Block Release)

### P0-01: `aria-describedby` references a non-existent element when error is provided via slot

**File:** `hx-textarea.ts`, lines 323–326, 371–385

**Description:**
When an error is provided via the `error` slot (not the `error` property), `hasError` becomes `true` and `describedBy` is computed as `this._errorId`. However, the `<div id=${this._errorId}>` element is only rendered when `this.error` (the property) is truthy. When using the slot, that div is never rendered. The `aria-describedby` on the native `<textarea>` therefore points to an ID that does not exist in the DOM.

```ts
// Computed from property, not slot:
const describedBy =
  [hasError ? this._errorId : null, ...]
    .filter(Boolean)
    .join(' ') || undefined;

// But this div only renders when this.error (prop) is set:
${this.error
  ? html`<div ... id=${this._errorId}>...</div>`
  : nothing}
```

**Impact:** Screen readers cannot associate the error message with the textarea. Users navigating by field will hear no error description, violating WCAG 2.1 SC 1.3.1 (Info and Relationships) and SC 4.1.3 (Status Messages). This is a direct patient-safety risk in form-heavy clinical workflows.

**Severity:** P0

---

### P0-02: `help-text` slot silently fails unless `helpText` property is also set

**File:** `hx-textarea.ts`, lines 387–393

**Description:**
The help-text slot is nested inside a container that is conditionally rendered only when the `helpText` property is truthy:

```ts
${this.helpText && !hasError
  ? html`
      <div part="help-text" class="field__help-text" id=${this._helpTextId}>
        <slot name="help-text">${this.helpText}</slot>
      </div>
    `
  : nothing}
```

If a consumer provides `<span slot="help-text">Guidance text</span>` but does NOT also set the `help-text` attribute/property, the slotted content is silently discarded — the slot's host container is never rendered. The JSDoc explicitly documents `@slot help-text - Custom help text content (overrides the helpText property)`, implying the slot can be used independently.

**Impact:** Drupal Form API integration renders help text via markup injection into slots. Without the property set, all Drupal-rendered help text disappears without error or console warning. This breaks a primary use case silently.

**Severity:** P0

---

## P1 — High (Must Fix Before Merge)

### P1-01: Non-null assertion (`!`) violates TypeScript strict contract

**File:** `hx-textarea.ts`, line 152

```ts
@query('.field__textarea')
private _textarea!: HTMLTextAreaElement;
```

The `!` non-null assertion bypasses TypeScript strict null checking. Per CLAUDE.md: "No non-null assertions. TypeScript strict mode is not a suggestion." If `focus()` or `select()` is called before first render, `this._textarea` is `undefined` and the `?.` optional chains in those methods save execution but the `_updateValidity()` call (line 214–227) passes `this._textarea` as the anchor element to `setValidity` without guarding, which throws if called before first render.

**Severity:** P1

---

### P1-02: `_updateValidity()` not triggered when `required` changes without a concurrent value change

**File:** `hx-textarea.ts`, lines 177–183

**Description:**
`_updateValidity()` is called in `updated()` only when `changedProperties.has('value')`. If a consumer sets `el.required = true` programmatically after initial render (while value remains `''`), the validity state is NOT updated. `el.checkValidity()` would return `true` even though the required field is empty — until the user modifies the value.

```ts
override updated(changedProperties: Map<string, unknown>): void {
  super.updated(changedProperties);
  if (changedProperties.has('value')) {  // <-- required/maxlength changes NOT covered
    this._internals.setFormValue(this.value);
    this._updateValidity();
  }
}
```

**Impact:** Form validation is silently incorrect when `required` or `maxlength` are bound dynamically (e.g., conditional form fields). The `validity.valueMissing` flag lags reality.

**Severity:** P1

---

### P1-03: `role="alert"` combined with `aria-live="polite"` is semantically incorrect

**File:** `hx-textarea.ts`, lines 372–381

```html
<div part="error" class="field__error" id="${this._errorId}" role="alert" aria-live="polite"></div>
```

`role="alert"` implicitly carries `aria-live="assertive"` and `aria-atomic="true"`. Adding `aria-live="polite"` creates an ambiguous override — different screen readers resolve this conflict differently. VoiceOver on macOS ignores the explicit `aria-live` and uses assertive semantics from the role. NVDA on Windows may use the explicit `aria-live="polite"`. This non-standard combination leads to inconsistent announcement timing across AT, violating WCAG 2.1 SC 4.1.3.

**Recommendation:** Either use `role="alert"` alone (assertive, appropriate for form errors that need immediate announcement), or use `aria-live="polite"` alone with an appropriate role (e.g., `role="status"`). Do not combine.

**Severity:** P1

---

### P1-04: Character counter has no accessible association with the textarea

**File:** `hx-textarea.ts`, lines 304–311; `hx-textarea.styles.ts`, lines 132–138

**Description:**
The character counter `<div part="counter" class="field__counter">${display}</div>` is a visual-only element. It is not:

- Referenced in the textarea's `aria-describedby`
- Given an `aria-live` region to announce updates as the user types
- Given a meaningful role or label for screen reader context

A screen reader user typing in the textarea will never hear "5 / 200" — the counter is completely invisible to AT. The audit specification explicitly lists "character count announced to screen readers if present" as a required audit area.

**Severity:** P1

---

### P1-05: `aria-required="true"` is redundant and creates maintenance surface

**File:** `hx-textarea.ts`, line 363

```html
aria-required=${this.required ? 'true' : nothing}
```

The native `<textarea required>` already maps to `aria-required="true"` in the accessibility tree. Explicitly setting `aria-required` is redundant per HTML-AAM spec. More critically, if the native `required` attribute and the explicit `aria-required` ever get out of sync (e.g., a future refactor touches one but not the other), assistive technology will report contradictory information.

**Severity:** P1

---

### P1-06: Double invocation of `setFormValue` in `_handleInput`

**File:** `hx-textarea.ts`, lines 243–265

**Description:**
`_handleInput` calls `this._internals.setFormValue(this.value)` directly (line 247), then sets `this.value = target.value` (line 245) which triggers a Lit update, which calls `setFormValue` again in `updated()` (line 180). The form value is set twice per keystroke: once synchronously in the handler, and once asynchronously in the update cycle. This is harmless but violates DRY and could mask bugs in future refactors.

**Severity:** P1

---

## P2 — Medium (Address Before Next Major Release)

### P2-01: Random ID generation (`Math.random()`) is not SSR-safe

**File:** `hx-textarea.ts`, line 300

```ts
private _textareaId = `hx-textarea-${Math.random().toString(36).slice(2, 9)}`;
```

IDs generated via `Math.random()` differ between server render and client hydration. If this component is ever used in SSR contexts (Next.js, Astro, Drupal with server-side prerendering), the `for`/`id` association on label and textarea will break. The `aria-describedby` references will also mismatch. Use a stable, deterministic ID strategy (e.g., `crypto.randomUUID()` with SSR guard, or a sequential counter exported from a shared module).

**Severity:** P2

---

### ~~P2-02: Missing `readonly` property~~ FIXED

**File:** `hx-textarea.ts`

**Resolution:** Added `readonly` boolean property with `reflect: true` (attribute: `readonly`). The native `<textarea>` receives `?readonly=${this.readonly}` via Lit's boolean attribute binding. Common healthcare pattern for displaying non-editable patient data inline with editable fields.

**Severity:** P2

---

### P2-03: Auto-resize does not respond to programmatic `value` changes

**File:** `hx-textarea.ts`, lines 249–252

Auto-grow logic only fires in `_handleInput` (user interaction). Setting `el.value = 'long text...'` programmatically does not trigger auto-resize. The textarea height stays at whatever inline style was last set by user interaction. This causes visual bugs when components are pre-populated with data.

**Severity:** P2

---

### P2-04: `color-mix()` CSS function requires modern browser baseline

**File:** `hx-textarea.styles.ts`, lines 63–68, 79–85

```css
box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
  color-mix(
    in srgb,
    var(--hx-input-focus-ring-color, ...) calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
    transparent
  );
```

`color-mix(in srgb, ...)` has Baseline 2023 status and is unsupported in Chrome < 111, Safari < 16.2, Firefox < 113. Healthcare enterprise environments often run managed, older browser versions. No `@supports` guard or fallback is provided. If unsupported, the focus ring shadow silently disappears — a WCAG 2.1 SC 1.4.11 (Non-text Contrast) violation.

**Severity:** P2

---

### P2-05: Missing `minlength` attribute support — FIXED

**File:** `hx-textarea.ts`

**Resolution:** Added `minlength` property with attribute reflection and `tooShort` constraint validation in `_updateValidity()`. The native `<textarea>` also receives the `minlength` attribute. Validation triggers on `value`, `required`, `minlength`, and `maxlength` changes.

**Severity:** P2

---

### P2-06: Redundant CSS specificity in resize variants

**File:** `hx-textarea.styles.ts`, lines 101, 118–119

```css
.field__textarea {
  resize: vertical; /* base default */
}

:host([resize='vertical']) .field__textarea {
  resize: vertical; /* redundant — same as base */
}
```

The `:host([resize='vertical'])` block is never needed since the base style already sets `resize: vertical`. This is harmless but adds dead CSS that could confuse maintainers about which rule applies.

**Severity:** P2

---

### P2-07: No `rows` range validation — FIXED

**File:** `hx-textarea.ts`

**Resolution:** Added rows range validation in `updated()` lifecycle. Invalid values (≤0, non-integers) are clamped to the nearest valid value (minimum 1, rounded to integer).

**Severity:** P2

---

## Positive Findings

The following areas are well-implemented and do not require changes:

- **Form association:** `static formAssociated = true`, `ElementInternals`, `formResetCallback`, `formStateRestoreCallback`, `checkValidity`, `reportValidity` are all correctly implemented.
- **TypeScript typing:** With the exception of the `!` non-null assertion (P1-01), all types are strict and `any`-free.
- **CSS custom properties:** All visual values use `--hx-*` tokens with fallbacks. No hardcoded colors.
- **CSS Parts:** All documented parts (`field`, `label`, `textarea-wrapper`, `textarea`, `counter`, `help-text`, `error`) are present and correctly named.
- **Test coverage:** 50+ test cases covering rendering, properties, events, form, validation, slots, CSS parts, auto-resize, character counter, and axe-core accessibility. Coverage is comprehensive.
- **Storybook stories:** Stories cover default, error, help-text, disabled, required, auto-resize, character counter, and Drupal slot patterns.
- **Event naming and shape:** `hx-input` and `hx-change` events are correctly prefixed, bubble, are composed, and include `detail.value`.
- **Label association:** `<label for>` correctly references the textarea's ID. Slot-based labels correctly set `aria-labelledby`.
- **CEM annotations:** JSDoc `@slot`, `@fires`, `@csspart`, `@cssprop` annotations are accurate and complete.
- **Drupal integration:** Slots for `label`, `error`, and `help-text` are designed for Twig-rendered content injection (though P0-02 breaks `help-text` slot in practice).

---

## Test Gaps

The following test scenarios are missing and should be added alongside fixes:

| Gap  | Scenario                                                                   | Priority |
| ---- | -------------------------------------------------------------------------- | -------- |
| T-01 | Error slot sets `aria-describedby` to slotted error element's ID           | P0       |
| T-02 | Help-text slot renders without `helpText` property set                     | P0       |
| T-03 | Changing `required` from `false` to `true` updates `validity.valueMissing` | P1       |
| T-04 | Changing `maxlength` to a value below current value triggers `tooLong`     | P1       |
| T-05 | Counter is present in `aria-describedby` when `showCount` is set           | P1       |
| T-06 | Programmatic `value` change triggers auto-resize when `resize="auto"`      | P2       |
| T-07 | `readonly` attribute disables user editing                                 | P2       |
| T-08 | `setFormValue` is called exactly once per input event (no double-call)     | P1       |

---

## Storybook Gaps

| Gap  | Description                                                            | Priority |
| ---- | ---------------------------------------------------------------------- | -------- |
| S-01 | No story demonstrating error via `error` slot (only via property)      | P1       |
| S-02 | No story demonstrating `help-text` slot without `help-text` property   | P0       |
| S-03 | No story showing character counter with `aria-describedby` association | P1       |
| S-04 | No `readonly` story (feature doesn't exist yet — see P2-02)            | P2       |

---

## Bundle Size Assessment

**Status: PASS (estimated)**
The component imports Lit core, 3 Lit directives, and the token styles. No third-party dependencies beyond the monorepo. Estimated gzipped size is well under the 5KB per-component budget.

---

## Drupal Compatibility Assessment

**Status: CONDITIONAL PASS**

- Form association works correctly via `ElementInternals` — Drupal Form API `name`/`id` patterns are supported.
- The `error` slot and `label` slot are Drupal-integration-ready.
- **P0-02 breaks Drupal `help-text` slot rendering** — Drupal Form API renders help text as markup injected into `slot="help-text"`, but this only renders if the `help-text` property is also set. This is a blocking issue for Drupal integration.

---

_This document is a finding report only. No code changes were made. All P0 and P1 items must be resolved before this component is eligible for merge to `main`._
