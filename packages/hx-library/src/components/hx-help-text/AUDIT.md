# AUDIT: hx-help-text (T4-05) — Antagonistic Quality Review

Reviewer: Antagonistic audit agent
Date: 2026-03-06
Branch: feature/audit-hx-help-text-t4-05-antagonistic

---

## Summary Table

| Area           | Status  | Issues         |
| -------------- | ------- | -------------- |
| TypeScript     | PASS    | 1 P2           |
| Accessibility  | FAIL    | 3 P0, 2 P1     |
| Tests          | PARTIAL | 2 P1           |
| Storybook      | PARTIAL | 1 P1, 2 P2     |
| CSS            | PARTIAL | 1 P1, 2 P2     |
| Performance    | UNKNOWN | 1 P1           |
| Drupal         | FAIL    | 1 P1           |

**Ship status: BLOCKED** — 3 P0 issues require resolution before merge.

---

## P0 — Critical (blocks ship)

### P0-01: Error variant uses color as the only visual indicator (WCAG 1.4.1 violation)

**File:** `hx-help-text.ts`, `hx-help-text.styles.ts`

The `error` variant changes text color to red (`--hx-color-error-600, #dc2626`) with zero additional visual differentiation. No icon, no pattern, no border, no prefix character — color is the sole signal.

WCAG 2.1 Success Criterion 1.4.1 "Use of Color" (Level A): "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element."

This is a healthcare application with a WCAG 2.1 AA mandate. An error-state help text that cannot be distinguished from success-state help text by a user with red-green color blindness (deuteranopia/protanopia — 8% of males) is a Level A failure — the lowest, most incontrovertible threshold.

The component JSDoc comment in `hx-help-text.ts` (line 9) states it is "Used by hx-field as a consistent sub-component for guidance and validation messages." Validation messages that fail at WCAG Level A are not fit for production in any context, let alone healthcare.

**Required fix:** Add a visual icon indicator (or at minimum a text prefix like "Error:", "Warning:", "Success:") so that state is not conveyed by color alone.

---

### P0-02: Warning variant uses color as the only visual indicator (WCAG 1.4.1 violation)

**File:** `hx-help-text.styles.ts`, lines 29-31

Identical class of defect as P0-01. The `warning` variant uses amber (`--hx-color-warning-700, #b45309`) as its sole discriminator. Users who cannot distinguish amber from green, or amber from neutral gray, receive no accessible state signal.

---

### P0-03: Success variant uses color as the only visual indicator (WCAG 1.4.1 violation)

**File:** `hx-help-text.styles.ts`, lines 34-38

Identical class of defect as P0-01/P0-02. The `success` variant uses green (`--hx-color-success-700, #15803d`) as its sole discriminator. Red-green color blindness makes the `error` and `success` states visually indistinguishable without a non-color indicator.

Note: axe-core does NOT automatically detect WCAG 1.4.1 "Use of Color" violations — axe-core has no way to determine programmatically that a developer is relying on color alone for semantic meaning when the text content of all variants is arbitrary. The passing axe-core test suite (`hx-help-text.test.ts` lines 120-141) provides false assurance here.

---

## P1 — High (must fix before merge)

### P1-01: No live region for dynamic error announcement

**File:** `hx-help-text.ts`

When a form field's `variant` changes from `default` to `error` at runtime (e.g., after form submission validation), the `<span part="base">` has no `aria-live` attribute or `role="alert"`. Screen readers will not announce the error text to users who are mid-interaction. This violates WCAG 4.1.3 "Status Messages" (Level AA) — status messages must be programmatically determinable without receiving focus.

The `aria-describedby` pattern used by the parent input is a static association. When the help text *content* changes, the AT may announce it (browsers vary). But when the *variant* changes (e.g., `default` → `error`) without content change, there is no announcement at all.

Expected behavior: the `error` variant should render with `role="alert"` or use `aria-live="polite"` (or `"assertive"` for errors) to ensure dynamic validation messages are surfaced to screen reader users.

**References:** WCAG 2.1 SC 4.1.3; ARIA Authoring Practices Guide — "Alert" pattern.

---

### P1-02: Missing `icon` and `text` CSS parts

**File:** `hx-help-text.ts`, `hx-help-text.styles.ts`

The audit specification explicitly requires "CSS parts (text, icon)." The component exposes only `part="base"` on the root span. There is no `part="icon"` and no `part="text"`.

This means:
1. The fix for P0-01/02/03 (adding icons for non-color state indication) has nowhere to attach for consumer customization.
2. Consumers using CSS `::part()` selectors cannot independently target the text content vs. the icon.

This is both a missing feature and a blocker for the P0 fix — the two defects are coupled.

---

### P1-03: axe-core tests do not verify the aria-describedby relationship in context

**File:** `hx-help-text.test.ts`, lines 120-141

The accessibility tests run axe-core on the `hx-help-text` element in isolation — a standalone `<hx-help-text>` with no associated input. The `aria-describedby` association (the primary accessibility pattern for this component) is never tested by axe-core in an integrated context.

