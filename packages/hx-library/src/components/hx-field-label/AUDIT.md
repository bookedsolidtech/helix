# AUDIT: hx-field-label — T4-06 Antagonistic Quality Review

**Reviewer:** Automated antagonistic audit
**Date:** 2026-03-06
**Branch:** feature/audit-hx-field-label-t4-06-antagonistic
**Scope:** `packages/hx-library/src/components/hx-field-label/`

---

## Severity Legend

| Level  | Definition                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------- |
| **P0** | Fundamental breakage — component does not deliver its stated purpose; ships broken behavior to consumers               |
| **P1** | Material defect — WCAG violation, broken test reliability, undocumented public API, or misleading documentation        |
| **P2** | Quality gap — convention violation, fragile test, or suboptimal pattern that does not yet cause a user-visible failure |

---

## Findings

---

### [P0-01] Cross-shadow-DOM label-input association is fundamentally broken

**File:** `hx-field-label.ts` (line 73), `hx-field-label.stories.ts` (lines 104-124, 229-261)

**Description:**
The component's headline feature — `<label for="...">` inside shadow DOM associating with an input in light DOM — does not work. The HTML spec and all browser implementations scope `for`/`id` lookup to the same shadow root. A `<label for="patient-email">` rendered inside a shadow root cannot find `<input id="patient-email">` in the host document. This means:

1. Clicking the label does NOT programmatically focus the associated input.
2. Screen readers do NOT establish a programmatic label–input relationship.
3. The accessibility benefit of using a native `<label>` element over a `<span>` is entirely negated for the cross-boundary case.

The component's own test file acknowledges this silently in a comment (line 239-242 of `hx-field-label.test.ts`): _"Shadow DOM ID scope prevents cross-boundary label association; this test verifies the component's own shadow tree is axe-clean."_ This is an acknowledgment of the breakage, not a justification for shipping it.

The JSDoc at line 11 states "renders a native `<label for="...">` element for direct label association with a same-document form control" — this claim is false when the form control is outside the shadow root, which is the only realistic consumer deployment scenario.

**Impact:** Every consumer who uses `<hx-field-label for="...">` believing it creates an accessible label association is shipping inaccessible forms. axe-core will not catch this because axe sees the label element but cannot verify cross-shadow-root `for` resolution.

**Evidence:** Shadow DOM spec §4.2.6 (ID references): "The `for` attribute's value must be the ID of a labelable element in the same tree." A shadow root is a separate tree.

**Required fix:** Either (a) implement `ElementInternals`-based label association with `setFormValue`/`ariaLabel`, (b) expose the label via `id` on the host element for `aria-labelledby` use instead of advertising the `for` pattern, or (c) update all documentation to explicitly state the `for` attribute only works when the input is inside the SAME shadow root, and provide the `aria-labelledby` pattern as the canonical external-input association method.

---

### [P0-02] Storybook stories demonstrate broken behavior as working examples

**File:** `hx-field-label.stories.ts` (lines 102-124, 229-261)

**Description:**
`WithFor` story (lines 102-124) and `HealthcareFormLabels` story (lines 226-261) both render `<hx-field-label for="<id>">` paired with `<input id="<id>">` in light DOM, presenting this as a working association. The play test in `WithFor` (line 120) asserts `label.getAttribute('for') === 'patient-email'` which passes — but this only proves the attribute is set, NOT that the association is functional. A consumer reading the Storybook documentation will believe these stories demonstrate correct usage. They do not. They demonstrate inaccessible usage that appears correct.

**Required fix:** Stories demonstrating `for` + input pairing must either (a) use inputs inside the same shadow root, or (b) be replaced with the `aria-labelledby` pattern. Existing story play tests must assert functionality, not just attribute presence.

---

### [P1-01] Required indicator conveys no information to AT — WCAG 1.3.1 violation

**File:** `hx-field-label.ts` (lines 60-64)

**Description:**
The required asterisk is rendered with `aria-hidden="true"`:

```html
<span part="required-indicator" class="required-indicator" aria-hidden="true">
  <slot name="required-indicator">*</slot>
</span>
```

Hiding the visual `*` from AT is a common pattern, but it is only accessible when another mechanism communicates required status. `hx-field-label` is a standalone label component — it has no connection to the associated input control and cannot guarantee the input has `required` set. When the input lacks `required`:

