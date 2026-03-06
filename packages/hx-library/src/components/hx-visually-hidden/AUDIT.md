# AUDIT: hx-visually-hidden — T4-02 Antagonistic Quality Review

**Date:** 2026-03-06
**Reviewer:** Antagonistic Quality Review Agent
**Scope:** All files in `packages/hx-library/src/components/hx-visually-hidden/`

---

## Executive Summary

The base visually-hidden behavior is correctly implemented — content is hidden using the standard CSS technique (not `display:none` or `visibility:hidden`), shadow DOM renders correctly, and axe-core passes. However, the component is **missing its most critical feature**: the `focusable` prop required for skip-link patterns. This is a P0 defect. Additionally, the CSS uses the deprecated `clip` property without the modern `clip-path` alternative, and no tests cover the focusable/skip-link use case at all.

---

## Findings

### 1. TypeScript

**[P0] Missing `focusable` property**
- File: `hx-visually-hidden.ts`
- The feature specification explicitly requires a `focusable` prop typed for skip links. The component has zero `@property` declarations. The entire skip-link use case — a primary accessibility pattern for this component — is unimplemented.
- Expected: `@property({ type: Boolean, reflect: true }) focusable = false;`
- Impact: Any consumer relying on `<hx-visually-hidden focusable>` for skip links gets no behavior. This silently fails with no warning.

**[P2] `property` decorator not imported**
- File: `hx-visually-hidden.ts`, line 2
- Only `customElement` is imported from `lit/decorators.js`. When `focusable` is added, `property` will need to be imported too. Not a defect now, but a prerequisite gap for the P0 fix.

---

### 2. Accessibility

**[P0] Focusable skip-link variant never becomes visible on focus**
- Files: `hx-visually-hidden.ts`, `hx-visually-hidden.styles.ts`
- A skip link must be _visually_ revealed when it receives keyboard focus. Without the `focusable` prop and a corresponding `:host([focusable]:focus-within)` CSS rule that removes the visually-hidden constraints, keyboard users cannot see skip links when tabbing into them. This breaks WCAG 2.4.1 (Bypass Blocks) for any skip-link implementation using this component.
- All styles are applied with `!important` on `:host`, making it impossible for consumers to override the clipping on focus without `::part(base)` gymnastics.
- Required CSS pattern (currently absent):
  ```css
  :host([focusable]:focus-within) {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: revert !important;
    margin: revert !important;
    overflow: visible !important;
    clip: auto !important;
    clip-path: none !important;
    white-space: normal !important;
  }
  ```

**[P1] No validation that content is not hidden via `visibility` or `display`**
- File: `hx-visually-hidden.test.ts`
- The tests confirm `position: absolute` and `1px` dimensions, but never assert that `display` is not `none` and `visibility` is not `hidden`. These are the two techniques that WOULD break screen reader access, and they are not explicitly guarded against. A future CSS change could introduce `visibility: hidden` and the tests would not catch it.

**[P2] No testing of skip-link interaction in a real navigation context**
- File: `hx-visually-hidden.test.ts`
- axe-core is run in two contexts (standalone, inside a button). Missing: inside a `<nav>`, inside a `<main>`, and as a skip link `<a href="#main-content">`. These are the real-world contexts where misuse of the component is most likely.

---

### 3. CSS

**[P1] Uses deprecated `clip` property without modern `clip-path` alternative**
- File: `hx-visually-hidden.styles.ts`, line 11
- `clip: rect(0, 0, 0, 0)` is deprecated in favor of `clip-path: inset(50%)`. The deprecated property is still broadly supported today, but the industry-standard visually-hidden pattern (used by Bootstrap 5, Tailwind `sr-only`, GitHub Primer) now pairs both for maximum compatibility:
  ```css
  clip: rect(0, 0, 0, 0) !important;       /* legacy */
  clip-path: inset(50%) !important;          /* modern */
  ```
- The omission of `clip-path` means the component diverges from best-practice patterns without justification, and `clip` will be removed from future browser specs.

**[P0] No `:host([focusable])` or `:host([focusable]:focus-within)` rules**
- File: `hx-visually-hidden.styles.ts`
- There is no CSS rule for the focusable variant. As noted above, this means the skip-link use case is completely non-functional. A focusable skip link rendered with this component will remain invisible even when focused, directly violating WCAG 2.4.1.

**[P2] Focus outline may be clipped on nested focusable children**
- File: `hx-visually-hidden.styles.ts`, line 10
- `overflow: hidden !important` on `:host` will clip the focus outline of any focusable child slotted into the component (e.g., `<a>` inside the slot). This is a known pitfall of the visually-hidden technique. The component currently has no mechanism to prevent this.

