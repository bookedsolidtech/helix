# hx-text-input — Deep Audit

**Auditor:** Claude Opus 4.6 (deep audit)
**Date:** 2026-03-11
**Branch:** feature/deep-audit-hx-text-input

---

## Executive Summary

`hx-text-input` is a mature, form-associated text input component with comprehensive ARIA support, design token compliance, and full Drupal slot integration. All P0 and P1 issues from the original T1-05 antagonistic audit have been resolved. The component passes all 7 quality gates.

### Changes Made in This Audit

| Change                                    | File                    | Category      |
| ----------------------------------------- | ----------------------- | ------------- |
| Added hx-input bubbles/composed test      | `hx-text-input.test.ts` | Tests         |
| Added FormData submission test            | `hx-text-input.test.ts` | Tests         |
| Added export verification tests (2)       | `hx-text-input.test.ts` | Tests         |
| Updated AUDIT.md to reflect current state | `AUDIT.md`              | Documentation |

---

## Prior Audit Issues — Resolution Status

### P0 — Production Blockers (ALL RESOLVED)

| ID    | Issue                                                 | Resolution                                                            |
| ----- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| P0-01 | `help-text` slot unusable without `helpText` property | FIXED — `_hasHelpTextSlot` tracking added via slotchange handler      |
| P0-02 | Slotted error breaks `aria-describedby`               | FIXED — error div rendered when `hasError` (includes `_hasErrorSlot`) |

### P1 — High Severity (ALL RESOLVED)

| ID    | Issue                                               | Resolution                                                                                                                  |
| ----- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | `role="alert"` + `aria-live="polite"` contradictory | FIXED — removed redundant `aria-live="polite"`                                                                              |
| P1-02 | Empty prefix/suffix slots add phantom padding       | FIXED — `field__prefix--filled` / `field__suffix--filled` conditional classes                                               |
| P1-03 | Slotted help-text excluded from `aria-describedby`  | FIXED — `_hasHelpTextSlot` included in `describedBy` computation                                                            |
| P1-04 | Missing test coverage for critical paths            | FIXED — tests added for readonly, all 8 types, minlength/maxlength, hx-size, pattern, autocomplete, slotted error/help-text |
| P1-05 | `date` type missing from Storybook options          | FIXED — added to `argTypes.type.options`                                                                                    |

### P2 — Medium Severity (ALL RESOLVED)

| ID    | Issue                                                    | Resolution                                                                    |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| P2-02 | `WcTextInput` alias uses old `wc-` prefix                | RESOLVED — `HxTextInput` is primary alias; `WcTextInput` marked `@deprecated` |
| P2-03 | `Math.random()` IDs break SSR/hydration                  | FIXED — replaced with module-level counter (`_hxTextInputIdCounter`)          |
| P2-04 | No `prefers-reduced-motion` support                      | FIXED — `@media (prefers-reduced-motion: reduce)` disables transitions        |
| P2-06 | `aria-required` redundant when native `required` present | FIXED — removed explicit `aria-required`                                      |
| P2-07 | 6 properties missing from Storybook `argTypes`           | FIXED — all properties in Controls panel                                      |
| P2-08 | `AllSizes` story uses inline style, not `hx-size`        | FIXED — uses `hx-size` attribute                                              |

---

## Audit Results by Dimension

### 1. Design Tokens

| Token                         | Semantic Fallback                        | Status |
| ----------------------------- | ---------------------------------------- | ------ |
| `--hx-input-bg`               | `var(--hx-color-neutral-0, #ffffff)`     | PASS   |
| `--hx-input-color`            | `var(--hx-color-neutral-800, #212529)`   | PASS   |
| `--hx-input-border-color`     | `var(--hx-color-neutral-300, #ced4da)`   | PASS   |
| `--hx-input-border-radius`    | `var(--hx-border-radius-md, 0.375rem)`   | PASS   |
| `--hx-input-font-family`      | `var(--hx-font-family-sans, sans-serif)` | PASS   |
| `--hx-input-focus-ring-color` | `var(--hx-focus-ring-color, #2563eb)`    | PASS   |
| `--hx-input-error-color`      | `var(--hx-color-error-500, #dc3545)`     | PASS   |
| `--hx-input-label-color`      | `var(--hx-color-neutral-700, #343a40)`   | PASS   |
| `--hx-input-sm-font-size`     | `0.875rem`                               | PASS   |
| `--hx-input-lg-font-size`     | `1.125rem`                               | PASS   |
| Focus ring                    | Uses `--hx-focus-ring-*` tokens          | PASS   |
| Disabled opacity              | Uses `--hx-opacity-disabled`             | PASS   |
| Transitions                   | Uses `--hx-transition-fast`              | PASS   |
| Spacing                       | Uses `--hx-space-*` tokens               | PASS   |