- The visual `*` tells sighted users the field is required.
- AT users get no information — the asterisk is hidden and no visually-hidden text supplements it.

Per **WCAG 1.3.1 (Info and Relationships, Level A):** information conveyed through visual presentation (the asterisk indicating required status) must be available in a form perceivable by AT. Hiding the asterisk without a text equivalent fails this criterion.

**Required fix:** Wrap the `*` in a visually-hidden `<span>` containing "required" text, or append visually-hidden text alongside the `aria-hidden` indicator:

```html
<span part="required-indicator" class="required-indicator">
  <span aria-hidden="true"><slot name="required-indicator">*</slot></span>
  <span class="visually-hidden">required</span>
</span>
```

Note: `hx-visually-hidden` or a `.visually-hidden` CSS utility must be used — not `display: none` or `visibility: hidden`.

---

### [P1-02] Storybook play tests use incorrect ARIA role query for `<label>` element

**File:** `hx-field-label.stories.ts` (lines 93, 120)

**Description:**
Both `Default` and `WithFor` stories use `shadow.getByRole('generic', { hidden: true })` to select the base element. The `generic` role matches `<div>` and `<span>` elements. A `<label>` element does NOT have ARIA role `generic` — it has no corresponding ARIA widget role in the ARIA in HTML spec. Testing Library's `getByRole` with `'generic'` may return the wrong element or behave inconsistently across Testing Library versions.

For `WithFor`, this means the play test is NOT actually asserting that a `<label>` was rendered — it may be selecting a different `generic` element in the shadow tree, or failing silently. The assertion `label.tagName.toLowerCase() === 'label'` after querying by `generic` role is contradictory — if the query selects by `generic` role, it won't select a `<label>`.

**Required fix:** Replace `getByRole('generic', { hidden: true })` with a direct DOM query: `host.shadowRoot.querySelector('[part="base"]')`, or use a role that actually matches the expected element (e.g., no standardized ARIA role maps to `<label>` — direct querySelector is correct here).

---

### [P1-03] Required indicator color uses undocumented `--hx-color-danger` token

**File:** `hx-field-label.styles.ts` (line 20)

**Description:**

```css
.required-indicator {
  color: var(--hx-color-danger, var(--hx-color-error-500, #ef4444));
}
```

The component consumes `--hx-color-danger` but this token is not documented in the component's `@cssprop` JSDoc block (lines 27-31 of `hx-field-label.ts`). The `@cssprop` block documents only `--hx-field-label-color`. Consumers have no way to know they can override the required indicator color via `--hx-color-danger` at the component level, nor whether this token is part of the semantic token system.

Additionally, the `CSSCustomProperties` story (lines 287-302) demonstrates overriding `--hx-color-danger` directly, implying it is a public API — but it is not documented as such in the JSDoc.

**Required fix:** Add `@cssprop [--hx-color-danger=...] - Required indicator color` to the JSDoc, or replace `--hx-color-danger` with a component-level token `--hx-field-label-required-color` that falls through to the semantic token.

---

### [P2-01] CSSParts and CSSCustomProperties stories use hardcoded hex colors

**File:** `hx-field-label.stories.ts` (lines 199-208, 286-302)

**Description:**
`CSSParts` story uses hardcoded hex values `#0d6efd`, `#dc3545`, `#6c757d` directly in `<style>` tags. `CSSCustomProperties` story uses `#2563eb` and `#d97706` in inline styles. Project convention (CLAUDE.md): "Never hardcode colors, spacing, or typography values. Always use tokens." While these are demo/story files, they set a bad example for consumers reading the Storybook documentation who may copy this pattern.

**Required fix:** Replace hardcoded hex values with `--hx-*` semantic tokens or CSS variables in all story demos.

---

### [P2-02] Slot play test queries light DOM content, not shadow-rendered slot output

**File:** `hx-field-label.test.ts` (lines 137-143)

**Description:**
The `required-indicator slot overrides default asterisk` test:

```ts
const slotted = el.querySelector('[slot="required-indicator"]');
expect(slotted?.textContent).toBe('(req)');
```

This queries the light DOM (`el.querySelector`) to verify the slotted element exists, but does not verify it is actually rendered into the shadow DOM slot. The test passes even if the slot was removed from the component template. A proper test would query the shadow root and verify the slotted content appears through the shadow slot rendering.

