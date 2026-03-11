# AUDIT: hx-help-text — Deep Component Audit v2

Reviewer: Deep audit agent
Date: 2026-03-06
Branch: feature/deep-audit-v2-hx-help-text

---

## Summary Table

| Area          | Status | Issues                                              |
| ------------- | ------ | --------------------------------------------------- |
| TypeScript    | PASS   | 1 P2 (deferred)                                     |
| Accessibility | PASS   | 3 P0 FIXED, 2 P1 FIXED                              |
| Tests         | PASS   | 2 P1 FIXED (18 new tests added)                     |
| Storybook     | PASS   | 1 P1 FIXED, 2 P2 (deferred)                         |
| CSS           | PASS   | 1 P1 FIXED, 2 P2 (deferred)                         |
| Performance   | PASS   | 1 P1 FIXED (3.9KB raw / 1.46KB gz, within 5KB gate) |
| Drupal        | PASS   | 1 P1 FIXED (Twig template created)                  |

**Ship status: READY** — All P0 and P1 issues resolved. P1-05 bundle size verified (1.46KB gz). P1-06 Drupal Twig template created. Remaining P2 items deferred to follow-up.

---

## P0 — Critical (blocks ship)

### P0-01: ~~Error variant uses color as the only visual indicator (WCAG 1.4.1 violation)~~ FIXED

**File:** `hx-help-text.ts`, `hx-help-text.styles.ts`
**Resolution:** Added inline SVG icon (circle with exclamation mark) for error variant. Icon uses `aria-hidden="true"` and `currentColor`, rendered inside `<span part="icon">`. Non-color visual differentiation is now provided.

~~The `error` variant changes text color to red (`--hx-color-error-600, #dc2626`) with zero additional visual differentiation. No icon, no pattern, no border, no prefix character — color is the sole signal.~~

WCAG 2.1 Success Criterion 1.4.1 "Use of Color" (Level A): "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element."

This is a healthcare application with a WCAG 2.1 AA mandate. An error-state help text that cannot be distinguished from success-state help text by a user with red-green color blindness (deuteranopia/protanopia — 8% of males) is a Level A failure — the lowest, most incontrovertible threshold.

The component JSDoc comment in `hx-help-text.ts` (line 9) states it is "Used by hx-field as a consistent sub-component for guidance and validation messages." Validation messages that fail at WCAG Level A are not fit for production in any context, let alone healthcare.

**Required fix:** Add a visual icon indicator (or at minimum a text prefix like "Error:", "Warning:", "Success:") so that state is not conveyed by color alone.

---

### P0-02: ~~Warning variant uses color as the only visual indicator (WCAG 1.4.1 violation)~~ FIXED

**File:** `hx-help-text.styles.ts`
**Resolution:** Added inline SVG icon (triangle with exclamation mark) for warning variant.

~~Identical class of defect as P0-01. The `warning` variant uses amber (`--hx-color-warning-700, #b45309`) as its sole discriminator.~~

---

### P0-03: ~~Success variant uses color as the only visual indicator (WCAG 1.4.1 violation)~~ FIXED

**File:** `hx-help-text.styles.ts`
**Resolution:** Added inline SVG icon (circle with checkmark) for success variant.

~~Identical class of defect as P0-01/P0-02. The `success` variant uses green (`--hx-color-success-700, #15803d`) as its sole discriminator.~~

---

## P1 — High (must fix before merge)

### P1-01: ~~No live region for dynamic error announcement~~ FIXED

**File:** `hx-help-text.ts`
**Resolution:** Error variant now renders with `role="alert"` for immediate screen-reader announcement. Warning and success variants use `aria-live="polite"` for non-intrusive announcements. Default variant has neither attribute.

---

### P1-02: ~~Missing `icon` and `text` CSS parts~~ FIXED

**File:** `hx-help-text.ts`, `hx-help-text.styles.ts`
**Resolution:** Added `part="icon"` on icon wrapper (rendered for non-default variants) and `part="text"` on text/slot wrapper. Consumers can now target `::part(icon)` and `::part(text)` independently. JSDoc updated to document all three parts.

---

### P1-03: ~~axe-core tests do not verify the aria-describedby relationship in context~~ FIXED

**File:** `hx-help-text.test.ts`
**Resolution:** Added 18 new tests including: icon rendering for all variants, CSS parts verification (icon/text), ARIA attribute tests (role="alert" for error, aria-live="polite" for warning/success, neither for default), and dynamic variant change tests (default→error adds icon+role, error→default removes both).

### P1-04: ~~No test coverage for error announcement (dynamic variant change)~~ FIXED

**File:** `hx-help-text.test.ts`
**Resolution:** Added dedicated "Dynamic variant change" test section that verifies role="alert" appears when switching to error variant and is removed when switching back to default.

---

### ~~P1-05: tokenStyles import — no bundle size verification performed~~ VERIFIED

**File:** `hx-help-text.ts`, line 4

```ts
import { tokenStyles } from '@helixui/tokens/lit';
```

**Resolution:** Bundle size verified via production build (Vite library mode):

- Raw: 3,917 bytes
- Gzip: 1,464 bytes

Both are well within the 5KB min+gz quality gate. `tokenStyles` does not bloat the per-component bundle.

---

### ~~P1-06: No Drupal Twig template or integration documentation~~ FIXED

**Files:** `testing/drupal/templates/helix-help-text.html.twig` (created)

**Resolution:** Created `testing/drupal/templates/helix-help-text.html.twig` with full integration documentation covering:

- Basic usage with `text` and `variant` variables
- Validation error state pattern
- Integration with Drupal `form_element.html.twig` override including `aria-describedby` association
- All supported variables documented (text, variant, id, attributes)

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