The ID association tests at lines 97-105 only verify that the `id` and `aria-describedby` attributes *exist* on their respective elements — not that axe-core reports zero violations when they are combined in context.

Required: An axe-core test with a full `<input aria-describedby="..."><hx-help-text id="...">` structure in a single fixture.

---

### P1-04: No test coverage for error announcement (dynamic variant change)

**File:** `hx-help-text.test.ts`

The test at line 77 tests that switching `el.variant = 'error'` updates the CSS class. There is no test that verifies:
- The error state is announced to AT (e.g., `role="alert"` is present when variant is `error`)
- The `aria-live` attribute is set appropriately
- A screen reader simulation (e.g., via `aria-live` observation) would surface the change

This gap is directly called out in the feature description: "error announcement" is a named test requirement. The test suite does not cover it.

---

### P1-05: tokenStyles import — no bundle size verification performed

**File:** `hx-help-text.ts`, line 4

```ts
import { tokenStyles } from '@helix/tokens/lit';
```

`tokenStyles` is applied to `static override styles = [tokenStyles, helixHelpTextStyles]`. If `tokenStyles` includes the full set of design token CSS custom properties (which is common in token-first libraries), this could push the per-component bundle beyond the 5KB min+gz threshold set in the quality gates.

No bundle size measurement is included in the test suite or documented in the component. The quality gate requires `<5KB per component`. This has not been verified.

---

### P1-06: No Drupal Twig template or integration documentation

**Files:** none present

The audit specification requires "Drupal — Twig-renderable as form element helper." No Twig template (`hx-help-text.html.twig`) exists. No Drupal behavior file exists. There is no documentation in JSDoc or a companion `.md` file describing how to integrate this component into a Drupal form element (e.g., as a `#description` replacement or via a preprocess hook).

The component is structurally simple enough to work in Twig (declarative, no required JS interaction), but the integration path is entirely undocumented. For a library whose "primary consumer is Drupal CMS," this is a missing deliverable.

---

## P2 — Medium (technical debt, fix in follow-up)

### P2-01: `label` argType in Storybook is non-standard for slotted content

**File:** `hx-help-text.stories.ts`, lines 25-32

The Storybook meta defines a `label` arg that is not a real component property — it is a fabricated control that gets injected into the default slot via the `render` function. While this works, it creates a confusing autodocs experience: the `label` prop appears in the controls panel as if it is a component property, but it is not part of the component's public API (not in the CEM, not on the class).

Standard practice for slotted content in Storybook web-components stories is to use a `slot` argType with an appropriate `control` pointing at the actual slot. This discrepancy means consumers reading autodocs may believe `label` is a valid HTML attribute, which it is not.

---

### P2-02: Warning and Success stories lack play functions

**File:** `hx-help-text.stories.ts`, lines 73-85

The `Default` and `Error` stories include `play` functions with assertions. The `Warning` and `Success` stories (lines 73-85) do not. This inconsistency leaves the Warning and Success variants untested in the Storybook interaction test suite.

---

### P2-03: FormFieldIntegration story uses hardcoded hex colors for input styling

**File:** `hx-help-text.stories.ts`, lines 92-143

The `FormFieldIntegration` story uses inline hardcoded hex values:
- `border: 1px solid #dc2626` (line 121) — should reference `--hx-color-error-600`
- `border: 1px solid #15803d` (line 135) — should reference `--hx-color-success-700`
- `border: 1px solid #d1d5db` (line 104) — should reference a neutral border token

This teaches consumers the wrong pattern. Storybook serves as living documentation. A story that demonstrates form field integration should demonstrate the token-based approach, not raw hex values.

---

### P2-04: No typed `for` / `controlId` property for programmatic id-association

**File:** `hx-help-text.ts`

The component has no mechanism to automatically correlate with a form control. Consumers must manually ensure that `<input aria-describedby="X">` and `<hx-help-text id="X">` share the same ID string, with zero type safety or framework assistance.

Components like Shoelace's `sl-form-group` and standard HTML `<label for="">` provide a typed `for` attribute. Adding a `for` property that reflects the expected associated control ID would enable framework integrations, form libraries, and Drupal preprocessors to reliably generate IDs without string-matching bugs.

This is lower severity because the underlying HTML pattern works — this is a DX issue, not a correctness issue.

---

## Non-issues (marked "pass" by this audit)

- TypeScript strict compliance: no `any`, no `@ts-ignore`, no non-null assertions in component source.
- Variant union type `'default' | 'error' | 'warning' | 'success'` is correctly declared and reflected.
- `--hx-*` token naming convention is followed throughout.
- Token-with-fallback cascade pattern in CSS is correct.
- Shadow DOM encapsulation is properly established.
- `WcHelpText` type re-export is clean.
- `HTMLElementTagNameMap` augmentation is present.
- `classMap` directive usage is idiomatic Lit.
- `index.ts` re-export is correct.
- CEM `@tag`, `@slot`, `@csspart`, `@cssprop` JSDoc annotations are present (though `icon` part is missing — see P1-02).