**Required fix:** Add a shadow DOM assertion that the `required-indicator` slot is connected and its assigned nodes include the expected content, using `shadowRoot.querySelector('slot[name="required-indicator"]').assignedNodes()`.

---

### [P2-03] `for` property is a reserved JavaScript keyword

**File:** `hx-field-label.ts` (line 43)

**Description:**
`@property({ type: String }) for = ''` uses `for` as a class property name. While this is legal as an object property (class fields are object properties, not variable declarations), it is unconventional and may cause confusion for TypeScript tooling or linting in strict mode. Some environments and editors flag this. It maps correctly to the `for` HTML attribute for `<label>` which is the intended behavior, so this is low-risk but worth noting.

**Required fix (optional):** Consider `htmlFor` as the property name (per React's convention) with `attribute: 'for'` in the `@property` decorator to disambiguate: `@property({ type: String, attribute: 'for' }) htmlFor = ''`. This also makes the API more idiomatic for TypeScript/JS consumers using the component programmatically.

---

## Summary Table

| ID    | Severity | Area                         | Description                                                             |
| ----- | -------- | ---------------------------- | ----------------------------------------------------------------------- |
| P0-01 | **P0**   | Accessibility / Architecture | Cross-shadow-DOM `for` association is fundamentally broken              |
| P0-02 | **P0**   | Storybook / Documentation    | Stories demonstrate broken association as working                       |
| P1-01 | **P1**   | Accessibility (WCAG 1.3.1)   | Required `*` hidden from AT with no visually-hidden text supplement     |
| P1-02 | **P1**   | Storybook / Tests            | `getByRole('generic')` does not select `<label>` elements correctly     |
| P1-03 | **P1**   | CSS / Documentation          | `--hx-color-danger` consumed but not documented as `@cssprop`           |
| P2-01 | **P2**   | Storybook / Conventions      | Hardcoded hex colors in story demos violate token convention            |
| P2-02 | **P2**   | Tests                        | Slot test queries light DOM only; does not verify shadow slot rendering |
| P2-03 | **P2**   | TypeScript                   | `for` as property name is a reserved keyword (low risk)                 |

---

## Area-by-Area Assessment

### 1. TypeScript

**Pass with minor concern.** No `any` types. All three props correctly typed and reflected. `declare global` block present. The only flag is P2-03 (`for` as property name).

### 2. Accessibility

**Fail — P0 and P1 findings.**

- P0-01: Shadow DOM boundary breaks `for`/`id` label association — the component cannot deliver its stated primary purpose.
- P1-01: Required asterisk hidden from AT without visually-hidden supplement violates WCAG 1.3.1 Level A.
  The axe-core tests pass because axe cannot verify cross-shadow-root `for` resolution and does not flag the missing visually-hidden text in this context.

### 3. Tests

**Partial pass.** 26 tests across 7 describe blocks. Coverage is structurally good. Failures: P2-02 (slot test fragility) and the acknowledged but untreated cross-shadow-DOM gap.

### 4. Storybook

**Fail — P0 and P1 findings.**

- P0-02: Multiple stories demonstrate broken `for`+input association as canonical usage.
- P1-02: Play tests use `getByRole('generic')` which does not correctly target `<label>` elements.
  8 stories cover the main variants including healthcare scenarios, CSS parts, and CSS custom properties. Story breadth is good; accuracy is not.

### 5. CSS

**Pass with P1 and P2 concerns.**
All design values use `--hx-*` token cascade with hardcoded fallbacks. Three CSS parts are implemented and exported. P1-03: `--hx-color-danger` is consumed but not documented. P2-01: Story demos use hardcoded hex values.

### 6. Performance

**Pass.** Component implementation is minimal — simple Lit template with no heavy imports beyond `lit`, `lit/decorators`, and token styles. Well under 5KB budget.

### 7. Drupal

**Fail — consequence of P0-01.**
Drupal form inputs live in light DOM. `<hx-field-label for="field-name">` rendered in a Twig template will produce a shadow-DOM `<label for="...">` that cannot reach the Drupal input. The Drupal consumer must use `aria-labelledby` instead. No Twig example or Drupal-specific documentation is provided. Without clear guidance, Drupal integrators will use `for` and ship inaccessible forms.