---

### 4. Tests

**[P0] Zero tests for `focusable` prop or skip-link focus behavior**
- File: `hx-visually-hidden.test.ts`
- The entire focusable variant is untested. Required tests that are absent:
  - Component accepts and reflects `focusable` boolean attribute
  - When `focusable` is false (default), styles remain as visually-hidden
  - When `focusable` is true and element receives focus, visually-hidden styles are removed
  - Focus outline is not clipped when `focusable` is true
  - Keyboard navigation reaches the component when `focusable` is true

**[P1] No test verifying `display` and `visibility` are NOT the hiding mechanism**
- File: `hx-visually-hidden.test.ts`
- As noted in the Accessibility section: tests should assert `styles.display !== 'none'` and `styles.visibility !== 'hidden'` to guard the accessibility contract.

**[P1] Low contextual coverage — no nesting tests**
- File: `hx-visually-hidden.test.ts`
- The feature description explicitly requires "nested in various contexts." Only two contexts are tested (standalone, inside `<button>`). Missing: table cell, list item, form field label, heading, nav landmark.

**[P2] Coverage is likely below 80% if `focusable` branch is absent**
- When `focusable` is implemented, branch coverage for the conditional rendering/styles path will need tests. Currently 7 tests for a component with zero logical branches — but adding the `focusable` prop will introduce untested code paths.

---

### 5. Storybook

**[P1] Missing focusable / skip-link story**
- File: `hx-visually-hidden.stories.ts`
- The feature description requires a "focusable skip link demo." No such story exists. The `ScreenReaderAnnouncement` story (#3) is a breadcrumb pattern — not a skip link. A proper skip-link story should show:
  ```html
  <a href="#main-content">
    <hx-visually-hidden focusable>Skip to main content</hx-visually-hidden>
  </a>
  ```
  with a `play` function that tabs to it and asserts the element is visible.

**[P2] No Storybook controls — `focusable` prop not reflected in autodocs**
- File: `hx-visually-hidden.stories.ts`
- Since `focusable` does not exist on the component, CEM-driven autodocs will show no controls. When `focusable` is implemented it must be reflected in CEM and surfaced as a control in the Default story's `args`.

---

### 6. Performance

**[P2] Bundle size: acceptable**
- The component is near-zero JS (~200 bytes component class + Lit base overhead). Passes the <5KB gate.
- No dynamic imports, no observers, no event listeners registered — the simplest possible Lit component.
- No issues identified. This gate passes.

---

### 7. Drupal

**[P2] No Twig usage example or documentation**
- Files: all
- The component is technically Twig-renderable (all web components are, as custom HTML elements). However, there is no documentation anywhere in the component's files showing a Twig usage example. For a healthcare system where Drupal is the primary consumer, this is a gap. The doc comment in `hx-visually-hidden.ts` shows an HTML example but no Twig equivalent.
- Expected in `@example` JSDoc or a separate docs file:
  ```twig
  {# Skip link pattern #}
  <a href="#main-content">
    <hx-visually-hidden focusable>Skip to main content</hx-visually-hidden>
  </a>
  ```

---

## Severity Summary

| ID  | Severity | Area         | Finding                                                             |
| --- | -------- | ------------ | ------------------------------------------------------------------- |
| F-01 | **P0**  | TypeScript   | Missing `focusable` boolean property entirely                       |
| F-02 | **P0**  | Accessibility| Focusable skip-link variant never becomes visible on focus          |
| F-03 | **P0**  | CSS          | No `:host([focusable]:focus-within)` override rules                 |
| F-04 | **P0**  | Tests        | Zero tests for `focusable` prop or skip-link focus behavior         |
| F-05 | **P1**  | CSS          | Deprecated `clip` without modern `clip-path: inset(50%)`            |
| F-06 | **P1**  | Accessibility| No test guarding against `display:none` / `visibility:hidden`       |
| F-07 | **P1**  | Tests        | No nesting context tests (nav, list, form, table)                   |
| F-08 | **P1**  | Storybook    | Missing focusable / skip-link story                                 |
| F-09 | **P2**  | TypeScript   | `property` decorator not imported (needed for P0 fix)               |
| F-10 | **P2**  | CSS          | `overflow: hidden` may clip focus outline on slotted focusable children |
| F-11 | **P2**  | Tests        | Coverage at risk once `focusable` branch is added                   |
| F-12 | **P2**  | Storybook    | No `focusable` control in autodocs                                  |
| F-13 | **P2**  | Drupal       | No Twig usage example in documentation                              |

**P0 count: 4** — Component is NOT shippable in current state.

---

## Do Not Fix

Per task instructions, this document is findings only. No changes have been made to implementation files.