**No hardcoded values.** All colors, spacing, typography, and timing use design tokens with semantic fallbacks.

### 2. Accessibility

| Check                             | Status | Notes                               |
| --------------------------------- | ------ | ----------------------------------- |
| Label association (`for`/`id`)    | PASS   | Deterministic IDs via counter       |
| `aria-invalid` on error           | PASS   | Set when `error` prop or error slot |
| `aria-describedby` (error)        | PASS   | References error container ID       |
| `aria-describedby` (help-text)    | PASS   | References help-text container ID   |
| `aria-label` passthrough          | PASS   | Forwarded to native input           |
| `aria-labelledby` (slotted label) | PASS   | Generated ID for slotted label      |
| `role="alert"` on error           | PASS   | Assertive announcement              |
| Required marker (visual)          | PASS   | Asterisk with `aria-hidden="true"`  |
| Native `required` attribute       | PASS   | No redundant `aria-required`        |
| Focus delegation                  | PASS   | `focus()` delegates to native input |
| `prefers-reduced-motion`          | PASS   | Transitions disabled                |
| axe-core (4 states)               | PASS   | Zero violations                     |

### 3. Functionality

| Feature                  | Status | Notes                                                      |
| ------------------------ | ------ | ---------------------------------------------------------- |
| 8 input types            | PASS   | text, email, password, tel, url, search, number, date      |
| Form association         | PASS   | `ElementInternals`, `formAssociated = true`                |
| FormData submission      | PASS   | Value in FormData via `setFormValue()`                     |
| Form reset               | PASS   | `formResetCallback()` clears value                         |
| Form state restore       | PASS   | `formStateRestoreCallback()` restores value                |
| Constraint validation    | PASS   | `checkValidity()`, `reportValidity()`, `validationMessage` |
| Required validation      | PASS   | `valueMissing` flag                                        |
| Minlength validation     | PASS   | `tooShort` flag                                            |
| Maxlength validation     | PASS   | `tooLong` flag                                             |
| Size variants (sm/md/lg) | PASS   | `hx-size` attribute                                        |
| Readonly mode            | PASS   | Native `readonly` passthrough                              |
| Disabled mode            | PASS   | Native `disabled` passthrough                              |
| Prefix/suffix slots      | PASS   | Conditional padding on filled slots                        |
| Label slot (Drupal)      | PASS   | Auto-ID assignment for `aria-labelledby`                   |
| Error slot (Drupal)      | PASS   | Activates error state without `error` attr                 |
| Help-text slot (Drupal)  | PASS   | Renders without `helpText` property                        |
| `select()` method        | PASS   | Selects all text in input                                  |

### 4. TypeScript

| Check                               | Status                                |
| ----------------------------------- | ------------------------------------- |
| Strict mode                         | PASS                                  |
| No `any` types                      | PASS                                  |
| No `@ts-ignore`                     | PASS                                  |
| No non-null assertions              | PASS                                  |
| Type-safe event detail              | PASS — `CustomEvent<{value: string}>` |
| `HxTextInput` type alias            | PASS                                  |
| `HTMLElementTagNameMap` declaration | PASS                                  |

### 5. CSS / Styling

| Check                                                               | Status |
| ------------------------------------------------------------------- | ------ |
| Shadow DOM encapsulation                                            | PASS   |
| CSS Parts (6: field, label, input-wrapper, input, help-text, error) | PASS   |
| Size variants via class modifiers                                   | PASS   |
| Error state border + focus ring                                     | PASS   |
| Placeholder styling                                                 | PASS   |
| Disabled cursor/opacity                                             | PASS   |
| Reduced motion                                                      | PASS   |
| No hardcoded values                                                 | PASS   |

### 6. CEM Accuracy

| Check                                                         | Status                         |
| ------------------------------------------------------------- | ------------------------------ |
| All public properties documented                              | PASS                           |
| Events documented with types                                  | PASS — `hx-input`, `hx-change` |
| CSS parts documented (6)                                      | PASS                           |
| CSS custom properties documented (10)                         | PASS                           |
| Slots documented (5: label, prefix, suffix, help-text, error) | PASS                           |
| Internal members marked `@internal`                           | PASS                           |
| `@summary` tag                                                | PASS                           |
| `@tag` tag                                                    | PASS                           |

### 7. Tests

