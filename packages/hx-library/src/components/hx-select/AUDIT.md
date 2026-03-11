# AUDIT: hx-select — Deep Quality Review

**Reviewer:** Automated Audit Agent
**Date:** 2026-03-11
**Component:** `hx-select` (packages/hx-library/src/components/hx-select/)
**Audit Type:** Deep audit — full test coverage, accessibility, stories, docs, CEM, tokens, TypeScript

---

## Executive Summary

`hx-select` is a fully custom combobox listbox layered over a hidden native `<select>` for form participation. The component implements a dual-layer architecture: a custom `div[role="combobox"]` trigger with a custom listbox panel for consistent cross-browser styling, and a hidden native `<select>` for standards-compliant form association via `ElementInternals`.

All 20 findings from the T1-08 antagonistic quality review (2 P0, 7 P1, 11 P2) have been resolved. The component passes all 7 quality gates.

---

## Quality Gate Results

| Gate | Check             | Status | Details                                                                               |
| ---- | ----------------- | ------ | ------------------------------------------------------------------------------------- |
| 1    | TypeScript strict | PASS   | Zero errors, zero `any` types                                                         |
| 2    | Test suite        | PASS   | 75 tests passing (Vitest browser mode)                                                |
| 3    | Accessibility     | PASS   | WCAG 2.1 AA — axe-core clean in all states (default, error, disabled, open)           |
| 4    | Storybook         | PASS   | 32 stories covering all variants, states, interactions, and healthcare use cases      |
| 5    | CEM accuracy      | PASS   | All public properties, events, CSS parts, CSS custom properties, and slots documented |
| 6    | Bundle size       | PASS   | Within per-component budget                                                           |
| 7    | Code review       | PASS   | All findings remediated                                                               |

---

## Resolved Findings

### P0 — Critical (2/2 Resolved)

| ID    | Finding                                                                 | Resolution                                                                                                                                                             |
| ----- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-01 | `_syncClonedOptions()` dropped `<optgroup>` children from native select | Replaced with single-pass `_handleSlotChange()` that walks both `<option>` and `<optgroup>` children, cloning each into the native select with `data-cloned` attribute |
| P0-02 | Error div used `role="alert"` AND `aria-live="polite"` simultaneously   | Removed `aria-live="polite"` — error div now uses `role="alert"` alone (implies assertive, correct for errors)                                                         |

### P1 — High Severity (7/7 Resolved)

| ID    | Finding                                            | Resolution                                                                                                            |
| ----- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| P1-01 | `role="combobox"` on native `<button>` element     | Changed trigger from `<button>` to `<div tabindex="0" role="combobox">` per APG select-only pattern                   |
| P1-02 | No typeahead keyboard support                      | Added typeahead in the `default` case of `_handleKeydown` — single printable character jumps to first matching option |
| P1-03 | `outline: none` with no guaranteed fallback        | Added `:focus` fallback style (lines 77-81) in addition to `:focus-visible` enhancement                               |
| P1-04 | Tab key not handled — dropdown stays open          | Added `Tab` case to `_handleKeydown` — closes dropdown and allows natural focus movement                              |
| P1-05 | Escape does not explicitly refocus trigger         | Added `this._trigger?.focus()` call in the Escape handler                                                             |
| P1-06 | Tests validate aria-label on wrong element         | Updated test to validate `aria-label` on `[role="combobox"]` trigger (the interactive element)                        |
| P1-07 | No `--hx-select-placeholder-color` component token | Added `--hx-select-placeholder-color` token with `var(--hx-color-neutral-400)` semantic fallback                      |

### P2 — Medium Severity (11/11 Resolved)

| ID    | Finding                                               | Resolution                                                                           |
| ----- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| P2-01 | `formStateRestoreCallback` incomplete signature       | Updated to accept `string \| File \| FormData` with `_mode` parameter and type guard |
| P2-02 | Multi-select limitation not documented                | Added `@remarks` JSDoc note and documentation in Astro docs                          |
| P2-03 | Event tests exercise native select, not combobox path | Added test that dispatches `hx-change` via combobox option click                     |
| P2-04 | `_instanceId` dead alias of `_selectId`               | Removed dead code — single `_selectId` used throughout                               |
| P2-05 | No story for open/interactive listbox state           | Added `OpenInteractive` story                                                        |
| P2-06 | `color-mix()` without fallback                        | Added `@supports` guard wrapping `color-mix()` usage with solid-color fallback       |
| P2-07 | Listbox clipped by overflow ancestors                 | Documented as known limitation in JSDoc `@remarks` and CSS custom property docs      |
| P2-08 | Redundant double-traversal of slot on slotchange      | Merged into single-pass `_handleSlotChange()` that reads and clones in one loop      |
| P2-09 | No tests for trigger, listbox, option CSS parts       | Added 3 tests: trigger part, listbox part, option part (with open dropdown)          |
| P2-10 | No axe-core test with dropdown open                   | Added axe-core test with `open` attribute set                                        |
| P2-11 | Size property accepts invalid values silently         | Added `console.warn()` in `updated()` for invalid size values                        |

---

## Coverage Summary

### Test Coverage (75 tests)

| Category                 | Count |
| ------------------------ | ----- |
| Rendering                | 5     |
| Property: label          | 3     |
| Property: placeholder    | 2     |
| Property: value          | 2     |
| Property: size           | 3     |
| Property: error          | 4     |
| Property: helpText       | 2     |
| Property: required       | 2     |
| Property: disabled       | 2     |
| Property: name           | 1     |
| Property: ariaLabel      | 2     |
| Events                   | 4     |
| Slots                    | 2     |
| CSS Parts                | 7     |
| Form                     | 5     |
| Validation               | 6     |
| Accessibility            | 4     |
| Methods                  | 1     |
| Dropdown Interaction     | 4     |
| Keyboard Navigation      | 7     |
| aria-activedescendant    | 3     |
| Accessibility (axe-core) | 4     |

### Storybook Coverage (32 stories)

Default, Small, Medium, Large, WithPlaceholder, WithValue, Required, WithHelpText, WithError, Disabled, AllSizes, AllStates, InAForm, MultipleSelects, WithOtherFields, InACard, ManyOptions, LongOptionText, WithOptgroups, SingleOption, EmptySelect, CSSCustomProperties, CSSParts, SelectOption, EventVerification, FormDataParticipation, KeyboardNavigation, DepartmentSelector, BloodTypeSelector, InsuranceProvider, PriorityLevel, OpenInteractive.

### Design Token Compliance (13 component tokens)

All colors, spacing, typography, and timing values use the three-tier cascade:
`component token → semantic token → primitive fallback`

No hardcoded values in the component or styles.

### Documentation

- Astro Starlight docs: Complete (overview, live demos, installation, usage, properties, events, CSS custom properties, CSS parts, slots, accessibility table, Drupal integration, standalone HTML example, API reference)
- JSDoc: Complete (all `@cssprop`, `@csspart`, `@slot`, `@fires`, `@remarks` tags)
- CEM: Accurate — matches public API

---

## Verdict

**PASS — Ready to merge.** All 20 findings from the antagonistic review have been resolved. The component passes all 7 quality gates with 75 tests, 32 stories, 4 axe-core scenarios, full design token compliance, and complete documentation.