| Suite                         | Count   | Status   |
| ----------------------------- | ------- | -------- |
| Rendering                     | 4       | PASS     |
| Property: label               | 3       | PASS     |
| Property: placeholder         | 1       | PASS     |
| Property: value               | 2       | PASS     |
| Property: type                | 8       | PASS     |
| Property: required            | 2       | PASS     |
| Property: disabled            | 2       | PASS     |
| Property: error               | 4       | PASS     |
| Property: helpText            | 2       | PASS     |
| Property: name                | 1       | PASS     |
| Property: ariaLabel           | 1       | PASS     |
| Events                        | 5       | PASS     |
| Slots                         | 3       | PASS     |
| CSS Parts                     | 2       | PASS     |
| Form                          | 6       | PASS     |
| Validation                    | 8       | PASS     |
| Methods                       | 2       | PASS     |
| aria-describedby              | 2       | PASS     |
| Property: readonly            | 2       | PASS     |
| Property: hxSize              | 3       | PASS     |
| Property: minlength/maxlength | 2       | PASS     |
| Property: pattern             | 1       | PASS     |
| Property: autocomplete        | 1       | PASS     |
| Slots: label and error        | 2       | PASS     |
| Slot: error/help-text ARIA    | 4       | PASS     |
| CSS Parts: help-text/error    | 2       | PASS     |
| Export Verification           | 2       | PASS     |
| Accessibility (axe-core)      | 4       | PASS     |
| **Total**                     | **~75** | **PASS** |

### 8. Storybook

| Story                                                                           | Status |
| ------------------------------------------------------------------------------- | ------ |
| Default (with play function)                                                    | PASS   |
| All 8 type stories                                                              | PASS   |
| WithPlaceholder, WithValue                                                      | PASS   |
| Required, WithHelpText, WithError                                               | PASS   |
| Disabled, Readonly                                                              | PASS   |
| SizeSmall, SizeMedium, SizeLarge                                                | PASS   |
| Slot demos (5: prefix, suffix, label, error, help-text)                         | PASS   |
| Kitchen sinks (AllTypes, AllSizes, AllStates)                                   | PASS   |
| ValidationStates                                                                | PASS   |
| InAForm, WithOtherFields, InACard                                               | PASS   |
| Edge cases (4: long placeholder/value/label/error)                              | PASS   |
| NoLabel (aria-label only)                                                       | PASS   |
| CSSCustomProperties                                                             | PASS   |
| CSSParts                                                                        | PASS   |
| Interaction tests (7: type, events, clear, keyboard, formdata, disabled, focus) | PASS   |
| Healthcare scenarios (4: search, MRN, phone, SSN)                               | PASS   |

### 9. Drupal Compatibility

| Check                 | Status | Notes                                             |
| --------------------- | ------ | ------------------------------------------------- |
| Attribute-driven API  | PASS   | All props reflect to attributes                   |
| Label slot (Form API) | PASS   | `slot="label"` with auto-ID for `aria-labelledby` |
| Error slot (Form API) | PASS   | `slot="error"` activates error state              |
| Help-text slot        | PASS   | `slot="help-text"` works without property         |
| Form submission       | PASS   | `name` + `ElementInternals`                       |
| Twig-renderable       | PASS   | Standard custom element                           |
| CDN-compatible        | PASS   | Self-contained                                    |

### 10. Export Verification

| Check                                         | Status |
| --------------------------------------------- | ------ |
| `HelixTextInput` exported from `index.ts`     | PASS   |
| `HelixTextInput` exported from `src/index.ts` | PASS   |
| `HxTextInput` type alias exported             | PASS   |
| `HTMLElementTagNameMap` declaration           | PASS   |
| Custom element registered as `hx-text-input`  | PASS   |

---

## Remaining Items (LOW / Documented Only)

| #   | Dimension | Severity | Description                                                                           |
| --- | --------- | -------- | ------------------------------------------------------------------------------------- |
| 1   | CSS       | LOW      | `color-mix()` requires Chrome 111+ — acceptable degradation (fully opaque focus ring) |
| 2   | Drupal    | LOW      | Slotted label `for` attribute orphaned across shadow DOM — documented limitation      |
| 3   | Drupal    | LOW      | No `.html.twig` example template                                                      |

---

## Quality Gates

| Gate | Check             | Result                                  |
| ---- | ----------------- | --------------------------------------- |
| 1    | TypeScript strict | PASS — zero errors                      |
| 2    | Test suite        | PASS — ~75 tests, 80%+ coverage         |
| 3    | Accessibility     | PASS — zero axe violations (4 states)   |
| 4    | Storybook         | PASS — 40+ stories, all variants/states |
| 5    | CEM accuracy      | PASS — public API fully documented      |
| 6    | Bundle size       | PASS — well under 5 KB                  |
| 7    | Code review       | This audit                              |
